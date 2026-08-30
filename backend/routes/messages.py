from fastapi import APIRouter, HTTPException, Depends, Header, Request
from datetime import datetime, timezone
from typing import List
import uuid

from models import MessageCreate, MessageResponse
from middleware.rate_limit import limiter

router = APIRouter(prefix="/messages", tags=["Messages"])

# DB will be injected by the main server
db = None

def set_db(database):
    global db
    db = database

async def get_current_user_local(authorization: str = Header(None)):
    """Import get_current_user locally to avoid circular imports"""
    from utils import get_current_user
    return await get_current_user(request=None, authorization=authorization, db=db)

@router.post("", response_model=MessageResponse)
@limiter.limit("20/minute")
async def send_message(request: Request, data: MessageCreate, current_user: dict = Depends(get_current_user_local)):
    """Send a message to another user"""
    # Get recipient info
    recipient = await db.users.find_one({"id": data.recipient_id}, {"_id": 0})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    # ============================================
    # CHECK MESSAGING PREFERENCES (venue recipient + musician sender)
    # ============================================
    # Modes supportés:
    #   - 'everyone'        : tout le monde peut envoyer (legacy default)
    #   - 'pros_only'       : musiciens PRO seulement (+ conversations existantes)
    #   - 'pro_only'        : alias legacy de 'pros_only'
    #   - 'connected_only'  : musiciens Jacks (abonnés au venue) seulement (+ existantes)
    #   - 'none'            : aucun nouveau message, seulement conversations existantes
    if recipient.get("role") == "venue" and current_user.get("role") == "musician":
        venue_profile = await db.venues.find_one({"user_id": recipient["id"]}, {"_id": 0})
        pref = (venue_profile or {}).get("allow_messages_from", "everyone")
        
        # 'everyone' (legacy) → autorisé sans condition
        if pref != "everyone":
            # Toujours autoriser si une conversation existe déjà entre les deux users
            existing_count = await db.messages.count_documents({
                "$or": [
                    {"sender_id": current_user["id"], "recipient_id": recipient["id"]},
                    {"sender_id": recipient["id"], "recipient_id": current_user["id"]},
                ]
            })
            
            if existing_count == 0:
                if pref == "none":
                    raise HTTPException(
                        status_code=403,
                        detail="Ce lieu n'accepte pas de nouveaux messages"
                    )
                elif pref in ("pros_only", "pro_only"):
                    sender_user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
                    is_pro = bool(
                        sender_user and
                        sender_user.get("subscription_tier") == "pro" and
                        sender_user.get("subscription_status") == "active"
                    )
                    if not is_pro:
                        raise HTTPException(
                            status_code=403,
                            detail="Ce lieu n'accepte que les messages des musiciens PRO"
                        )
                elif pref == "connected_only":
                    venue_id = (venue_profile or {}).get("id")
                    is_sub = False
                    if venue_id:
                        sub = await db.venue_subscriptions.find_one({
                            "venue_id": venue_id,
                            "user_id": current_user["id"]
                        })
                        is_sub = bool(sub)
                    if not is_sub:
                        raise HTTPException(
                            status_code=403,
                            detail="Ce lieu n'accepte que les messages de ses Jacks"
                        )
    
    # Get sender profile info
    sender_profile = None
    sender_image = None
    if current_user["role"] == "musician":
        sender_profile = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
        sender_image = sender_profile.get("profile_image") if sender_profile else None
    elif current_user["role"] == "venue":
        sender_profile = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
        sender_image = sender_profile.get("profile_image") if sender_profile else None

    # Build 152.19 — sender_name résilient : profil (pseudo/name) → user.name → fallback
    sender_display = (
        (sender_profile or {}).get("pseudo")
        or (sender_profile or {}).get("name")
        or current_user.get("name")
        or "Utilisateur"
    )

    message_doc = {
        "id": str(uuid.uuid4()),
        "sender_id": current_user["id"],
        "sender_name": sender_display,
        "sender_image": sender_image,
        "recipient_id": data.recipient_id,
        "recipient_name": recipient.get("name", "Unknown"),
        "subject": data.subject,
        "content": data.content,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message_doc)
    
    # Create notification for recipient
    notification_doc = {
        "id": str(uuid.uuid4()),
        "recipient_id": data.recipient_id,
        "recipient_role": recipient.get("role", "user"),
        "sender_id": current_user["id"],
        "sender_role": current_user.get("role", "user"),
        "type": "new_message",
        "title": f"Nouveau message de {sender_display}",
        "message": data.subject if data.subject else "Nouveau message",
        "link": "/messages-improved",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Check notification preferences if recipient is a venue
    from utils.notification_preferences import should_send_notification
    should_notify = True
    if recipient.get("role") == "venue":
        should_notify = await should_send_notification(data.recipient_id, "new_messages", "venue")
    
    if should_notify:
        await db.notifications.insert_one(notification_doc)
        
        # Send push notification
        try:
            from routes.push_notifications import send_push_notification
            await send_push_notification(
                user_id=data.recipient_id,
                notification_data={
                    "title": f"💬 {sender_display}",
                    "message": data.subject[:100] if data.subject else "Nouveau message",
                    "link": "/messages-improved",
                    "type": "message",
                    "id": message_doc["id"],
                    "icon": sender_image
                }
            )
        except Exception as e:
            # Don't fail the request if push notification fails
            print(f"Failed to send push notification: {e}")

        # Build 152.10 — Emergent-managed mobile push (SuprSend) — never blocks
        try:
            from routes.push import send_push
            preview = (data.content or data.subject or "Nouveau message")[:120]
            await send_push(
                recipients=[data.recipient_id],
                data={
                    "title": f"💬 {sender_display}",
                    "message": preview,
                    "action_url": "/(tabs)/messages",
                    # Build 152.18 — deeplink explicite pour SuprSend
                    "deeplink": f"jamconnexion:///messages/{current_user['id']}",
                    "type": "new_message",
                    "message_id": message_doc["id"],
                    "sender_id": current_user["id"],
                },
                idempotency_key=f"msg-{message_doc['id']}",
            )
        except Exception as e:
            print(f"Push failed (new_message): {e}")
    
    return MessageResponse(**message_doc)

@router.get("/inbox", response_model=List[MessageResponse])
async def get_inbox(
    limit: int = 100, 
    offset: int = 0,
    current_user: dict = Depends(get_current_user_local)
):
    """Get all messages received by current user with pagination"""
    messages = await db.messages.find(
        {"recipient_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    return [MessageResponse(**m) for m in messages]

@router.get("/sent", response_model=List[MessageResponse])
async def get_sent_messages(
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(get_current_user_local)
):
    """Get all messages sent by current user with pagination"""
    messages = await db.messages.find(
        {"sender_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    return [MessageResponse(**m) for m in messages]

@router.get("/conversation/{partner_id}", response_model=List[MessageResponse])
async def get_conversation(
    partner_id: str,
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(get_current_user_local)
):
    """Get messages in a conversation with a specific partner (with pagination for infinite scroll)"""
    messages = await db.messages.find(
        {
            "$or": [
                {"sender_id": current_user["id"], "recipient_id": partner_id},
                {"sender_id": partner_id, "recipient_id": current_user["id"]}
            ]
        },
        {"_id": 0}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    # Return in chronological order (oldest first)
    return [MessageResponse(**m) for m in reversed(messages)]


@router.get("/search", response_model=List[MessageResponse])
async def search_messages(
    query: str,
    partner_id: str = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user_local)
):
    """Search messages by content or subject"""
    # Build search filter
    search_filter = {
        "$or": [
            {"sender_id": current_user["id"]},
            {"recipient_id": current_user["id"]}
        ],
        "$and": [
            {
                "$or": [
                    {"content": {"$regex": query, "$options": "i"}},
                    {"subject": {"$regex": query, "$options": "i"}}
                ]
            }
        ]
    }
    
    # Filter by partner if specified
    if partner_id:
        search_filter["$or"] = [
            {"sender_id": current_user["id"], "recipient_id": partner_id},
            {"sender_id": partner_id, "recipient_id": current_user["id"]}
        ]
    
    messages = await db.messages.find(
        search_filter,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return [MessageResponse(**m) for m in messages]

@router.put("/{message_id}/read")
async def mark_as_read(message_id: str, current_user: dict = Depends(get_current_user_local)):
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
async def delete_conversation(partner_id: str, current_user: dict = Depends(get_current_user_local)):
    """Delete all messages in a conversation with a partner"""
    result = await db.messages.delete_many({
        "$or": [
            {"sender_id": current_user["id"], "recipient_id": partner_id},
            {"sender_id": partner_id, "recipient_id": current_user["id"]}
        ]
    })
    
    return {"message": f"{result.deleted_count} messages deleted"}
