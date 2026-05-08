"""
Script pour vérifier la structure des venues dans MongoDB
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def check_venues():
    mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGO_URL_PRODUCTION')
    db_name = os.environ.get('DB_NAME', 'test_database').strip('"')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"🔌 Connexion à: {db_name}")
    print("\n📊 Analyse des établissements...")
    
    venues_cursor = db.venues.find({}, {"_id": 0})
    venues = await venues_cursor.to_list(100)
    
    print(f"\n✅ {len(venues)} établissement(s) trouvé(s)\n")
    
    for idx, venue in enumerate(venues, 1):
        print(f"--- Établissement {idx} ---")
        print(f"  Nom: {venue.get('name', 'N/A')}")
        print(f"  ID: {venue.get('id', 'N/A')}")
        print(f"  User ID: {venue.get('user_id', 'N/A')}")
        
        jams = venue.get('jams', [])
        concerts = venue.get('concerts', [])
        karaokes = venue.get('karaokes', [])
        spectacles = venue.get('spectacles', [])
        
        total_events = len(jams) + len(concerts) + len(karaokes) + len(spectacles)
        
        print(f"  📅 Événements:")
        print(f"     - Jams: {len(jams)}")
        print(f"     - Concerts: {len(concerts)}")
        print(f"     - Karaokés: {len(karaokes)}")
        print(f"     - Spectacles: {len(spectacles)}")
        print(f"     - TOTAL: {total_events}")
        
        if jams:
            print(f"\n  🎵 Premier Jam (exemple):")
            print(f"     {json.dumps(jams[0], indent=6, ensure_ascii=False)[:500]}...")
        
        if concerts:
            print(f"\n  🎸 Premier Concert (exemple):")
            print(f"     {json.dumps(concerts[0], indent=6, ensure_ascii=False)[:500]}...")
        
        print()
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_venues())
