import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    university = Column(String(255), default="Казахский Национальный Университет")
    faculty = Column(String(255), default="")
    dormitory = Column(String(255), default="")
    phone = Column(String(50), default="")
    telegram = Column(String(100), default="")
    avatar_url = Column(String(500), default="")
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    products = relationship("Product", back_populates="seller", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    condition = Column(String(50), default="Отличное") # Новое, Отличное, Хорошее, Б/у
    location = Column(String(255), default="Главный кампус")
    images = Column(Text, default="[]") # JSON-serialized list of image URLs
    status = Column(String(50), default="active") # active, sold, reserved
    views_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    seller = relationship("User", back_populates="products")
    favorites = relationship("Favorite", back_populates="product", cascade="all, delete-orphan")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="favorites")
    product = relationship("Product", back_populates="favorites")
