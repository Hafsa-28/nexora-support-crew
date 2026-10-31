from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import Session

from auth import require_owner
from database import Base, SessionLocal, get_db

router = APIRouter()


class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True)
    business_name = Column(String, default="My Store")
    business_type = Column(String, default="Clothing")
    faqs = Column(String, default="")
    approve_refunds = Column(Boolean, default=True)
    approve_discounts = Column(Boolean, default=True)


class SettingsIn(BaseModel):
    business_name: str
    business_type: str
    faqs: str = ""
    approve_refunds: bool = True
    approve_discounts: bool = True


class SettingsOut(SettingsIn):
    model_config = {"from_attributes": True}


def seed_settings():
    db = SessionLocal()
    if db.query(Setting).count() == 0:
        db.add(Setting(
            business_name="Nexora Demo Store",
            business_type="Clothing",
            faqs="Returns: unused items within 7 days.\nShipping: 3 to 5 working days.\nTimings: 10 AM to 8 PM.",
        ))
        db.commit()
    db.close()


@router.get("/settings", response_model=SettingsOut, dependencies=[Depends(require_owner)])
def get_settings(db: Session = Depends(get_db)):
    return db.query(Setting).first()


@router.put("/settings", response_model=SettingsOut, dependencies=[Depends(require_owner)])
def update_settings(body: SettingsIn, db: Session = Depends(get_db)):
    row = db.query(Setting).first()
    for key, value in body.model_dump().items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row