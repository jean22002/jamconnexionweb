import requests
import sys
import json
from datetime import datetime

class PlanningSlotsTester:
    def __init__(self, base_url="https://melomane-endpoint.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

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

    def setup_test_venue(self):
        """Setup test venue for planning slots testing"""
        try:
            # Register venue
            test_data = {
                "email": f"venue_planning_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Test Planning Venue",
                "role": "venue"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=test_data, timeout=10)
            if response.status_code != 200:
                return False, f"Failed to register venue: {response.status_code}"
            
            data = response.json()
            self.venue_token = data.get('token')
            self.venue_user = data.get('user')
            
            # Create venue profile
            venue_data = {
                "name": "Test Planning Bar",
                "description": "Test venue for planning slots",
                "address": "123 Test Street",
                "city": "Paris",
                "postal_code": "75001",
                "latitude": 48.8566,
                "longitude": 2.3522,
                "phone": "+33123456789",
                "has_stage": True,
                "has_sound_engineer": True,
                "equipment": ["Piano", "Drums"],
                "music_styles": ["Rock", "Jazz"],
                "opening_hours": "19:00-02:00"
            }
            
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            response = requests.post(f"{self.base_url}/venues", json=venue_data, headers=headers, timeout=10)
            if response.status_code != 200:
                return False, f"Failed to create venue profile: {response.status_code}"
            
            venue_profile = response.json()
            self.venue_profile_id = venue_profile.get('id')
            
            return True, f"Venue setup complete: {self.venue_profile_id}"
        except Exception as e:
            return False, f"Setup error: {str(e)}"

    def test_planning_slot_complete_data_storage(self):
        """Test 1: Complete data storage with ALL fields"""
        try:
            headers_venue = {'Authorization': f'Bearer {self.venue_token}'}
            
            # Create planning slot with ALL fields as mentioned in review request
            complete_planning_data = {
                "date": "2025-01-25",
                "time": "21:00",
                "title": "Grande Soirée Rock",
                "description": "Concert rock progressif avec ambiance electrique",
                "expected_band_style": "Rock",
                "expected_attendance": 200,
                "payment": "400€",
                "num_bands_needed": 2,
                "has_catering": True,
                "catering_drinks": 6,
                "catering_respect": True,
                "catering_tbd": False,
                "has_accommodation": True,
                "accommodation_capacity": 6,
                "accommodation_tbd": False,
                "music_styles": ["Rock", "Progressive"],
                "is_open": True
            }
            
            response = requests.post(f"{self.base_url}/planning", json=complete_planning_data, headers=headers_venue, timeout=10)
            success = response.status_code == 200
            
            if success:
                planning_response = response.json()
                self.complete_planning_slot_id = planning_response.get('id')
                details = f"Planning slot created: {planning_response.get('date')}"
                
                # Retrieve the planning slot and verify ALL fields are saved
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
                            'time': '21:00',
                            'title': 'Grande Soirée Rock', 
                            'expected_band_style': 'Rock',
                            'expected_attendance': 200,
                            'payment': '400€',
                            'num_bands_needed': 2,
                            'has_catering': True,
                            'catering_drinks': 6,
                            'catering_respect': True,
                            'catering_tbd': False,
                            'has_accommodation': True,
                            'accommodation_capacity': 6,
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
                            details += " ✅ ALL FIELDS CORRECTLY SAVED AND RETRIEVED - BACKEND MODELS FIXED!"
                    else:
                        details += " ❌ Could not find created slot in list"
                        success = False
                else:
                    details += f" ❌ Failed to retrieve slots: {response.status_code}"
                    success = False
            else:
                details = f"❌ Failed to create slot: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Test 1: Complete Data Storage", success, details)
            return success
        except Exception as e:
            self.log_test("Test 1: Complete Data Storage", False, f"Error: {str(e)}")
            return False

    def test_planning_slot_musician_visibility(self):
        """Test 2: Musician visibility with all enriched fields"""
        try:
            # Test that musicians can see all the details when viewing venue planning slots
            if not hasattr(self, 'complete_planning_slot_id'):
                self.log_test("Test 2: Musician Visibility", False, "No complete planning slot created in previous test")
                return False
            
            # Get venue planning slots (public endpoint that musicians use)
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
                        'date': '2025-01-25',
                        'time': '21:00', 
                        'title': 'Grande Soirée Rock',
                        'expected_band_style': 'Rock',
                        'expected_attendance': 200,
                        'payment': '400€',
                        'has_catering': True,
                        'catering_drinks': 6,
                        'catering_respect': True,
                        'catering_tbd': False,
                        'has_accommodation': True,
                        'accommodation_capacity': 6,
                        'accommodation_tbd': False,
                        'description': 'Concert rock progressif avec ambiance electrique'
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
                        details = f"✅ MUSICIANS CAN SEE ALL DETAILS - BACKEND RESPONSE MODEL FIXED! Fields: {', '.join(visible_fields)}"
                else:
                    details = "❌ Could not find complete planning slot in venue planning"
                    success = False
            else:
                details = f"❌ Failed to get venue planning: {response.status_code}"
            
            self.log_test("Test 2: Musician Visibility", success, details)
            return success
        except Exception as e:
            self.log_test("Test 2: Musician Visibility", False, f"Error: {str(e)}")
            return False

    def run_tests(self):
        """Run all planning slots tests"""
        print("🧪 PLANNING SLOTS BUG FIX TESTING")
        print("=" * 50)
        
        # Setup
        setup_success, setup_details = self.setup_test_venue()
        self.log_test("Setup Test Venue", setup_success, setup_details)
        
        if not setup_success:
            print("❌ Setup failed, cannot continue tests")
            return
        
        # Run tests
        self.test_planning_slot_complete_data_storage()
        self.test_planning_slot_musician_visibility()
        
        # Summary
        print("\n" + "=" * 50)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        print(f"📈 Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL PLANNING SLOTS TESTS PASSED - BUG FIXES VALIDATED!")
        else:
            print("⚠️ Some tests failed - bug fixes may need additional work")

if __name__ == "__main__":
    tester = PlanningSlotsTester()
    tester.run_tests()