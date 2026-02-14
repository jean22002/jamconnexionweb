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
from motor.motor_asyncio import AsyncIOMotorClient

from models import (
    VenueProfile, VenueProfileResponse,
    VenueSubscription, NearbySearchRequest
)
from utils import haversine_distance, save_upload_file

router = APIRouter()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

logger = logging.getLogger(__name__)

JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret')
JWT_ALGORITHM = "HS256"

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
    
    # Remove duplicate fields from venue dict before merging
    venue_data = {k: v for k, v in venue.items() if k not in ["subscription_status", "trial_end", "trial_days_left", "subscribers_count"]}
    
    return VenueProfileResponse(
        **venue_data,
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
    
    if not venues:
        return []
    
    # Optimisation: Récupérer tous les utilisateurs en une seule requête
    user_ids = [v["user_id"] for v in venues]
    users = await db.users.find(
        {"id": {"$in": user_ids}},
        {"_id": 0, "id": 1, "subscription_status": 1}
    ).to_list(None)
    users_map = {u["id"]: u for u in users}
    
    # Optimisation: Compter tous les abonnés en une seule agrégation
    venue_ids = [v["id"] for v in venues]
    subscribers_pipeline = [
        {"$match": {"venue_id": {"$in": venue_ids}}},
        {"$group": {"_id": "$venue_id", "count": {"$sum": 1}}}
    ]
    subscribers_result = await db.venue_subscriptions.aggregate(subscribers_pipeline).to_list(None)
    subscribers_map = {item["_id"]: item["count"] for item in subscribers_result}
    
    # Construire le résultat
    result = []
    for v in venues:
        user = users_map.get(v["user_id"])
        user_subscription_status = user.get("subscription_status") if user else None
        
        if user_subscription_status in ["active", "trial"]:
            subscribers_count = subscribers_map.get(v["id"], 0)
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
    
    # Add subscription_status and subscribers_count to the venue dict
    venue["subscription_status"] = user.get("subscription_status") if user else None
    venue["subscribers_count"] = subscribers_count
    
    return VenueProfileResponse(**venue)


@router.post("/venues/nearby", response_model=List[VenueProfileResponse])
async def find_nearby_venues(request: NearbySearchRequest):
    """Find venues within radius of a given position"""
    # Récupérer seulement les champs nécessaires pour le calcul de distance
    venues = await db.venues.find(
        {},
        {"_id": 0, "id": 1, "user_id": 1, "latitude": 1, "longitude": 1, "name": 1, "city": 1, "venue_type": 1, "music_styles": 1, "address": 1, "photo_url": 1}
    ).to_list(1000)
    
    # Filtrer les venues à proximité
    nearby_venues = []
    for venue in venues:
        if venue.get("latitude") and venue.get("longitude"):
            distance = haversine_distance(
                request.latitude, request.longitude,
                venue["latitude"], venue["longitude"]
            )
            if distance <= request.radius_km:
                nearby_venues.append(venue)
    
    if not nearby_venues:
        return []
    
    # Optimisation: Récupérer tous les utilisateurs en batch
    user_ids = [v["user_id"] for v in nearby_venues]
    users = await db.users.find(
        {"id": {"$in": user_ids}},
        {"_id": 0, "id": 1, "subscription_status": 1}
    ).to_list(None)
    users_map = {u["id"]: u for u in users}
    
    # Optimisation: Compter tous les abonnés en une agrégation
    venue_ids = [v["id"] for v in nearby_venues]
    subscribers_pipeline = [
        {"$match": {"venue_id": {"$in": venue_ids}}},
        {"$group": {"_id": "$venue_id", "count": {"$sum": 1}}}
    ]
    subscribers_result = await db.venue_subscriptions.aggregate(subscribers_pipeline).to_list(None)
    subscribers_map = {item["_id"]: item["count"] for item in subscribers_result}
    
    # Construire le résultat
    nearby = []
    for venue in nearby_venues:
        user = users_map.get(venue["user_id"])
        if user and user.get("subscription_status") in ["active", "trial"]:
            subscribers_count = subscribers_map.get(venue["id"], 0)
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
    
    # Check for new badges (subscriber count for venue owner)
    try:
        from utils.badge_checker import check_and_award_badges_internal
        await check_and_award_badges_internal(db, venue["user_id"])
    except Exception as e:
        logger.warning(f"Could not check badges: {e}")
    
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
    
    return subscriptions


# ============= VENUE GALLERY =============

@router.post("/venues/me/gallery")
async def add_gallery_photo(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Add a photo to venue gallery (max 20 photos)"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can manage gallery")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Check gallery limit
    current_gallery = venue.get("gallery", [])
    if len(current_gallery) >= 20:
        raise HTTPException(status_code=400, detail="Limite de 20 photos atteinte. Supprimez des photos avant d'en ajouter.")
    
    # Upload file
    try:
        file_url = await save_upload_file(file, "gallery")
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors du téléchargement")
    
    # Add to gallery
    await db.venues.update_one(
        {"user_id": current_user["id"]},
        {"$push": {"gallery": file_url}}
    )
    
    return {"url": file_url, "message": "Photo ajoutée à la galerie"}


@router.delete("/venues/me/gallery")
async def remove_gallery_photo(photo_url: str, current_user: dict = Depends(get_current_user)):
    """Remove a photo from venue gallery"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can manage gallery")
    
    result = await db.venues.update_one(
        {"user_id": current_user["id"]},
        {"$pull": {"gallery": photo_url}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Photo not found in gallery")
    
    return {"message": "Photo supprimée de la galerie"}


# ============= VENUE SUBSCRIBERS =============

@router.get("/venues/me/subscribers")
async def get_venue_subscribers(current_user: dict = Depends(get_current_user)):
    """Get list of subscribers (musicians and melomanes) for current venue"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can view their subscribers")
    
    # Get venue profile
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Get all subscriptions for this venue
    subscriptions = await db.venue_subscriptions.find({"venue_id": venue["id"]}, {"_id": 0}).to_list(1000)
    
    # Get profiles for each subscriber
    subscribers = []
    for sub in subscriptions:
        subscriber_role = sub.get("subscriber_role", "musician")
        
        if subscriber_role == "musician":
            musician = await db.musicians.find_one({"user_id": sub["subscriber_id"]}, {"_id": 0})
            if musician:
                subscribers.append({
                    "id": musician.get("id"),
                    "user_id": musician.get("user_id"),
                    "role": "musician",
                    "pseudo": musician.get("pseudo", "Musicien"),
                    "profile_image": musician.get("profile_image"),
                    "city": musician.get("city"),
                    "department": musician.get("department"),
                    "instruments": musician.get("instruments", []),
                    "music_styles": musician.get("music_styles", []),
                    "subscribed_at": sub.get("created_at")
                })
        elif subscriber_role == "melomane":
            melomane = await db.melomanes.find_one({"user_id": sub["subscriber_id"]}, {"_id": 0})
            if melomane:
                subscribers.append({
                    "id": melomane.get("id"),
                    "user_id": melomane.get("user_id"),
                    "role": "melomane",
                    "pseudo": melomane.get("pseudo", "Mélomane"),
                    "profile_image": melomane.get("profile_picture"),  # Map to profile_image for consistency
                    "city": melomane.get("city"),
                    "favorite_styles": melomane.get("favorite_styles", []),
                    "subscribed_at": sub.get("created_at")
                })
    
    return subscribers


