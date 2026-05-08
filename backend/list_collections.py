"""
Lister toutes les collections et chercher les événements
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def list_collections():
    mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGO_URL_PRODUCTION')
    db_name = os.environ.get('DB_NAME', 'test_database').strip('"')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("📋 Collections dans la base de données:")
    collections = await db.list_collection_names()
    
    for coll in sorted(collections):
        count = await db[coll].count_documents({})
        print(f"   - {coll}: {count} documents")
    
    # Chercher des jams
    print("\n🎵 Recherche de jams...")
    jams = await db.jams.find({"venue_id": "venue-1771535930121"}, {"_id": 0}).limit(2).to_list(2)
    print(f"   Trouvé {len(jams)} jams pour venue-1771535930121")
    if jams:
        print(f"   Premier jam: {jams[0]}")
    
    # Chercher des concerts
    print("\n🎸 Recherche de concerts...")
    concerts = await db.concerts.find({"venue_id": "venue-1771535930121"}, {"_id": 0}).limit(2).to_list(2)
    print(f"   Trouvé {len(concerts)} concerts pour venue-1771535930121")
    if concerts:
        print(f"   Premier concert: {concerts[0]}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(list_collections())
