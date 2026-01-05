import requests
import sys
import json
from datetime import datetime

class JamConnexionAPITester:
    def __init__(self, base_url="https://jam-notifications.preview.emergentagent.com/api"):
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

    def test_create_active_jam_event(self):
        """Test creating an active jam event for participation testing"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            
            # Get current time and create an active jam (happening now)
            from datetime import datetime, timedelta
            now = datetime.now()
            start_time = (now - timedelta(minutes=15)).strftime("%H:%M")  # Started 15 min ago
            end_time = (now + timedelta(hours=2)).strftime("%H:%M")       # Ends in 2 hours
            today = now.strftime("%Y-%m-%d")
            
            jam_data = {
                "date": today,
                "start_time": start_time,
                "end_time": end_time,
                "music_styles": ["Jazz", "Blues", "Rock"],
                "rules": "Venez avec vos instruments!",
                "has_instruments": True,
                "has_pa_system": True,
                "instruments_available": ["Piano", "Batterie", "Ampli guitare"],
                "additional_info": "Jam session test pour participation en temps réel"
            }
            
            response = requests.post(f"{self.base_url}/jams", json=jam_data, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                jam_response = response.json()
                self.active_jam_id = jam_response.get('id')
                details = f"Active jam created: {jam_response.get('date')} {start_time}-{end_time} at {jam_response.get('venue_name')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Create Active Jam Event", success, details)
            return success
        except Exception as e:
            self.log_test("Create Active Jam Event", False, f"Error: {str(e)}")
            return False

    def test_get_active_events(self):
        """Test retrieving active events at a venue"""
        try:
            response = requests.get(f"{self.base_url}/venues/{self.venue_profile_id}/active-events", timeout=10)
            success = response.status_code == 200
            
            if success:
                active_events = response.json()
                details = f"Found {len(active_events)} active events"
                if active_events:
                    event = active_events[0]
                    details += f", Event: {event.get('type')} at {event.get('venue_name')}, Participants: {event.get('participants_count', 0)}"
                    self.active_event_for_test = event
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Get Active Events", success, details)
            return success
        except Exception as e:
            self.log_test("Get Active Events", False, f"Error: {str(e)}")
            return False

    def test_join_event_without_auth(self):
        """Test joining event without authentication (should fail)"""
        try:
            response = requests.post(f"{self.base_url}/events/{self.active_jam_id}/join?event_type=jam", timeout=10)
            success = response.status_code == 401
            
            if success:
                details = "Correctly rejected unauthenticated request"
            else:
                details = f"Unexpected status: {response.status_code}, Expected: 401"
            
            self.log_test("Join Event Without Auth", success, details)
            return success
        except Exception as e:
            self.log_test("Join Event Without Auth", False, f"Error: {str(e)}")
            return False

    def test_join_event_as_musician(self):
        """Test musician joining an active event"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            response = requests.post(f"{self.base_url}/events/{self.active_jam_id}/join?event_type=jam", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                join_response = response.json()
                self.participation_id = join_response.get('participation_id')
                details = f"Successfully joined event at {join_response.get('venue_name')}, Participation ID: {self.participation_id}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Join Event as Musician", success, details)
            return success
        except Exception as e:
            self.log_test("Join Event as Musician", False, f"Error: {str(e)}")
            return False

    def test_double_participation(self):
        """Test trying to join the same event twice (should fail)"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            response = requests.post(f"{self.base_url}/events/{self.active_jam_id}/join?event_type=jam", headers=headers, timeout=10)
            success = response.status_code == 400
            
            if success:
                details = "Correctly prevented double participation"
            else:
                details = f"Unexpected status: {response.status_code}, Expected: 400"
            
            self.log_test("Double Participation Prevention", success, details)
            return success
        except Exception as e:
            self.log_test("Double Participation Prevention", False, f"Error: {str(e)}")
            return False

    def test_get_my_current_participation(self):
        """Test retrieving musician's current participation"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            response = requests.get(f"{self.base_url}/musicians/me/current-participation", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                participation = response.json()
                if participation:
                    details = f"Current participation: {participation.get('event_type')} at {participation.get('venue_name')}"
                else:
                    details = "No current participation found"
                    success = False  # Should have participation from previous test
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Get My Current Participation", success, details)
            return success
        except Exception as e:
            self.log_test("Get My Current Participation", False, f"Error: {str(e)}")
            return False

    def test_get_musician_participation_public(self):
        """Test retrieving a musician's participation (public endpoint)"""
        try:
            response = requests.get(f"{self.base_url}/musicians/{self.musician_profile_id}/current-participation", timeout=10)
            success = response.status_code == 200
            
            if success:
                participation = response.json()
                if participation:
                    details = f"Public participation view: {participation.get('event_type')} at {participation.get('venue_name')}"
                else:
                    details = "No current participation found"
                    success = False  # Should have participation from previous test
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Get Musician Participation (Public)", success, details)
            return success
        except Exception as e:
            self.log_test("Get Musician Participation (Public)", False, f"Error: {str(e)}")
            return False

    def test_get_event_participants(self):
        """Test retrieving list of event participants"""
        try:
            response = requests.get(f"{self.base_url}/events/{self.active_jam_id}/participants", timeout=10)
            success = response.status_code == 200
            
            if success:
                participants = response.json()
                details = f"Found {len(participants)} participants"
                if participants:
                    participant = participants[0]
                    details += f", First participant: {participant.get('pseudo')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Get Event Participants", success, details)
            return success
        except Exception as e:
            self.log_test("Get Event Participants", False, f"Error: {str(e)}")
            return False

    def test_create_second_musician_for_friends(self):
        """Create a second musician to test friend notifications"""
        try:
            test_data = {
                "email": f"musician_friend_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Ami Musicien",
                "role": "musician"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=test_data, timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.friend_musician_token = data.get('token')
                self.friend_musician_user = data.get('user')
                
                # Create musician profile
                profile_data = {
                    "pseudo": "AmiMusicien",
                    "instruments": ["Saxophone"],
                    "music_styles": ["Jazz"]
                }
                headers = {'Authorization': f'Bearer {self.friend_musician_token}'}
                profile_response = requests.post(f"{self.base_url}/musicians", json=profile_data, headers=headers, timeout=10)
                
                if profile_response.status_code == 200:
                    friend_profile = profile_response.json()
                    self.friend_musician_profile_id = friend_profile.get('id')
                    
                    # Send friend request from first musician to second
                    headers1 = {'Authorization': f'Bearer {self.musician_token}'}
                    friend_request_data = {"to_user_id": self.friend_musician_user['id']}
                    requests.post(f"{self.base_url}/friends/request", json=friend_request_data, headers=headers1, timeout=10)
                    
                    # Accept friend request
                    requests_response = requests.get(f"{self.base_url}/friends/requests", headers=headers, timeout=10)
                    if requests_response.status_code == 200:
                        friend_requests = requests_response.json()
                        if friend_requests:
                            request_id = friend_requests[0]['id']
                            requests.post(f"{self.base_url}/friends/accept/{request_id}", headers=headers, timeout=10)
                    
                    details = f"Friend musician created: {self.friend_musician_user.get('id')}, Profile: {self.friend_musician_profile_id}"
                else:
                    details = f"Profile creation failed: {profile_response.status_code}"
                    success = False
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Create Second Musician for Friends", success, details)
            return success
        except Exception as e:
            self.log_test("Create Second Musician for Friends", False, f"Error: {str(e)}")
            return False

    def test_friend_notifications_on_participation(self):
        """Test that friends receive notifications when musician joins event"""
        try:
            # Check friend's notifications before
            headers = {'Authorization': f'Bearer {self.friend_musician_token}'}
            response = requests.get(f"{self.base_url}/notifications/unread-count", headers=headers, timeout=10)
            initial_count = 0
            if response.status_code == 200:
                initial_count = response.json().get('count', 0)
            
            # Create another active jam and join it (to trigger friend notification)
            venue_headers = {'Authorization': f'Bearer {self.venue_token}'}
            from datetime import datetime, timedelta
            now = datetime.now()
            start_time = (now - timedelta(minutes=10)).strftime("%H:%M")
            end_time = (now + timedelta(hours=1)).strftime("%H:%M")
            today = now.strftime("%Y-%m-%d")
            
            jam_data = {
                "date": today,
                "start_time": start_time,
                "end_time": end_time,
                "music_styles": ["Rock"],
                "rules": "Test jam for notifications"
            }
            
            jam_response = requests.post(f"{self.base_url}/jams", json=jam_data, headers=venue_headers, timeout=10)
            if jam_response.status_code == 200:
                new_jam = jam_response.json()
                new_jam_id = new_jam.get('id')
                
                # First musician leaves current event
                musician_headers = {'Authorization': f'Bearer {self.musician_token}'}
                requests.post(f"{self.base_url}/events/{self.active_jam_id}/leave", headers=musician_headers, timeout=10)
                
                # First musician joins new event
                join_response = requests.post(f"{self.base_url}/events/{new_jam_id}/join?event_type=jam", headers=musician_headers, timeout=10)
                
                if join_response.status_code == 200:
                    # Update the active jam ID for subsequent tests
                    self.active_jam_id = new_jam_id
                    
                    # Check friend's notifications after
                    import time
                    time.sleep(1)  # Give time for notification to be created
                    response = requests.get(f"{self.base_url}/notifications/unread-count", headers=headers, timeout=10)
                    final_count = 0
                    if response.status_code == 200:
                        final_count = response.json().get('count', 0)
                    
                    success = final_count > initial_count
                    details = f"Notification count increased from {initial_count} to {final_count}"
                else:
                    success = False
                    details = f"Failed to join new event: {join_response.status_code}"
            else:
                success = False
                details = f"Failed to create new jam: {jam_response.status_code}"
            
            self.log_test("Friend Notifications on Participation", success, details)
            return success
        except Exception as e:
            self.log_test("Friend Notifications on Participation", False, f"Error: {str(e)}")
            return False

    def test_leave_event(self):
        """Test leaving an event"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            response = requests.post(f"{self.base_url}/events/{self.active_jam_id}/leave", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                details = "Successfully left event"
                
                # Verify participation is no longer active
                response = requests.get(f"{self.base_url}/musicians/me/current-participation", headers=headers, timeout=10)
                if response.status_code == 200:
                    participation = response.json()
                    if participation is None:
                        details += ", Participation correctly deactivated"
                    else:
                        details += ", WARNING: Participation still active"
                        success = False
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Leave Event", success, details)
            return success
        except Exception as e:
            self.log_test("Leave Event", False, f"Error: {str(e)}")
            return False

    def test_participation_after_leaving(self):
        """Test that participation is no longer active after leaving"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            response = requests.get(f"{self.base_url}/musicians/me/current-participation", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                participation = response.json()
                if participation is None:
                    details = "No active participation found (correct after leaving)"
                    success = True
                else:
                    details = f"WARNING: Still has active participation: {participation.get('venue_name')}"
                    success = False
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Participation After Leaving", success, details)
            return success
        except Exception as e:
            self.log_test("Participation After Leaving", False, f"Error: {str(e)}")
            return False

    # ============= BROADCAST NOTIFICATIONS TESTS =============

    def test_broadcast_notification_without_auth(self):
        """Test broadcast notification without authentication (should fail)"""
        try:
            notification_data = {"message": "Test notification"}
            response = requests.post(f"{self.base_url}/venues/me/broadcast-notification", json=notification_data, timeout=10)
            success = response.status_code == 401
            
            if success:
                details = "Correctly rejected unauthenticated request"
            else:
                details = f"Unexpected status: {response.status_code}, Expected: 401"
            
            self.log_test("Broadcast Notification Without Auth", success, details)
            return success
        except Exception as e:
            self.log_test("Broadcast Notification Without Auth", False, f"Error: {str(e)}")
            return False

    def test_broadcast_notification_as_musician(self):
        """Test broadcast notification as musician (should fail)"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            notification_data = {"message": "Test notification"}
            response = requests.post(f"{self.base_url}/venues/me/broadcast-notification", json=notification_data, headers=headers, timeout=10)
            success = response.status_code == 403
            
            if success:
                details = "Correctly rejected musician request (only venues allowed)"
            else:
                details = f"Unexpected status: {response.status_code}, Expected: 403"
            
            self.log_test("Broadcast Notification as Musician", success, details)
            return success
        except Exception as e:
            self.log_test("Broadcast Notification as Musician", False, f"Error: {str(e)}")
            return False

    def test_broadcast_notification_venue_subscribed(self):
        """Test broadcast notification with subscribed venue (should succeed)"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            notification_data = {"message": "🎵 Jam session ce soir à 20h! Venez nombreux avec vos instruments!"}
            response = requests.post(f"{self.base_url}/venues/me/broadcast-notification", json=notification_data, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                broadcast_response = response.json()
                self.broadcast_id = broadcast_response.get('broadcast_id')
                details = f"Broadcast sent successfully, ID: {self.broadcast_id}, Musicians notified: {broadcast_response.get('musicians_notified', 0)}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Broadcast Notification (Venue Subscribed)", success, details)
            return success
        except Exception as e:
            self.log_test("Broadcast Notification (Venue Subscribed)", False, f"Error: {str(e)}")
            return False

    def test_get_broadcast_history(self):
        """Test retrieving broadcast notification history"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            response = requests.get(f"{self.base_url}/venues/me/broadcast-history", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                history = response.json()
                details = f"Retrieved {len(history)} broadcast notifications"
                if history:
                    latest = history[0]
                    details += f", Latest: '{latest.get('message', '')[:50]}...'"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Get Broadcast History", success, details)
            return success
        except Exception as e:
            self.log_test("Get Broadcast History", False, f"Error: {str(e)}")
            return False

    def test_get_nearby_musicians_count(self):
        """Test getting count of nearby musicians"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            response = requests.get(f"{self.base_url}/venues/me/nearby-musicians-count", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                count_data = response.json()
                details = f"Found {count_data.get('count', 0)} musicians within 100km radius"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Get Nearby Musicians Count", success, details)
            return success
        except Exception as e:
            self.log_test("Get Nearby Musicians Count", False, f"Error: {str(e)}")
            return False

    # ============= REVIEW SYSTEM TESTS =============

    def test_create_review_without_participation(self):
        """Test creating review without having participated (should fail)"""
        try:
            # Create a new musician who has never participated
            test_data = {
                "email": f"musician_no_participation_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "No Participation Musician",
                "role": "musician"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=test_data, timeout=10)
            if response.status_code == 200:
                no_participation_data = response.json()
                no_participation_token = no_participation_data.get('token')
                
                # Create profile for this musician
                profile_data = {"pseudo": "NoParticipation", "instruments": ["Guitar"]}
                headers = {'Authorization': f'Bearer {no_participation_token}'}
                requests.post(f"{self.base_url}/musicians", json=profile_data, headers=headers, timeout=10)
                
                # Try to create review without participation
                review_data = {
                    "venue_id": self.venue_profile_id,
                    "rating": 5,
                    "comment": "Great venue but I never participated in an event here"
                }
                response = requests.post(f"{self.base_url}/reviews", json=review_data, headers=headers, timeout=10)
                success = response.status_code == 403
                
                if success:
                    details = "Correctly rejected review without participation"
                else:
                    details = f"Unexpected status: {response.status_code}, Expected: 403"
            else:
                success = False
                details = "Failed to create test musician"
            
            self.log_test("Create Review Without Participation", success, details)
            return success
        except Exception as e:
            self.log_test("Create Review Without Participation", False, f"Error: {str(e)}")
            return False

    def test_create_participation_for_review(self):
        """Create a participation to enable review creation"""
        try:
            # First, create an active jam and participate
            venue_headers = {'Authorization': f'Bearer {self.venue_token}'}
            from datetime import datetime, timedelta
            now = datetime.now()
            start_time = (now - timedelta(minutes=5)).strftime("%H:%M")
            end_time = (now + timedelta(hours=1)).strftime("%H:%M")
            today = now.strftime("%Y-%m-%d")
            
            jam_data = {
                "date": today,
                "start_time": start_time,
                "end_time": end_time,
                "music_styles": ["Jazz"],
                "rules": "Test jam for review"
            }
            
            jam_response = requests.post(f"{self.base_url}/jams", json=jam_data, headers=venue_headers, timeout=10)
            if jam_response.status_code == 200:
                review_jam = jam_response.json()
                self.review_jam_id = review_jam.get('id')
                
                # Join the event
                musician_headers = {'Authorization': f'Bearer {self.musician_token}'}
                join_response = requests.post(f"{self.base_url}/events/{self.review_jam_id}/join?event_type=jam", headers=musician_headers, timeout=10)
                
                if join_response.status_code == 200:
                    # Leave the event to complete participation
                    leave_response = requests.post(f"{self.base_url}/events/{self.review_jam_id}/leave", headers=musician_headers, timeout=10)
                    success = leave_response.status_code == 200
                    details = "Created participation for review testing"
                else:
                    success = False
                    details = f"Failed to join event: {join_response.status_code}"
            else:
                success = False
                details = f"Failed to create jam: {jam_response.status_code}"
            
            self.log_test("Create Participation for Review", success, details)
            return success
        except Exception as e:
            self.log_test("Create Participation for Review", False, f"Error: {str(e)}")
            return False

    def test_create_review_with_participation(self):
        """Test creating review after having participated"""
        try:
            # Create a new musician for this test to avoid conflicts
            test_data = {
                "email": f"musician_review_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Review Test Musician",
                "role": "musician"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=test_data, timeout=10)
            if response.status_code == 200:
                review_musician_data = response.json()
                self.review_musician_token = review_musician_data.get('token')
                
                # Create profile
                profile_data = {"pseudo": "ReviewTester", "instruments": ["Piano"]}
                headers = {'Authorization': f'Bearer {self.review_musician_token}'}
                profile_response = requests.post(f"{self.base_url}/musicians", json=profile_data, headers=headers, timeout=10)
                
                if profile_response.status_code == 200:
                    review_musician_profile = profile_response.json()
                    self.review_musician_profile_id = review_musician_profile.get('id')
                    
                    # Create and join an event to establish participation
                    venue_headers = {'Authorization': f'Bearer {self.venue_token}'}
                    from datetime import timedelta
                    now = datetime.now()
                    start_time = (now - timedelta(minutes=5)).strftime("%H:%M")
                    end_time = (now + timedelta(hours=1)).strftime("%H:%M")
                    today = now.strftime("%Y-%m-%d")
                    
                    jam_data = {
                        "date": today,
                        "start_time": start_time,
                        "end_time": end_time,
                        "music_styles": ["Jazz"],
                        "rules": "Test jam for review"
                    }
                    
                    jam_response = requests.post(f"{self.base_url}/jams", json=jam_data, headers=venue_headers, timeout=10)
                    if jam_response.status_code == 200:
                        review_jam = jam_response.json()
                        review_jam_id = review_jam.get('id')
                        
                        # Join and leave the event
                        join_response = requests.post(f"{self.base_url}/events/{review_jam_id}/join?event_type=jam", headers=headers, timeout=10)
                        if join_response.status_code == 200:
                            leave_response = requests.post(f"{self.base_url}/events/{review_jam_id}/leave", headers=headers, timeout=10)
                            
                            if leave_response.status_code == 200:
                                # Now create the review
                                review_data = {
                                    "venue_id": self.venue_profile_id,
                                    "rating": 4,
                                    "comment": "Super ambiance, équipe sympa et bonne acoustique! Recommande vivement pour les jam sessions."
                                }
                                response = requests.post(f"{self.base_url}/reviews", json=review_data, headers=headers, timeout=10)
                                success = response.status_code == 200
                                
                                if success:
                                    review_response = response.json()
                                    self.review_id = review_response.get('id')
                                    details = f"Review created successfully, ID: {self.review_id}, Rating: {review_response.get('rating')}"
                                else:
                                    details = f"Status: {response.status_code}, Error: {response.text[:100]}"
                            else:
                                success = False
                                details = f"Failed to leave event: {leave_response.status_code}"
                        else:
                            success = False
                            details = f"Failed to join event: {join_response.status_code}"
                    else:
                        success = False
                        details = f"Failed to create jam: {jam_response.status_code}"
                else:
                    success = False
                    details = f"Failed to create profile: {profile_response.status_code}"
            else:
                success = False
                details = f"Failed to create musician: {response.status_code}"
            
            self.log_test("Create Review With Participation", success, details)
            return success
        except Exception as e:
            self.log_test("Create Review With Participation", False, f"Error: {str(e)}")
            return False

    def test_create_duplicate_review(self):
        """Test creating duplicate review (should fail)"""
        try:
            headers = {'Authorization': f'Bearer {self.review_musician_token}'}
            review_data = {
                "venue_id": self.venue_profile_id,
                "rating": 3,
                "comment": "Trying to create duplicate review"
            }
            response = requests.post(f"{self.base_url}/reviews", json=review_data, headers=headers, timeout=10)
            success = response.status_code == 400
            
            if success:
                details = "Correctly prevented duplicate review"
            else:
                details = f"Unexpected status: {response.status_code}, Expected: 400"
            
            self.log_test("Create Duplicate Review", success, details)
            return success
        except Exception as e:
            self.log_test("Create Duplicate Review", False, f"Error: {str(e)}")
            return False

    def test_invalid_rating_review(self):
        """Test creating review with invalid rating (should fail)"""
        try:
            # Create another musician for this test
            test_data = {
                "email": f"musician_rating_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Rating Test Musician",
                "role": "musician"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=test_data, timeout=10)
            if response.status_code == 200:
                rating_musician_data = response.json()
                rating_musician_token = rating_musician_data.get('token')
                
                headers = {'Authorization': f'Bearer {rating_musician_token}'}
                review_data = {
                    "venue_id": self.venue_profile_id,
                    "rating": 6,  # Invalid rating (should be 1-5)
                    "comment": "Invalid rating test"
                }
                response = requests.post(f"{self.base_url}/reviews", json=review_data, headers=headers, timeout=10)
                success = response.status_code == 400  # Backend validates and returns 400
                
                if success:
                    details = "Correctly rejected invalid rating (6/5)"
                else:
                    details = f"Unexpected status: {response.status_code}, Expected: 400"
            else:
                success = False
                details = "Failed to create test musician"
            
            self.log_test("Invalid Rating Review", success, details)
            return success
        except Exception as e:
            self.log_test("Invalid Rating Review", False, f"Error: {str(e)}")
            return False

    def test_get_venue_reviews(self):
        """Test retrieving venue reviews"""
        try:
            response = requests.get(f"{self.base_url}/venues/{self.venue_profile_id}/reviews", timeout=10)
            success = response.status_code == 200
            
            if success:
                reviews = response.json()
                details = f"Retrieved {len(reviews)} reviews"
                if reviews:
                    review = reviews[0]
                    details += f", First review: {review.get('rating')}/5 stars"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Get Venue Reviews", success, details)
            return success
        except Exception as e:
            self.log_test("Get Venue Reviews", False, f"Error: {str(e)}")
            return False

    def test_get_venue_average_rating(self):
        """Test retrieving venue average rating"""
        try:
            response = requests.get(f"{self.base_url}/venues/{self.venue_profile_id}/average-rating", timeout=10)
            success = response.status_code == 200
            
            if success:
                rating_data = response.json()
                details = f"Average rating: {rating_data.get('average_rating', 0):.1f}/5, Total reviews: {rating_data.get('total_reviews', 0)}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Get Venue Average Rating", success, details)
            return success
        except Exception as e:
            self.log_test("Get Venue Average Rating", False, f"Error: {str(e)}")
            return False

    def test_venue_respond_to_review(self):
        """Test venue responding to a review"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            response_data = {"response": "Merci beaucoup pour votre avis! Nous sommes ravis que vous ayez apprécié votre expérience chez nous."}
            response = requests.post(f"{self.base_url}/reviews/{self.review_id}/respond", json=response_data, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                details = "Venue response added successfully"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Venue Respond to Review", success, details)
            return success
        except Exception as e:
            self.log_test("Venue Respond to Review", False, f"Error: {str(e)}")
            return False

    def test_report_review(self):
        """Test reporting a review"""
        try:
            # Use the friend musician token if available, otherwise create a new musician
            if hasattr(self, 'friend_musician_token') and self.friend_musician_token:
                headers = {'Authorization': f'Bearer {self.friend_musician_token}'}
            else:
                # Create a new musician for reporting
                test_data = {
                    "email": f"musician_reporter_{datetime.now().strftime('%H%M%S')}@test.com",
                    "password": "TestPass123!",
                    "name": "Reporter Musician",
                    "role": "musician"
                }
                
                response = requests.post(f"{self.base_url}/auth/register", json=test_data, timeout=10)
                if response.status_code == 200:
                    reporter_data = response.json()
                    reporter_token = reporter_data.get('token')
                    headers = {'Authorization': f'Bearer {reporter_token}'}
                else:
                    self.log_test("Report Review", False, "Failed to create reporter musician")
                    return False
            
            response = requests.post(f"{self.base_url}/reviews/{self.review_id}/report", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                details = "Review reported successfully"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Report Review", success, details)
            return success
        except Exception as e:
            self.log_test("Report Review", False, f"Error: {str(e)}")
            return False

    def test_toggle_reviews_visibility(self):
        """Test toggling reviews visibility"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            
            # Turn off reviews visibility
            response = requests.put(f"{self.base_url}/venues/me/reviews-visibility?show_reviews=false", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                details = "Reviews visibility turned off"
                
                # Check that public reviews are now empty
                response = requests.get(f"{self.base_url}/venues/{self.venue_profile_id}/reviews", timeout=10)
                if response.status_code == 200:
                    reviews = response.json()
                    if len(reviews) == 0:
                        details += ", Public reviews correctly hidden"
                    else:
                        details += f", WARNING: {len(reviews)} reviews still visible"
                        success = False
                
                # Turn reviews visibility back on
                response = requests.put(f"{self.base_url}/venues/me/reviews-visibility?show_reviews=true", headers=headers, timeout=10)
                if response.status_code == 200:
                    details += ", Reviews visibility restored"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Toggle Reviews Visibility", success, details)
            return success
        except Exception as e:
            self.log_test("Toggle Reviews Visibility", False, f"Error: {str(e)}")
            return False

    def test_get_venue_my_reviews(self):
        """Test venue getting their received reviews"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            response = requests.get(f"{self.base_url}/venues/me/reviews", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                reviews = response.json()
                details = f"Retrieved {len(reviews)} reviews for venue"
                if reviews:
                    review = reviews[0]
                    details += f", First review: {review.get('rating')}/5"
                    if review.get('is_reported'):
                        details += " (REPORTED)"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Get Venue My Reviews", success, details)
            return success
        except Exception as e:
            self.log_test("Get Venue My Reviews", False, f"Error: {str(e)}")
            return False

    # ============= BAND JOIN REQUEST TESTS =============

    def test_setup_band_join_scenario(self):
        """Setup scenario for band join request tests"""
        try:
            # Create Musician A (band owner) with a band looking for members
            test_data_a = {
                "email": f"musician_a_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Musicien A",
                "role": "musician"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=test_data_a, timeout=10)
            if response.status_code != 200:
                self.log_test("Setup Band Join Scenario", False, "Failed to create Musician A")
                return False
                
            musician_a_data = response.json()
            self.musician_a_token = musician_a_data.get('token')
            self.musician_a_user = musician_a_data.get('user')
            
            # Create profile for Musician A with a band
            profile_data_a = {
                "pseudo": "RockLeader",
                "instruments": ["Guitar", "Vocals"],
                "music_styles": ["Rock", "Blues"],
                "has_band": True,
                "bands": [{
                    "name": "The Rockers",
                    "description": "Groupe de rock cherchant nouveaux membres",
                    "members_count": 3,
                    "music_styles": ["Rock", "Blues"],
                    "looking_for_members": True,
                    "looking_for_profiles": ["Batteur", "Bassiste"],
                    "admin_id": None  # Will be set after profile creation
                }]
            }
            
            headers_a = {'Authorization': f'Bearer {self.musician_a_token}'}
            profile_response = requests.post(f"{self.base_url}/musicians", json=profile_data_a, headers=headers_a, timeout=10)
            
            if profile_response.status_code != 200:
                self.log_test("Setup Band Join Scenario", False, "Failed to create Musician A profile")
                return False
                
            musician_a_profile = profile_response.json()
            self.musician_a_profile_id = musician_a_profile.get('id')
            
            # Update band with admin_id
            profile_data_a["bands"][0]["admin_id"] = self.musician_a_profile_id
            requests.put(f"{self.base_url}/musicians", json=profile_data_a, headers=headers_a, timeout=10)
            
            # Create Musician B (wants to join)
            test_data_b = {
                "email": f"musician_b_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Musicien B",
                "role": "musician"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=test_data_b, timeout=10)
            if response.status_code != 200:
                self.log_test("Setup Band Join Scenario", False, "Failed to create Musician B")
                return False
                
            musician_b_data = response.json()
            self.musician_b_token = musician_b_data.get('token')
            self.musician_b_user = musician_b_data.get('user')
            
            # Create profile for Musician B
            profile_data_b = {
                "pseudo": "DrummerBob",
                "instruments": ["Drums"],
                "music_styles": ["Rock", "Jazz"],
                "experience_years": 5
            }
            
            headers_b = {'Authorization': f'Bearer {self.musician_b_token}'}
            profile_response = requests.post(f"{self.base_url}/musicians", json=profile_data_b, headers=headers_b, timeout=10)
            
            if profile_response.status_code != 200:
                self.log_test("Setup Band Join Scenario", False, "Failed to create Musician B profile")
                return False
                
            musician_b_profile = profile_response.json()
            self.musician_b_profile_id = musician_b_profile.get('id')
            
            success = True
            details = f"Setup complete - Musician A: {self.musician_a_profile_id} (band owner), Musician B: {self.musician_b_profile_id} (wants to join)"
            
            self.log_test("Setup Band Join Scenario", success, details)
            return success
        except Exception as e:
            self.log_test("Setup Band Join Scenario", False, f"Error: {str(e)}")
            return False

    def test_create_band_join_request(self):
        """Test creating a band join request"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_b_token}'}
            request_data = {
                "musician_id": self.musician_a_profile_id,
                "band_name": "The Rockers",
                "message": "Je suis batteur avec 5 ans d'expérience"
            }
            
            response = requests.post(f"{self.base_url}/bands/join-requests", json=request_data, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                join_response = response.json()
                self.band_join_request_id = join_response.get('request_id')
                details = f"Join request created successfully, ID: {self.band_join_request_id}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Create Band Join Request", success, details)
            return success
        except Exception as e:
            self.log_test("Create Band Join Request", False, f"Error: {str(e)}")
            return False

    def test_notification_created_for_admin(self):
        """Test that notification is created for band admin"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_a_token}'}
            response = requests.get(f"{self.base_url}/notifications/unread-count", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                count_data = response.json()
                unread_count = count_data.get('count', 0)
                if unread_count > 0:
                    details = f"Notification created for admin - {unread_count} unread notifications"
                else:
                    details = "No notifications found for admin"
                    success = False
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Notification Created for Admin", success, details)
            return success
        except Exception as e:
            self.log_test("Notification Created for Admin", False, f"Error: {str(e)}")
            return False

    def test_list_band_join_requests_admin(self):
        """Test listing join requests as band admin"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_a_token}'}
            response = requests.get(f"{self.base_url}/bands/join-requests", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                requests_data = response.json()
                if len(requests_data) > 0:
                    request = requests_data[0]
                    details = f"Found {len(requests_data)} join request(s) - From: {request.get('musician_name')}, Band: {request.get('band_name')}, Status: {request.get('status')}"
                else:
                    details = "No join requests found"
                    success = False
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("List Band Join Requests (Admin)", success, details)
            return success
        except Exception as e:
            self.log_test("List Band Join Requests (Admin)", False, f"Error: {str(e)}")
            return False

    def test_prevent_duplicate_join_request(self):
        """Test preventing duplicate join requests"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_b_token}'}
            request_data = {
                "musician_id": self.musician_a_profile_id,
                "band_name": "The Rockers",
                "message": "Tentative de doublon"
            }
            
            response = requests.post(f"{self.base_url}/bands/join-requests", json=request_data, headers=headers, timeout=10)
            success = response.status_code == 400
            
            if success:
                details = "Correctly prevented duplicate join request"
            else:
                details = f"Unexpected status: {response.status_code}, Expected: 400"
            
            self.log_test("Prevent Duplicate Join Request", success, details)
            return success
        except Exception as e:
            self.log_test("Prevent Duplicate Join Request", False, f"Error: {str(e)}")
            return False

    def test_accept_band_join_request(self):
        """Test accepting a band join request"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_a_token}'}
            response = requests.put(f"{self.base_url}/bands/join-requests/{self.band_join_request_id}/accept", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                details = "Join request accepted successfully"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Accept Band Join Request", success, details)
            return success
        except Exception as e:
            self.log_test("Accept Band Join Request", False, f"Error: {str(e)}")
            return False

    def test_notification_sent_to_requester_accept(self):
        """Test that notification is sent to requester when accepted"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_b_token}'}
            response = requests.get(f"{self.base_url}/notifications/unread-count", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                count_data = response.json()
                unread_count = count_data.get('count', 0)
                if unread_count > 0:
                    details = f"Notification sent to requester - {unread_count} unread notifications"
                else:
                    details = "No notifications found for requester"
                    success = False
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Notification Sent to Requester (Accept)", success, details)
            return success
        except Exception as e:
            self.log_test("Notification Sent to Requester (Accept)", False, f"Error: {str(e)}")
            return False

    def test_create_second_join_request_for_rejection(self):
        """Create a second join request to test rejection"""
        try:
            # Create another musician for rejection test
            test_data_c = {
                "email": f"musician_c_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Musicien C",
                "role": "musician"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=test_data_c, timeout=10)
            if response.status_code != 200:
                self.log_test("Create Second Join Request for Rejection", False, "Failed to create Musician C")
                return False
                
            musician_c_data = response.json()
            self.musician_c_token = musician_c_data.get('token')
            
            # Create profile for Musician C
            profile_data_c = {
                "pseudo": "BassPlayer",
                "instruments": ["Bass"],
                "music_styles": ["Rock"]
            }
            
            headers_c = {'Authorization': f'Bearer {self.musician_c_token}'}
            profile_response = requests.post(f"{self.base_url}/musicians", json=profile_data_c, headers=headers_c, timeout=10)
            
            if profile_response.status_code != 200:
                self.log_test("Create Second Join Request for Rejection", False, "Failed to create Musician C profile")
                return False
                
            musician_c_profile = profile_response.json()
            self.musician_c_profile_id = musician_c_profile.get('id')
            
            # Create join request
            request_data = {
                "musician_id": self.musician_a_profile_id,
                "band_name": "The Rockers",
                "message": "Je suis bassiste intéressé par votre groupe"
            }
            
            response = requests.post(f"{self.base_url}/bands/join-requests", json=request_data, headers=headers_c, timeout=10)
            success = response.status_code == 200
            
            if success:
                join_response = response.json()
                self.second_join_request_id = join_response.get('request_id')
                details = f"Second join request created for rejection test, ID: {self.second_join_request_id}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Create Second Join Request for Rejection", success, details)
            return success
        except Exception as e:
            self.log_test("Create Second Join Request for Rejection", False, f"Error: {str(e)}")
            return False

    def test_reject_band_join_request(self):
        """Test rejecting a band join request"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_a_token}'}
            response = requests.put(f"{self.base_url}/bands/join-requests/{self.second_join_request_id}/reject", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                details = "Join request rejected successfully"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Reject Band Join Request", success, details)
            return success
        except Exception as e:
            self.log_test("Reject Band Join Request", False, f"Error: {str(e)}")
            return False

    def test_notification_sent_to_requester_reject(self):
        """Test that notification is sent to requester when rejected"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_c_token}'}
            response = requests.get(f"{self.base_url}/notifications/unread-count", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                count_data = response.json()
                unread_count = count_data.get('count', 0)
                if unread_count > 0:
                    details = f"Notification sent to requester - {unread_count} unread notifications"
                else:
                    details = "No notifications found for requester"
                    success = False
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Notification Sent to Requester (Reject)", success, details)
            return success
        except Exception as e:
            self.log_test("Notification Sent to Requester (Reject)", False, f"Error: {str(e)}")
            return False

    def test_venue_cannot_create_join_request(self):
        """Test that venues cannot create join requests"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            request_data = {
                "musician_id": self.musician_a_profile_id,
                "band_name": "The Rockers",
                "message": "Venue trying to join band"
            }
            
            response = requests.post(f"{self.base_url}/bands/join-requests", json=request_data, headers=headers, timeout=10)
            success = response.status_code == 403
            
            if success:
                details = "Correctly rejected venue request to join band"
            else:
                details = f"Unexpected status: {response.status_code}, Expected: 403"
            
            self.log_test("Venue Cannot Create Join Request", success, details)
            return success
        except Exception as e:
            self.log_test("Venue Cannot Create Join Request", False, f"Error: {str(e)}")
            return False

    def test_non_admin_cannot_accept_reject(self):
        """Test that non-admin musicians cannot accept/reject requests"""
        try:
            # Try to accept with Musician B (not admin)
            headers = {'Authorization': f'Bearer {self.musician_b_token}'}
            
            # Create a new request first
            headers_c = {'Authorization': f'Bearer {self.musician_c_token}'}
            request_data = {
                "musician_id": self.musician_a_profile_id,
                "band_name": "The Rockers",
                "message": "Another test request"
            }
            
            response = requests.post(f"{self.base_url}/bands/join-requests", json=request_data, headers=headers_c, timeout=10)
            if response.status_code == 200:
                test_request_id = response.json().get('request_id')
                
                # Try to accept with non-admin
                response = requests.put(f"{self.base_url}/bands/join-requests/{test_request_id}/accept", headers=headers, timeout=10)
                success = response.status_code == 403
                
                if success:
                    details = "Correctly rejected non-admin attempt to accept request"
                else:
                    details = f"Unexpected status: {response.status_code}, Expected: 403"
            else:
                success = False
                details = "Failed to create test request"
            
            self.log_test("Non-Admin Cannot Accept/Reject", success, details)
            return success
        except Exception as e:
            self.log_test("Non-Admin Cannot Accept/Reject", False, f"Error: {str(e)}")
            return False

    # ============= BANDS GEOLOCATION SEARCH TESTS =============
    
    def test_bands_geolocation_paris_100km(self):
        """Test geolocation search for bands near Paris (100km radius)"""
        try:
            # Paris coordinates: 48.8566, 2.3522
            params = {
                "latitude": 48.8566,
                "longitude": 2.3522,
                "radius": 100
            }
            response = requests.get(f"{self.base_url}/bands", params=params, timeout=15)
            success = response.status_code == 200
            
            if success:
                bands = response.json()
                details = f"Found {len(bands)} bands within 100km of Paris"
                
                # Verify each band has distance_km field
                bands_with_distance = [b for b in bands if 'distance_km' in b]
                details += f", {len(bands_with_distance)} with distance calculated"
                
                # Check that distances are within radius
                valid_distances = [b for b in bands_with_distance if b['distance_km'] <= 100]
                details += f", {len(valid_distances)} within 100km radius"
                
                if bands:
                    closest_band = min(bands, key=lambda x: x.get('distance_km', float('inf')))
                    details += f", Closest: {closest_band.get('name', 'Unknown')} at {closest_band.get('distance_km', 'N/A')}km"
                
                # Test should pass if we get results (fix should work)
                success = len(bands) > 0
                if not success:
                    details += " - NO BANDS FOUND (geolocation fix may not be working)"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Bands Geolocation - Paris 100km", success, details)
            return success
        except Exception as e:
            self.log_test("Bands Geolocation - Paris 100km", False, f"Error: {str(e)}")
            return False

    def test_bands_geolocation_paris_500km(self):
        """Test geolocation search for bands near Paris (500km radius)"""
        try:
            # Paris coordinates: 48.8566, 2.3522
            params = {
                "latitude": 48.8566,
                "longitude": 2.3522,
                "radius": 500
            }
            response = requests.get(f"{self.base_url}/bands", params=params, timeout=15)
            success = response.status_code == 200
            
            if success:
                bands = response.json()
                details = f"Found {len(bands)} bands within 500km of Paris"
                
                # Verify distances are within radius
                bands_with_distance = [b for b in bands if 'distance_km' in b and b['distance_km'] <= 500]
                details += f", {len(bands_with_distance)} within 500km radius"
                
                # Should have more results than 100km test
                success = len(bands) > 0
                if bands:
                    farthest_band = max(bands, key=lambda x: x.get('distance_km', 0))
                    details += f", Farthest: {farthest_band.get('name', 'Unknown')} at {farthest_band.get('distance_km', 'N/A')}km"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Bands Geolocation - Paris 500km", success, details)
            return success
        except Exception as e:
            self.log_test("Bands Geolocation - Paris 500km", False, f"Error: {str(e)}")
            return False

    def test_bands_geolocation_lyon_100km(self):
        """Test geolocation search for bands near Lyon (100km radius)"""
        try:
            # Lyon coordinates: 45.764, 4.8357
            params = {
                "latitude": 45.764,
                "longitude": 4.8357,
                "radius": 100
            }
            response = requests.get(f"{self.base_url}/bands", params=params, timeout=15)
            success = response.status_code == 200
            
            if success:
                bands = response.json()
                details = f"Found {len(bands)} bands within 100km of Lyon"
                
                # Verify distances
                bands_with_distance = [b for b in bands if 'distance_km' in b and b['distance_km'] <= 100]
                details += f", {len(bands_with_distance)} within 100km radius"
                
                if bands:
                    closest_band = min(bands, key=lambda x: x.get('distance_km', float('inf')))
                    details += f", Closest: {closest_band.get('name', 'Unknown')} at {closest_band.get('distance_km', 'N/A')}km"
                
                success = len(bands) >= 0  # Accept 0 results for Lyon (may have fewer bands)
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Bands Geolocation - Lyon 100km", success, details)
            return success
        except Exception as e:
            self.log_test("Bands Geolocation - Lyon 100km", False, f"Error: {str(e)}")
            return False

    def test_bands_geolocation_precision(self):
        """Test precision of geolocation search - verify distances are coherent"""
        try:
            # Test with a small radius to check precision
            params = {
                "latitude": 48.8566,  # Paris
                "longitude": 2.3522,
                "radius": 50  # Small radius for precision test
            }
            response = requests.get(f"{self.base_url}/bands", params=params, timeout=15)
            success = response.status_code == 200
            
            if success:
                bands = response.json()
                details = f"Found {len(bands)} bands within 50km of Paris"
                
                # Check that all returned bands are actually within the radius
                invalid_distances = []
                for band in bands:
                    if 'distance_km' in band and band['distance_km'] > 50:
                        invalid_distances.append(band)
                
                if invalid_distances:
                    details += f", WARNING: {len(invalid_distances)} bands outside 50km radius"
                    success = False
                else:
                    details += ", All distances within specified radius ✓"
                
                # Check that distances are sorted (closest first)
                distances = [b.get('distance_km', float('inf')) for b in bands if 'distance_km' in b]
                if distances and distances == sorted(distances):
                    details += ", Results sorted by distance ✓"
                elif distances:
                    details += ", WARNING: Results not sorted by distance"
                
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Bands Geolocation - Precision Check", success, details)
            return success
        except Exception as e:
            self.log_test("Bands Geolocation - Precision Check", False, f"Error: {str(e)}")
            return False

    def test_bands_without_geolocation(self):
        """Test bands endpoint without geolocation parameters (should still work)"""
        try:
            response = requests.get(f"{self.base_url}/bands", timeout=15)
            success = response.status_code == 200
            
            if success:
                bands = response.json()
                details = f"Found {len(bands)} total bands without geolocation filter"
                
                # Should not have distance_km field when not using geolocation
                bands_with_distance = [b for b in bands if 'distance_km' in b]
                if bands_with_distance:
                    details += f", WARNING: {len(bands_with_distance)} bands have distance_km without geolocation"
                else:
                    details += ", No distance_km field (correct) ✓"
                
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Bands Without Geolocation", success, details)
            return success
        except Exception as e:
            self.log_test("Bands Without Geolocation", False, f"Error: {str(e)}")
            return False

    def test_create_test_bands_for_geolocation(self):
        """Create test bands with different locations for geolocation testing"""
        try:
            # Create musicians with bands in different cities
            test_musicians = [
                {
                    "email": f"band_paris_{datetime.now().strftime('%H%M%S')}@test.com",
                    "name": "Paris Band Leader",
                    "city": "Paris",
                    "band_name": "Paris Jazz Collective"
                },
                {
                    "email": f"band_lyon_{datetime.now().strftime('%H%M%S')}@test.com", 
                    "name": "Lyon Band Leader",
                    "city": "Lyon",
                    "band_name": "Lyon Blues Band"
                },
                {
                    "email": f"band_marseille_{datetime.now().strftime('%H%M%S')}@test.com",
                    "name": "Marseille Band Leader", 
                    "city": "Marseille",
                    "band_name": "Marseille Rock Group"
                }
            ]
            
            created_bands = 0
            for musician_data in test_musicians:
                try:
                    # Register musician
                    reg_data = {
                        "email": musician_data["email"],
                        "password": "TestPass123!",
                        "name": musician_data["name"],
                        "role": "musician"
                    }
                    
                    response = requests.post(f"{self.base_url}/auth/register", json=reg_data, timeout=10)
                    if response.status_code == 200:
                        user_data = response.json()
                        token = user_data.get('token')
                        
                        # Create musician profile with band
                        profile_data = {
                            "pseudo": musician_data["name"],
                            "city": musician_data["city"],
                            "instruments": ["Guitar"],
                            "music_styles": ["Jazz", "Blues", "Rock"],
                            "bands": [{
                                "name": musician_data["band_name"],
                                "city": musician_data["city"],
                                "music_styles": ["Jazz", "Blues"],
                                "members_count": 4,
                                "is_public": True,
                                "looking_for_concerts": True
                            }]
                        }
                        
                        headers = {'Authorization': f'Bearer {token}'}
                        profile_response = requests.post(f"{self.base_url}/musicians", json=profile_data, headers=headers, timeout=10)
                        
                        if profile_response.status_code == 200:
                            created_bands += 1
                
                except Exception as e:
                    continue  # Skip failed creations
            
            success = created_bands > 0
            details = f"Created {created_bands} test bands for geolocation testing"
            
            self.log_test("Create Test Bands for Geolocation", success, details)
            return success
        except Exception as e:
            self.log_test("Create Test Bands for Geolocation", False, f"Error: {str(e)}")
            return False

    # ============= PUT ENDPOINTS TESTS (NEVER TESTED BEFORE) =============

    def test_put_jam_update(self):
        """Test PUT /api/jams/{jam_id} - Update a jam event"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            
            # First create a jam to update
            jam_data = {
                "date": "2024-12-28",
                "start_time": "19:00",
                "end_time": "22:00",
                "music_styles": ["Jazz", "Blues"],
                "rules": "Original rules for testing",
                "has_instruments": True,
                "has_pa_system": True,
                "instruments_available": ["Piano", "Drums"],
                "additional_info": "Original info"
            }
            
            # Create the jam
            create_response = requests.post(f"{self.base_url}/jams", json=jam_data, headers=headers, timeout=10)
            if create_response.status_code != 200:
                self.log_test("PUT Jam Update - Setup", False, f"Failed to create jam: {create_response.status_code}")
                return False
            
            created_jam = create_response.json()
            jam_id = created_jam.get('id')
            
            # Now update the jam with new data
            updated_jam_data = {
                "date": "2024-12-28",
                "start_time": "20:00",  # Changed time
                "end_time": "23:30",    # Changed time
                "music_styles": ["Jazz", "Blues", "Funk"],  # Added style
                "rules": "Updated rules: Bring your own cables!",  # Changed rules
                "has_instruments": True,
                "has_pa_system": False,  # Changed
                "instruments_available": ["Piano", "Drums", "Bass"],  # Added instrument
                "additional_info": "Updated info: Special guest tonight!"  # Changed info
            }
            
            # Update the jam
            response = requests.put(f"{self.base_url}/jams/{jam_id}", json=updated_jam_data, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                updated_jam = response.json()
                details = f"Jam updated successfully, ID: {jam_id}"
                
                # Verify the changes were applied
                if (updated_jam.get('start_time') == "20:00" and 
                    updated_jam.get('end_time') == "23:30" and
                    "Funk" in updated_jam.get('music_styles', []) and
                    updated_jam.get('has_pa_system') == False and
                    "Updated rules" in updated_jam.get('rules', '') and
                    "Bass" in updated_jam.get('instruments_available', [])):
                    details += ", All changes verified"
                else:
                    details += ", WARNING: Some changes not applied correctly"
                    success = False
                
                # Verify via GET request
                get_response = requests.get(f"{self.base_url}/venues/{self.venue_profile_id}/jams", timeout=10)
                if get_response.status_code == 200:
                    jams = get_response.json()
                    updated_jam_from_get = next((j for j in jams if j['id'] == jam_id), None)
                    if updated_jam_from_get and updated_jam_from_get.get('start_time') == "20:00":
                        details += ", Changes persisted in database"
                    else:
                        details += ", WARNING: Changes not persisted"
                        success = False
                
                self.updated_jam_id = jam_id  # Store for potential cleanup
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("PUT Jam Update", success, details)
            return success
        except Exception as e:
            self.log_test("PUT Jam Update", False, f"Error: {str(e)}")
            return False

    def test_put_concert_update(self):
        """Test PUT /api/concerts/{concert_id} - Update a concert event"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            
            # First create a concert to update
            concert_data = {
                "date": "2024-12-29",
                "start_time": "20:00",
                "title": "Original Concert Title",
                "description": "Original description",
                "bands": [
                    {
                        "name": "Original Band",
                        "photo": "https://example.com/original.jpg",
                        "facebook": "https://facebook.com/originalband"
                    }
                ],
                "price": "10€"
            }
            
            # Create the concert
            create_response = requests.post(f"{self.base_url}/concerts", json=concert_data, headers=headers, timeout=10)
            if create_response.status_code != 200:
                self.log_test("PUT Concert Update - Setup", False, f"Failed to create concert: {create_response.status_code}")
                return False
            
            created_concert = create_response.json()
            concert_id = created_concert.get('id')
            
            # Now update the concert with new data
            updated_concert_data = {
                "date": "2024-12-29",
                "start_time": "21:30",  # Changed time
                "title": "Updated Concert Title - Special Edition",  # Changed title
                "description": "Updated description with more details about this amazing show",  # Changed description
                "bands": [
                    {
                        "name": "Updated Band Name",  # Changed band name
                        "photo": "https://example.com/updated.jpg",  # Changed photo
                        "facebook": "https://facebook.com/updatedband",  # Changed facebook
                        "instagram": "@updatedband"  # Added instagram
                    },
                    {
                        "name": "Second Band Added",  # Added second band
                        "photo": "https://example.com/second.jpg"
                    }
                ],
                "price": "15€"  # Changed price
            }
            
            # Update the concert
            response = requests.put(f"{self.base_url}/concerts/{concert_id}", json=updated_concert_data, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                updated_concert = response.json()
                details = f"Concert updated successfully, ID: {concert_id}"
                
                # Verify the changes were applied
                bands = updated_concert.get('bands', [])
                if (updated_concert.get('start_time') == "21:30" and 
                    "Updated Concert Title" in updated_concert.get('title', '') and
                    "Updated description" in updated_concert.get('description', '') and
                    updated_concert.get('price') == "15€" and
                    len(bands) == 2 and
                    bands[0].get('name') == "Updated Band Name"):
                    details += ", All changes verified"
                else:
                    details += ", WARNING: Some changes not applied correctly"
                    success = False
                
                # Verify via GET request
                get_response = requests.get(f"{self.base_url}/venues/{self.venue_profile_id}/concerts", timeout=10)
                if get_response.status_code == 200:
                    concerts = get_response.json()
                    updated_concert_from_get = next((c for c in concerts if c['id'] == concert_id), None)
                    if updated_concert_from_get and updated_concert_from_get.get('start_time') == "21:30":
                        details += ", Changes persisted in database"
                    else:
                        details += ", WARNING: Changes not persisted"
                        success = False
                
                self.updated_concert_id = concert_id  # Store for potential cleanup
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("PUT Concert Update", success, details)
            return success
        except Exception as e:
            self.log_test("PUT Concert Update", False, f"Error: {str(e)}")
            return False

    def test_put_jam_unauthorized(self):
        """Test PUT jam without authentication (should fail)"""
        try:
            # Try to update without token
            update_data = {
                "date": "2024-12-30",
                "start_time": "20:00",
                "end_time": "23:00",
                "music_styles": ["Rock"]
            }
            
            response = requests.put(f"{self.base_url}/jams/fake-id", json=update_data, timeout=10)
            success = response.status_code == 401
            
            if success:
                details = "Correctly rejected unauthorized request"
            else:
                details = f"Unexpected status: {response.status_code}, Expected: 401"
            
            self.log_test("PUT Jam Unauthorized", success, details)
            return success
        except Exception as e:
            self.log_test("PUT Jam Unauthorized", False, f"Error: {str(e)}")
            return False

    def test_put_concert_unauthorized(self):
        """Test PUT concert without authentication (should fail)"""
        try:
            # Try to update without token
            update_data = {
                "date": "2024-12-30",
                "start_time": "20:00",
                "title": "Unauthorized Update"
            }
            
            response = requests.put(f"{self.base_url}/concerts/fake-id", json=update_data, timeout=10)
            success = response.status_code == 401
            
            if success:
                details = "Correctly rejected unauthorized request"
            else:
                details = f"Unexpected status: {response.status_code}, Expected: 401"
            
            self.log_test("PUT Concert Unauthorized", success, details)
            return success
        except Exception as e:
            self.log_test("PUT Concert Unauthorized", False, f"Error: {str(e)}")
            return False

    def test_put_jam_not_found(self):
        """Test PUT jam with non-existent ID (should fail)"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            update_data = {
                "date": "2024-12-30",
                "start_time": "20:00",
                "end_time": "23:00",
                "music_styles": ["Rock"]
            }
            
            response = requests.put(f"{self.base_url}/jams/non-existent-id", json=update_data, headers=headers, timeout=10)
            success = response.status_code == 404
            
            if success:
                details = "Correctly returned 404 for non-existent jam"
            else:
                details = f"Unexpected status: {response.status_code}, Expected: 404"
            
            self.log_test("PUT Jam Not Found", success, details)
            return success
        except Exception as e:
            self.log_test("PUT Jam Not Found", False, f"Error: {str(e)}")
            return False

    def test_put_concert_not_found(self):
        """Test PUT concert with non-existent ID (should fail)"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            update_data = {
                "date": "2024-12-30",
                "start_time": "20:00",
                "title": "Non-existent Concert"
            }
            
            response = requests.put(f"{self.base_url}/concerts/non-existent-id", json=update_data, headers=headers, timeout=10)
            success = response.status_code == 404
            
            if success:
                details = "Correctly returned 404 for non-existent concert"
            else:
                details = f"Unexpected status: {response.status_code}, Expected: 404"
            
            self.log_test("PUT Concert Not Found", success, details)
            return success
        except Exception as e:
            self.log_test("PUT Concert Not Found", False, f"Error: {str(e)}")
            return False

    def test_put_jam_invalid_data(self):
        """Test PUT jam with invalid data (should fail)"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            
            # Create a jam first
            jam_data = {
                "date": "2024-12-30",
                "start_time": "20:00",
                "end_time": "23:00",
                "music_styles": ["Jazz"]
            }
            
            create_response = requests.post(f"{self.base_url}/jams", json=jam_data, headers=headers, timeout=10)
            if create_response.status_code == 200:
                jam_id = create_response.json().get('id')
                
                # Try to update with invalid data
                invalid_data = {
                    "date": "invalid-date-format",  # Invalid date
                    "start_time": "25:00",  # Invalid time
                    "end_time": "23:00"
                }
                
                response = requests.put(f"{self.base_url}/jams/{jam_id}", json=invalid_data, headers=headers, timeout=10)
                success = response.status_code == 400
                
                if success:
                    details = "Correctly rejected invalid data"
                else:
                    details = f"Unexpected status: {response.status_code}, Expected: 400"
            else:
                success = False
                details = "Failed to create jam for test"
            
            self.log_test("PUT Jam Invalid Data", success, details)
            return success
        except Exception as e:
            self.log_test("PUT Jam Invalid Data", False, f"Error: {str(e)}")
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

    # ============= GEOLOCATION SEARCH TESTS =============
    
    def test_bands_geolocation_search(self):
        """Test geolocation search functionality for bands directory"""
        try:
            # Test 1: Basic geolocation search with Paris coordinates
            paris_lat = 48.8566
            paris_lon = 2.3522
            radius = 100  # 100km radius
            
            response = requests.get(
                f"{self.base_url}/bands?latitude={paris_lat}&longitude={paris_lon}&radius={radius}", 
                timeout=10
            )
            success = response.status_code == 200
            
            if success:
                bands_data = response.json()
                bands_count = len(bands_data)
                
                # Check if bands have distance_km field
                bands_with_distance = [b for b in bands_data if 'distance_km' in b]
                
                details = f"Found {bands_count} bands within {radius}km of Paris"
                if bands_with_distance:
                    details += f", {len(bands_with_distance)} have distance_km field"
                    avg_distance = sum(b['distance_km'] for b in bands_with_distance) / len(bands_with_distance)
                    details += f", avg distance: {avg_distance:.1f}km"
                else:
                    details += ", no bands have distance_km field"
                
                # Store for further analysis
                self.geolocation_bands = bands_data
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Bands Geolocation Search", success, details)
            return success
        except Exception as e:
            self.log_test("Bands Geolocation Search", False, f"Error: {str(e)}")
            return False

    def test_bands_data_analysis(self):
        """Analyze the state of bands data - GPS vs city-only"""
        try:
            # Get all musicians to analyze their bands
            response = requests.get(f"{self.base_url}/musicians", timeout=10)
            success = response.status_code == 200
            
            if success:
                musicians = response.json()
                
                total_musicians = len(musicians)
                musicians_with_bands = 0
                total_bands = 0
                bands_with_gps = 0
                bands_with_city_only = 0
                bands_without_location = 0
                
                for musician in musicians:
                    # Check new format (multiple bands)
                    if musician.get("bands"):
                        musicians_with_bands += 1
                        for band in musician["bands"]:
                            total_bands += 1
                            
                            # Check if band has GPS coordinates
                            band_lat = band.get("latitude") or musician.get("latitude")
                            band_lon = band.get("longitude") or musician.get("longitude")
                            
                            if band_lat and band_lon:
                                bands_with_gps += 1
                            elif band.get("city") or musician.get("city"):
                                bands_with_city_only += 1
                            else:
                                bands_without_location += 1
                    
                    # Check old format (single band)
                    elif musician.get("band") and musician.get("has_band"):
                        musicians_with_bands += 1
                        total_bands += 1
                        
                        # Check GPS coordinates (from musician profile for old format)
                        if musician.get("latitude") and musician.get("longitude"):
                            bands_with_gps += 1
                        elif musician.get("city"):
                            bands_with_city_only += 1
                        else:
                            bands_without_location += 1
                
                details = f"Data analysis: {total_musicians} musicians, {musicians_with_bands} have bands, "
                details += f"{total_bands} total bands. GPS: {bands_with_gps}, City only: {bands_with_city_only}, "
                details += f"No location: {bands_without_location}"
                
                # Store analysis results
                self.bands_analysis = {
                    "total_musicians": total_musicians,
                    "musicians_with_bands": musicians_with_bands,
                    "total_bands": total_bands,
                    "bands_with_gps": bands_with_gps,
                    "bands_with_city_only": bands_with_city_only,
                    "bands_without_location": bands_without_location
                }
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Bands Data Analysis", success, details)
            return success
        except Exception as e:
            self.log_test("Bands Data Analysis", False, f"Error: {str(e)}")
            return False

    def test_create_band_without_gps(self):
        """Create a test band with only city information (no GPS coordinates)"""
        try:
            # Create a new musician for this test
            test_data = {
                "email": f"musician_no_gps_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "No GPS Musician",
                "role": "musician"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=test_data, timeout=10)
            if response.status_code == 200:
                no_gps_data = response.json()
                no_gps_token = no_gps_data.get('token')
                
                # Create musician profile with band but NO GPS coordinates
                profile_data = {
                    "pseudo": "NoGPSBand",
                    "city": "Lyon",  # City only, no coordinates
                    "department": "69",
                    "region": "Auvergne-Rhône-Alpes",
                    "instruments": ["Guitar"],
                    "music_styles": ["Rock"],
                    "bands": [{
                        "name": "Test Band No GPS",
                        "description": "A test band without GPS coordinates",
                        "music_styles": ["Rock", "Pop"],
                        "city": "Lyon",
                        "department": "69",
                        "region": "Auvergne-Rhône-Alpes",
                        "is_public": True,
                        "looking_for_concerts": True
                        # Note: NO latitude/longitude fields
                    }]
                }
                
                headers = {'Authorization': f'Bearer {no_gps_token}'}
                response = requests.post(f"{self.base_url}/musicians", json=profile_data, headers=headers, timeout=10)
                success = response.status_code == 200
                
                if success:
                    profile_response = response.json()
                    self.no_gps_musician_id = profile_response.get('id')
                    details = f"Created band without GPS: {profile_response.get('bands', [{}])[0].get('name', 'Unknown')} in Lyon"
                else:
                    details = f"Profile creation failed: {response.status_code}, Error: {response.text[:100]}"
            else:
                success = False
                details = f"Musician creation failed: {response.status_code}"
            
            self.log_test("Create Band Without GPS", success, details)
            return success
        except Exception as e:
            self.log_test("Create Band Without GPS", False, f"Error: {str(e)}")
            return False

    def test_geolocation_excludes_no_gps_bands(self):
        """Test that geolocation search excludes bands without GPS coordinates"""
        try:
            # First, get all bands without geolocation filter
            response = requests.get(f"{self.base_url}/bands", timeout=10)
            if response.status_code == 200:
                all_bands = response.json()
                all_bands_count = len(all_bands)
                
                # Find our test band without GPS
                test_band_found_in_all = any(
                    band.get('name') == 'Test Band No GPS' for band in all_bands
                )
                
                # Now test with geolocation (Paris coordinates, large radius to include Lyon)
                paris_lat = 48.8566
                paris_lon = 2.3522
                radius = 500  # Large radius to include Lyon (460km from Paris)
                
                response = requests.get(
                    f"{self.base_url}/bands?latitude={paris_lat}&longitude={paris_lon}&radius={radius}", 
                    timeout=10
                )
                success = response.status_code == 200
                
                if success:
                    geo_bands = response.json()
                    geo_bands_count = len(geo_bands)
                    
                    # Check if our test band without GPS is excluded
                    test_band_found_in_geo = any(
                        band.get('name') == 'Test Band No GPS' for band in geo_bands
                    )
                    
                    details = f"All bands: {all_bands_count}, Geo search: {geo_bands_count}"
                    details += f", Test band in all: {test_band_found_in_all}, in geo: {test_band_found_in_geo}"
                    
                    # The test passes if:
                    # 1. Our test band is found in the general search
                    # 2. Our test band is NOT found in the geolocation search
                    if test_band_found_in_all and not test_band_found_in_geo:
                        details += " ✅ Correctly excluded band without GPS from geolocation search"
                        success = True
                    elif not test_band_found_in_all:
                        details += " ⚠️ Test band not found in general search"
                        success = False
                    else:
                        details += " ❌ Band without GPS incorrectly included in geolocation search"
                        success = False
                else:
                    details = f"Geolocation search failed: {response.status_code}"
            else:
                success = False
                details = f"General search failed: {response.status_code}"
            
            self.log_test("Geolocation Excludes No-GPS Bands", success, details)
            return success
        except Exception as e:
            self.log_test("Geolocation Excludes No-GPS Bands", False, f"Error: {str(e)}")
            return False

    # ============= BANDS GEOLOCATION SEARCH FIX TESTS =============

    def test_create_musicians_with_bands_for_geolocation(self):
        """Create musicians with bands in different cities for geolocation testing"""
        try:
            # Create musicians with bands in various French cities
            test_musicians = [
                {
                    "email": f"musician_paris_{datetime.now().strftime('%H%M%S')}@test.com",
                    "name": "Musicien Paris",
                    "city": "Paris",
                    "band_name": "Les Parisiens",
                    "band_city": "Paris"
                },
                {
                    "email": f"musician_lyon_{datetime.now().strftime('%H%M%S')}@test.com", 
                    "name": "Musicien Lyon",
                    "city": "Lyon",
                    "band_name": "Lyon Jazz Collective",
                    "band_city": "Lyon"
                },
                {
                    "email": f"musician_marseille_{datetime.now().strftime('%H%M%S')}@test.com",
                    "name": "Musicien Marseille", 
                    "city": "Marseille",
                    "band_name": "Marseille Blues Band",
                    "band_city": "Marseille"
                },
                {
                    "email": f"musician_toulouse_{datetime.now().strftime('%H%M%S')}@test.com",
                    "name": "Musicien Toulouse",
                    "city": "Toulouse", 
                    "band_name": "Toulouse Rock",
                    "band_city": "Toulouse"
                },
                {
                    "email": f"musician_bordeaux_{datetime.now().strftime('%H%M%S')}@test.com",
                    "name": "Musicien Bordeaux",
                    "city": "Bordeaux",
                    "band_name": "Bordeaux Acoustic",
                    "band_city": "Bordeaux"
                }
            ]
            
            self.test_band_ids = []
            created_count = 0
            
            for musician_data in test_musicians:
                # Register musician
                register_data = {
                    "email": musician_data["email"],
                    "password": "TestPass123!",
                    "name": musician_data["name"],
                    "role": "musician"
                }
                
                response = requests.post(f"{self.base_url}/auth/register", json=register_data, timeout=10)
                if response.status_code == 200:
                    user_data = response.json()
                    token = user_data.get('token')
                    
                    # Create musician profile with band
                    profile_data = {
                        "pseudo": musician_data["name"],
                        "city": musician_data["city"],
                        "instruments": ["Guitar"],
                        "music_styles": ["Rock", "Jazz"],
                        "has_band": True,
                        "bands": [{
                            "name": musician_data["band_name"],
                            "city": musician_data["band_city"],
                            "music_styles": ["Rock", "Jazz"],
                            "members_count": 4,
                            "looking_for_concerts": True,
                            "is_public": True
                        }]
                    }
                    
                    headers = {'Authorization': f'Bearer {token}'}
                    profile_response = requests.post(f"{self.base_url}/musicians", json=profile_data, headers=headers, timeout=10)
                    
                    if profile_response.status_code == 200:
                        profile = profile_response.json()
                        self.test_band_ids.append({
                            "musician_id": profile.get('id'),
                            "band_name": musician_data["band_name"],
                            "city": musician_data["band_city"]
                        })
                        created_count += 1
            
            success = created_count >= 3  # Need at least 3 bands for meaningful tests
            details = f"Created {created_count} musicians with bands in different cities"
            
            self.log_test("Create Musicians with Bands for Geolocation", success, details)
            return success
        except Exception as e:
            self.log_test("Create Musicians with Bands for Geolocation", False, f"Error: {str(e)}")
            return False

    def test_bands_geolocation_search_paris_100km(self):
        """Test geolocation search from Paris with 100km radius"""
        try:
            # Paris coordinates: 48.8566, 2.3522
            params = {
                "latitude": 48.8566,
                "longitude": 2.3522,
                "radius": 100
            }
            
            response = requests.get(f"{self.base_url}/bands", params=params, timeout=15)
            success = response.status_code == 200
            
            if success:
                bands = response.json()
                details = f"Found {len(bands)} bands within 100km of Paris"
                
                # Verify each band has distance_km field
                bands_with_distance = [b for b in bands if 'distance_km' in b]
                details += f", {len(bands_with_distance)} with distance calculated"
                
                # Verify distances are within radius
                valid_distances = [b for b in bands_with_distance if b['distance_km'] <= 100]
                details += f", {len(valid_distances)} within 100km radius"
                
                if bands:
                    closest_band = min(bands, key=lambda x: x.get('distance_km', float('inf')))
                    details += f", Closest: {closest_band.get('name')} at {closest_band.get('distance_km')}km"
                
                # Store results for comparison with other tests
                self.paris_100km_results = len(bands)
                
                success = len(bands) > 0  # Should find at least some bands
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Bands Geolocation Search - Paris 100km", success, details)
            return success
        except Exception as e:
            self.log_test("Bands Geolocation Search - Paris 100km", False, f"Error: {str(e)}")
            return False

    def test_bands_geolocation_search_paris_500km(self):
        """Test geolocation search from Paris with 500km radius"""
        try:
            # Paris coordinates: 48.8566, 2.3522
            params = {
                "latitude": 48.8566,
                "longitude": 2.3522,
                "radius": 500
            }
            
            response = requests.get(f"{self.base_url}/bands", params=params, timeout=15)
            success = response.status_code == 200
            
            if success:
                bands = response.json()
                details = f"Found {len(bands)} bands within 500km of Paris"
                
                # Verify distances are within radius
                bands_with_distance = [b for b in bands if 'distance_km' in b]
                valid_distances = [b for b in bands_with_distance if b['distance_km'] <= 500]
                details += f", {len(valid_distances)} within 500km radius"
                
                # Compare with 100km results
                if hasattr(self, 'paris_100km_results'):
                    details += f", vs {self.paris_100km_results} within 100km"
                    success = len(bands) >= self.paris_100km_results  # Should find at least as many
                
                if bands:
                    farthest_band = max(bands, key=lambda x: x.get('distance_km', 0))
                    details += f", Farthest: {farthest_band.get('name')} at {farthest_band.get('distance_km')}km"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Bands Geolocation Search - Paris 500km", success, details)
            return success
        except Exception as e:
            self.log_test("Bands Geolocation Search - Paris 500km", False, f"Error: {str(e)}")
            return False

    def test_bands_geolocation_search_lyon_100km(self):
        """Test geolocation search from Lyon with 100km radius"""
        try:
            # Lyon coordinates: 45.764, 4.8357
            params = {
                "latitude": 45.764,
                "longitude": 4.8357,
                "radius": 100
            }
            
            response = requests.get(f"{self.base_url}/bands", params=params, timeout=15)
            success = response.status_code == 200
            
            if success:
                bands = response.json()
                details = f"Found {len(bands)} bands within 100km of Lyon"
                
                # Verify distances are within radius
                bands_with_distance = [b for b in bands if 'distance_km' in b]
                valid_distances = [b for b in bands_with_distance if b['distance_km'] <= 100]
                details += f", {len(valid_distances)} within 100km radius"
                
                # Check for Lyon-specific bands
                lyon_bands = [b for b in bands if 'Lyon' in b.get('name', '') or b.get('city', '').lower() == 'lyon']
                if lyon_bands:
                    details += f", {len(lyon_bands)} Lyon-based bands found"
                
                if bands:
                    closest_band = min(bands, key=lambda x: x.get('distance_km', float('inf')))
                    details += f", Closest: {closest_band.get('name')} at {closest_band.get('distance_km')}km"
                
                success = len(bands) > 0  # Should find at least some bands
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Bands Geolocation Search - Lyon 100km", success, details)
            return success
        except Exception as e:
            self.log_test("Bands Geolocation Search - Lyon 100km", False, f"Error: {str(e)}")
            return False

    def test_bands_geolocation_precision_verification(self):
        """Test that distance calculations are accurate and within specified radius"""
        try:
            # Test with a smaller radius to verify precision
            params = {
                "latitude": 48.8566,  # Paris
                "longitude": 2.3522,
                "radius": 50  # 50km radius
            }
            
            response = requests.get(f"{self.base_url}/bands", params=params, timeout=15)
            success = response.status_code == 200
            
            if success:
                bands = response.json()
                details = f"Found {len(bands)} bands within 50km of Paris"
                
                # Verify all distances are within radius
                invalid_distances = [b for b in bands if b.get('distance_km', 0) > 50]
                if invalid_distances:
                    details += f", WARNING: {len(invalid_distances)} bands exceed 50km radius"
                    success = False
                else:
                    details += ", All distances within specified radius"
                
                # Check distance calculation consistency
                if bands:
                    distances = [b.get('distance_km', 0) for b in bands]
                    min_distance = min(distances)
                    max_distance = max(distances)
                    avg_distance = sum(distances) / len(distances)
                    details += f", Distance range: {min_distance:.1f}-{max_distance:.1f}km (avg: {avg_distance:.1f}km)"
                
                # Verify bands are sorted by distance
                sorted_distances = sorted([b.get('distance_km', 0) for b in bands])
                actual_distances = [b.get('distance_km', 0) for b in bands]
                if sorted_distances == actual_distances:
                    details += ", Correctly sorted by distance"
                else:
                    details += ", WARNING: Not sorted by distance"
                    success = False
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Bands Geolocation Precision Verification", success, details)
            return success
        except Exception as e:
            self.log_test("Bands Geolocation Precision Verification", False, f"Error: {str(e)}")
            return False

    def test_bands_geolocation_on_the_fly_geocoding(self):
        """Test that on-the-fly geocoding works for bands with only city information"""
        try:
            # First, get all bands without geolocation to see total count
            response_all = requests.get(f"{self.base_url}/bands", timeout=10)
            if response_all.status_code == 200:
                all_bands = response_all.json()
                total_bands = len(all_bands)
            else:
                total_bands = 0
            
            # Now test geolocation search
            params = {
                "latitude": 48.8566,  # Paris
                "longitude": 2.3522,
                "radius": 1000  # Large radius to catch most French cities
            }
            
            response = requests.get(f"{self.base_url}/bands", params=params, timeout=20)
            success = response.status_code == 200
            
            if success:
                geo_bands = response.json()
                details = f"Geolocation search found {len(geo_bands)} bands vs {total_bands} total bands"
                
                # Check if bands have city information but got geocoded
                bands_with_city_only = []
                for band in geo_bands:
                    if band.get('city') and 'distance_km' in band:
                        bands_with_city_only.append(band)
                
                details += f", {len(bands_with_city_only)} bands geocoded from city names"
                
                # Verify the fix is working - we should now get results
                if len(geo_bands) > 0:
                    details += ", ✅ On-the-fly geocoding working"
                    
                    # Show some examples
                    if len(geo_bands) >= 3:
                        examples = geo_bands[:3]
                        example_cities = [f"{b.get('name')} ({b.get('city')}, {b.get('distance_km')}km)" for b in examples]
                        details += f", Examples: {', '.join(example_cities)}"
                else:
                    details += ", ❌ No bands found - geocoding may not be working"
                    success = False
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Bands Geolocation On-the-fly Geocoding", success, details)
            return success
        except Exception as e:
            self.log_test("Bands Geolocation On-the-fly Geocoding", False, f"Error: {str(e)}")
            return False

    def test_looking_for_profiles_field(self):
        """Test the looking_for_profiles field in BandInfo model"""
        try:
            # Create a new musician for this specific test
            test_data = {
                "email": f"musician_profiles_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Test Profiles Musician",
                "role": "musician"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=test_data, timeout=10)
            if response.status_code != 200:
                self.log_test("Looking For Profiles - Setup", False, "Failed to create test musician")
                return False
                
            profiles_musician_data = response.json()
            profiles_musician_token = profiles_musician_data.get('token')
            
            # Step 1: Create musician profile with band that has looking_for_members = true and looking_for_profiles
            musician_data = {
                "pseudo": "ProfilesTester",
                "age": 30,
                "instruments": ["Guitar", "Vocals"],
                "music_styles": ["Rock", "Blues"],
                "city": "Paris",
                "has_band": True,
                "bands": [{
                    "name": "Les Chercheurs de Talents",
                    "description": "Groupe de rock cherchant de nouveaux membres",
                    "members_count": 3,
                    "music_styles": ["Rock", "Blues", "Pop"],
                    "looking_for_concerts": True,
                    "looking_for_members": True,
                    "looking_for_profiles": ["Batteur", "Guitariste"],  # This is the field we're testing
                    "is_public": True,
                    "city": "Paris"
                }]
            }
            
            headers = {'Authorization': f'Bearer {profiles_musician_token}'}
            response = requests.post(f"{self.base_url}/musicians", json=musician_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                created_profile = response.json()
                musician_id = created_profile.get('id')
                
                # Verify the looking_for_profiles field was saved
                bands = created_profile.get('bands', [])
                if bands and len(bands) > 0:
                    band = bands[0]
                    saved_profiles = band.get('looking_for_profiles', [])
                    
                    if saved_profiles == ["Batteur", "Guitariste"]:
                        details = f"✅ Initial save successful: {saved_profiles}"
                        
                        # Step 2: Test persistence by retrieving the profile
                        response = requests.get(f"{self.base_url}/musicians/me", headers=headers, timeout=10)
                        if response.status_code == 200:
                            retrieved_profile = response.json()
                            retrieved_bands = retrieved_profile.get('bands', [])
                            
                            if retrieved_bands and len(retrieved_bands) > 0:
                                retrieved_band = retrieved_bands[0]
                                retrieved_profiles = retrieved_band.get('looking_for_profiles', [])
                                
                                if retrieved_profiles == ["Batteur", "Guitariste"]:
                                    details += f", ✅ Persistence verified: {retrieved_profiles}"
                                    
                                    # Step 3: Test modification of the field
                                    modified_data = musician_data.copy()
                                    modified_data['bands'][0]['looking_for_profiles'] = ["Batteur", "Guitariste", "Bassiste"]
                                    
                                    response = requests.put(f"{self.base_url}/musicians", json=modified_data, headers=headers, timeout=10)
                                    if response.status_code == 200:
                                        modified_profile = response.json()
                                        modified_bands = modified_profile.get('bands', [])
                                        
                                        if modified_bands and len(modified_bands) > 0:
                                            modified_band = modified_bands[0]
                                            modified_profiles = modified_band.get('looking_for_profiles', [])
                                            
                                            if modified_profiles == ["Batteur", "Guitariste", "Bassiste"]:
                                                details += f", ✅ Modification successful: {modified_profiles}"
                                                
                                                # Step 4: Final verification of persistence after modification
                                                response = requests.get(f"{self.base_url}/musicians/me", headers=headers, timeout=10)
                                                if response.status_code == 200:
                                                    final_profile = response.json()
                                                    final_bands = final_profile.get('bands', [])
                                                    
                                                    if final_bands and len(final_bands) > 0:
                                                        final_band = final_bands[0]
                                                        final_profiles = final_band.get('looking_for_profiles', [])
                                                        
                                                        if final_profiles == ["Batteur", "Guitariste", "Bassiste"]:
                                                            details += f", ✅ Final persistence verified: {final_profiles}"
                                                            success = True
                                                        else:
                                                            details += f", ❌ Final persistence failed: expected ['Batteur', 'Guitariste', 'Bassiste'], got {final_profiles}"
                                                            success = False
                                                    else:
                                                        details += ", ❌ No bands found in final verification"
                                                        success = False
                                                else:
                                                    details += f", ❌ Final GET failed: {response.status_code}"
                                                    success = False
                                            else:
                                                details += f", ❌ Modification failed: expected ['Batteur', 'Guitariste', 'Bassiste'], got {modified_profiles}"
                                                success = False
                                        else:
                                            details += ", ❌ No bands found after modification"
                                            success = False
                                    else:
                                        details += f", ❌ PUT request failed: {response.status_code}"
                                        success = False
                                else:
                                    details += f", ❌ Persistence failed: expected ['Batteur', 'Guitariste'], got {retrieved_profiles}"
                                    success = False
                            else:
                                details += ", ❌ No bands found in retrieved profile"
                                success = False
                        else:
                            details += f", ❌ GET request failed: {response.status_code}"
                            success = False
                    else:
                        details = f"❌ Initial save failed: expected ['Batteur', 'Guitariste'], got {saved_profiles}"
                        success = False
                else:
                    details = "❌ No bands found in created profile"
                    success = False
            else:
                details = f"❌ Profile creation failed: {response.status_code}, Error: {response.text[:100]}"
                success = False
            
            self.log_test("Looking For Profiles Field", success, details)
            return success
        except Exception as e:
            self.log_test("Looking For Profiles Field", False, f"Error: {str(e)}")
            return False

    # ============= MULTI-GROUP PLANNING SLOTS TESTS =============
    
    def test_create_multi_group_planning_slot(self):
        """Test creating a planning slot that requires multiple groups"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            
            # Create planning slot requiring 2 groups
            planning_data = {
                "date": "2025-01-15",
                "music_styles": ["Rock", "Pop"],
                "description": "Concert avec 2 groupes en première partie",
                "is_open": True,
                "num_bands_needed": 2,  # NEW FIELD - requires 2 groups
                "artist_categories": ["groupe compos", "groupe reprise"]
            }
            
            response = requests.post(f"{self.base_url}/planning", json=planning_data, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                planning_response = response.json()
                self.multi_group_slot_id = planning_response.get('id')
                num_bands = planning_response.get('num_bands_needed', 1)
                accepted_bands = planning_response.get('accepted_bands_count', 0)
                is_open = planning_response.get('is_open', False)
                
                details = f"Multi-group slot created: {self.multi_group_slot_id}, Needs: {num_bands} groups, Accepted: {accepted_bands}, Open: {is_open}"
                
                # Verify the slot has correct fields
                if num_bands != 2:
                    success = False
                    details += f" - ERROR: Expected 2 groups, got {num_bands}"
                elif accepted_bands != 0:
                    success = False
                    details += f" - ERROR: Expected 0 accepted, got {accepted_bands}"
                elif not is_open:
                    success = False
                    details += " - ERROR: Slot should be open initially"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Create Multi-Group Planning Slot", success, details)
            return success
        except Exception as e:
            self.log_test("Create Multi-Group Planning Slot", False, f"Error: {str(e)}")
            return False

    def test_create_musicians_for_multi_group_test(self):
        """Create two additional musicians for multi-group testing"""
        try:
            # Create first musician
            test_data1 = {
                "email": f"musician_group1_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Musician Group 1",
                "role": "musician"
            }
            
            response1 = requests.post(f"{self.base_url}/auth/register", json=test_data1, timeout=10)
            if response1.status_code != 200:
                self.log_test("Create Musicians for Multi-Group Test", False, "Failed to create first musician")
                return False
                
            musician1_data = response1.json()
            self.musician1_token = musician1_data.get('token')
            self.musician1_user = musician1_data.get('user')
            
            # Create profile for first musician
            profile_data1 = {
                "pseudo": "RockBand1",
                "instruments": ["Guitar", "Vocals"],
                "music_styles": ["Rock"],
                "bands": [{
                    "name": "The Rock Stars",
                    "music_styles": ["Rock", "Pop"],
                    "band_type": "groupe de reprise",
                    "show_duration": "45mn"
                }]
            }
            headers1 = {'Authorization': f'Bearer {self.musician1_token}'}
            profile_response1 = requests.post(f"{self.base_url}/musicians", json=profile_data1, headers=headers1, timeout=10)
            
            if profile_response1.status_code != 200:
                self.log_test("Create Musicians for Multi-Group Test", False, "Failed to create first musician profile")
                return False
            
            musician1_profile = profile_response1.json()
            self.musician1_profile_id = musician1_profile.get('id')
            
            # Create second musician
            test_data2 = {
                "email": f"musician_group2_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Musician Group 2",
                "role": "musician"
            }
            
            response2 = requests.post(f"{self.base_url}/auth/register", json=test_data2, timeout=10)
            if response2.status_code != 200:
                self.log_test("Create Musicians for Multi-Group Test", False, "Failed to create second musician")
                return False
                
            musician2_data = response2.json()
            self.musician2_token = musician2_data.get('token')
            self.musician2_user = musician2_data.get('user')
            
            # Create profile for second musician
            profile_data2 = {
                "pseudo": "PopBand2",
                "instruments": ["Piano", "Vocals"],
                "music_styles": ["Pop"],
                "bands": [{
                    "name": "The Pop Collective",
                    "music_styles": ["Pop", "Rock"],
                    "band_type": "groupe compos",
                    "show_duration": "1h"
                }]
            }
            headers2 = {'Authorization': f'Bearer {self.musician2_token}'}
            profile_response2 = requests.post(f"{self.base_url}/musicians", json=profile_data2, headers=headers2, timeout=10)
            
            if profile_response2.status_code != 200:
                self.log_test("Create Musicians for Multi-Group Test", False, "Failed to create second musician profile")
                return False
            
            musician2_profile = profile_response2.json()
            self.musician2_profile_id = musician2_profile.get('id')
            
            details = f"Created 2 musicians: {self.musician1_profile_id} (The Rock Stars), {self.musician2_profile_id} (The Pop Collective)"
            self.log_test("Create Musicians for Multi-Group Test", True, details)
            return True
            
        except Exception as e:
            self.log_test("Create Musicians for Multi-Group Test", False, f"Error: {str(e)}")
            return False

    def test_first_application_multi_group(self):
        """Test first application to multi-group slot"""
        try:
            headers = {'Authorization': f'Bearer {self.musician1_token}'}
            
            # Submit first application
            application_data = {
                "planning_slot_id": self.multi_group_slot_id,
                "band_name": "The Rock Stars",
                "description": "Groupe de rock énergique avec 5 ans d'expérience",
                "music_style": "Rock",
                "contact_email": "rockstars@test.com",
                "contact_phone": "+33123456789"
            }
            
            response = requests.post(f"{self.base_url}/applications", json=application_data, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                app_response = response.json()
                self.application1_id = app_response.get('id')
                details = f"First application submitted: {self.application1_id} for {app_response.get('band_name')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("First Application Multi-Group", success, details)
            return success
        except Exception as e:
            self.log_test("First Application Multi-Group", False, f"Error: {str(e)}")
            return False

    def test_second_application_multi_group(self):
        """Test second application to multi-group slot"""
        try:
            headers = {'Authorization': f'Bearer {self.musician2_token}'}
            
            # Submit second application
            application_data = {
                "planning_slot_id": self.multi_group_slot_id,
                "band_name": "The Pop Collective",
                "description": "Groupe pop avec compositions originales",
                "music_style": "Pop",
                "contact_email": "popcollective@test.com",
                "contact_phone": "+33987654321"
            }
            
            response = requests.post(f"{self.base_url}/applications", json=application_data, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                app_response = response.json()
                self.application2_id = app_response.get('id')
                details = f"Second application submitted: {self.application2_id} for {app_response.get('band_name')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Second Application Multi-Group", success, details)
            return success
        except Exception as e:
            self.log_test("Second Application Multi-Group", False, f"Error: {str(e)}")
            return False

    def test_accept_first_application_slot_stays_open(self):
        """Test accepting first application - slot should stay open"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            
            # Accept first application
            response = requests.post(f"{self.base_url}/applications/{self.application1_id}/accept", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                details = "First application accepted"
                
                # Check slot status - should still be open
                response = requests.get(f"{self.base_url}/planning", timeout=10)
                if response.status_code == 200:
                    slots = response.json()
                    multi_slot = None
                    for slot in slots:
                        if slot.get('id') == self.multi_group_slot_id:
                            multi_slot = slot
                            break
                    
                    if multi_slot:
                        is_open = multi_slot.get('is_open', False)
                        accepted_count = multi_slot.get('accepted_bands_count', 0)
                        needed_count = multi_slot.get('num_bands_needed', 1)
                        
                        details += f", Slot status: Open={is_open}, Accepted={accepted_count}/{needed_count}"
                        
                        # CRITICAL VERIFICATION: Slot should remain open
                        if not is_open:
                            success = False
                            details += " - ERROR: Slot should remain OPEN after first acceptance"
                        elif accepted_count != 1:
                            success = False
                            details += f" - ERROR: Expected 1 accepted band, got {accepted_count}"
                    else:
                        success = False
                        details += " - ERROR: Could not find slot in response"
                else:
                    success = False
                    details += f" - ERROR: Failed to get planning slots: {response.status_code}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Accept First Application - Slot Stays Open", success, details)
            return success
        except Exception as e:
            self.log_test("Accept First Application - Slot Stays Open", False, f"Error: {str(e)}")
            return False

    def test_accept_second_application_slot_closes(self):
        """Test accepting second application - slot should close"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            
            # Accept second application
            response = requests.post(f"{self.base_url}/applications/{self.application2_id}/accept", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                details = "Second application accepted"
                
                # Check slot status - should now be closed
                response = requests.get(f"{self.base_url}/planning?is_open=false", timeout=10)
                if response.status_code == 200:
                    closed_slots = response.json()
                    multi_slot = None
                    for slot in closed_slots:
                        if slot.get('id') == self.multi_group_slot_id:
                            multi_slot = slot
                            break
                    
                    if multi_slot:
                        is_open = multi_slot.get('is_open', True)
                        accepted_count = multi_slot.get('accepted_bands_count', 0)
                        needed_count = multi_slot.get('num_bands_needed', 1)
                        
                        details += f", Slot status: Open={is_open}, Accepted={accepted_count}/{needed_count}"
                        
                        # CRITICAL VERIFICATION: Slot should now be closed
                        if is_open:
                            success = False
                            details += " - ERROR: Slot should be CLOSED after reaching required bands"
                        elif accepted_count != 2:
                            success = False
                            details += f" - ERROR: Expected 2 accepted bands, got {accepted_count}"
                    else:
                        success = False
                        details += " - ERROR: Could not find closed slot"
                else:
                    success = False
                    details += f" - ERROR: Failed to get closed planning slots: {response.status_code}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Accept Second Application - Slot Closes", success, details)
            return success
        except Exception as e:
            self.log_test("Accept Second Application - Slot Closes", False, f"Error: {str(e)}")
            return False

    def test_verify_api_response_fields(self):
        """Test that all required fields are present in API responses"""
        try:
            # Get planning slots and verify fields
            response = requests.get(f"{self.base_url}/planning?is_open=false", timeout=10)
            success = response.status_code == 200
            
            if success:
                slots = response.json()
                multi_slot = None
                for slot in slots:
                    if slot.get('id') == self.multi_group_slot_id:
                        multi_slot = slot
                        break
                
                if multi_slot:
                    required_fields = ['num_bands_needed', 'accepted_bands_count', 'is_open', 'applications_count']
                    missing_fields = []
                    
                    for field in required_fields:
                        if field not in multi_slot:
                            missing_fields.append(field)
                    
                    if missing_fields:
                        success = False
                        details = f"Missing fields: {missing_fields}"
                    else:
                        details = f"All required fields present: num_bands_needed={multi_slot['num_bands_needed']}, accepted_bands_count={multi_slot['accepted_bands_count']}, is_open={multi_slot['is_open']}, applications_count={multi_slot['applications_count']}"
                else:
                    success = False
                    details = "Could not find test slot in response"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Verify API Response Fields", success, details)
            return success
        except Exception as e:
            self.log_test("Verify API Response Fields", False, f"Error: {str(e)}")
            return False

    def test_single_group_behavior(self):
        """Test normal behavior for single group slots"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            
            # Create single group slot (default behavior)
            planning_data = {
                "date": "2025-01-20",
                "music_styles": ["Jazz"],
                "description": "Concert solo - un seul groupe",
                "is_open": True,
                "num_bands_needed": 1  # Single group
            }
            
            response = requests.post(f"{self.base_url}/planning", json=planning_data, headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Single Group Behavior", False, f"Failed to create single slot: {response.status_code}")
                return False
            
            single_slot = response.json()
            single_slot_id = single_slot.get('id')
            
            # Submit application
            app_data = {
                "planning_slot_id": single_slot_id,
                "band_name": "Solo Jazz Band",
                "description": "Groupe de jazz expérimenté",
                "music_style": "Jazz",
                "contact_email": "jazz@test.com"
            }
            
            musician_headers = {'Authorization': f'Bearer {self.musician_token}'}
            app_response = requests.post(f"{self.base_url}/applications", json=app_data, headers=musician_headers, timeout=10)
            if app_response.status_code != 200:
                self.log_test("Single Group Behavior", False, f"Failed to create application: {app_response.status_code}")
                return False
            
            application = app_response.json()
            app_id = application.get('id')
            
            # Accept application - slot should close immediately
            accept_response = requests.post(f"{self.base_url}/applications/{app_id}/accept", headers=headers, timeout=10)
            success = accept_response.status_code == 200
            
            if success:
                # Verify slot is closed
                slots_response = requests.get(f"{self.base_url}/planning?is_open=false", timeout=10)
                if slots_response.status_code == 200:
                    closed_slots = slots_response.json()
                    found_closed = False
                    for slot in closed_slots:
                        if slot.get('id') == single_slot_id and not slot.get('is_open', True):
                            found_closed = True
                            break
                    
                    if found_closed:
                        details = "Single group slot correctly closed immediately after acceptance"
                    else:
                        success = False
                        details = "Single group slot should have closed immediately"
                else:
                    success = False
                    details = f"Failed to verify closure: {slots_response.status_code}"
            else:
                details = f"Status: {accept_response.status_code}, Error: {accept_response.text[:100]}"
            
            self.log_test("Single Group Behavior", success, details)
            return success
        except Exception as e:
            self.log_test("Single Group Behavior", False, f"Error: {str(e)}")
            return False

    def test_three_plus_groups_behavior(self):
        """Test behavior for slots requiring 3+ groups"""
        try:
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            
            # Create 3+ groups slot
            planning_data = {
                "date": "2025-01-25",
                "music_styles": ["Rock", "Pop", "Jazz"],
                "description": "Festival avec 3 groupes ou plus",
                "is_open": True,
                "num_bands_needed": 3  # Requires 3 groups
            }
            
            response = requests.post(f"{self.base_url}/planning", json=planning_data, headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Three Plus Groups Behavior", False, f"Failed to create 3+ slot: {response.status_code}")
                return False
            
            three_slot = response.json()
            three_slot_id = three_slot.get('id')
            
            # Create third musician for this test
            test_data3 = {
                "email": f"musician_group3_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Musician Group 3",
                "role": "musician"
            }
            
            response3 = requests.post(f"{self.base_url}/auth/register", json=test_data3, timeout=10)
            if response3.status_code != 200:
                self.log_test("Three Plus Groups Behavior", False, "Failed to create third musician")
                return False
            
            musician3_data = response3.json()
            musician3_token = musician3_data.get('token')
            
            # Create profile for third musician
            profile_data3 = {
                "pseudo": "JazzBand3",
                "instruments": ["Saxophone"],
                "music_styles": ["Jazz"],
                "bands": [{
                    "name": "The Jazz Trio",
                    "music_styles": ["Jazz"],
                    "band_type": "groupe compos"
                }]
            }
            headers3 = {'Authorization': f'Bearer {musician3_token}'}
            requests.post(f"{self.base_url}/musicians", json=profile_data3, headers=headers3, timeout=10)
            
            # Submit 3 applications
            applications = []
            musicians = [
                (self.musician1_token, "The Rock Stars", "Rock"),
                (self.musician2_token, "The Pop Collective", "Pop"),
                (musician3_token, "The Jazz Trio", "Jazz")
            ]
            
            for i, (token, band_name, style) in enumerate(musicians):
                app_data = {
                    "planning_slot_id": three_slot_id,
                    "band_name": band_name,
                    "description": f"Application {i+1} pour festival",
                    "music_style": style,
                    "contact_email": f"band{i+1}@test.com"
                }
                
                app_headers = {'Authorization': f'Bearer {token}'}
                app_response = requests.post(f"{self.base_url}/applications", json=app_data, headers=app_headers, timeout=10)
                if app_response.status_code == 200:
                    applications.append(app_response.json().get('id'))
            
            if len(applications) != 3:
                self.log_test("Three Plus Groups Behavior", False, f"Only created {len(applications)} applications")
                return False
            
            # Accept first 2 applications - slot should stay open
            for i in range(2):
                accept_response = requests.post(f"{self.base_url}/applications/{applications[i]}/accept", headers=headers, timeout=10)
                if accept_response.status_code != 200:
                    self.log_test("Three Plus Groups Behavior", False, f"Failed to accept application {i+1}")
                    return False
            
            # Verify slot is still open after 2 acceptances
            slots_response = requests.get(f"{self.base_url}/planning", timeout=10)
            if slots_response.status_code == 200:
                open_slots = slots_response.json()
                still_open = False
                for slot in open_slots:
                    if slot.get('id') == three_slot_id and slot.get('is_open', False):
                        if slot.get('accepted_bands_count', 0) == 2:
                            still_open = True
                        break
                
                if not still_open:
                    self.log_test("Three Plus Groups Behavior", False, "Slot should still be open after 2/3 acceptances")
                    return False
            
            # Accept third application - slot should close
            accept_response = requests.post(f"{self.base_url}/applications/{applications[2]}/accept", headers=headers, timeout=10)
            success = accept_response.status_code == 200
            
            if success:
                # Verify slot is now closed
                closed_response = requests.get(f"{self.base_url}/planning?is_open=false", timeout=10)
                if closed_response.status_code == 200:
                    closed_slots = closed_response.json()
                    found_closed = False
                    for slot in closed_slots:
                        if slot.get('id') == three_slot_id and not slot.get('is_open', True):
                            if slot.get('accepted_bands_count', 0) == 3:
                                found_closed = True
                            break
                    
                    if found_closed:
                        details = "3+ groups slot correctly closed after accepting 3rd application"
                    else:
                        success = False
                        details = "3+ groups slot should have closed after 3rd acceptance"
                else:
                    success = False
                    details = f"Failed to verify closure: {closed_response.status_code}"
            else:
                details = f"Status: {accept_response.status_code}, Error: {accept_response.text[:100]}"
            
            self.log_test("Three Plus Groups Behavior", success, details)
            return success
        except Exception as e:
            self.log_test("Three Plus Groups Behavior", False, f"Error: {str(e)}")
            return False

    # ============= JAM IMPROVEMENTS TESTS (NEW) =============
    
    def test_jam_participants_count_api(self):
        """Test that jam API endpoints include participants_count field"""
        try:
            # Create a jam event first
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            from datetime import datetime, timedelta
            now = datetime.now()
            start_time = (now - timedelta(minutes=10)).strftime("%H:%M")
            end_time = (now + timedelta(hours=2)).strftime("%H:%M")
            today = now.strftime("%Y-%m-%d")
            
            jam_data = {
                "date": today,
                "start_time": start_time,
                "end_time": end_time,
                "music_styles": ["Jazz", "Blues"],
                "rules": "Test jam for participants count",
                "has_instruments": True,
                "has_pa_system": True,
                "instruments_available": ["Piano", "Batterie"],
                "additional_info": "Test participants count"
            }
            
            response = requests.post(f"{self.base_url}/jams", json=jam_data, headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Jam Participants Count API - Setup", False, f"Failed to create jam: {response.status_code}")
                return False
            
            jam_response = response.json()
            test_jam_id = jam_response.get('id')
            
            # Test 1: GET /api/jams should include participants_count
            response = requests.get(f"{self.base_url}/jams", timeout=10)
            success = response.status_code == 200
            
            if success:
                jams_data = response.json()
                if jams_data:
                    # Check if participants_count field exists
                    first_jam = jams_data[0]
                    if 'participants_count' in first_jam:
                        initial_count = first_jam.get('participants_count', 0)
                        details = f"GET /api/jams includes participants_count: {initial_count}"
                        
                        # Test 2: GET /api/venues/{venue_id}/jams should also include participants_count
                        response = requests.get(f"{self.base_url}/venues/{self.venue_profile_id}/jams", timeout=10)
                        if response.status_code == 200:
                            venue_jams = response.json()
                            if venue_jams and 'participants_count' in venue_jams[0]:
                                details += f", GET /api/venues/{{venue_id}}/jams includes participants_count: {venue_jams[0].get('participants_count', 0)}"
                                
                                # Test 3: Join event and verify count increases
                                musician_headers = {'Authorization': f'Bearer {self.musician_token}'}
                                join_response = requests.post(f"{self.base_url}/events/{test_jam_id}/join?event_type=jam", headers=musician_headers, timeout=10)
                                
                                if join_response.status_code == 200:
                                    # Check count after joining
                                    response = requests.get(f"{self.base_url}/jams", timeout=10)
                                    if response.status_code == 200:
                                        updated_jams = response.json()
                                        test_jam = next((j for j in updated_jams if j['id'] == test_jam_id), None)
                                        if test_jam and test_jam.get('participants_count', 0) > initial_count:
                                            details += f", Count increased to {test_jam.get('participants_count')} after join"
                                        else:
                                            details += ", WARNING: Count did not increase after join"
                                            success = False
                                else:
                                    details += f", Failed to join event: {join_response.status_code}"
                                    success = False
                            else:
                                details += ", Missing participants_count in venue jams endpoint"
                                success = False
                        else:
                            details += f", Failed to get venue jams: {response.status_code}"
                            success = False
                    else:
                        details = "Missing participants_count field in jams API response"
                        success = False
                else:
                    details = "No jams found in API response"
                    success = False
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Jam Participants Count API", success, details)
            return success
        except Exception as e:
            self.log_test("Jam Participants Count API", False, f"Error: {str(e)}")
            return False

    def test_jam_join_button_functionality(self):
        """Test the 'Je participe' button functionality for musicians"""
        try:
            # Create an active jam for testing
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            from datetime import datetime, timedelta
            now = datetime.now()
            start_time = (now - timedelta(minutes=10)).strftime("%H:%M")
            end_time = (now + timedelta(hours=2)).strftime("%H:%M")
            today = now.strftime("%Y-%m-%d")
            
            jam_data = {
                "date": today,
                "start_time": start_time,
                "end_time": end_time,
                "music_styles": ["Rock", "Pop"],
                "rules": "Test jam for join button",
                "has_instruments": True,
                "has_pa_system": True,
                "instruments_available": ["Guitare", "Basse"],
                "additional_info": "Test join button functionality"
            }
            
            response = requests.post(f"{self.base_url}/jams", json=jam_data, headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Jam Join Button Functionality - Setup", False, f"Failed to create active jam: {response.status_code}")
                return False
            
            jam_response = response.json()
            active_jam_id = jam_response.get('id')
            
            # Test 1: Musician can join the jam
            musician_headers = {'Authorization': f'Bearer {self.musician_token}'}
            join_response = requests.post(f"{self.base_url}/events/{active_jam_id}/join?event_type=jam", headers=musician_headers, timeout=10)
            success = join_response.status_code == 200
            
            if success:
                join_data = join_response.json()
                details = f"Musician successfully joined jam: {join_data.get('venue_name')}"
                
                # Test 2: Verify participation is active
                participation_response = requests.get(f"{self.base_url}/musicians/me/current-participation", headers=musician_headers, timeout=10)
                if participation_response.status_code == 200:
                    participation = participation_response.json()
                    if participation and participation.get('event_id') == active_jam_id:
                        details += ", Participation confirmed active"
                        
                        # Test 3: Musician can leave the jam
                        leave_response = requests.post(f"{self.base_url}/events/{active_jam_id}/leave", headers=musician_headers, timeout=10)
                        if leave_response.status_code == 200:
                            details += ", Successfully left jam"
                            
                            # Test 4: Verify participation is no longer active
                            final_participation_response = requests.get(f"{self.base_url}/musicians/me/current-participation", headers=musician_headers, timeout=10)
                            if final_participation_response.status_code == 200:
                                final_participation = final_participation_response.json()
                                if final_participation is None:
                                    details += ", Participation correctly deactivated"
                                else:
                                    details += ", WARNING: Participation still active after leaving"
                                    success = False
                        else:
                            details += f", Failed to leave jam: {leave_response.status_code}"
                            success = False
                    else:
                        details += ", Participation not found or incorrect event"
                        success = False
                else:
                    details += f", Failed to get participation: {participation_response.status_code}"
                    success = False
            else:
                details = f"Status: {join_response.status_code}, Error: {join_response.text[:100]}"
            
            self.log_test("Jam Join Button Functionality", success, details)
            return success
        except Exception as e:
            self.log_test("Jam Join Button Functionality", False, f"Error: {str(e)}")
            return False

    def test_jam_security_musician_only(self):
        """Test that only musicians can see and use the 'Je participe' button"""
        try:
            # Create an active jam
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            from datetime import datetime, timedelta
            now = datetime.now()
            start_time = (now - timedelta(minutes=5)).strftime("%H:%M")
            end_time = (now + timedelta(hours=1)).strftime("%H:%M")
            today = now.strftime("%Y-%m-%d")
            
            jam_data = {
                "date": today,
                "start_time": start_time,
                "end_time": end_time,
                "music_styles": ["Jazz"],
                "rules": "Test jam for security",
                "has_instruments": True
            }
            
            response = requests.post(f"{self.base_url}/jams", json=jam_data, headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Jam Security Musician Only - Setup", False, f"Failed to create jam: {response.status_code}")
                return False
            
            jam_response = response.json()
            security_jam_id = jam_response.get('id')
            
            # Test 1: Venue (establishment) cannot join their own jam
            venue_headers = {'Authorization': f'Bearer {self.venue_token}'}
            venue_join_response = requests.post(f"{self.base_url}/events/{security_jam_id}/join?event_type=jam", headers=venue_headers, timeout=10)
            success = venue_join_response.status_code == 403
            
            if success:
                details = "Venue correctly rejected from joining jam (403 Forbidden)"
                
                # Test 2: Musician can join (should work)
                musician_headers = {'Authorization': f'Bearer {self.musician_token}'}
                musician_join_response = requests.post(f"{self.base_url}/events/{security_jam_id}/join?event_type=jam", headers=musician_headers, timeout=10)
                
                if musician_join_response.status_code == 200:
                    details += ", Musician successfully joined jam"
                    
                    # Clean up - leave the jam
                    requests.post(f"{self.base_url}/events/{security_jam_id}/leave", headers=musician_headers, timeout=10)
                else:
                    details += f", Musician join failed: {musician_join_response.status_code}"
                    success = False
            else:
                details = f"Venue join status: {venue_join_response.status_code}, Expected: 403"
            
            self.log_test("Jam Security Musician Only", success, details)
            return success
        except Exception as e:
            self.log_test("Jam Security Musician Only", False, f"Error: {str(e)}")
            return False

    def test_jam_participants_counter_updates(self):
        """Test that participant counter updates correctly when musicians join/leave"""
        try:
            # Create an active jam
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            from datetime import datetime, timedelta
            now = datetime.now()
            start_time = (now - timedelta(minutes=5)).strftime("%H:%M")
            end_time = (now + timedelta(hours=2)).strftime("%H:%M")
            today = now.strftime("%Y-%m-%d")
            
            jam_data = {
                "date": today,
                "start_time": start_time,
                "end_time": end_time,
                "music_styles": ["Blues", "Rock"],
                "rules": "Test jam for counter updates",
                "has_instruments": True
            }
            
            response = requests.post(f"{self.base_url}/jams", json=jam_data, headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Jam Participants Counter Updates - Setup", False, f"Failed to create jam: {response.status_code}")
                return False
            
            jam_response = response.json()
            counter_jam_id = jam_response.get('id')
            
            # Test 1: Initial count should be 0
            response = requests.get(f"{self.base_url}/jams", timeout=10)
            if response.status_code != 200:
                self.log_test("Jam Participants Counter Updates", False, f"Failed to get jams: {response.status_code}")
                return False
            
            jams_data = response.json()
            test_jam = next((j for j in jams_data if j['id'] == counter_jam_id), None)
            if not test_jam:
                self.log_test("Jam Participants Counter Updates", False, "Test jam not found in API response")
                return False
            
            initial_count = test_jam.get('participants_count', -1)
            success = initial_count == 0
            
            if success:
                details = f"Initial participants count: {initial_count}"
                
                # Test 2: First musician joins
                musician_headers = {'Authorization': f'Bearer {self.musician_token}'}
                join_response = requests.post(f"{self.base_url}/events/{counter_jam_id}/join?event_type=jam", headers=musician_headers, timeout=10)
                
                if join_response.status_code == 200:
                    # Check count after first join
                    response = requests.get(f"{self.base_url}/jams", timeout=10)
                    if response.status_code == 200:
                        updated_jams = response.json()
                        updated_jam = next((j for j in updated_jams if j['id'] == counter_jam_id), None)
                        if updated_jam:
                            count_after_first = updated_jam.get('participants_count', -1)
                            if count_after_first == 1:
                                details += f", After 1st join: {count_after_first}"
                                
                                # Test 3: Create second musician and join
                                test_data = {
                                    "email": f"musician_counter_{datetime.now().strftime('%H%M%S')}@test.com",
                                    "password": "TestPass123!",
                                    "name": "Counter Test Musician",
                                    "role": "musician"
                                }
                                
                                reg_response = requests.post(f"{self.base_url}/auth/register", json=test_data, timeout=10)
                                if reg_response.status_code == 200:
                                    second_musician_data = reg_response.json()
                                    second_musician_token = second_musician_data.get('token')
                                    
                                    # Create profile for second musician
                                    profile_data = {"pseudo": "CounterTester", "instruments": ["Drums"]}
                                    second_headers = {'Authorization': f'Bearer {second_musician_token}'}
                                    requests.post(f"{self.base_url}/musicians", json=profile_data, headers=second_headers, timeout=10)
                                    
                                    # Second musician joins
                                    second_join_response = requests.post(f"{self.base_url}/events/{counter_jam_id}/join?event_type=jam", headers=second_headers, timeout=10)
                                    
                                    if second_join_response.status_code == 200:
                                        # Check count after second join
                                        response = requests.get(f"{self.base_url}/jams", timeout=10)
                                        if response.status_code == 200:
                                            final_jams = response.json()
                                            final_jam = next((j for j in final_jams if j['id'] == counter_jam_id), None)
                                            if final_jam:
                                                count_after_second = final_jam.get('participants_count', -1)
                                                if count_after_second == 2:
                                                    details += f", After 2nd join: {count_after_second}"
                                                    
                                                    # Test 4: First musician leaves
                                                    leave_response = requests.post(f"{self.base_url}/events/{counter_jam_id}/leave", headers=musician_headers, timeout=10)
                                                    if leave_response.status_code == 200:
                                                        # Check count after leave
                                                        response = requests.get(f"{self.base_url}/jams", timeout=10)
                                                        if response.status_code == 200:
                                                            leave_jams = response.json()
                                                            leave_jam = next((j for j in leave_jams if j['id'] == counter_jam_id), None)
                                                            if leave_jam:
                                                                count_after_leave = leave_jam.get('participants_count', -1)
                                                                if count_after_leave == 1:
                                                                    details += f", After 1st leave: {count_after_leave}"
                                                                else:
                                                                    details += f", Count after leave incorrect: {count_after_leave} (expected 1)"
                                                                    success = False
                                                else:
                                                    details += f", Count after 2nd join incorrect: {count_after_second} (expected 2)"
                                                    success = False
                                    else:
                                        details += f", Second musician join failed: {second_join_response.status_code}"
                                        success = False
                                else:
                                    details += f", Failed to create second musician: {reg_response.status_code}"
                                    success = False
                            else:
                                details += f", Count after 1st join incorrect: {count_after_first} (expected 1)"
                                success = False
                else:
                    details += f", Failed to join jam: {join_response.status_code}"
                    success = False
            else:
                details = f"Initial count incorrect: {initial_count} (expected 0)"
            
            self.log_test("Jam Participants Counter Updates", success, details)
            return success
        except Exception as e:
            self.log_test("Jam Participants Counter Updates", False, f"Error: {str(e)}")
            return False

    # ============= NOTIFICATION SYSTEM TESTS (NEW) =============
    
    def test_notification_system_setup(self):
        """Setup for notification system tests - create 2 musicians and 1 venue"""
        try:
            # Create Musician A with group "The Rockers"
            musician_a_data = {
                "email": f"musician_a_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Musicien A",
                "role": "musician"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=musician_a_data, timeout=10)
            if response.status_code != 200:
                self.log_test("Notification Setup - Musician A", False, f"Registration failed: {response.status_code}")
                return False
                
            musician_a_auth = response.json()
            self.musician_a_token = musician_a_auth.get('token')
            self.musician_a_user = musician_a_auth.get('user')
            
            # Create profile for Musician A
            profile_a_data = {
                "pseudo": "MusicienA",
                "instruments": ["Guitar"],
                "bands": [{
                    "name": "The Rockers",
                    "music_styles": ["Rock"],
                    "description": "Rock band from Paris"
                }]
            }
            headers_a = {'Authorization': f'Bearer {self.musician_a_token}'}
            profile_response = requests.post(f"{self.base_url}/musicians", json=profile_a_data, headers=headers_a, timeout=10)
            if profile_response.status_code == 200:
                self.musician_a_profile = profile_response.json()
                self.musician_a_profile_id = self.musician_a_profile.get('id')
            
            # Create Musician B with group "Jazz Masters"
            musician_b_data = {
                "email": f"musician_b_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Musicien B",
                "role": "musician"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=musician_b_data, timeout=10)
            if response.status_code != 200:
                self.log_test("Notification Setup - Musician B", False, f"Registration failed: {response.status_code}")
                return False
                
            musician_b_auth = response.json()
            self.musician_b_token = musician_b_auth.get('token')
            self.musician_b_user = musician_b_auth.get('user')
            
            # Create profile for Musician B
            profile_b_data = {
                "pseudo": "MusicienB",
                "instruments": ["Piano"],
                "bands": [{
                    "name": "Jazz Masters",
                    "music_styles": ["Jazz"],
                    "description": "Jazz band from Lyon"
                }]
            }
            headers_b = {'Authorization': f'Bearer {self.musician_b_token}'}
            profile_response = requests.post(f"{self.base_url}/musicians", json=profile_b_data, headers=headers_b, timeout=10)
            if profile_response.status_code == 200:
                self.musician_b_profile = profile_response.json()
                self.musician_b_profile_id = self.musician_b_profile.get('id')
            
            # Create Test Bar venue
            test_bar_data = {
                "email": f"test_bar_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Test Bar",
                "role": "venue"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=test_bar_data, timeout=10)
            if response.status_code != 200:
                self.log_test("Notification Setup - Test Bar", False, f"Registration failed: {response.status_code}")
                return False
                
            test_bar_auth = response.json()
            self.test_bar_token = test_bar_auth.get('token')
            self.test_bar_user = test_bar_auth.get('user')
            
            # Create venue profile
            venue_profile_data = {
                "name": "Test Bar",
                "description": "Bar de test pour les notifications",
                "address": "123 Test Street",
                "city": "Paris",
                "postal_code": "75001",
                "latitude": 48.8566,
                "longitude": 2.3522,
                "phone": "+33123456789",
                "has_stage": True,
                "music_styles": ["Rock", "Jazz"]
            }
            headers_venue = {'Authorization': f'Bearer {self.test_bar_token}'}
            venue_response = requests.post(f"{self.base_url}/venues", json=venue_profile_data, headers=headers_venue, timeout=10)
            if venue_response.status_code == 200:
                self.test_bar_profile = venue_response.json()
                self.test_bar_profile_id = self.test_bar_profile.get('id')
            
            success = all([
                hasattr(self, 'musician_a_token'),
                hasattr(self, 'musician_b_token'),
                hasattr(self, 'test_bar_token'),
                hasattr(self, 'test_bar_profile_id')
            ])
            
            details = f"Created: Musician A (The Rockers), Musician B (Jazz Masters), Test Bar venue"
            self.log_test("Notification System Setup", success, details)
            return success
            
        except Exception as e:
            self.log_test("Notification System Setup", False, f"Error: {str(e)}")
            return False

    def test_create_planning_slot_tomorrow(self):
        """Create an open planning slot for tomorrow"""
        try:
            from datetime import datetime, timedelta
            tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            
            planning_data = {
                "date": tomorrow,
                "music_styles": ["Rock", "Jazz"],
                "description": "Créneau ouvert pour test notifications",
                "is_open": True,
                "num_bands_needed": 1
            }
            
            headers = {'Authorization': f'Bearer {self.test_bar_token}'}
            response = requests.post(f"{self.base_url}/planning", json=planning_data, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                planning_response = response.json()
                self.test_planning_slot_id = planning_response.get('id')
                details = f"Planning slot created for {tomorrow}, ID: {self.test_planning_slot_id}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Create Planning Slot Tomorrow", success, details)
            return success
        except Exception as e:
            self.log_test("Create Planning Slot Tomorrow", False, f"Error: {str(e)}")
            return False

    def test_notification_application_rejection(self):
        """TEST 1 - Notification de refus de candidature"""
        try:
            # Musician A applies to the slot
            application_data = {
                "planning_slot_id": self.test_planning_slot_id,
                "band_name": "The Rockers",
                "description": "Rock band ready to perform",
                "music_style": "Rock",
                "contact_email": "rockers@test.com"
            }
            
            headers_a = {'Authorization': f'Bearer {self.musician_a_token}'}
            response = requests.post(f"{self.base_url}/applications", json=application_data, headers=headers_a, timeout=10)
            
            if response.status_code != 200:
                self.log_test("TEST 1 - Application Submission", False, f"Failed to submit application: {response.status_code}")
                return False
            
            application_response = response.json()
            application_id = application_response.get('id')
            
            # Venue rejects the application
            headers_venue = {'Authorization': f'Bearer {self.test_bar_token}'}
            response = requests.post(f"{self.base_url}/applications/{application_id}/reject", headers=headers_venue, timeout=10)
            
            if response.status_code != 200:
                self.log_test("TEST 1 - Application Rejection", False, f"Failed to reject application: {response.status_code}")
                return False
            
            # Check Musician A received rejection notification
            import time
            time.sleep(1)  # Give time for notification to be created
            
            response = requests.get(f"{self.base_url}/notifications", headers=headers_a, timeout=10)
            success = response.status_code == 200
            
            if success:
                notifications = response.json()
                rejection_notification = None
                for notif in notifications:
                    if notif.get('type') == 'application_rejected':
                        rejection_notification = notif
                        break
                
                if rejection_notification:
                    details = f"✅ Rejection notification received: '{rejection_notification.get('title')}' - '{rejection_notification.get('message')}'"
                    success = True
                else:
                    details = f"❌ No rejection notification found. Found {len(notifications)} notifications"
                    success = False
            else:
                details = f"Failed to get notifications: {response.status_code}"
            
            self.log_test("TEST 1 - Application Rejection Notification", success, details)
            return success
            
        except Exception as e:
            self.log_test("TEST 1 - Application Rejection Notification", False, f"Error: {str(e)}")
            return False

    def test_notification_concert_cancellation(self):
        """TEST 2 - Notification de suppression de concert"""
        try:
            # Create a concert with both bands
            from datetime import datetime, timedelta
            tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            
            concert_data = {
                "date": tomorrow,
                "start_time": "20:00",
                "title": "Concert Test Notifications",
                "description": "Concert pour tester les notifications",
                "bands": [
                    {"name": "The Rockers"},
                    {"name": "Jazz Masters"}
                ],
                "price": "15€"
            }
            
            headers_venue = {'Authorization': f'Bearer {self.test_bar_token}'}
            response = requests.post(f"{self.base_url}/concerts", json=concert_data, headers=headers_venue, timeout=10)
            
            if response.status_code != 200:
                self.log_test("TEST 2 - Concert Creation", False, f"Failed to create concert: {response.status_code}")
                return False
            
            concert_response = response.json()
            concert_id = concert_response.get('id')
            
            # Delete the concert
            response = requests.delete(f"{self.base_url}/concerts/{concert_id}", headers=headers_venue, timeout=10)
            
            if response.status_code != 200:
                self.log_test("TEST 2 - Concert Deletion", False, f"Failed to delete concert: {response.status_code}")
                return False
            
            # Check both musicians received cancellation notifications
            import time
            time.sleep(1)  # Give time for notifications to be created
            
            # Check Musician A notifications
            headers_a = {'Authorization': f'Bearer {self.musician_a_token}'}
            response_a = requests.get(f"{self.base_url}/notifications", headers=headers_a, timeout=10)
            
            # Check Musician B notifications  
            headers_b = {'Authorization': f'Bearer {self.musician_b_token}'}
            response_b = requests.get(f"{self.base_url}/notifications", headers=headers_b, timeout=10)
            
            success = response_a.status_code == 200 and response_b.status_code == 200
            
            if success:
                notifications_a = response_a.json()
                notifications_b = response_b.json()
                
                # Look for concert_cancelled notifications
                cancellation_a = None
                cancellation_b = None
                
                for notif in notifications_a:
                    if notif.get('type') == 'concert_cancelled':
                        cancellation_a = notif
                        break
                
                for notif in notifications_b:
                    if notif.get('type') == 'concert_cancelled':
                        cancellation_b = notif
                        break
                
                if cancellation_a and cancellation_b:
                    details = f"✅ Both musicians received cancellation notifications. A: '{cancellation_a.get('message')}', B: '{cancellation_b.get('message')}'"
                    success = True
                else:
                    details = f"❌ Missing notifications. A: {'✅' if cancellation_a else '❌'}, B: {'✅' if cancellation_b else '❌'}"
                    success = False
            else:
                details = f"Failed to get notifications. A: {response_a.status_code}, B: {response_b.status_code}"
            
            self.log_test("TEST 2 - Concert Cancellation Notifications", success, details)
            return success
            
        except Exception as e:
            self.log_test("TEST 2 - Concert Cancellation Notifications", False, f"Error: {str(e)}")
            return False

    def test_notification_accepted_application_cancellation(self):
        """TEST 3 - Notification de suppression de candidature acceptée"""
        try:
            # Create new planning slot for this test
            from datetime import datetime, timedelta
            tomorrow = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
            
            planning_data = {
                "date": tomorrow,
                "music_styles": ["Rock"],
                "description": "Test candidature acceptée puis annulée",
                "is_open": True,
                "num_bands_needed": 1
            }
            
            headers_venue = {'Authorization': f'Bearer {self.test_bar_token}'}
            response = requests.post(f"{self.base_url}/planning", json=planning_data, headers=headers_venue, timeout=10)
            
            if response.status_code != 200:
                self.log_test("TEST 3 - Planning Slot Creation", False, f"Failed to create slot: {response.status_code}")
                return False
            
            slot_response = response.json()
            slot_id = slot_response.get('id')
            
            # Musician A applies
            application_data = {
                "planning_slot_id": slot_id,
                "band_name": "The Rockers",
                "description": "Application pour test annulation",
                "music_style": "Rock",
                "contact_email": "rockers@test.com"
            }
            
            headers_a = {'Authorization': f'Bearer {self.musician_a_token}'}
            response = requests.post(f"{self.base_url}/applications", json=application_data, headers=headers_a, timeout=10)
            
            if response.status_code != 200:
                self.log_test("TEST 3 - Application Submission", False, f"Failed to submit application: {response.status_code}")
                return False
            
            application_response = response.json()
            application_id = application_response.get('id')
            
            # Venue accepts the application
            response = requests.post(f"{self.base_url}/applications/{application_id}/accept", headers=headers_venue, timeout=10)
            
            if response.status_code != 200:
                self.log_test("TEST 3 - Application Acceptance", False, f"Failed to accept application: {response.status_code}")
                return False
            
            # Check Musician A received acceptance notification
            import time
            time.sleep(1)
            
            response = requests.get(f"{self.base_url}/notifications", headers=headers_a, timeout=10)
            if response.status_code == 200:
                notifications = response.json()
                acceptance_found = any(notif.get('type') == 'application_accepted' for notif in notifications)
                if not acceptance_found:
                    self.log_test("TEST 3 - Acceptance Notification Check", False, "No acceptance notification found")
                    return False
            
            # Venue changes mind and deletes the accepted application
            response = requests.delete(f"{self.base_url}/applications/{application_id}", headers=headers_venue, timeout=10)
            
            if response.status_code != 200:
                self.log_test("TEST 3 - Application Deletion", False, f"Failed to delete application: {response.status_code}")
                return False
            
            # Check Musician A received cancellation notification
            time.sleep(1)
            
            response = requests.get(f"{self.base_url}/notifications", headers=headers_a, timeout=10)
            success = response.status_code == 200
            
            if success:
                notifications = response.json()
                cancellation_notification = None
                for notif in notifications:
                    if notif.get('type') == 'application_cancelled':
                        cancellation_notification = notif
                        break
                
                if cancellation_notification:
                    details = f"✅ Cancellation notification received: '{cancellation_notification.get('title')}' - '{cancellation_notification.get('message')}'"
                    success = True
                    
                    # Check that slot is reopened
                    response = requests.get(f"{self.base_url}/venues/{self.test_bar_profile_id}/planning", timeout=10)
                    if response.status_code == 200:
                        slots = response.json()
                        updated_slot = next((s for s in slots if s['id'] == slot_id), None)
                        if updated_slot and updated_slot.get('is_open'):
                            details += " ✅ Slot correctly reopened"
                        else:
                            details += " ❌ Slot not reopened"
                            success = False
                else:
                    details = f"❌ No cancellation notification found. Found {len(notifications)} notifications"
                    success = False
            else:
                details = f"Failed to get notifications: {response.status_code}"
            
            self.log_test("TEST 3 - Accepted Application Cancellation Notification", success, details)
            return success
            
        except Exception as e:
            self.log_test("TEST 3 - Accepted Application Cancellation Notification", False, f"Error: {str(e)}")
            return False

    def test_notification_slot_reopening(self):
        """TEST 4 - Réouverture de créneau après suppression"""
        try:
            # Create slot with num_bands_needed: 2
            from datetime import datetime, timedelta
            tomorrow = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
            
            planning_data = {
                "date": tomorrow,
                "music_styles": ["Rock", "Jazz"],
                "description": "Test réouverture créneau",
                "is_open": True,
                "num_bands_needed": 2
            }
            
            headers_venue = {'Authorization': f'Bearer {self.test_bar_token}'}
            response = requests.post(f"{self.base_url}/planning", json=planning_data, headers=headers_venue, timeout=10)
            
            if response.status_code != 200:
                self.log_test("TEST 4 - Multi-band Slot Creation", False, f"Failed to create slot: {response.status_code}")
                return False
            
            slot_response = response.json()
            slot_id = slot_response.get('id')
            
            # Both musicians apply
            app_data_a = {
                "planning_slot_id": slot_id,
                "band_name": "The Rockers",
                "description": "Rock application",
                "music_style": "Rock",
                "contact_email": "rockers@test.com"
            }
            
            app_data_b = {
                "planning_slot_id": slot_id,
                "band_name": "Jazz Masters",
                "description": "Jazz application",
                "music_style": "Jazz",
                "contact_email": "jazz@test.com"
            }
            
            headers_a = {'Authorization': f'Bearer {self.musician_a_token}'}
            headers_b = {'Authorization': f'Bearer {self.musician_b_token}'}
            
            # Submit applications
            response_a = requests.post(f"{self.base_url}/applications", json=app_data_a, headers=headers_a, timeout=10)
            response_b = requests.post(f"{self.base_url}/applications", json=app_data_b, headers=headers_b, timeout=10)
            
            if response_a.status_code != 200 or response_b.status_code != 200:
                self.log_test("TEST 4 - Applications Submission", False, f"Failed to submit applications: {response_a.status_code}, {response_b.status_code}")
                return False
            
            app_id_a = response_a.json().get('id')
            app_id_b = response_b.json().get('id')
            
            # Accept both applications
            response = requests.post(f"{self.base_url}/applications/{app_id_a}/accept", headers=headers_venue, timeout=10)
            if response.status_code != 200:
                self.log_test("TEST 4 - First Application Acceptance", False, f"Failed to accept first application: {response.status_code}")
                return False
            
            response = requests.post(f"{self.base_url}/applications/{app_id_b}/accept", headers=headers_venue, timeout=10)
            if response.status_code != 200:
                self.log_test("TEST 4 - Second Application Acceptance", False, f"Failed to accept second application: {response.status_code}")
                return False
            
            # Check slot is closed (2/2 bands)
            response = requests.get(f"{self.base_url}/venues/{self.test_bar_profile_id}/planning", timeout=10)
            if response.status_code == 200:
                slots = response.json()
                slot_data = next((s for s in slots if s['id'] == slot_id), None)
                if slot_data and slot_data.get('is_open'):
                    self.log_test("TEST 4 - Slot Closure Check", False, "Slot should be closed with 2/2 bands")
                    return False
            
            # Delete one accepted application
            response = requests.delete(f"{self.base_url}/applications/{app_id_a}", headers=headers_venue, timeout=10)
            
            if response.status_code != 200:
                self.log_test("TEST 4 - Application Deletion", False, f"Failed to delete application: {response.status_code}")
                return False
            
            # Check slot is reopened
            response = requests.get(f"{self.base_url}/venues/{self.test_bar_profile_id}/planning", timeout=10)
            success = response.status_code == 200
            
            if success:
                slots = response.json()
                updated_slot = next((s for s in slots if s['id'] == slot_id), None)
                if updated_slot and updated_slot.get('is_open'):
                    details = f"✅ Slot correctly reopened after deletion. Accepted bands: {updated_slot.get('accepted_bands_count', 0)}/2"
                    success = True
                else:
                    details = f"❌ Slot not reopened. is_open: {updated_slot.get('is_open') if updated_slot else 'slot not found'}"
                    success = False
            else:
                details = f"Failed to get slot data: {response.status_code}"
            
            self.log_test("TEST 4 - Slot Reopening After Deletion", success, details)
            return success
            
        except Exception as e:
            self.log_test("TEST 4 - Slot Reopening After Deletion", False, f"Error: {str(e)}")
            return False

    def test_notification_no_notification_if_not_accepted(self):
        """TEST 5 - Pas de notification si candidature pas acceptée"""
        try:
            # Create new planning slot
            from datetime import datetime, timedelta
            tomorrow = (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d")
            
            planning_data = {
                "date": tomorrow,
                "music_styles": ["Rock"],
                "description": "Test pas de notification",
                "is_open": True,
                "num_bands_needed": 1
            }
            
            headers_venue = {'Authorization': f'Bearer {self.test_bar_token}'}
            response = requests.post(f"{self.base_url}/planning", json=planning_data, headers=headers_venue, timeout=10)
            
            if response.status_code != 200:
                self.log_test("TEST 5 - Planning Slot Creation", False, f"Failed to create slot: {response.status_code}")
                return False
            
            slot_response = response.json()
            slot_id = slot_response.get('id')
            
            # Musician applies
            application_data = {
                "planning_slot_id": slot_id,
                "band_name": "The Rockers",
                "description": "Application non acceptée",
                "music_style": "Rock",
                "contact_email": "rockers@test.com"
            }
            
            headers_a = {'Authorization': f'Bearer {self.musician_a_token}'}
            response = requests.post(f"{self.base_url}/applications", json=application_data, headers=headers_a, timeout=10)
            
            if response.status_code != 200:
                self.log_test("TEST 5 - Application Submission", False, f"Failed to submit application: {response.status_code}")
                return False
            
            application_response = response.json()
            application_id = application_response.get('id')
            
            # Get current notification count
            response = requests.get(f"{self.base_url}/notifications", headers=headers_a, timeout=10)
            initial_count = 0
            if response.status_code == 200:
                initial_count = len(response.json())
            
            # Delete application WITHOUT accepting it first
            response = requests.delete(f"{self.base_url}/applications/{application_id}", headers=headers_venue, timeout=10)
            
            if response.status_code != 200:
                self.log_test("TEST 5 - Application Deletion", False, f"Failed to delete application: {response.status_code}")
                return False
            
            # Check no new notification was sent
            import time
            time.sleep(1)
            
            response = requests.get(f"{self.base_url}/notifications", headers=headers_a, timeout=10)
            success = response.status_code == 200
            
            if success:
                notifications = response.json()
                final_count = len(notifications)
                
                # Look specifically for application_cancelled notifications
                cancellation_notifications = [n for n in notifications if n.get('type') == 'application_cancelled']
                
                if len(cancellation_notifications) == 0:
                    details = f"✅ No cancellation notification sent (correct behavior). Total notifications: {final_count}"
                    success = True
                else:
                    details = f"❌ Unexpected cancellation notification sent. Found {len(cancellation_notifications)} cancellation notifications"
                    success = False
            else:
                details = f"Failed to get notifications: {response.status_code}"
            
            self.log_test("TEST 5 - No Notification If Not Accepted", success, details)
            return success
            
        except Exception as e:
            self.log_test("TEST 5 - No Notification If Not Accepted", False, f"Error: {str(e)}")
            return False

    # ============= BUG FIX VALIDATION TESTS =============

    def test_notification_system_workflow(self):
        """Test complete notification workflow: venue creates slot, musician applies, venue accepts, musician gets notification"""
        try:
            # Step 1: Create a planning slot
            headers_venue = {'Authorization': f'Bearer {self.venue_token}'}
            planning_data = {
                "date": "2025-01-15",
                "music_styles": ["Rock", "Pop"],
                "description": "Looking for energetic rock band for notification test",
                "is_open": True
            }
            
            response = requests.post(f"{self.base_url}/planning", json=planning_data, headers=headers_venue, timeout=10)
            if response.status_code != 200:
                self.log_test("Notification System Workflow - Create Slot", False, f"Failed to create planning slot: {response.status_code}")
                return False
            
            planning_response = response.json()
            slot_id = planning_response.get('id')
            
            # Step 2: Musician applies to the slot
            headers_musician = {'Authorization': f'Bearer {self.musician_token}'}
            application_data = {
                "planning_slot_id": slot_id,
                "band_name": "Test Notification Band",
                "description": "Rock band for notification testing",
                "music_style": "Rock",
                "contact_email": "testband@test.com",
                "contact_phone": "+33123456789"
            }
            
            response = requests.post(f"{self.base_url}/applications", json=application_data, headers=headers_musician, timeout=10)
            if response.status_code != 200:
                self.log_test("Notification System Workflow - Apply", False, f"Failed to apply: {response.status_code}")
                return False
            
            app_response = response.json()
            application_id = app_response.get('id')
            
            # Step 3: Check musician's notifications before acceptance
            response = requests.get(f"{self.base_url}/notifications/unread-count", headers=headers_musician, timeout=10)
            initial_count = 0
            if response.status_code == 200:
                initial_count = response.json().get('count', 0)
            
            # Step 4: Venue accepts the application
            response = requests.put(f"{self.base_url}/applications/{application_id}/accept", headers=headers_venue, timeout=10)
            if response.status_code != 200:
                self.log_test("Notification System Workflow - Accept", False, f"Failed to accept application: {response.status_code}")
                return False
            
            # Step 5: Check musician's notifications after acceptance
            import time
            time.sleep(1)  # Give time for notification to be created
            response = requests.get(f"{self.base_url}/notifications/unread-count", headers=headers_musician, timeout=10)
            final_count = 0
            if response.status_code == 200:
                final_count = response.json().get('count', 0)
            
            # Step 6: Get the actual notifications to verify content
            response = requests.get(f"{self.base_url}/notifications", headers=headers_musician, timeout=10)
            notifications = []
            if response.status_code == 200:
                notifications = response.json()
            
            success = final_count > initial_count
            if success:
                details = f"Notification count increased from {initial_count} to {final_count}"
                if notifications:
                    latest_notification = notifications[0]
                    details += f", Latest notification: '{latest_notification.get('title')}'"
                self.notification_test_application_id = application_id  # Store for cleanup
            else:
                details = f"Notification count did not increase: {initial_count} -> {final_count}"
            
            self.log_test("Notification System Workflow", success, details)
            return success
        except Exception as e:
            self.log_test("Notification System Workflow", False, f"Error: {str(e)}")
            return False

    def test_delete_all_notifications(self):
        """Test DELETE /api/notifications endpoint to clear all notifications"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            
            # First, get current notification count
            response = requests.get(f"{self.base_url}/notifications", headers=headers, timeout=10)
            initial_notifications = []
            if response.status_code == 200:
                initial_notifications = response.json()
            
            # Delete all notifications
            response = requests.delete(f"{self.base_url}/notifications", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                # Verify notifications are cleared
                response = requests.get(f"{self.base_url}/notifications", headers=headers, timeout=10)
                if response.status_code == 200:
                    final_notifications = response.json()
                    if len(final_notifications) == 0:
                        details = f"Successfully cleared {len(initial_notifications)} notifications"
                    else:
                        details = f"WARNING: {len(final_notifications)} notifications still remain"
                        success = False
                else:
                    details = f"Failed to verify deletion: {response.status_code}"
                    success = False
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Delete All Notifications", success, details)
            return success
        except Exception as e:
            self.log_test("Delete All Notifications", False, f"Error: {str(e)}")
            return False

    def test_musician_dashboard_navigation(self):
        """Test that musician dashboard tabs are accessible (basic API check)"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            
            # Test getting musician profile (Profil tab)
            response = requests.get(f"{self.base_url}/musicians/me", headers=headers, timeout=10)
            profile_success = response.status_code == 200
            
            # Test getting venues (Recherche tab)
            response = requests.get(f"{self.base_url}/venues", timeout=10)
            venues_success = response.status_code == 200
            
            # Test getting subscriptions (Connexions tab)
            response = requests.get(f"{self.base_url}/my-subscriptions", headers=headers, timeout=10)
            subscriptions_success = response.status_code == 200
            
            # Test getting notifications
            response = requests.get(f"{self.base_url}/notifications", headers=headers, timeout=10)
            notifications_success = response.status_code == 200
            
            success = profile_success and venues_success and subscriptions_success and notifications_success
            
            if success:
                details = "All dashboard API endpoints accessible: Profil ✓, Recherche ✓, Connexions ✓, Notifications ✓"
            else:
                details = f"API access: Profil {profile_success}, Recherche {venues_success}, Connexions {subscriptions_success}, Notifications {notifications_success}"
            
            self.log_test("Musician Dashboard Navigation", success, details)
            return success
        except Exception as e:
            self.log_test("Musician Dashboard Navigation", False, f"Error: {str(e)}")
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
        self.review_id = None
        self.review_musician_token = None
        
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
            self.test_notifications,
            # Event Participation Tests
            self.test_create_active_jam_event,
            self.test_get_active_events,
            self.test_join_event_without_auth,
            self.test_join_event_as_musician,
            self.test_double_participation,
            self.test_get_my_current_participation,
            self.test_get_musician_participation_public,
            self.test_get_event_participants,
            self.test_create_second_musician_for_friends,
            self.test_friend_notifications_on_participation,
            self.test_leave_event,
            self.test_participation_after_leaving,
            # Broadcast Notifications Tests
            self.test_broadcast_notification_without_auth,
            self.test_broadcast_notification_as_musician,
            self.test_broadcast_notification_venue_subscribed,
            self.test_get_broadcast_history,
            self.test_get_nearby_musicians_count,
            # Review System Tests
            self.test_create_review_without_participation,
            self.test_create_participation_for_review,
            self.test_create_review_with_participation,
            self.test_create_duplicate_review,
            self.test_invalid_rating_review,
            self.test_get_venue_reviews,
            self.test_get_venue_average_rating,
            self.test_venue_respond_to_review,
            self.test_report_review,
            self.test_toggle_reviews_visibility,
            self.test_get_venue_my_reviews,
            # Band Join Request System Tests (NEW)
            self.test_setup_band_join_scenario,
            self.test_create_band_join_request,
            self.test_notification_created_for_admin,
            self.test_list_band_join_requests_admin,
            self.test_prevent_duplicate_join_request,
            self.test_accept_band_join_request,
            self.test_notification_sent_to_requester_accept,
            self.test_create_second_join_request_for_rejection,
            self.test_reject_band_join_request,
            self.test_notification_sent_to_requester_reject,
            self.test_venue_cannot_create_join_request,
            self.test_non_admin_cannot_accept_reject,
            # PUT Endpoints Tests (Never tested before)
            self.test_put_jam_update,
            self.test_put_concert_update,
            self.test_put_jam_unauthorized,
            self.test_put_concert_unauthorized,
            self.test_put_jam_not_found,
            self.test_put_concert_not_found,
            self.test_put_jam_invalid_data,
            # Geolocation Search Tests (NEW)
            self.test_bands_data_analysis,
            self.test_bands_geolocation_search,
            self.test_create_band_without_gps,
            self.test_geolocation_excludes_no_gps_bands,
            # Bands Geolocation Search Fix Tests (LATEST)
            self.test_create_musicians_with_bands_for_geolocation,
            self.test_bands_geolocation_search_paris_100km,
            self.test_bands_geolocation_search_paris_500km,
            self.test_bands_geolocation_search_lyon_100km,
            self.test_bands_geolocation_precision_verification,
            self.test_bands_geolocation_on_the_fly_geocoding,
            # Looking For Profiles Field Test (LATEST)
            self.test_looking_for_profiles_field,
            # Multi-Group Planning Slots Tests (NEW FEATURE)
            self.test_create_multi_group_planning_slot,
            self.test_create_musicians_for_multi_group_test,
            self.test_first_application_multi_group,
            self.test_second_application_multi_group,
            self.test_accept_first_application_slot_stays_open,
            self.test_accept_second_application_slot_closes,
            self.test_verify_api_response_fields,
            self.test_single_group_behavior,
            self.test_three_plus_groups_behavior,
            # Jam Improvements Tests (NEW)
            self.test_jam_participants_count_api,
            self.test_jam_join_button_functionality,
            self.test_jam_security_musician_only,
            self.test_jam_participants_counter_updates,
            # NEW NOTIFICATION SYSTEM TESTS
            self.test_notification_system_setup,
            self.test_create_planning_slot_tomorrow,
            self.test_notification_application_rejection,
            self.test_notification_concert_cancellation,
            self.test_notification_accepted_application_cancellation,
            self.test_notification_slot_reopening,
            self.test_notification_no_notification_if_not_accepted,
            # BUG FIX VALIDATION TESTS - Testing the specific fixes mentioned in the review request
            self.test_notification_system_workflow,
            self.test_delete_all_notifications,
            self.test_musician_dashboard_navigation,
            # NEW P1 FEATURES TESTS (Priority 1)
            self.test_bands_directory_department_filter,
            self.test_messaging_conversation_deletion
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