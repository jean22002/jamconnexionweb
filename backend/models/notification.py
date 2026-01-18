from pydantic import BaseModel
from typing import Optional

class NotificationResponse(BaseModel):
    id: str
    user_id: Optional[str] = None  # For old notification types
    recipient_id: Optional[str] = None  # For broadcast notifications
    recipient_role: Optional[str] = None  # musician, melomane, venue
    sender_id: Optional[str] = None  # For broadcast notifications
    sender_role: Optional[str] = None  # Usually "venue" for broadcasts
    type: str  # jam_reminder, concert_reminder, friend_request, application_received, broadcast, etc.
    title: Optional[str] = None  # Title is optional for broadcasts
    message: str
    link: Optional[str] = None
    read: bool = False
    created_at: str
