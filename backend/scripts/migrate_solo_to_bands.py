"""
Migration : solo_profile (objet unique par musicien) → bands[] avec band_type="Solo"

Pour chaque musicien dont solo_profile est non vide (et idéalement is_available=true) :
- Crée une entrée dans bands[] avec band_type="Solo"
- Marque migrated_from="solo_profile" + migrated_at pour pouvoir rollback
- Ne touche PAS le doc solo_profile (lecture seule pendant 30j minimum, suppression différée)

Idempotent : ré-exécution sûre, ne crée pas de doublon (vérifie migrated_from).

Usage :
  cd /app/backend && python3 scripts/migrate_solo_to_bands.py            # DRY RUN
  cd /app/backend && python3 scripts/migrate_solo_to_bands.py --apply    # APPLIQUE
"""

import asyncio
import os
import sys
from datetime import datetime, timezone
from uuid import uuid4
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')


def build_solo_band(musician: dict) -> dict:
    """Convertit un solo_profile en doc band[] avec band_type='Solo'."""
    solo = musician.get("solo_profile") or {}
    pseudo = musician.get("pseudo") or musician.get("name") or "Solo"
    
    # repertoire_type (str) ou repertoire_types (list) → music_styles (list)
    rep_type = solo.get("repertoire_type")
    rep_types = solo.get("repertoire_types") or []
    if rep_type and rep_type not in rep_types:
        rep_types = [rep_type] + rep_types
    
    return {
        "id": str(uuid4()),
        "name": solo.get("name") or f"{pseudo} (Solo)",
        "band_type": "Solo",  # Convention partagée web/mobile
        "music_styles": rep_types,
        "repertoire_type": rep_type or "",
        "description": solo.get("description", ""),
        "show_duration": solo.get("show_duration"),
        "availability": solo.get("availability", ""),
        "equipment": solo.get("equipment", []),
        "videos": solo.get("videos", []),
        "photos": solo.get("photos", []),
        "looking_for_concerts": bool(solo.get("looking_for_concerts", solo.get("is_available", False))),
        "looking_for_members": False,  # Un solo ne cherche pas de membres
        "members": [musician.get("user_id")],
        "members_count": 1,
        "city": musician.get("city"),
        "department": musician.get("department"),
        "region": musician.get("region"),
        "latitude": musician.get("latitude"),
        "longitude": musician.get("longitude"),
        # Trace pour rollback
        "migrated_from": "solo_profile",
        "migrated_at": datetime.now(timezone.utc).isoformat(),
    }


async def migrate(dry_run: bool = True):
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    
    print(f"=== Mode : {'DRY RUN' if dry_run else 'APPLY'} ===\n")
    
    # Cible : tous les musiciens avec solo_profile non vide
    cursor = db.musicians.find(
        {"solo_profile": {"$exists": True, "$ne": None, "$ne": {}}},
        {"_id": 1, "user_id": 1, "pseudo": 1, "name": 1, "city": 1, "department": 1, 
         "region": 1, "latitude": 1, "longitude": 1, "solo_profile": 1, "bands": 1}
    )
    
    migrated = 0
    skipped_already = 0
    skipped_empty = 0
    
    async for m in cursor:
        bands = m.get("bands") or []
        # Idempotence : skip si déjà un solo migré
        if any(b.get("migrated_from") == "solo_profile" for b in bands if b):
            skipped_already += 1
            continue
        
        solo = m.get("solo_profile") or {}
        # Skip si vraiment vide (que des champs vides)
        meaningful = any(
            solo.get(k) for k in 
            ("name", "description", "repertoire_type", "show_duration", "is_available")
        )
        if not meaningful:
            skipped_empty += 1
            continue
        
        new_band = build_solo_band(m)
        pseudo = m.get("pseudo") or m.get("name") or "?"
        print(f"  + {pseudo:30s} → solo '{new_band['name']}' (styles: {new_band['music_styles']})")
        
        if not dry_run:
            await db.musicians.update_one(
                {"_id": m["_id"]},
                {"$push": {"bands": new_band}}
            )
        migrated += 1
    
    print(f"\n=== RÉSUMÉ ===")
    print(f"  Migrés        : {migrated}")
    print(f"  Skipped (déjà): {skipped_already}")
    print(f"  Skipped (vide): {skipped_empty}")
    if dry_run:
        print("\n(DRY RUN — aucune modif. Relancer avec --apply pour appliquer.)")
    else:
        print("\n✅ Migration appliquée. solo_profile reste en DB pour rétrocompat.")


async def rollback(dry_run: bool = True):
    """Annule la migration : retire toutes les bands avec migrated_from='solo_profile'."""
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    print(f"=== ROLLBACK ({'DRY RUN' if dry_run else 'APPLY'}) ===\n")
    
    if dry_run:
        count = await db.musicians.count_documents({"bands.migrated_from": "solo_profile"})
        print(f"Musiciens impactés : {count}")
        print("(DRY RUN — relancer avec --rollback --apply pour exécuter)")
    else:
        res = await db.musicians.update_many(
            {},
            {"$pull": {"bands": {"migrated_from": "solo_profile"}}}
        )
        print(f"✅ Rollback : {res.modified_count} musiciens nettoyés")


if __name__ == "__main__":
    apply = "--apply" in sys.argv
    if "--rollback" in sys.argv:
        asyncio.run(rollback(dry_run=not apply))
    else:
        asyncio.run(migrate(dry_run=not apply))
