#!/usr/bin/env python3
"""
Multiple Musicians Participation Test
Testing multiple musicians joining/leaving the same jam
"""

import requests
import json
from datetime import datetime, timedelta

class MultiMusicianTester:
    def __init__(self, base_url="https://venue-profile-fixes.preview.emergentagent.com/api"):
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

    def test_multiple_musicians_participation(self):
        """Test multiple musicians participating in same jam"""
        try:
            print("\n🎯 TESTING MULTIPLE MUSICIANS PARTICIPATION")
            print("=" * 60)
            
            # Create venue
            venue_data = {
                "email": f"multi_venue_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Multi Test Venue",
                "role": "venue"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=venue_data, timeout=30)
            if response.status_code != 200:
                self.log_test("Multi Test - Setup Venue", False, f"Failed to create venue: {response.status_code}")
                return False
                
            venue_data_response = response.json()
            venue_token = venue_data_response.get('token')
            
            # Create venue profile
            venue_profile_data = {
                "name": "Multi Test Club",
                "description": "Test venue for multi-musician testing",
                "address": "456 Multi Street",
                "city": "Lyon",
                "postal_code": "69001",
                "latitude": 45.7640,
                "longitude": 4.8357,
                "has_stage": True,
                "equipment": ["Sound System", "Drums"],
                "music_styles": ["Rock", "Jazz", "Blues"]
            }
            
            headers_venue = {'Authorization': f'Bearer {venue_token}'}
            venue_profile_response = requests.post(f"{self.base_url}/venues", json=venue_profile_data, headers=headers_venue, timeout=30)
            
            if venue_profile_response.status_code != 200:
                self.log_test("Multi Test - Setup Venue Profile", False, f"Failed to create venue profile: {venue_profile_response.status_code}")
                return False
                
            venue_profile = venue_profile_response.json()
            venue_id = venue_profile.get('id')
            
            # Create first musician
            musician1_data = {
                "email": f"multi_musician1_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Multi Musician 1",
                "role": "musician"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=musician1_data, timeout=30)
            if response.status_code != 200:
                self.log_test("Multi Test - Setup Musician 1", False, f"Failed to create musician 1: {response.status_code}")
                return False
                
            musician1_response = response.json()
            musician1_token = musician1_response.get('token')
            
            # Create musician 1 profile
            profile1_data = {"pseudo": "Guitarist1", "instruments": ["Guitar"], "music_styles": ["Rock"]}
            headers1 = {'Authorization': f'Bearer {musician1_token}'}
            profile1_response = requests.post(f"{self.base_url}/musicians", json=profile1_data, headers=headers1, timeout=30)
            
            if profile1_response.status_code != 200:
                self.log_test("Multi Test - Setup Musician 1 Profile", False, f"Failed to create musician 1 profile: {profile1_response.status_code}")
                return False
            
            # Create second musician
            musician2_data = {
                "email": f"multi_musician2_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Multi Musician 2",
                "role": "musician"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=musician2_data, timeout=30)
            if response.status_code != 200:
                self.log_test("Multi Test - Setup Musician 2", False, f"Failed to create musician 2: {response.status_code}")
                return False
                
            musician2_response = response.json()
            musician2_token = musician2_response.get('token')
            
            # Create musician 2 profile
            profile2_data = {"pseudo": "Bassist1", "instruments": ["Bass"], "music_styles": ["Rock"]}
            headers2 = {'Authorization': f'Bearer {musician2_token}'}
            profile2_response = requests.post(f"{self.base_url}/musicians", json=profile2_data, headers=headers2, timeout=30)
            
            if profile2_response.status_code != 200:
                self.log_test("Multi Test - Setup Musician 2 Profile", False, f"Failed to create musician 2 profile: {profile2_response.status_code}")
                return False
            
            # Create active jam
            now = datetime.now()
            start_time = (now - timedelta(minutes=5)).strftime("%H:%M")
            end_time = (now + timedelta(hours=2)).strftime("%H:%M")
            today = now.strftime("%Y-%m-%d")
            
            jam_data = {
                "date": today,
                "start_time": start_time,
                "end_time": end_time,
                "music_styles": ["Rock", "Blues"],
                "rules": "Multi-musician test jam",
                "has_instruments": True,
                "has_pa_system": True,
                "instruments_available": ["Guitar", "Bass", "Drums"],
                "additional_info": "Testing multiple musicians participation"
            }
            
            jam_response = requests.post(f"{self.base_url}/jams", json=jam_data, headers=headers_venue, timeout=30)
            if jam_response.status_code != 200:
                self.log_test("Multi Test - Create Jam", False, f"Failed to create jam: {jam_response.status_code}")
                return False
                
            jam = jam_response.json()
            jam_id = jam.get('id')
            
            print(f"✅ Setup complete - Venue: {venue_id}, Jam: {jam_id}")
            
            # Test initial count (should be 0)
            response = requests.get(f"{self.base_url}/venues/{venue_id}/jams", timeout=30)
            if response.status_code != 200:
                self.log_test("Multi Test - Initial Count", False, f"Failed to get venue jams: {response.status_code}")
                return False
                
            venue_jams = response.json()
            our_jam = None
            for jam_item in venue_jams:
                if jam_item.get('id') == jam_id:
                    our_jam = jam_item
                    break
            
            if not our_jam:
                self.log_test("Multi Test - Find Jam", False, "Could not find created jam")
                return False
                
            initial_count = our_jam.get('participants_count', -1)
            print(f"📊 Initial participants_count: {initial_count}")
            
            if initial_count != 0:
                self.log_test("Multi Test - Initial Count Check", False, f"Expected 0 participants initially, got {initial_count}")
                return False
            
            # Musician 1 joins
            join1_response = requests.post(f"{self.base_url}/events/{jam_id}/join?event_type=jam", headers=headers1, timeout=30)
            if join1_response.status_code != 200:
                self.log_test("Multi Test - Musician 1 Join", False, f"Musician 1 failed to join: {join1_response.status_code}")
                return False
            
            print("✅ Musician 1 joined jam")
            
            # Check count should be 1
            response = requests.get(f"{self.base_url}/venues/{venue_id}/jams", timeout=30)
            if response.status_code == 200:
                venue_jams = response.json()
                our_jam = None
                for jam_item in venue_jams:
                    if jam_item.get('id') == jam_id:
                        our_jam = jam_item
                        break
                
                if our_jam:
                    count_after_1 = our_jam.get('participants_count', -1)
                    print(f"📊 Participants_count after musician 1 joins: {count_after_1}")
                    
                    if count_after_1 != 1:
                        self.log_test("Multi Test - Count After 1 Join", False, f"Expected 1 participant, got {count_after_1}")
                        return False
                else:
                    self.log_test("Multi Test - Find Jam After 1 Join", False, "Could not find jam after musician 1 joined")
                    return False
            else:
                self.log_test("Multi Test - Get Jams After 1 Join", False, f"Failed to get jams: {response.status_code}")
                return False
            
            # Musician 2 joins
            join2_response = requests.post(f"{self.base_url}/events/{jam_id}/join?event_type=jam", headers=headers2, timeout=30)
            if join2_response.status_code != 200:
                self.log_test("Multi Test - Musician 2 Join", False, f"Musician 2 failed to join: {join2_response.status_code}")
                return False
            
            print("✅ Musician 2 joined jam")
            
            # Check count should be 2
            response = requests.get(f"{self.base_url}/venues/{venue_id}/jams", timeout=30)
            if response.status_code == 200:
                venue_jams = response.json()
                our_jam = None
                for jam_item in venue_jams:
                    if jam_item.get('id') == jam_id:
                        our_jam = jam_item
                        break
                
                if our_jam:
                    count_after_2 = our_jam.get('participants_count', -1)
                    print(f"📊 Participants_count after both musicians join: {count_after_2}")
                    
                    if count_after_2 != 2:
                        self.log_test("Multi Test - Count After 2 Join", False, f"Expected 2 participants, got {count_after_2}")
                        return False
                else:
                    self.log_test("Multi Test - Find Jam After 2 Join", False, "Could not find jam after musician 2 joined")
                    return False
            else:
                self.log_test("Multi Test - Get Jams After 2 Join", False, f"Failed to get jams: {response.status_code}")
                return False
            
            # Musician 1 leaves
            leave1_response = requests.post(f"{self.base_url}/events/{jam_id}/leave", headers=headers1, timeout=30)
            if leave1_response.status_code != 200:
                self.log_test("Multi Test - Musician 1 Leave", False, f"Musician 1 failed to leave: {leave1_response.status_code}")
                return False
            
            print("✅ Musician 1 left jam")
            
            # Check count should be 1
            response = requests.get(f"{self.base_url}/venues/{venue_id}/jams", timeout=30)
            if response.status_code == 200:
                venue_jams = response.json()
                our_jam = None
                for jam_item in venue_jams:
                    if jam_item.get('id') == jam_id:
                        our_jam = jam_item
                        break
                
                if our_jam:
                    count_after_1_leave = our_jam.get('participants_count', -1)
                    print(f"📊 Participants_count after musician 1 leaves: {count_after_1_leave}")
                    
                    if count_after_1_leave != 1:
                        self.log_test("Multi Test - Count After 1 Leave", False, f"Expected 1 participant, got {count_after_1_leave}")
                        return False
                else:
                    self.log_test("Multi Test - Find Jam After 1 Leave", False, "Could not find jam after musician 1 left")
                    return False
            else:
                self.log_test("Multi Test - Get Jams After 1 Leave", False, f"Failed to get jams: {response.status_code}")
                return False
            
            # Musician 2 leaves
            leave2_response = requests.post(f"{self.base_url}/events/{jam_id}/leave", headers=headers2, timeout=30)
            if leave2_response.status_code != 200:
                self.log_test("Multi Test - Musician 2 Leave", False, f"Musician 2 failed to leave: {leave2_response.status_code}")
                return False
            
            print("✅ Musician 2 left jam")
            
            # Check count should be 0
            response = requests.get(f"{self.base_url}/venues/{venue_id}/jams", timeout=30)
            if response.status_code == 200:
                venue_jams = response.json()
                our_jam = None
                for jam_item in venue_jams:
                    if jam_item.get('id') == jam_id:
                        our_jam = jam_item
                        break
                
                if our_jam:
                    final_count = our_jam.get('participants_count', -1)
                    print(f"📊 Final participants_count: {final_count}")
                    
                    if final_count != 0:
                        self.log_test("Multi Test - Final Count", False, f"Expected 0 participants, got {final_count}")
                        return False
                else:
                    self.log_test("Multi Test - Find Jam Final", False, "Could not find jam for final count")
                    return False
            else:
                self.log_test("Multi Test - Get Jams Final", False, f"Failed to get jams: {response.status_code}")
                return False
            
            # SUCCESS
            self.log_test("🎯 MULTIPLE MUSICIANS PARTICIPATION TEST", True, "✅ ALL TESTS PASSED - Multi-musician counting working correctly! Cycle: 0→1→2→1→0")
            return True
            
        except Exception as e:
            self.log_test("Multi Test - Exception", False, f"Error: {str(e)}")
            return False

    def run_test(self):
        """Run the multi-musician test"""
        print("🎯 MULTIPLE MUSICIANS PARTICIPATION TEST")
        print("Testing multiple musicians joining/leaving same jam")
        print("=" * 60)
        
        success = self.test_multiple_musicians_participation()
        
        print("\n" + "=" * 60)
        print("📊 FINAL RESULTS")
        print("=" * 60)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if success:
            print("🎉 MULTIPLE MUSICIANS TEST PASSED - System working correctly!")
        else:
            print("🚨 MULTIPLE MUSICIANS TEST FAILED - Issue found!")
        
        return success

if __name__ == "__main__":
    tester = MultiMusicianTester()
    success = tester.run_test()
    exit(0 if success else 1)