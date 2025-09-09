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
async def get_listings(
    random_order: bool = True, 
    limit: int = 20, 
    skip: int = 0,
    search: Optional[str] = Query(None, description="Search in title and description"),
    city: Optional[str] = Query(None, description="Filter by city"),
    neighborhood: Optional[str] = Query(None, description="Filter by neighborhood"),
    listing_type: Optional[str] = Query(None, description="Filter by type: sale or rent"),
    price_min: Optional[float] = Query(None, description="Minimum price"),
    price_max: Optional[float] = Query(None, description="Maximum price"),
    surface_min: Optional[int] = Query(None, description="Minimum surface"),
    surface_max: Optional[int] = Query(None, description="Maximum surface"),
    rooms_min: Optional[int] = Query(None, description="Minimum rooms"),
    rooms_max: Optional[int] = Query(None, description="Maximum rooms"),
    lat: Optional[float] = Query(None, description="Latitude for radius search"),
    lon: Optional[float] = Query(None, description="Longitude for radius search"),
    radius: Optional[float] = Query(None, description="Radius in km for geo search")
):
    # Build the filter query
    filter_query = {"is_published": True}
    
    # Text search
    if search:
        filter_query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    # Location filters
    if city:
        filter_query["city"] = {"$regex": city, "$options": "i"}
    if neighborhood:
        filter_query["neighborhood"] = {"$regex": neighborhood, "$options": "i"}
    
    # Type filter
    if listing_type:
        filter_query["listing_type"] = listing_type
    
    # Price filters
    if price_min is not None:
        filter_query["price"] = {"$gte": price_min}
    if price_max is not None:
        if "price" in filter_query:
            filter_query["price"]["$lte"] = price_max
        else:
            filter_query["price"] = {"$lte": price_max}
    
    # Surface filters
    if surface_min is not None:
        filter_query["surface"] = {"$gte": surface_min}
    if surface_max is not None:
        if "surface" in filter_query:
            filter_query["surface"]["$lte"] = surface_max
        else:
            filter_query["surface"] = {"$lte": surface_max}
    
    # Rooms filters
    if rooms_min is not None:
        filter_query["rooms"] = {"$gte": rooms_min}
    if rooms_max is not None:
        if "rooms" in filter_query:
            filter_query["rooms"]["$lte"] = rooms_max
        else:
            filter_query["rooms"] = {"$lte": rooms_max}
    
    # Geo search (simplified - for production use proper geo queries)
    if lat is not None and lon is not None and radius is not None:
        # Simple bounding box calculation (approximate)
        lat_range = radius / 111.0  # 1 degree ≈ 111 km
        lon_range = radius / (111.0 * abs(lat / 90.0)) if lat != 0 else radius / 111.0
        
        filter_query["lat"] = {"$gte": lat - lat_range, "$lte": lat + lat_range}
        filter_query["lon"] = {"$gte": lon - lon_range, "$lte": lon + lon_range}

    if random_order:
        # Get random listings
        pipeline = [
            {"$match": filter_query},
            {"$sample": {"size": limit}}
        ]
        listings = await db.listings.aggregate(pipeline).to_list(length=None)
    else:
        listings = await db.listings.find(filter_query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=None)
    
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

# Geocoding endpoints
@api_router.get("/geocode")
async def geocode_address(q: str = Query(..., description="Address or place to geocode")):
    """Proxy for Nominatim search to avoid CORS issues and rate limiting"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": q,
                    "format": "json",
                    "addressdetails": 1,
                    "limit": 10,
                    "countrycodes": "ga",  # Restrict to Gabon
                    "accept-language": "fr"
                },
                headers={
                    "User-Agent": "IMMO&CO/1.0 (immobilier@gabon.com)"
                },
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Geocoding error: {e}")
            raise HTTPException(status_code=500, detail="Geocoding service unavailable")

@api_router.get("/reverse-geocode")
async def reverse_geocode(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    """Reverse geocode coordinates to address"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={
                    "lat": lat,
                    "lon": lon,
                    "format": "json",
                    "addressdetails": 1,
                    "accept-language": "fr"
                },
                headers={
                    "User-Agent": "IMMO&CO/1.0 (immobilier@gabon.com)"
                },
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            
            # Extract relevant address components for Gabon
            address = data.get("address", {})
            result = {
                "city": address.get("city") or address.get("town") or address.get("village") or address.get("state"),
                "neighborhood": address.get("suburb") or address.get("neighbourhood") or address.get("quarter"),
                "address": data.get("display_name", ""),
                "lat": lat,
                "lon": lon
            }
            
            return result
        except httpx.HTTPError as e:
            logger.error(f"Reverse geocoding error: {e}")
            raise HTTPException(status_code=500, detail="Reverse geocoding service unavailable")

