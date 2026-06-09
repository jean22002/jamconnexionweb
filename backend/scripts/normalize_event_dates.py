"""
Script de normalisation des dates d'événement au format YYYY-MM-DD strict.

Idempotent : tronque toute date contenant 'T' à ses 10 premiers caractères.
Couvre les collections concert/jam/slot/karaoke/spectacle/application.

Usage:
    cd /app/backend && python3 scripts/normalize_event_dates.py
"""
import asyncio
import os
import sys
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient


COLLECTIONS = {
    'planning_slots': ['date'],
    'concerts': ['date'],
    'jams': ['date'],
    'karaoke_events': ['date'],
    'spectacle_events': ['date'],
    'applications': ['slot_date'],
}


async def main():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]

    total_updated = 0
    for coll_name, fields in COLLECTIONS.items():
        coll = db[coll_name]
        updated_per_coll = 0
        for field in fields:
            # On cherche les docs où la valeur contient 'T' (ISO datetime)
            cursor = coll.find({field: {'$regex': 'T'}}, {'_id': 1, field: 1})
            async for doc in cursor:
                raw = doc.get(field)
                if isinstance(raw, str) and len(raw) >= 10:
                    new_val = raw[:10]
                    if new_val != raw:
                        await coll.update_one({'_id': doc['_id']}, {'$set': {field: new_val}})
                        updated_per_coll += 1
        if updated_per_coll:
            print(f"  ✅ {coll_name}: {updated_per_coll} doc(s) normalisé(s)")
        total_updated += updated_per_coll

    print()
    print(f"=== Total : {total_updated} document(s) normalisé(s) ===")
    if total_updated == 0:
        print("  (toutes les dates étaient déjà au format YYYY-MM-DD)")


if __name__ == "__main__":
    asyncio.run(main())
