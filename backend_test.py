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
    def __init__(self, base_url="https://realestate-hub-130.preview.emergentagent.com"):
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