#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta

class DoubleParticipationJamTester:
    def __init__(self, base_url="https://community-safety-6.preview.emergentagent.com/api"):
        self.base_url = base_url

    def test_double_participation_jam_bug_reproduction(self):
        """Test the specific double participation bug for JAM events"""
        try:
            print("\n🔍 TESTING DOUBLE PARTICIPATION BUG FOR JAMS (BŒUFS)")
            print("=" * 60)
            
            # Step 1: Create a musician and venue with a jam
            print("Step 1: Creating test accounts and profiles...")
            
            # Create musician for bug test
            musician_data = {
                "email": f"jam_musician_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Jam Test Musician",
                "role": "musician"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=musician_data, timeout=10)
            if response.status_code != 200:
                print(f"❌ Failed to create musician: {response.status_code}")
                return False
                
            jam_musician = response.json()
            jam_musician_token = jam_musician.get('token')
            
            # Create musician profile
            profile_data = {
                "pseudo": "JamTester",
                "instruments": ["Bass"],
                "music_styles": ["Jazz"]
            }
            headers_musician = {'Authorization': f'Bearer {jam_musician_token}'}
            profile_response = requests.post(f"{self.base_url}/musicians", json=profile_data, headers=headers_musician, timeout=10)
            
            if profile_response.status_code != 200:
                print(f"❌ Failed to create profile: {profile_response.status_code}")
                return False
                
            jam_musician_profile = profile_response.json()
            jam_musician_profile_id = jam_musician_profile.get('id')
            
            # Create venue for bug test
            venue_data = {
                "email": f"jam_venue_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Jam Test Venue",
                "role": "venue"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=venue_data, timeout=10)
            if response.status_code != 200:
                print(f"❌ Failed to create venue: {response.status_code}")
                return False
                
            jam_venue = response.json()
            jam_venue_token = jam_venue.get('token')
            
            # Create venue profile
            venue_profile_data = {
                "name": "Jam Test Club",
                "description": "Test venue for jam bug reproduction",
                "address": "456 Jam Street",
                "city": "Lyon",
                "postal_code": "69001",
                "latitude": 45.7640,
                "longitude": 4.8357,
                "has_stage": True,
                "equipment": ["Piano", "Drums"],
                "music_styles": ["Jazz", "Blues"]
            }
            
            headers_venue = {'Authorization': f'Bearer {jam_venue_token}'}
            venue_profile_response = requests.post(f"{self.base_url}/venues", json=venue_profile_data, headers=headers_venue, timeout=10)
            
            if venue_profile_response.status_code != 200:
                print(f"❌ Failed to create venue profile: {venue_profile_response.status_code}")
                return False
                
            jam_venue_profile = venue_profile_response.json()
            jam_venue_profile_id = jam_venue_profile.get('id')
            
            print(f"✅ Created musician: {jam_musician_profile_id}")
            print(f"✅ Created venue: {jam_venue_profile_id}")
            
            # Step 2: Create a jam (bœuf)
            print("\nStep 2: Creating jam event...")
            
            tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            
            jam_data = {
                "date": tomorrow,
                "start_time": "19:00",
                "end_time": "22:00",
                "music_styles": ["Jazz", "Blues"],
                "rules": "Apportez vos instruments, ambiance décontractée",
                "has_instruments": True,
                "has_pa_system": True,
                "instruments_available": ["Piano", "Batterie"],
                "additional_info": "Bœuf test pour double participation"
            }
            
            response = requests.post(f"{self.base_url}/jams", json=jam_data, headers=headers_venue, timeout=10)
            if response.status_code != 200:
                print(f"❌ Failed to create jam: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
            jam_event = response.json()
            jam_event_id = jam_event.get('id')
            print(f"✅ Created jam: {jam_event_id} on {tomorrow}")
            
            # Step 3: Make musician participate in jam
            print("\nStep 3: Musician participating in jam...")
            
            response = requests.post(f"{self.base_url}/events/{jam_event_id}/join?event_type=jam", headers=headers_musician, timeout=10)
            if response.status_code != 200:
                print(f"❌ Failed to join jam: {response.status_code}")
                print(f"Error: {response.text[:200]}")
                return False
                
            first_participation = response.json()
            first_participation_id = first_participation.get('participation_id')
            print(f"✅ First participation created: {first_participation_id}")
            
            # Step 4: Verify participation is created with active: True
            print("\nStep 4: Verifying participation in database...")
            
            # Check via API that musician has participations
            response = requests.get(f"{self.base_url}/musicians/me/participations", headers=headers_musician, timeout=10)
            if response.status_code != 200:
                print(f"❌ Failed to get participations: {response.status_code}")
                return False
                
            participations = response.json()
            if not participations or len(participations) == 0:
                print("❌ No participations found after joining")
                return False
                
            # Find our jam participation
            our_participation = None
            for participation in participations:
                if participation.get('event_id') == jam_event_id:
                    our_participation = participation
                    break
            
            if not our_participation:
                print("❌ Our jam participation not found in list")
                return False
                
            print(f"✅ Participation verified: {our_participation.get('event_type')} at {our_participation.get('venue_name')}, active={our_participation.get('active')}")
            
            # Step 5: Attempt to participate a 2nd time (should fail)
            print("\nStep 5: Attempting second participation (should be blocked)...")
            
            response = requests.post(f"{self.base_url}/events/{jam_event_id}/join?event_type=jam", headers=headers_musician, timeout=10)
            if response.status_code == 400:
                error_message = response.text
                if "Already participating" in error_message or "already participating" in error_message.lower():
                    print("✅ Second participation correctly blocked with 400 error")
                    print(f"   Error message: {error_message}")
                else:
                    print(f"❌ Got 400 but wrong message: {error_message}")
                    return False
            else:
                print(f"❌ CRITICAL: Second participation was NOT blocked! Status: {response.status_code}")
                print(f"Response: {response.text[:200]}")
                return False
            
            # Step 6: Verify in database - should be only ONE active participation
            print("\nStep 6: Verifying database integrity...")
            
            # Check event participants count
            response = requests.get(f"{self.base_url}/events/{jam_event_id}/participants", timeout=10)
            if response.status_code == 200:
                participants = response.json()
                participant_count = len(participants)
                if participant_count == 1:
                    print(f"✅ Database integrity verified: exactly 1 participant found")
                    participant = participants[0]
                    if participant.get('musician_id') == jam_musician_profile_id:
                        print(f"   Participant: {participant.get('pseudo')} (correct musician)")
                    else:
                        print(f"❌ Wrong musician in participants: {participant.get('musician_id')} vs {jam_musician_profile_id}")
                        return False
                else:
                    print(f"❌ CRITICAL DATABASE ISSUE: Found {participant_count} participants, expected exactly 1")
                    return False
            else:
                print(f"❌ Failed to get event participants: {response.status_code}")
                return False
            
            # Additional verification: Check jam participants count in jam data
            response = requests.get(f"{self.base_url}/venues/{jam_venue_profile_id}/jams", timeout=10)
            if response.status_code == 200:
                jams = response.json()
                our_jam = None
                for jam in jams:
                    if jam.get('id') == jam_event_id:
                        our_jam = jam
                        break
                
                if our_jam:
                    participants_count = our_jam.get('participants_count', 0)
                    if participants_count == 1:
                        print(f"✅ Jam participants_count field correct: {participants_count}")
                    else:
                        print(f"❌ Jam participants_count is {participants_count}, expected 1")
                        return False
                else:
                    print("❌ Could not find our jam in jams list")
                    return False
            else:
                print(f"❌ Failed to get venue jams: {response.status_code}")
                return False
            
            print("\n🎉 DOUBLE PARTICIPATION JAM BUG TEST COMPLETED SUCCESSFULLY")
            print("=" * 60)
            print("✅ Backend correctly prevents double participation for JAMS")
            print("✅ Database integrity maintained")
            print("✅ Error handling works as expected")
            print("\n🔍 CONCLUSION: The bug is likely FRONTEND-ONLY for both concerts AND jams")
            print("   - Backend properly validates and prevents double participation")
            print("   - Issue is probably in frontend state management after page refresh")
            
            return True
            
        except Exception as e:
            print(f"❌ Error during test: {str(e)}")
            return False

if __name__ == "__main__":
    tester = DoubleParticipationJamTester()
    success = tester.test_double_participation_jam_bug_reproduction()
    
    if success:
        print("\n✅ TEST PASSED: Backend prevents double participation correctly for JAMS")
        sys.exit(0)
    else:
        print("\n❌ TEST FAILED: Issues found in backend for JAMS")
        sys.exit(1)