#!/usr/bin/env python3
"""
Final Comprehensive Melomane Test - Fresh Account
"""

import requests
import sys
from datetime import datetime

def run_final_test():
    base_url = "https://mongo-migration-20.preview.emergentagent.com/api"
    timestamp = datetime.now().strftime('%H%M%S')
    
    print("🎭 FINAL COMPREHENSIVE MELOMANE TEST")
    print("=" * 50)
    
    # Test 1: Registration
    print("1️⃣ Testing Melomane Registration...")
    register_data = {
        "email": f"final.melomane.{timestamp}@test.fr",
        "password": "Test1234!",
        "name": "Final Test Mélomane",
        "role": "melomane"
    }
    
    response = requests.post(f"{base_url}/auth/register", json=register_data, timeout=10)
    if response.status_code != 200:
        print(f"❌ Registration failed: {response.text}")
        return False
    
    data = response.json()
    token = data.get('token')
    user = data.get('user')
    print(f"✅ Registration successful - Role: {user.get('role')}")
    
    # Test 2: Profile Creation
    print("\n2️⃣ Testing Profile Creation...")
    headers = {'Authorization': f'Bearer {token}'}
    profile_data = {
        "pseudo": "Final Test Mélomane",
        "bio": "J'adore la musique live !",
        "city": "Paris",
        "favorite_styles": ["Rock", "Jazz"],
        "notifications_enabled": True,
        "notification_radius_km": 50
    }
    
    response = requests.post(f"{base_url}/melomanes/", json=profile_data, headers=headers, timeout=10)
    if response.status_code != 200:
        print(f"❌ Profile creation failed: {response.text}")
        return False
    
    profile = response.json()
    print(f"✅ Profile created - ID: {profile.get('id')}")
    
    # Test 3: Event Participation
    print("\n3️⃣ Testing Event Participation...")
    
    # Get venues
    response = requests.get(f"{base_url}/venues", timeout=10)
    if response.status_code != 200:
        print(f"❌ Failed to get venues: {response.status_code}")
        return False
    
    venues = response.json()
    if not venues:
        print("❌ No venues available")
        return False
    
    venue = venues[0]
    venue_id = venue.get('id')
    
    # Get jams
    response = requests.get(f"{base_url}/venues/{venue_id}/jams", timeout=10)
    if response.status_code != 200:
        print(f"❌ Failed to get jams: {response.status_code}")
        return False
    
    jams = response.json()
    if not jams:
        print("❌ No jams available")
        return False
    
    jam = jams[0]
    jam_id = jam.get('id')
    
    # Join jam
    response = requests.post(f"{base_url}/events/{jam_id}/join?event_type=jam", headers=headers, timeout=10)
    if response.status_code != 200:
        print(f"❌ Failed to join jam: {response.status_code} - {response.text}")
        return False
    
    join_data = response.json()
    print(f"✅ Successfully joined jam - Participation ID: {join_data.get('participation_id')}")
    
    # Test 4: Verify Participation
    print("\n4️⃣ Testing Participation Verification...")
    response = requests.get(f"{base_url}/melomanes/me/participations", headers=headers, timeout=10)
    if response.status_code != 200:
        print(f"❌ Failed to get participations: {response.status_code}")
        return False
    
    participations = response.json()
    if not participations:
        print("❌ No participations found")
        return False
    
    participation = participations[0]
    if participation.get('participant_type') != 'melomane':
        print(f"❌ Wrong participant_type: {participation.get('participant_type')}")
        return False
    
    print(f"✅ Participation verified - Type: {participation.get('participant_type')}, Event: {participation.get('event_type')}")
    
    # Test 5: Leave Event
    print("\n5️⃣ Testing Leave Event...")
    event_id = participation.get('event_id')
    response = requests.post(f"{base_url}/events/{event_id}/leave", headers=headers, timeout=10)
    if response.status_code != 200:
        print(f"❌ Failed to leave event: {response.status_code} - {response.text}")
        return False
    
    print("✅ Successfully left event")
    
    # Test 6: Verify Participation Deactivated
    print("\n6️⃣ Testing Participation Deactivation...")
    response = requests.get(f"{base_url}/melomanes/me/participations", headers=headers, timeout=10)
    if response.status_code != 200:
        print(f"❌ Failed to get updated participations: {response.status_code}")
        return False
    
    updated_participations = response.json()
    active_participations = [p for p in updated_participations if p.get('event_id') == event_id and p.get('active', True)]
    
    if active_participations:
        print("❌ Participation still active after leaving")
        return False
    
    print("✅ Participation correctly deactivated")
    
    # Test 7: Notifications
    print("\n7️⃣ Testing Notifications...")
    response = requests.get(f"{base_url}/notifications", headers=headers, timeout=10)
    if response.status_code != 200:
        print(f"❌ Failed to get notifications: {response.status_code}")
        return False
    
    response = requests.get(f"{base_url}/notifications/unread-count", headers=headers, timeout=10)
    if response.status_code != 200:
        print(f"❌ Failed to get unread count: {response.status_code}")
        return False
    
    print("✅ Notifications API working")
    
    print("\n🎉 ALL TESTS PASSED! MELOMANE SYSTEM FULLY FUNCTIONAL!")
    return True

if __name__ == "__main__":
    success = run_final_test()
    sys.exit(0 if success else 1)