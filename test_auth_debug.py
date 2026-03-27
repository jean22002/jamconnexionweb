#!/usr/bin/env python3
"""
Test the authentication format and debug the issue
"""

import requests
import json

# Backend URL
BACKEND_URL = "https://band-invites-hub.preview.emergentagent.com/api"

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
            print(f"Token preview: {token[:20]}...")
            return token, user
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            return None, None
            
    except Exception as e:
        print(f"❌ Authentication error: {str(e)}")
        return None, None

def test_working_endpoint(token):
    """Test a known working endpoint to verify token format"""
    try:
        # Test the /auth/me endpoint which should work
        url = f"{BACKEND_URL}/auth/me"
        headers = {"Authorization": f"Bearer {token}"}
        
        print(f"\n🧪 Testing working endpoint: {url}")
        response = requests.get(url, headers=headers, timeout=30)
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ Working endpoint success: {user_data.get('name')}")
            return True
        else:
            print(f"❌ Working endpoint failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing working endpoint: {str(e)}")
        return False

def test_band_endpoint_debug(token):
    """Test band endpoint with detailed debugging"""
    try:
        # Use a simple band ID
        band_id = "test_band_123"
        url = f"{BACKEND_URL}/bands/{band_id}/calendar.ics"
        
        print(f"\n🔍 Debug test for: {url}")
        
        # Try different header formats
        header_formats = [
            {"Authorization": f"Bearer {token}"},
            {"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            {"authorization": f"Bearer {token}"},  # lowercase
        ]
        
        for i, headers in enumerate(header_formats):
            print(f"\n  Format {i+1}: {headers}")
            response = requests.get(url, headers=headers, timeout=30)
            print(f"  Status: {response.status_code}")
            
            if response.status_code != 401:
                print(f"  Response: {response.text[:200]}...")
                if response.status_code == 200:
                    return True
            else:
                print(f"  Still 401: {response.json()}")
        
        return False
            
    except Exception as e:
        print(f"❌ Error in debug test: {str(e)}")
        return False

def test_band_events_endpoint(token):
    """Test the band events endpoint"""
    try:
        band_id = "test_band_123"
        url = f"{BACKEND_URL}/bands/{band_id}/events"
        headers = {"Authorization": f"Bearer {token}"}
        
        print(f"\n🎵 Testing band events: {url}")
        response = requests.get(url, headers=headers, timeout=30)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        
        return response.status_code != 401
            
    except Exception as e:
        print(f"❌ Error testing events endpoint: {str(e)}")
        return False

def main():
    print("🔍 Authentication Debug Test")
    print(f"📍 Backend URL: {BACKEND_URL}")
    
    # Authenticate
    token, user = authenticate()
    if not token:
        return
    
    # Test working endpoint first
    if test_working_endpoint(token):
        print("✅ Token format is correct")
    else:
        print("❌ Token format issue")
        return
    
    # Test band endpoints with debugging
    test_band_endpoint_debug(token)
    test_band_events_endpoint(token)

if __name__ == "__main__":
    main()