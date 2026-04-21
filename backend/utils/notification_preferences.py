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
        notification_type: Type of notification (new_participants, new_applications, etc.)
        user_role: Role of the user (venue, musician, melomane)
    
    Returns:
        bool: True if notification should be sent, False otherwise
    """
    # Currently only venues have notification preferences
    if user_role != "venue":
        return True
    
    # Get venue by user_id
    venue = await db.venues.find_one({"user_id": user_id}, {"_id": 0, "notification_preferences": 1})
    
    if not venue:
        # If venue not found, send notification by default
        return True
    
    # Get preferences (default to all enabled)
    preferences = venue.get("notification_preferences", {
        "new_participants": True,
        "new_applications": True,
        "application_cancellation": True,
        "new_messages": True,
        "new_followers": True
    })
    
    # Check specific preference
    return preferences.get(notification_type, True)


async def get_venue_by_user_id(user_id: str):
    """Helper to get venue by user_id"""
    return await db.venues.find_one({"user_id": user_id}, {"_id": 0})
