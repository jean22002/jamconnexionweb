#!/usr/bin/env python3
"""
Jam Connexion - Venue Profile Creation Bug Testing
Tests for the critical bug: "Venue profile not found" after creating venue profile
"""

import requests
import sys
import json
from datetime import datetime
import time

class VenueProfileBugTester:
    def __init__(self, base_url="https://admin-analytics-44.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test accounts
        self.venue_token = None
        self.venue_user = None
        self.venue_profile_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")

    # ============= TEST 1: COMPLETE VENUE PROFILE CREATION FLOW =============
    
    def test_complete_venue_profile_creation_flow(self):
        """Test 1: Complete venue profile creation flow (MAIN TEST)"""
        try:
            print("\n🏢 TESTING COMPLETE VENUE PROFILE CREATION FLOW")
            print("-" * 50)
            
            # Step 1: Create venue account
            print("Step 1: Creating venue account...")
            venue_data = {
                "email": f"test_venue_bug_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Mon Établissement Test",
                "role": "venue"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=venue_data, timeout=10)
            if response.status_code != 200:
                self.log_test("Step 1 - Venue Account Creation", False, f"Failed to create venue account: {response.status_code}, {response.text}")
                return False
                
            venue_auth = response.json()
            self.venue_token = venue_auth.get('token')
            self.venue_user = venue_auth.get('user')
            
            self.log_test("Step 1 - Venue Account Creation", True, f"Account created: {venue_data['email']}")
            
            # Step 2: Create venue profile with minimal required data
            print("Step 2: Creating venue profile...")
            venue_profile_data = {
                "name": "Mon Établissement",
                "address": "123 Rue Test",
                "city": "Paris",
                "postal_code": "75001",
                "latitude": 48.8566,
                "longitude": 2.3522
            }
            
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            response = requests.post(f"{self.base_url}/venues", json=venue_profile_data, headers=headers, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Step 2 - Venue Profile Creation", False, f"Failed to create venue profile: {response.status_code}, {response.text}")
                return False
                
            venue_profile = response.json()
            self.venue_profile_id = venue_profile.get('id')
            
            self.log_test("Step 2 - Venue Profile Creation", True, f"Profile created with ID: {self.venue_profile_id}")
            
            # Step 3: Retrieve venue profile (this is where the bug occurs)
            print("Step 3: Retrieving venue profile...")
            response = requests.get(f"{self.base_url}/venues/me", headers=headers, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Step 3 - Venue Profile Retrieval", False, f"❌ BUG CONFIRMED: GET /api/venues/me returned {response.status_code}, {response.text}")
                return False
            
            retrieved_profile = response.json()
            retrieved_id = retrieved_profile.get('id')
            
            if retrieved_id != self.venue_profile_id:
                self.log_test("Step 3 - Venue Profile Retrieval", False, f"❌ BUG CONFIRMED: Profile ID mismatch. Created: {self.venue_profile_id}, Retrieved: {retrieved_id}")
                return False
            
            self.log_test("Step 3 - Venue Profile Retrieval", True, f"Profile retrieved successfully: {retrieved_id}")
            
            # Step 4: Verify all required fields are present
            print("Step 4: Verifying profile data integrity...")
            required_fields = ["name", "address", "city", "postal_code", "latitude", "longitude"]
            missing_fields = []
            
            for field in required_fields:
                if field not in retrieved_profile or retrieved_profile[field] is None:
                    missing_fields.append(field)
            
            if missing_fields:
                self.log_test("Step 4 - Profile Data Integrity", False, f"Missing fields: {missing_fields}")
                return False
            
            self.log_test("Step 4 - Profile Data Integrity", True, "All required fields present")
            
            # Overall test result
            self.log_test("Complete Venue Profile Creation Flow", True, "✅ NO BUG DETECTED - Complete flow working correctly")
            return True
            
        except Exception as e:
            self.log_test("Complete Venue Profile Creation Flow", False, f"Error: {str(e)}")
            return False

    # ============= TEST 2: VERIFY PROFILE EXISTS IN MONGODB =============
    
    def test_verify_profile_in_database(self):
        """Test 2: Verify that the profile exists in MongoDB"""
        try:
            if not self.venue_profile_id:
                self.log_test("Verify Profile in Database", False, "No venue profile ID available")
                return False
            
            # Try to get the profile by ID (public endpoint)
            response = requests.get(f"{self.base_url}/venues/{self.venue_profile_id}", timeout=10)
            
            if response.status_code != 200:
                self.log_test("Verify Profile in Database", False, f"Profile not found in database: {response.status_code}")
                return False
            
            profile = response.json()
            
            # Verify user_id matches
            if profile.get('user_id') != self.venue_user.get('id'):
                self.log_test("Verify Profile in Database", False, f"User ID mismatch. Profile user_id: {profile.get('user_id')}, Account user_id: {self.venue_user.get('id')}")
                return False
            
            self.log_test("Verify Profile in Database", True, f"Profile exists in database with correct user_id: {profile.get('user_id')}")
            return True
            
        except Exception as e:
            self.log_test("Verify Profile in Database", False, f"Error: {str(e)}")
            return False

    # ============= TEST 3: CREATE PROFILE WITH ALL FIELDS =============
    
    def test_create_profile_with_all_fields(self):
        """Test 3: Create venue profile with ALL possible fields"""
        try:
            # Create another venue account for this test
            venue_data = {
                "email": f"test_venue_full_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Établissement Complet",
                "role": "venue"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=venue_data, timeout=10)
            if response.status_code != 200:
                self.log_test("Create Profile with All Fields - Account Setup", False, f"Failed to create account: {response.status_code}")
                return False
                
            auth = response.json()
            token = auth.get('token')
            
            # Create profile with ALL fields
            full_profile_data = {
                "name": "Établissement Complet Test",
                "description": "Description complète de l'établissement",
                "address": "456 Avenue Complète",
                "city": "Lyon",
                "postal_code": "69001",
                "latitude": 45.7640,
                "longitude": 4.8357,
                "phone": "+33123456789",
                "email": "contact@etablissement.com",
                "website": "https://etablissement.com",
                "facebook": "https://facebook.com/etablissement",
                "instagram": "https://instagram.com/etablissement",
                "has_stage": True,
                "has_sound_engineer": True,
                "has_instruments": True,
                "has_parking": True,
                "equipment": ["Piano", "Drums", "Microphones"],
                "music_styles": ["Jazz", "Rock", "Blues"],
                "capacity": 150,
                "jam_days": ["Friday", "Saturday"],
                "opening_hours": "19:00-02:00",
                "price_range": "€€",
                "allow_messages_from": "everyone"
            }
            
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.post(f"{self.base_url}/venues", json=full_profile_data, headers=headers, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Create Profile with All Fields - Creation", False, f"Failed to create full profile: {response.status_code}, {response.text}")
                return False
            
            created_profile = response.json()
            profile_id = created_profile.get('id')
            
            # Retrieve and verify all fields
            response = requests.get(f"{self.base_url}/venues/me", headers=headers, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Create Profile with All Fields - Retrieval", False, f"Failed to retrieve full profile: {response.status_code}")
                return False
            
            retrieved_profile = response.json()
            
            # Check that all fields are saved
            saved_fields = []
            missing_fields = []
            
            for field, value in full_profile_data.items():
                if field in retrieved_profile and retrieved_profile[field] == value:
                    saved_fields.append(field)
                else:
                    missing_fields.append(f"{field} (expected: {value}, got: {retrieved_profile.get(field)})")
            
            if missing_fields:
                self.log_test("Create Profile with All Fields", False, f"Missing/incorrect fields: {missing_fields}")
                return False
            
            self.log_test("Create Profile with All Fields", True, f"All {len(saved_fields)} fields saved correctly")
            return True
            
        except Exception as e:
            self.log_test("Create Profile with All Fields", False, f"Error: {str(e)}")
            return False

    # ============= TEST 4: DOUBLE CREATION (SHOULD FAIL) =============
    
    def test_double_creation_should_fail(self):
        """Test 4: Try to create a second profile (should fail)"""
        try:
            if not self.venue_token:
                self.log_test("Double Creation Should Fail", False, "No venue token available")
                return False
            
            # Try to create another profile with the same account
            duplicate_profile_data = {
                "name": "Deuxième Établissement",
                "address": "789 Rue Duplicate",
                "city": "Marseille",
                "postal_code": "13001",
                "latitude": 43.2965,
                "longitude": 5.3698
            }
            
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            response = requests.post(f"{self.base_url}/venues", json=duplicate_profile_data, headers=headers, timeout=10)
            
            # Should return 400 Bad Request
            if response.status_code == 400 and "already exists" in response.text.lower():
                self.log_test("Double Creation Should Fail", True, f"Correctly rejected duplicate profile: {response.status_code}")
                return True
            else:
                self.log_test("Double Creation Should Fail", False, f"Should have rejected duplicate. Got: {response.status_code}, {response.text}")
                return False
            
        except Exception as e:
            self.log_test("Double Creation Should Fail", False, f"Error: {str(e)}")
            return False

    # ============= TEST 5: PROFILE UPDATE =============
    
    def test_profile_update(self):
        """Test 5: Update venue profile"""
        try:
            if not self.venue_token or not self.venue_profile_id:
                self.log_test("Profile Update", False, "No venue token or profile ID available")
                return False
            
            # Update the profile
            update_data = {
                "name": "Mon Établissement Modifié",
                "address": "123 Rue Test Modifiée",
                "city": "Paris",
                "postal_code": "75002",  # Changed
                "latitude": 48.8566,
                "longitude": 2.3522,
                "description": "Description mise à jour",  # Added
                "phone": "+33987654321"  # Added
            }
            
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            response = requests.put(f"{self.base_url}/venues", json=update_data, headers=headers, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Profile Update - PUT Request", False, f"Failed to update profile: {response.status_code}, {response.text}")
                return False
            
            # Retrieve updated profile
            response = requests.get(f"{self.base_url}/venues/me", headers=headers, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Profile Update - Retrieval", False, f"Failed to retrieve updated profile: {response.status_code}")
                return False
            
            updated_profile = response.json()
            
            # Verify changes were saved
            if (updated_profile.get('name') == update_data['name'] and 
                updated_profile.get('postal_code') == update_data['postal_code'] and
                updated_profile.get('description') == update_data['description'] and
                updated_profile.get('phone') == update_data['phone']):
                
                self.log_test("Profile Update", True, "Profile updated successfully with all changes")
                return True
            else:
                self.log_test("Profile Update", False, f"Update not saved correctly. Expected changes not found.")
                return False
            
        except Exception as e:
            self.log_test("Profile Update", False, f"Error: {str(e)}")
            return False

    # ============= MAIN TEST RUNNER =============
    
    def run_all_tests(self):
        """Run all venue profile creation tests"""
        print("🏢 JAM CONNEXION - VENUE PROFILE CREATION BUG TESTING")
        print("=" * 60)
        print("Testing critical bug: 'Venue profile not found' after creation")
        print()
        
        # Main test - Complete flow
        success_main = self.test_complete_venue_profile_creation_flow()
        
        if success_main:
            print("\n✅ MAIN TEST PASSED - No bug detected in basic flow")
            print("Running additional verification tests...")
            
            # Additional tests
            print("\n🔍 ADDITIONAL VERIFICATION TESTS")
            print("-" * 40)
            self.test_verify_profile_in_database()
            self.test_create_profile_with_all_fields()
            self.test_double_creation_should_fail()
            self.test_profile_update()
        else:
            print("\n❌ MAIN TEST FAILED - Bug confirmed!")
            print("Skipping additional tests due to main test failure.")
        
        # Summary
        print()
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print()
            print("🎉 ALL TESTS PASSED!")
            print("✅ Venue profile creation flow working correctly")
            print("✅ No 'Venue profile not found' bug detected")
            print("✅ All CRUD operations functional")
            return True
        else:
            print()
            print("❌ SOME TESTS FAILED - BUG DETECTED!")
            failed_tests = [r for r in self.test_results if not r['success']]
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
            
            # Specific bug analysis
            main_test_failed = any(r['test'] == 'Complete Venue Profile Creation Flow' and not r['success'] for r in self.test_results)
            if main_test_failed:
                print()
                print("🚨 CRITICAL BUG CONFIRMED:")
                print("   The reported 'Venue profile not found' bug is REAL")
                print("   Users cannot retrieve their venue profile after creation")
                print("   This blocks the entire venue onboarding flow")
            
            return False

if __name__ == "__main__":
    tester = VenueProfileBugTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)