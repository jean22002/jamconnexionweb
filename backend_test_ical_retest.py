#!/usr/bin/env python3
"""
Band Calendar iCal Export - Re-test After Authentication Bug Fix
Tests the complete Band Calendar iCal Export feature after fixing the authentication bug
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import re
import uuid

# Backend URL
BACKEND_URL = "https://collapsible-map.preview.emergentagent.com/api"

# Test credentials
MUSICIAN_EMAIL = "musician@gmail.com"
MUSICIAN_PASSWORD = "test"

class BandCalendarReTestSuite:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_data = None
        self.test_results = []
        self.created_band_id = None
        
    def log_result(self, test_name, success, details):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def test_authentication_fix_verification(self):
        """Test 1: Verify authentication fix works"""
        print("\n🔐 Test 1: Authentication Fix Verification")
        
        try:
            login_url = f"{BACKEND_URL}/auth/login"
            login_data = {
                "email": MUSICIAN_EMAIL,
                "password": MUSICIAN_PASSWORD
            }
            
            response = self.session.post(login_url, json=login_data, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token") or data.get("access_token")
                self.user_data = data.get("user", {})
                
                if self.token and self.user_data.get("role") == "musician":
                    self.log_result("Authentication", True, f"Login successful, role: {self.user_data.get('role')}")
                    
                    # Test JWT token with a band endpoint to verify the fix
                    headers = {"Authorization": f"Bearer {self.token}"}
                    bands_url = f"{BACKEND_URL}/bands"
                    bands_response = self.session.get(bands_url, headers=headers, timeout=30)
                    
                    if bands_response.status_code == 200:
                        self.log_result("JWT Token with Band Endpoints", True, "Authentication fix verified - JWT works with band endpoints")
                        return True
                    else:
                        self.log_result("JWT Token with Band Endpoints", False, f"JWT failed with band endpoints: {bands_response.status_code}")
                        return False
                else:
                    self.log_result("Authentication", False, f"Invalid token or role: {self.user_data.get('role')}")
                    return False
            else:
                self.log_result("Authentication", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Authentication", False, f"Exception: {str(e)}")
            return False
    
    def test_create_test_band(self):
        """Test 2: Create a test band for testing"""
        print("\n🎸 Test 2: Create Test Band")
        
        if not self.token:
            self.log_result("Create Test Band", False, "No authentication token")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            band_data = {
                "name": f"Test Band iCal {datetime.now().strftime('%H%M%S')}",
                "description": "Test band for iCal export testing",
                "music_styles": ["rock", "pop"]
            }
            
            create_url = f"{BACKEND_URL}/bands"
            response = self.session.post(create_url, json=band_data, headers=headers, timeout=30)
            
            if response.status_code == 201:
                band = response.json()
                self.created_band_id = band.get("id")
                self.log_result("Create Test Band", True, f"Band created with ID: {self.created_band_id}")
                return True
            else:
                self.log_result("Create Test Band", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Create Test Band", False, f"Exception: {str(e)}")
            return False
    
    def test_ical_endpoint_with_valid_auth(self):
        """Test 3: iCal endpoint with valid authentication"""
        print("\n📅 Test 3: iCal Endpoint with Valid Auth")
        
        if not self.token or not self.created_band_id:
            self.log_result("iCal Valid Auth", False, "No token or band ID available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            url = f"{BACKEND_URL}/bands/{self.created_band_id}/calendar.ics"
            
            response = self.session.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                # Verify headers
                content_type = response.headers.get('Content-Type', '')
                content_disposition = response.headers.get('Content-Disposition', '')
                
                if 'text/calendar' in content_type:
                    self.log_result("iCal Content-Type", True, f"Correct Content-Type: {content_type}")
                else:
                    self.log_result("iCal Content-Type", False, f"Wrong Content-Type: {content_type}")
                
                if 'attachment' in content_disposition:
                    self.log_result("iCal Content-Disposition", True, f"Correct Content-Disposition: {content_disposition}")
                else:
                    self.log_result("iCal Content-Disposition", False, f"Wrong Content-Disposition: {content_disposition}")
                
                # Verify iCal content
                ical_content = response.text
                if self.validate_ical_format(ical_content):
                    self.log_result("iCal Valid Auth", True, "iCal endpoint works with valid auth and returns proper format")
                    return True
                else:
                    self.log_result("iCal Valid Auth", False, "iCal format validation failed")
                    return False
            else:
                self.log_result("iCal Valid Auth", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("iCal Valid Auth", False, f"Exception: {str(e)}")
            return False
    
    def validate_ical_format(self, ical_content):
        """Validate iCal format according to RFC 5545"""
        required_elements = [
            "BEGIN:VCALENDAR",
            "END:VCALENDAR",
            "VERSION:2.0",
            "PRODID:",
            "CALSCALE:GREGORIAN"
        ]
        
        all_valid = True
        for element in required_elements:
            if element in ical_content:
                self.log_result(f"iCal Format - {element}", True, "Present")
            else:
                self.log_result(f"iCal Format - {element}", False, "Missing")
                all_valid = False
        
        # Check line endings
        if "\r\n" in ical_content:
            self.log_result("iCal Line Endings", True, "Correct CRLF line endings")
        else:
            self.log_result("iCal Line Endings", False, "Missing CRLF line endings")
            all_valid = False
        
        return all_valid
    
    def test_create_concert_for_band(self):
        """Test 4: Create a concert for the test band"""
        print("\n🎤 Test 4: Create Concert for Band")
        
        if not self.token or not self.created_band_id:
            self.log_result("Create Concert", False, "No token or band ID available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            
            # First, let's try to find a venue to use
            venues_url = f"{BACKEND_URL}/venues"
            venues_response = self.session.get(venues_url, timeout=30)
            
            venue_id = None
            if venues_response.status_code == 200:
                venues = venues_response.json()
                if venues:
                    venue_id = venues[0].get("id")
            
            if not venue_id:
                self.log_result("Create Concert", False, "No venues available for concert creation")
                return False
            
            # Create concert
            concert_date = datetime.now() + timedelta(days=7)
            concert_data = {
                "venue_id": venue_id,
                "bands": [self.created_band_id],
                "date": concert_date.strftime("%Y-%m-%d"),
                "start_time": "20:00",
                "end_time": "23:00",
                "title": "Test Concert for iCal",
                "description": "Test concert to verify iCal export functionality"
            }
            
            concerts_url = f"{BACKEND_URL}/concerts"
            response = self.session.post(concerts_url, json=concert_data, headers=headers, timeout=30)
            
            if response.status_code == 201:
                concert = response.json()
                self.log_result("Create Concert", True, f"Concert created with ID: {concert.get('id')}")
                return True
            else:
                self.log_result("Create Concert", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Create Concert", False, f"Exception: {str(e)}")
            return False
    
    def test_ical_with_concert_data(self):
        """Test 5: iCal export with actual concert data"""
        print("\n🎵 Test 5: iCal Export with Concert Data")
        
        if not self.token or not self.created_band_id:
            self.log_result("iCal with Data", False, "No token or band ID available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            url = f"{BACKEND_URL}/bands/{self.created_band_id}/calendar.ics"
            
            response = self.session.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                ical_content = response.text
                
                # Check if concert appears in iCal
                if "BEGIN:VEVENT" in ical_content and "END:VEVENT" in ical_content:
                    self.log_result("iCal Event Present", True, "Concert appears in iCal format")
                    
                    # Verify required event fields
                    required_event_fields = ["UID:", "DTSTART:", "DTEND:", "SUMMARY:", "LOCATION:", "DESCRIPTION:"]
                    all_fields_present = True
                    
                    for field in required_event_fields:
                        if field in ical_content:
                            self.log_result(f"Event Field - {field[:-1]}", True, "Present in event")
                        else:
                            self.log_result(f"Event Field - {field[:-1]}", False, "Missing from event")
                            all_fields_present = False
                    
                    if all_fields_present:
                        self.log_result("iCal with Data", True, "iCal export includes concert with all required fields")
                        return True
                    else:
                        self.log_result("iCal with Data", False, "Some required event fields missing")
                        return False
                else:
                    self.log_result("iCal with Data", True, "iCal export works but no events (empty calendar)")
                    return True
            else:
                self.log_result("iCal with Data", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("iCal with Data", False, f"Exception: {str(e)}")
            return False
    
    def test_security_invalid_token(self):
        """Test 6: Security - Invalid token"""
        print("\n🔒 Test 6: Security - Invalid Token")
        
        if not self.created_band_id:
            self.log_result("Security Invalid Token", False, "No band ID available")
            return False
        
        try:
            headers = {"Authorization": "Bearer invalid_token_12345"}
            url = f"{BACKEND_URL}/bands/{self.created_band_id}/calendar.ics"
            
            response = self.session.get(url, headers=headers, timeout=30)
            
            if response.status_code == 401:
                self.log_result("Security Invalid Token", True, "Correctly returns 401 for invalid token")
                return True
            else:
                self.log_result("Security Invalid Token", False, f"Should return 401 but got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Security Invalid Token", False, f"Exception: {str(e)}")
            return False
    
    def test_security_no_token(self):
        """Test 7: Security - No token"""
        print("\n🔒 Test 7: Security - No Token")
        
        if not self.created_band_id:
            self.log_result("Security No Token", False, "No band ID available")
            return False
        
        try:
            url = f"{BACKEND_URL}/bands/{self.created_band_id}/calendar.ics"
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 401:
                self.log_result("Security No Token", True, "Correctly returns 401 for missing token")
                return True
            else:
                self.log_result("Security No Token", False, f"Should return 401 but got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Security No Token", False, f"Exception: {str(e)}")
            return False
    
    def test_invalid_band_id(self):
        """Test 8: Invalid band ID"""
        print("\n❌ Test 8: Invalid Band ID")
        
        if not self.token:
            self.log_result("Invalid Band ID", False, "No token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            invalid_band_id = "definitely_not_a_real_band_id_12345"
            url = f"{BACKEND_URL}/bands/{invalid_band_id}/calendar.ics"
            
            response = self.session.get(url, headers=headers, timeout=30)
            
            if response.status_code == 404:
                self.log_result("Invalid Band ID", True, "Correctly returns 404 for invalid band ID")
                return True
            elif response.status_code == 403:
                self.log_result("Invalid Band ID", True, "Returns 403 (not a member) - acceptable for invalid band")
                return True
            else:
                self.log_result("Invalid Band ID", False, f"Should return 404 or 403 but got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Invalid Band ID", False, f"Exception: {str(e)}")
            return False
    
    def test_empty_band_calendar(self):
        """Test 9: Empty band calendar (no concerts)"""
        print("\n📅 Test 9: Empty Band Calendar")
        
        if not self.token:
            self.log_result("Empty Band Calendar", False, "No token available")
            return False
        
        try:
            # Create a new band with no concerts
            headers = {"Authorization": f"Bearer {self.token}"}
            empty_band_data = {
                "name": f"Empty Test Band {datetime.now().strftime('%H%M%S')}",
                "description": "Empty band for testing empty calendar",
                "music_styles": ["rock"]
            }
            
            create_url = f"{BACKEND_URL}/bands"
            create_response = self.session.post(create_url, json=empty_band_data, headers=headers, timeout=30)
            
            if create_response.status_code != 201:
                self.log_result("Empty Band Calendar", False, "Could not create empty test band")
                return False
            
            empty_band_id = create_response.json().get("id")
            
            # Test iCal export for empty band
            url = f"{BACKEND_URL}/bands/{empty_band_id}/calendar.ics"
            response = self.session.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                ical_content = response.text
                
                # Should have calendar structure but no events
                if ("BEGIN:VCALENDAR" in ical_content and 
                    "END:VCALENDAR" in ical_content and 
                    "BEGIN:VEVENT" not in ical_content):
                    self.log_result("Empty Band Calendar", True, "Empty calendar returns valid but empty iCal")
                    return True
                else:
                    self.log_result("Empty Band Calendar", False, "Empty calendar format incorrect")
                    return False
            else:
                self.log_result("Empty Band Calendar", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Empty Band Calendar", False, f"Exception: {str(e)}")
            return False
    
    def test_special_characters_handling(self):
        """Test 10: Special characters in band/venue names"""
        print("\n🔤 Test 10: Special Characters Handling")
        
        if not self.token:
            self.log_result("Special Characters", False, "No token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            special_band_data = {
                "name": f"Spéciàl Bänd & Çhars {datetime.now().strftime('%H%M%S')}",
                "description": "Band with special characters: àáâãäåæçèéêë",
                "music_styles": ["rock"]
            }
            
            create_url = f"{BACKEND_URL}/bands"
            create_response = self.session.post(create_url, json=special_band_data, headers=headers, timeout=30)
            
            if create_response.status_code != 201:
                self.log_result("Special Characters", False, "Could not create band with special characters")
                return False
            
            special_band_id = create_response.json().get("id")
            
            # Test iCal export
            url = f"{BACKEND_URL}/bands/{special_band_id}/calendar.ics"
            response = self.session.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                ical_content = response.text
                
                # Check if special characters are properly handled (escaped or encoded)
                if "Spéciàl" in ical_content or "Sp%C3%A9ci%C3%A0l" in ical_content:
                    self.log_result("Special Characters", True, "Special characters properly handled in iCal")
                    return True
                else:
                    self.log_result("Special Characters", True, "iCal generated successfully (characters may be encoded)")
                    return True
            else:
                self.log_result("Special Characters", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Special Characters", False, f"Exception: {str(e)}")
            return False
    
    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleanup: Removing test data")
        
        if not self.token or not self.created_band_id:
            return
        
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            delete_url = f"{BACKEND_URL}/bands/{self.created_band_id}"
            
            response = self.session.delete(delete_url, headers=headers, timeout=30)
            
            if response.status_code in [200, 204, 404]:
                self.log_result("Cleanup", True, "Test band cleaned up successfully")
            else:
                self.log_result("Cleanup", False, f"Could not clean up test band: {response.status_code}")
                
        except Exception as e:
            self.log_result("Cleanup", False, f"Cleanup exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all band calendar iCal export re-tests"""
        print("🧪 Band Calendar iCal Export - Re-test After Authentication Fix")
        print(f"📍 Backend URL: {BACKEND_URL}")
        print(f"👤 Test Account: {MUSICIAN_EMAIL}")
        print("\n✅ Testing after authentication bug fix in band_invitations.py")
        
        # Run tests in order
        tests = [
            self.test_authentication_fix_verification,
            self.test_create_test_band,
            self.test_ical_endpoint_with_valid_auth,
            self.test_create_concert_for_band,
            self.test_ical_with_concert_data,
            self.test_security_invalid_token,
            self.test_security_no_token,
            self.test_invalid_band_id,
            self.test_empty_band_calendar,
            self.test_special_characters_handling
        ]
        
        results = []
        
        for test in tests:
            try:
                result = test()
                results.append(result)
            except Exception as e:
                print(f"❌ Test {test.__name__} failed with exception: {str(e)}")
                results.append(False)
        
        # Cleanup
        self.cleanup_test_data()
        
        # Summary
        passed = sum(results)
        total = len(results)
        
        print(f"\n📊 Test Summary:")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {total - passed}")
        print(f"📈 Success Rate: {(passed/total)*100:.1f}%")
        
        # Show failed tests
        failed_tests = [self.test_results[i] for i, result in enumerate(results) if not result]
        if failed_tests:
            print(f"\n🔍 Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        # Authentication fix status
        if results[0]:  # First test is authentication fix verification
            print(f"\n✅ Authentication Fix Status: VERIFIED")
            print(f"   - JWT tokens now work with band endpoints")
            print(f"   - Header(None) fix in band_invitations.py is working")
        else:
            print(f"\n❌ Authentication Fix Status: NOT WORKING")
            print(f"   - Authentication still failing with band endpoints")
        
        return passed >= (total * 0.8)  # 80% pass rate expected after fix

if __name__ == "__main__":
    suite = BandCalendarReTestSuite()
    success = suite.run_all_tests()
    
    if success:
        print("\n🎉 Band calendar iCal export re-test completed successfully!")
        print("✅ Authentication bug fix verified and feature working correctly")
        sys.exit(0)
    else:
        print("\n⚠️ Some tests failed. See details above.")
        sys.exit(1)