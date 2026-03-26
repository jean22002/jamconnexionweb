#!/usr/bin/env python3
"""
Quick test to check existing band data and test the iCal endpoint
"""

import requests
import json

# Backend URL
BACKEND_URL = "https://band-calendar-1.preview.emergentagent.com/api"

# Test credentials
MUSICIAN_EMAIL = "musician@gmail.com"
MUSICIAN_PASSWORD = "test"

def authenticate():
    """Authenticate and get token"""
    try:
        login_url = f"{BACKEND_URL}/auth/login"
        login_data = {
            "email": MUSICIAN_EMAIL,
            "password": MUSICIAN_PASSWORD
        }
        
        response = requests.post(login_url, json=login_data, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("token") or data.get("access_token")
            user = data.get("user", {})
            print(f"✅ Authenticated as {user.get('name')} (role: {user.get('role')})")
            return token, user
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            return None, None
            
    except Exception as e:
        print(f"❌ Authentication error: {str(e)}")
        return None, None

def check_existing_bands(token):
    """Check what bands exist in the system"""
    try:
        # Check public bands directory
        bands_url = f"{BACKEND_URL}/bands"
        response = requests.get(bands_url, timeout=30)
        
        if response.status_code == 200:
            bands = response.json()
            print(f"\n📊 Found {len(bands)} public bands:")
            for i, band in enumerate(bands[:5]):  # Show first 5
                print(f"  {i+1}. {band.get('name')} (ID: {band.get('id')}) - {band.get('city')}")
            
            if len(bands) > 5:
                print(f"  ... and {len(bands) - 5} more")
            
            return bands
        else:
            print(f"❌ Failed to get bands: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"❌ Error getting bands: {str(e)}")
        return []

def test_ical_endpoint(token, band_id):
    """Test the iCal endpoint with a specific band ID"""
    try:
        url = f"{BACKEND_URL}/bands/{band_id}/calendar.ics"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        print(f"\n🧪 Testing iCal endpoint for band ID: {band_id}")
        print(f"URL: {url}")
        
        response = requests.get(url, headers=headers, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type', 'N/A')}")
        print(f"Content-Disposition: {response.headers.get('content-disposition', 'N/A')}")
        
        if response.status_code == 200:
            content = response.text
            print(f"Content Length: {len(content)} characters")
            
            # Check iCal format
            if "BEGIN:VCALENDAR" in content and "END:VCALENDAR" in content:
                print("✅ Valid iCal format detected")
                
                # Check for events
                if "BEGIN:VEVENT" in content:
                    event_count = content.count("BEGIN:VEVENT")
                    print(f"✅ Found {event_count} events in calendar")
                else:
                    print("ℹ️  Empty calendar (no events)")
                
                # Show first few lines
                lines = content.split('\n')[:10]
                print("\n📄 First 10 lines of iCal content:")
                for line in lines:
                    print(f"  {line}")
                
                return True
            else:
                print("❌ Invalid iCal format")
                print(f"Content preview: {content[:200]}...")
                return False
        else:
            print(f"❌ Request failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing iCal endpoint: {str(e)}")
        return False

def test_band_events_endpoint(token, band_id):
    """Test the band events endpoint"""
    try:
        url = f"{BACKEND_URL}/bands/{band_id}/events"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        print(f"\n🎵 Testing band events endpoint for band ID: {band_id}")
        
        response = requests.get(url, headers=headers, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            events = response.json()
            print(f"✅ Found {len(events)} events")
            
            for i, event in enumerate(events[:3]):  # Show first 3
                print(f"  {i+1}. {event.get('venue_name')} - {event.get('date')} - {event.get('status')}")
            
            return events
        else:
            print(f"❌ Request failed: {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ Error testing events endpoint: {str(e)}")
        return []

def main():
    print("🧪 Band Calendar iCal Export - Quick Test")
    print(f"📍 Backend URL: {BACKEND_URL}")
    
    # Authenticate
    token, user = authenticate()
    if not token:
        return
    
    # Check existing bands
    bands = check_existing_bands(token)
    
    if not bands:
        print("\n❌ No bands found. Cannot test iCal endpoint.")
        return
    
    # Test with first band
    test_band = bands[0]
    band_id = test_band.get('id')
    band_name = test_band.get('name')
    
    print(f"\n🎯 Testing with band: {band_name} (ID: {band_id})")
    
    # Test band events endpoint
    events = test_band_events_endpoint(token, band_id)
    
    # Test iCal endpoint
    success = test_ical_endpoint(token, band_id)
    
    if success:
        print("\n🎉 iCal endpoint test completed successfully!")
    else:
        print("\n⚠️ iCal endpoint test had issues.")

if __name__ == "__main__":
    main()