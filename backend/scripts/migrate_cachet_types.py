#!/usr/bin/env python3
"""
Script de migration pour ajouter le champ cachet_type aux concerts GUSO existants

Logique officielle intermittence France Travail:
- Cachet isolé = 12 heures
- Cachet groupé = 8 heures

Ce script permet de:
1. Voir tous les concerts GUSO sans cachet_type
2. Définir le cachet_type pour un concert spécifique
3. Migration automatique basée sur guso_hours (si 12h -> isolé, si 8h -> groupé)
"""

import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient

# Configuration MongoDB
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = "jamconnect"


async def list_concerts_without_cachet_type():
    """Liste tous les concerts GUSO sans cachet_type défini"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("\n" + "="*80)
    print("🔍 CONCERTS GUSO SANS TYPE DE CACHET")
    print("="*80 + "\n")
    
    musicians = await db.musicians.find({
        "concerts.is_guso": True
    }, {"_id": 0, "pseudo": 1, "user_id": 1, "concerts": 1}).to_list(None)
    
    total_count = 0
    for musician in musicians:
        concerts_without_type = [
            c for c in musician.get("concerts", [])
            if c.get("is_guso") and not c.get("cachet_type")
        ]
        
        if concerts_without_type:
            print(f"👤 Musicien: {musician.get('pseudo', 'N/A')}")
            print(f"   User ID: {musician['user_id']}\n")
            
            for concert in concerts_without_type:
                total_count += 1
                print(f"   📅 {concert.get('date', 'N/A')} - {concert.get('venue_name', 'N/A')}")
                print(f"      ID: {concert.get('id')}")
                print(f"      Heures actuelles: {concert.get('guso_hours', 'N/A')}h")
                print(f"      Cachet: {concert.get('cachet', 'N/A')}€")
                print()
    
    if total_count == 0:
        print("✅ Aucun concert GUSO sans cachet_type trouvé\n")
    else:
        print(f"📊 Total: {total_count} concerts sans type de cachet\n")
    
    client.close()
    return total_count


async def auto_migrate_from_hours():
    """
    Migration automatique basée sur les heures existantes:
    - 12h -> isolé
    - 8h -> groupé
    - Autres -> laissé vide (nécessite intervention manuelle)
    """
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("\n" + "="*80)
    print("🔄 MIGRATION AUTOMATIQUE")
    print("="*80 + "\n")
    
    musicians = await db.musicians.find({
        "concerts.is_guso": True
    }).to_list(None)
    
    updated_count = 0
    skipped_count = 0
    
    for musician in musicians:
        concerts = musician.get("concerts", [])
        modified = False
        
        for i, concert in enumerate(concerts):
            if not concert.get("is_guso") or concert.get("cachet_type"):
                continue
            
            guso_hours = concert.get("guso_hours")
            
            if guso_hours == 12:
                concerts[i]["cachet_type"] = "isolé"
                print(f"✅ {concert.get('venue_name', 'N/A')} ({concert.get('date')}): 12h -> ISOLÉ")
                modified = True
                updated_count += 1
            elif guso_hours == 8:
                concerts[i]["cachet_type"] = "groupé"
                print(f"✅ {concert.get('venue_name', 'N/A')} ({concert.get('date')}): 8h -> GROUPÉ")
                modified = True
                updated_count += 1
            else:
                print(f"⏭️  {concert.get('venue_name', 'N/A')} ({concert.get('date')}): {guso_hours}h -> IGNORÉ (non standard)")
                skipped_count += 1
        
        if modified:
            await db.musicians.update_one(
                {"user_id": musician["user_id"]},
                {"$set": {"concerts": concerts}}
            )
    
    print(f"\n📊 Résumé:")
    print(f"   ✅ Concerts migrés: {updated_count}")
    print(f"   ⏭️  Concerts ignorés: {skipped_count}\n")
    
    client.close()


async def set_cachet_type(user_id: str, concert_id: str, cachet_type: str):
    """
    Définir le type de cachet pour un concert spécifique
    
    Args:
        user_id: ID de l'utilisateur musicien
        concert_id: ID du concert
        cachet_type: "isolé" ou "groupé"
    """
    if cachet_type not in ["isolé", "groupé"]:
        print(f"❌ Type de cachet invalide: {cachet_type}")
        print("   Valeurs acceptées: 'isolé' ou 'groupé'")
        return
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    musician = await db.musicians.find_one({"user_id": user_id}, {"_id": 0})
    
    if not musician:
        print(f"❌ Musicien non trouvé: {user_id}")
        client.close()
        return
    
    concerts = musician.get("concerts", [])
    concert_found = False
    
    for i, concert in enumerate(concerts):
        if concert.get("id") == concert_id:
            concerts[i]["cachet_type"] = cachet_type
            concert_found = True
            
            # Calculer les heures selon la logique officielle
            hours = 12 if cachet_type == "isolé" else 8
            
            print(f"✅ Concert mis à jour:")
            print(f"   📅 {concert.get('date')} - {concert.get('venue_name')}")
            print(f"   🎵 Type: {cachet_type.upper()}")
            print(f"   ⏱️  Heures: {hours}h")
            break
    
    if not concert_found:
        print(f"❌ Concert non trouvé: {concert_id}")
        client.close()
        return
    
    await db.musicians.update_one(
        {"user_id": user_id},
        {"$set": {"concerts": concerts}}
    )
    
    client.close()


async def create_test_data():
    """Créer des données de test avec différents types de cachets"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("\n" + "="*80)
    print("🧪 CRÉATION DE DONNÉES DE TEST")
    print("="*80 + "\n")
    
    from datetime import datetime, timedelta
    import uuid
    
    test_user_id = f"test-guso-{uuid.uuid4().hex[:8]}"
    test_musician_id = f"musician-{uuid.uuid4().hex[:8]}"
    
    # Créer utilisateur
    await db.users.insert_one({
        "id": test_user_id,
        "email": f"test-guso-{uuid.uuid4().hex[:6]}@example.com",
        "password": "$2b$12$example",
        "name": "Test GUSO Demo",
        "role": "musician",
        "subscription_tier": "pro",
        "subscription_status": "active",
        "created_at": datetime.now().isoformat()
    })
    
    # Créer musicien avec concerts de différents types
    concerts = []
    base_date = datetime.now()
    
    # 3 cachets isolés
    for i in range(3):
        date = base_date + timedelta(days=i*10)
        concerts.append({
            "id": f"concert-isole-{i}",
            "date": date.strftime("%Y-%m-%d"),
            "venue_name": f"Café Concert {i+1}",
            "city": "Paris",
            "is_guso": True,
            "cachet_type": "isolé",  # 12 heures
            "guso_declared": i < 2,  # Les 2 premiers sont déclarés
            "cachet": 150.0 + (i * 25),
            "guso_contract_type": "CDDU"
        })
    
    # 2 cachets groupés
    for i in range(2):
        date = base_date + timedelta(days=(i+3)*10)
        concerts.append({
            "id": f"concert-groupe-{i}",
            "date": date.strftime("%Y-%m-%d"),
            "venue_name": f"Festival {i+1}",
            "city": "Lyon",
            "is_guso": True,
            "cachet_type": "groupé",  # 8 heures
            "guso_declared": False,
            "cachet": 200.0 + (i * 50),
            "guso_contract_type": "CDDU"
        })
    
    await db.musicians.insert_one({
        "id": test_musician_id,
        "user_id": test_user_id,
        "pseudo": "Demo GUSO",
        "city": "Paris",
        "postal_code": "75001",
        "instruments": ["Guitare"],
        "music_styles": ["Rock"],
        "bio": "Compte de démonstration GUSO",
        "concerts": concerts,
        "created_at": datetime.now().isoformat()
    })
    
    print(f"✅ Données de test créées:")
    print(f"   👤 User ID: {test_user_id}")
    print(f"   🎸 Musician ID: {test_musician_id}")
    print(f"   📊 Concerts créés:")
    print(f"      - 3 cachets isolés (12h chacun) = 36h")
    print(f"      - 2 cachets groupés (8h chacun) = 16h")
    print(f"      - TOTAL: 52h vers les 507h requises")
    print(f"\n   💰 Revenus totaux: {sum(c['cachet'] for c in concerts):.2f}€")
    print(f"   ✅ Concerts déclarés: 2")
    print(f"   ⏳ À déclarer: 3\n")
    
    client.close()


