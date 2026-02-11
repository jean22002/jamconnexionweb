#!/usr/bin/env python3
"""
Test JWT with exact backend configuration
"""

import jwt
import os
import requests
from datetime import datetime, timezone, timedelta

def test_jwt_exact():
    # Use exact same configuration as backend
    JWT_SECRET = "jamconnexion_secret_key_2024_super_secure"
    JWT_ALGORITHM = "HS256"
    
    base_url = "https://photo-upload-fix-15.preview.emergentagent.com/api"
    
    # Get a fresh token
    register_data = {
        "email": f"jwt.exact.{datetime.now().strftime('%H%M%S')}@test.fr",
        "password": "Test1234!",
        "name": "JWT Exact",
        "role": "melomane"
    }
    
    response = requests.post(f"{base_url}/auth/register", json=register_data, timeout=10)
    if response.status_code != 200:
        print(f"Registration failed: {response.text}")
        return
    
    data = response.json()
    token = data.get('token')
    user_data = data.get('user')
    print(f"Token received: {token[:50]}...")
    print(f"User ID: {user_data.get('id')}")
    print(f"User role: {user_data.get('role')}")
    
    try:
        # Try to decode with exact same settings as backend
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        print(f"✅ JWT decode successful: {payload}")
        
        # Check if user exists in database by calling /auth/me
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(f"{base_url}/auth/me", headers=headers, timeout=10)
        print(f"Auth/me status: {response.status_code}")
        if response.status_code == 200:
            auth_data = response.json()
            print(f"Auth/me data: {auth_data}")
        else:
            print(f"Auth/me failed: {response.text}")
        
        # Now test the problematic endpoint
        print("\n🔍 Testing problematic endpoint...")
        
        # Get venues first
        response = requests.get(f"{base_url}/venues", timeout=10)
        if response.status_code == 200:
            venues = response.json()
            if venues:
                venue_id = venues[0].get('id')
                
                # Get jams
                response = requests.get(f"{base_url}/venues/{venue_id}/jams", timeout=10)
                if response.status_code == 200:
                    jams = response.json()
                    if jams:
                        jam_id = jams[0].get('id')
                        
                        # Test the join endpoint with detailed debugging
                        print(f"Attempting to join jam {jam_id}")
                        print(f"Using token: {token[:50]}...")
                        print(f"Authorization header: Bearer {token[:50]}...")
                        
                        response = requests.post(
                            f"{base_url}/events/{jam_id}/join?event_type=jam", 
                            headers=headers, 
                            timeout=10
                        )
                        print(f"Join response status: {response.status_code}")
                        print(f"Join response: {response.text}")
                        print(f"Join response headers: {dict(response.headers)}")
                        
                        # Let's also test a working melomane endpoint for comparison
                        print("\n🔍 Testing working melomane endpoint for comparison...")
                        response = requests.get(f"{base_url}/melomanes/me", headers=headers, timeout=10)
                        print(f"Melomanes/me status: {response.status_code}")
                        print(f"Melomanes/me response: {response.text[:200]}...")
                        
    except Exception as e:
        print(f"❌ JWT decode error: {e}")

if __name__ == "__main__":
    test_jwt_exact()