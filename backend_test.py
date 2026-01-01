import requests
import sys
import json
from datetime import datetime

class JamConnexionAPITester:
    def __init__(self, base_url="https://musicjams.preview.emergentagent.com/api"):
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
                details = f"Musician ID: {self.musician_profile_id}, Pseudo: {data.get('pseudo')}, Band: {data.get('has_band')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Create Enhanced Musician Profile", success, details)
            return success
        except Exception as e:
            self.log_test("Create Enhanced Musician Profile", False, f"Error: {str(e)}")
            return False

    def test_friend_request_system(self):
        """Test friend request functionality"""
        try:
            # Create second musician for friend request
            test_data = {
                "email": f"musician2_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Test Musician 2",
                "role": "musician"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=test_data, timeout=10)
            if response.status_code != 200:
                self.log_test("Friend Request System - Setup", False, "Failed to create second musician")
                return False
                
            musician2_data = response.json()
            musician2_token = musician2_data.get('token')
            musician2_user = musician2_data.get('user')
            
            # Create profile for second musician
            profile_data = {"pseudo": "TestFriend", "instruments": ["Piano"]}
            headers2 = {'Authorization': f'Bearer {musician2_token}'}
            requests.post(f"{self.base_url}/musicians", json=profile_data, headers=headers2, timeout=10)
            
            # Send friend request
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            friend_request_data = {"to_user_id": musician2_user['id']}
            response = requests.post(f"{self.base_url}/friends/request", json=friend_request_data, headers=headers, timeout=10)
            
            success = response.status_code == 200
            if success:
                details = "Friend request sent successfully"
                
                # Test getting friend requests
                response = requests.get(f"{self.base_url}/friends/requests", headers=headers2, timeout=10)
                if response.status_code == 200:
                    requests_data = response.json()
                    details += f", Received {len(requests_data)} friend request(s)"
                    
                    # Accept friend request if any
                    if requests_data:
                        request_id = requests_data[0]['id']
                        response = requests.post(f"{self.base_url}/friends/accept/{request_id}", headers=headers2, timeout=10)
                        if response.status_code == 200:
                            details += ", Friend request accepted"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Friend Request System", success, details)
            return success
        except Exception as e:
            self.log_test("Friend Request System", False, f"Error: {str(e)}")
            return False

    def test_venue_subscription_system(self):
        """Test venue subscription functionality"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            
            # Subscribe to venue
            response = requests.post(f"{self.base_url}/venues/{self.venue_profile_id}/subscribe", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                details = "Subscription successful"
                
                # Check subscription status
                response = requests.get(f"{self.base_url}/venues/{self.venue_profile_id}/subscription-status", headers=headers, timeout=10)
                if response.status_code == 200:
                    status_data = response.json()
                    details += f", Subscribed: {status_data.get('subscribed')}"
                
                # Get my subscriptions
                response = requests.get(f"{self.base_url}/my-subscriptions", headers=headers, timeout=10)
                if response.status_code == 200:
                    subs_data = response.json()
                    details += f", Total subscriptions: {len(subs_data)}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Venue Subscription System", success, details)
            return success
        except Exception as e:
            self.log_test("Venue Subscription System", False, f"Error: {str(e)}")
            return False

    def test_jam_events(self):
        """Test jam event creation and listing"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            
            # Create jam event
            jam_data = {
                "date": "2024-12-20",
                "start_time": "20:00",
                "end_time": "23:00",
                "music_styles": ["Jazz", "Blues"],
                "rules": "Bring your own instrument",
                "has_instruments": True,
                "has_pa_system": True,
                "instruments_available": ["Piano", "Drums"],
                "additional_info": "Open mic night"
            }
            
            response = requests.post(f"{self.base_url}/jams", json=jam_data, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                jam_response = response.json()
                self.jam_id = jam_response.get('id')
                details = f"Jam created: {jam_response.get('date')} at {jam_response.get('venue_name')}"
                
                # Test listing jams
                response = requests.get(f"{self.base_url}/jams", timeout=10)
                if response.status_code == 200:
                    jams_data = response.json()
                    details += f", Total jams: {len(jams_data)}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Jam Events", success, details)
            return success
        except Exception as e:
            self.log_test("Jam Events", False, f"Error: {str(e)}")
            return False

    def test_concert_events(self):
        """Test concert event creation and listing"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            
            # Create concert event
            concert_data = {
                "date": "2024-12-25",
                "start_time": "21:00",
                "title": "Christmas Jazz Night",
                "description": "Special Christmas concert",
                "bands": [
                    {
                        "name": "The Jazz Collective",
                        "photo": "https://example.com/band.jpg",
                        "facebook": "https://facebook.com/jazzcollective"
                    }
                ],
                "price": "15€"
            }
            
            response = requests.post(f"{self.base_url}/concerts", json=concert_data, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                concert_response = response.json()
                self.concert_id = concert_response.get('id')
                details = f"Concert created: {concert_response.get('title')} on {concert_response.get('date')}"
                
                # Test listing concerts
                response = requests.get(f"{self.base_url}/concerts", timeout=10)
                if response.status_code == 200:
                    concerts_data = response.json()
                    details += f", Total concerts: {len(concerts_data)}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Concert Events", success, details)
            return success
        except Exception as e:
            self.log_test("Concert Events", False, f"Error: {str(e)}")
            return False

    def test_planning_and_applications(self):
        """Test planning slots and application system"""
        try:
            headers_venue = {'Authorization': f'Bearer {self.venue_token}'}
            headers_musician = {'Authorization': f'Bearer {self.musician_token}'}
            
            # Create planning slot
            planning_data = {
                "date": "2024-12-30",
                "music_styles": ["Rock", "Pop"],
                "description": "Looking for energetic rock band",
                "is_open": True
            }
            
            response = requests.post(f"{self.base_url}/planning", json=planning_data, headers=headers_venue, timeout=10)
            success = response.status_code == 200
            
            if success:
                planning_response = response.json()
                self.planning_slot_id = planning_response.get('id')
                details = f"Planning slot created for {planning_response.get('date')}"
                
                # Test application submission
                application_data = {
                    "planning_slot_id": self.planning_slot_id,
                    "band_name": "The Rock Stars",
                    "description": "High energy rock band",
                    "music_style": "Rock",
                    "contact_email": "rockstars@test.com",
                    "contact_phone": "+33123456789"
                }
                
                response = requests.post(f"{self.base_url}/applications", json=application_data, headers=headers_musician, timeout=10)
                if response.status_code == 200:
                    app_response = response.json()
                    self.application_id = app_response.get('id')
                    details += f", Application submitted: {app_response.get('band_name')}"
                    
                    # Test viewing applications
                    response = requests.get(f"{self.base_url}/planning/{self.planning_slot_id}/applications", headers=headers_venue, timeout=10)
                    if response.status_code == 200:
                        apps_data = response.json()
                        details += f", Applications received: {len(apps_data)}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Planning and Applications", success, details)
            return success
        except Exception as e:
            self.log_test("Planning and Applications", False, f"Error: {str(e)}")
            return False

    def test_notifications(self):
        """Test notification system"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            
            # Get notifications
            response = requests.get(f"{self.base_url}/notifications", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                notifications_data = response.json()
                details = f"Retrieved {len(notifications_data)} notifications"
                
                # Get unread count
                response = requests.get(f"{self.base_url}/notifications/unread-count", headers=headers, timeout=10)
                if response.status_code == 200:
                    count_data = response.json()
                    details += f", Unread: {count_data.get('count', 0)}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Notifications", success, details)
            return success
        except Exception as e:
            self.log_test("Notifications", False, f"Error: {str(e)}")
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
            self.test_get_venue_profile,
            self.test_friend_request_system,
            self.test_venue_subscription_system,
            self.test_jam_events,
            self.test_concert_events,
            self.test_planning_and_applications,
            self.test_notifications
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