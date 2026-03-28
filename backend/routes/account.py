from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os

from utils import get_current_user

router = APIRouter(prefix="/account", tags=["Account Management"])

mongo_url = os.environ.get('MONGO_URL_PRODUCTION', os.environ['MONGO_URL']) if os.environ.get('ENVIRONMENT') == 'production' else os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

@router.post("/suspend")
async def suspend_account(current_user: dict = Depends(get_current_user)):
    """Suspend user account for up to 60 days"""
    suspend_until = (datetime.now(timezone.utc) + timedelta(days=60)).isoformat()
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {
            "account_status": "suspended",
            "suspended_until": suspend_until,
            "suspended_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "message": "Compte suspendu avec succès",
        "suspended_until": suspend_until,
        "days": 60
    }

@router.delete("/delete")
async def delete_account(current_user: dict = Depends(get_current_user)):
    """Permanently delete user account and all associated data"""
    user_id = current_user["id"]
    role = current_user["role"]
    
    if role == "venue":
        # Find venue
        venue = await db.venues.find_one({"user_id": user_id}, {"_id": 0})
        if venue:
            venue_id = venue["id"]
            
            # Delete all venue-related data
            await db.jams.delete_many({"venue_id": venue_id})
            await db.concerts.delete_many({"venue_id": venue_id})
            await db.karaokes.delete_many({"venue_id": venue_id})
            await db.spectacles.delete_many({"venue_id": venue_id})
            await db.planning_slots.delete_many({"venue_id": venue_id})
            await db.applications.delete_many({"venue_id": venue_id})
            await db.reviews.delete_many({"venue_id": venue_id})
            await db.venue_subscriptions.delete_many({"venue_id": venue_id})
            await db.event_participations.delete_many({"venue_id": venue_id})
            
            # Delete venue profile
            await db.venues.delete_one({"user_id": user_id})
    
    elif role == "musician":
        # Find musician
        musician = await db.musicians.find_one({"user_id": user_id}, {"_id": 0})
        if musician:
            musician_id = musician["id"]
            
            # Delete all musician-related data
            await db.applications.delete_many({"musician_id": musician_id})
            await db.event_participations.delete_many({"musician_id": musician_id})
            await db.venue_subscriptions.delete_many({"musician_id": musician_id})
            await db.friend_requests.delete_many({
                "$or": [
                    {"from_user_id": user_id},
                    {"to_user_id": user_id}
                ]
            })
            
            # Delete musician profile
            await db.musicians.delete_one({"user_id": user_id})
    
    # Delete notifications
    await db.notifications.delete_many({"user_id": user_id})
    
    # Delete messages
    await db.messages.delete_many({
        "$or": [
            {"from_user_id": user_id},
            {"to_user_id": user_id}
        ]
    })
    
    # Finally, delete user account
    await db.users.delete_one({"id": user_id})
    
    return {"message": "Compte supprimé définitivement"}

@router.get("/status")
async def get_account_status(current_user: dict = Depends(get_current_user)):
    """Get current account subscription status"""
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate trial days left for venues
    trial_days_left = None
    if user.get("role") == "venue" and user.get("trial_end"):
        try:
            trial_end = datetime.fromisoformat(user["trial_end"].replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            days_left = (trial_end - now).days
            trial_days_left = max(0, days_left)
        except:
            trial_days_left = 0
    
    return {
        "subscription_status": user.get("subscription_status"),
        "has_active_subscription": user.get("has_active_subscription", False),
        "trial_end": user.get("trial_end"),
        "trial_days_left": trial_days_left
    }
