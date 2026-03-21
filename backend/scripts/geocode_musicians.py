#!/usr/bin/env python3
"""
Script to retroactively geocode all musicians with city/postal_code but no GPS coordinates
"""

import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient

# Add parent directory to path to import geocode module
sys.path.insert(0, '/app/backend')

async def geocode_musicians():
    """Geocode all musicians that have city but no coordinates"""
    
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    if not mongo_url or not db_name:
        print("❌ MongoDB configuration not found")
        return
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("="*70)
    print("🗺️  GEOCODING MUSICIANS")
    print("="*70)
    
    # Find musicians without GPS coordinates but with city
    musicians = await db.musicians.find({
        "city": {"$exists": True, "$ne": None, "$ne": ""},
        "$or": [
            {"latitude": {"$exists": False}},
            {"latitude": None},
            {"latitude": 0},
            {"longitude": {"$exists": False}},
            {"longitude": None},
            {"longitude": 0}
        ]
    }, {"_id": 0}).to_list(1000)
    
    print(f"\nℹ️  Found {len(musicians)} musicians to geocode\n")
    
    if len(musicians) == 0:
        print("✅ All musicians are already geocoded!")
        client.close()
        return
    
    # Import geocode function
    try:
        from routes.geocode import geocode_address
    except ImportError:
        print("❌ Could not import geocode function")
        client.close()
        return
    
    geocoded_count = 0
    failed_count = 0
    skipped_count = 0
    
    for musician in musicians:
        pseudo = musician.get("pseudo", "Unknown")
        city = musician.get("city")
        postal_code = musician.get("postal_code")
        
        if not city:
            print(f"⚠️  Skipped {pseudo}: No city")
            skipped_count += 1
            continue
        
        try:
            # Try to geocode
            result = await geocode_address(city=city, postal_code=postal_code)
            
            if result and result.get("latitude") and result.get("longitude"):
                # Update musician with coordinates
                await db.musicians.update_one(
                    {"id": musician["id"]},
                    {"$set": {
                        "latitude": result["latitude"],
                        "longitude": result["longitude"],
                        "department": result.get("department") or musician.get("department"),
                        "region": result.get("region") or musician.get("region")
                    }}
                )
                print(f"✅ Geocoded {pseudo}: {city} → ({result['latitude']:.4f}, {result['longitude']:.4f})")
                geocoded_count += 1
            else:
                print(f"❌ Failed {pseudo}: {city} (no result)")
                failed_count += 1
        
        except Exception as e:
            print(f"❌ Error geocoding {pseudo} ({city}): {e}")
            failed_count += 1
    
    print("\n" + "="*70)
    print("📊 GEOCODING SUMMARY")
    print("="*70)
    print(f"✅ Successfully geocoded: {geocoded_count}")
    print(f"❌ Failed: {failed_count}")
    print(f"⚠️  Skipped (no city): {skipped_count}")
    print(f"📍 Total: {len(musicians)}")
    print("="*70)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(geocode_musicians())