@router.get("/venues/me/nearby-musicians-count")
async def get_nearby_musicians_count(radius_km: float = 50, current_user: dict = Depends(get_current_user)):
    """Count musicians within a radius of the venue"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can access this")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    if not venue.get("latitude") or not venue.get("longitude"):
        return {"count": 0, "message": "Venue location not set"}
    
    # Get all musicians with location
    musicians = await db.musicians.find({
        "latitude": {"$exists": True},
        "longitude": {"$exists": True}
    }, {"_id": 0, "latitude": 1, "longitude": 1}).to_list(2000)
    
    # Count musicians within radius
    count = 0
    for musician in musicians:
        if musician.get("latitude") and musician.get("longitude"):
            distance = haversine_distance(
                venue["latitude"], venue["longitude"],
                musician["latitude"], musician["longitude"]
            )
            if distance <= radius_km:
                count += 1
    
    return {"count": count, "radius_km": radius_km}


# ============= VENUE ACTIVE EVENTS =============

@router.get("/venues/{venue_id}/active-events")
async def get_venue_active_events(venue_id: str):
    """Get all active events for a venue (jams, concerts, karaoke, spectacles)"""
    from datetime import datetime
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Get all event types
    jams = await db.jams.find({
        "venue_id": venue_id,
        "date": {"$gte": today}
    }, {"_id": 0}).sort("date", 1).to_list(50)
    
    concerts = await db.concerts.find({
        "venue_id": venue_id,
        "date": {"$gte": today}
    }, {"_id": 0}).sort("date", 1).to_list(50)
    
    karaoke = await db.karaoke.find({
        "venue_id": venue_id,
        "date": {"$gte": today}
    }, {"_id": 0}).sort("date", 1).to_list(50)
    
    spectacles = await db.spectacle.find({
        "venue_id": venue_id,
        "date": {"$gte": today}
    }, {"_id": 0}).sort("date", 1).to_list(50)
    
    # Add type to each event
    for j in jams:
        j["event_type"] = "jam"
    for c in concerts:
        c["event_type"] = "concert"
    for k in karaoke:
        k["event_type"] = "karaoke"
    for s in spectacles:
        s["event_type"] = "spectacle"
    
    # Combine and sort all events
    all_events = jams + concerts + karaoke + spectacles
    all_events.sort(key=lambda x: x.get("date", ""))
    
    return all_events


@router.get("/venues/{venue_id}/bands-played")
async def get_bands_played(venue_id: str):
    """Get list of bands that have played at this venue"""
    # Get all past concerts for this venue



# ============= MY VENUE EVENTS =============

@router.get("/venues/me/jams")
async def get_my_venue_jams(current_user: dict = Depends(get_current_user)):
    """Get all jams for my venue"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can access this")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    jams = await db.jams.find({"venue_id": venue["id"]}, {"_id": 0}).sort("date", 1).to_list(100)
    return jams


