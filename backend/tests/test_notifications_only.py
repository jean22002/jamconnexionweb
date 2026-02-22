#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class NotificationTester:
    def __init__(self, base_url="https://musician-rebuild.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")

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

    def run_notification_tests(self):
        """Run only the notification tests"""
        print("🔔 Testing New Notification System for Musicians")
        print("=" * 60)
        
        if not self.test_notification_system_setup():
            print("❌ Setup failed, skipping tests")
            return False
        
        if not self.test_create_planning_slot_tomorrow():
            print("❌ Planning slot creation failed, skipping tests")
            return False
        
        self.test_notification_application_rejection()
        self.test_notification_concert_cancellation()
        
        print("\n" + "=" * 60)
        print(f"🏁 Notification tests completed: {self.tests_passed}/{self.tests_run} passed")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = NotificationTester()
    success = tester.run_notification_tests()
    sys.exit(0 if success else 1)