from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import require_owner
from database import SessionLocal, get_db
from models import Approval, ActivityLog, Product

router = APIRouter()


class ApprovalOut(BaseModel):
    id: int
    customer: str
    message: str
    draft: str
    reason: str
    type: str
    status: str
    product_id: Optional[int] = None
    quantity: Optional[int] = None
    created_at: datetime
    model_config = {"from_attributes": True}


class ActivityOut(BaseModel):
    id: int
    agent: str
    action: str
    created_at: datetime
    model_config = {"from_attributes": True}


def log_activity(db: Session, agent: str, action: str):
    db.add(ActivityLog(agent=agent, action=action))
    db.commit()


def seed_approvals():
    """Adds three sample approvals the first time, so the dashboard has something to show."""
    db = SessionLocal()
    if db.query(Approval).count() == 0:
        jacket = db.query(Product).filter(Product.name == "Denim Jacket").first()
        db.add_all([
            Approval(
                customer="Ananya",
                message="My jacket arrived torn. I want a refund.",
                draft="Sorry about that, Ananya! We will refund the full amount to your original payment method within 5 days.",
                reason="Refund request",
                type="refund",
            ),
            Approval(
                customer="Rahul",
                message="Can I get 20% off if I buy 3 shirts?",
                draft="Yes! Buy 3 Linen Shirts and get 20% off.",
                reason="Discount request",
                type="discount",
            ),
            Approval(
                customer="Inventory Agent",
                message="Denim Jacket is low on stock.",
                draft="Restock 20 units of Denim Jacket.",
                reason="Below low-stock limit",
                type="restock",
                product_id=jacket.id if jacket else None,
                quantity=20,
            ),
        ])
        db.commit()
    db.close()


@router.get("/approvals", response_model=list[ApprovalOut], dependencies=[Depends(require_owner)])
def list_approvals(db: Session = Depends(get_db)):
    return db.query(Approval).order_by(Approval.id.desc()).all()


@router.post("/approvals/{approval_id}/approve", response_model=ApprovalOut, dependencies=[Depends(require_owner)])
def approve(approval_id: int, db: Session = Depends(get_db)):
    item = db.query(Approval).filter(Approval.id == approval_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Approval not found")
    if item.status != "pending":
        raise HTTPException(status_code=400, detail=f"Already {item.status}")

    # A restock approval actually adds the stock
    if item.type == "restock" and item.product_id:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock += item.quantity or 0

    item.status = "approved"
    db.commit()
    db.refresh(item)
    log_activity(db, "Owner", f"Approved {item.type} request from {item.customer}")
    return item


@router.post("/approvals/{approval_id}/reject", response_model=ApprovalOut, dependencies=[Depends(require_owner)])
def reject(approval_id: int, db: Session = Depends(get_db)):
    item = db.query(Approval).filter(Approval.id == approval_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Approval not found")
    if item.status != "pending":
        raise HTTPException(status_code=400, detail=f"Already {item.status}")

    item.status = "rejected"
    db.commit()
    db.refresh(item)
    log_activity(db, "Owner", f"Rejected {item.type} request from {item.customer}")
    return item


@router.get("/activity", response_model=list[ActivityOut], dependencies=[Depends(require_owner)])
def list_activity(db: Session = Depends(get_db)):
    return db.query(ActivityLog).order_by(ActivityLog.id.desc()).all()