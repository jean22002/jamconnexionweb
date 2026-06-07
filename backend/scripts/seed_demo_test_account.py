"""
Seed de données de démonstration pour le compte test@gmail.com.

Crée ~20 concerts mixés (GUSO + facture), met à jour le profil
pour le rendre réaliste pour des vidéos marketing.

Usage:
    cd /app/backend && python3 scripts/seed_demo_test_account.py

Idempotent : remplace les concerts par le seed (ne touche pas aux bands existants).
"""
import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient

VENUES = [
    {"name": "Le Sunset", "city": "Paris", "dept": "75", "region": "Île-de-France"},
    {"name": "Bar Le Caveau", "city": "Lyon", "dept": "69", "region": "Auvergne-Rhône-Alpes"},
    {"name": "Le Bistrot du Coin", "city": "Marseille", "dept": "13", "region": "PACA"},
    {"name": "Café de la Gare", "city": "Bordeaux", "dept": "33", "region": "Nouvelle-Aquitaine"},
    {"name": "L'Apostrophe", "city": "Lille", "dept": "59", "region": "Hauts-de-France"},
    {"name": "La Maroquinerie", "city": "Paris", "dept": "75", "region": "Île-de-France"},
    {"name": "Le Trianon", "city": "Paris", "dept": "75", "region": "Île-de-France"},
    {"name": "L'Olympia", "city": "Paris", "dept": "75", "region": "Île-de-France"},
    {"name": "Festival du Vent", "city": "Calvi", "dept": "2B", "region": "Corse"},
    {"name": "Fête de la Musique", "city": "Lyon", "dept": "69", "region": "Auvergne-Rhône-Alpes"},
    {"name": "Le New Morning", "city": "Paris", "dept": "75", "region": "Île-de-France"},
    {"name": "Le Lapin Agile", "city": "Toulouse", "dept": "31", "region": "Occitanie"},
    {"name": "Bar Le Trompette", "city": "Nantes", "dept": "44", "region": "Pays de la Loire"},
    {"name": "Café Strasbourgeois", "city": "Strasbourg", "dept": "67", "region": "Grand Est"},
    {"name": "L'Étoile de Nice", "city": "Nice", "dept": "06", "region": "PACA"},
]

STYLES = ["rock", "blues", "jazz", "chanson française", "folk"]
FORMATIONS = ["Solo", "Duo acoustique", "Trio", "Quatuor", "Groupe de reprise"]
DESCRIPTIONS = [
    "Set acoustique de 2h, super accueil",
    "Soirée bondée, retours excellents du public",
    "Première partie d'un groupe local, ambiance familiale",
    "Showcase scène ouverte, mix repris-compos",
    "Concert privé entreprise, set jazzy",
    "Festival - scène B, 1h de set énergique",
    "Bar à vin, ambiance intimiste",
    "Fête de la musique, scène extérieure",
    "Concert anniversaire, super accueil",
    "Soirée karaoke + set live de clôture",
]


