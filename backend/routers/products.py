import json
import os
import uuid
import aiofiles
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from database import get_db
import models
import schemas
from auth import get_current_user, get_current_user_optional

router = APIRouter(prefix="/api/products", tags=["products"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def parse_product_out(product: models.Product, current_user_id: Optional[int] = None) -> dict:
    images_list = []
    if product.images:
        try:
            images_list = json.loads(product.images)
        except Exception:
            images_list = [product.images] if product.images else []

    is_fav = False
    if current_user_id and product.favorites:
        is_fav = any(f.user_id == current_user_id for f in product.favorites)

    return {
        "id": product.id,
        "title": product.title,
        "description": product.description,
        "price": product.price,
        "category": product.category,
        "condition": product.condition,
        "location": product.location,
        "images": images_list,
        "status": product.status,
        "views_count": product.views_count,
        "created_at": product.created_at,
        "seller_id": product.seller_id,
        "seller": product.seller,
        "is_favorite": is_fav
    }


@router.get("", response_model=schemas.ProductListResponse)
def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    status_filter: Optional[str] = "active",
    seller_id: Optional[int] = None,
    verified_only: Optional[bool] = False,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    query = db.query(models.Product)

    if status_filter and status_filter != "all":
        query = query.filter(models.Product.status == status_filter)

    if category and category != "Все":
        query = query.filter(models.Product.category == category)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                models.Product.title.ilike(search_fmt),
                models.Product.description.ilike(search_fmt),
                models.Product.location.ilike(search_fmt)
            )
        )

    if min_price is not None:
        query = query.filter(models.Product.price >= min_price)

    if max_price is not None:
        query = query.filter(models.Product.price <= max_price)

    if seller_id:
        query = query.filter(models.Product.seller_id == seller_id)

    if verified_only:
        query = query.join(models.User, models.Product.seller_id == models.User.id).filter(models.User.is_verified == True)

    total = query.count()
    products = (
        query.order_by(desc(models.Product.created_at))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    user_id = current_user.id if current_user else None
    items = [parse_product_out(p, user_id) for p in products]

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    valid_extensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in valid_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недопустимый формат файла. Разрешены JPG, PNG, WEBP, GIF"
        )
    
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    async with aiofiles.open(file_path, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

    return {"url": f"/static/uploads/{unique_filename}"}


@router.post("", response_model=schemas.ProductOut)
def create_product(
    product_in: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    images_json = json.dumps(product_in.images or [])
    
    new_product = models.Product(
        title=product_in.title,
        description=product_in.description,
        price=product_in.price,
        category=product_in.category,
        condition=product_in.condition or "Отличное",
        location=product_in.location or "Главный кампус",
        images=images_json,
        status="active",
        seller_id=current_user.id
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return parse_product_out(new_product, current_user.id)


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Объявление не найдено")

    # Increment view count
    product.views_count = (product.views_count or 0) + 1
    db.commit()
    db.refresh(product)

    user_id = current_user.id if current_user else None
    return parse_product_out(product, user_id)


@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    product_update: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    
    if product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Вы можете редактировать только свои объявления")

    update_data = product_update.model_dump(exclude_unset=True)
    if "images" in update_data and update_data["images"] is not None:
        update_data["images"] = json.dumps(update_data["images"])

    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return parse_product_out(product, current_user.id)


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    
    if product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Вы можете удалять только свои объявления")

    db.delete(product)
    db.commit()
    return {"message": "Объявление успешно удалено"}
