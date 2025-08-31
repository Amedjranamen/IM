#!/usr/bin/env python3
"""
IMMO&CO Backend API Test Suite
Tests for the FastAPI backend of the Gabonese real estate platform
"""

import requests
import json
import uuid
from datetime import datetime
import os
import sys

# Get the backend URL from frontend environment
BACKEND_URL = "https://immo-finder-gabon.preview.emergentagent.com/api"

class IMOCOBackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_results = []
        self.created_property_id = None
        
    def log_test(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_data": response_data
        })
        
    def test_api_health(self):
        """Test basic API health check"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                if "IMMO&CO" in data.get("message", ""):
                    self.log_test("API Health Check", True, f"API responding correctly: {data['message']}")
                    return True
                else:
                    self.log_test("API Health Check", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("API Health Check", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("API Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_get_all_properties(self):
        """Test retrieving all properties"""
        try:
            response = self.session.get(f"{self.base_url}/properties")
            if response.status_code == 200:
                properties = response.json()
                if isinstance(properties, list) and len(properties) > 0:
                    # Check if seed data is present
                    property_titles = [p.get("title", "") for p in properties]
                    has_seed_data = any("Villa moderne" in title or "Appartement 2 pièces" in title for title in property_titles)
                    
                    self.log_test("Get All Properties", True, 
                                f"Retrieved {len(properties)} properties, seed data present: {has_seed_data}")
                    return True
                else:
                    self.log_test("Get All Properties", False, "No properties found or invalid response format")
                    return False
            else:
                self.log_test("Get All Properties", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get All Properties", False, f"Error: {str(e)}")
            return False
    
    def test_property_filters(self):
        """Test property search filters"""
        test_cases = [
            {"type": "sale", "description": "Filter by sale type"},
            {"type": "rent", "description": "Filter by rent type"},
            {"city": "Libreville", "description": "Filter by Libreville city"},
            {"search": "Villa", "description": "Search for Villa"},
            {"min_price": "50000000", "description": "Filter by minimum price"},
            {"bedrooms": "3", "description": "Filter by minimum bedrooms"},
            {"category": "Appartement", "description": "Filter by apartment category"}
        ]
        
        all_passed = True
        for test_case in test_cases:
            try:
                params = {k: v for k, v in test_case.items() if k != "description"}
                response = self.session.get(f"{self.base_url}/properties", params=params)
                
                if response.status_code == 200:
                    properties = response.json()
                    self.log_test(f"Property Filter - {test_case['description']}", True, 
                                f"Found {len(properties)} properties")
                else:
                    self.log_test(f"Property Filter - {test_case['description']}", False, 
                                f"HTTP {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Property Filter - {test_case['description']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_get_specific_property(self):
        """Test retrieving a specific property by ID"""
        try:
            # First get all properties to get a valid ID
            response = self.session.get(f"{self.base_url}/properties")
            if response.status_code == 200:
                properties = response.json()
                if properties:
                    property_id = properties[0]["id"]
                    
                    # Test getting specific property
                    response = self.session.get(f"{self.base_url}/properties/{property_id}")
                    if response.status_code == 200:
                        property_data = response.json()
                        if property_data.get("id") == property_id:
                            self.log_test("Get Specific Property", True, 
                                        f"Retrieved property: {property_data.get('title', 'Unknown')}")
                            return True
                        else:
                            self.log_test("Get Specific Property", False, "Property ID mismatch")
                            return False
                    else:
                        self.log_test("Get Specific Property", False, f"HTTP {response.status_code}")
                        return False
                else:
                    self.log_test("Get Specific Property", False, "No properties available for testing")
                    return False
            else:
                self.log_test("Get Specific Property", False, "Could not retrieve properties list")
                return False
        except Exception as e:
            self.log_test("Get Specific Property", False, f"Error: {str(e)}")
            return False
    
    def test_like_system(self):
        """Test property like/unlike functionality"""
        try:
            # Get a property to like
            response = self.session.get(f"{self.base_url}/properties")
            if response.status_code == 200:
                properties = response.json()
                if properties:
                    property_id = properties[0]["id"]
                    original_likes = properties[0].get("likes", 0)
                    
                    # Test liking the property
                    like_data = {"is_liked": True}
                    response = self.session.post(f"{self.base_url}/properties/{property_id}/like", 
                                               json=like_data)
                    
                    if response.status_code == 200:
                        result = response.json()
                        new_likes = result.get("likes", 0)
                        
                        if new_likes == original_likes + 1:
                            self.log_test("Like System", True, 
                                        f"Like count increased from {original_likes} to {new_likes}")
                            
                            # Test unliking
                            unlike_data = {"is_liked": False}
                            response = self.session.post(f"{self.base_url}/properties/{property_id}/like", 
                                                       json=unlike_data)
                            if response.status_code == 200:
                                result = response.json()
                                final_likes = result.get("likes", 0)
                                if final_likes == original_likes:
                                    self.log_test("Unlike System", True, 
                                                f"Like count returned to {final_likes}")
                                    return True
                                else:
                                    self.log_test("Unlike System", False, 
                                                f"Like count incorrect: {final_likes}")
                                    return False
                            else:
                                self.log_test("Unlike System", False, f"HTTP {response.status_code}")
                                return False
                        else:
                            self.log_test("Like System", False, 
                                        f"Like count incorrect: expected {original_likes + 1}, got {new_likes}")
                            return False
                    else:
                        self.log_test("Like System", False, f"HTTP {response.status_code}")
                        return False
                else:
                    self.log_test("Like System", False, "No properties available for testing")
                    return False
            else:
                self.log_test("Like System", False, "Could not retrieve properties")
                return False
        except Exception as e:
            self.log_test("Like System", False, f"Error: {str(e)}")
            return False
    
    def test_create_comment(self):
        """Test creating comments for properties"""
        try:
            # Get a property to comment on
            response = self.session.get(f"{self.base_url}/properties")
            if response.status_code == 200:
                properties = response.json()
                if properties:
                    property_id = properties[0]["id"]
                    
                    # Create a comment
                    comment_data = {
                        "property_id": property_id,
                        "author": "Marie Nzamba",
                        "content": "Très belle propriété! Je suis intéressée par une visite. Le quartier semble très calme et bien situé."
                    }
                    
                    response = self.session.post(f"{self.base_url}/comments", json=comment_data)
                    
                    if response.status_code == 200:
                        comment = response.json()
                        if (comment.get("property_id") == property_id and 
                            comment.get("author") == "Marie Nzamba"):
                            self.log_test("Create Comment", True, 
                                        f"Comment created successfully: {comment.get('id')}")
                            return True
                        else:
                            self.log_test("Create Comment", False, "Comment data mismatch")
                            return False
                    else:
                        self.log_test("Create Comment", False, f"HTTP {response.status_code}: {response.text}")
                        return False
                else:
                    self.log_test("Create Comment", False, "No properties available for testing")
                    return False
            else:
                self.log_test("Create Comment", False, "Could not retrieve properties")
                return False
        except Exception as e:
            self.log_test("Create Comment", False, f"Error: {str(e)}")
            return False
    
    def test_get_cities(self):
        """Test retrieving cities"""
        try:
            response = self.session.get(f"{self.base_url}/locations/cities")
            if response.status_code == 200:
                cities = response.json()
                if isinstance(cities, list) and len(cities) > 0:
                    # Check for Gabonese cities
                    city_names = [city.get("name", "") for city in cities]
                    gabonese_cities = ["Libreville", "Port-Gentil", "Franceville", "Oyem", "Moanda"]
                    found_cities = [city for city in gabonese_cities if city in city_names]
                    
                    if found_cities:
                        self.log_test("Get Cities", True, 
                                    f"Retrieved {len(cities)} cities, including: {', '.join(found_cities)}")
                        return True
                    else:
                        self.log_test("Get Cities", False, "No expected Gabonese cities found")
                        return False
                else:
                    self.log_test("Get Cities", False, "No cities found or invalid format")
                    return False
            else:
                self.log_test("Get Cities", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Cities", False, f"Error: {str(e)}")
            return False
    
    def test_get_neighborhoods(self):
        """Test retrieving neighborhoods for a city"""
        try:
            # Test with Libreville
            response = self.session.get(f"{self.base_url}/locations/neighborhoods/Libreville")
            if response.status_code == 200:
                data = response.json()
                neighborhoods = data.get("neighborhoods", [])
                if neighborhoods:
                    expected_neighborhoods = ["Centre-ville", "Glass", "Akanda", "PK12"]
                    found_neighborhoods = [n for n in expected_neighborhoods if n in neighborhoods]
                    
                    if found_neighborhoods:
                        self.log_test("Get Neighborhoods", True, 
                                    f"Retrieved {len(neighborhoods)} neighborhoods for Libreville, including: {', '.join(found_neighborhoods)}")
                        return True
                    else:
                        self.log_test("Get Neighborhoods", False, "No expected neighborhoods found")
                        return False
                else:
                    self.log_test("Get Neighborhoods", False, "No neighborhoods found")
                    return False
            else:
                self.log_test("Get Neighborhoods", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Neighborhoods", False, f"Error: {str(e)}")
            return False
    
    def test_create_property(self):
        """Test creating a new property"""
        try:
            property_data = {
                "title": "Nouvelle Villa 5 chambres - Quartier Résidentiel Libreville",
                "price": 95000000,
                "type": "sale",
                "category": "Villa",
                "bedrooms": 5,
                "bathrooms": 4,
                "area": 320,
                "location": {
                    "city": "Libreville",
                    "neighborhood": "Oloumi",
                    "coordinates": [9.4536, 0.3955]
                },
                "images": [
                    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
                    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"
                ],
                "description": "Superbe villa neuve de 5 chambres dans un quartier résidentiel calme de Libreville. Construction récente avec matériaux de qualité, grand jardin paysagé et piscine. Idéale pour famille nombreuse.",
                "features": ["Piscine", "Jardin", "Garage double", "Climatisation", "Sécurité 24h"],
                "seller": {
                    "name": "Agence IMMO Gabon",
                    "phone": "+241 01 23 45 67",
                    "email": "contact@immogabon.ga"
                }
            }
            
            response = self.session.post(f"{self.base_url}/properties", json=property_data)
            
            if response.status_code == 200:
                created_property = response.json()
                self.created_property_id = created_property.get("id")
                
                if (created_property.get("title") == property_data["title"] and 
                    created_property.get("price") == property_data["price"]):
                    self.log_test("Create Property", True, 
                                f"Property created successfully: {self.created_property_id}")
                    return True
                else:
                    self.log_test("Create Property", False, "Property data mismatch")
                    return False
            else:
                self.log_test("Create Property", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Create Property", False, f"Error: {str(e)}")
            return False
    
    def test_update_property(self):
        """Test updating an existing property"""
        if not self.created_property_id:
            self.log_test("Update Property", False, "No property ID available for testing")
            return False
        
        try:
            update_data = {
                "price": 98000000,
                "description": "Superbe villa neuve de 5 chambres dans un quartier résidentiel calme de Libreville. Construction récente avec matériaux de qualité, grand jardin paysagé et piscine. Idéale pour famille nombreuse. PRIX NÉGOCIABLE!"
            }
            
            response = self.session.put(f"{self.base_url}/properties/{self.created_property_id}", 
                                      json=update_data)
            
            if response.status_code == 200:
                updated_property = response.json()
                if (updated_property.get("price") == update_data["price"] and 
                    "NÉGOCIABLE" in updated_property.get("description", "")):
                    self.log_test("Update Property", True, 
                                f"Property updated successfully: price changed to {update_data['price']}")
                    return True
                else:
                    self.log_test("Update Property", False, "Update data not reflected")
                    return False
            else:
                self.log_test("Update Property", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Update Property", False, f"Error: {str(e)}")
            return False
    
    def test_delete_property(self):
        """Test deleting a property (soft delete)"""
        if not self.created_property_id:
            self.log_test("Delete Property", False, "No property ID available for testing")
            return False
        
        try:
            response = self.session.delete(f"{self.base_url}/properties/{self.created_property_id}")
            
            if response.status_code == 200:
                result = response.json()
                if "deleted successfully" in result.get("message", "").lower():
                    # Verify property is no longer accessible
                    response = self.session.get(f"{self.base_url}/properties/{self.created_property_id}")
                    if response.status_code == 404:
                        self.log_test("Delete Property", True, 
                                    "Property deleted successfully and no longer accessible")
                        return True
                    else:
                        self.log_test("Delete Property", False, 
                                    "Property still accessible after deletion")
                        return False
                else:
                    self.log_test("Delete Property", False, "Unexpected response message")
                    return False
            else:
                self.log_test("Delete Property", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Delete Property", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🏠 IMMO&CO Backend API Test Suite")
        print(f"🌍 Testing Gabonese Real Estate Platform")
        print(f"🔗 Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Basic tests
        self.test_api_health()
        self.test_get_all_properties()
        
        # Search and filter tests
        self.test_property_filters()
        self.test_get_specific_property()
        
        # Interactive features
        self.test_like_system()
        self.test_create_comment()
        
        # Location services
        self.test_get_cities()
        self.test_get_neighborhoods()
        
        # CRUD operations
        self.test_create_property()
        self.test_update_property()
        self.test_delete_property()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {total - passed}/{total}")
        
        if total - passed > 0:
            print("\n🚨 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   ❌ {result['test']}: {result['message']}")
        
        return passed == total

if __name__ == "__main__":
    tester = IMOCOBackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)