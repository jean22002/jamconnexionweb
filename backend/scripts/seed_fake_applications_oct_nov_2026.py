"""
Script one-shot : Génère les événements de novembre 2026 (calqués sur octobre)
et crée 3-6 candidatures fictives par créneau de planning pour oct + nov 2026,
avec un mix de statuts pending / accepted / rejected.

Cibles : les 2 venues utilisées pour la génération d'octobre.
"""
import asyncio
import os
import random
import uuid
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

VENUE_IDS = ["venue-1771535930121", "46ccbadf-e9c7-4484-aec9-a136ab282443"]

# Modèles de créneaux Planning pour Novembre (mixte, 6 par venue → 12 total)
NOV_SLOTS_TEMPLATES = [
    {"day": 4,  "time": "20:30", "title": "🎤 Recherche duo acoustique", "description": "Ambiance apéro chill", "payment": "150€", "expected_band_style": "Folk", "expected_attendance": 60, "music_styles": ["Folk", "Acoustique"]},
    {"day": 6,  "time": "21:00", "title": "🎸 Soirée Rock Live", "description": "Groupe complet, 3 sets", "payment": "300€", "expected_band_style": "Rock", "expected_attendance": 120, "music_styles": ["Rock"]},
    {"day": 8,  "time": "20:00", "title": "🎷 Jazz du dimanche", "description": "Trio ou quartet jazz", "payment": "220€", "expected_band_style": "Jazz", "expected_attendance": 80, "music_styles": ["Jazz"]},
    {"day": 12, "time": "21:30", "title": "🎶 Chanson française", "description": "Reprises et compos", "payment": "180€", "expected_band_style": "Chanson", "expected_attendance": 70, "music_styles": ["Chanson"]},
    {"day": 14, "time": "20:30", "title": "🥁 Concert Funk & Soul", "description": "Groupe 5+ musiciens", "payment": "350€", "expected_band_style": "Funk", "expected_attendance": 130, "music_styles": ["Funk", "Soul"]},
    {"day": 18, "time": "21:00", "title": "🎺 Blues Night", "description": "Ambiance tamisée", "payment": "200€", "expected_band_style": "Blues", "expected_attendance": 90, "music_styles": ["Blues"]},
    {"day": 20, "time": "20:30", "title": "🎻 Manouche Session", "description": "Guitares gypsy bienvenues", "payment": "160€", "expected_band_style": "Manouche", "expected_attendance": 65, "music_styles": ["Manouche", "Jazz"]},
    {"day": 22, "time": "21:00", "title": "🎸 Reggae Vibes", "description": "Reggae/dub/ska", "payment": "250€", "expected_band_style": "Reggae", "expected_attendance": 100, "music_styles": ["Reggae"]},
    {"day": 25, "time": "20:00", "title": "🎤 Open Mic + Tête d'affiche", "description": "1er passage puis concert", "payment": "180€", "expected_band_style": "Variété", "expected_attendance": 75, "music_styles": ["Pop", "Rock"]},
    {"day": 27, "time": "21:30", "title": "🎹 Soirée Piano-Voix", "description": "Duo intimiste", "payment": "140€", "expected_band_style": "Piano-Voix", "expected_attendance": 55, "music_styles": ["Jazz", "Chanson"]},
    {"day": 29, "time": "20:30", "title": "🎃 Fin de mois Rock", "description": "Groupe énergique", "payment": "280€", "expected_band_style": "Rock", "expected_attendance": 110, "music_styles": ["Rock", "Pop"]},
    {"day": 30, "time": "21:00", "title": "🎶 World Music Night", "description": "Musiques du monde", "payment": "230€", "expected_band_style": "World", "expected_attendance": 95, "music_styles": ["World", "Latin"]},
]

NOV_JAMS = [
    {"day": 2,  "time": "20:00", "end_time": "23:30", "title": "🎵 Jam Jazz du lundi", "description": "Standards & bebop", "music_styles": ["Jazz"], "expected_attendance": 40},
    {"day": 5,  "time": "21:00", "end_time": "01:00", "title": "🎸 Rock Jam", "description": "Amenez vos instruments", "music_styles": ["Rock"], "expected_attendance": 50},
    {"day": 7,  "time": "20:30", "end_time": "00:30", "title": "🎷 Bœuf Jazz-Funk", "description": "Groove & impro", "music_styles": ["Jazz", "Funk"], "expected_attendance": 45},
    {"day": 10, "time": "21:00", "end_time": "01:00", "title": "🎶 Blues Jam", "description": "12 mesures à volonté", "music_styles": ["Blues"], "expected_attendance": 35},
    {"day": 13, "time": "20:30", "end_time": "00:00", "title": "🎤 Open Mic Chansons", "description": "Voix et guitares", "music_styles": ["Chanson", "Folk"], "expected_attendance": 30},
    {"day": 16, "time": "21:00", "end_time": "01:30", "title": "🎺 Latin Jam", "description": "Salsa, bossa, cubain", "music_styles": ["Latin"], "expected_attendance": 40},
    {"day": 19, "time": "20:00", "end_time": "23:00", "title": "🎻 Manouche Bœuf", "description": "Django & Co", "music_styles": ["Manouche"], "expected_attendance": 35},
    {"day": 21, "time": "21:30", "end_time": "01:00", "title": "🎸 Soul & Funk Jam", "description": "Cuivres bienvenus", "music_styles": ["Soul", "Funk"], "expected_attendance": 45},
    {"day": 24, "time": "20:30", "end_time": "00:00", "title": "🥁 Drum Circle & Percu", "description": "Percussions ouvertes", "music_styles": ["World"], "expected_attendance": 25},
    {"day": 26, "time": "21:00", "end_time": "01:00", "title": "🎹 Piano Jazz Session", "description": "Trio piano-basse-batterie", "music_styles": ["Jazz"], "expected_attendance": 50},
]

