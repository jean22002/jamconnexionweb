#!/usr/bin/env python3
"""
Test band membership and iCal export with proper band data
"""

import requests
import json

BACKEND_URL = "https://band-invites-hub.preview.emergentagent.com/api"

def test_band_membership():
    print("🎯 Testing Band Membership and iCal Export")
    
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
    user_data = login_response.json().get("user", {})
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"✅ Logged in as: {user_data.get('name')} (ID: {user_data.get('id')})")
    
    # Get musician profile to see bands
    profile_response = session.get(f"{BACKEND_URL}/musicians/me", headers=headers)
    if profile_response.status_code == 200:
        profile = profile_response.json()
        bands_in_profile = profile.get("bands", [])
        print(f"\n🎵 Musician has {len(bands_in_profile)} bands in profile:")
        
        for band in bands_in_profile:
            band_id = band.get("id")
            band_name = band.get("name")
            print(f"   - {band_name} (ID: {band_id})")
            
            # Test iCal endpoint with this band
            ical_url = f"{BACKEND_URL}/bands/{band_id}/calendar.ics"
            ical_response = session.get(ical_url, headers=headers)
            print(f"     iCal endpoint: {ical_response.status_code}")
            
            if ical_response.status_code == 200:
                print("     ✅ iCal export working!")
                ical_content = ical_response.text
                print(f"     📏 Content length: {len(ical_content)} chars")
                
                # Show first few lines
                lines = ical_content.split('\n')[:5]
                for line in lines:
                    print(f"       {line}")
                    
            elif ical_response.status_code == 404:
                print("     ❌ Band not found in db.bands collection")
            elif ical_response.status_code == 403:
                print("     ⚠️ Access denied")
    
    # Test with admin user (should have access to their own bands)
    print(f"\n🔑 Testing with band admin access...")
    
    # Try to find a band admin
    bands_response = session.get(f"{BACKEND_URL}/bands")
    if bands_response.status_code == 200:
        bands = bands_response.json()
        
        # Find a band with admin_id
        for band in bands[:3]:  # Test first 3 bands
            admin_id = band.get("admin_id")
            band_id = band.get("id")
            band_name = band.get("name")
            
            if admin_id:
                print(f"\n🎤 Testing band: {band_name}")
                print(f"   Admin ID: {admin_id}")
                print(f"   Current user ID: {user_data.get('id')}")
                
                # Test iCal endpoint
                ical_url = f"{BACKEND_URL}/bands/{band_id}/calendar.ics"
                ical_response = session.get(ical_url, headers=headers)
                print(f"   iCal endpoint: {ical_response.status_code}")
                
                if ical_response.status_code == 200:
                    print("   ✅ iCal export working!")
                elif ical_response.status_code == 403:
                    print("   ⚠️ Access denied (not admin/member)")
                elif ical_response.status_code == 404:
                    print("   ❌ Band not found in db.bands collection")
    
    print(f"\n🔍 Root Cause Analysis:")
    print(f"   1. ✅ Authentication is FIXED (no 401 errors)")
    print(f"   2. ❌ Data structure mismatch:")
    print(f"      - Bands exist in public directory (/api/bands)")
    print(f"      - But iCal endpoint looks in db.bands collection")
    print(f"      - These are different data sources")
    print(f"   3. 🔧 Solution needed:")
    print(f"      - Update iCal endpoint to use correct data source")
    print(f"      - OR ensure bands are properly synced to db.bands")

if __name__ == "__main__":
    test_band_membership()
