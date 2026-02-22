import requests
import sys
import json
from datetime import datetime

class ConcertDateTester:
    def __init__(self, base_url="https://geo-candidatures.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.venue_token = None
        self.venue_user = None
        self.venue_profile_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")

    def setup_venue(self):
        """Setup venue for testing"""
        try:
            # Register venue
            test_data = {
                "email": f"venue_date_test_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Date Test Venue",
                "role": "venue"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=test_data, timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.venue_token = data.get('token')
                self.venue_user = data.get('user')
                
                # Create venue profile
                venue_data = {
                    "name": "Date Test Jazz Club",
                    "description": "Testing concert date saving",
                    "address": "123 Test Street",
                    "city": "Paris",
                    "postal_code": "75001",
                    "latitude": 48.8566,
                    "longitude": 2.3522,
                    "phone": "+33123456789",
                    "has_stage": True,
                    "equipment": ["Piano", "Drums"],
                    "music_styles": ["Jazz", "Blues"]
                }
                
                headers = {'Authorization': f'Bearer {self.venue_token}'}
                response = requests.post(f"{self.base_url}/venues", json=venue_data, headers=headers, timeout=10)
                if response.status_code == 200:
                    venue_profile = response.json()
                    self.venue_profile_id = venue_profile.get('id')
                    self.log_test("Setup Venue", True, f"Venue created: {self.venue_profile_id}")
                    return True
                else:
                    self.log_test("Setup Venue", False, f"Profile creation failed: {response.status_code}")
                    return False
            else:
                self.log_test("Setup Venue", False, f"Registration failed: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Setup Venue", False, f"Error: {str(e)}")
            return False

    def test_concert_date_saving_issue(self):
        """Test the reported issue: Concert date not saving and displaying properly"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            
            # Test 1: Create concert with date as specified in the issue
            concert_data = {
                "date": "2026-02-20",
                "start_time": "21:00",
                "title": "Test Concert",
                "description": "Test",
                "bands": [],
                "price": "10"
            }
            
            response = requests.post(f"{self.base_url}/concerts", json=concert_data, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                concert_response = response.json()
                test_concert_id = concert_response.get('id')
                
                # Check if date field is present in response
                if 'date' not in concert_response:
                    success = False
                    details = "❌ CRITICAL: 'date' field missing from concert creation response"
                elif concert_response.get('date') != "2026-02-20":
                    success = False
                    details = f"❌ CRITICAL: Date mismatch - Expected: '2026-02-20', Got: '{concert_response.get('date')}'"
                else:
                    details = f"✅ Concert created with date: {concert_response.get('date')}"
                    
                    # Test 2: Verify date is returned in GET /api/venues/me/concerts
                    response = requests.get(f"{self.base_url}/venues/me/concerts", headers=headers, timeout=10)
                    if response.status_code == 200:
                        concerts = response.json()
                        our_concert = None
                        for concert in concerts:
                            if concert.get('id') == test_concert_id:
                                our_concert = concert
                                break
                        
                        if our_concert:
                            if 'date' not in our_concert:
                                success = False
                                details += " ❌ CRITICAL: 'date' field missing from GET /api/venues/me/concerts response"
                            elif our_concert.get('date') != "2026-02-20":
                                success = False
                                details += f" ❌ CRITICAL: Date mismatch in GET - Expected: '2026-02-20', Got: '{our_concert.get('date')}'"
                            else:
                                details += f" ✅ Date correctly returned in GET /api/venues/me/concerts: {our_concert.get('date')}"
                                
                                # Test 3: Check all required fields are present
                                required_fields = ['id', 'date', 'start_time', 'title', 'bands', 'participants_count']
                                missing_fields = []
                                for field in required_fields:
                                    if field not in our_concert:
                                        missing_fields.append(field)
                                
                                if missing_fields:
                                    details += f" ⚠️ Missing fields in response: {', '.join(missing_fields)}"
                                else:
                                    details += f" ✅ All required fields present: {', '.join(required_fields)}"
                        else:
                            success = False
                            details += " ❌ CRITICAL: Created concert not found in GET /api/venues/me/concerts"
                    else:
                        success = False
                        details += f" ❌ CRITICAL: Failed to GET /api/venues/me/concerts - Status: {response.status_code}"
            else:
                details = f"❌ CRITICAL: Failed to create concert - Status: {response.status_code}, Error: {response.text[:200]}"
            
            self.log_test("Concert Date Saving Issue", success, details)
            return success
        except Exception as e:
            self.log_test("Concert Date Saving Issue", False, f"Error: {str(e)}")
            return False

    def test_concert_date_database_verification(self):
        """Test 3: Verify concert date is properly stored in database by checking backend models"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            
            # Create another concert to test database storage
            concert_data = {
                "date": "2026-03-15",
                "start_time": "20:30",
                "title": "Database Test Concert",
                "description": "Testing database storage",
                "bands": [
                    {
                        "name": "Test Band",
                        "members_count": 4
                    }
                ],
                "price": "25€"
            }
            
            response = requests.post(f"{self.base_url}/concerts", json=concert_data, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                concert_response = response.json()
                db_test_concert_id = concert_response.get('id')
                
                # Verify the concert can be retrieved with all data intact
                response = requests.get(f"{self.base_url}/concerts", timeout=10)
                if response.status_code == 200:
                    all_concerts = response.json()
                    our_concert = None
                    for concert in all_concerts:
                        if concert.get('id') == db_test_concert_id:
                            our_concert = concert
                            break
                    
                    if our_concert:
                        # Check if date field is properly stored and retrieved
                        stored_date = our_concert.get('date')
                        if stored_date == "2026-03-15":
                            details = f"✅ Database storage verified - Date correctly stored and retrieved: {stored_date}"
                            
                            # Additional verification: check other fields
                            verification_results = []
                            expected_values = {
                                'start_time': '20:30',
                                'title': 'Database Test Concert',
                                'price': '25€'
                            }
                            
                            for field, expected in expected_values.items():
                                actual = our_concert.get(field)
                                if actual == expected:
                                    verification_results.append(f"{field}:✅")
                                else:
                                    verification_results.append(f"{field}:❌({actual})")
                            
                            details += f" | Fields: {', '.join(verification_results)}"
                        else:
                            success = False
                            details = f"❌ Database storage issue - Expected date: '2026-03-15', Got: '{stored_date}'"
                    else:
                        success = False
                        details = "❌ Concert not found in public concerts list"
                else:
                    success = False
                    details = f"❌ Failed to retrieve concerts list - Status: {response.status_code}"
            else:
                details = f"❌ Failed to create test concert - Status: {response.status_code}, Error: {response.text[:200]}"
            
            self.log_test("Concert Date Database Verification", success, details)
            return success
        except Exception as e:
            self.log_test("Concert Date Database Verification", False, f"Error: {str(e)}")
            return False

    def run_tests(self):
        """Run concert date tests"""
        print("🎵 Testing Concert Date Saving Issue...")
        print("=" * 50)
        
        if not self.setup_venue():
            print("❌ Setup failed - stopping tests")
            return
        
        # Run the specific tests for the reported issue
        self.test_concert_date_saving_issue()
        self.test_concert_date_database_verification()
        
        print("=" * 50)
        print("🎵 Concert Date Tests Complete")

if __name__ == "__main__":
    tester = ConcertDateTester()
    tester.run_tests()