#!/usr/bin/env python3
"""
MongoDB Index Creation Script for Jam Connexion
Creates optimized indexes to maximize performance of N+1 optimizations

Run this script once to create all necessary indexes for:
- Friends endpoints (requests, list, sent)
- Event participations (jams, concerts, karaoke, spectacles)
- Venue subscriptions
- User lookups
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'jamconnexion')

async def create_index_safe(collection, keys, name, unique=False):
    """Create index if it doesn't exist, or skip if already exists"""
    existing_indexes = await collection.index_information()
    
    if name in existing_indexes:
        print(f"  ℹ️  Skipped: {name} (already exists)")
        return False
    else:
        try:
            await collection.create_index(keys, name=name, unique=unique)
            suffix = " - UNIQUE" if unique else ""
            print(f"  ✓ Created: {name}{suffix}")
            return True
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                print(f"  ℹ️  Skipped: {name} (conflict with existing index)")
                return False
            else:
                raise

async def create_indexes():
    """Create all necessary indexes for optimized queries"""
    
    if not MONGO_URL:
        print("❌ ERROR: MONGO_URL environment variable not set")
        sys.exit(1)
    
    print(f"🔗 Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        print(f"📊 Database: {DB_NAME}\n")
        
        # ========================================
        # FRIENDS COLLECTION
        # ========================================
        print("📁 Collection: friends")
        
        # Index for incoming friend requests (/api/friends/requests)
        await db.friends.create_index(
            [("to_user_id", 1), ("status", 1)],
            name="idx_friends_to_user_status"
        )
        print("  ✓ Created: idx_friends_to_user_status (to_user_id + status)")
        
        # Index for sent friend requests (/api/friends/sent)
        await db.friends.create_index(
            [("from_user_id", 1), ("status", 1)],
            name="idx_friends_from_user_status"
        )
        print("  ✓ Created: idx_friends_from_user_status (from_user_id + status)")
        
        # Index for friends list - bidirectional queries (/api/friends)
        await db.friends.create_index(
            [("from_user_id", 1)],
            name="idx_friends_from_user"
        )
        print("  ✓ Created: idx_friends_from_user (from_user_id)")
        
        await db.friends.create_index(
            [("to_user_id", 1)],
            name="idx_friends_to_user"
        )
        print("  ✓ Created: idx_friends_to_user (to_user_id)")
        
        # ========================================
        # EVENT_PARTICIPATIONS COLLECTION
        # ========================================
        print("\n📁 Collection: event_participations")
        
        # Compound index for participants count aggregations
        await db.event_participations.create_index(
            [("event_id", 1), ("event_type", 1), ("active", 1)],
            name="idx_participations_event_type_active"
        )
        print("  ✓ Created: idx_participations_event_type_active (event_id + event_type + active)")
        
        # Index for user's participations
        await db.event_participations.create_index(
            [("user_id", 1), ("active", 1)],
            name="idx_participations_user_active"
        )
        print("  ✓ Created: idx_participations_user_active (user_id + active)")
        
        # ========================================
        # VENUE_SUBSCRIPTIONS COLLECTION
        # ========================================
        print("\n📁 Collection: venue_subscriptions")
        
        # Index for user's subscriptions (/api/my-subscriptions)
        await db.venue_subscriptions.create_index(
            [("subscriber_id", 1)],
            name="idx_subscriptions_subscriber"
        )
        print("  ✓ Created: idx_subscriptions_subscriber (subscriber_id)")
        
        # Index for venue's subscribers
        await db.venue_subscriptions.create_index(
            [("venue_id", 1)],
            name="idx_subscriptions_venue"
        )
        print("  ✓ Created: idx_subscriptions_venue (venue_id)")
        
        # ========================================
        # USERS COLLECTION (for $lookup)
        # ========================================
        print("\n📁 Collection: users")
        
        # Index for user lookups by ID
        await db.users.create_index(
            [("id", 1)],
            name="idx_users_id",
            unique=True
        )
        print("  ✓ Created: idx_users_id (id) - UNIQUE")
        
        # Index for email lookups (login)
        existing_indexes = await db.users.index_information()
        if "idx_users_email" not in existing_indexes:
            await db.users.create_index(
                [("email", 1)],
                name="idx_users_email",
                unique=True
            )
            print("  ✓ Created: idx_users_email (email) - UNIQUE")
        else:
            print("  ℹ️  Skipped: idx_users_email (already exists)")
        
        # ========================================
        # MUSICIANS COLLECTION (for $lookup)
        # ========================================
        print("\n📁 Collection: musicians")
        
        # Index for lookups by user_id
        await db.musicians.create_index(
            [("user_id", 1)],
            name="idx_musicians_user_id"
        )
        print("  ✓ Created: idx_musicians_user_id (user_id)")
        
        # Index for musician profile lookups
        await db.musicians.create_index(
            [("id", 1)],
            name="idx_musicians_id",
            unique=True
        )
        print("  ✓ Created: idx_musicians_id (id) - UNIQUE")
        
        # Index for search by city and instruments
        await db.musicians.create_index(
            [("city", 1), ("instruments", 1)],
            name="idx_musicians_city_instruments"
        )
        print("  ✓ Created: idx_musicians_city_instruments (city + instruments)")
        
        # ========================================
        # VENUES COLLECTION (for $lookup)
        # ========================================
        print("\n📁 Collection: venues")
        
        # Index for lookups by user_id
        await db.venues.create_index(
            [("user_id", 1)],
            name="idx_venues_user_id"
        )
        print("  ✓ Created: idx_venues_user_id (user_id)")
        
        # Index for venue profile lookups
        await db.venues.create_index(
            [("id", 1)],
            name="idx_venues_id",
            unique=True
        )
        print("  ✓ Created: idx_venues_id (id) - UNIQUE")
        
        # Index for search by city
        await db.venues.create_index(
            [("city", 1)],
            name="idx_venues_city"
        )
        print("  ✓ Created: idx_venues_city (city)")
        
        # ========================================
        # MELOMANES COLLECTION (for $lookup)
        # ========================================
        print("\n📁 Collection: melomanes")
        
        # Index for lookups by user_id
        await db.melomanes.create_index(
            [("user_id", 1)],
            name="idx_melomanes_user_id"
        )
        print("  ✓ Created: idx_melomanes_user_id (user_id)")
        
        # Index for melomane profile lookups
        await db.melomanes.create_index(
            [("id", 1)],
            name="idx_melomanes_id",
            unique=True
        )
        print("  ✓ Created: idx_melomanes_id (id) - UNIQUE")
        
        # ========================================
        # EVENTS COLLECTIONS
        # ========================================
        print("\n📁 Collection: jams")
        await db.jams.create_index(
            [("venue_id", 1), ("date", 1)],
            name="idx_jams_venue_date"
        )
        print("  ✓ Created: idx_jams_venue_date (venue_id + date)")
        
        print("\n📁 Collection: concerts")
        await db.concerts.create_index(
            [("venue_id", 1), ("date", 1)],
            name="idx_concerts_venue_date"
        )
        print("  ✓ Created: idx_concerts_venue_date (venue_id + date)")
        
        print("\n📁 Collection: karaoke")
        await db.karaoke.create_index(
            [("venue_id", 1), ("date", 1)],
            name="idx_karaoke_venue_date"
        )
        print("  ✓ Created: idx_karaoke_venue_date (venue_id + date)")
        
        print("\n📁 Collection: spectacle")
        await db.spectacle.create_index(
            [("venue_id", 1), ("date", 1)],
            name="idx_spectacle_venue_date"
        )
        print("  ✓ Created: idx_spectacle_venue_date (venue_id + date)")
        
        # ========================================
        # BANDS COLLECTION
        # ========================================
        print("\n📁 Collection: bands")
        await db.bands.create_index(
            [("owner_id", 1)],
            name="idx_bands_owner"
        )
        print("  ✓ Created: idx_bands_owner (owner_id)")
        
        # ========================================
        # NOTIFICATIONS COLLECTION
        # ========================================
        print("\n📁 Collection: notifications")
        await db.notifications.create_index(
            [("user_id", 1), ("created_at", -1)],
            name="idx_notifications_user_created"
        )
        print("  ✓ Created: idx_notifications_user_created (user_id + created_at DESC)")
        
        await db.notifications.create_index(
            [("user_id", 1), ("read", 1)],
            name="idx_notifications_user_read"
        )
        print("  ✓ Created: idx_notifications_user_read (user_id + read)")
        
        print("\n" + "="*60)
        print("✅ ALL INDEXES CREATED SUCCESSFULLY!")
        print("="*60)
        
        # Display index statistics
        print("\n📊 INDEX STATISTICS:\n")
        collections = [
            'friends', 'event_participations', 'venue_subscriptions',
            'users', 'musicians', 'venues', 'melomanes',
            'jams', 'concerts', 'karaoke', 'spectacle',
            'bands', 'notifications'
        ]
        
        total_indexes = 0
        for coll_name in collections:
            indexes = await db[coll_name].index_information()
            count = len(indexes) - 1  # Exclude default _id index
            total_indexes += count
            print(f"  {coll_name}: {count} custom indexes")
        
        print(f"\n  📈 TOTAL CUSTOM INDEXES: {total_indexes}")
        
        print("\n🚀 Performance Tips:")
        print("  • Run explain() on queries to verify index usage")
        print("  • Monitor index size with db.collection.stats()")
        print("  • Rebuild indexes periodically: db.collection.reIndex()")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        client.close()
        print("\n🔌 Connection closed")

if __name__ == "__main__":
    print("=" * 60)
    print("  MongoDB Index Creation for Jam Connexion")
    print("  Optimizing N+1 Query Performance")
    print("=" * 60 + "\n")
    
    asyncio.run(create_indexes())
