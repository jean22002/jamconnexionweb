#!/usr/bin/env python3
"""
Check database structure for bands vs musicians.bands
"""

import requests
import json

BACKEND_URL = "https://musician-calendar-1.preview.emergentagent.com/api"

def check_database_structure():
    print("🔍 Checking Database Structure for Bands")
    
    # Login as musician
    session = requests.Session()
    login_response = session.post(f"{BACKEND_URL}/auth/login", json={
        "email": "musician@gmail.com",
        "password": "test"
    })
    
    if login_response.status_code != 200:
        print("❌ Login failed")
        return
    
    token = login_response.json().get("token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Check public bands endpoint
    print("\n📊 Public Bands Endpoint (/api/bands):")
    bands_response = session.get(f"{BACKEND_URL}/bands")
    if bands_response.status_code == 200:
        bands = bands_response.json()
        print(f"   Found {len(bands)} bands in public directory")
        if bands:
            sample_band = bands[0]
            print(f"   Sample band structure:")
            for key in ['id', 'name', 'admin_id', 'musician_id']:
                print(f"     {key}: {sample_band.get(key)}")
    
    # Check musician profile for bands
    print("\n🎵 Musician Profile (/api/musicians/me):")
    profile_response = session.get(f"{BACKEND_URL}/musicians/me", headers=headers)
    if profile_response.status_code == 200:
        profile = profile_response.json()
        bands_in_profile = profile.get("bands", [])
        print(f"   Found {len(bands_in_profile)} bands in musician profile")
        if bands_in_profile:
            sample_band = bands_in_profile[0]
            print(f"   Sample band in profile:")
            for key in ['id', 'name', 'admin_id']:
                print(f"     {key}: {sample_band.get(key)}")
    
    # Check if there's a dedicated bands collection endpoint
    print("\n🎤 Testing Band-specific Endpoints:")
    
    # Try with a band ID from public directory
    if 'bands' in locals() and bands:
        test_band_id = bands[0]['id']
        print(f"   Testing with band ID: {test_band_id}")
        
        # Test events endpoint
        events_url = f"{BACKEND_URL}/bands/{test_band_id}/events"
        events_response = session.get(events_url, headers=headers)
        print(f"   Events endpoint: {events_response.status_code}")
        
        # Test iCal endpoint
        ical_url = f"{BACKEND_URL}/bands/{test_band_id}/calendar.ics"
        ical_response = session.get(ical_url, headers=headers)
        print(f"   iCal endpoint: {ical_response.status_code}")
        
        if ical_response.status_code == 200:
            print("   ✅ iCal working!")
        elif ical_response.status_code == 403:
            print("   ⚠️ Access denied (not a member)")
        elif ical_response.status_code == 404:
            print("   ❌ Band not found in bands collection")
    
    print("\n🔍 Analysis:")
    print("   The issue is likely that:")
    print("   1. Bands exist in public directory (/api/bands)")
    print("   2. But iCal endpoint looks in db.bands collection")
    print("   3. These might be different data sources")
    print("   4. Need to check if bands are properly stored in db.bands")

if __name__ == "__main__":
    check_database_structure()
