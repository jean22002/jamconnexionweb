from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

class MessageCreate(BaseModel):
    recipient_id: str  # User ID of recipient
    subject: str
    content: str

class MessageResponse(BaseModel):
    """
    Legacy inbox/sent message schema.

    Build 152.24 — Tolère les messages écrits par le nouveau système `/api/chat/*`
    (schema conversation-first sans `recipient_id`/`subject`, `created_at` en datetime).
    Les 3 champs legacy sont désormais Optional et `created_at` est coerce str.
    """
    id: str
    sender_id: str
    sender_name: str
    sender_image: Optional[str] = None
    recipient_id: Optional[str] = None
    recipient_name: Optional[str] = None
    subject: Optional[str] = None
    content: str
    is_read: bool = False
    created_at: str
    conversation_id: Optional[str] = None

    @field_validator("created_at", mode="before")
    @classmethod
    def _coerce_created_at(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return v
