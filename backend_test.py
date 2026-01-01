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
            headers = {'Authorization': f'Bearer {self.musician_token}'}
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
            headers = {'Authorization': f'Bearer {self.musician_token}'}
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
            
            self.log_test("Create Review With Participation", success, details)
            return success
        except Exception as e:
            self.log_test("Create Review With Participation", False, f"Error: {str(e)}")
            return False

    def test_create_duplicate_review(self):
        """Test creating duplicate review (should fail)"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_token}'}
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
                success = response.status_code == 422  # Validation error
                
                if success:
                    details = "Correctly rejected invalid rating (6/5)"
                else:
                    details = f"Unexpected status: {response.status_code}, Expected: 422"
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
            headers = {'Authorization': f'Bearer {self.friend_musician_token}'}
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
            self.test_get_venue_my_reviews
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