@router.get("/venues/me/concerts")
async def get_my_venue_concerts(current_user: dict = Depends(get_current_user)):
    """Get all concerts for my venue"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can access this")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    concerts = await db.concerts.find({"venue_id": venue["id"]}, {"_id": 0}).sort("date", 1).to_list(100)
    
    # Add participants count for each concert
    result = []
    for concert in concerts:
        participants_count = await db.event_participations.count_documents({
            "event_id": concert["id"],
            "event_type": "concert",
            "active": True
        })
        concert["participants_count"] = participants_count
        result.append(concert)
    
    return result


@router.get("/venues/me/karaoke")
async def get_my_venue_karaoke(current_user: dict = Depends(get_current_user)):
    """Get all karaoke events for my venue"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can access this")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    karaoke = await db.karaoke.find({"venue_id": venue["id"]}, {"_id": 0}).sort("date", 1).to_list(100)
    return karaoke


@router.get("/venues/me/spectacle")
async def get_my_venue_spectacle(current_user: dict = Depends(get_current_user)):
    """Get all spectacle events for my venue"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can access this")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    spectacles = await db.spectacle.find({"venue_id": venue["id"]}, {"_id": 0}).sort("date", 1).to_list(100)
    return spectacles


# ============= VENUE STATISTICS =============

@router.get("/venues/me/jams/profitability")
async def get_jams_profitability(current_user: dict = Depends(get_current_user)):
    """Get profitability stats for venue's jams"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can access this")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Get past jams
    today = datetime.now(timezone.utc).date().isoformat()
    past_jams = await db.jams.find({
        "venue_id": venue["id"],
        "date": {"$lt": today}
    }, {"_id": 0}).to_list(1000)
    
    total_revenue = 0
    total_costs = 0
    profitable_count = 0
    
    for jam in past_jams:
        revenue = jam.get("revenue", 0) or 0
        costs = jam.get("costs", 0) or 0
        total_revenue += revenue
        total_costs += costs
        
        if revenue > costs:
            profitable_count += 1
    
    total_profit = total_revenue - total_costs
    avg_profit_per_jam = total_profit / len(past_jams) if past_jams else 0
    profitability_rate = (profitable_count / len(past_jams) * 100) if past_jams else 0
    
    return {
        "total_jams": len(past_jams),
        "total_revenue": total_revenue,
        "total_costs": total_costs,
        "total_profit": total_profit,
        "avg_profit_per_jam": round(avg_profit_per_jam, 2),
        "profitable_count": profitable_count,
        "profitability_rate": round(profitability_rate, 2)
    }


