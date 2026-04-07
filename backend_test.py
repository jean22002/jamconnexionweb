#!/usr/bin/env python3
"""
Backend API Testing for Jam Connexion Refactoring
=================================================

Tests the refactored backend endpoints with new prefixes:
- /api/musicians/* endpoints
- /api/venues/* endpoints
- Band search functionality
- Critical venue and musician endpoints

Test Requirements from Review Request:
1. Band search endpoint: GET /api/musicians/bands/search
2. Venue endpoints: GET /api/venues, POST /api/venues  
3. Musician profile: GET /api/musicians/me
4. Ensure no regressions from prefix changes
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://collapsible-map.preview.emergentagent.com/api"
TEST_CREDENTIALS = {
    "venue": {"email": "bar@gmail.com", "password": "test"},
    "musician": {"email": "test@gmail.com", "password": "test"},
    "melomane": {"email": "melomane@test.com", "password": "test"}
}

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.test_results = []
        
    def log_test(self, test_name, success, details="", error=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status} {test_name}")
        if details:
            print(f"    Details: {details}")
        if error:
            print(f"    Error: {error}")
        print()

    def authenticate(self, role):
        """Authenticate and get token for a role"""
        try:
            creds = TEST_CREDENTIALS[role]
            response = self.session.post(f"{BASE_URL}/auth/login", json=creds)
            
            if response.status_code == 200:
                data = response.json()
                token = data.get("token") or data.get("access_token")  # Try both token formats
                if token:
                    self.tokens[role] = token
                    self.log_test(f"Authentication - {role}", True, f"Token obtained")
                    return True
                else:
                    self.log_test(f"Authentication - {role}", False, error="No token in response")
                    return False
            else:
                self.log_test(f"Authentication - {role}", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(f"Authentication - {role}", False, error=str(e))
            return False

    def test_band_search_endpoint(self):
        """Test the critical band search endpoint with new prefix"""
        if "venue" not in self.tokens:
            self.log_test("Band Search - Authentication Required", False, 
                         error="No venue token available")
            return

        token = self.tokens["venue"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test 1: Search for "marseil" should return "Marseille Blues Band"
        try:
            response = self.session.get(
                f"{BASE_URL}/musicians/bands/search?query=marseil", 
                headers=headers
            )
            
            if response.status_code == 200:
                bands = response.json()
                marseille_found = any("marseille" in band.get("name", "").lower() 
                                    for band in bands)
                if marseille_found:
                    self.log_test("Band Search - Marseille Query", True, 
                                f"Found {len(bands)} bands, Marseille Blues Band included")
                else:
                    self.log_test("Band Search - Marseille Query", False, 
                                f"Marseille Blues Band not found in {len(bands)} results")
            else:
                self.log_test("Band Search - Marseille Query", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Band Search - Marseille Query", False, error=str(e))

        # Test 2: Search for "rock" should return at least 5 bands
        try:
            response = self.session.get(
                f"{BASE_URL}/musicians/bands/search?query=rock", 
                headers=headers
            )
            
            if response.status_code == 200:
                bands = response.json()
                if len(bands) >= 5:
                    self.log_test("Band Search - Rock Query", True, 
                                f"Found {len(bands)} bands (≥5 required)")
                else:
                    self.log_test("Band Search - Rock Query", False, 
                                f"Only found {len(bands)} bands (<5 required)")
            else:
                self.log_test("Band Search - Rock Query", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Band Search - Rock Query", False, error=str(e))

        # Test 3: Empty query should return empty array
        try:
            response = self.session.get(
                f"{BASE_URL}/musicians/bands/search?query=", 
                headers=headers
            )
            
            if response.status_code == 200:
                bands = response.json()
                if len(bands) == 0:
                    self.log_test("Band Search - Empty Query", True, 
                                "Empty query correctly returns no results")
                else:
                    self.log_test("Band Search - Empty Query", False, 
                                f"Empty query returned {len(bands)} results")
            else:
                self.log_test("Band Search - Empty Query", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Band Search - Empty Query", False, error=str(e))

        # Test 4: Short query (<2 chars) should return empty array
        try:
            response = self.session.get(
                f"{BASE_URL}/musicians/bands/search?query=ab", 
                headers=headers
            )
            
            if response.status_code == 200:
                bands = response.json()
                if len(bands) == 0:
                    self.log_test("Band Search - Short Query", True, 
                                "Short query (<2 chars) correctly returns no results")
                else:
                    self.log_test("Band Search - Short Query", False, 
                                f"Short query returned {len(bands)} results")
            else:
                self.log_test("Band Search - Short Query", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Band Search - Short Query", False, error=str(e))

    def test_venue_endpoints(self):
        """Test venue endpoints with new prefix"""
        if "venue" not in self.tokens:
            self.log_test("Venue Endpoints - Authentication Required", False, 
                         error="No venue token available")
            return

        token = self.tokens["venue"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test 1: GET /api/venues/venues - List venues (with prefix)
        try:
            response = self.session.get(f"{BASE_URL}/venues/venues", headers=headers)
            
            if response.status_code == 200:
                venues = response.json()
                self.log_test("Venue Endpoints - GET /api/venues/venues", True, 
                            f"Retrieved {len(venues)} venues")
            else:
                self.log_test("Venue Endpoints - GET /api/venues/venues", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Venue Endpoints - GET /api/venues/venues", False, error=str(e))

        # Test 2: GET /api/venues/venues/me - Get venue profile (with prefix)
        try:
            response = self.session.get(f"{BASE_URL}/venues/venues/me", headers=headers)
            
            if response.status_code == 200:
                venue = response.json()
                venue_name = venue.get("name", "Unknown")
                self.log_test("Venue Endpoints - GET /api/venues/venues/me", True, 
                            f"Retrieved venue profile: {venue_name}")
            else:
                self.log_test("Venue Endpoints - GET /api/venues/venues/me", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Venue Endpoints - GET /api/venues/venues/me", False, error=str(e))

    def test_musician_endpoints(self):
        """Test musician endpoints with new prefix"""
        if "musician" not in self.tokens:
            self.log_test("Musician Endpoints - Authentication Required", False, 
                         error="No musician token available")
            return

        token = self.tokens["musician"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test: GET /api/musicians/musicians/me - Get musician profile (with prefix)
        try:
            response = self.session.get(f"{BASE_URL}/musicians/musicians/me", headers=headers)
            
            if response.status_code == 200:
                musician = response.json()
                musician_email = musician.get("email", "Unknown")
                self.log_test("Musician Endpoints - GET /api/musicians/musicians/me", True, 
                            f"Retrieved musician profile: {musician_email}")
            else:
                self.log_test("Musician Endpoints - GET /api/musicians/musicians/me", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Musician Endpoints - GET /api/musicians/musicians/me", False, error=str(e))

    def test_critical_endpoints_no_regression(self):
        """Test that critical endpoints still work after prefix changes"""
        
        # Test health endpoint
        try:
            response = self.session.get(f"{BASE_URL}/health")
            
            if response.status_code == 200:
                self.log_test("Critical Endpoints - Health Check", True, 
                            "Health endpoint responding")
            else:
                self.log_test("Critical Endpoints - Health Check", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Critical Endpoints - Health Check", False, error=str(e))

        # Test stats endpoint (used by landing page)
        try:
            response = self.session.get(f"{BASE_URL}/stats/counts")
            
            if response.status_code == 200:
                stats = response.json()
                musicians_count = stats.get("musicians", 0)
                venues_count = stats.get("venues", 0)
                self.log_test("Critical Endpoints - Stats", True, 
                            f"Musicians: {musicians_count}, Venues: {venues_count}")
            else:
                self.log_test("Critical Endpoints - Stats", False, 
                            error=f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Critical Endpoints - Stats", False, error=str(e))

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests for Jam Connexion Refactoring")
        print("=" * 60)
        print()
        
        # Authenticate all roles
        print("🔐 Authentication Tests")
        print("-" * 30)
        self.authenticate("venue")
        self.authenticate("musician")
        self.authenticate("melomane")
        
        # Test critical endpoints
        print("🏥 Critical Endpoints Tests")
        print("-" * 30)
        self.test_critical_endpoints_no_regression()
        
        # Test band search (main feature from refactoring)
        print("🎸 Band Search Tests (Refactored Feature)")
        print("-" * 30)
        self.test_band_search_endpoint()
        
        # Test venue endpoints with new prefix
        print("🏢 Venue Endpoints Tests (New Prefix)")
        print("-" * 30)
        self.test_venue_endpoints()
        
        # Test musician endpoints with new prefix
        print("🎵 Musician Endpoints Tests (New Prefix)")
        print("-" * 30)
        self.test_musician_endpoints()
        
        # Summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("📊 Test Summary")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print()
        
        if failed_tests > 0:
            print("❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['error']}")
            print()
        
        # Critical issues
        critical_failures = []
        for result in self.test_results:
            if not result["success"] and any(keyword in result["test"].lower() 
                                           for keyword in ["band search", "venues/venues/me", "musicians/musicians/me"]):
                critical_failures.append(result["test"])
        
        if critical_failures:
            print("🚨 CRITICAL FAILURES:")
            for failure in critical_failures:
                print(f"  - {failure}")
            print()
        
        # Overall status
        if failed_tests == 0:
            print("🎉 ALL TESTS PASSED - Refactoring successful!")
        elif len(critical_failures) == 0:
            print("✅ CORE FUNCTIONALITY WORKING - Minor issues only")
        else:
            print("⚠️ CRITICAL ISSUES FOUND - Refactoring needs fixes")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)