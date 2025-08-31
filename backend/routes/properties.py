from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..models import Property, PropertyCreate, PropertyUpdate, LikeRequest
from ..database import Database
from datetime import datetime
import uuid

router = APIRouter()

@router.get("/properties", response_model=List[Property])
async def get_properties(
    search: Optional[str] = Query(None, description="Search term"),
    type: Optional[str] = Query(None, description="Property type: sale, rent, or all"),
    city: Optional[str] = Query(None, description="City filter"),
    neighborhood: Optional[str] = Query(None, description="Neighborhood filter"),
    category: Optional[str] = Query(None, description="Category filter"),
    min_price: Optional[int] = Query(None, description="Minimum price"),
    max_price: Optional[int] = Query(None, description="Maximum price"),
    bedrooms: Optional[str] = Query(None, description="Minimum bedrooms"),
    min_area: Optional[int] = Query(None, description="Minimum area"),
    max_area: Optional[int] = Query(None, description="Maximum area"),
    features: Optional[str] = Query(None, description="Required features (comma-separated)"),
    limit: int = Query(100, description="Maximum number of results"),
    skip: int = Query(0, description="Number of results to skip")
):
    """Get all properties with optional filtering"""
    filters = {}
    
    if search:
        filters["search"] = search
    if type:
        filters["type"] = type
    if city:
        filters["city"] = city
    if neighborhood:
        filters["neighborhood"] = neighborhood
    if category:
        filters["category"] = category
    if min_price:
        filters["min_price"] = min_price
    if max_price:
        filters["max_price"] = max_price
    if bedrooms:
        filters["bedrooms"] = bedrooms
    if min_area:
        filters["min_area"] = min_area
    if max_area:
        filters["max_area"] = max_area
    if features:
        filters["features"] = features.split(",")
    
    properties = await Database.get_properties(filters, limit, skip)
    return properties

@router.get("/properties/{property_id}", response_model=Property)
async def get_property(property_id: str):
    """Get a single property by ID"""
    property_doc = await Database.get_property_by_id(property_id)
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    return property_doc

@router.post("/properties", response_model=Property)
async def create_property(property: PropertyCreate):
    """Create a new property listing"""
    property_data = property.dict()
    property_data["id"] = str(uuid.uuid4())
    property_data["created_at"] = datetime.utcnow()
    property_data["updated_at"] = datetime.utcnow()
    property_data["views"] = 0
    property_data["likes"] = 0
    property_data["is_active"] = True
    
    created_property = await Database.create_property(property_data)
    return created_property

@router.put("/properties/{property_id}", response_model=Property)
async def update_property(property_id: str, property_update: PropertyUpdate):
    """Update an existing property"""
    update_data = {k: v for k, v in property_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    updated_property = await Database.update_property(property_id, update_data)
    if not updated_property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    return updated_property

@router.delete("/properties/{property_id}")
async def delete_property(property_id: str):
    """Delete a property (soft delete)"""
    success = await Database.delete_property(property_id)
    if not success:
        raise HTTPException(status_code=404, detail="Property not found")
    
    return {"message": "Property deleted successfully"}

@router.post("/properties/{property_id}/like")
async def like_property(property_id: str, like_request: LikeRequest):
    """Like or unlike a property"""
    new_like_count = await Database.like_property(property_id, like_request.is_liked)
    if new_like_count is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    return {"likes": new_like_count, "message": "Like status updated"}

@router.get("/properties/{property_id}/comments")
async def get_property_comments(property_id: str):
    """Get all comments for a property"""
    # First check if property exists
    property_doc = await Database.get_property_by_id(property_id)
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    
    comments = await Database.get_comments_by_property(property_id)
    return comments