from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_user
from routers.products import parse_product_out

router = APIRouter(prefix="/api/favorites", tags=["favorites"])

@router.get("", response_model=List[schemas.ProductOut])
def get_favorites(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    favs = db.query(models.Favorite).filter(models.Favorite.user_id == current_user.id).all()
    product_ids = [f.product_id for f in favs]
    products = db.query(models.Product).filter(models.Product.id.in_(product_ids)).all()
    
    return [parse_product_out(p, current_user.id) for p in products]


@router.post("/{product_id}")
def toggle_favorite(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")

    existing_fav = db.query(models.Favorite).filter(
        models.Favorite.user_id == current_user.id,
        models.Favorite.product_id == product_id
    ).first()

    if existing_fav:
        db.delete(existing_fav)
        db.commit()
        return {"is_favorite": False, "message": "Удалено из избранного"}
    else:
        new_fav = models.Favorite(user_id=current_user.id, product_id=product_id)
        db.add(new_fav)
        db.commit()
        return {"is_favorite": True, "message": "Добавлено в избранное"}
