"""
Venues router - Handles venue profiles and subscriptions
"""
from fastapi import APIRouter, HTTPException, Depends, Header, UploadFile, File
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
import os
import logging

from models import (
    VenueProfile, VenueProfileResponse,
    VenueSubscription, NearbySearchRequest
)
from utils import haversine_distance, save_upload_file

router = APIRouter()
db = None
logger = logging.getLogger(__name__)

JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret')
JWT_ALGORITHM = "HS256"

def set_db(database):
    global db
    db = database

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ============= VENUE PROFILES =============

@router.post("/venues", response_model=VenueProfileResponse)
async def create_venue_profile(data: VenueProfile, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can create venue profiles")
    
    existing = await db.venues.find_one({"user_id": current_user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Venue profile already exists")
    
    venue_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    venue_doc = {
        "id": venue_id,
        "user_id": current_user["id"],
        **data.model_dump(),
        "created_at": now
    }
    
    await db.venues.insert_one(venue_doc)
    
    return VenueProfileResponse(
        **venue_doc,
        subscription_status=current_user.get("subscription_status"),
        subscribers_count=0
    )


@router.put("/venues", response_model=VenueProfileResponse)
async def update_venue_profile(data: VenueProfile, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can update venue profiles")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    await db.venues.update_one(
        {"user_id": current_user["id"]},
        {"$set": data.model_dump()}
    )
    
    updated = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    subscribers_count = await db.venue_subscriptions.count_documents({"venue_id": venue["id"]})
    
    # Update the dict
    updated["subscription_status"] = current_user.get("subscription_status")
    updated["subscribers_count"] = subscribers_count
    
    return VenueProfileResponse(**updated)


@router.get("/venues/me", response_model=VenueProfileResponse)
async def get_my_venue(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can access this")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    subscribers_count = await db.venue_subscriptions.count_documents({"venue_id": venue["id"]})
    
    # Calculate trial days left and check access
    trial_days_left = None
    subscription_status = current_user.get("subscription_status")
    trial_end = current_user.get("trial_end")
    has_active_subscription = current_user.get("has_active_subscription", False)
    
    # Vérification selon la logique : has_active_subscription OU trial_end
    if has_active_subscription:
        # Abonnement actif : accès OK
        subscription_status = "active"
    elif subscription_status == "trial" and trial_end:
        from datetime import timedelta
        trial_end_date = datetime.fromisoformat(trial_end)
        now = datetime.now(timezone.utc)
        days_left = (trial_end_date - now).days
        trial_days_left = max(0, days_left)
        
        # Update status to expired if trial ended
        if days_left < 0:
            subscription_status = "expired"
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$set": {"subscription_status": "expired"}}
            )
    
    return VenueProfileResponse(
        **venue,
        subscription_status=subscription_status,
        trial_end=trial_end,
        trial_days_left=trial_days_left,
        subscribers_count=subscribers_count
    )


@router.get("/venues", response_model=List[VenueProfileResponse])
async def list_venues(city: Optional[str] = None, style: Optional[str] = None):
    query = {}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if style:
        query["music_styles"] = {"$in": [style]}
    
    venues = await db.venues.find(query, {"_id": 0}).to_list(100)
    
    result = []
    for v in venues:
        user = await db.users.find_one({"id": v["user_id"]}, {"_id": 0})
        user_subscription_status = user.get("subscription_status") if user else None
        if user_subscription_status in ["active", "trial"]:
            subscribers_count = await db.venue_subscriptions.count_documents({"venue_id": v["id"]})
            v["subscription_status"] = user_subscription_status
            v["subscribers_count"] = subscribers_count
            result.append(VenueProfileResponse(**v))
    
    return result


@router.get("/venues/{venue_id}", response_model=VenueProfileResponse)
async def get_venue(venue_id: str):
    venue = await db.venues.find_one({"id": venue_id}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    user = await db.users.find_one({"id": venue["user_id"]}, {"_id": 0})
    subscribers_count = await db.venue_subscriptions.count_documents({"venue_id": venue_id})
    
    return VenueProfileResponse(
        **venue,
        subscription_status=user.get("subscription_status") if user else None,
        subscribers_count=subscribers_count
    )


@router.post("/venues/nearby", response_model=List[VenueProfileResponse])
async def find_nearby_venues(request: NearbySearchRequest):
    """Find venues within radius of a given position"""
    venues = await db.venues.find({}, {"_id": 0}).to_list(1000)
    
    nearby = []
    for venue in venues:
        if venue.get("latitude") and venue.get("longitude"):
            distance = haversine_distance(
                request.latitude, request.longitude,
                venue["latitude"], venue["longitude"]
            )
            if distance <= request.radius_km:
                # Check if user is active
                user = await db.users.find_one({"id": venue["user_id"]}, {"_id": 0})
                if user and user.get("subscription_status") in ["active", "trial"]:
                    subscribers_count = await db.venue_subscriptions.count_documents({"venue_id": venue["id"]})
                    venue_resp = VenueProfileResponse(
                        **venue, 
                        subscription_status=user.get("subscription_status"),
                        subscribers_count=subscribers_count
                    )
                    nearby.append(venue_resp)
    
    return nearby


# ============= VENUE SUBSCRIPTIONS =============

@router.post("/venues/{venue_id}/subscribe")
async def subscribe_to_venue(venue_id: str, current_user: dict = Depends(get_current_user)):
    """Subscribe to a venue (musicians and melomanes can subscribe)"""
    if current_user["role"] not in ["musician", "melomane"]:
        raise HTTPException(status_code=403, detail="Only musicians and melomanes can subscribe to venues")
    
    venue = await db.venues.find_one({"id": venue_id}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    # Check if already subscribed
    existing = await db.venue_subscriptions.find_one({
        "venue_id": venue_id,
        "subscriber_id": current_user["id"]
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already subscribed to this venue")
    
    # Create subscription
    subscription_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    subscription_doc = {
        "id": subscription_id,
        "venue_id": venue_id,
        "subscriber_id": current_user["id"],
        "subscriber_role": current_user["role"],
        "created_at": now
    }
    
    await db.venue_subscriptions.insert_one(subscription_doc)
    
    return {"message": "Successfully subscribed to venue", "subscription_id": subscription_id}


@router.delete("/venues/{venue_id}/unsubscribe")
async def unsubscribe_from_venue(venue_id: str, current_user: dict = Depends(get_current_user)):
    """Unsubscribe from a venue"""
    result = await db.venue_subscriptions.delete_one({
        "venue_id": venue_id,
        "subscriber_id": current_user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    return {"message": "Successfully unsubscribed from venue"}


@router.get("/venues/{venue_id}/subscription-status")
async def get_subscription_status(venue_id: str, current_user: dict = Depends(get_current_user)):
    """Check if current user is subscribed to a venue"""
    subscription = await db.venue_subscriptions.find_one({
        "venue_id": venue_id,
        "subscriber_id": current_user["id"]
    })
    
    return {"subscribed": subscription is not None}


@router.get("/my-subscriptions")
async def get_my_subscriptions(current_user: dict = Depends(get_current_user)):
    """Get all venues the current user is subscribed to"""
    subscriptions = await db.venue_subscriptions.find(
        {"subscriber_id": current_user["id"]},
        {"_id": 0}
    ).to_list(1000)
    
    result = []
    for sub in subscriptions:
        venue = await db.venues.find_one({"id": sub["venue_id"]}, {"_id": 0})
        if venue:
            user = await db.users.find_one({"id": venue["user_id"]}, {"_id": 0})
            subscribers_count = await db.venue_subscriptions.count_documents({"venue_id": venue["id"]})
            venue_data = VenueProfileResponse(
                **venue,
                subscription_status=user.get("subscription_status") if user else None,
                subscribers_count=subscribers_count
            )
            result.append(venue_data)
    
    return result