NOV_CONCERTS = [
    {"day": 1,  "time": "20:30", "title": "Les Voisins du Dessus", "band_name": "Les Voisins du Dessus", "description": "Chanson pop décalée", "music_styles": ["Chanson", "Pop"], "expected_attendance": 90, "price": "12€"},
    {"day": 3,  "time": "21:00", "title": "Kings of Blues", "band_name": "Kings of Blues", "description": "Blues électrique", "music_styles": ["Blues"], "expected_attendance": 100, "price": "10€"},
    {"day": 9,  "time": "20:30", "title": "Fanfare Zébulon", "band_name": "Fanfare Zébulon", "description": "Fanfare festive", "music_styles": ["World"], "expected_attendance": 130, "price": "15€"},
    {"day": 11, "time": "20:00", "title": "Yasmine Trio", "band_name": "Yasmine Trio", "description": "Jazz-soul", "music_styles": ["Jazz", "Soul"], "expected_attendance": 85, "price": "12€"},
    {"day": 15, "time": "21:00", "title": "Rock'n'Beans", "band_name": "Rock'n'Beans", "description": "Rock indé français", "music_styles": ["Rock"], "expected_attendance": 110, "price": "13€"},
    {"day": 17, "time": "20:30", "title": "Djembéfola", "band_name": "Djembéfola", "description": "Percussions africaines", "music_styles": ["World"], "expected_attendance": 95, "price": "10€"},
    {"day": 23, "time": "21:00", "title": "Éclipse", "band_name": "Éclipse", "description": "Pop électro-orga", "music_styles": ["Pop", "Electro"], "expected_attendance": 120, "price": "14€"},
    {"day": 25, "time": "20:30", "title": "Quintet Manouche", "band_name": "Quintet Manouche", "description": "Django Reinhardt tribute", "music_styles": ["Manouche", "Jazz"], "expected_attendance": 80, "price": "12€"},
    {"day": 28, "time": "20:30", "title": "Les Sœurs Malouines", "band_name": "Les Sœurs Malouines", "description": "Duo folk breton", "music_styles": ["Folk"], "expected_attendance": 70, "price": "10€"},
    {"day": 30, "time": "21:00", "title": "Reggae United", "band_name": "Reggae United", "description": "Reggae roots", "music_styles": ["Reggae"], "expected_attendance": 115, "price": "13€"},
]


async def get_pool_of_musicians(db, target=40):
    """Récupère un pool de musiciens variés, avec bandes de préférence."""
    pool = []
    async for m in db.musicians.find({"bands": {"$exists": True, "$ne": []}}).limit(target):
        pool.append(m)
    if len(pool) < target:
        async for m in db.musicians.find({}).limit(target - len(pool)):
            if m not in pool:
                pool.append(m)
    return pool


