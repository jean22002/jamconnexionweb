import requests
import sys
import json
from datetime import datetime

class JamConnexionAPITester:
    def __init__(self, base_url="https://jamsession-1.preview.emergentagent.com/api"):
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

    def test_health_check(self):
        """Test basic API health"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Response: {data.get('status', 'unknown')}"
            self.log_test("Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("Health Check", False, f"Error: {str(e)}")
            return False

    def test_register_musician(self):
        """Test musician registration"""
        try:
            test_data = {
                "email": f"musician_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Test Musician",
                "role": "musician"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=test_data, timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.musician_token = data.get('token')
                self.musician_user = data.get('user')
                details = f"User ID: {self.musician_user.get('id')}, Role: {self.musician_user.get('role')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Register Musician", success, details)
            return success
        except Exception as e:
            self.log_test("Register Musician", False, f"Error: {str(e)}")
            return False

    def test_register_venue(self):
        """Test venue registration"""
        try:
            test_data = {
                "email": f"venue_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Test Venue",
                "role": "venue"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=test_data, timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.venue_token = data.get('token')
                self.venue_user = data.get('user')
                details = f"User ID: {self.venue_user.get('id')}, Trial: {self.venue_user.get('subscription_status')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Register Venue", success, details)
            return success
        except Exception as e:
            self.log_test("Register Venue", False, f"Error: {str(e)}")
            return False

    def test_login(self):
        """Test login functionality"""
        try:
            # Test with musician credentials
            login_data = {
                "email": self.musician_user['email'],
                "password": "TestPass123!"
            }
            
            response = requests.post(f"{self.base_url}/auth/login", json=login_data, timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Login successful for {data.get('user', {}).get('role', 'unknown')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Login", success, details)
            return success
        except Exception as e:
            self.log_test("Login", False, f"Error: {str(e)}")
            return False

    def test_auth_me(self):
        """Test /auth/me endpoint"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            response = requests.get(f"{self.base_url}/auth/me", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"User: {data.get('name')}, Role: {data.get('role')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Auth Me", success, details)
            return success
        except Exception as e:
            self.log_test("Auth Me", False, f"Error: {str(e)}")
            return False

    def test_create_venue_profile(self):
        """Test venue profile creation"""
        try:
            venue_data = {
                "name": "Test Jazz Club",
                "description": "A cozy jazz club for live music",
                "address": "123 Music Street",
                "city": "Paris",
                "postal_code": "75001",
                "latitude": 48.8566,
                "longitude": 2.3522,
                "phone": "+33123456789",
                "website": "https://testjazzclub.com",
                "facebook": "https://facebook.com/testjazzclub",
                "instagram": "@testjazzclub",
                "has_stage": True,
                "has_sound_engineer": True,
                "equipment": ["Piano", "Drums", "Sound System"],
                "music_styles": ["Jazz", "Blues", "Soul"],
                "jam_days": ["Friday", "Saturday"],
                "opening_hours": "19:00-02:00"
            }
            
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            response = requests.post(f"{self.base_url}/venues", json=venue_data, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.venue_profile_id = data.get('id')
                details = f"Venue ID: {self.venue_profile_id}, Name: {data.get('name')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Create Venue Profile", success, details)
            return success
        except Exception as e:
            self.log_test("Create Venue Profile", False, f"Error: {str(e)}")
            return False

    def test_create_musician_profile(self):
        """Test enhanced musician profile creation"""
        try:
            musician_data = {
                "pseudo": "JazzMaster",
                "age": 28,
                "profile_image": "https://example.com/profile.jpg",
                "bio": "Passionate jazz guitarist with 10 years experience",
                "instruments": ["Guitar", "Bass"],
                "music_styles": ["Jazz", "Blues", "Rock"],
                "experience_years": 10,
                "city": "Paris",
                "phone": "+33987654321",
                "website": "https://johndoe.music",
                "facebook": "https://facebook.com/johndoemusic",
                "instagram": "@johndoemusic",
                "youtube": "https://youtube.com/johndoemusic",
                "bandcamp": "https://johndoe.bandcamp.com",
                "has_band": True,
                "band": {
                    "name": "The Jazz Collective",
                    "photo": "https://example.com/band.jpg",
                    "facebook": "https://facebook.com/jazzcollective",
                    "instagram": "@jazzcollective",
                    "youtube": "https://youtube.com/jazzcollective",
                    "website": "https://jazzcollective.com",
                    "bandcamp": "https://jazzcollective.bandcamp.com"
                },
                "concerts": [
                    {
                        "date": "2024-12-25",
                        "venue_name": "Blue Note",
                        "city": "Paris",
                        "description": "Christmas Jazz Night"
                    }
                ]
            }
            
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            response = requests.post(f"{self.base_url}/musicians", json=musician_data, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.musician_profile_id = data.get('id')
                details = f"Musician ID: {self.musician_profile_id}, Name: {data.get('name')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Create Musician Profile", success, details)
            return success
        except Exception as e:
            self.log_test("Create Musician Profile", False, f"Error: {str(e)}")
            return False

    def test_list_venues(self):
        """Test listing venues"""
        try:
            response = requests.get(f"{self.base_url}/venues", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Found {len(data)} venues"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("List Venues", success, details)
            return success
        except Exception as e:
            self.log_test("List Venues", False, f"Error: {str(e)}")
            return False

    def test_nearby_venues(self):
        """Test nearby venues search"""
        try:
            search_data = {
                "latitude": 48.8566,
                "longitude": 2.3522,
                "radius_km": 50.0
            }
            
            response = requests.post(f"{self.base_url}/venues/nearby", json=search_data, timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Found {len(data)} nearby venues"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Nearby Venues Search", success, details)
            return success
        except Exception as e:
            self.log_test("Nearby Venues Search", False, f"Error: {str(e)}")
            return False

    def test_get_venue_profile(self):
        """Test getting venue profile"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            response = requests.get(f"{self.base_url}/venues/me", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Venue: {data.get('name')}, City: {data.get('city')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Get Venue Profile", success, details)
            return success
        except Exception as e:
            self.log_test("Get Venue Profile", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🎵 Starting Jam Connexion API Tests...")
        print(f"Testing against: {self.base_url}")
        print("-" * 50)
        
        # Initialize test variables
        self.musician_token = None
        self.venue_token = None
        self.musician_user = None
        self.venue_user = None
        self.venue_profile_id = None
        self.musician_profile_id = None
        
        # Run tests in order
        tests = [
            self.test_health_check,
            self.test_register_musician,
            self.test_register_venue,
            self.test_login,
            self.test_auth_me,
            self.test_create_venue_profile,
            self.test_create_musician_profile,
            self.test_list_venues,
            self.test_nearby_venues,
            self.test_get_venue_profile
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_test(test.__name__, False, f"Unexpected error: {str(e)}")
        
        # Print summary
        print("-" * 50)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = JamConnexionAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'success_rate': (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
                'timestamp': datetime.now().isoformat()
            },
            'test_results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())