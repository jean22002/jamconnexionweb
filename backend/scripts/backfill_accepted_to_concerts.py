"""
Script de migration rétroactive : pour chaque application status="accepted" sans
concert correspondant dans db.concerts, on crée le document concert manquant.

Réutilise la même logique de résolution band_id que `accept_application` :
  - application.band_id si présent
  - sinon db.bands{leader_id=musician.id, band_type="Solo"}
  - sinon musicians.bands[band_type="Solo"] embedded

Idempotent : skip si concert avec id="{app_id}_concert" existe déjà.

Usage :
  cd /app/backend && python3 scripts/backfill_accepted_to_concerts.py
"""
import asyncio
import os
import sys
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient


async def resolve_band_id(db, app: dict):
    """Résout band_id + band_type pour une candidature acceptée."""
    band_id = app.get("band_id")
    band_type = None

    if band_id:
        band_doc = await db.bands.find_one({"id": band_id}, {"_id": 0, "band_type": 1})
        if band_doc:
            band_type = band_doc.get("band_type") or "group"
        return band_id, band_type

    # Fallback Solo
    musician = await db.musicians.find_one({"id": app.get("musician_id")}, {"_id": 0}) if app.get("musician_id") else None
    if not musician:
        return None, None

    solo_band = await db.bands.find_one(
        {"leader_id": musician["id"], "band_type": "Solo"},
        {"_id": 0, "id": 1}
    )
    if solo_band:
        return solo_band["id"], "Solo"

    for b in (musician.get("bands") or []):
        if b.get("band_type") == "Solo":
            return b.get("id") or b.get("band_id"), "Solo"

    return None, None


async def main():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]

    accepted = await db.applications.find({"status": "accepted"}, {"_id": 0}).to_list(10000)
    print(f"Candidatures acceptées trouvées : {len(accepted)}")

    created = 0
    skipped = 0
    failed = 0

    for app in accepted:
        app_id = app.get("id")
        if not app_id:
            failed += 1
            continue

        concert_id = f"{app_id}_concert"
        existing = await db.concerts.find_one({"id": concert_id}, {"_id": 0, "id": 1})
        if existing:
            skipped += 1
            continue

        slot = await db.planning_slots.find_one({"id": app.get("planning_slot_id")}, {"_id": 0})
        if not slot:
            print(f"  ⚠️  Slot introuvable pour app {app_id[:8]}… → skip")
            failed += 1
            continue

        venue = await db.venues.find_one({"id": slot.get("venue_id")}, {"_id": 0})
        band_id, band_type = await resolve_band_id(db, app)

        concert_doc = {
            "id": concert_id,
            "venue_id": slot.get("venue_id"),
            "venue_name": (venue.get("name") if venue else None) or slot.get("venue_name"),
            "band_id": band_id,
            "band_name": app.get("band_name"),
            "band_type": band_type,
            "musician_id": app.get("musician_id"),
            "date": slot.get("date"),
            "start_time": slot.get("time") or slot.get("start_time"),
            "end_time": slot.get("end_time"),
            "title": slot.get("title") or (f"Concert {app.get('band_name')}" if app.get("band_name") else "Concert"),
            "description": slot.get("description"),
            "music_styles": slot.get("music_styles", []),
            "payment": slot.get("payment"),
            "is_guso": slot.get("is_guso", False),
            "has_catering": slot.get("has_catering"),
            "has_meals": slot.get("has_meals"),
            "has_accommodation": slot.get("has_accommodation"),
            "source": "application_accepted_backfill",
            "planning_slot_id": slot.get("id"),
            "application_id": app_id,
            "created_at": app.get("created_at") or datetime.now(timezone.utc).isoformat(),
        }

        try:
            await db.concerts.insert_one(concert_doc)
            created += 1
            print(f"  ✅ {app.get('band_name')} → date {slot.get('date')} | band_id={band_id} | band_type={band_type}")
        except Exception as e:
            failed += 1
            print(f"  ❌ Erreur insert pour app {app_id[:8]}… : {e}")

    print()
    print("=== Résultat ===")
    print(f"  Concerts créés   : {created}")
    print(f"  Skip déjà existants : {skipped}")
    print(f"  Échecs           : {failed}")


if __name__ == "__main__":
    asyncio.run(main())
