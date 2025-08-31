from motor.motor_asyncio import AsyncIOMotorClient
from typing import List
import os
from .models import Property, Comment, CityModel

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Collections
properties_collection = db.properties
comments_collection = db.comments
cities_collection = db.cities

class Database:
    
    @staticmethod
    async def init_data():
        """Initialize database with seed data"""
        # Check if cities data exists
        if await cities_collection.count_documents({}) == 0:
            cities_data = [
                {"name": "Libreville", "neighborhoods": ["Centre-ville", "Glass", "Akanda", "PK12", "Oloumi", "Nzeng-Ayong"]},
                {"name": "Port-Gentil", "neighborhoods": ["Centre", "Bord de mer", "Quartier résidentiel", "Zone industrielle"]},
                {"name": "Franceville", "neighborhoods": ["Centre", "Quartier universitaire", "Residential"]},
                {"name": "Oyem", "neighborhoods": ["Centre", "Nouveau quartier", "Traditional"]},
                {"name": "Moanda", "neighborhoods": ["Centre", "Mining area", "Residential"]}
            ]
            await cities_collection.insert_many(cities_data)

        # Check if properties data exists - if not, seed with mock data
        if await properties_collection.count_documents({}) == 0:
            from datetime import datetime
            mock_properties = [
                {
                    "id": "1",
                    "title": "Villa moderne 4 chambres - Libreville Centre",
                    "price": 85000000,
                    "type": "sale",
                    "category": "Villa",
                    "bedrooms": 4,
                    "bathrooms": 3,
                    "area": 250,
                    "location": {
                        "city": "Libreville",
                        "neighborhood": "Centre-ville",
                        "coordinates": [9.4536, 0.3955]
                    },
                    "images": [
                        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
                        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
                        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"
                    ],
                    "description": "Magnifique villa moderne située en plein centre de Libreville. Propriété récente avec finitions haut de gamme, jardin paysagé et parking pour 2 véhicules.",
                    "features": ["Climatisation", "Jardin", "Parking", "Sécurité"],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "views": 245,
                    "likes": 12,
                    "seller": {
                        "name": "Jean-Paul Obame",
                        "phone": "+241 06 12 34 56",
                        "email": "jp.obame@email.ga"
                    },
                    "is_active": True
                },
                {
                    "id": "2", 
                    "title": "Appartement 2 pièces - Quartier Glass",
                    "price": 450000,
                    "type": "rent",
                    "category": "Appartement",
                    "bedrooms": 2,
                    "bathrooms": 1,
                    "area": 65,
                    "location": {
                        "city": "Libreville",
                        "neighborhood": "Glass",
                        "coordinates": [9.4489, 0.4021]
                    },
                    "images": [
                        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
                        "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800"
                    ],
                    "description": "Appartement moderne au 3ème étage avec vue dégagée. Proche des commerces et transports. Idéal pour jeune couple ou professionnel.",
                    "features": ["Climatisation", "Balcon", "Ascenseur", "Parking"],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "views": 156,
                    "likes": 8,
                    "seller": {
                        "name": "Sophie Ikapi",
                        "phone": "+241 07 89 45 23",
                        "email": "s.ikapi@email.ga"
                    },
                    "is_active": True
                },
                {
                    "id": "3",
                    "title": "Terrain constructible 800m² - PK12",
                    "price": 25000000,
                    "type": "sale",
                    "category": "Terrain",
                    "bedrooms": 0,
                    "bathrooms": 0,
                    "area": 800,
                    "location": {
                        "city": "Libreville",
                        "neighborhood": "PK12",
                        "coordinates": [9.3826, 0.4844]
                    },
                    "images": [
                        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"
                    ],
                    "description": "Terrain plat et viabilisé de 800m² dans une zone résidentielle calme. Idéal pour construction de villa familiale. Titre foncier en règle.",
                    "features": ["Viabilisé", "Titre foncier", "Zone résidentielle", "Accès bitumé"],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "views": 89,
                    "likes": 5,
                    "seller": {
                        "name": "Patrick Mba",
                        "phone": "+241 06 78 90 12",
                        "email": "p.mba@email.ga"
                    },
                    "is_active": True
                },
                {
                    "id": "4",
                    "title": "Maison 3 chambres - Port-Gentil Centre",
                    "price": 65000000,
                    "type": "sale", 
                    "category": "Maison",
                    "bedrooms": 3,
                    "bathrooms": 2,
                    "area": 180,
                    "location": {
                        "city": "Port-Gentil",
                        "neighborhood": "Centre",
                        "coordinates": [-0.7193, 8.7815]
                    },
                    "images": [
                        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800",
                        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"
                    ],
                    "description": "Maison familiale bien entretenue avec jardin. Située dans un quartier résidentiel calme de Port-Gentil. Proche écoles et commerces.",
                    "features": ["Jardin", "Garage", "Véranda", "Portail électrique"],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "views": 198,
                    "likes": 15,
                    "seller": {
                        "name": "Christine Oyane",
                        "phone": "+241 05 67 89 01",
                        "email": "c.oyane@email.ga"
                    },
                    "is_active": True
                },
                {
                    "id": "5",
                    "title": "Studio meublé - Libreville Akanda",
                    "price": 250000,
                    "type": "rent",
                    "category": "Studio",
                    "bedrooms": 1,
                    "bathrooms": 1,
                    "area": 35,
                    "location": {
                        "city": "Libreville",
                        "neighborhood": "Akanda",
                        "coordinates": [9.5534, 0.5139]
                    },
                    "images": [
                        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"
                    ],
                    "description": "Studio moderne entièrement meublé et équipé. Parfait pour étudiant ou jeune professionnel. Charges incluses.",
                    "features": ["Meublé", "Climatisation", "WiFi", "Charges incluses"],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "views": 134,
                    "likes": 7,
                    "seller": {
                        "name": "Marcel Eyeghe",
                        "phone": "+241 06 23 45 67",
                        "email": "m.eyeghe@email.ga"
                    },
                    "is_active": True
                }
            ]
            await properties_collection.insert_many(mock_properties)

    # Properties CRUD
    @staticmethod
    async def get_properties(filters: dict = None, limit: int = 100, skip: int = 0):
        query = {"is_active": True}
        
        if filters:
            if filters.get("search"):
                search_term = filters["search"]
                query["$or"] = [
                    {"title": {"$regex": search_term, "$options": "i"}},
                    {"description": {"$regex": search_term, "$options": "i"}},
                    {"location.city": {"$regex": search_term, "$options": "i"}},
                    {"location.neighborhood": {"$regex": search_term, "$options": "i"}}
                ]
            
            if filters.get("type") and filters["type"] != "all":
                query["type"] = filters["type"]
            
            if filters.get("city") and filters["city"] != "all":
                query["location.city"] = filters["city"]
            
            if filters.get("neighborhood") and filters["neighborhood"] != "all":
                query["location.neighborhood"] = filters["neighborhood"]
            
            if filters.get("category") and filters["category"] != "all":
                query["category"] = filters["category"]
            
            if filters.get("min_price"):
                query["price"] = {"$gte": int(filters["min_price"])}
            
            if filters.get("max_price"):
                if "price" not in query:
                    query["price"] = {}
                query["price"]["$lte"] = int(filters["max_price"])
            
            if filters.get("bedrooms") and filters["bedrooms"] != "all":
                query["bedrooms"] = {"$gte": int(filters["bedrooms"])}
            
            if filters.get("min_area"):
                query["area"] = {"$gte": int(filters["min_area"])}
            
            if filters.get("max_area"):
                if "area" not in query:
                    query["area"] = {}
                query["area"]["$lte"] = int(filters["max_area"])
            
            if filters.get("features"):
                features = filters["features"] if isinstance(filters["features"], list) else [filters["features"]]
                query["features"] = {"$in": features}

        cursor = properties_collection.find(query).skip(skip).limit(limit)
        properties = await cursor.to_list(length=limit)
        return properties

    @staticmethod
    async def get_property_by_id(property_id: str):
        # Increment view count
        await properties_collection.update_one(
            {"id": property_id}, 
            {"$inc": {"views": 1}}
        )
        return await properties_collection.find_one({"id": property_id, "is_active": True})

    @staticmethod
    async def create_property(property_data: dict):
        result = await properties_collection.insert_one(property_data)
        return await properties_collection.find_one({"_id": result.inserted_id})

    @staticmethod
    async def update_property(property_id: str, update_data: dict):
        update_data["updated_at"] = datetime.utcnow()
        result = await properties_collection.update_one(
            {"id": property_id},
            {"$set": update_data}
        )
        if result.modified_count:
            return await properties_collection.find_one({"id": property_id})
        return None

    @staticmethod
    async def delete_property(property_id: str):
        result = await properties_collection.update_one(
            {"id": property_id},
            {"$set": {"is_active": False}}
        )
        return result.modified_count > 0

    @staticmethod
    async def like_property(property_id: str, is_liked: bool):
        increment = 1 if is_liked else -1
        result = await properties_collection.update_one(
            {"id": property_id},
            {"$inc": {"likes": increment}}
        )
        if result.modified_count:
            property_doc = await properties_collection.find_one({"id": property_id})
            return property_doc.get("likes", 0)
        return None

    # Comments CRUD
    @staticmethod
    async def get_comments_by_property(property_id: str):
        cursor = comments_collection.find({"property_id": property_id}).sort("created_at", -1)
        return await cursor.to_list(length=100)

    @staticmethod
    async def create_comment(comment_data: dict):
        result = await comments_collection.insert_one(comment_data)
        return await comments_collection.find_one({"_id": result.inserted_id})

    # Cities and locations
    @staticmethod
    async def get_cities():
        cursor = cities_collection.find({})
        return await cursor.to_list(length=100)

    @staticmethod
    async def get_neighborhoods_by_city(city: str):
        city_doc = await cities_collection.find_one({"name": city})
        return city_doc.get("neighborhoods", []) if city_doc else []