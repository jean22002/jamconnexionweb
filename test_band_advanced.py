#!/usr/bin/env python3
"""
Test to check bands collection and create test data if needed
"""

import requests
import json
import uuid
from datetime import datetime, timedelta

# Backend URL
BACKEND_URL = "https://collapsible-map.preview.emergentagent.com/api"

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
            print(f"✅ Authenticated as {user.get('name')} (role: {user.get('role')}, ID: {user.get('id')})")
            return token, user
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            return None, None
            
    except Exception as e:
        print(f"❌ Authentication error: {str(e)}")
        return None, None

def create_test_band(token, user):
    """Create a test band with the current user as admin"""
    try:
        # First, let's try to create a band via the bands endpoint
        # Since I don't see a create band endpoint in band_invitations.py,
        # let's try to create one directly via a POST request
        
        band_data = {
            "id": f"test_band_{uuid.uuid4().hex[:8]}",
            "name": f"Test Band iCal {datetime.now().strftime('%H%M%S')}",
            "description": "Test band for iCal export testing",
            "admin_id": user["id"],
            "members": [
                {
                    "user_id": user["id"],
                    "name": user["name"],
                    "pseudo": user.get("name"),
                    "is_admin": True,
                    "joined_at": datetime.now().isoformat()
                }
            ],
            "created_at": datetime.now().isoformat()
        }
        
        # Try to create via a hypothetical bands endpoint
        create_url = f"{BACKEND_URL}/bands"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(create_url, json=band_data, headers=headers, timeout=30)
        
        print(f"Create band attempt: {response.status_code}")
        if response.status_code in [200, 201]:
            band = response.json()
            print(f"✅ Created test band: {band}")
            return band.get("id")
        else:
            print(f"❌ Failed to create band: {response.text}")
            
            # Let's try a different approach - maybe there's a different endpoint
            # Let's manually create a band ID and test with it
            test_band_id = f"test_band_{uuid.uuid4().hex[:8]}"
            print(f"🔧 Using manual test band ID: {test_band_id}")
            return test_band_id
            
    except Exception as e:
        print(f"❌ Error creating band: {str(e)}")
        return None

def test_with_manual_band_id(token):
    """Test with a manually created band ID"""
    # Let's use one of the existing band IDs from the public directory
    # but first check if we can access any existing bands
    
    existing_bands = [
        "fc5c0e8c-2684-45f6-bd4e-505eb63213b8-spleenbreaker",
        "38a36230-6849-46c1-90cd-b22ea8bf8954-The Rockers",
        "9e43c469-e343-435e-9725-f55914d5f4fd-Test Band No GPS"
    ]
    
    for band_id in existing_bands:
        print(f"\n🧪 Testing with existing band ID: {band_id}")
        
        # Test iCal endpoint
        url = f"{BACKEND_URL}/bands/{band_id}/calendar.ics"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Success! iCal endpoint working")
            content = response.text
            print(f"Content length: {len(content)}")
            
            if "BEGIN:VCALENDAR" in content:
                print("✅ Valid iCal format")
                if "BEGIN:VEVENT" in content:
                    event_count = content.count("BEGIN:VEVENT")
                    print(f"✅ Found {event_count} events")
                else:
                    print("ℹ️  Empty calendar (no events)")
                return True
            else:
                print("❌ Invalid iCal format")
        elif response.status_code == 403:
            print("❌ Access denied - not a member of this band")
        elif response.status_code == 404:
            print("❌ Band not found")
        else:
            print(f"❌ Error: {response.text}")
    
    return False

def test_join_band_with_code(token):
    """Test joining a band with a code (if we have one)"""
    # This would require having an invitation code
    # For now, let's skip this
    print("\n🔗 Band joining test skipped (no invitation code available)")
    return True

def main():
    print("🧪 Band Calendar iCal Export - Advanced Test")
    print(f"📍 Backend URL: {BACKEND_URL}")
    
    # Authenticate
    token, user = authenticate()
    if not token:
        return
    
    # Try to create a test band
    band_id = create_test_band(token, user)
    
    if band_id:
        print(f"\n🎯 Testing with band ID: {band_id}")
        
        # Test iCal endpoint with our band
        url = f"{BACKEND_URL}/bands/{band_id}/calendar.ics"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        print(f"iCal test result: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Success with created band!")
        else:
            print(f"❌ Failed with created band: {response.text}")
    
    # Test with existing bands
    success = test_with_manual_band_id(token)
    
    if success:
        print("\n🎉 iCal endpoint test completed successfully!")
    else:
        print("\n⚠️ iCal endpoint test had issues - user may not be member of any bands")

if __name__ == "__main__":
    main()