#!/usr/bin/env python3
"""
Test script pour vérifier le système de badges et notifications push
"""
import asyncio
import sys
import os
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from utils.badge_checker import check_and_award_badges_internal

async def test_badge_system():
    """Test du système de badges"""
    try:
        # Connexion à MongoDB
        MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        DB_NAME = os.environ.get('DB_NAME', 'jamconnexion')
        
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        print("✅ Connecté à MongoDB")
        
        # Récupérer un utilisateur test
        user = await db.users.find_one({"email": "musician@gmail.com"}, {"_id": 0})
        if not user:
            print("❌ Utilisateur test non trouvé")
            return
        
        print(f"✅ Utilisateur trouvé: {user['email']} (ID: {user['id']})")
        
        # Vérifier les badges déjà débloqués
        existing_badges = await db.user_badges.find(
            {"user_id": user["id"]},
            {"_id": 0}
        ).to_list(100)
        
        print(f"📊 Badges actuellement débloqués: {len(existing_badges)}")
        
        # Vérifier l'éligibilité aux badges
        print("\n🔍 Vérification de l'éligibilité aux badges...")
        newly_unlocked = await check_and_award_badges_internal(db, user["id"])
        
        if newly_unlocked:
            print(f"\n🎉 {len(newly_unlocked)} nouveaux badges débloqués:")
            for badge in newly_unlocked:
                print(f"   - {badge['icon']} {badge['name']} ({badge['points']} pts)")
        else:
            print("\n✅ Aucun nouveau badge à débloquer")
        
        # Vérifier qu'une notification a été créée
        if newly_unlocked:
            recent_notifications = await db.notifications.find(
                {
                    "user_id": user["id"],
                    "type": "badge_unlocked"
                },
                {"_id": 0}
            ).sort("created_at", -1).limit(len(newly_unlocked)).to_list(100)
            
            print(f"\n📬 Notifications créées: {len(recent_notifications)}")
            
            # Vérifier les push subscriptions
            push_subs = await db.push_subscriptions.find(
                {"user_id": user["id"], "active": True},
                {"_id": 0}
            ).to_list(10)
            
            print(f"🔔 Abonnements push actifs: {len(push_subs)}")
        
        print("\n✅ Test terminé avec succès")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_badge_system())
