from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class LocationModel(BaseModel):
    city: str
    neighborhood: str
    coordinates: List[float]  # [latitude, longitude]

class SellerModel(BaseModel):
    name: str
    phone: str
    email: str

class PropertyCreate(BaseModel):
    title: str
    price: int
    type: str  # 'sale' or 'rent'
    category: str
    bedrooms: int
    bathrooms: int
    area: int  # in square meters
    location: LocationModel
    images: List[str]  # URLs
    description: str
    features: List[str]
    seller: SellerModel

class Property(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    price: int
    type: str  # 'sale' or 'rent'
    category: str
    bedrooms: int
    bathrooms: int
    area: int  # in square meters
    location: LocationModel
    images: List[str]  # URLs
    description: str
    features: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    views: int = 0
    likes: int = 0
    seller: SellerModel
    is_active: bool = True

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    price: Optional[int] = None
    type: Optional[str] = None
    category: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area: Optional[int] = None
    location: Optional[LocationModel] = None
    images: Optional[List[str]] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None
    seller: Optional[SellerModel] = None
    is_active: Optional[bool] = None

class CommentCreate(BaseModel):
    property_id: str
    author: str
    content: str

class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    property_id: str
    author: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class LikeRequest(BaseModel):
    is_liked: bool

class CityModel(BaseModel):
    name: str
    neighborhoods: List[str]