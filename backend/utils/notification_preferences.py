"""
Utility functions for notification preferences
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


async def should_send_notification(user_id: str, notification_type: str, user_role: str = "venue") -> bool:
    """
    Check if a notification should be sent based on user preferences.

    Args:
        user_id: The ID of the user to receive the notification
        notification_type: Type of notification (see whitelist per role)
        user_role: Role of the user ("venue" | "musician" | "melomane")

    Returns:
        bool: True if notification should be sent, False otherwise.
              Fallback = True (envoi par défaut) si profil non trouvé.

    Whitelists (Build 214, sync mobile) :
      venue    → new_participants, new_applications, application_cancellation, new_messages, new_followers
      musician → new_messages, friend_requests, badges_unlocked, upcoming_events,
                 application_response, new_event_match, subscription_expiring
      melomane → new_messages, friend_requests, upcoming_events, new_event_match
    """
    # ─── Venue ─────────────────────────────────────────────────────────────
    if user_role == "venue":
        venue = await db.venues.find_one({"user_id": user_id}, {"_id": 0, "notification_preferences": 1})
        if not venue:
            return True
        preferences = venue.get("notification_preferences", {
            "new_participants": True,
            "new_applications": True,
            "application_cancellation": True,
            "new_messages": True,
            "new_followers": True,
        })
        return preferences.get(notification_type, True)

    # ─── Musician ──────────────────────────────────────────────────────────
    if user_role == "musician":
        musician = await db.musicians.find_one({"user_id": user_id}, {"_id": 0, "notification_preferences": 1})
        if not musician:
            return True
        preferences = musician.get("notification_preferences") or {}
        # Défaut = True si clé absente (compat rétro pour les vieux profils)
        return bool(preferences.get(notification_type, True))

    # ─── Melomane ──────────────────────────────────────────────────────────
    if user_role == "melomane":
        melomane = await db.melomanes.find_one({"user_id": user_id}, {"_id": 0, "notification_preferences": 1})
        if not melomane:
            return True
        preferences = melomane.get("notification_preferences") or {}
        return bool(preferences.get(notification_type, True))

    # Rôle inconnu → on envoie par défaut (safe)
    return True


async def get_venue_by_user_id(user_id: str):
    """Helper to get venue by user_id"""
    return await db.venues.find_one({"user_id": user_id}, {"_id": 0})