# Menu principal
async def main():
    if len(sys.argv) < 2:
        print("\n📋 USAGE:")
        print("   python migrate_cachet_types.py list              - Lister les concerts sans type")
        print("   python migrate_cachet_types.py migrate           - Migration auto (12h->isolé, 8h->groupé)")
        print("   python migrate_cachet_types.py set USER_ID CONCERT_ID TYPE  - Définir manuellement")
        print("   python migrate_cachet_types.py test              - Créer des données de test")
        print("\nExemples:")
        print("   python migrate_cachet_types.py set user123 concert456 isolé")
        print("   python migrate_cachet_types.py set user123 concert789 groupé\n")
        return
    
    command = sys.argv[1]
    
    if command == "list":
        await list_concerts_without_cachet_type()
    elif command == "migrate":
        await auto_migrate_from_hours()
    elif command == "set":
        if len(sys.argv) != 5:
            print("❌ Usage: python migrate_cachet_types.py set USER_ID CONCERT_ID TYPE")
            return
        user_id = sys.argv[2]
        concert_id = sys.argv[3]
        cachet_type = sys.argv[4]
        await set_cachet_type(user_id, concert_id, cachet_type)
    elif command == "test":
        await create_test_data()
    else:
        print(f"❌ Commande inconnue: {command}")


if __name__ == "__main__":
    asyncio.run(main())
