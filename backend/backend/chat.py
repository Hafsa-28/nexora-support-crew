from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from agents import support_agent
from auth import require_owner, limiter
from database import get_db
from models import Conversation, Message, Approval, Product

router = APIRouter()


class ChatIn(BaseModel):
    customer_name: str = Field(default="Customer", max_length=50)
    message: str = Field(min_length=1, max_length=500)
    conversation_id: Optional[int] = None


class ChatOut(BaseModel):
    conversation_id: int
    reply: str
    escalated: bool


class ConversationOut(BaseModel):
    id: int
    customer_name: str
    last_message: str
    handled_by: str
    created_at: datetime
    model_config = {"from_attributes": True}


class MessageOut(BaseModel):
    id: int
    sender: str
    text: str
    created_at: datetime
    model_config = {"from_attributes": True}


# Public: customers don't need an account to chat
@router.post("/chat", response_model=ChatOut)
@limiter.limit("30/minute")
def chat(request: Request, body: ChatIn, db: Session = Depends(get_db)):
    convo = None
    if body.conversation_id:
        convo = db.query(Conversation).filter(Conversation.id == body.conversation_id).first()
    if not convo:
        convo = Conversation(customer_name=body.customer_name)
        db.add(convo)
        db.commit()
        db.refresh(convo)

    db.add(Message(conversation_id=convo.id, sender="customer", text=body.message))
    reply, escalated = support_agent(db, convo.customer_name, body.message)
    db.add(Message(conversation_id=convo.id, sender="agent", text=reply))

    convo.last_message = body.message
    convo.handled_by = "Waiting for owner" if escalated else "Agent"
    db.commit()

    return ChatOut(conversation_id=convo.id, reply=reply, escalated=escalated)


@router.get("/conversations", response_model=list[ConversationOut], dependencies=[Depends(require_owner)])
def list_conversations(db: Session = Depends(get_db)):
    return db.query(Conversation).order_by(Conversation.id.desc()).all()


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut], dependencies=[Depends(require_owner)])
def conversation_messages(conversation_id: int, db: Session = Depends(get_db)):
    if not db.query(Conversation).filter(Conversation.id == conversation_id).first():
        raise HTTPException(status_code=404, detail="Conversation not found")
    return db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.id).all()


@router.get("/overview", dependencies=[Depends(require_owner)])
def overview(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    return {
        "messages_handled_by_ai": db.query(Message).filter(Message.sender == "agent").count(),
        "pending_approvals": db.query(Approval).filter(Approval.status == "pending").count(),
        "low_stock_items": len([p for p in products if p.stock <= p.low_stock_limit]),
        "total_products": len(products),
        "conversations": db.query(Conversation).count(),
    }