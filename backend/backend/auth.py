import os
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
import pyotp
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from database import SessionLocal, get_db
from models import User

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-change-me")
ACCESS_MINUTES = 15   # Layer 4: short-lived tokens
TEMP_MINUTES = 5
MAX_FAILED = 5        # Layer 2: lockout after 5 wrong passwords
LOCK_MINUTES = 15

limiter = Limiter(key_func=get_remote_address)   # Layer 1: rate limiting
router = APIRouter()
bearer = HTTPBearer()
revoked_tokens = set()  # Layer 5: in production, keep this in Redis or the database


class SignupIn(BaseModel):
    name: str
    email: str
    password: str


class LoginIn(BaseModel):
    email: str
    password: str


class TwoFAIn(BaseModel):
    temp_token: str
    code: str


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def check_password(p: str, hashed: str) -> bool:
    return bcrypt.checkpw(p.encode(), hashed.encode())


def make_token(user: User, scope: str = "access", minutes: int = ACCESS_MINUTES) -> str:
    payload = {
        "sub": str(user.id),
        "scope": scope,
        "jti": str(uuid.uuid4()),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=minutes),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def decode_token(token: str, scope: str) -> dict:
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if data.get("scope") != scope:
        raise HTTPException(status_code=401, detail="Wrong kind of token")
    if data["jti"] in revoked_tokens:
        raise HTTPException(status_code=401, detail="Token has been logged out")
    return data


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    data = decode_token(creds.credentials, "access")
    user = db.query(User).filter(User.id == int(data["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user  # the role comes from the database, never from the token


def require_owner(user: User = Depends(get_current_user)) -> User:
    if user.role != "owner":
        raise HTTPException(status_code=403, detail="Owner access only")
    return user


def seed_owner():
    email, password = os.getenv("OWNER_EMAIL"), os.getenv("OWNER_PASSWORD")
    if not email or not password:
        return
    db = SessionLocal()
    if not db.query(User).filter(User.email == email).first():
        db.add(User(name="Owner", email=email,
                    password_hash=hash_password(password), role="owner"))
        db.commit()
    db.close()


@router.post("/signup")
@limiter.limit("5/minute")
def signup(request: Request, body: SignupIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    # Public signup ALWAYS creates a customer. The role is never taken from the request.
    user = User(name=body.name, email=body.email,
                password_hash=hash_password(body.password), role="customer")
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": make_token(user), "role": user.role}


@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, body: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Wrong email or password")

    if user.locked_until and user.locked_until > utcnow():
        raise HTTPException(status_code=423, detail="Account locked. Try again in 15 minutes.")

    if not check_password(body.password, user.password_hash):
        user.failed_attempts = (user.failed_attempts or 0) + 1
        if user.failed_attempts >= MAX_FAILED:
            user.locked_until = utcnow() + timedelta(minutes=LOCK_MINUTES)
            user.failed_attempts = 0
            print(f"SECURITY ALERT: account {user.email} locked after {MAX_FAILED} failed logins")
        db.commit()
        raise HTTPException(status_code=401, detail="Wrong email or password")

    user.failed_attempts = 0
    user.locked_until = None
    db.commit()

    # Layer 3: with 2FA on, a correct password only gets a temporary token
    if user.totp_secret:
        return {"requires_2fa": True, "temp_token": make_token(user, "2fa", TEMP_MINUTES)}

    return {"token": make_token(user), "role": user.role}


@router.post("/login/2fa")
@limiter.limit("5/minute")
def login_2fa(request: Request, body: TwoFAIn, db: Session = Depends(get_db)):
    data = decode_token(body.temp_token, "2fa")
    user = db.query(User).filter(User.id == int(data["sub"])).first()
    if not user or not user.totp_secret:
        raise HTTPException(status_code=401, detail="Invalid request")
    if not pyotp.TOTP(user.totp_secret).verify(body.code, valid_window=1):
        raise HTTPException(status_code=401, detail="Wrong code")
    revoked_tokens.add(data["jti"])  # the temporary token works only once
    return {"token": make_token(user), "role": user.role}


@router.post("/2fa/setup")
def setup_2fa(user: User = Depends(require_owner), db: Session = Depends(get_db)):
    if user.totp_secret:
        raise HTTPException(status_code=400, detail="2FA is already enabled")
    secret = pyotp.random_base32()
    user.totp_secret = secret
    db.commit()
    uri = pyotp.TOTP(secret).provisioning_uri(name=user.email, issuer_name="Nexora")
    return {"setup_key": secret, "uri": uri}


@router.post("/logout")
def logout(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    data = decode_token(creds.credentials, "access")
    revoked_tokens.add(data["jti"])
    return {"message": "Logged out"}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"name": user.name, "email": user.email, "role": user.role}
