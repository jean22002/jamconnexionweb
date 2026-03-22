#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta

class DoubleParticipationTester:
    def __init__(self, base_url="https://pro-subscription-3.preview.emergentagent.com/api"):
        self.base_url = base_url

    def test_double_participation_bug_reproduction(self):
        """Test the specific double participation bug reported by user"""
        try:
            print("\n🔍 TESTING DOUBLE PARTICIPATION BUG REPRODUCTION")
            print("=" * 60)
            
            # Step 1: Create a musician and venue with a concert
            print("Step 1: Creating test accounts and profiles...")
            
            # Create musician for bug test
            musician_data = {
                "email": f"bug_musician_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Bug Test Musician",
                "role": "musician"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=musician_data, timeout=10)
            if response.status_code != 200:
                print(f"❌ Failed to create musician: {response.status_code}")
                return False
                
            bug_musician = response.json()
            bug_musician_token = bug_musician.get('token')
            bug_musician_user = bug_musician.get('user')
            
            # Create musician profile
            profile_data = {
                "pseudo": "BugTester",
                "instruments": ["Guitar"],
                "music_styles": ["Rock"]
            }
            headers_musician = {'Authorization': f'Bearer {bug_musician_token}'}
            profile_response = requests.post(f"{self.base_url}/musicians", json=profile_data, headers=headers_musician, timeout=10)
            
            if profile_response.status_code != 200:
                print(f"❌ Failed to create profile: {profile_response.status_code}")
                return False
                
            bug_musician_profile = profile_response.json()
            bug_musician_profile_id = bug_musician_profile.get('id')
            
            # Create venue for bug test
            venue_data = {
                "email": f"bug_venue_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Bug Test Venue",
                "role": "venue"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=venue_data, timeout=10)
            if response.status_code != 200:
                print(f"❌ Failed to create venue: {response.status_code}")
                return False
                
            bug_venue = response.json()
            bug_venue_token = bug_venue.get('token')
            
            # Create venue profile
            venue_profile_data = {
                "name": "Bug Test Club",
                "description": "Test venue for bug reproduction",
                "address": "123 Bug Street",
                "city": "Paris",
                "postal_code": "75001",
                "latitude": 48.8566,
                "longitude": 2.3522,
                "has_stage": True,
                "equipment": ["Sound System"],
                "music_styles": ["Rock"]
            }
            
            headers_venue = {'Authorization': f'Bearer {bug_venue_token}'}
            venue_profile_response = requests.post(f"{self.base_url}/venues", json=venue_profile_data, headers=headers_venue, timeout=10)
            
            if venue_profile_response.status_code != 200:
                print(f"❌ Failed to create venue profile: {venue_profile_response.status_code}")
                return False
                
            bug_venue_profile = venue_profile_response.json()
            bug_venue_profile_id = bug_venue_profile.get('id')
            
            print(f"✅ Created musician: {bug_musician_profile_id}")
            print(f"✅ Created venue: {bug_venue_profile_id}")
            
            # Step 2: Create a concert
            print("\nStep 2: Creating concert event...")
            
            tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            
            concert_data = {
                "date": tomorrow,
                "start_time": "20:00",
                "end_time": "23:00",
                "title": "Bug Test Concert",
                "description": "Concert for testing double participation bug",
                "bands": [
                    {
                        "name": "Test Band",
                        "photo": "https://example.com/band.jpg"
                    }
                ],
                "price": "20€"
            }
            
            response = requests.post(f"{self.base_url}/concerts", json=concert_data, headers=headers_venue, timeout=10)
            if response.status_code != 200:
                print(f"❌ Failed to create concert: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
            bug_concert = response.json()
            bug_concert_id = bug_concert.get('id')
            print(f"✅ Created concert: {bug_concert_id} on {tomorrow}")
            
            # Step 3: Make musician participate in concert
            print("\nStep 3: Musician participating in concert...")
            
            response = requests.post(f"{self.base_url}/events/{bug_concert_id}/join?event_type=concert", headers=headers_musician, timeout=10)
            if response.status_code != 200:
                print(f"❌ Failed to join concert: {response.status_code}")
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
                
            # Find our concert participation
            our_participation = None
            for participation in participations:
                if participation.get('event_id') == bug_concert_id:
                    our_participation = participation
                    break
            
            if not our_participation:
                print("❌ Our concert participation not found in list")
                return False
                
            print(f"✅ Participation verified: {our_participation.get('event_type')} at {our_participation.get('venue_name')}, active={our_participation.get('active')}")
            
            # Step 5: Get musician participations (simulating frontend call)
            print("\nStep 5: Getting musician participations (frontend simulation)...")
            
            response = requests.get(f"{self.base_url}/musicians/me/participations", headers=headers_musician, timeout=10)
            if response.status_code == 200:
                participation_data = response.json()
                concert_found = False
                for participation in participation_data:
                    if participation.get('event_id') == bug_concert_id:
                        concert_found = True
                        print(f"✅ Concert appears in participations: event_id={participation.get('event_id')}, event_type={participation.get('event_type')}, active={participation.get('active')}")
                        break
                
                if not concert_found:
                    print("❌ Concert does not appear in musician participations")
                    return False
            else:
                print(f"❌ Failed to get participations: {response.status_code}")
                return False
            
            # Step 6: Attempt to participate a 2nd time (should fail)
            print("\nStep 6: Attempting second participation (should be blocked)...")
            
            response = requests.post(f"{self.base_url}/events/{bug_concert_id}/join?event_type=concert", headers=headers_musician, timeout=10)
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
            
            # Step 7: Verify in database - should be only ONE active participation
            print("\nStep 7: Verifying database integrity...")
            
            # Check event participants count
            response = requests.get(f"{self.base_url}/events/{bug_concert_id}/participants", timeout=10)
            if response.status_code == 200:
                participants = response.json()
                participant_count = len(participants)
                if participant_count == 1:
                    print(f"✅ Database integrity verified: exactly 1 participant found")
                    participant = participants[0]
                    if participant.get('musician_id') == bug_musician_profile_id:
                        print(f"   Participant: {participant.get('pseudo')} (correct musician)")
                    else:
                        print(f"❌ Wrong musician in participants: {participant.get('musician_id')} vs {bug_musician_profile_id}")
                        return False
                else:
                    print(f"❌ CRITICAL DATABASE ISSUE: Found {participant_count} participants, expected exactly 1")
                    return False
            else:
                print(f"❌ Failed to get event participants: {response.status_code}")
                return False
            
            # Additional verification: Check concert participants count in concert data
            response = requests.get(f"{self.base_url}/venues/{bug_venue_profile_id}/concerts", timeout=10)
            if response.status_code == 200:
                concerts = response.json()
                our_concert = None
                for concert in concerts:
                    if concert.get('id') == bug_concert_id:
                        our_concert = concert
                        break
                
                if our_concert:
                    participants_count = our_concert.get('participants_count', 0)
                    if participants_count == 1:
                        print(f"✅ Concert participants_count field correct: {participants_count}")
                    else:
                        print(f"❌ Concert participants_count is {participants_count}, expected 1")
                        return False
                else:
                    print("❌ Could not find our concert in concerts list")
                    return False
            else:
                print(f"❌ Failed to get venue concerts: {response.status_code}")
                return False
            
            print("\n🎉 DOUBLE PARTICIPATION BUG TEST COMPLETED SUCCESSFULLY")
            print("=" * 60)
            print("✅ Backend correctly prevents double participation")
            print("✅ Database integrity maintained")
            print("✅ Error handling works as expected")
            print("\n🔍 CONCLUSION: The bug is likely FRONTEND-ONLY")
            print("   - Backend properly validates and prevents double participation")
            print("   - Issue is probably in frontend state management after page refresh")
            
            return True
            
        except Exception as e:
            print(f"❌ Error during test: {str(e)}")
            return False

if __name__ == "__main__":
    tester = DoubleParticipationTester()
    success = tester.test_double_participation_bug_reproduction()
    
    if success:
        print("\n✅ TEST PASSED: Backend prevents double participation correctly")
        sys.exit(0)
    else:
        print("\n❌ TEST FAILED: Issues found in backend")
        sys.exit(1)