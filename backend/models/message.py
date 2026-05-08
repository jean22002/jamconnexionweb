from pydantic import BaseModel
from typing import Optional

class MessageCreate(BaseModel):
    recipient_id: str  # User ID of recipient
    subject: str
    content: str

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    sender_image: Optional[str] = None
    recipient_id: str
    recipient_name: str
    subject: str
    content: str
    is_read: bool = False
    created_at: str
