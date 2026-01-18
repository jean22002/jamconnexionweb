#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime

def test_venue_concerts_endpoint():
    """Test the GET /api/venues/me/concerts endpoint specifically"""
    base_url = "https://venue-profile-fix.preview.emergentagent.com/api"
    
    try:
        print("\n🔍 TESTING GET /api/venues/me/concerts ENDPOINT")
        print("=" * 60)
        
        # Step 1: Create a venue account for testing
        test_data = {
            "email": f"venue_me_concerts_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "name": "Test Venue Me Concerts",
            "role": "venue"
        }
        
        print("📝 Step 1: Creating venue account...")
        response = requests.post(f"{base_url}/auth/register", json=test_data, timeout=10)
        if response.status_code != 200:
            print(f"❌ Failed to register venue: {response.status_code}")
            return False
            
        venue_data = response.json()
        venue_token = venue_data.get('token')
        venue_user = venue_data.get('user')
        print(f"✅ Venue account created: {venue_user.get('email')}")
        
        # Step 2: Create venue profile
        venue_profile_data = {
            "name": "Test Venue Me Concerts",
            "description": "Testing /api/venues/me/concerts endpoint",
            "address": "123 Test Street",
            "city": "Paris",
            "postal_code": "75001",
            "latitude": 48.8566,
            "longitude": 2.3522,
            "phone": "+33123456789",
            "has_stage": True,
            "has_sound_engineer": True,
            "equipment": ["Piano", "Drums"],
            "music_styles": ["Rock", "Jazz"]
        }
        
        print("📝 Step 2: Creating venue profile...")
        headers = {'Authorization': f'Bearer {venue_token}'}
        response = requests.post(f"{base_url}/venues", json=venue_profile_data, headers=headers, timeout=10)
        if response.status_code != 200:
            print(f"❌ Failed to create venue profile: {response.status_code}")
            return False
            
        venue_profile = response.json()
        venue_id = venue_profile.get('id')
        print(f"✅ Venue profile created: {venue_profile.get('name')} (ID: {venue_id})")
        
        # Step 3: Create multiple concerts with different dates
        concert_dates = ["2025-04-15", "2025-05-20", "2025-06-10"]
        created_concerts = []
        
        for i, test_date in enumerate(concert_dates):
            concert_data = {
                "date": test_date,
                "start_time": "21:00",
                "title": f"Test Concert {i+1}",
                "description": f"Testing concert date {test_date}",
                "bands": [
                    {
                        "name": f"Test Band {i+1}",
                        "members_count": 4
                    }
                ],
                "price": f"{15 + i*5}€"
            }
            
            print(f"📝 Step 3.{i+1}: Creating concert with date: {test_date}")
            response = requests.post(f"{base_url}/concerts", json=concert_data, headers=headers, timeout=10)
            
            if response.status_code != 200:
                print(f"❌ FAILED TO CREATE CONCERT {i+1}: Status {response.status_code}")
                return False
            
            concert_response = response.json()
            created_concerts.append({
                'id': concert_response.get('id'),
                'expected_date': test_date,
                'created_date': concert_response.get('date')
            })
            print(f"✅ Concert {i+1} created with ID: {concert_response.get('id')}")
            print(f"📅 Date in creation response: {concert_response.get('date')}")
        
        # Step 4: Test GET /api/venues/me/concerts endpoint
        print(f"\n📝 Step 4: Testing GET /api/venues/me/concerts endpoint...")
        response = requests.get(f"{base_url}/venues/me/concerts", headers=headers, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ FAILED TO RETRIEVE MY CONCERTS: Status {response.status_code}")
            print(f"Error: {response.text}")
            return False
        
        my_concerts = response.json()
        print(f"✅ Retrieved {len(my_concerts)} concerts from /api/venues/me/concerts")
        
        # Step 5: Verify each concert's date field
        print(f"\n🔍 DETAILED ANALYSIS OF EACH CONCERT:")
        all_dates_correct = True
        
        for i, concert in enumerate(my_concerts):
            print(f"\n📋 Concert {i+1}:")
            print(f"   ID: {concert.get('id')}")
            print(f"   Title: {concert.get('title')}")
            print(f"   Date: {concert.get('date')}")
            print(f"   Start Time: {concert.get('start_time')}")
            print(f"   Bands: {len(concert.get('bands', []))} band(s)")
            print(f"   Price: {concert.get('price')}")
            print(f"   Participants Count: {concert.get('participants_count')}")
            
            # Check if date field is present and correct
            retrieved_date = concert.get('date')
            if 'date' not in concert:
                print(f"   ❌ MISSING 'date' field!")
                all_dates_correct = False
            elif retrieved_date is None:
                print(f"   ❌ 'date' field is NULL!")
                all_dates_correct = False
            else:
                print(f"   ✅ 'date' field present and valid")
                
                # Find the corresponding expected date
                expected_concert = None
                for created in created_concerts:
                    if created['id'] == concert.get('id'):
                        expected_concert = created
                        break
                
                if expected_concert and retrieved_date != expected_concert['expected_date']:
                    print(f"   ❌ Date mismatch! Expected: {expected_concert['expected_date']}, Got: {retrieved_date}")
                    all_dates_correct = False
                elif expected_concert:
                    print(f"   ✅ Date matches expected: {retrieved_date}")
        
        # Step 6: Compare with public endpoint
        print(f"\n📝 Step 6: Comparing with public endpoint /api/venues/{venue_id}/concerts...")
        response = requests.get(f"{base_url}/venues/{venue_id}/concerts", timeout=10)
        
        if response.status_code == 200:
            public_concerts = response.json()
            print(f"✅ Public endpoint returned {len(public_concerts)} concerts")
            
            if len(my_concerts) == len(public_concerts):
                print(f"✅ Concert count matches between endpoints")
            else:
                print(f"❌ Concert count mismatch: me={len(my_concerts)}, public={len(public_concerts)}")
                all_dates_correct = False
        else:
            print(f"❌ Public endpoint failed: {response.status_code}")
        
        return all_dates_correct
        
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_venue_concerts_endpoint()
    if success:
        print(f"\n🎯 CONCLUSION: GET /api/venues/me/concerts endpoint is working correctly")
        print(f"   All concert dates are properly saved and retrieved")
        print(f"   The bug reported by the user is likely in the FRONTEND")
    else:
        print(f"\n🎯 CONCLUSION: GET /api/venues/me/concerts endpoint has issues")
        print(f"   The bug is in the BACKEND")
    
    sys.exit(0 if success else 1)