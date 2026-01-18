#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class PlanningSlotTester:
    def __init__(self, base_url="https://venue-connections.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.venue_token = None
        self.musician_token = None
        self.venue_profile_id = None
        self.complete_planning_slot_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        return success

    def setup_test_accounts(self):
        """Create test venue and musician accounts"""
        try:
            # Create venue account
            venue_data = {
                "email": f"venue_planning_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Test Planning Venue",
                "role": "venue"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=venue_data, timeout=10)
            if response.status_code != 200:
                return self.log_test("Setup Venue Account", False, f"Failed to create venue: {response.status_code}")
            
            venue_auth = response.json()
            self.venue_token = venue_auth.get('token')
            
            # Create venue profile
            venue_profile_data = {
                "name": "Test Planning Venue",
                "description": "A venue for testing planning slots",
                "address": "123 Test Street",
                "city": "Paris",
                "postal_code": "75001",
                "latitude": 48.8566,
                "longitude": 2.3522,
                "phone": "+33123456789",
                "has_stage": True,
                "equipment": ["Piano", "Drums"],
                "music_styles": ["Rock", "Jazz"]
            }
            
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            response = requests.post(f"{self.base_url}/venues", json=venue_profile_data, headers=headers, timeout=10)
            if response.status_code != 200:
                return self.log_test("Setup Venue Profile", False, f"Failed to create venue profile: {response.status_code}")
            
            venue_profile = response.json()
            self.venue_profile_id = venue_profile.get('id')
            
            # Create musician account
            musician_data = {
                "email": f"musician_planning_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Test Planning Musician",
                "role": "musician"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=musician_data, timeout=10)
            if response.status_code != 200:
                return self.log_test("Setup Musician Account", False, f"Failed to create musician: {response.status_code}")
            
            musician_auth = response.json()
            self.musician_token = musician_auth.get('token')
            
            # Create musician profile
            musician_profile_data = {
                "pseudo": "TestPlanningMusician",
                "instruments": ["Guitar"],
                "music_styles": ["Rock"]
            }
            
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            response = requests.post(f"{self.base_url}/musicians", json=musician_profile_data, headers=headers, timeout=10)
            if response.status_code != 200:
                return self.log_test("Setup Musician Profile", False, f"Failed to create musician profile: {response.status_code}")
            
            return self.log_test("Setup Test Accounts", True, "Venue and musician accounts created successfully")
            
        except Exception as e:
            return self.log_test("Setup Test Accounts", False, f"Error: {str(e)}")

    def test_planning_slot_complete_data_bug_fix(self):
        """Test Bug Fix: Planning slot with ALL fields (catering, accommodation, etc.)"""
        try:
            headers_venue = {'Authorization': f'Bearer {self.venue_token}'}
            
            # Test 1: Create planning slot with ALL fields as sent by frontend
            complete_planning_data = {
                "date": "2025-01-20",
                "time": "20:00",
                "title": "Soirée Rock Progressive",
                "description": "Concert rock avec ambiance progressive",
                "expected_band_style": "Rock",
                "expected_attendance": 150,
                "payment": "300€",
                "num_bands_needed": 2,
                "has_catering": True,
                "catering_drinks": 5,
                "catering_respect": True,
                "catering_tbd": False,
                "has_accommodation": True,
                "accommodation_capacity": 4,
                "accommodation_tbd": False,
                "music_styles": ["Rock", "Progressive"],
                "is_open": True
            }
            
            response = requests.post(f"{self.base_url}/planning", json=complete_planning_data, headers=headers_venue, timeout=10)
            success = response.status_code == 200
            
            if success:
                planning_response = response.json()
                self.complete_planning_slot_id = planning_response.get('id')
                details = f"Complete planning slot created: {planning_response.get('date')}"
                
                # Test 2: Retrieve the planning slot and verify ALL fields are saved
                response = requests.get(f"{self.base_url}/planning", timeout=10)
                if response.status_code == 200:
                    all_slots = response.json()
                    # Find our slot
                    our_slot = None
                    for slot in all_slots:
                        if slot.get('id') == self.complete_planning_slot_id:
                            our_slot = slot
                            break
                    
                    if our_slot:
                        # Check if all critical fields are present
                        missing_fields = []
                        expected_fields = {
                            'time': '20:00',
                            'title': 'Soirée Rock Progressive', 
                            'expected_band_style': 'Rock',
                            'expected_attendance': 150,
                            'payment': '300€',
                            'num_bands_needed': 2,
                            'has_catering': True,
                            'catering_drinks': 5,
                            'catering_respect': True,
                            'catering_tbd': False,
                            'has_accommodation': True,
                            'accommodation_capacity': 4,
                            'accommodation_tbd': False
                        }
                        
                        for field, expected_value in expected_fields.items():
                            if field not in our_slot:
                                missing_fields.append(f"{field} (missing)")
                            elif our_slot.get(field) != expected_value:
                                missing_fields.append(f"{field} (expected: {expected_value}, got: {our_slot.get(field)})")
                        
                        if missing_fields:
                            details += f" ❌ MISSING/INCORRECT FIELDS: {', '.join(missing_fields)}"
                            success = False
                        else:
                            details += " ✅ ALL FIELDS CORRECTLY SAVED AND RETRIEVED"
                    else:
                        details += " ❌ Could not find created slot in list"
                        success = False
                else:
                    details += f" ❌ Failed to retrieve slots: {response.status_code}"
                    success = False
            else:
                details = f"❌ Failed to create slot: {response.status_code}, Error: {response.text[:100]}"
            
            return self.log_test("Planning Slot Complete Data Bug Fix", success, details)
        except Exception as e:
            return self.log_test("Planning Slot Complete Data Bug Fix", False, f"Error: {str(e)}")

    def test_planning_slot_musician_view_bug_fix(self):
        """Test Bug Fix: Musician can see all planning slot details"""
        try:
            # Test that musicians can see all the details when viewing venue planning slots
            if not self.complete_planning_slot_id:
                return self.log_test("Planning Slot Musician View Bug Fix", False, "No complete planning slot created in previous test")
            
            # Get venue planning slots (public endpoint)
            response = requests.get(f"{self.base_url}/venues/{self.venue_profile_id}/planning", timeout=10)
            success = response.status_code == 200
            
            if success:
                venue_slots = response.json()
                our_slot = None
                for slot in venue_slots:
                    if slot.get('id') == self.complete_planning_slot_id:
                        our_slot = slot
                        break
                
                if our_slot:
                    # Check that musicians can see all the important details
                    visible_fields = []
                    expected_visible_fields = {
                        'date': '2025-01-20',
                        'time': '20:00', 
                        'title': 'Soirée Rock Progressive',
                        'expected_band_style': 'Rock',
                        'expected_attendance': 150,
                        'payment': '300€',
                        'has_catering': True,
                        'has_accommodation': True,
                        'description': 'Concert rock avec ambiance progressive'
                    }
                    
                    missing_for_musicians = []
                    for field, expected_value in expected_visible_fields.items():
                        if field in our_slot and our_slot.get(field) == expected_value:
                            visible_fields.append(field)
                        else:
                            missing_for_musicians.append(f"{field} (expected: {expected_value}, got: {our_slot.get(field)})")
                    
                    if missing_for_musicians:
                        details = f"❌ MUSICIANS CANNOT SEE: {', '.join(missing_for_musicians)}"
                        success = False
                    else:
                        details = f"✅ MUSICIANS CAN SEE ALL DETAILS: {', '.join(visible_fields)}"
                else:
                    details = "❌ Could not find complete planning slot in venue planning"
                    success = False
            else:
                details = f"❌ Failed to get venue planning: {response.status_code}"
            
            return self.log_test("Planning Slot Musician View Bug Fix", success, details)
        except Exception as e:
            return self.log_test("Planning Slot Musician View Bug Fix", False, f"Error: {str(e)}")

    def run_tests(self):
        """Run all planning slot tests"""
        print("🎵 Testing Planning Slots Bug Fixes...")
        print(f"Testing against: {self.base_url}")
        print("-" * 50)
        
        # Setup
        if not self.setup_test_accounts():
            print("❌ Setup failed, aborting tests")
            return False
        
        # Run tests
        test1_result = self.test_planning_slot_complete_data_bug_fix()
        test2_result = self.test_planning_slot_musician_view_bug_fix()
        
        print("-" * 50)
        passed = sum([test1_result, test2_result])
        total = 2
        print(f"📊 Tests completed: {passed}/{total} passed")
        success_rate = (passed / total * 100) if total > 0 else 0
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        return passed == total

if __name__ == "__main__":
    tester = PlanningSlotTester()
    success = tester.run_tests()
    sys.exit(0 if success else 1)