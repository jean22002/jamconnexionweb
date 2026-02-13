#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime

def test_concert_date_bug():
    """Test the specific bug reported by user: Concert date not saving/displaying correctly"""
    base_url = "https://gamified-venue.preview.emergentagent.com/api"
    
    try:
        print("\n🔍 TESTING CONCERT DATE BUG - User reported issue")
        print("=" * 60)
        
        # Step 1: Create a venue account for testing
        test_data = {
            "email": f"venue_date_bug_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "name": "Test Venue Date Bug",
            "role": "venue"
        }
        
        print("📝 Step 1: Creating venue account...")
        response = requests.post(f"{base_url}/auth/register", json=test_data, timeout=10)
        if response.status_code != 200:
            print(f"❌ Failed to register venue: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
        venue_data = response.json()
        venue_token = venue_data.get('token')
        venue_user = venue_data.get('user')
        print(f"✅ Venue account created: {venue_user.get('email')}")
        
        # Step 2: Create venue profile with all required fields
        venue_profile_data = {
            "name": "Test Concert Date Venue",
            "description": "Testing concert date bug",
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
            print(f"Error: {response.text}")
            return False
            
        venue_profile = response.json()
        venue_id = venue_profile.get('id')
        print(f"✅ Venue profile created: {venue_profile.get('name')} (ID: {venue_id})")
        
        # Step 3: Create a concert with specific date as reported by user
        test_date = "2025-05-20"  # User example date
        concert_data = {
            "date": test_date,
            "start_time": "21:00",
            "title": "Test Concert Date Bug",
            "description": "Testing if concert date is saved and displayed correctly",
            "bands": [
                {
                    "name": "Test Band",
                    "members_count": 4,
                    "photo": "https://example.com/band.jpg"
                }
            ],
            "price": "20€"
        }
        
        print(f"📝 Step 3: Creating concert with date: {test_date}")
        response = requests.post(f"{base_url}/concerts", json=concert_data, headers=headers, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ FAILED TO CREATE CONCERT: Status {response.status_code}")
            print(f"Error: {response.text}")
            return False
        
        concert_response = response.json()
        concert_id = concert_response.get('id')
        created_date = concert_response.get('date')
        
        print(f"✅ Concert created with ID: {concert_id}")
        print(f"📅 Date in creation response: {created_date}")
        
        # Step 4: Retrieve concerts for this venue via GET /api/venues/{venue_id}/concerts
        print(f"\n📝 Step 4: Retrieving concerts for venue {venue_id}...")
        response = requests.get(f"{base_url}/venues/{venue_id}/concerts", timeout=10)
        
        if response.status_code != 200:
            print(f"❌ FAILED TO RETRIEVE CONCERTS: Status {response.status_code}")
            print(f"Error: {response.text}")
            return False
        
        concerts_list = response.json()
        print(f"✅ Retrieved {len(concerts_list)} concerts")
        
        # Step 5: Verify if the date field is present and correct
        our_concert = None
        for concert in concerts_list:
            if concert.get('id') == concert_id:
                our_concert = concert
                break
        
        if not our_concert:
            print(f"❌ CONCERT NOT FOUND in venue concerts list")
            return False
        
        # Step 6: Check the date field specifically
        retrieved_date = our_concert.get('date')
        print(f"\n🔍 CRITICAL CHECK - Date field analysis:")
        print(f"   Expected date: {test_date}")
        print(f"   Retrieved date: {retrieved_date}")
        print(f"   Date field present: {'date' in our_concert}")
        print(f"   Date field type: {type(retrieved_date)}")
        
        # Print full concert object for debugging
        print(f"\n📋 Full concert object:")
        for key, value in our_concert.items():
            print(f"   {key}: {value}")
        
        # Determine if this is a backend bug
        if 'date' not in our_concert:
            print(f"\n🚨 BACKEND BUG CONFIRMED: 'date' field is MISSING from concert response")
            return False
        elif retrieved_date != test_date:
            print(f"\n🚨 BACKEND BUG CONFIRMED: 'date' field is INCORRECT. Expected: {test_date}, Got: {retrieved_date}")
            return False
        elif retrieved_date is None:
            print(f"\n🚨 BACKEND BUG CONFIRMED: 'date' field is NULL/None")
            return False
        else:
            print(f"\n✅ BACKEND WORKING CORRECTLY: 'date' field present and correct ({retrieved_date}). Bug is likely FRONTEND.")
            return True
        
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_concert_date_bug()
    if success:
        print(f"\n🎯 CONCLUSION: Backend API is working correctly for concert dates")
        print(f"   The bug reported by the user is likely in the FRONTEND")
    else:
        print(f"\n🎯 CONCLUSION: Backend API has issues with concert dates")
        print(f"   The bug is in the BACKEND")
    
    sys.exit(0 if success else 1)