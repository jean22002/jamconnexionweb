"""
Database utility functions
"""
import re
import uuid
from typing import Optional
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os

# MongoDB connection singleton
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME')]


def get_db():
    """Get database instance"""
    return db


async def create_notification(user_id: str, notif_type: str, title: str, message: str, link: Optional[str] = None):
    """
    Create a notification for a user
    
    Args:
        user_id: ID of the user to notify
        notif_type: Type of notification (e.g., 'friend_request', 'concert_accepted')
        title: Notification title
        message: Notification message
        link: Optional link to redirect when clicking the notification
    """
    notif_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    notif_doc = {
        "id": notif_id,
        "user_id": user_id,
        "type": notif_type,
        "title": title,
        "message": message,
        "link": link,
        "read": False,
        "created_at": now
    }
    
    await db.notifications.insert_one(notif_doc)


async def notify_venue_subscribers(venue_id: str, notif_type: str, title: str, message: str, link: Optional[str] = None):
    """
    Notify all subscribers of a venue
    
    Args:
        venue_id: ID of the venue
        notif_type: Type of notification
        title: Notification title
        message: Notification message
        link: Optional link
    """
    subs = await db.venue_subscriptions.find({"venue_id": venue_id}, {"_id": 0}).to_list(1000)
    for sub in subs:
        await create_notification(sub["user_id"], notif_type, title, message, link)


def normalize_image_url(url: Optional[str]) -> Optional[str]:
    """
    Normalize image URLs to ensure consistency in storage.
    Converts full URLs to relative paths starting with /api/uploads/
    Handles edge cases like double /api/ prefixes.
    
    Args:
        url: The URL to normalize
        
    Returns:
        Normalized URL or None if input is empty
        
    Examples:
        >>> normalize_image_url("https://example.com/api/uploads/image.jpg")
        "/api/uploads/image.jpg"
        >>> normalize_image_url("/api/api/uploads/image.jpg")
        "/api/uploads/image.jpg"
    """
    if not url or not url.strip():
        return None
    
    # Remove any http(s):// protocol and domain
    normalized = re.sub(r'https?://[^/]+', '', url)
    
    # Fix double /api/ prefix (e.g., /api/api/uploads → /api/uploads)
    normalized = re.sub(r'/api/api/', '/api/', normalized)
    
    # Ensure it starts with /api/uploads if it's an upload path
    if 'uploads' in normalized and not normalized.startswith('/api/uploads'):
        normalized = re.sub(r'^/?(uploads/)', r'/api/uploads/', normalized)
    
    return normalized if normalized else None
