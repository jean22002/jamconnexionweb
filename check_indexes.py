#!/usr/bin/env python3
"""
MongoDB Index Verification Script
Checks if required indexes exist for optimal performance
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def check_indexes():
    """Check and create necessary indexes"""
    
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    if not mongo_url or not db_name:
        print("❌ MongoDB configuration not found in environment")
        return
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("="*70)
    print("🔍 MONGODB INDEX VERIFICATION")
    print("="*70)
    
    # Check musicians collection
    print("\n📊 Checking 'musicians' collection...")
    musicians_indexes = await db.musicians.index_information()
    print(f"   Existing indexes: {list(musicians_indexes.keys())}")
    
    # Check if created_at index exists
    created_at_exists = any('created_at' in str(idx) for idx in musicians_indexes.values())
    
    if created_at_exists:
        print("   ✅ 'created_at' index found")
    else:
        print("   ⚠️  'created_at' index NOT found - Creating...")
        try:
            await db.musicians.create_index([("created_at", -1)])
            print("   ✅ Created 'created_at' index successfully")
        except Exception as e:
            print(f"   ❌ Error creating index: {e}")
    
    # Check venues collection
    print("\n📊 Checking 'venues' collection...")
    venues_indexes = await db.venues.index_information()
    print(f"   Existing indexes: {list(venues_indexes.keys())}")
    
    created_at_exists = any('created_at' in str(idx) for idx in venues_indexes.values())
    
    if created_at_exists:
        print("   ✅ 'created_at' index found")
    else:
        print("   ⚠️  'created_at' index NOT found - Creating...")
        try:
            await db.venues.create_index([("created_at", -1)])
            print("   ✅ Created 'created_at' index successfully")
        except Exception as e:
            print(f"   ❌ Error creating index: {e}")
    
    # Check other important indexes
    print("\n📊 Checking other important indexes...")
    
    # Check user_id index on musicians
    user_id_exists = any('user_id' in str(idx) for idx in musicians_indexes.values())
    if user_id_exists:
        print("   ✅ Musicians 'user_id' index found")
    else:
        print("   ⚠️  Musicians 'user_id' index recommended for JOIN operations")
    
    # Check user_id index on venues
    user_id_exists = any('user_id' in str(idx) for idx in venues_indexes.values())
    if user_id_exists:
        print("   ✅ Venues 'user_id' index found")
    else:
        print("   ⚠️  Venues 'user_id' index recommended for JOIN operations")
    
    print("\n" + "="*70)
    print("✅ INDEX VERIFICATION COMPLETE")
    print("="*70)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_indexes())