async def main():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]

    # 1) S'assurer du user
    user = await db.users.find_one({"email": "test@gmail.com"}, {"_id": 0})
    if not user:
        print("❌ User test@gmail.com introuvable. Abandon.")
        return
    print(f"User trouvé : {user['id']}")

    user_updates = {}
    if not user.get("email_verified"):
        user_updates["email_verified"] = True
    user_updates["subscription_status"] = "active"
    user_updates["trial_end"] = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
    user_updates["name"] = "Marc Acoustique"
    if user_updates:
        await db.users.update_one({"id": user["id"]}, {"$set": user_updates})
        print(f"✅ User mis à jour ({len(user_updates)} champs)")

    musician = await db.musicians.find_one({"user_id": user["id"]}, {"_id": 0})
    if not musician:
        print("❌ Profil musicien introuvable. Abandon.")
        return
    print(f"Musician trouvé : {musician['id']} ({len(musician.get('concerts', []))} concerts existants)")

    # 2) Génération des 20 concerts
    today = datetime.now(timezone.utc).date()
    concerts = []

    # 16 passés (répartis sur 6 derniers mois)
    for i in range(16):
        days_ago = 7 + i * 11  # 7, 18, 29, ... sur ~180j
        date_obj = today - timedelta(days=days_ago)
        concerts.append((i, date_obj, "past"))

    # 4 à venir (mois suivants)
    for i in range(4):
        days_ahead = 10 + i * 18
        date_obj = today + timedelta(days=days_ahead)
        concerts.append((16 + i, date_obj, "future"))

    # 12 × GUSO, 8 × facture (sur les 20)
    # Répartition payment_status :
    #   - 4 futurs → pending
    #   - 16 passés → 10 paid + 3 pending + 3 canceled
    past_status_pool = ["paid"] * 10 + ["pending"] * 3 + ["canceled"] * 3
    import random
    random.seed(42)
    random.shuffle(past_status_pool)

    seed_concerts = []
    past_idx_counter = 0

    for idx, date_obj, period in concerts:
        venue = VENUES[idx % len(VENUES)]
        is_guso = idx < 12
        formation = FORMATIONS[idx % len(FORMATIONS)]
        cachet_type = "isolé" if idx % 2 == 0 else "groupé"
        style_desc = STYLES[idx % len(STYLES)]
        desc = DESCRIPTIONS[idx % len(DESCRIPTIONS)]

        if is_guso:
            # cachet 80-250
            cachet = round(80 + (idx * 15.5) % 170, 2)
            guso_hours = 3 + (idx % 4)  # 3..6
            invoice_number = None
            guso_contract_type = "cdd_usage"
        else:
            cachet = round(200 + (idx * 53.7) % 600, 2)
            guso_hours = None
            invoice_number = f"INV-2026-{idx:03d}"
            guso_contract_type = None

        # payment_status : futurs = pending, sinon depuis le pool past
        if period == "future":
            payment_status = "pending"
            payment_date = None
        else:
            payment_status = past_status_pool[past_idx_counter]
            past_idx_counter += 1
            if payment_status == "paid":
                payment_date = (date_obj + timedelta(days=14)).isoformat()
            else:
                payment_date = None

        concert = {
            "id": str(uuid.uuid4()),
            "date": date_obj.isoformat(),
            "venue_id": None,
            "venue_name": venue["name"],
            "city": venue["city"],
            "department": venue["dept"],
            "region": venue["region"],
            "description": desc,
            "cachet": cachet,
            "payment_status": payment_status,
            "payment_date": payment_date,
            "invoice_url": None,
            "invoice_filename": None,
            "invoice_uploaded_at": None,
            "invoice_number": invoice_number,
            "formation_type": formation,
            "band_name": None if formation == "Solo" else f"{musician.get('pseudo', 'Marc')} {formation}",
            "notes": f"Style: {style_desc}",
            "is_guso": is_guso,
            "guso_hours": guso_hours,
            "guso_contract_type": guso_contract_type,
            "guso_declared": is_guso and payment_status == "paid",
            "cachet_type": cachet_type,
        }
        seed_concerts.append(concert)

    # 3) Update du profil musicien
    profile_updates = {
        "pseudo": musician.get("pseudo") or "Marc Acoustique",
        "bio": "Musicien live - rock / blues / chanson française. Sets acoustiques en bar ou full band en festival.",
        "instruments": list(set((musician.get("instruments") or []) + ["guitare", "voix"])),
        "music_styles": list(set((musician.get("music_styles") or []) + ["rock", "blues", "chanson française"])),
        "city": musician.get("city") or "Paris",
        "department": musician.get("department") or "75",
        "region": musician.get("region") or "Île-de-France",
        "is_pro": True,
        "pro_subscription_status": "active",
        "subscription_status": "active",
        "subscription_tier": "pro",
        "subscription_started": datetime.now(timezone.utc).isoformat(),
        "subscription_expires": (datetime.now(timezone.utc) + timedelta(days=365)).isoformat(),
        "is_guso_member": True,
        "guso_number": "FR-GUSO-7842156",
        "concerts": seed_concerts,
    }
    await db.musicians.update_one(
        {"user_id": user["id"]},
        {"$set": profile_updates}
    )

    print()
    print("=== RÉCAP CONCERTS SEEDÉS ===")
    total_paid = sum(c["cachet"] for c in seed_concerts if c["payment_status"] == "paid")
    total_guso = sum(c["cachet"] for c in seed_concerts if c["is_guso"])
    print(f"  Total concerts : {len(seed_concerts)}")
    print(f"  GUSO          : {sum(1 for c in seed_concerts if c['is_guso'])} (cachets {total_guso:.0f}€)")
    print(f"  Facture       : {sum(1 for c in seed_concerts if not c['is_guso'])}")
    print(f"  paid          : {sum(1 for c in seed_concerts if c['payment_status']=='paid')} (revenus {total_paid:.0f}€)")
    print(f"  pending       : {sum(1 for c in seed_concerts if c['payment_status']=='pending')}")
    print(f"  canceled      : {sum(1 for c in seed_concerts if c['payment_status']=='canceled')}")
    print()
    print("  Date,Venue,Ville,Type,Cachet,Status,Formation")
    for c in sorted(seed_concerts, key=lambda x: x["date"]):
        typ = "GUSO" if c["is_guso"] else "FACT"
        print(f"  {c['date']},{c['venue_name']},{c['city']},{typ},{c['cachet']:.0f}€,{c['payment_status']},{c['formation_type']}")

    print()
    print("✅ Seed terminé. Login : test@gmail.com / test")


if __name__ == "__main__":
    asyncio.run(main())
