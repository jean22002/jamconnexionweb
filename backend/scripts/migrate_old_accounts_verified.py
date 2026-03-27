"""
Script pour marquer tous les anciens comptes (avant vérification d'email) comme vérifiés
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def migrate_old_accounts():
    mongo_url = 'mongodb+srv://jean_jamconnexion:marcel22021983@customer-apps.xtch2ol.mongodb.net/test_database?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(mongo_url)
    db = client['test_database']
    
    print("🔍 Recherche des comptes sans vérification d'email...")
    
    # Trouver tous les comptes où email_verified est null ou n'existe pas
    result = await db.users.update_many(
        {
            "$or": [
                {"email_verified": None},
                {"email_verified": {"$exists": False}}
            ]
        },
        {
            "$set": {"email_verified": True}
        }
    )
    
    print(f"✅ {result.modified_count} compte(s) marqué(s) comme vérifié(s)")
    print(f"   (Anciens comptes créés avant la mise en place de la vérification)")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_old_accounts())
