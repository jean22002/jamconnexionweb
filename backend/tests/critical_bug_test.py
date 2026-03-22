#!/usr/bin/env python3
"""
Critical Participant Counting Bug Test
Testing the specific bug reported by user: "Ça décompte plus rien"
"""

import requests
import json
from datetime import datetime, timedelta

class CriticalBugTester:
    def __init__(self, base_url="https://pro-features-beta.preview.emergentagent.com/api"):
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

    def test_participant_counting_bug_critical(self):
        """🎯 CRITICAL TEST: Participant counting bug as reported by user"""
        print("\n🚨 TESTING CRITICAL PARTICIPANT COUNTING BUG 🚨")
        print("=" * 60)
        
        try:
            # Test 1: Create fresh musician and venue for clean test
            test_data = {
                "email": f"bug_test_musician_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Bug Test Musician",
                "role": "musician"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=test_data, timeout=30)
            if response.status_code != 200:
                self.log_test("CRITICAL BUG TEST - Setup Musician", False, f"Failed to create test musician: {response.status_code}")
                return False
                
            bug_musician_data = response.json()
            bug_musician_token = bug_musician_data.get('token')
            bug_musician_user = bug_musician_data.get('user')
            
            # Create musician profile
            profile_data = {"pseudo": "BugTester", "instruments": ["Guitar"], "music_styles": ["Rock"]}
            headers_musician = {'Authorization': f'Bearer {bug_musician_token}'}
            profile_response = requests.post(f"{self.base_url}/musicians", json=profile_data, headers=headers_musician, timeout=30)
            
            if profile_response.status_code != 200:
                self.log_test("CRITICAL BUG TEST - Setup Profile", False, f"Failed to create musician profile: {profile_response.status_code}")
                return False
                
            bug_musician_profile = profile_response.json()
            bug_musician_profile_id = bug_musician_profile.get('id')
            
            # Create venue for testing
            venue_data = {
                "email": f"bug_test_venue_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Bug Test Venue",
                "role": "venue"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=venue_data, timeout=30)
            if response.status_code != 200:
                self.log_test("CRITICAL BUG TEST - Setup Venue", False, f"Failed to create test venue: {response.status_code}")
                return False
                
            bug_venue_data = response.json()
            bug_venue_token = bug_venue_data.get('token')
            
            # Create venue profile
            venue_profile_data = {
                "name": "Bug Test Club",
                "description": "Test venue for bug testing",
                "address": "123 Bug Street",
                "city": "Paris",
                "postal_code": "75001",
                "latitude": 48.8566,
                "longitude": 2.3522,
                "has_stage": True,
                "equipment": ["Sound System"],
                "music_styles": ["Rock", "Jazz"]
            }
            
            headers_venue = {'Authorization': f'Bearer {bug_venue_token}'}
            venue_profile_response = requests.post(f"{self.base_url}/venues", json=venue_profile_data, headers=headers_venue, timeout=30)
            
            if venue_profile_response.status_code != 200:
                self.log_test("CRITICAL BUG TEST - Setup Venue Profile", False, f"Failed to create venue profile: {venue_profile_response.status_code}")
                return False
                
            bug_venue_profile = venue_profile_response.json()
            bug_venue_id = bug_venue_profile.get('id')
            
            # Test 2: Create active jam event
            now = datetime.now()
            start_time = (now - timedelta(minutes=10)).strftime("%H:%M")
            end_time = (now + timedelta(hours=2)).strftime("%H:%M")
            today = now.strftime("%Y-%m-%d")
            
            jam_data = {
                "date": today,
                "start_time": start_time,
                "end_time": end_time,
                "music_styles": ["Rock", "Jazz"],
                "rules": "CRITICAL BUG TEST - Participant counting",
                "has_instruments": True,
                "has_pa_system": True,
                "instruments_available": ["Guitar", "Bass", "Drums"],
                "additional_info": "Testing participant counter bug"
            }
            
            jam_response = requests.post(f"{self.base_url}/jams", json=jam_data, headers=headers_venue, timeout=30)
            if jam_response.status_code != 200:
                self.log_test("CRITICAL BUG TEST - Create Jam", False, f"Failed to create jam: {jam_response.status_code}")
                return False
                
            bug_jam = jam_response.json()
            bug_jam_id = bug_jam.get('id')
            
            print(f"✅ Setup complete - Musician: {bug_musician_profile_id}, Venue: {bug_venue_id}, Jam: {bug_jam_id}")
            
            # Test 3: Initial state - verify participants_count = 0
            response = requests.get(f"{self.base_url}/venues/{bug_venue_id}/jams", timeout=30)
            if response.status_code != 200:
                self.log_test("CRITICAL BUG TEST - Initial Count Check", False, f"Failed to get venue jams: {response.status_code}")
                return False
                
            venue_jams = response.json()
            our_jam = None
            for jam in venue_jams:
                if jam.get('id') == bug_jam_id:
                    our_jam = jam
                    break
            
            if not our_jam:
                self.log_test("CRITICAL BUG TEST - Find Jam", False, "Could not find created jam in venue jams list")
                return False
                
            initial_count = our_jam.get('participants_count', -1)
            print(f"📊 Initial participants_count: {initial_count}")
            
            if initial_count != 0:
                self.log_test("CRITICAL BUG TEST - Initial Count", False, f"Expected 0 participants initially, got {initial_count}")
                return False
            
            # Test 4: Musician joins jam
            join_response = requests.post(f"{self.base_url}/events/{bug_jam_id}/join?event_type=jam", headers=headers_musician, timeout=30)
            if join_response.status_code != 200:
                self.log_test("CRITICAL BUG TEST - Join Jam", False, f"Failed to join jam: {join_response.status_code}, Error: {join_response.text[:200]}")
                return False
                
            join_data = join_response.json()
            participation_id = join_data.get('participation_id')
            print(f"✅ Musician joined jam - Participation ID: {participation_id}")
            
            # Test 5: Verify participation is active in MongoDB
            response = requests.get(f"{self.base_url}/musicians/me/current-participation", headers=headers_musician, timeout=30)
            if response.status_code != 200:
                self.log_test("CRITICAL BUG TEST - Check Active Participation", False, f"Failed to get current participation: {response.status_code}")
                return False
                
            current_participation = response.json()
            if not current_participation or current_participation.get('event_id') != bug_jam_id:
                self.log_test("CRITICAL BUG TEST - Verify Active Participation", False, f"No active participation found or wrong event. Got: {current_participation}")
                return False
                
            print(f"✅ Active participation confirmed: {current_participation.get('venue_name')}")
            
            # Test 6: Check participants_count after join (CRITICAL TEST)
            response = requests.get(f"{self.base_url}/venues/{bug_venue_id}/jams", timeout=30)
            if response.status_code != 200:
                self.log_test("CRITICAL BUG TEST - Count After Join", False, f"Failed to get venue jams after join: {response.status_code}")
                return False
                
            venue_jams_after_join = response.json()
            our_jam_after_join = None
            for jam in venue_jams_after_join:
                if jam.get('id') == bug_jam_id:
                    our_jam_after_join = jam
                    break
            
            if not our_jam_after_join:
                self.log_test("CRITICAL BUG TEST - Find Jam After Join", False, "Could not find jam after join")
                return False
                
            count_after_join = our_jam_after_join.get('participants_count', -1)
            print(f"📊 Participants_count after join: {count_after_join}")
            
            if count_after_join != 1:
                self.log_test("CRITICAL BUG TEST - Count After Join", False, f"❌ BUG CONFIRMED: Expected 1 participant after join, got {count_after_join}")
                return False
            
            print("✅ Count correctly updated to 1 after join")
            
            # Test 7: Musician leaves jam
            leave_response = requests.post(f"{self.base_url}/events/{bug_jam_id}/leave", headers=headers_musician, timeout=30)
            if leave_response.status_code != 200:
                self.log_test("CRITICAL BUG TEST - Leave Jam", False, f"Failed to leave jam: {leave_response.status_code}")
                return False
                
            print("✅ Musician left jam")
            
            # Test 8: Verify participation is inactive
            response = requests.get(f"{self.base_url}/musicians/me/current-participation", headers=headers_musician, timeout=30)
            if response.status_code != 200:
                self.log_test("CRITICAL BUG TEST - Check Inactive Participation", False, f"Failed to get current participation after leave: {response.status_code}")
                return False
                
            current_participation_after_leave = response.json()
            if current_participation_after_leave is not None:
                self.log_test("CRITICAL BUG TEST - Verify Inactive Participation", False, f"Participation still active after leave: {current_participation_after_leave}")
                return False
                
            print("✅ Participation correctly deactivated after leave")
            
            # Test 9: Check participants_count after leave (CRITICAL TEST)
            response = requests.get(f"{self.base_url}/venues/{bug_venue_id}/jams", timeout=30)
            if response.status_code != 200:
                self.log_test("CRITICAL BUG TEST - Count After Leave", False, f"Failed to get venue jams after leave: {response.status_code}")
                return False
                
            venue_jams_after_leave = response.json()
            our_jam_after_leave = None
            for jam in venue_jams_after_leave:
                if jam.get('id') == bug_jam_id:
                    our_jam_after_leave = jam
                    break
            
            if not our_jam_after_leave:
                self.log_test("CRITICAL BUG TEST - Find Jam After Leave", False, "Could not find jam after leave")
                return False
                
            count_after_leave = our_jam_after_leave.get('participants_count', -1)
            print(f"📊 Participants_count after leave: {count_after_leave}")
            
            if count_after_leave != 0:
                self.log_test("CRITICAL BUG TEST - Count After Leave", False, f"❌ BUG CONFIRMED: Expected 0 participants after leave, got {count_after_leave}")
                return False
            
            print("✅ Count correctly updated to 0 after leave")
            
            # Test 10: RE-JOIN to test reactivation logic (CRITICAL TEST)
            rejoin_response = requests.post(f"{self.base_url}/events/{bug_jam_id}/join?event_type=jam", headers=headers_musician, timeout=30)
            if rejoin_response.status_code != 200:
                self.log_test("CRITICAL BUG TEST - Rejoin Jam", False, f"Failed to rejoin jam: {rejoin_response.status_code}")
                return False
                
            rejoin_data = rejoin_response.json()
            rejoin_participation_id = rejoin_data.get('participation_id')
            print(f"✅ Musician rejoined jam - Participation ID: {rejoin_participation_id}")
            
            # Verify it's the SAME participation ID (reactivation, not new creation)
            if rejoin_participation_id != participation_id:
                print(f"⚠️  Different participation ID on rejoin - Original: {participation_id}, Rejoin: {rejoin_participation_id}")
                print("   This indicates NEW participation was created instead of reactivating existing one")
            else:
                print("✅ Same participation ID - correctly reactivated existing participation")
            
            # Test 11: Check participants_count after rejoin (CRITICAL TEST)
            response = requests.get(f"{self.base_url}/venues/{bug_venue_id}/jams", timeout=30)
            if response.status_code != 200:
                self.log_test("CRITICAL BUG TEST - Count After Rejoin", False, f"Failed to get venue jams after rejoin: {response.status_code}")
                return False
                
            venue_jams_after_rejoin = response.json()
            our_jam_after_rejoin = None
            for jam in venue_jams_after_rejoin:
                if jam.get('id') == bug_jam_id:
                    our_jam_after_rejoin = jam
                    break
            
            if not our_jam_after_rejoin:
                self.log_test("CRITICAL BUG TEST - Find Jam After Rejoin", False, "Could not find jam after rejoin")
                return False
                
            count_after_rejoin = our_jam_after_rejoin.get('participants_count', -1)
            print(f"📊 Participants_count after rejoin: {count_after_rejoin}")
            
            if count_after_rejoin != 1:
                self.log_test("CRITICAL BUG TEST - Count After Rejoin", False, f"❌ BUG CONFIRMED: Expected 1 participant after rejoin, got {count_after_rejoin}")
                return False
            
            print("✅ Count correctly updated to 1 after rejoin")
            
            # Test 12: Final leave to complete cycle
            final_leave_response = requests.post(f"{self.base_url}/events/{bug_jam_id}/leave", headers=headers_musician, timeout=30)
            if final_leave_response.status_code != 200:
                self.log_test("CRITICAL BUG TEST - Final Leave", False, f"Failed final leave: {final_leave_response.status_code}")
                return False
            
            # Final count check
            response = requests.get(f"{self.base_url}/venues/{bug_venue_id}/jams", timeout=30)
            if response.status_code == 200:
                venue_jams_final = response.json()
                our_jam_final = None
                for jam in venue_jams_final:
                    if jam.get('id') == bug_jam_id:
                        our_jam_final = jam
                        break
                
                if our_jam_final:
                    final_count = our_jam_final.get('participants_count', -1)
                    print(f"📊 Final participants_count: {final_count}")
                    
                    if final_count != 0:
                        self.log_test("CRITICAL BUG TEST - Final Count", False, f"❌ BUG CONFIRMED: Expected 0 participants at end, got {final_count}")
                        return False
            
            # SUCCESS - All tests passed
            self.log_test("🎯 CRITICAL PARTICIPANT COUNTING BUG TEST", True, "✅ ALL TESTS PASSED - Participant counting working correctly! Complete cycle: 0→1→0→1→0")
            return True
            
        except Exception as e:
            self.log_test("CRITICAL BUG TEST - Exception", False, f"Error: {str(e)}")
            return False

    def run_test(self):
        """Run the critical bug test"""
        print("🎯 CRITICAL PARTICIPANT COUNTING BUG TEST")
        print("Testing user reported issue: 'Ça décompte plus rien'")
        print("=" * 60)
        
        success = self.test_participant_counting_bug_critical()
        
        print("\n" + "=" * 60)
        print("📊 FINAL RESULTS")
        print("=" * 60)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if success:
            print("🎉 PARTICIPANT COUNTING BUG TEST PASSED - System working correctly!")
        else:
            print("🚨 PARTICIPANT COUNTING BUG CONFIRMED - Issue found!")
        
        return success

if __name__ == "__main__":
    tester = CriticalBugTester()
    success = tester.run_test()
    exit(0 if success else 1)