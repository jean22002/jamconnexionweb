#!/usr/bin/env python3
"""
MongoDB Index Creation Script for Jam Connexion - SAFE VERSION
Creates optimized indexes, skips existing ones
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'jamconnexion')

async def create_index_safe(collection, keys, name, unique=False):
    """Create index if it doesn't exist"""
    existing = await collection.index_information()
    if name in existing:
        print(f"  ℹ️  {name} (exists)")
        return False
    try:
        await collection.create_index(keys, name=name, unique=unique)
        print(f"  ✓ {name}" + (" [UNIQUE]" if unique else ""))
        return True
    except Exception as e:
        if "already exists" in str(e).lower():
            print(f"  ℹ️  {name} (exists)")
            return False
        raise

async def create_all_indexes():
    if not MONGO_URL:
        print("❌ MONGO_URL not set")
        sys.exit(1)
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        print(f"🔗 Database: {DB_NAME}\n")
        created = 0
        
        # FRIENDS
        print("📁 friends")
        created += await create_index_safe(db.friends, [("to_user_id", 1), ("status", 1)], "idx_friends_to_status")
        created += await create_index_safe(db.friends, [("from_user_id", 1), ("status", 1)], "idx_friends_from_status")
        created += await create_index_safe(db.friends, [("from_user_id", 1)], "idx_friends_from")
        created += await create_index_safe(db.friends, [("to_user_id", 1)], "idx_friends_to")
        
        # EVENT_PARTICIPATIONS
        print("\n📁 event_participations")
        created += await create_index_safe(db.event_participations, [("event_id", 1), ("event_type", 1), ("active", 1)], "idx_part_event_type_active")
        created += await create_index_safe(db.event_participations, [("user_id", 1), ("active", 1)], "idx_part_user_active")
        
        # VENUE_SUBSCRIPTIONS
        print("\n📁 venue_subscriptions")
        created += await create_index_safe(db.venue_subscriptions, [("subscriber_id", 1)], "idx_subs_subscriber")
        created += await create_index_safe(db.venue_subscriptions, [("venue_id", 1)], "idx_subs_venue")
        
        # USERS
        print("\n📁 users")
        created += await create_index_safe(db.users, [("id", 1)], "idx_users_id", unique=True)
        
        # MUSICIANS
        print("\n📁 musicians")
        created += await create_index_safe(db.musicians, [("id", 1)], "idx_musicians_id_new", unique=True)
        created += await create_index_safe(db.musicians, [("city", 1), ("instruments", 1)], "idx_musicians_city_instr")
        
        # VENUES
        print("\n📁 venues")
        created += await create_index_safe(db.venues, [("id", 1)], "idx_venues_id_new", unique=True)
        created += await create_index_safe(db.venues, [("city", 1)], "idx_venues_city")
        
        # MELOMANES
        print("\n📁 melomanes")
        created += await create_index_safe(db.melomanes, [("id", 1)], "idx_melomanes_id_new", unique=True)
        
        # EVENTS
        print("\n📁 events")
        created += await create_index_safe(db.jams, [("venue_id", 1), ("date", 1)], "idx_jams_venue_date")
        created += await create_index_safe(db.concerts, [("venue_id", 1), ("date", 1)], "idx_concerts_venue_date")
        created += await create_index_safe(db.karaoke, [("venue_id", 1), ("date", 1)], "idx_karaoke_venue_date")
        created += await create_index_safe(db.spectacle, [("venue_id", 1), ("date", 1)], "idx_spectacle_venue_date")
        
        # BANDS
        print("\n📁 bands")
        created += await create_index_safe(db.bands, [("owner_id", 1)], "idx_bands_owner")
        
        # NOTIFICATIONS
        print("\n📁 notifications")
        created += await create_index_safe(db.notifications, [("user_id", 1), ("created_at", -1)], "idx_notif_user_created")
        created += await create_index_safe(db.notifications, [("user_id", 1), ("read", 1)], "idx_notif_user_read")
        
        print("\n" + "="*50)
        print(f"✅ DONE! {created} new indexes created")
        print("="*50)
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        client.close()

if __name__ == "__main__":
    print("="*50)
    print("  MongoDB Index Creation")
    print("="*50 + "\n")
    asyncio.run(create_all_indexes())
