#!/usr/bin/env python3
"""
Show all MongoDB indexes for Jam Connexion
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'jamconnexion')

async def show_all_indexes():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        collections = [
            'friends', 'event_participations', 'venue_subscriptions',
            'users', 'musicians', 'venues', 'melomanes',
            'jams', 'concerts', 'karaoke', 'spectacle',
            'bands', 'notifications'
        ]
        
        print("="*70)
        print(f"  MongoDB Indexes Overview - {DB_NAME}")
        print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*70 + "\n")
        
        total_custom = 0
        
        for coll_name in collections:
            indexes = await db[coll_name].index_information()
            custom_indexes = {k: v for k, v in indexes.items() if k != '_id_'}
            
            if custom_indexes:
                print(f"📁 {coll_name} ({len(custom_indexes)} custom indexes)")
                for idx_name, idx_info in custom_indexes.items():
                    keys = ', '.join([f"{k}: {v}" for k, v in idx_info['key']])
                    unique = " [UNIQUE]" if idx_info.get('unique') else ""
                    print(f"  ✓ {idx_name}{unique}")
                    print(f"    Keys: {keys}")
                print()
                total_custom += len(custom_indexes)
        
        print("="*70)
        print(f"📊 TOTAL: {total_custom} custom indexes across {len([c for c in collections if await db[c].index_information()])} collections")
        print("="*70)
        
        # Performance recommendations
        print("\n💡 Performance Tips:")
        print("  • These indexes optimize $lookup aggregations")
        print("  • Compound indexes (A, B) also cover queries on just A")
        print("  • Monitor slow queries: db.setProfilingLevel(1, { slowms: 100 })")
        print("  • Check index usage: db.collection.aggregate([{$indexStats: {}}])")
        
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(show_all_indexes())