@api_router.get("/cities")
async def get_cities():
    """Get list of cities from existing listings"""
    cities = await db.listings.distinct("city", {"is_published": True, "city": {"$ne": None}})
    return sorted([city for city in cities if city])

@api_router.get("/neighborhoods")
async def get_neighborhoods(city: Optional[str] = Query(None)):
    """Get list of neighborhoods, optionally filtered by city"""
    filter_query = {"is_published": True, "neighborhood": {"$ne": None}}
    if city:
        filter_query["city"] = city
    
    neighborhoods = await db.listings.distinct("neighborhood", filter_query)
    return sorted([neighborhood for neighborhood in neighborhoods if neighborhood])

# Image upload endpoints
@api_router.post("/listings/{listing_id}/images")
async def upload_listing_images(
    listing_id: str,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    # Check if listing exists and user owns it
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check file count limit (max 10)
    current_images = listing.get("images", [])
    if len(current_images) + len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files allowed per listing")
    
    uploaded_files = []
    
    for file in files:
        # Validate file type and size
        if file.content_type not in ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]:
            raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed")
        
        # Check file size (max 10MB)
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        if file_size > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=400, detail="File size too large (max 10MB)")
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        filename = f"{listing_id}_{uuid.uuid4()}.{file_extension}"
        file_path = UPLOAD_DIR / filename
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        uploaded_files.append(filename)
    
    # Update listing with new images
    updated_images = current_images + uploaded_files
    await db.listings.update_one(
        {"id": listing_id}, 
        {"$set": {"images": updated_images, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": f"{len(files)} files uploaded successfully", "images": uploaded_files}

@api_router.delete("/listings/{listing_id}/images/{filename}")
async def delete_listing_image(
    listing_id: str, 
    filename: str, 
    current_user: User = Depends(get_current_user)
):
    # Check if listing exists and user owns it
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Remove from database
    updated_images = [img for img in listing.get("images", []) if img != filename]
    await db.listings.update_one(
        {"id": listing_id}, 
        {"$set": {"images": updated_images, "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Delete file
    file_path = UPLOAD_DIR / filename
    if file_path.exists():
        file_path.unlink()
    
    return {"message": "Image deleted successfully"}

# User favorites endpoints
@api_router.post("/favorites/{listing_id}")
async def add_favorite(listing_id: str, current_user: User = Depends(get_current_user)):
    # Check if listing exists
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Check if already favorited
    existing_favorite = await db.favorites.find_one({
        "listing_id": listing_id, 
        "user_id": current_user.id
    })
    
    if existing_favorite:
        raise HTTPException(status_code=400, detail="Already in favorites")
    
    # Add to favorites
    favorite = {
        "id": str(uuid.uuid4()),
        "listing_id": listing_id,
        "user_id": current_user.id,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.favorites.insert_one(favorite)
    return {"message": "Added to favorites"}

@api_router.delete("/favorites/{listing_id}")
async def remove_favorite(listing_id: str, current_user: User = Depends(get_current_user)):
    result = await db.favorites.delete_one({
        "listing_id": listing_id,
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    return {"message": "Removed from favorites"}

@api_router.get("/favorites")
async def get_user_favorites(current_user: User = Depends(get_current_user)):
    favorites = await db.favorites.find({"user_id": current_user.id}).to_list(length=None)
    listing_ids = [fav["listing_id"] for fav in favorites]
    
    if not listing_ids:
        return []
    
    # Get listings
    listings = await db.listings.find({"id": {"$in": listing_ids}, "is_published": True}).to_list(length=None)
    
    # Add counts for each listing
    for listing in listings:
        likes_count = await db.likes.count_documents({"listing_id": listing["id"]})
        comments_count = await db.comments.count_documents({"listing_id": listing["id"]})
        listing["likes_count"] = likes_count
        listing["comments_count"] = comments_count
    
    return [Listing(**listing) for listing in listings]

@api_router.get("/favorites/{listing_id}/check")
async def check_favorite(listing_id: str, current_user: User = Depends(get_current_user)):
    favorite = await db.favorites.find_one({
        "listing_id": listing_id,
        "user_id": current_user.id
    })
    return {"is_favorite": favorite is not None}

# User's own listings
@api_router.get("/my-listings")
async def get_my_listings(current_user: User = Depends(get_current_user)):
    listings = await db.listings.find({"owner_id": current_user.id}).sort("created_at", -1).to_list(length=None)
    
    # Add counts for each listing
    for listing in listings:
        likes_count = await db.likes.count_documents({"listing_id": listing["id"]})
        comments_count = await db.comments.count_documents({"listing_id": listing["id"]})
        listing["likes_count"] = likes_count
        listing["comments_count"] = comments_count
    
    return [Listing(**listing) for listing in listings]

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