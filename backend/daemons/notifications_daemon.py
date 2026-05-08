"""
Daemon de Notifications Automatiques
Envoie des notifications programmées pour :
- Rappels d'événements (J-3, J-1, H-2)
- Nouveaux événements des établissements suivis
- Suggestions d'amis
- Nouveaux badges obtenus
"""

import asyncio
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys
from uuid import uuid4
import logging

# Configuration logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB
MONGO_URL = os.environ.get('MONGO_URL_PRODUCTION') or os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'jamconnexion')

if not MONGO_URL:
    logger.error("MONGO_URL not set, loading from .env...")
    from dotenv import load_dotenv
    load_dotenv('/app/backend/.env')
    MONGO_URL = os.environ.get('MONGO_URL_PRODUCTION') or os.environ.get('MONGO_URL')
    if not MONGO_URL:
        logger.error("Still no MONGO_URL, exiting")
        sys.exit(1)
    logger.info("✓ MONGO_URL loaded")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


async def create_notification(user_id: str, notification_type: str, title: str, message: str, related_id: str = None):
    """Créer une notification dans la base de données et envoyer via WebSocket"""
    notification = {
        "id": str(uuid4()),
        "user_id": user_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "related_id": related_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        await db.notifications.insert_one(notification)
        logger.info(f"✓ Notification DB created for user {user_id}: {title}")
        
        # 🔔 Envoyer notification WebSocket en temps réel
        try:
            import sys
            sys.path.insert(0, '/app/backend')
            from websocket import emit_to_user
            
            await emit_to_user(user_id, 'notification', {
                'notification_type': notification_type,
                'data': {
                    'title': title,
                    'message': message,
                    'related_id': related_id,
                    'action_url': '/'
                }
            })
            logger.info(f"⚡ WebSocket notification sent to user {user_id}")
        except Exception as ws_error:
            logger.debug(f"WebSocket notification skipped (user may not be connected): {ws_error}")
        
        return True
    except Exception as e:
        logger.error(f"✗ Failed to create notification: {e}")
        return False


async def send_event_reminders_j3():
    """Envoyer des rappels pour les événements dans 3 jours"""
    logger.info("🔔 Checking for events in 3 days...")
    
    target_date = (datetime.now(timezone.utc) + timedelta(days=3)).date()
    target_date_str = target_date.isoformat()
    
    # Collections d'événements
    event_collections = ['jams', 'concerts', 'karaoke', 'spectacle']
    total_sent = 0
    
    for collection_name in event_collections:
        collection = db[collection_name]
        
        # Trouver les événements à cette date
        events = await collection.find({
            "date": target_date_str
        }, {"_id": 0}).to_list(1000)
        
        for event in events:
            # Trouver les participants actifs
            participants = await db.event_participations.find({
                "event_id": event["id"],
                "active": True
            }, {"_id": 0}).to_list(1000)
            
            # Envoyer notification à chaque participant
            for participant in participants:
                venue = await db.venues.find_one(
                    {"id": event["venue_id"]},
                    {"_id": 0, "name": 1}
                )
                venue_name = venue.get("name", "Établissement") if venue else "Établissement"
                
                event_type_label = {
                    'jams': 'Bœuf',
                    'concerts': 'Concert',
                    'karaoke': 'Karaoke',
                    'spectacle': 'Spectacle'
                }
                
                title = f"Rappel : {event_type_label.get(collection_name, 'Événement')} dans 3 jours"
                message = f"{event_type_label.get(collection_name, 'Événement')} à {venue_name} le {target_date_str} à {event.get('start_time', 'TBD')}"
                
                await create_notification(
                    user_id=participant.get("user_id") or participant.get("participant_id") or participant.get("musician_id"),
                    notification_type="event_reminder_j3",
                    title=title,
                    message=message,
                    related_id=event["id"]
                )
                total_sent += 1
    
    logger.info(f"✓ Sent {total_sent} reminders for events in 3 days")
    return total_sent


async def send_event_reminders_j1():
    """Envoyer des rappels pour les événements demain"""
    logger.info("🔔 Checking for events tomorrow...")
    
    target_date = (datetime.now(timezone.utc) + timedelta(days=1)).date()
    target_date_str = target_date.isoformat()
    
    event_collections = ['jams', 'concerts', 'karaoke', 'spectacle']
    total_sent = 0
    
    for collection_name in event_collections:
        collection = db[collection_name]
        
        events = await collection.find({
            "date": target_date_str
        }, {"_id": 0}).to_list(1000)
        
        for event in events:
            participants = await db.event_participations.find({
                "event_id": event["id"],
                "active": True
            }, {"_id": 0}).to_list(1000)
            
            for participant in participants:
                venue = await db.venues.find_one(
                    {"id": event["venue_id"]},
                    {"_id": 0, "name": 1}
                )
                venue_name = venue.get("name", "Établissement") if venue else "Établissement"
                
                event_type_label = {
                    'jams': 'Bœuf',
                    'concerts': 'Concert',
                    'karaoke': 'Karaoke',
                    'spectacle': 'Spectacle'
                }
                
                title = f"🎵 {event_type_label.get(collection_name, 'Événement')} demain !"
                message = f"N'oubliez pas : {event_type_label.get(collection_name, 'Événement')} à {venue_name} demain à {event.get('start_time', 'TBD')}"
                
                await create_notification(
                    user_id=participant.get("user_id") or participant.get("participant_id") or participant.get("musician_id"),
                    notification_type="event_reminder_j1",
                    title=title,
                    message=message,
                    related_id=event["id"]
                )
                total_sent += 1
    
    logger.info(f"✓ Sent {total_sent} reminders for events tomorrow")
    return total_sent


async def send_event_reminders_h2():
    """Envoyer des rappels pour les événements dans 2 heures"""
    logger.info("🔔 Checking for events in 2 hours...")
    
    now = datetime.now(timezone.utc)
    target_time = now + timedelta(hours=2)
    today = now.date().isoformat()
    
    # Formater l'heure cible (format HH:MM)
    target_hour = target_time.strftime("%H:%M")
    
    event_collections = ['jams', 'concerts', 'karaoke', 'spectacle']
    total_sent = 0
    
    for collection_name in event_collections:
        collection = db[collection_name]
        
        # Trouver les événements aujourd'hui
        events = await collection.find({
            "date": today
        }, {"_id": 0}).to_list(1000)
        
        for event in events:
            event_start = event.get('start_time', '')
            
            # Vérifier si l'événement commence dans ~2h (±30 min)
            if not event_start:
                continue
            
            # Comparer les heures (simplification)
            if abs(int(event_start.split(':')[0]) - int(target_hour.split(':')[0])) == 2:
                participants = await db.event_participations.find({
                    "event_id": event["id"],
                    "active": True
                }, {"_id": 0}).to_list(1000)
                
                for participant in participants:
                    venue = await db.venues.find_one(
                        {"id": event["venue_id"]},
                        {"_id": 0, "name": 1}
                    )
                    venue_name = venue.get("name", "Établissement") if venue else "Établissement"
                    
                    event_type_label = {
                        'jams': 'Bœuf',
                        'concerts': 'Concert',
                        'karaoke': 'Karaoke',
                        'spectacle': 'Spectacle'
                    }
                    
                    title = f"⏰ {event_type_label.get(collection_name, 'Événement')} dans 2 heures !"
                    message = f"C'est bientôt ! {event_type_label.get(collection_name, 'Événement')} à {venue_name} à {event_start}"
                    
                    await create_notification(
                        user_id=participant.get("user_id") or participant.get("participant_id") or participant.get("musician_id"),
                        notification_type="event_reminder_h2",
                        title=title,
                        message=message,
                        related_id=event["id"]
                    )
                    total_sent += 1
    
    logger.info(f"✓ Sent {total_sent} reminders for events in 2 hours")
    return total_sent


async def notify_new_events_from_subscribed_venues():
    """Notifier les utilisateurs des nouveaux événements des établissements suivis"""
    logger.info("🔔 Checking for new events from subscribed venues...")
    
    # Événements créés dans les dernières 24h
    yesterday = datetime.now(timezone.utc) - timedelta(days=1)
    yesterday_iso = yesterday.isoformat()
    
    event_collections = ['jams', 'concerts', 'karaoke', 'spectacle']
    total_sent = 0
    
    for collection_name in event_collections:
        collection = db[collection_name]
        
        # Trouver les nouveaux événements
        new_events = await collection.find({
            "created_at": {"$gte": yesterday_iso}
        }, {"_id": 0}).to_list(1000)
        
        for event in new_events:
            # Trouver les abonnés de cet établissement
            subscribers = await db.venue_subscriptions.find({
                "venue_id": event["venue_id"]
            }, {"_id": 0}).to_list(1000)
            
            venue = await db.venues.find_one(
                {"id": event["venue_id"]},
                {"_id": 0, "name": 1}
            )
            venue_name = venue.get("name", "Établissement") if venue else "Établissement"
            
            event_type_label = {
                'jams': 'Bœuf',
                'concerts': 'Concert',
                'karaoke': 'Karaoke',
                'spectacle': 'Spectacle'
            }
            
            for subscriber in subscribers:
                title = f"🎉 Nouvel événement : {event_type_label.get(collection_name, 'Événement')} chez {venue_name}"
                message = f"{venue_name} organise un {event_type_label.get(collection_name, 'événement').lower()} le {event.get('date', 'TBD')}"
                
                await create_notification(
                    user_id=subscriber["subscriber_id"],
                    notification_type="new_event_from_venue",
                    title=title,
                    message=message,
                    related_id=event["id"]
                )
                total_sent += 1
    
    logger.info(f"✓ Sent {total_sent} notifications for new events")
    return total_sent


async def suggest_friends():
    """Suggérer des amis basés sur localisation et instruments"""
    logger.info("🔔 Generating friend suggestions...")
    
    # Pour chaque musicien, trouver d'autres musiciens dans la même ville
    musicians = await db.musicians.find({}, {"_id": 0}).to_list(10000)
    total_sent = 0
    
    for musician in musicians[:50]:  # Limiter à 50 pour ne pas spammer
        if not musician.get('city'):
            continue
        
        # Trouver des musiciens dans la même ville avec instruments complémentaires
        similar_musicians = await db.musicians.find({
            "city": musician['city'],
            "id": {"$ne": musician['id']}  # Pas soi-même
        }, {"_id": 0}).to_list(5)
        
        if similar_musicians:
            # Vérifier qu'ils ne sont pas déjà amis
            existing_friends = await db.friends.find({
                "$or": [
                    {"from_user_id": musician['user_id']},
                    {"to_user_id": musician['user_id']}
                ]
            }, {"_id": 0}).to_list(1000)
            
            friend_ids = set()
            for friendship in existing_friends:
                friend_ids.add(friendship.get('from_user_id'))
                friend_ids.add(friendship.get('to_user_id'))
            
            # Suggérer un musicien qui n'est pas déjà ami
            for suggested in similar_musicians:
                if suggested['user_id'] not in friend_ids:
                    title = f"👥 Suggestion : {suggested.get('pseudo', 'Musicien')} à {musician['city']}"
                    instruments = ', '.join(suggested.get('instruments', [])[:2])
                    message = f"Découvrez {suggested.get('pseudo', 'ce musicien')} - {instruments}"
                    
                    await create_notification(
                        user_id=musician['user_id'],
                        notification_type="friend_suggestion",
                        title=title,
                        message=message,
                        related_id=suggested['id']
                    )
                    total_sent += 1
                    break  # Une seule suggestion par musicien
    
    logger.info(f"✓ Sent {total_sent} friend suggestions")
    return total_sent


async def run_notification_cycle():
    """Exécuter un cycle complet de notifications (uniquement à 13h)"""
    import pytz
    
    # Vérifier l'heure actuelle (Paris)
    now = datetime.now(timezone.utc)
    paris_tz = pytz.timezone('Europe/Paris')
    now_paris = now.astimezone(paris_tz)
    
    current_hour = now_paris.hour
    current_minute = now_paris.minute
    
    # Exécuter UNIQUEMENT entre 12h55 et 13h05 (heure de Paris)
    is_in_window = (current_hour == 12 and current_minute >= 55) or \
                   (current_hour == 13 and current_minute <= 5)
    
    if not is_in_window:
        logger.info(f"⏰ Hors fenêtre 13h (actuel: {current_hour}h{current_minute:02d} Paris), skip notifications")
        return
    
    logger.info("="*60)
    logger.info(f"🚀 Starting notification cycle at {current_hour}h{current_minute:02d} (Paris)")
    logger.info("="*60)
    
    try:
        # Rappels d'événements
        await send_event_reminders_j3()
        await asyncio.sleep(2)
        
        await send_event_reminders_j1()
        await asyncio.sleep(2)
        
        await send_event_reminders_h2()
        await asyncio.sleep(2)
        
        # Nouveaux événements
        await notify_new_events_from_subscribed_venues()
        await asyncio.sleep(2)
        
        # Suggestions (moins fréquent)
        # await suggest_friends()
        
        logger.info("="*60)
        logger.info("✅ Notification cycle completed")
        logger.info("="*60)
        
    except Exception as e:
        logger.error(f"❌ Error in notification cycle: {e}")
        import traceback
        traceback.print_exc()


async def main():
    """Boucle principale du daemon"""
    logger.info("🤖 Notification Daemon Starting...")
    logger.info(f"📊 Database: {DB_NAME}")
    
    while True:
        try:
            await run_notification_cycle()
            
            # Attendre 1 heure avant le prochain cycle
            logger.info("💤 Sleeping for 1 hour...")
            await asyncio.sleep(3600)  # 1 heure
            
        except KeyboardInterrupt:
            logger.info("⛔ Daemon stopped by user")
            break
        except Exception as e:
            logger.error(f"❌ Fatal error: {e}")
            import traceback
            traceback.print_exc()
            logger.info("💤 Sleeping for 5 minutes before retry...")
            await asyncio.sleep(300)
    
    client.close()
    logger.info("🔌 Connection closed")


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("  JAM CONNEXION - Notification Daemon")
    logger.info("=" * 60)
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\n⛔ Daemon stopped")
