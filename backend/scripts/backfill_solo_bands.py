"""
Script de migration : backfill des Solo bands manquants pour tous les musiciens existants.

Pour chaque musicien dans db.musicians :
  - Si pas de Solo band dans db.bands (leader_id=musician.id, band_type="Solo"), en crée un.
  - Idempotent : safe à relancer.

Usage :
  cd /app/backend && python3 scripts/backfill_solo_bands.py
"""
import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient


async def main():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]

    musicians = await db.musicians.find({}, {"_id": 0}).to_list(10000)
    print(f"Musiciens trouvés : {len(musicians)}")

    created_count = 0
    skipped_count = 0
    failed_count = 0

    for m in musicians:
        musician_id = m.get("id")
        if not musician_id:
            failed_count += 1
            continue

        existing = await db.bands.find_one(
            {"leader_id": musician_id, "band_type": "Solo"},
            {"_id": 0, "id": 1}
        )
        if existing:
            skipped_count += 1
            continue

        # Fetch user for fallback name
        user_doc = None
        if m.get("user_id"):
            user_doc = await db.users.find_one({"id": m["user_id"]}, {"_id": 0})

        pseudo = m.get("pseudo") or (user_doc.get("name") if user_doc else None) or "Solo"

        solo_band = {
            "id": str(uuid.uuid4()),
            "name": f"{pseudo} (Solo)",
            "leader_id": musician_id,
            "leader_name": pseudo,
            "admin_id": m.get("user_id"),
            "band_type": "Solo",
            "description": f"Profil solo de {pseudo}",
            "music_styles": m.get("music_styles", []),
            "city": m.get("city", ""),
            "members_count": 1,
            "members": [{
                "id": musician_id,
                "user_id": m.get("user_id"),
                "name": pseudo,
                "role": "leader"
            }],
            "is_public": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        try:
            await db.bands.insert_one(solo_band)
            created_count += 1
            print(f"  ✅ Solo band créé pour {pseudo} (musician_id={musician_id[:8]}…)")
        except Exception as e:
            failed_count += 1
            print(f"  ❌ Erreur pour {pseudo}: {e}")

    print()
    print("=== Résultat ===")
    print(f"  Créés    : {created_count}")
    print(f"  Skip déjà présents : {skipped_count}")
    print(f"  Échecs   : {failed_count}")


if __name__ == "__main__":
    asyncio.run(main())