@router.get("/venues/me/concerts/profitability")
async def get_concerts_profitability(current_user: dict = Depends(get_current_user)):
    """Get profitability stats for venue's concerts"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can access this")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Get past concerts
    today = datetime.now(timezone.utc).date().isoformat()
    past_concerts = await db.concerts.find({
        "venue_id": venue["id"],
        "date": {"$lt": today}
    }, {"_id": 0}).to_list(1000)
    
    total_revenue = 0
    total_costs = 0
    profitable_count = 0
    
    for concert in past_concerts:
        revenue = concert.get("revenue", 0) or 0
        costs = concert.get("costs", 0) or 0
        total_revenue += revenue
        total_costs += costs
        
        if revenue > costs:
            profitable_count += 1
    
    total_profit = total_revenue - total_costs
    avg_profit_per_concert = total_profit / len(past_concerts) if past_concerts else 0
    profitability_rate = (profitable_count / len(past_concerts) * 100) if past_concerts else 0
    
    return {
        "total_concerts": len(past_concerts),
        "total_revenue": total_revenue,
        "total_costs": total_costs,
        "total_profit": total_profit,
        "avg_profit_per_concert": round(avg_profit_per_concert, 2),
        "profitable_count": profitable_count,
        "profitability_rate": round(profitability_rate, 2)
    }

    today = datetime.now(timezone.utc).date().isoformat()
    
    past_concerts = await db.concerts.find({
        "venue_id": venue_id,
        "date": {"$lt": today}
    }, {"_id": 0}).to_list(1000)
    
    # Extract unique band names
    bands_played = set()
    for concert in past_concerts:
        for band in concert.get("bands", []):
            band_name = band.get("name")
            if band_name:
                bands_played.add(band_name)
    
    return {"bands": sorted(list(bands_played)), "count": len(bands_played)}

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


@router.post("/venues/me/notify-subscribers")
async def notify_subscribers(
    message: dict,
    current_user: dict = Depends(get_current_user)
):
    """Send notification to venue subscribers (Jacks)"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can send notifications")
    
    # Get venue profile
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    venue_id = venue["id"]
    notification_message = message.get("message", "")
    
    if not notification_message:
        raise HTTPException(status_code=400, detail="Message is required")
    
    # Get all subscribers
    subscriptions = await db.venue_subscriptions.find({"venue_id": venue_id}, {"_id": 0}).to_list(1000)
    
    # Check if there are any subscribers
    if len(subscriptions) == 0:
        raise HTTPException(
            status_code=400,
            detail="Aucun abonné (Jack) trouvé. Personne ne recevra la notification."
        )
    
    # Create notifications for each subscriber
    notifications_created = 0
    for sub in subscriptions:
        try:
            notification = {
                "id": str(uuid.uuid4()),
                "recipient_id": sub["subscriber_id"],
                "recipient_role": sub["subscriber_role"],
                "sender_id": current_user["id"],
                "sender_role": "venue",
                "type": "broadcast",
                "message": notification_message,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "read": False
            }
            result = await db.notifications.insert_one(notification)
            logger.info(f"Notification inserted: {result.inserted_id}")
            notifications_created += 1
        except Exception as e:
            logger.error(f"Failed to insert notification: {e}")
    
    return {"recipients_count": notifications_created, "message": "Notifications sent successfully"}


