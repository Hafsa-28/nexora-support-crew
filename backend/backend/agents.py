from sqlalchemy.orm import Session

from models import Product, Approval, ActivityLog

SENSITIVE = {
    "refund": ["refund", "money back", "return my money"],
    "discount": ["discount", "% off", "offer", "coupon", "cheaper", "bargain"],
    "complaint": ["complaint", "damaged", "torn", "wrong item", "defective", "broken", "not happy", "bad quality"],
}


def log(db: Session, agent: str, action: str):
    db.add(ActivityLog(agent=agent, action=action))
    db.commit()


def find_product(db: Session, text: str):
    for p in db.query(Product).all():
        name = p.name.lower()
        if name in text or name.split()[-1] in text:
            return p
    return None


def support_agent(db: Session, customer_name: str, message: str):
    """Returns (reply, escalated). Sensitive requests go to the owner for approval."""
    text = message.lower()

    # 1. Sensitive requests: never decided by the agent, always sent to the owner
    for kind, words in SENSITIVE.items():
        if any(w in text for w in words):
            drafts = {
                "refund": f"Sorry about that, {customer_name}! We will refund the amount to your original payment method within 5 days.",
                "discount": f"Thanks for asking, {customer_name}! We can offer a discount on your order.",
                "complaint": f"We're sorry for the trouble, {customer_name}. We will fix this for you right away.",
            }
            db.add(Approval(
                customer=customer_name,
                message=message,
                draft=drafts[kind],
                reason=f"{kind.capitalize()} request",
                type=kind,
            ))
            db.commit()
            log(db, "Support Agent", f"Sent a {kind} request from {customer_name} to the owner")
            return ("I've sent your request to the store owner for approval. You'll hear back shortly.", True)

    # 2. Product questions
    product = find_product(db, text)
    if product:
        if product.stock == 0:
            reply = f"Sorry, the {product.name} is out of stock right now."
        elif product.stock <= product.low_stock_limit:
            reply = f"Yes! The {product.name} is in stock for ₹{product.price:.0f}. Only {product.stock} left, so hurry!"
        else:
            reply = f"Yes! The {product.name} is in stock for ₹{product.price:.0f}."
        log(db, "Support Agent", f"Answered a stock question from {customer_name} about {product.name}")
        return (reply, False)

    # 3. Catalog
    if any(w in text for w in ["what do you have", "available", "catalog", "products", "collection"]):
        items = db.query(Product).filter(Product.stock > 0).all()
        names = ", ".join(f"{p.name} (₹{p.price:.0f})" for p in items)
        log(db, "Support Agent", f"Shared the product list with {customer_name}")
        return (f"Here is what's in stock: {names}.", False)

    # 4. Policies
    if "return" in text or "policy" in text or "exchange" in text:
        log(db, "Support Agent", f"Answered a return policy question from {customer_name}")
        return ("You can return any unused item within 7 days of delivery for an exchange or store credit.", False)

    # 5. Greetings and fallback
    if any(w in text.split() for w in ["hi", "hello", "hey"]):
        return (f"Hi {customer_name}! How can I help you today?", False)

    return ("I can help with product availability, prices and returns. What would you like to know?", False)


def inventory_agent(db: Session) -> int:
    """Creates a restock approval for every product at or below its low-stock limit.
    Returns how many new suggestions were created."""
    created = 0
    for p in db.query(Product).all():
        if p.stock > p.low_stock_limit:
            continue
        already = db.query(Approval).filter(
            Approval.type == "restock",
            Approval.product_id == p.id,
            Approval.status == "pending",
        ).first()
        if already:
            continue
        qty = max(p.low_stock_limit * 3 - p.stock, 10)
        reason = "Out of stock" if p.stock == 0 else "Below low-stock limit"
        db.add(Approval(
            customer="Inventory Agent",
            message=f"{p.name} is low on stock ({p.stock} left).",
            draft=f"Restock {qty} units of {p.name}.",
            reason=reason,
            type="restock",
            product_id=p.id,
            quantity=qty,
        ))
        db.commit()
        log(db, "Inventory Agent", f"Flagged {p.name} for restocking ({p.stock} left)")
        created += 1
    return created


def run_inventory_agent():
    """Runs the inventory agent with its own database session (used at startup)."""
    from database import SessionLocal
    db = SessionLocal()
    try:
        return inventory_agent(db)
    finally:
        db.close()