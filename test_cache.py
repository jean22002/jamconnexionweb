"""
Test script to verify cache headers middleware
"""
import asyncio
import httpx

async def test_cache_headers():
    base_url = "https://band-invites-hub.preview.emergentagent.com"
    
    test_cases = [
        ("/api/venues", "GET", "Should have public cache (300s)"),
        ("/api/auth/login", "POST", "Should have no-store"),
        ("/health", "GET", "Should have default cache"),
    ]
    
    async with httpx.AsyncClient() as client:
        for path, method, expected in test_cases:
            try:
                if method == "GET":
                    response = await client.get(f"{base_url}{path}")
                else:
                    response = await client.post(
                        f"{base_url}{path}",
                        json={"email": "test@test.com", "password": "test"}
                    )
                
                cache_control = response.headers.get("cache-control", "NOT SET")
                print(f"\n{method} {path}")
                print(f"Expected: {expected}")
                print(f"Got: {cache_control}")
                print(f"Status: {response.status_code}")
                
            except Exception as e:
                print(f"\nError testing {path}: {e}")

if __name__ == "__main__":
    asyncio.run(test_cache_headers())
