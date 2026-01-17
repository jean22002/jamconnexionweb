"""
Système de notifications automatiques pour les événements
Vérifie et envoie les notifications selon les règles :
- J-3 à 12h30 : notification aux participants
- Jour J à 12h30 : notification aux participants + musiciens dans 70km
"""

import os
import asyncio
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from math import radians, sin, cos, sqrt, atan2
import pytz

# Timezone Paris
PARIS_TZ = pytz.timezone('Europe/Paris')

# Configuration
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_db')

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two GPS coordinates in kilometers"""
    R = 6371  # Earth radius in km
    
    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)
    
    a = sin(delta_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    return R * c

async def send_notification(db, user_id, notif_type, title, message, link=None):
    """Créer une notification dans la base de données"""
    notification_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notif_type,
        "title": title,
        "message": message,
        "link": link,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.notifications.insert_one(notification_doc)
    print(f"✅ Notification envoyée à {user_id}: {title}")

async def check_and_send_event_notifications():
    """Vérifier et envoyer les notifications d'événements"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Heure actuelle à Paris
    now_paris = datetime.now(PARIS_TZ)
    print(f"\n🕐 Vérification des notifications à {now_paris.strftime('%Y-%m-%d %H:%M:%S')} (Paris)")
    
    # Vérifier si on est à 12h30 (±5 minutes pour tolérance)
    if not (12 <= now_paris.hour <= 12 and 25 <= now_paris.minute <= 35):
        print("⏰ Pas dans la fenêtre 12h30 (±5min), skip")
        client.close()
        return
    
    print("✅ Dans la fenêtre 12h30, traitement des notifications...")
    
    # Date du jour et J-3
    today = now_paris.date()
    three_days_later = (now_paris + timedelta(days=3)).date()
    
    today_str = today.strftime("%Y-%m-%d")
    three_days_str = three_days_later.strftime("%Y-%m-%d")
    
    print(f"📅 Aujourd'hui: {today_str}")
    print(f"📅 J-3: {three_days_str}")
    
    # ========== NOTIFICATIONS J-3 ==========
    print("\n🔔 Traitement des notifications J-3...")
    
    # Bœufs dans 3 jours
    jams_j3 = await db.jams.find({"date": three_days_str}, {"_id": 0}).to_list(100)
    for jam in jams_j3:
        # Trouver les participants ACTIFS (musiciens et mélomanes)
        participants = await db.event_participations.find({
            "event_id": jam["id"],
            "event_type": "jam",
            "active": True
        }, {"_id": 0}).to_list(1000)
        
        for participant in participants:
            user_id = participant.get("participant_id") or participant.get("musician_id")
            await send_notification(
                db,
                user_id,
                "jam_reminder",
                f"Rappel : Bœuf dans 3 jours !",
                f"Le bœuf \"{jam.get('music_styles', [''])[0] if jam.get('music_styles') else 'Jam Session'}\" à {jam['venue_name']} aura lieu le {jam['date']} à {jam['start_time']}",
                f"/venues/{jam['venue_id']}"
            )
    
    print(f"✅ {len(jams_j3)} bœufs J-3 traités")
    
    # Concerts dans 3 jours
    concerts_j3 = await db.concerts.find({"date": three_days_str}, {"_id": 0}).to_list(100)
    for concert in concerts_j3:
        # Trouver les participants ACTIFS (musiciens et mélomanes)
        participants = await db.event_participations.find({
            "event_id": concert["id"],
            "event_type": "concert",
            "active": True
        }, {"_id": 0}).to_list(1000)
        
        for participant in participants:
            user_id = participant.get("participant_id") or participant.get("musician_id")
            await send_notification(
                db,
                user_id,
                "concert_reminder",
                f"Rappel : Concert dans 3 jours !",
                f"Le concert \"{concert.get('title', 'Concert')}\" à {concert['venue_name']} aura lieu le {concert['date']} à {concert['start_time']}",
                f"/venues/{concert['venue_id']}"
            )
    
    print(f"✅ {len(concerts_j3)} concerts J-3 traités")
    
    # ========== NOTIFICATIONS JOUR J ==========
    print("\n🔔 Traitement des notifications Jour J...")
    
    # Bœufs aujourd'hui
    jams_today = await db.jams.find({"date": today_str}, {"_id": 0}).to_list(100)
    for jam in jams_today:
        # 1. Notifier les participants ACTIFS (musiciens et mélomanes)
        participants = await db.event_participations.find({
            "event_id": jam["id"],
            "event_type": "jam",
            "active": True
        }, {"_id": 0}).to_list(1000)
        
        for participant in participants:
            user_id = participant.get("participant_id") or participant.get("musician_id")
            await send_notification(
                db,
                user_id,
                "jam_reminder",
                f"🎸 C'est aujourd'hui : Bœuf à {jam['start_time']} !",
                f"Le bœuf à {jam['venue_name']} commence à {jam['start_time']}. À ce soir !",
                f"/venues/{jam['venue_id']}"
            )
        
        print(f"✅ {len(participants)} participants notifiés pour bœuf aujourd'hui")
        
        # 2. Notifier les musiciens dans un rayon de 70km
        venue = await db.venues.find_one({"id": jam["venue_id"]}, {"_id": 0})
        if venue and venue.get("latitude") and venue.get("longitude"):
            venue_lat = venue["latitude"]
            venue_lon = venue["longitude"]
            
            # Trouver tous les musiciens
            musicians = await db.musicians.find({}, {"_id": 0}).to_list(10000)
            notified_nearby = 0
            
            for musician in musicians:
                # Vérifier que le musicien n'est pas déjà participant
                is_participant = await db.event_participations.find_one({
                    "event_id": jam["id"],
                    "musician_id": musician["user_id"]
                })
                
                if is_participant:
                    continue
                
                # Calculer la distance si le musicien a des coordonnées GPS
                musician_lat = musician.get("latitude")
                musician_lon = musician.get("longitude")
                
                if musician_lat and musician_lon:
                    distance = haversine_distance(venue_lat, venue_lon, musician_lat, musician_lon)
                    
                    if distance <= 70:  # Dans un rayon de 70km
                        await send_notification(
                            db,
                            musician["user_id"],
                            "jam_nearby",
                            f"🎵 Bœuf ce soir près de chez vous !",
                            f"Un bœuf {'/'.join(jam.get('music_styles', [])[:2]) if jam.get('music_styles') else 'Jam Session'} a lieu ce soir à {jam['start_time']} à {jam['venue_name']} ({venue['city']}) - À {int(distance)}km de vous",
                            f"/venues/{jam['venue_id']}"
                        )
                        notified_nearby += 1
            
            print(f"✅ {notified_nearby} musiciens à proximité (70km) notifiés")
    
    print(f"✅ {len(jams_today)} bœufs Jour J traités")
    
    # Concerts aujourd'hui
    concerts_today = await db.concerts.find({"date": today_str}, {"_id": 0}).to_list(100)
    for concert in concerts_today:
        # 1. Notifier les participants ACTIFS (musiciens et mélomanes)
        participants = await db.event_participations.find({
            "event_id": concert["id"],
            "event_type": "concert",
            "active": True
        }, {"_id": 0}).to_list(1000)
        
        for participant in participants:
            user_id = participant.get("participant_id") or participant.get("musician_id")
            await send_notification(
                db,
                user_id,
                "concert_reminder",
                f"🎤 C'est aujourd'hui : Concert à {concert['start_time']} !",
                f"Le concert \"{concert.get('title', 'Concert')}\" à {concert['venue_name']} commence à {concert['start_time']}. À ce soir !",
                f"/venues/{concert['venue_id']}"
            )
        
        print(f"✅ {len(participants)} participants notifiés pour concert aujourd'hui")
        
        # 2. Notifier les musiciens à proximité (même logique que les bœufs)
        venue = await db.venues.find_one({"id": concert["venue_id"]}, {"_id": 0})
        if venue and venue.get("latitude") and venue.get("longitude"):
            venue_lat = venue["latitude"]
            venue_lon = venue["longitude"]
            
            musicians = await db.musicians.find({}, {"_id": 0}).to_list(10000)
            notified_nearby = 0
            
            for musician in musicians:
                is_participant = await db.event_participations.find_one({
                    "event_id": concert["id"],
                    "musician_id": musician["user_id"]
                })
                
                if is_participant:
                    continue
                
                # Calculer la distance si le musicien a des coordonnées GPS
                musician_lat = musician.get("latitude")
                musician_lon = musician.get("longitude")
                
                if musician_lat and musician_lon:
                    distance = haversine_distance(venue_lat, venue_lon, musician_lat, musician_lon)
                    
                    if distance <= 70:  # Dans un rayon de 70km
                        await send_notification(
                            db,
                            musician["user_id"],
                            "concert_nearby",
                            f"🎸 Concert ce soir près de chez vous !",
                            f"Un concert {'/'.join(concert.get('music_styles', [])[:2]) if concert.get('music_styles') else concert.get('title', 'Concert')} a lieu ce soir à {concert['start_time']} à {concert['venue_name']} ({venue['city']}) - À {int(distance)}km de vous",
                            f"/venues/{concert['venue_id']}"
                        )
                        notified_nearby += 1
            
            print(f"✅ {notified_nearby} musiciens à proximité (70km) notifiés")
        
        # 3. Notifier les mélomanes dans le rayon défini par leurs préférences
        if venue and venue.get("latitude") and venue.get("longitude"):
            venue_lat = venue["latitude"]
            venue_lon = venue["longitude"]
            
            # Trouver tous les mélomanes avec notifications activées
            melomanes = await db.melomanes.find({"notifications_enabled": True}, {"_id": 0}).to_list(10000)
            notified_melomanes = 0
            
            for melomane in melomanes:
                # Vérifier que le mélomane n'est pas déjà participant
                is_participant = await db.event_participations.find_one({
                    "event_id": concert["id"],
                    "participant_id": melomane["user_id"],
                    "participant_type": "melomane"
                })
                
                if is_participant:
                    continue
                
                # Calculer la distance si le mélomane a des coordonnées GPS
                melomane_lat = melomane.get("latitude")
                melomane_lon = melomane.get("longitude")
                notification_radius = melomane.get("notification_radius_km", 50)
                
                if melomane_lat and melomane_lon:
                    distance = haversine_distance(venue_lat, venue_lon, melomane_lat, melomane_lon)
                    
                    if distance <= notification_radius:
                        await send_notification(
                            db,
                            melomane["user_id"],
                            "concert_nearby",
                            f"🎸 Concert ce soir près de chez vous !",
                            f"Un concert {'/'.join(concert.get('music_styles', [])[:2]) if concert.get('music_styles') else concert.get('title', 'Concert')} a lieu ce soir à {concert['start_time']} à {concert['venue_name']} ({venue['city']}) - À {int(distance)}km de vous",
                            f"/venues/{concert['venue_id']}"
                        )
                        notified_melomanes += 1
            
            print(f"✅ {notified_melomanes} mélomanes à proximité notifiés")
    
    print(f"✅ {len(concerts_today)} concerts Jour J traités")
    
    print("\n🎉 Traitement des notifications terminé !")
    client.close()

if __name__ == "__main__":
    print("=" * 60)
    print("🔔 SYSTÈME DE NOTIFICATIONS AUTOMATIQUES")
    print("=" * 60)
    asyncio.run(check_and_send_event_notifications())
