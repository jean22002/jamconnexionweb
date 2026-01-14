from pydantic import BaseModel
from typing import Optional

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str  # jam_reminder, concert_reminder, friend_request, application_received, etc.
    title: str
    message: str
    link: Optional[str] = None
    read: bool = False
    created_at: str
