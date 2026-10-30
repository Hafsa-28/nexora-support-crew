from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import Base, engine, SessionLocal, get_db
from models import Product

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Nexora API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Schemas ----------
class ProductIn(BaseModel):
    name: str
    price: float
    stock: int = 0
    low_stock_limit: int = 5


class ProductOut(ProductIn):
    id: int
    model_config = {"from_attributes": True}


# ---------- Sample data (added only when the table is empty) ----------
def seed():
    db = SessionLocal()
    if db.query(Product).count() == 0:
        db.add_all([
            Product(name="Cotton Kurti", price=799, stock=24, low_stock_limit=10),
            Product(name="Denim Jacket", price=1999, stock=4, low_stock_limit=8),
            Product(name="Silk Scarf", price=499, stock=0, low_stock_limit=5),
            Product(name="Linen Shirt", price=1299, stock=15, low_stock_limit=6),
        ])
        db.commit()
    db.close()


seed()


# ---------- Routes ----------
@app.get("/")
def home():
    return {"message": "Nexora backend is running"}


@app.get("/inventory", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).all()


@app.post("/inventory", response_model=ProductOut)
def add_product(product: ProductIn, db: Session = Depends(get_db)):
    item = Product(**product.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.put("/inventory/{product_id}", response_model=ProductOut)
def update_product(product_id: int, product: ProductIn, db: Session = Depends(get_db)):
    item = db.query(Product).filter(Product.id == product_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in product.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@app.delete("/inventory/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    item = db.query(Product).filter(Product.id == product_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(item)
    db.commit()
    return {"deleted":product_id};
