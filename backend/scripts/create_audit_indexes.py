"""
Create indexes for audit_logs collection
Run this script to optimize audit log queries
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def create_audit_indexes():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    print("Creating indexes for audit_logs collection...")
    
    # Index on user_id for user-specific queries
    await db.audit_logs.create_index("user_id")
    print("✅ Created index on user_id")
    
    # Index on timestamp for time-based queries (descending for recent logs)
    await db.audit_logs.create_index([("timestamp", -1)])
    print("✅ Created index on timestamp (descending)")
    
    # Compound index on user_id + timestamp
    await db.audit_logs.create_index([("user_id", 1), ("timestamp", -1)])
    print("✅ Created compound index on user_id + timestamp")
    
    # Index on action for filtering by action type
    await db.audit_logs.create_index("action")
    print("✅ Created index on action")
    
    # Index on resource_type for filtering by resource
    await db.audit_logs.create_index("resource_type")
    print("✅ Created index on resource_type")
    
    # Index on status for filtering failed/error actions
    await db.audit_logs.create_index("status")
    print("✅ Created index on status")
    
    # Compound index for common query patterns
    await db.audit_logs.create_index([
        ("user_role", 1),
        ("action", 1),
        ("timestamp", -1)
    ])
    print("✅ Created compound index on user_role + action + timestamp")
    
    print("\n🎉 All audit indexes created successfully!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_audit_indexes())