@router.post("/venues/me/broadcast-notification")
async def broadcast_notification(
    message: dict,
    current_user: dict = Depends(get_current_user)
):
    """Send notification to nearby musicians"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can send notifications")
    
    # Get venue profile
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    notification_message = message.get("message", "")
    radius = message.get("radius", 100)  # km
    
    if not notification_message:
        raise HTTPException(status_code=400, detail="Message is required")
    
    if not venue.get("latitude") or not venue.get("longitude"):
        raise HTTPException(status_code=400, detail="Venue location not set")
    
    venue_lat = venue["latitude"]
    venue_lon = venue["longitude"]
    
    # Find nearby musicians
    all_musicians = await db.musicians.find({}, {"_id": 0}).to_list(10000)
    nearby_musicians = []
    
    for musician in all_musicians:
        if musician.get("latitude") and musician.get("longitude"):
            distance = haversine_distance(
                venue_lat, venue_lon,
                musician["latitude"], musician["longitude"]
            )
            if distance <= radius:
                nearby_musicians.append(musician)
    
    # Check if there are any nearby musicians
    if len(nearby_musicians) == 0:
        raise HTTPException(
            status_code=400,
            detail=f"Aucun musicien trouvé dans un rayon de {radius} km. Essayez d'augmenter le rayon de recherche."
        )
    
    # Create notifications for nearby musicians
    notifications_created = 0
    for musician in nearby_musicians:
        notification = {
            "id": str(uuid.uuid4()),
            "recipient_id": musician["user_id"],
            "recipient_role": "musician",
            "sender_id": current_user["id"],
            "sender_role": "venue",
            "type": "broadcast",
            "message": notification_message,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "read": False
        }
        await db.notifications.insert_one(notification)
        notifications_created += 1
    
    return {"recipients_count": notifications_created, "message": "Notifications sent successfully"}


@router.post("/venues/me/notify-all")
async def notify_all(
    message: dict,
    current_user: dict = Depends(get_current_user)
):
    """Send notification to both subscribers AND nearby musicians"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can send notifications")
    
    # Get venue profile
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    venue_id = venue["id"]
    notification_message = message.get("message", "")
    radius = message.get("radius", 100)  # km
    
    if not notification_message:
        raise HTTPException(status_code=400, detail="Message is required")
    
    # Get all subscribers
    subscriptions = await db.venue_subscriptions.find({"venue_id": venue_id}, {"_id": 0}).to_list(1000)
    subscriber_ids = {sub["subscriber_id"]: sub.get("subscriber_role", "musician") for sub in subscriptions}
    
    # Get venue location and find nearby musicians
    nearby_musician_ids = {}
    if venue.get("latitude") and venue.get("longitude"):
        venue_lat = venue["latitude"]
        venue_lon = venue["longitude"]
        
        all_musicians = await db.musicians.find({}, {"_id": 0}).to_list(10000)
        
        for musician in all_musicians:
            if musician.get("latitude") and musician.get("longitude"):
                distance = haversine_distance(
                    venue_lat, venue_lon,
                    musician["latitude"], musician["longitude"]
                )
                if distance <= radius:
                    nearby_musician_ids[musician["user_id"]] = "musician"
    
    # Combine both sets (subscribers + nearby musicians, avoiding duplicates)
    all_recipient_ids = {**nearby_musician_ids, **subscriber_ids}  # subscriber_ids overwrites if duplicate
    
    # Check if there are any recipients
    if len(all_recipient_ids) == 0:
        raise HTTPException(
            status_code=400, 
            detail="Aucun destinataire trouvé. Vérifiez que vous avez des abonnés ou que des musiciens sont à proximité."
        )
    
    # Create notifications for all recipients
    notifications_created = 0
    for recipient_id, recipient_role in all_recipient_ids.items():
        notification = {
            "id": str(uuid.uuid4()),
            "recipient_id": recipient_id,
            "recipient_role": recipient_role,
            "sender_id": current_user["id"],
            "sender_role": "venue",
            "type": "broadcast",
            "message": notification_message,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "read": False
        }
        await db.notifications.insert_one(notification)
        notifications_created += 1
    
    return {"recipients_count": notifications_created, "message": "Notifications sent successfully"}


