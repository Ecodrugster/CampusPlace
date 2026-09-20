from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    university: Optional[str] = "Казахский Национальный Университет"
    faculty: Optional[str] = ""
    dormitory: Optional[str] = ""
    phone: Optional[str] = ""
    telegram: Optional[str] = ""
    avatar_url: Optional[str] = ""

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    university: Optional[str] = "Казахский Национальный Университет"
    faculty: Optional[str] = ""
    dormitory: Optional[str] = ""
    phone: Optional[str] = ""
    telegram: Optional[str] = ""

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    university: Optional[str] = None
    faculty: Optional[str] = None
    dormitory: Optional[str] = None
    phone: Optional[str] = None
    telegram: Optional[str] = None
    avatar_url: Optional[str] = None

class UserOut(UserBase):
    id: int
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Auth Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# Product Schemas
class ProductBase(BaseModel):
    title: str
    description: str
    price: float
    category: str
    condition: Optional[str] = "Отличное"
    location: Optional[str] = "Главный кампус"

class ProductCreate(ProductBase):
    images: Optional[List[str]] = []

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    condition: Optional[str] = None
    location: Optional[str] = None
    images: Optional[List[str]] = None
    status: Optional[str] = None

class ProductOut(ProductBase):
    id: int
    images: List[str]
    status: str
    views_count: int
    created_at: datetime
    seller_id: int
    seller: UserOut
    is_favorite: Optional[bool] = False

    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    items: List[ProductOut]
    total: int
    page: int
    limit: int
