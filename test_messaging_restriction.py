#!/usr/bin/env python3
"""
Focused test for messaging restriction functionality as requested in review.
Tests the fixes for allow_messages_from restrictions.
"""

import requests
import sys
import json
from datetime import datetime

class MessagingRestrictionTester:
    def __init__(self, base_url="https://venuemate-35.preview.emergentagent.com/api"):
        self.base_url = base_url
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

    def setup_test_accounts(self):
        """Create test musician and venue accounts"""
        try:
            # Create musician
            musician_data = {
                "email": f"musician_msg_test_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Test Musician Messaging",
                "role": "musician"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=musician_data, timeout=10)
            if response.status_code != 200:
                return False, "Failed to create musician"
                
            musician_response = response.json()
            self.musician_token = musician_response.get('token')
            self.musician_user = musician_response.get('user')
            
            # Create musician profile with band
            profile_data = {
                "pseudo": "TestMusicianMsg",
                "instruments": ["Guitar"],
                "music_styles": ["Rock"],
                "has_band": True,
                "bands": [{
                    "name": "Test Band for Messaging",
                    "description": "Test band for messaging restrictions",
                    "music_styles": ["Rock"],
                    "members_count": 3,
                    "looking_for_concerts": True
                }]
            }
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            response = requests.post(f"{self.base_url}/musicians", json=profile_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                musician_profile = response.json()
                self.musician_profile_id = musician_profile.get('id')
                return True, "Test accounts created successfully"
            else:
                return False, f"Failed to create musician profile: {response.status_code}"
                
        except Exception as e:
            return False, f"Error setting up accounts: {str(e)}"

    def test_messaging_restriction_everyone_allowed(self):
        """Test 1: Create venue with allow_messages_from='everyone' → Musician can send message"""
        try:
            # Create venue with allow_messages_from = "everyone"
            venue_data = {
                "email": f"venue_msg_everyone_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Test Venue Everyone",
                "role": "venue"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=venue_data, timeout=10)
            if response.status_code != 200:
                self.log_test("Test 1 - Everyone Allowed", False, "Failed to create venue")
                return False
                
            venue_response = response.json()
            self.venue1_token = venue_response.get('token')
            self.venue1_user = venue_response.get('user')
            
            # Create venue profile with allow_messages_from = "everyone"
            venue_profile_data = {
                "name": "Test Venue Messages Everyone",
                "description": "Test venue for messaging",
                "address": "123 Test Street",
                "city": "Paris",
                "postal_code": "75001",
                "latitude": 48.8566,
                "longitude": 2.3522,
                "allow_messages_from": "everyone"
            }
            
            headers = {'Authorization': f'Bearer {self.venue1_token}'}
            response = requests.post(f"{self.base_url}/venues", json=venue_profile_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                venue_profile = response.json()
                self.venue1_profile_id = venue_profile.get('id')
                
                # Test that musician can send message
                message_data = {
                    "recipient_id": self.venue1_user['id'],
                    "subject": "Test message to everyone venue",
                    "content": "This should work since venue allows messages from everyone"
                }
                
                musician_headers = {'Authorization': f'Bearer {self.musician_token}'}
                response = requests.post(f"{self.base_url}/messages", json=message_data, headers=musician_headers, timeout=10)
                success = response.status_code == 200
                
                if success:
                    details = f"✅ Musician can send message to venue with allow_messages_from='everyone'"
                else:
                    details = f"❌ Status: {response.status_code}, Error: {response.text[:100]}"
            else:
                success = False
                details = f"Failed to create venue profile: {response.status_code}"
            
            self.log_test("Test 1 - Everyone Allowed", success, details)
            return success
        except Exception as e:
            self.log_test("Test 1 - Everyone Allowed", False, f"Error: {str(e)}")
            return False

    def test_messaging_restriction_connected_only_blocked(self):
        """Test 2: Change to allow_messages_from='connected_only' → Same musician CANNOT send message (403)"""
        try:
            # Update venue to allow_messages_from = "connected_only"
            venue_profile_data = {
                "name": "Test Venue Messages Everyone",
                "description": "Test venue for messaging",
                "address": "123 Test Street",
                "city": "Paris",
                "postal_code": "75001",
                "latitude": 48.8566,
                "longitude": 2.3522,
                "allow_messages_from": "connected_only"
            }
            
            headers = {'Authorization': f'Bearer {self.venue1_token}'}
            response = requests.put(f"{self.base_url}/venues", json=venue_profile_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                # Test that same musician CANNOT send message
                message_data = {
                    "recipient_id": self.venue1_user['id'],
                    "subject": "Test message to connected_only venue",
                    "content": "This should be blocked since musician is not connected"
                }
                
                musician_headers = {'Authorization': f'Bearer {self.musician_token}'}
                response = requests.post(f"{self.base_url}/messages", json=message_data, headers=musician_headers, timeout=10)
                success = response.status_code == 403
                
                if success:
                    details = f"✅ Musician correctly blocked from sending message (403) when venue has allow_messages_from='connected_only'"
                else:
                    details = f"❌ Expected 403, got {response.status_code}. Error: {response.text[:100]}"
            else:
                success = False
                details = f"Failed to update venue profile: {response.status_code}"
            
            self.log_test("Test 2 - Connected Only Blocked", success, details)
            return success
        except Exception as e:
            self.log_test("Test 2 - Connected Only Blocked", False, f"Error: {str(e)}")
            return False

    def test_messaging_restriction_with_accepted_application(self):
        """Test 3: Create accepted application for musician → He can now send message"""
        try:
            # Create a planning slot
            planning_data = {
                "date": "2025-02-15",
                "time": "21:00",
                "title": "Test Concert for Messaging",
                "description": "Concert to test messaging restrictions",
                "music_styles": ["Rock"],
                "is_open": True
            }
            
            venue_headers = {'Authorization': f'Bearer {self.venue1_token}'}
            response = requests.post(f"{self.base_url}/planning", json=planning_data, headers=venue_headers, timeout=10)
            
            if response.status_code == 200:
                planning_response = response.json()
                planning_slot_id = planning_response.get('id')
                
                # Create application from musician
                application_data = {
                    "planning_slot_id": planning_slot_id,
                    "band_name": "Test Band for Messaging",
                    "description": "Test application for messaging restrictions",
                    "music_style": "Rock",
                    "contact_email": "testband@test.com",
                    "contact_phone": "+33123456789"
                }
                
                musician_headers = {'Authorization': f'Bearer {self.musician_token}'}
                response = requests.post(f"{self.base_url}/applications", json=application_data, headers=musician_headers, timeout=10)
                
                if response.status_code == 200:
                    app_response = response.json()
                    application_id = app_response.get('id')
                    
                    # Accept the application
                    response = requests.post(f"{self.base_url}/applications/{application_id}/accept", headers=venue_headers, timeout=10)
                    
                    if response.status_code == 200:
                        # Test that musician CAN send message (has accepted application)
                        message_data = {
                            "recipient_id": self.venue1_user['id'],
                            "subject": "Test message with accepted application",
                            "content": "This should work since musician has accepted application"
                        }
                        
                        response = requests.post(f"{self.base_url}/messages", json=message_data, headers=musician_headers, timeout=10)
                        success = response.status_code == 200
                        
                        if success:
                            details = f"✅ Musician can send message after having accepted application"
                        else:
                            details = f"❌ Status: {response.status_code}, Error: {response.text[:100]}"
                    else:
                        success = False
                        details = f"Failed to accept application: {response.status_code}, Error: {response.text[:100]}"
                else:
                    success = False
                    details = f"Failed to create application: {response.status_code}, Error: {response.text[:100]}"
            else:
                success = False
                details = f"Failed to create planning slot: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Test 3 - With Accepted Application", success, details)
            return success
        except Exception as e:
            self.log_test("Test 3 - With Accepted Application", False, f"Error: {str(e)}")
            return False

    def test_messaging_restriction_second_venue_isolation(self):
        """Test 4: Create second venue with connected_only → Musician cannot send message even with accepted application on first venue"""
        try:
            # Create a second venue with allow_messages_from = "connected_only"
            venue2_data = {
                "email": f"venue_msg_second_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Test Venue Second",
                "role": "venue"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=venue2_data, timeout=10)
            if response.status_code != 200:
                self.log_test("Test 4 - Second Venue Isolation", False, "Failed to create second venue")
                return False
                
            venue2_response = response.json()
            self.venue2_token = venue2_response.get('token')
            self.venue2_user = venue2_response.get('user')
            
            # Create second venue profile with allow_messages_from = "connected_only"
            venue2_profile_data = {
                "name": "Test Venue Messages Second",
                "description": "Second test venue for messaging isolation",
                "address": "456 Test Avenue",
                "city": "Lyon",
                "postal_code": "69001",
                "latitude": 45.7640,
                "longitude": 4.8357,
                "allow_messages_from": "connected_only"
            }
            
            headers2 = {'Authorization': f'Bearer {self.venue2_token}'}
            response = requests.post(f"{self.base_url}/venues", json=venue2_profile_data, headers=headers2, timeout=10)
            
            if response.status_code == 200:
                venue2_profile = response.json()
                self.venue2_profile_id = venue2_profile.get('id')
                
                # Test that musician CANNOT send message to second venue 
                # (even though he has accepted application on first venue)
                message_data = {
                    "recipient_id": self.venue2_user['id'],
                    "subject": "Test message to second venue",
                    "content": "This should be blocked - no connection to this venue"
                }
                
                musician_headers = {'Authorization': f'Bearer {self.musician_token}'}
                response = requests.post(f"{self.base_url}/messages", json=message_data, headers=musician_headers, timeout=10)
                success = response.status_code == 403
                
                if success:
                    details = f"✅ Musician correctly blocked from messaging second venue (403) - venue isolation working"
                else:
                    details = f"❌ Expected 403, got {response.status_code}. Venue isolation not working! Error: {response.text[:100]}"
            else:
                success = False
                details = f"Failed to create second venue profile: {response.status_code}"
            
            self.log_test("Test 4 - Second Venue Isolation", success, details)
            return success
        except Exception as e:
            self.log_test("Test 4 - Second Venue Isolation", False, f"Error: {str(e)}")
            return False

    def run_messaging_restriction_tests(self):
        """Run all messaging restriction tests as requested in review"""
        print("🔒 TESTING MESSAGING RESTRICTION FUNCTIONALITY")
        print("=" * 60)
        print("Testing fixes for allow_messages_from restrictions")
        print("Review request: Test exhaustively and confirm restriction works correctly")
        print("=" * 60)
        
        # Setup test accounts
        success, message = self.setup_test_accounts()
        if not success:
            print(f"❌ Setup failed: {message}")
            return False
        
        print(f"✅ Setup complete: {message}")
        print()
        
        # Run the 4 tests as specified in review request
        self.test_messaging_restriction_everyone_allowed()
        self.test_messaging_restriction_connected_only_blocked()
        self.test_messaging_restriction_with_accepted_application()
        self.test_messaging_restriction_second_venue_isolation()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"🏁 Messaging Restriction Tests completed: {self.tests_passed}/{self.tests_run} passed")
        print(f"📊 Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All messaging restriction tests passed!")
            print("✅ Restriction functionality working correctly")
        else:
            print("⚠️  Some messaging restriction tests failed")
            print("❌ Restriction functionality needs further fixes")
            
        return self.tests_passed == self.tests_run

def main():
    tester = MessagingRestrictionTester()
    success = tester.run_messaging_restriction_tests()
    
    # Save results
    with open('/app/messaging_restriction_test_results.json', 'w') as f:
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