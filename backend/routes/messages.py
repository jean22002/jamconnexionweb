from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from typing import List
import os
import uuid

from models import MessageCreate, MessageResponse
from utils import get_current_user

router = APIRouter(prefix="/messages", tags=["Messages"])

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

@router.post("", response_model=MessageResponse)
async def send_message(data: MessageCreate, current_user: dict = Depends(get_current_user)):
    """Send a message to another user"""
    # Get recipient info
    recipient = await db.users.find_one({"id": data.recipient_id}, {"_id": 0})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    # Get sender profile info
    sender_profile = None
    sender_image = None
    if current_user["role"] == "musician":
        sender_profile = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
        sender_image = sender_profile.get("profile_image") if sender_profile else None
    elif current_user["role"] == "venue":
        sender_profile = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
        sender_image = sender_profile.get("profile_image") if sender_profile else None
    
    message_doc = {
        "id": str(uuid.uuid4()),
        "sender_id": current_user["id"],
        "sender_name": current_user["name"],
        "sender_image": sender_image,
        "recipient_id": data.recipient_id,
        "recipient_name": recipient["name"],
        "subject": data.subject,
        "content": data.content,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message_doc)
    
    # Create notification for recipient
    notification_doc = {
        "id": str(uuid.uuid4()),
        "user_id": data.recipient_id,
        "type": "new_message",
        "title": f"Nouveau message de {current_user['name']}",
        "message": data.subject,
        "link": "/messages",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification_doc)
    
    return MessageResponse(**message_doc)

@router.get("/inbox", response_model=List[MessageResponse])
async def get_inbox(current_user: dict = Depends(get_current_user)):
    """Get all messages received by current user"""
    messages = await db.messages.find(
        {"recipient_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [MessageResponse(**m) for m in messages]

@router.get("/sent", response_model=List[MessageResponse])
async def get_sent_messages(current_user: dict = Depends(get_current_user)):
    """Get all messages sent by current user"""
    messages = await db.messages.find(
        {"sender_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [MessageResponse(**m) for m in messages]

@router.put("/{message_id}/read")
async def mark_as_read(message_id: str, current_user: dict = Depends(get_current_user)):
    """Mark a message as read"""
    message = await db.messages.find_one({"id": message_id}, {"_id": 0})
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if message["recipient_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.messages.update_one(
        {"id": message_id},
        {"$set": {"is_read": True}}
    )
    
    return {"message": "Message marked as read"}

@router.delete("/conversation/{partner_id}")
async def delete_conversation(partner_id: str, current_user: dict = Depends(get_current_user)):
    """Delete all messages in a conversation with a partner"""
    result = await db.messages.delete_many({
        "$or": [
            {"sender_id": current_user["id"], "recipient_id": partner_id},
            {"sender_id": partner_id, "recipient_id": current_user["id"]}
        ]
    })
    
    return {"message": f"{result.deleted_count} messages deleted"}
