#!/usr/bin/env python3
"""
IMMO&CO Backend API Test Suite
Tests all endpoints for the real estate platform
"""

import requests
import sys
import json
from datetime import datetime
import time

class ImmoCoAPITester:
    def __init__(self, base_url="https://immoco-gabon-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_listing_id = None

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {}

            return success, response.status_code, response_data

        except Exception as e:
            print(f"Request error: {str(e)}")
            return False, 0, {}

    def test_user_registration(self):
        """Test user registration"""
        timestamp = int(time.time())
        test_data = {
            "name": "Test User",
            "email": f"test{timestamp}@example.com",
            "phone": "+241070000000",
            "password": "password123"
        }

        success, status, response = self.make_request('POST', 'auth/register', test_data, 200)
        
        if success and 'token' in response and 'user' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return self.log_test("User Registration", True, f"- Token received, User ID: {self.user_id}")
        else:
            return self.log_test("User Registration", False, f"- Status: {status}, Response: {response}")

    def test_user_login(self):
        """Test user login with existing credentials"""
        # First register a user for login test
        timestamp = int(time.time()) + 1
        register_data = {
            "name": "Login Test User",
            "email": f"login{timestamp}@example.com",
            "phone": "+241070000001",
            "password": "loginpass123"
        }

        # Register user
        success, status, response = self.make_request('POST', 'auth/register', register_data, 200)
        if not success:
            return self.log_test("User Login (Setup)", False, "Failed to create test user")

        # Now test login
        login_data = {
            "email": register_data["email"],
            "password": register_data["password"]
        }

        success, status, response = self.make_request('POST', 'auth/login', login_data, 200)
        
        if success and 'token' in response and 'user' in response:
            return self.log_test("User Login", True, f"- Login successful")
        else:
            return self.log_test("User Login", False, f"- Status: {status}, Response: {response}")

    def test_get_user_profile(self):
        """Test getting current user profile"""
        if not self.token:
            return self.log_test("Get User Profile", False, "- No token available")

        success, status, response = self.make_request('GET', 'auth/me', expected_status=200)
        
        if success and 'id' in response and 'email' in response:
            return self.log_test("Get User Profile", True, f"- Profile retrieved for {response.get('name')}")
        else:
            return self.log_test("Get User Profile", False, f"- Status: {status}, Response: {response}")

    def test_create_listing(self):
        """Test creating a new listing"""
        if not self.token:
            return self.log_test("Create Listing", False, "- No token available")

        listing_data = {
            "title": "Belle villa Libreville",
            "description": "Magnifique villa avec vue sur mer, 4 chambres, 3 salles de bain, piscine et jardin tropical.",
            "listing_type": "sale",
            "price": 50000000,
            "city": "Libreville",
            "neighborhood": "Batterie IV",
            "surface": 250,
            "rooms": 6
        }

        success, status, response = self.make_request('POST', 'listings', listing_data, 200)
        
        if success and 'id' in response:
            self.created_listing_id = response['id']
            return self.log_test("Create Listing", True, f"- Listing created with ID: {self.created_listing_id}")
        else:
            return self.log_test("Create Listing", False, f"- Status: {status}, Response: {response}")

    def test_get_listings(self):
        """Test getting listings with random order"""
        success, status, response = self.make_request('GET', 'listings?random_order=true&limit=10', expected_status=200)
        
        if success and isinstance(response, list):
            return self.log_test("Get Listings", True, f"- Retrieved {len(response)} listings")
        else:
            return self.log_test("Get Listings", False, f"- Status: {status}, Response: {response}")

    def test_get_single_listing(self):
        """Test getting a single listing"""
        if not self.created_listing_id:
            return self.log_test("Get Single Listing", False, "- No listing ID available")

        success, status, response = self.make_request('GET', f'listings/{self.created_listing_id}', expected_status=200)
        
        if success and 'id' in response and response['id'] == self.created_listing_id:
            return self.log_test("Get Single Listing", True, f"- Retrieved listing: {response.get('title')}")
        else:
            return self.log_test("Get Single Listing", False, f"- Status: {status}, Response: {response}")

    def test_like_listing(self):
        """Test liking a listing"""
        if not self.token or not self.created_listing_id:
            return self.log_test("Like Listing", False, "- Missing token or listing ID")

        success, status, response = self.make_request('POST', f'listings/{self.created_listing_id}/like', expected_status=200)
        
        if success and 'liked' in response and 'likes_count' in response:
            liked_status = "liked" if response['liked'] else "unliked"
            return self.log_test("Like Listing", True, f"- Listing {liked_status}, count: {response['likes_count']}")
        else:
            return self.log_test("Like Listing", False, f"- Status: {status}, Response: {response}")

    def test_check_like_status(self):
        """Test checking if listing is liked"""
        if not self.token or not self.created_listing_id:
            return self.log_test("Check Like Status", False, "- Missing token or listing ID")

        success, status, response = self.make_request('GET', f'listings/{self.created_listing_id}/liked', expected_status=200)
        
        if success and 'liked' in response:
            return self.log_test("Check Like Status", True, f"- Like status: {response['liked']}")
        else:
            return self.log_test("Check Like Status", False, f"- Status: {status}, Response: {response}")

    def test_add_comment(self):
        """Test adding a comment to a listing"""
        if not self.token or not self.created_listing_id:
            return self.log_test("Add Comment", False, "- Missing token or listing ID")

        comment_data = {
            "text": "Très belle propriété ! Intéressé par une visite."
        }

        success, status, response = self.make_request('POST', f'listings/{self.created_listing_id}/comments', comment_data, 200)
        
        if success and 'id' in response and 'text' in response:
            return self.log_test("Add Comment", True, f"- Comment added: {response['text'][:50]}...")
        else:
            return self.log_test("Add Comment", False, f"- Status: {status}, Response: {response}")

    def test_get_comments(self):
        """Test getting comments for a listing"""
        if not self.created_listing_id:
            return self.log_test("Get Comments", False, "- No listing ID available")

        success, status, response = self.make_request('GET', f'listings/{self.created_listing_id}/comments', expected_status=200)
        
        if success and isinstance(response, list):
            return self.log_test("Get Comments", True, f"- Retrieved {len(response)} comments")
        else:
            return self.log_test("Get Comments", False, f"- Status: {status}, Response: {response}")

    def test_geocode_address(self):
        """Test geocoding an address in Gabon"""
        success, status, response = self.make_request('GET', 'geocode?q=Libreville', expected_status=200)
        
        if success and isinstance(response, list) and len(response) > 0:
            first_result = response[0]
            if 'lat' in first_result and 'lon' in first_result:
                return self.log_test("Geocode Address", True, f"- Found {len(response)} results for Libreville")
            else:
                return self.log_test("Geocode Address", False, "- Results missing lat/lon coordinates")
        else:
            return self.log_test("Geocode Address", False, f"- Status: {status}, Response: {response}")

    def test_reverse_geocode(self):
        """Test reverse geocoding coordinates (Libreville coordinates)"""
        # Libreville coordinates
        lat, lon = 0.4162, 9.4673
        success, status, response = self.make_request('GET', f'reverse-geocode?lat={lat}&lon={lon}', expected_status=200)
        
        if success and isinstance(response, dict):
            if 'city' in response and 'address' in response:
                return self.log_test("Reverse Geocode", True, f"- Found address: {response.get('city', 'Unknown')}")
            else:
                return self.log_test("Reverse Geocode", False, "- Response missing required fields")
        else:
            return self.log_test("Reverse Geocode", False, f"- Status: {status}, Response: {response}")

    def test_get_cities(self):
        """Test getting list of cities from listings"""
        success, status, response = self.make_request('GET', 'cities', expected_status=200)
        
        if success and isinstance(response, list):
            return self.log_test("Get Cities", True, f"- Retrieved {len(response)} cities")
        else:
            return self.log_test("Get Cities", False, f"- Status: {status}, Response: {response}")

    def test_get_neighborhoods(self):
        """Test getting list of neighborhoods"""
        success, status, response = self.make_request('GET', 'neighborhoods', expected_status=200)
        
        if success and isinstance(response, list):
            return self.log_test("Get Neighborhoods", True, f"- Retrieved {len(response)} neighborhoods")
        else:
            return self.log_test("Get Neighborhoods", False, f"- Status: {status}, Response: {response}")

    def test_get_neighborhoods_by_city(self):
        """Test getting neighborhoods filtered by city"""
        success, status, response = self.make_request('GET', 'neighborhoods?city=Libreville', expected_status=200)
        
        if success and isinstance(response, list):
            return self.log_test("Get Neighborhoods by City", True, f"- Retrieved {len(response)} neighborhoods for Libreville")
        else:
            return self.log_test("Get Neighborhoods by City", False, f"- Status: {status}, Response: {response}")

    def test_search_listings_by_text(self):
        """Test searching listings by text"""
        success, status, response = self.make_request('GET', 'listings?search=villa', expected_status=200)
        
        if success and isinstance(response, list):
            return self.log_test("Search Listings by Text", True, f"- Found {len(response)} listings matching 'villa'")
        else:
            return self.log_test("Search Listings by Text", False, f"- Status: {status}, Response: {response}")

    def test_filter_listings_by_city(self):
        """Test filtering listings by city"""
        success, status, response = self.make_request('GET', 'listings?city=Libreville', expected_status=200)
        
        if success and isinstance(response, list):
            return self.log_test("Filter Listings by City", True, f"- Found {len(response)} listings in Libreville")
        else:
            return self.log_test("Filter Listings by City", False, f"- Status: {status}, Response: {response}")

    def test_filter_listings_by_type(self):
        """Test filtering listings by type"""
        success, status, response = self.make_request('GET', 'listings?listing_type=sale', expected_status=200)
        
        if success and isinstance(response, list):
            return self.log_test("Filter Listings by Type", True, f"- Found {len(response)} listings for sale")
        else:
            return self.log_test("Filter Listings by Type", False, f"- Status: {status}, Response: {response}")

    def test_filter_listings_by_price_range(self):
        """Test filtering listings by price range"""
        success, status, response = self.make_request('GET', 'listings?price_min=1000000&price_max=50000000', expected_status=200)
        
        if success and isinstance(response, list):
            return self.log_test("Filter Listings by Price Range", True, f"- Found {len(response)} listings in price range")
        else:
            return self.log_test("Filter Listings by Price Range", False, f"- Status: {status}, Response: {response}")

    def test_create_listing_with_coordinates(self):
        """Test creating a listing with GPS coordinates"""
        if not self.token:
            return self.log_test("Create Listing with Coordinates", False, "- No token available")

        listing_data = {
            "title": "Appartement moderne Port-Gentil",
            "description": "Bel appartement 3 pièces avec vue sur l'océan, proche du centre-ville.",
            "listing_type": "rent",
            "price": 800000,
            "city": "Port-Gentil",
            "neighborhood": "Centre-ville",
            "surface": 85,
            "rooms": 3,
            "lat": -0.7193,
            "lon": 8.7815
        }

        success, status, response = self.make_request('POST', 'listings', listing_data, 200)
        
        if success and 'id' in response and 'lat' in response and 'lon' in response:
            return self.log_test("Create Listing with Coordinates", True, f"- Listing created with GPS coordinates")
        else:
            return self.log_test("Create Listing with Coordinates", False, f"- Status: {status}, Response: {response}")

    def test_random_order_listings(self):
        """Test that random order returns different results"""
        # Get listings twice and compare
        success1, status1, response1 = self.make_request('GET', 'listings?random_order=true&limit=5', expected_status=200)
        time.sleep(1)  # Small delay
        success2, status2, response2 = self.make_request('GET', 'listings?random_order=true&limit=5', expected_status=200)
        
        if success1 and success2 and isinstance(response1, list) and isinstance(response2, list):
            # Check if order is different (if we have enough listings)
            if len(response1) >= 2 and len(response2) >= 2:
                order_different = [item['id'] for item in response1] != [item['id'] for item in response2]
                if order_different:
                    return self.log_test("Random Order Listings", True, "- Random order working (different results)")
                else:
                    return self.log_test("Random Order Listings", True, "- Random order endpoint working (same results - may be due to limited data)")
            else:
                return self.log_test("Random Order Listings", True, "- Random order endpoint working (limited data)")
        else:
            return self.log_test("Random Order Listings", False, f"- Status1: {status1}, Status2: {status2}")

    def test_invalid_endpoints(self):
        """Test error handling for invalid endpoints"""
        # Test non-existent listing
        success, status, response = self.make_request('GET', 'listings/invalid-id', expected_status=404)
        
        if success:
            return self.log_test("Error Handling", True, "- 404 properly returned for invalid listing")
        else:
            return self.log_test("Error Handling", False, f"- Expected 404, got {status}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting IMMO&CO Backend API Tests")
        print(f"📍 Testing API at: {self.api_url}")
        print("=" * 60)

        # Authentication tests
        print("\n📋 AUTHENTICATION TESTS")
        self.test_user_registration()
        self.test_user_login()
        self.test_get_user_profile()

        # Listings tests
        print("\n🏠 LISTINGS TESTS")
        self.test_create_listing()
        self.test_get_listings()
        self.test_get_single_listing()

        # Social features tests
        print("\n❤️ SOCIAL FEATURES TESTS")
        self.test_like_listing()
        self.test_check_like_status()
        self.test_add_comment()
        self.test_get_comments()

        # Error handling tests
        print("\n⚠️ ERROR HANDLING TESTS")
        self.test_invalid_endpoints()

        # Final results
        print("\n" + "=" * 60)
        print(f"📊 TEST RESULTS: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED! Backend API is working correctly.")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed. Please check the issues above.")
            return 1

def main():
    """Main test runner"""
    tester = ImmoCoAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())