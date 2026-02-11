#!/usr/bin/env python3
"""
Debug Melomane Token Issue
"""

import requests
import json

def test_melomane_token():
    base_url = "https://profile-photo-upload-1.preview.emergentagent.com/api"
    
    # Step 1: Register melomane
    print("🔍 Step 1: Registering melomane...")
    register_data = {
        "email": "debug.melomane@test.fr",
        "password": "Test1234!",
        "name": "Debug Mélomane",
        "role": "melomane"
    }
    
    response = requests.post(f"{base_url}/auth/register", json=register_data, timeout=10)
    print(f"Registration status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        token = data.get('token')
        user = data.get('user')
        print(f"Token received: {bool(token)}")
        print(f"User role: {user.get('role')}")
        print(f"Token preview: {token[:50]}..." if token else "No token")
    else:
        print(f"Registration failed: {response.text}")
        return
    
    # Step 2: Test /auth/me with token
    print("\n🔍 Step 2: Testing /auth/me with token...")
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f"{base_url}/auth/me", headers=headers, timeout=10)
    print(f"Auth/me status: {response.status_code}")
    if response.status_code == 200:
        auth_data = response.json()
        print(f"Auth/me role: {auth_data.get('role')}")
        print(f"Auth/me id: {auth_data.get('id')}")
    else:
        print(f"Auth/me failed: {response.text}")
        return
    
    # Step 3: Create melomane profile
    print("\n🔍 Step 3: Creating melomane profile...")
    profile_data = {
        "pseudo": "Debug Mélomane",
        "bio": "Testing debug",
        "city": "Paris",
        "favorite_styles": ["Rock"],
        "notifications_enabled": True,
        "notification_radius_km": 50
    }
    
    response = requests.post(f"{base_url}/melomanes/", json=profile_data, headers=headers, timeout=10)
    print(f"Profile creation status: {response.status_code}")
    if response.status_code == 200:
        profile = response.json()
        print(f"Profile ID: {profile.get('id')}")
    else:
        print(f"Profile creation failed: {response.text}")
        return
    
    # Step 4: Test event join with detailed error
    print("\n🔍 Step 4: Testing event join...")
    # First get a jam ID
    response = requests.get(f"{base_url}/venues", timeout=10)
    if response.status_code == 200:
        venues = response.json()
        if venues:
            venue_id = venues[0].get('id')
            print(f"Using venue: {venue_id}")
            
            # Get jams for this venue
            response = requests.get(f"{base_url}/venues/{venue_id}/jams", timeout=10)
            if response.status_code == 200:
                jams = response.json()
                if jams:
                    jam_id = jams[0].get('id')
                    print(f"Using jam: {jam_id}")
                    
                    # Try to join
                    response = requests.post(f"{base_url}/events/{jam_id}/join?event_type=jam", headers=headers, timeout=10)
                    print(f"Join event status: {response.status_code}")
                    print(f"Join event response: {response.text}")
                    
                    # Check response headers
                    print(f"Response headers: {dict(response.headers)}")
                else:
                    print("No jams found")
            else:
                print(f"Failed to get jams: {response.status_code}")
        else:
            print("No venues found")
    else:
        print(f"Failed to get venues: {response.status_code}")

if __name__ == "__main__":
    test_melomane_token()