@router.get("/venues/me/broadcast-history")
async def get_broadcast_history(current_user: dict = Depends(get_current_user)):
    """Get broadcast notification history for this venue"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can view broadcast history")
    
    # Get all notifications sent by this venue (grouped by message)
    # We'll aggregate them to show unique messages with recipient counts
    notifications = await db.notifications.find({
        "sender_id": current_user["id"],
        "sender_role": "venue",
        "type": "broadcast"
    }, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Group by message and created_at to show unique broadcasts
    history = {}
    for notif in notifications:
        # Create a key based on message and approximate time (rounded to minute)
        created_at = notif.get("created_at", "")
        message = notif.get("message", "")
        key = f"{message}_{created_at[:16]}"  # Group by minute
        
        if key not in history:
            history[key] = {
                "id": key,  # Add unique ID for deletion
                "message": message,
                "created_at": created_at,
                "recipients_count": 0
            }
        history[key]["recipients_count"] += 1
    
    # Convert to list and sort by date
    result = sorted(history.values(), key=lambda x: x["created_at"], reverse=True)
    return result


@router.delete("/venues/me/broadcast-history/{broadcast_id}")
async def delete_broadcast_from_history(broadcast_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a broadcast notification from history (deletes all notifications with matching message and time)"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can delete broadcast history")
    
    # Parse the broadcast_id to extract message and time
    # Format: {message}_{timestamp[:16]}
    try:
        # Find the last underscore that separates message from timestamp
        parts = broadcast_id.rsplit("_", 1)
        if len(parts) != 2:
            raise HTTPException(status_code=400, detail="Invalid broadcast ID format")
        
        message = parts[0]
        time_prefix = parts[1]
        
        # Delete all notifications matching this broadcast (message + time window)
        result = await db.notifications.delete_many({
            "sender_id": current_user["id"],
            "sender_role": "venue",
            "type": "broadcast",
            "message": message,
            "created_at": {"$regex": f"^{time_prefix}"}
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Broadcast not found")
        
        return {
            "message": f"Broadcast deleted successfully ({result.deleted_count} notifications removed)",
            "deleted_count": result.deleted_count
        }
    except Exception as e:
        logger.error(f"Error deleting broadcast: {e}")
        raise HTTPException(status_code=500, detail="Error deleting broadcast")


@router.delete("/venues/me/broadcast-history")
async def delete_all_broadcast_history(current_user: dict = Depends(get_current_user)):
    """Delete ALL broadcast notifications from history for this venue"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can delete broadcast history")
    
    try:
        # Delete all broadcast notifications sent by this venue
        result = await db.notifications.delete_many({
            "sender_id": current_user["id"],
            "sender_role": "venue",
            "type": "broadcast"
        })
        
        return {
            "message": f"All broadcast history deleted successfully ({result.deleted_count} notifications removed)",
            "deleted_count": result.deleted_count
        }
    except Exception as e:
        logger.error(f"Error deleting all broadcast history: {e}")
        raise HTTPException(status_code=500, detail="Error deleting broadcast history")

