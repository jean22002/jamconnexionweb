"""
Script pour générer automatiquement des codes d'invitation 
pour tous les groupes existants qui n'en ont pas encore
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import uuid
import string
import secrets  # Use secrets instead of random for secure tokens

def generate_invite_code() -> str:
    """Génère un code d'invitation unique de 6 caractères (cryptographiquement sécurisé)"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(6))

async def generate_codes_for_existing_bands():
    mongo_url = 'mongodb+srv://jean_jamconnexion:marcel22021983@customer-apps.xtch2ol.mongodb.net/test_database?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(mongo_url)
    db = client['test_database']
    
    print("🔍 Récupération de tous les groupes...")
    bands = await db.bands.find({}, {"_id": 0}).to_list(1000)
    print(f"   Trouvé {len(bands)} groupes")
    
    codes_created = 0
    codes_existing = 0
    
    for band in bands:
        band_id = band.get("id")
        if not band_id:
            continue
        
        # Vérifier si un code existe déjà
        existing_code = await db.band_invite_codes.find_one(
            {"band_id": band_id, "is_active": True},
            {"_id": 0}
        )
        
        if existing_code:
            print(f"   ✓ Code déjà existant pour '{band.get('name')}': {existing_code.get('code')}")
            codes_existing += 1
            continue
        
        # Générer un code unique
        code = generate_invite_code()
        while await db.band_invite_codes.find_one({"code": code, "is_active": True}):
            code = generate_invite_code()
        
        # Créer le code d'invitation
        invite_code = {
            "id": str(uuid.uuid4()),
            "band_id": band_id,
            "code": code,
            "created_by": band.get("leader_id", "system"),
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "is_active": True,
            "used_by": []
        }
        
        await db.band_invite_codes.insert_one(invite_code)
        print(f"   ✅ Code créé pour '{band.get('name')}': {code}")
        codes_created += 1
    
    client.close()
    
    print(f"\n📊 Résumé:")
    print(f"   - Codes créés: {codes_created}")
    print(f"   - Codes déjà existants: {codes_existing}")
    print(f"   - Total: {codes_created + codes_existing}")
    print("\n✅ Migration terminée!")

if __name__ == "__main__":
    asyncio.run(generate_codes_for_existing_bands())
