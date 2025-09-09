from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import random
from fastapi.staticfiles import StaticFiles
import shutil
import aiofiles
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="IMMO&CO API", description="Plateforme immobilière pour le Gabon")

# Create upload directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    phone: Optional[str] = None
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    created_at: datetime

class Listing(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str
    owner_name: str
    title: str
    description: str
    listing_type: str  # 'sale' or 'rent'
    price: float
    currency: str = "XAF"
    city: str
    neighborhood: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    surface: Optional[int] = None
    rooms: Optional[int] = None
    images: List[str] = []
    is_published: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    likes_count: int = 0
    comments_count: int = 0

class ListingCreate(BaseModel):
    title: str
    description: str
    listing_type: str
    price: float
    city: str
    neighborhood: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    surface: Optional[int] = None
    rooms: Optional[int] = None

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    city: Optional[str] = None
    neighborhood: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    surface: Optional[int] = None
    rooms: Optional[int] = None

class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    listing_id: str
    author_id: str
    author_name: str
    text: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommentCreate(BaseModel):
    text: str

class Like(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    listing_id: str
    user_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Authentication helpers
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    payload = {"user_id": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth endpoints
@api_router.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        phone=user_data.phone,
        password_hash=hash_password(user_data.password)
    )
    
    await db.users.insert_one(user.dict())
    token = create_access_token(user.id)
    
    return {
        "token": token,
        "user": UserResponse(**user.dict())
    }

@api_router.post("/auth/login", response_model=dict)
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(user["id"])
    return {
        "token": token,
        "user": UserResponse(**user)
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(**current_user.dict())

# Listings endpoints
@api_router.get("/listings", response_model=List[Listing])
async def get_listings(random_order: bool = True, limit: int = 20, skip: int = 0):
    if random_order:
        # Get random listings
        pipeline = [
            {"$match": {"is_published": True}},
            {"$sample": {"size": limit}}
        ]
        listings = await db.listings.aggregate(pipeline).to_list(length=None)
    else:
        listings = await db.listings.find(
            {"is_published": True}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(length=None)
    
    # Add likes and comments count
    for listing in listings:
        likes_count = await db.likes.count_documents({"listing_id": listing["id"]})
        comments_count = await db.comments.count_documents({"listing_id": listing["id"]})
        listing["likes_count"] = likes_count
        listing["comments_count"] = comments_count
    
    return [Listing(**listing) for listing in listings]

@api_router.get("/listings/{listing_id}", response_model=Listing)
async def get_listing(listing_id: str):
    listing = await db.listings.find_one({"id": listing_id, "is_published": True})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Add counts
    likes_count = await db.likes.count_documents({"listing_id": listing_id})
    comments_count = await db.comments.count_documents({"listing_id": listing_id})
    listing["likes_count"] = likes_count
    listing["comments_count"] = comments_count
    
    return Listing(**listing)

@api_router.post("/listings", response_model=Listing)
async def create_listing(listing_data: ListingCreate, current_user: User = Depends(get_current_user)):
    listing = Listing(
        owner_id=current_user.id,
        owner_name=current_user.name,
        **listing_data.dict()
    )
    
    await db.listings.insert_one(listing.dict())
    return listing

@api_router.put("/listings/{listing_id}", response_model=Listing)
async def update_listing(listing_id: str, listing_data: ListingUpdate, current_user: User = Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in listing_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.listings.update_one({"id": listing_id}, {"$set": update_data})
    
    updated_listing = await db.listings.find_one({"id": listing_id})
    return Listing(**updated_listing)

@api_router.delete("/listings/{listing_id}")
async def delete_listing(listing_id: str, current_user: User = Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.listings.delete_one({"id": listing_id})
    return {"message": "Listing deleted"}

# Comments endpoints
@api_router.get("/listings/{listing_id}/comments", response_model=List[Comment])
async def get_comments(listing_id: str):
    comments = await db.comments.find({"listing_id": listing_id}).sort("created_at", -1).to_list(length=None)
    return [Comment(**comment) for comment in comments]

@api_router.post("/listings/{listing_id}/comments", response_model=Comment)
async def create_comment(listing_id: str, comment_data: CommentCreate, current_user: User = Depends(get_current_user)):
    # Check if listing exists
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    comment = Comment(
        listing_id=listing_id,
        author_id=current_user.id,
        author_name=current_user.name,
        text=comment_data.text
    )
    
    await db.comments.insert_one(comment.dict())
    return comment

@api_router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, current_user: User = Depends(get_current_user)):
    comment = await db.comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment["author_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.comments.delete_one({"id": comment_id})
    return {"message": "Comment deleted"}

# Likes endpoints
@api_router.post("/listings/{listing_id}/like")
async def toggle_like(listing_id: str, current_user: User = Depends(get_current_user)):
    # Check if listing exists
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Check if already liked
    existing_like = await db.likes.find_one({"listing_id": listing_id, "user_id": current_user.id})
    
    if existing_like:
        # Unlike
        await db.likes.delete_one({"id": existing_like["id"]})
        liked = False
    else:
        # Like
        like = Like(listing_id=listing_id, user_id=current_user.id)
        await db.likes.insert_one(like.dict())
        liked = True
    
    # Get updated count
    likes_count = await db.likes.count_documents({"listing_id": listing_id})
    
    return {"liked": liked, "likes_count": likes_count}

@api_router.get("/listings/{listing_id}/liked")
async def check_if_liked(listing_id: str, current_user: User = Depends(get_current_user)):
    like = await db.likes.find_one({"listing_id": listing_id, "user_id": current_user.id})
    return {"liked": like is not None}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info("IMMO&CO API starting up...")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()