def make_application(slot, musician, status, idx):
    """Construit un doc de candidature."""
    # Prend la première bande si dispo
    bands = musician.get("bands") or []
    band = bands[0] if isinstance(bands, list) and bands else None
    band_name = None
    band_id = None
    music_style = ""
    if band and isinstance(band, dict):
        band_name = band.get("name")
        band_id = band.get("id") or band.get("band_id")
        styles = band.get("music_styles") or []
        if isinstance(styles, list):
            music_style = ", ".join(styles[:3])
    if not band_name:
        band_name = musician.get("pseudo") or musician.get("stage_name") or "Musicien"
    if not music_style:
        styles = musician.get("music_styles") or []
        if isinstance(styles, list):
            music_style = ", ".join(styles[:3])

    descriptions = [
        "Nous serions ravis de jouer chez vous, ambiance garantie !",
        "Groupe expérimenté, matériel autonome, set list adaptable.",
        "On adore votre lieu, disponibles à la date proposée.",
        "Projet original, on peut envoyer une démo si vous voulez.",
        "Formation 4 musiciens, prêts à faire vibrer votre salle.",
        "Répertoire varié, on adapte facilement selon votre public.",
    ]

    return {
        "id": str(uuid.uuid4()),
        "planning_slot_id": slot["id"],
        "musician_id": musician.get("user_id") or musician.get("id"),
        "musician_name": musician.get("pseudo") or musician.get("stage_name") or "Musicien",
        "band_name": band_name,
        "band_id": band_id,
        "band_photo": (band or {}).get("photo") if band else "",
        "description": random.choice(descriptions),
        "music_style": music_style or "Rock",
        "links": "{}",
        "contact_email": musician.get("contact_email") or "",
        "contact_phone": musician.get("phone") or "",
        "status": status,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


async def create_november_events(db):
    """Insère jams / concerts / planning_slots pour novembre 2026."""
    now_iso = datetime.now(timezone.utc).isoformat()
    slots_created = []

    # Planning slots (6 par venue)
    for i, tpl in enumerate(NOV_SLOTS_TEMPLATES):
        venue_id = VENUE_IDS[i % 2]
        doc = {
            "id": str(uuid.uuid4()),
            "venue_id": venue_id,
            "date": f"2026-11-{tpl['day']:02d}",
            "time": tpl["time"],
            "title": tpl["title"],
            "description": tpl["description"],
            "num_bands_needed": 1,
            "accepted_bands_count": 0,
            "payment": tpl["payment"],
            "expected_band_style": tpl["expected_band_style"],
            "expected_attendance": tpl["expected_attendance"],
            "music_styles": tpl["music_styles"],
            "is_open": True,
            "created_at": now_iso,
        }
        await db.planning_slots.insert_one(doc)
        slots_created.append(doc)

    # Jams (5 par venue)
    for i, j in enumerate(NOV_JAMS):
        venue_id = VENUE_IDS[i % 2]
        doc = {
            "id": str(uuid.uuid4()),
            "venue_id": venue_id,
            "date": f"2026-11-{j['day']:02d}",
            "time": j["time"],
            "end_time": j["end_time"],
            "title": j["title"],
            "description": j["description"],
            "music_styles": j["music_styles"],
            "expected_attendance": j["expected_attendance"],
            "created_at": now_iso,
        }
        await db.jams.insert_one(doc)

    # Concerts (5 par venue)
    for i, c in enumerate(NOV_CONCERTS):
        venue_id = VENUE_IDS[i % 2]
        doc = {
            "id": str(uuid.uuid4()),
            "venue_id": venue_id,
            "date": f"2026-11-{c['day']:02d}",
            "time": c["time"],
            "title": c["title"],
            "band_name": c["band_name"],
            "description": c["description"],
            "music_styles": c["music_styles"],
            "expected_attendance": c["expected_attendance"],
            "price": c["price"],
            "created_at": now_iso,
        }
        await db.concerts.insert_one(doc)

    return slots_created


async def create_applications_for_slots(db, slots, musicians):
    """Génère 3-6 candidatures par slot avec mix pending/accepted/rejected."""
    total_apps = 0
    for slot in slots:
        n = random.randint(3, 6)
        chosen = random.sample(musicians, min(n, len(musicians)))
        # 1 accepted au plus (num_bands_needed = 1), le reste réparti
        # Distribution : 1 accepted, ~1-2 rejected, reste pending
        has_accepted = random.random() < 0.5  # 50% des slots ont déjà 1 accepted
        num_rejected = random.randint(1, 2)
        statuses = []
        if has_accepted:
            statuses.append("accepted")
        for _ in range(min(num_rejected, len(chosen) - len(statuses))):
            statuses.append("rejected")
        while len(statuses) < len(chosen):
            statuses.append("pending")
        random.shuffle(statuses)

        for musician, status in zip(chosen, statuses):
            app = make_application(slot, musician, status, total_apps)
            await db.applications.insert_one(app)
            total_apps += 1

        # Mettre à jour accepted_bands_count et is_open sur le slot
        accepted_count = statuses.count("accepted")
        num_needed = int(slot.get("num_bands_needed") or 1)
        await db.planning_slots.update_one(
            {"id": slot["id"]},
            {"$set": {
                "accepted_bands_count": accepted_count,
                "is_open": accepted_count < num_needed,
            }},
        )
    return total_apps


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    print("→ Récupération pool musiciens…")
    musicians = await get_pool_of_musicians(db, target=40)
    print(f"   {len(musicians)} musiciens disponibles")

    print("→ Création événements Novembre 2026…")
    nov_slots = await create_november_events(db)
    print(f"   {len(nov_slots)} planning_slots, 10 jams, 10 concerts créés")

    print("→ Récupération planning_slots Octobre 2026…")
    oct_slots = []
    async for s in db.planning_slots.find({"date": {"$regex": "^2026-10"}}):
        oct_slots.append(s)
    print(f"   {len(oct_slots)} slots d'octobre trouvés")

    print("→ Création candidatures pour Octobre + Novembre…")
    all_slots = oct_slots + nov_slots
    total = await create_applications_for_slots(db, all_slots, musicians)
    print(f"   {total} candidatures fictives créées au total")

    print("\n✓ Terminé.")


if __name__ == "__main__":
    asyncio.run(main())
