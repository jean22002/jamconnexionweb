"""
Script to clean test data before running backend tests
Removes test users, events, planning slots, etc.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "jamconnexion")

# Test emails to clean
TEST_EMAILS = [
    "test@example.com",
    "testmusician@example.com",
    "testvenue@example.com",
    "testmelomane@example.com",
    "musician_a@test.com",
    "musician_b@test.com",
    "musician2@test.com",
    "musician3@test.com",
    "venue_a@test.com",
    "venue_b@test.com",
    "melomane_a@test.com",
    "melomane@test.com",
    "bug@test.com",
    "bugfix@test.com",
    "musician@example.com",
    "venue@example.com",
    "test_musician@example.com",
    "test_venue@example.com",
    "bar@example.com",
    "rockers@example.com",
    "jazz@example.com"
]

async def clean_test_data():
    """Clean test data from database"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🧹 Cleaning test data...")
    
    # Clean users
    result = await db.users.delete_many({"email": {"$in": TEST_EMAILS}})
    print(f"   Deleted {result.deleted_count} test users")
    
    # Get test user IDs
    test_users = await db.users.find(
        {"email": {"$regex": "test|example", "$options": "i"}},
        {"_id": 0, "id": 1}
    ).to_list(100)
    test_user_ids = [u["id"] for u in test_users]
    
    if test_user_ids:
        # Clean profiles
        result = await db.musicians.delete_many({"user_id": {"$in": test_user_ids}})
        print(f"   Deleted {result.deleted_count} test musicians")
        
        result = await db.venues.delete_many({"user_id": {"$in": test_user_ids}})
        print(f"   Deleted {result.deleted_count} test venues")
        
        result = await db.melomanes.delete_many({"user_id": {"$in": test_user_ids}})
        print(f"   Deleted {result.deleted_count} test melomanes")
    
    # Clean test events (by date in future)
    result = await db.jam_events.delete_many({"date": {"$gte": "2026-01-01"}})
    print(f"   Deleted {result.deleted_count} test jam events")
    
    result = await db.concert_events.delete_many({"date": {"$gte": "2026-01-01"}})
    print(f"   Deleted {result.deleted_count} test concert events")
    
    result = await db.karaoke_events.delete_many({"date": {"$gte": "2026-01-01"}})
    print(f"   Deleted {result.deleted_count} test karaoke events")
    
    result = await db.spectacle_events.delete_many({"date": {"$gte": "2026-01-01"}})
    print(f"   Deleted {result.deleted_count} test spectacle events")
    
    # Clean test planning slots
    result = await db.planning_slots.delete_many({"date": {"$gte": "2026-01-01"}})
    print(f"   Deleted {result.deleted_count} test planning slots")
    
    # Clean test applications
    result = await db.concert_applications.delete_many({"created_at": {"$gte": "2026-01-01"}})
    print(f"   Deleted {result.deleted_count} test applications")
    
    print("✅ Test data cleaned successfully")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(clean_test_data())
