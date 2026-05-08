"""
Trouver le venue de bar@gmail.com et vérifier ses événements
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def find_bar_venue():
    mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGO_URL_PRODUCTION')
    db_name = os.environ.get('DB_NAME', 'test_database').strip('"')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Trouver l'utilisateur bar@gmail.com
    user = await db.users.find_one({"email": "bar@gmail.com"}, {"_id": 0})
    
    if not user:
        print("❌ Utilisateur bar@gmail.com non trouvé")
        return
    
    print(f"✅ Utilisateur trouvé:")
    print(f"   Email: {user.get('email')}")
    print(f"   ID: {user.get('id')}")
    print(f"   Role: {user.get('role')}")
    
    # Trouver le venue correspondant
    venue = await db.venues.find_one({"user_id": user.get('id')}, {"_id": 0})
    
    if not venue:
        print(f"\n❌ Aucun établissement trouvé pour user_id {user.get('id')}")
        return
    
    print(f"\n✅ Établissement trouvé:")
    print(f"   Nom: {venue.get('name')}")
    print(f"   ID Venue: {venue.get('id')}")
    
    jams = venue.get('jams', [])
    concerts = venue.get('concerts', [])
    karaokes = venue.get('karaokes', [])
    spectacles = venue.get('spectacles', [])
    
    print(f"\n📅 Événements:")
    print(f"   - Jams: {len(jams)}")
    print(f"   - Concerts: {len(concerts)}")
    print(f"   - Karaokés: {len(karaokes)}")
    print(f"   - Spectacles: {len(spectacles)}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(find_bar_venue())
