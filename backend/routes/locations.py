from fastapi import APIRouter, HTTPException
from typing import List
from models import CityModel
from database import Database

router = APIRouter()

@router.get("/locations/cities", response_model=List[CityModel])
async def get_cities():
    """Get all available cities in Gabon with their neighborhoods"""
    cities = await Database.get_cities()
    return cities

@router.get("/locations/neighborhoods/{city}")
async def get_neighborhoods(city: str):
    """Get all neighborhoods for a specific city"""
    neighborhoods = await Database.get_neighborhoods_by_city(city)
    if not neighborhoods:
        raise HTTPException(status_code=404, detail="City not found")
    
    return {"city": city, "neighborhoods": neighborhoods}