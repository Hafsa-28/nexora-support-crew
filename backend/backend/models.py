from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from database import Base


def now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    low_stock_limit = Column(Integer, default=5)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="customer")  # "customer" or "owner"
    failed_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    totp_secret = Column(String, nullable=True)


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    customer = Column(String, nullable=False)
    message = Column(String, nullable=False)
    draft = Column(String, nullable=False)
    reason = Column(String, nullable=False)
    type = Column(String, default="other")  # refund, discount, restock, other
    status = Column(String, default="pending")  # pending, approved, rejected
    product_id = Column(Integer, nullable=True)
    quantity = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=now)


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    last_message = Column(String, default="")
    handled_by = Column(String, default="Agent")
    created_at = Column(DateTime, default=now)


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    sender = Column(String, nullable=False)  # customer, agent, owner
    text = Column(String, nullable=False)
    created_at = Column(DateTime, default=now)


class ActivityLog(Base):
    __tablename__ = "activity_log"

    id = Column(Integer, primary_key=True, index=True)
    agent = Column(String, nullable=False)
    action = Column(String, nullable=False)
    created_at = Column(DateTime, default=now)