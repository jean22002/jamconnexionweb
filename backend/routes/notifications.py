from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import List
import uuid

from models import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

# DB will be injected by the main server
db = None

def set_db(database):
    global db
    db = database

async def get_current_user_local(authorization: str = Header(None)):
    """Import get_current_user locally to avoid circular imports"""
    from utils import get_current_user
    from fastapi import Header
    return await get_current_user(authorization, db)

@router.get("", response_model=List[NotificationResponse])
async def get_notifications(current_user: dict = Depends(get_current_user_local)):
    """Get all notifications for current user"""
    notifications = await db.notifications.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return [NotificationResponse(**n) for n in notifications]

@router.get("/unread/count")
async def get_unread_count(current_user: dict = Depends(get_current_user_local)):
    """Get count of unread notifications"""
    count = await db.notifications.count_documents({
        "user_id": current_user["id"],
        "read": False
    })
    
    return {"count": count}

@router.put("/{notification_id}/read")
async def mark_notification_as_read(notification_id: str, current_user: dict = Depends(get_current_user_local)):
    """Mark a notification as read"""
    notification = await db.notifications.find_one({"id": notification_id}, {"_id": 0})
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if notification["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.notifications.update_one(
        {"id": notification_id},
        {"$set": {"read": True}}
    )
    
    return {"message": "Notification marked as read"}

@router.put("/read-all")
async def mark_all_as_read(current_user: dict = Depends(get_current_user_local)):
    """Mark all notifications as read"""
    result = await db.notifications.update_many(
        {"user_id": current_user["id"], "read": False},
        {"$set": {"read": True}}
    )
    
    return {"message": f"{result.modified_count} notifications marked as read"}

@router.delete("/{notification_id}")
async def delete_notification(notification_id: str, current_user: dict = Depends(get_current_user_local)):
    """Delete a notification"""
    notification = await db.notifications.find_one({"id": notification_id}, {"_id": 0})
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if notification["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.notifications.delete_one({"id": notification_id})
    
    return {"message": "Notification deleted"}
