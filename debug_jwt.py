#!/usr/bin/env python3
"""
Debug JWT Token Decoding
"""

import jwt
import os
import requests

def debug_jwt_token():
    base_url = "https://music-fan-profile.preview.emergentagent.com/api"
    
    # Get a fresh token
    register_data = {
        "email": "jwt.debug@test.fr",
        "password": "Test1234!",
        "name": "JWT Debug",
        "role": "melomane"
    }
    
    response = requests.post(f"{base_url}/auth/register", json=register_data, timeout=10)
    if response.status_code != 200:
        print(f"Registration failed: {response.text}")
        return
    
    data = response.json()
    token = data.get('token')
    print(f"Token: {token}")
    
    # Decode token manually
    JWT_SECRET = "jamconnexion_secret_key_2024_super_secure"  # From .env
    
    try:
        # Decode without verification first
        unverified = jwt.decode(token, options={"verify_signature": False})
        print(f"Unverified payload: {unverified}")
        
        # Decode with verification
        verified = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        print(f"Verified payload: {verified}")
        
        # Check expiration
        import datetime
        exp_timestamp = verified.get('exp')
        if exp_timestamp:
            exp_date = datetime.datetime.fromtimestamp(exp_timestamp)
            now = datetime.datetime.now()
            print(f"Token expires: {exp_date}")
            print(f"Current time: {now}")
            print(f"Token valid: {exp_date > now}")
        
    except Exception as e:
        print(f"JWT decode error: {e}")

if __name__ == "__main__":
    debug_jwt_token()