import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine, Base
import models
from routers import auth, products, favorites

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CampusPlace API",
    description="Студенческий маркетплейс кампуса — API бэкенда",
    version="1.0.0"
)

# CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")), name="static")

# Include Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(favorites.router)

@app.get("/")
def read_root():
    return {
        "app": "CampusPlace API",
        "status": "online",
        "docs": "/docs",
        "version": "1.0.0"
    }
