"""
Système de notifications automatiques pour les événements
Vérifie et envoie les notifications selon les règles :
- J-3 à 13h : notification aux participants
- Jour J à 13h : notification aux participants + musiciens dans 70km
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
    """Créer une notification dans la base de données + WebSocket temps réel"""
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
    print(f"✅ Notification DB envoyée à {user_id}: {title}")
    
    # 🔔 Envoi notification WebSocket en temps réel
    try:
        from websocket import emit_to_user
        await emit_to_user(user_id, 'notification', {
            'notification_type': notif_type,
            'data': {
                'title': title,
                'message': message,
                'action_url': link or '/dashboard'
            }
        })
        print(f"⚡ Notification WebSocket envoyée à {user_id}")
    except Exception as e:
        print(f"⚠️ Erreur WebSocket pour {user_id}: {e}")



async def notify_event_participants(db, event, event_type, days_before=0):
    """
    Notifier les participants d'un événement
    
    Args:
        db: Database instance
        event: Event document (jam or concert)
        event_type: 'jam' or 'concert'
        days_before: 0 for Jour J, 3 for J-3
    """
    participants = await db.event_participations.find({
        "event_id": event["id"],
        "event_type": event_type,
        "active": True
    }, {"_id": 0}).to_list(1000)
    
    for participant in participants:
        user_id = participant.get("participant_id") or participant.get("musician_id")
        
        if days_before == 3:
            # Notification J-3
            title = f"Rappel : {event_type.capitalize()} dans 3 jours !"
            message = f"Le {event_type} à {event['venue_name']} aura lieu le {event['date']} à {event['start_time']}"
        else:
            # Notification Jour J
            emoji = "🎸" if event_type == "jam" else "🎤"
            title = f"{emoji} C'est aujourd'hui : {event_type.capitalize()} à {event['start_time']} !"
            message = f"Le {event_type} à {event['venue_name']} commence à {event['start_time']}. À ce soir !"
        
        notif_type = f"{event_type}_reminder"
        await send_notification(db, user_id, notif_type, title, message, f"/venues/{event['venue_id']}")
    
    return len(participants)


async def notify_nearby_musicians(db, event, venue, event_type, radius_km=70):
    """
    Notifier les musiciens à proximité d'un événement
    
    Args:
        db: Database instance
        event: Event document
        venue: Venue document with GPS coordinates
        event_type: 'jam' or 'concert'
        radius_km: Search radius in kilometers
    """
    if not venue or not venue.get("latitude") or not venue.get("longitude"):
        return 0
    
    venue_lat = venue["latitude"]
    venue_lon = venue["longitude"]
    
    # Trouver tous les musiciens
    musicians = await db.musicians.find({}, {"_id": 0}).to_list(10000)
    notified_count = 0
    
    for musician in musicians:
        # Vérifier que le musicien n'est pas déjà participant
        is_participant = await db.event_participations.find_one({
            "event_id": event["id"],
            "musician_id": musician["user_id"]
        })
        
        if is_participant:
            continue
        
        # Calculer la distance si le musicien a des coordonnées GPS
        musician_lat = musician.get("latitude")
        musician_lon = musician.get("longitude")
        
        if musician_lat and musician_lon:
            distance = haversine_distance(venue_lat, venue_lon, musician_lat, musician_lon)
            
            if distance <= radius_km:
                emoji = "🎵" if event_type == "jam" else "🎸"
                event_title = event.get('title', event_type.capitalize())
                styles_text = '/'.join(event.get('music_styles', [])[:2]) if event.get('music_styles') else event_title
                
                await send_notification(
                    db,
                    musician["user_id"],
                    f"{event_type}_nearby",
                    f"{emoji} {event_type.capitalize()} ce soir près de chez vous !",
                    f"Un {event_type} {styles_text} a lieu ce soir à {event['start_time']} à {event['venue_name']} ({venue['city']}) - À {int(distance)}km de vous",
                    f"/venues/{event['venue_id']}"
                )
                notified_count += 1
    
    return notified_count


async def notify_nearby_melomanes(db, event, venue):
    """
    Notifier les mélomanes à proximité d'un concert
    
    Args:
        db: Database instance
        event: Concert document
        venue: Venue document with GPS coordinates
    """
    if not venue or not venue.get("latitude") or not venue.get("longitude"):
        return 0
    
    venue_lat = venue["latitude"]
    venue_lon = venue["longitude"]
    
    # Trouver tous les mélomanes avec notifications activées
    melomanes = await db.melomanes.find({"notifications_enabled": True}, {"_id": 0}).to_list(10000)
    notified_count = 0
    
    for melomane in melomanes:
        # Vérifier que le mélomane n'est pas déjà participant
        is_participant = await db.event_participations.find_one({
            "event_id": event["id"],
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
                styles_text = '/'.join(event.get('music_styles', [])[:2]) if event.get('music_styles') else event.get('title', 'Concert')
                
                await send_notification(
                    db,
                    melomane["user_id"],
                    "concert_nearby",
                    "🎸 Concert ce soir près de chez vous !",
                    f"Un concert {styles_text} a lieu ce soir à {event['start_time']} à {event['venue_name']} ({venue['city']}) - À {int(distance)}km de vous",
                    f"/venues/{event['venue_id']}"
                )
                notified_count += 1
    
    return notified_count

async def check_and_send_event_notifications():
    """Vérifier et envoyer les notifications d'événements"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Heure actuelle à Paris
    now_paris = datetime.now(PARIS_TZ)
    print(f"\n🕐 Vérification des notifications à {now_paris.strftime('%Y-%m-%d %H:%M:%S')} (Paris)")
    
    # Vérifier si on est à 13h (±5 minutes pour tolérance)
    if not (12 <= now_paris.hour <= 13 and 55 <= now_paris.minute or 13 <= now_paris.hour <= 13 and now_paris.minute <= 5):
        print("⏰ Pas dans la fenêtre 13h (±5min), skip")
        client.close()
        return
    
    print("✅ Dans la fenêtre 13h, traitement des notifications...")
    
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
        await notify_event_participants(db, jam, "jam", days_before=3)
    print(f"✅ {len(jams_j3)} bœufs J-3 traités")
    
    # Concerts dans 3 jours
    concerts_j3 = await db.concerts.find({"date": three_days_str}, {"_id": 0}).to_list(100)
    for concert in concerts_j3:
        await notify_event_participants(db, concert, "concert", days_before=3)
    print(f"✅ {len(concerts_j3)} concerts J-3 traités")
    
    # ========== NOTIFICATIONS JOUR J ==========
    print("\n🔔 Traitement des notifications Jour J...")
    
    # Bœufs aujourd'hui
    jams_today = await db.jams.find({"date": today_str}, {"_id": 0}).to_list(100)
    for jam in jams_today:
        # 1. Notifier les participants
        participants_count = await notify_event_participants(db, jam, "jam", days_before=0)
        print(f"✅ {participants_count} participants notifiés pour bœuf aujourd'hui")
        
        # 2. Notifier les musiciens à proximité (70km)
        venue = await db.venues.find_one({"id": jam["venue_id"]}, {"_id": 0})
        nearby_count = await notify_nearby_musicians(db, jam, venue, "jam", radius_km=70)
        print(f"✅ {nearby_count} musiciens à proximité (70km) notifiés")
    
    print(f"✅ {len(jams_today)} bœufs Jour J traités")
    
    # Concerts aujourd'hui
    concerts_today = await db.concerts.find({"date": today_str}, {"_id": 0}).to_list(100)
    for concert in concerts_today:
        # 1. Notifier les participants
        participants_count = await notify_event_participants(db, concert, "concert", days_before=0)
        print(f"✅ {participants_count} participants notifiés pour concert aujourd'hui")
        
        # 2. Notifier les musiciens à proximité
        venue = await db.venues.find_one({"id": concert["venue_id"]}, {"_id": 0})
        nearby_musicians = await notify_nearby_musicians(db, concert, venue, "concert", radius_km=70)
        print(f"✅ {nearby_musicians} musiciens à proximité (70km) notifiés")
        
        # 3. Notifier les mélomanes à proximité
        nearby_melomanes = await notify_nearby_melomanes(db, concert, venue)
        print(f"✅ {nearby_melomanes} mélomanes à proximité notifiés")
    
    print(f"✅ {len(concerts_today)} concerts Jour J traités")
    
    print("\n🎉 Traitement des notifications terminé !")
    client.close()

if __name__ == "__main__":
    print("=" * 60)
    print("🔔 SYSTÈME DE NOTIFICATIONS AUTOMATIQUES")
    print("=" * 60)
    asyncio.run(check_and_send_event_notifications())
