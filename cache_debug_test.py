#!/usr/bin/env python3
"""
Cache Headers Debug Test - Check why cache headers are being overridden
"""

import requests

BACKEND_URL = "https://musician-calendar-1.preview.emergentagent.com/api"

def test_cache_headers():
    print("🔍 Testing Cache Headers - Debug Mode")
    
    # Test without authorization header
    print("\n1. Testing /api/venues WITHOUT Authorization header:")
    response = requests.get(f"{BACKEND_URL}/venues", timeout=30)
    cache_control = response.headers.get('Cache-Control', 'Not Set')
    print(f"   Status: {response.status_code}")
    print(f"   Cache-Control: {cache_control}")
    print(f"   All headers: {dict(response.headers)}")
    
    # Test with authorization header (simulate authenticated request)
    print("\n2. Testing /api/venues WITH Authorization header:")
    headers = {"Authorization": "Bearer fake-token"}
    response = requests.get(f"{BACKEND_URL}/venues", headers=headers, timeout=30)
    cache_control = response.headers.get('Cache-Control', 'Not Set')
    print(f"   Status: {response.status_code}")
    print(f"   Cache-Control: {cache_control}")
    
    # Test health endpoint
    print("\n3. Testing /health endpoint:")
    response = requests.get("https://musician-calendar-1.preview.emergentagent.com/health", timeout=30)
    cache_control = response.headers.get('Cache-Control', 'Not Set')
    print(f"   Status: {response.status_code}")
    print(f"   Cache-Control: {cache_control}")
    
    # Test login endpoint (POST - should be no-store)
    print("\n4. Testing POST /api/auth/login:")
    response = requests.post(f"{BACKEND_URL}/auth/login", 
                           json={"email": "test@invalid.com", "password": "wrong"}, 
                           timeout=30)
    cache_control = response.headers.get('Cache-Control', 'Not Set')
    print(f"   Status: {response.status_code}")
    print(f"   Cache-Control: {cache_control}")

if __name__ == "__main__":
    test_cache_headers()