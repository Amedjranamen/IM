#!/usr/bin/env python3
"""
IMMO&CO Quick Validation Test
Quick validation of key API endpoints after frontend corrections
"""

import requests
import json

# Backend URL from frontend environment
BACKEND_URL = "https://image-upload-fix-3.preview.emergentagent.com/api"

def test_api_health():
    """Test 1: API Health Check (/api/)"""
    print("🔍 Testing API Health...")
    try:
        response = requests.get(f"{BACKEND_URL}/")
        if response.status_code == 200:
            data = response.json()
            if "IMMO&CO" in data.get("message", ""):
                print(f"✅ API Health: {data['message']}")
                return True
            else:
                print(f"❌ API Health: Unexpected response - {data}")
                return False
        else:
            print(f"❌ API Health: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API Health: Error - {str(e)}")
        return False

def test_get_properties():
    """Test 2: Properties Retrieval (/api/properties)"""
    print("🔍 Testing Properties Retrieval...")
    try:
        response = requests.get(f"{BACKEND_URL}/properties")
        if response.status_code == 200:
            properties = response.json()
            if isinstance(properties, list) and len(properties) > 0:
                print(f"✅ Properties Retrieval: Found {len(properties)} properties")
                return True, properties
            else:
                print("❌ Properties Retrieval: No properties found")
                return False, []
        else:
            print(f"❌ Properties Retrieval: HTTP {response.status_code}")
            return False, []
    except Exception as e:
        print(f"❌ Properties Retrieval: Error - {str(e)}")
        return False, []

def test_search_filters():
    """Test 3: Search with Filters (city and type)"""
    print("🔍 Testing Search Filters...")
    
    # Test city filter
    try:
        response = requests.get(f"{BACKEND_URL}/properties", params={"city": "Libreville"})
        if response.status_code == 200:
            libreville_properties = response.json()
            print(f"✅ City Filter (Libreville): Found {len(libreville_properties)} properties")
        else:
            print(f"❌ City Filter: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ City Filter: Error - {str(e)}")
        return False
    
    # Test type filter
    try:
        response = requests.get(f"{BACKEND_URL}/properties", params={"type": "sale"})
        if response.status_code == 200:
            sale_properties = response.json()
            print(f"✅ Type Filter (sale): Found {len(sale_properties)} properties")
            return True
        else:
            print(f"❌ Type Filter: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Type Filter: Error - {str(e)}")
        return False

def test_create_property():
    """Test 4: Simple Property Creation"""
    print("🔍 Testing Property Creation...")
    
    property_data = {
        "title": "Test Villa - Validation Rapide",
        "price": 75000000,
        "type": "sale",
        "category": "Villa",
        "bedrooms": 3,
        "bathrooms": 2,
        "area": 200,
        "location": {
            "city": "Libreville",
            "neighborhood": "Glass",
            "coordinates": [9.4536, 0.3955]
        },
        "images": ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800"],
        "description": "Villa de test pour validation rapide de l'API",
        "features": ["Jardin", "Parking"],
        "seller": {
            "name": "Test Seller",
            "phone": "+241 01 11 11 11",
            "email": "test@example.com"
        }
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/properties", json=property_data)
        if response.status_code == 200:
            created_property = response.json()
            property_id = created_property.get("id")
            print(f"✅ Property Creation: Created property {property_id}")
            return True, property_id
        else:
            print(f"❌ Property Creation: HTTP {response.status_code} - {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Property Creation: Error - {str(e)}")
        return False, None

def test_like_system(properties):
    """Test 5: Like System"""
    print("🔍 Testing Like System...")
    
    if not properties:
        print("❌ Like System: No properties available for testing")
        return False
    
    try:
        property_id = properties[0]["id"]
        original_likes = properties[0].get("likes", 0)
        
        # Test like
        response = requests.post(f"{BACKEND_URL}/properties/{property_id}/like", 
                               json={"is_liked": True})
        
        if response.status_code == 200:
            result = response.json()
            new_likes = result.get("likes", 0)
            if new_likes == original_likes + 1:
                print(f"✅ Like System: Like count increased from {original_likes} to {new_likes}")
                return True
            else:
                print(f"❌ Like System: Expected {original_likes + 1}, got {new_likes}")
                return False
        else:
            print(f"❌ Like System: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Like System: Error - {str(e)}")
        return False

def test_get_cities():
    """Test 6: Cities Retrieval (/api/locations/cities)"""
    print("🔍 Testing Cities Retrieval...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/locations/cities")
        if response.status_code == 200:
            cities = response.json()
            if isinstance(cities, list) and len(cities) > 0:
                city_names = [city.get("name", "") for city in cities]
                gabonese_cities = ["Libreville", "Port-Gentil", "Franceville"]
                found_cities = [city for city in gabonese_cities if city in city_names]
                print(f"✅ Cities Retrieval: Found {len(cities)} cities including {', '.join(found_cities)}")
                return True
            else:
                print("❌ Cities Retrieval: No cities found")
                return False
        else:
            print(f"❌ Cities Retrieval: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cities Retrieval: Error - {str(e)}")
        return False

def main():
    """Run quick validation tests"""
    print("🏠 IMMO&CO - Validation Rapide de l'API")
    print("=" * 50)
    
    results = []
    
    # Test 1: API Health
    results.append(test_api_health())
    
    # Test 2: Properties Retrieval
    properties_success, properties = test_get_properties()
    results.append(properties_success)
    
    # Test 3: Search Filters
    results.append(test_search_filters())
    
    # Test 4: Property Creation
    create_success, property_id = test_create_property()
    results.append(create_success)
    
    # Test 5: Like System
    results.append(test_like_system(properties))
    
    # Test 6: Cities Retrieval
    results.append(test_get_cities())
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 RÉSUMÉ DE LA VALIDATION")
    print("=" * 50)
    
    passed = sum(results)
    total = len(results)
    
    print(f"✅ Tests réussis: {passed}/{total}")
    print(f"❌ Tests échoués: {total - passed}/{total}")
    
    if passed == total:
        print("\n🎉 Tous les tests de validation sont passés!")
        print("✅ L'API IMMO&CO fonctionne correctement après les corrections frontend")
    else:
        print(f"\n⚠️  {total - passed} test(s) ont échoué")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)