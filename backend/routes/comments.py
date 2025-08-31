from fastapi import APIRouter, HTTPException
from ..models import Comment, CommentCreate
from ..database import Database
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/comments", response_model=Comment)
async def create_comment(comment: CommentCreate):
    """Create a new comment for a property"""
    # Verify property exists
    property_doc = await Database.get_property_by_id(comment.property_id)
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    
    comment_data = comment.dict()
    comment_data["id"] = str(uuid.uuid4())
    comment_data["created_at"] = datetime.utcnow()
    
    created_comment = await Database.create_comment(comment_data)
    return created_comment

@router.get("/comments/property/{property_id}")
async def get_comments_by_property(property_id: str):
    """Get all comments for a specific property"""
    comments = await Database.get_comments_by_property(property_id)
    return comments