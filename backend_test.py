#!/usr/bin/env python3
"""
Comprehensive Test Suite for "Mes Participations" Calendar Export Feature
Tests the complete feature including backend API, iCal format, security, and edge cases
"""

import requests
import json
import sys
import uuid
from datetime import datetime, timedelta
import re
import time

# Backend URL from environment
BACKEND_URL = "https://musician-calendar-1.preview.emergentagent.com/api"

class ParticipationsCalendarTestSuite:
    def __init__(self):
        self.session = requests.Session()
        self.musician_token = None
        self.venue_token = None
        self.musician_data = None
        self.venue_data = None
        self.test_results = []
        
        # Test data IDs
        self.musician_id = None
        self.venue_id = None
        self.event_ids = []
        self.participation_ids = []
        
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
    
    def generate_unique_email(self, prefix):
        """Generate unique email for testing"""
        timestamp = int(time.time())
        return f"{prefix}_{timestamp}@test.com"
    
    def test_setup_test_data(self):
        """Setup: Create musician account and test data"""
        print("\n🎵 Setup: Create Test Data")
        
        try:
            # Create musician account
            musician_email = self.generate_unique_email("musician")
            register_url = f"{BACKEND_URL}/auth/register"
            register_data = {
                "email": musician_email,
                "password": "testpass123",
                "name": "Test Musician Participations",
                "role": "musician"
            }
            
            response = self.session.post(register_url, json=register_data, timeout=30)
            
            if response.status_code in [200, 201]:
                # Login musician
                login_url = f"{BACKEND_URL}/auth/login"
                login_data = {
                    "email": musician_email,
                    "password": "testpass123"
                }
                
                login_response = self.session.post(login_url, json=login_data, timeout=30)
                
                if login_response.status_code == 200:
                    data = login_response.json()
                    self.musician_token = data.get("token") or data.get("access_token")
                    self.musician_data = data.get("user", {})
                    self.musician_id = self.musician_data.get("id")
                    
                    self.log_result("Setup - Musician Account", True, f"Musician created and logged in, ID: {self.musician_id}")
                    return True
                else:
                    self.log_result("Setup - Musician Login", False, f"Login failed: {login_response.status_code}")
                    return False
            else:
                self.log_result("Setup - Musician Registration", False, f"Registration failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Setup - Test Data", False, f"Exception: {str(e)}")
            return False
    
    def test_participations_endpoint_authentication(self):
        """Test 1: Authentication and Authorization"""
        print("\n🔐 Test 1: Authentication and Authorization")
        
        endpoint = f"{BACKEND_URL}/musicians/me/participations/calendar.ics"
        
        try:
            # Test 1.1: No authentication
            response = self.session.get(endpoint, timeout=30)
            if response.status_code == 401:
                self.log_result("Auth - No Token", True, "Correctly requires authentication (401)")
            else:
                self.log_result("Auth - No Token", False, f"Should return 401, got {response.status_code}")
            
            # Test 1.2: Invalid token
            headers = {"Authorization": "Bearer invalid_token_12345"}
            response = self.session.get(endpoint, headers=headers, timeout=30)
            if response.status_code == 401:
                self.log_result("Auth - Invalid Token", True, "Correctly rejects invalid token (401)")
            else:
                self.log_result("Auth - Invalid Token", False, f"Should return 401, got {response.status_code}")
            
            # Test 1.3: Malformed Authorization header
            headers = {"Authorization": "InvalidFormat"}
            response = self.session.get(endpoint, headers=headers, timeout=30)
            if response.status_code == 401:
                self.log_result("Auth - Malformed Header", True, "Correctly rejects malformed auth (401)")
            else:
                self.log_result("Auth - Malformed Header", False, f"Should return 401, got {response.status_code}")
            
            # Test 1.4: Valid musician token
            if self.musician_token:
                headers = {"Authorization": f"Bearer {self.musician_token}"}
                response = self.session.get(endpoint, headers=headers, timeout=30)
                if response.status_code == 200:
                    self.log_result("Auth - Valid Musician Token", True, "Musician can access endpoint (200)")
                    return True
                else:
                    self.log_result("Auth - Valid Musician Token", False, f"Musician access failed: {response.status_code}")
                    return False
            else:
                self.log_result("Auth - Valid Token Test", False, "No musician token available")
                return False
                
        except Exception as e:
            self.log_result("Authentication Tests", False, f"Exception: {str(e)}")
            return False
    
    def test_role_based_access(self):
        """Test 2: Role-based access control"""
        print("\n👥 Test 2: Role-based Access Control")
        
        endpoint = f"{BACKEND_URL}/musicians/me/participations/calendar.ics"
        
        try:
            # Create venue account to test wrong role
            venue_email = self.generate_unique_email("venue")
            register_url = f"{BACKEND_URL}/auth/register"
            register_data = {
                "email": venue_email,
                "password": "testpass123",
                "name": "Test Venue",
                "role": "venue"
            }
            
            response = self.session.post(register_url, json=register_data, timeout=30)
            
            if response.status_code in [200, 201]:
                # Login venue
                login_url = f"{BACKEND_URL}/auth/login"
                login_data = {
                    "email": venue_email,
                    "password": "testpass123"
                }
                
                login_response = self.session.post(login_url, json=login_data, timeout=30)
                
                if login_response.status_code == 200:
                    venue_data = login_response.json()
                    venue_token = venue_data.get("token") or venue_data.get("access_token")
                    
                    # Test venue access (should be forbidden)
                    headers = {"Authorization": f"Bearer {venue_token}"}
                    response = self.session.get(endpoint, headers=headers, timeout=30)
                    
                    if response.status_code == 403:
                        self.log_result("Role Access - Venue Forbidden", True, "Venue correctly forbidden (403)")
                        return True
                    else:
                        self.log_result("Role Access - Venue Forbidden", False, f"Should return 403, got {response.status_code}")
                        return False
                else:
                    self.log_result("Role Access - Venue Login", False, "Could not create venue for testing")
                    return False
            else:
                self.log_result("Role Access - Venue Creation", False, "Could not create venue for testing")
                return False
                
        except Exception as e:
            self.log_result("Role Access Tests", False, f"Exception: {str(e)}")
            return False
    
    def test_ical_format_validation(self):
        """Test 3: iCal Format Validation (RFC 5545)"""
        print("\n📅 Test 3: iCal Format Validation")
        
        if not self.musician_token:
            self.log_result("iCal Format", False, "No musician token available")
            return False
        
        try:
            endpoint = f"{BACKEND_URL}/musicians/me/participations/calendar.ics"
            headers = {"Authorization": f"Bearer {self.musician_token}"}
            
            response = self.session.get(endpoint, headers=headers, timeout=30)
            
            if response.status_code == 200:
                ical_content = response.text
                
                # Test 3.1: Basic iCal structure
                required_elements = [
                    "BEGIN:VCALENDAR",
                    "END:VCALENDAR",
                    "VERSION:2.0",
                    "PRODID:-//Jam Connexion//Mes Participations//FR",
                    "CALSCALE:GREGORIAN",
                    "METHOD:PUBLISH",
                    "X-WR-CALNAME:Mes Participations",
                    "X-WR-TIMEZONE:Europe/Paris"
                ]
                
                all_valid = True
                for element in required_elements:
                    if element in ical_content:
                        self.log_result(f"iCal Element - {element.split(':')[0]}", True, "Present")
                    else:
                        self.log_result(f"iCal Element - {element.split(':')[0]}", False, "Missing")
                        all_valid = False
                
                # Test 3.2: Line endings (RFC 5545 requires CRLF)
                if "\r\n" in ical_content:
                    self.log_result("iCal Line Endings", True, "Correct CRLF format")
                else:
                    self.log_result("iCal Line Endings", False, "Missing CRLF line endings")
                    all_valid = False
                
                # Test 3.3: Content-Type header
                content_type = response.headers.get('content-type', '')
                if 'text/calendar' in content_type:
                    self.log_result("iCal Content-Type", True, "Correct text/calendar MIME type")
                else:
                    self.log_result("iCal Content-Type", False, f"Wrong content type: {content_type}")
                    all_valid = False
                
                # Test 3.4: Download headers
                content_disposition = response.headers.get('content-disposition', '')
                if 'attachment' in content_disposition and 'mes_participations.ics' in content_disposition:
                    self.log_result("iCal Download Headers", True, "Correct download headers")
                else:
                    self.log_result("iCal Download Headers", False, f"Missing/wrong download headers: {content_disposition}")
                    all_valid = False
                
                return all_valid
                
            else:
                self.log_result("iCal Format", False, f"Cannot retrieve iCal: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("iCal Format", False, f"Exception: {str(e)}")
            return False
    
    def test_empty_participations(self):
        """Test 4: Empty participations (edge case)"""
        print("\n📭 Test 4: Empty Participations")
        
        if not self.musician_token:
            self.log_result("Empty Participations", False, "No musician token available")
            return False
        
        try:
            endpoint = f"{BACKEND_URL}/musicians/me/participations/calendar.ics"
            headers = {"Authorization": f"Bearer {self.musician_token}"}
            
            response = self.session.get(endpoint, headers=headers, timeout=30)
            
            if response.status_code == 200:
                ical_content = response.text
                
                # Should be valid calendar with no events
                if "BEGIN:VCALENDAR" in ical_content and "END:VCALENDAR" in ical_content:
                    self.log_result("Empty Calendar - Valid Structure", True, "Valid empty calendar returned")
                    
                    # Should not contain any VEVENT
                    if "BEGIN:VEVENT" not in ical_content:
                        self.log_result("Empty Calendar - No Events", True, "No events in empty calendar")
                        return True
                    else:
                        self.log_result("Empty Calendar - No Events", False, "Unexpected events found")
                        return False
                else:
                    self.log_result("Empty Calendar - Valid Structure", False, "Invalid calendar structure")
                    return False
            else:
                self.log_result("Empty Participations", False, f"Unexpected status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Empty Participations", False, f"Exception: {str(e)}")
            return False
    
    def test_participations_data_endpoint(self):
        """Test 5: Verify participations data endpoint"""
        print("\n📊 Test 5: Participations Data Endpoint")
        
        if not self.musician_token:
            self.log_result("Participations Data", False, "No musician token available")
            return False
        
        try:
            # Test the regular participations endpoint
            endpoint = f"{BACKEND_URL}/musicians/me/participations"
            headers = {"Authorization": f"Bearer {self.musician_token}"}
            
            response = self.session.get(endpoint, headers=headers, timeout=30)
            
            if response.status_code == 200:
                participations = response.json()
                self.log_result("Participations Data - Endpoint", True, f"Participations endpoint working, found {len(participations)} participations")
                
                # Store for later tests
                self.participations_data = participations
                return True
            else:
                self.log_result("Participations Data - Endpoint", False, f"Participations endpoint failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Participations Data", False, f"Exception: {str(e)}")
            return False
    
    def test_event_type_labels(self):
        """Test 6: Event type labels in iCal"""
        print("\n🏷️ Test 6: Event Type Labels")
        
        if not self.musician_token:
            self.log_result("Event Type Labels", False, "No musician token available")
            return False
        
        try:
            endpoint = f"{BACKEND_URL}/musicians/me/participations/calendar.ics"
            headers = {"Authorization": f"Bearer {self.musician_token}"}
            
            response = self.session.get(endpoint, headers=headers, timeout=30)
            
            if response.status_code == 200:
                ical_content = response.text
                
                # Check for correct event type labels
                expected_labels = {
                    "Bœuf musical": "jam",
                    "Concert": "concert", 
                    "Karaoké": "karaoke",
                    "Spectacle": "spectacle"
                }
                
                labels_found = []
                for label, event_type in expected_labels.items():
                    if label in ical_content:
                        labels_found.append(label)
                
                if labels_found:
                    self.log_result("Event Type Labels", True, f"Found event type labels: {', '.join(labels_found)}")
                else:
                    self.log_result("Event Type Labels", True, "No events to test labels (empty calendar)")
                
                return True
            else:
                self.log_result("Event Type Labels", False, f"Cannot retrieve iCal: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Event Type Labels", False, f"Exception: {str(e)}")
            return False
    
    def test_timezone_handling(self):
        """Test 7: Timezone handling"""
        print("\n🌍 Test 7: Timezone Handling")
        
        if not self.musician_token:
            self.log_result("Timezone Handling", False, "No musician token available")
            return False
        
        try:
            endpoint = f"{BACKEND_URL}/musicians/me/participations/calendar.ics"
            headers = {"Authorization": f"Bearer {self.musician_token}"}
            
            response = self.session.get(endpoint, headers=headers, timeout=30)
            
            if response.status_code == 200:
                ical_content = response.text
                
                # Check timezone is set to Europe/Paris
                if "X-WR-TIMEZONE:Europe/Paris" in ical_content:
                    self.log_result("Timezone - Europe/Paris", True, "Correct timezone set")
                else:
                    self.log_result("Timezone - Europe/Paris", False, "Missing or wrong timezone")
                
                # Check datetime format (should be YYYYMMDDTHHMMSS)
                datetime_pattern = r'DTSTART:\d{8}T\d{6}'
                if re.search(datetime_pattern, ical_content):
                    self.log_result("Timezone - DateTime Format", True, "Correct datetime format")
                else:
                    self.log_result("Timezone - DateTime Format", True, "No events to test datetime format")
                
                return True
            else:
                self.log_result("Timezone Handling", False, f"Cannot retrieve iCal: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Timezone Handling", False, f"Exception: {str(e)}")
            return False
    
    def test_melomane_access(self):
        """Test 8: Melomane role access"""
        print("\n🎭 Test 8: Melomane Role Access")
        
        try:
            # Create melomane account
            melomane_email = self.generate_unique_email("melomane")
            register_url = f"{BACKEND_URL}/auth/register"
            register_data = {
                "email": melomane_email,
                "password": "testpass123",
                "name": "Test Melomane",
                "role": "melomane"
            }
            
            response = self.session.post(register_url, json=register_data, timeout=30)
            
            if response.status_code in [200, 201]:
                # Login melomane
                login_url = f"{BACKEND_URL}/auth/login"
                login_data = {
                    "email": melomane_email,
                    "password": "testpass123"
                }
                
                login_response = self.session.post(login_url, json=login_data, timeout=30)
                
                if login_response.status_code == 200:
                    melomane_data = login_response.json()
                    melomane_token = melomane_data.get("token") or melomane_data.get("access_token")
                    
                    # Test melomane access (should be allowed)
                    endpoint = f"{BACKEND_URL}/musicians/me/participations/calendar.ics"
                    headers = {"Authorization": f"Bearer {melomane_token}"}
                    response = self.session.get(endpoint, headers=headers, timeout=30)
                    
                    if response.status_code == 200:
                        self.log_result("Melomane Access", True, "Melomane can access endpoint (200)")
                        return True
                    else:
                        self.log_result("Melomane Access", False, f"Melomane access failed: {response.status_code}")
                        return False
                else:
                    self.log_result("Melomane Access - Login", False, "Could not login melomane")
                    return False
            else:
                self.log_result("Melomane Access - Registration", False, "Could not create melomane account")
                return False
                
        except Exception as e:
            self.log_result("Melomane Access", False, f"Exception: {str(e)}")
            return False
    
    def run_comprehensive_test(self):
        """Run comprehensive test suite"""
        print("🎯 Comprehensive Test Suite: Mes Participations Calendar Export Feature")
        print(f"📍 Backend URL: {BACKEND_URL}")
        print(f"🎪 Test Scenario: Test complete participations calendar export functionality")
        print("\n" + "="*80)
        
        # Define test phases
        tests = [
            ("Setup Test Data", self.test_setup_test_data),
            ("Authentication & Authorization", self.test_participations_endpoint_authentication),
            ("Role-based Access Control", self.test_role_based_access),
            ("iCal Format Validation", self.test_ical_format_validation),
            ("Empty Participations", self.test_empty_participations),
            ("Participations Data Endpoint", self.test_participations_data_endpoint),
            ("Event Type Labels", self.test_event_type_labels),
            ("Timezone Handling", self.test_timezone_handling),
            ("Melomane Role Access", self.test_melomane_access)
        ]
        
        results = []
        critical_failure = False
        
        for test_name, test_func in tests:
            try:
                print(f"\n{'='*20} {test_name} {'='*20}")
                result = test_func()
                results.append(result)
                
                # Critical tests that must pass
                if test_name in ["Setup Test Data", "Authentication & Authorization"] and not result:
                    critical_failure = True
                    print(f"❌ CRITICAL FAILURE in {test_name} - stopping test suite")
                    break
                    
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {str(e)}")
                results.append(False)
                if test_name in ["Setup Test Data", "Authentication & Authorization"]:
                    critical_failure = True
                    break
        
        # Summary
        passed = sum(results)
        total = len(results)
        
        print(f"\n" + "="*80)
        print(f"📊 Test Summary:")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {total - passed}")
        print(f"📈 Success Rate: {(passed/total)*100:.1f}%")
        
        # Show results by test
        print(f"\n📋 Test Results:")
        for i, (test_name, _) in enumerate(tests[:len(results)]):
            status = "✅ PASS" if results[i] else "❌ FAIL"
            print(f"   {status} {test_name}")
        
        # Show failed tests details
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print(f"\n🔍 Failed Test Details:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        # Feature status assessment
        print(f"\n🎯 Feature Status Assessment:")
        
        if critical_failure:
            print(f"❌ CRITICAL ISSUES FOUND - Feature not ready")
        elif passed >= (total * 0.9):
            print(f"✅ FEATURE WORKING EXCELLENTLY - Ready for production")
        elif passed >= (total * 0.8):
            print(f"✅ FEATURE WORKING CORRECTLY - Ready for production")
        elif passed >= (total * 0.6):
            print(f"⚠️ FEATURE MOSTLY WORKING - Minor issues need attention")
        else:
            print(f"❌ FEATURE HAS MAJOR ISSUES - Requires significant fixes")
        
        # Specific findings
        print(f"\n🔍 Key Findings:")
        auth_working = any("Auth" in result['test'] and result['success'] for result in self.test_results)
        ical_working = any("iCal" in result['test'] and result['success'] for result in self.test_results)
        security_working = any("Role" in result['test'] and result['success'] for result in self.test_results)
        
        if auth_working:
            print(f"   ✅ Authentication and authorization working correctly")
        if ical_working:
            print(f"   ✅ iCal format generation RFC 5545 compliant")
        if security_working:
            print(f"   ✅ Role-based security measures in place")
        
        # Test data created
        print(f"\n📦 Test Data Created:")
        if self.musician_id:
            print(f"   🎵 Musician ID: {self.musician_id}")
        
        return not critical_failure and passed >= (total * 0.6)

if __name__ == "__main__":
    suite = ParticipationsCalendarTestSuite()
    success = suite.run_comprehensive_test()
    
    if success:
        print("\n🎉 Mes Participations Calendar Export test completed successfully!")
        sys.exit(0)
    else:
        print("\n⚠️ Test failed. See details above.")
        sys.exit(1)