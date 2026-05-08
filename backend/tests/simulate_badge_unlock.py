#!/usr/bin/env python3
"""
Script pour simuler le déblocage d'un badge en créant une participation à un événement
"""
import asyncio
import sys
import os
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid

async def simulate_event_participation():
    """Créer une participation à un événement pour tester les badges"""
    try:
        # Connexion à MongoDB
        MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        DB_NAME = os.environ.get('DB_NAME', 'jamconnexion')
        
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        print("✅ Connecté à MongoDB")
        
        # Récupérer l'utilisateur musicien test
        musician_user = await db.users.find_one({"email": "musician@gmail.com"}, {"_id": 0})
        if not musician_user:
            print("❌ Utilisateur musicien non trouvé")
            return
        
        print(f"✅ Musicien trouvé: {musician_user['email']}")
        
        # Récupérer un événement existant ou en créer un fictif
        event = await db.jams.find_one({}, {"_id": 0})
        
        if not event:
            print("⚠️ Aucun événement trouvé, création d'un événement fictif...")
            # Créer un événement fictif
            venue = await db.venues.find_one({}, {"_id": 0})
            if not venue:
                print("❌ Aucun établissement trouvé")
                return
            
            event_id = str(uuid.uuid4())
            event_doc = {
                "id": event_id,
                "venue_id": venue["id"],
                "title": "Test Event for Badges",
                "date": datetime.now(timezone.utc).isoformat(),
                "status": "scheduled",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.jams.insert_one(event_doc)
            event = event_doc
            print(f"✅ Événement créé: {event_id}")
        
        # Vérifier si une participation existe déjà
        existing_participation = await db.event_participations.find_one({
            "participant_id": musician_user["id"],
            "participant_type": "musician"
        }, {"_id": 0})
        
        if existing_participation:
            print(f"✅ Participation existante trouvée")
        else:
            # Créer une participation
            participation_doc = {
                "id": str(uuid.uuid4()),
                "event_id": event["id"],
                "participant_id": musician_user["id"],
                "participant_type": "musician",
                "venue_id": event.get("venue_id"),
                "status": "accepted",
                "active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.event_participations.insert_one(participation_doc)
            print(f"✅ Participation créée pour tester le badge")
        
        # Maintenant vérifier les badges
        from utils.badge_checker import check_and_award_badges_internal
        
        print("\n🔍 Vérification des badges...")
        newly_unlocked = await check_and_award_badges_internal(db, musician_user["id"])
        
        if newly_unlocked:
            print(f"\n🎉 {len(newly_unlocked)} badge(s) débloqué(s):")
            for badge in newly_unlocked:
                print(f"   - {badge['icon']} {badge['name']} - {badge['unlock_message']}")
                print(f"     Points: {badge['points']} | Tier: {badge['tier']}")
        else:
            print("\n✅ Tous les badges éligibles sont déjà débloqués")
        
        # Vérifier le total de badges
        total_badges = await db.user_badges.count_documents({"user_id": musician_user["id"]})
        print(f"\n📊 Total de badges débloqués: {total_badges}")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(simulate_event_participation())
