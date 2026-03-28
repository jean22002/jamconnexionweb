"""
Venues router - Handles venue profiles and subscriptions
"""
from fastapi import APIRouter, HTTPException, Depends, Header, UploadFile, File, Query
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
import os
import logging
import httpx
from motor.motor_asyncio import AsyncIOMotorClient

from models import (
    VenueProfile, VenueProfileResponse,
    VenueSubscription, NearbySearchRequest
)
from utils import haversine_distance, save_upload_file

router = APIRouter()

# Geocoding function using Nominatim (OpenStreetMap)
async def geocode_city(city: str, address: str = None) -> tuple:
    """Geocode a city/address to lat/lng using Nominatim"""
    if not city:
        return None, None
    query = f"{address}, {city}, France" if address else f"{city}, France"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": query, "format": "json", "limit": 1, "countrycodes": "fr"},
                headers={"User-Agent": "JamConnexion/1.0"},
                timeout=5.0
            )
            results = resp.json()
            if results:
                return float(results[0]["lat"]), float(results[0]["lon"])
    except Exception as e:
        logger.warning(f"Geocoding failed for '{query}': {e}")
    return None, None

# MongoDB connection - Use production URL if ENVIRONMENT is production
environment = os.environ.get('ENVIRONMENT', 'development')
if environment == 'production':
    mongo_url = os.environ.get('MONGO_URL_PRODUCTION', os.environ['MONGO_URL'])
else:
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
    
    # DEBUG: Log les images reçues
    logger.info(f"🔍 CREATE VENUE - Images received: profile={data.profile_image}, cover={data.cover_image}")
    
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
    
    # Geocode city if coordinates are missing or zero
    if not venue_doc.get("latitude") or not venue_doc.get("longitude"):
        lat, lng = await geocode_city(venue_doc.get("city"), venue_doc.get("address"))
        if lat and lng:
            venue_doc["latitude"] = lat
            venue_doc["longitude"] = lng
            logger.info(f"Geocoded {venue_doc.get('city')} -> [{lat}, {lng}]")
    
    logger.info(f"✅ VENUE CREATED - Images in doc: profile={venue_doc.get('profile_image')}, cover={venue_doc.get('cover_image')}")
    
    await db.venues.insert_one(venue_doc)
    
    return VenueProfileResponse(
        **venue_doc,
        subscription_status=current_user.get("subscription_status"),
        subscribers_count=0
    )


@router.put("/venues", response_model=VenueProfileResponse)
async def update_venue_profile(data: VenueProfile, current_user: dict = Depends(get_current_user)):
    # Permettre aux venues ET aux admins de modifier
    if current_user["role"] not in ["venue", "admin"]:
        raise HTTPException(status_code=403, detail="Only venue accounts can update venue profiles")
    
    # DEBUG: Log les images reçues
    logger.info(f"🔍 UPDATE VENUE - Images received: profile={data.profile_image}, cover={data.cover_image}")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    update_data = data.model_dump()
    
    # Geocode city if coordinates are missing or zero
    if not update_data.get("latitude") or not update_data.get("longitude"):
        lat, lng = await geocode_city(update_data.get("city"), update_data.get("address"))
        if lat and lng:
            update_data["latitude"] = lat
            update_data["longitude"] = lng
            logger.info(f"Geocoded {update_data.get('city')} -> [{lat}, {lng}]")
    
    await db.venues.update_one(
        {"user_id": current_user["id"]},
        {"$set": update_data}
    )
    
    updated = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    logger.info(f"✅ VENUE UPDATED - Images in DB: profile={updated.get('profile_image')}, cover={updated.get('cover_image')}")
    
    subscribers_count = await db.venue_subscriptions.count_documents({"venue_id": venue["id"]})
    
    # Update the dict
    updated["subscription_status"] = current_user.get("subscription_status")
    updated["subscribers_count"] = subscribers_count
    
    return VenueProfileResponse(**updated)


@router.put("/venues/me/reviews-visibility")
async def toggle_reviews_visibility(show_reviews: bool, current_user: dict = Depends(get_current_user)):
    """Toggle the visibility of reviews for a venue"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can modify review visibility")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Update the show_reviews field
    await db.venues.update_one(
        {"user_id": current_user["id"]},
        {"$set": {"show_reviews": show_reviews}}
    )
    
    return {"message": "Reviews visibility updated", "show_reviews": show_reviews}


@router.get("/venues/me", response_model=VenueProfileResponse)
async def get_my_venue(current_user: dict = Depends(get_current_user)):
    # Permettre aux venues ET aux admins d'accéder
    if current_user["role"] not in ["venue", "admin"]:
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
async def list_venues(
    city: Optional[str] = None,
    style: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page (max 100)")
):
    """Get venues with pagination and filters"""
    query = {}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if style:
        query["music_styles"] = {"$in": [style]}
    
    # Calculate pagination
    skip = (page - 1) * limit
    
    # Projection: only load necessary fields for list view
    projection = {
        "_id": 0,
        "id": 1,
        "user_id": 1,
        "name": 1,
        "city": 1,
        "department": 1,
        "region": 1,
        "country": 1,
        "postal_code": 1,
        "profile_image": 1,
        "cover_image": 1,
        "description": 1,
        "music_styles": 1,
        "address": 1,
        "location": 1,
        "latitude": 1,
        "longitude": 1,
        "created_at": 1,
        "phone": 1,
        "email": 1,
        "website": 1
    }
    
    # Get paginated venues
    venues = await db.venues.find(query, projection).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    if not venues:
        return []
    
    # Import de la fonction is_user_online
    from routes.online_status import is_user_online
    
    # Optimisation: Récupérer tous les utilisateurs en une seule requête
    user_ids = [v["user_id"] for v in venues]
    users = await db.users.find(
        {"id": {"$in": user_ids}},
        {"_id": 0, "id": 1, "online_status_mode": 1, "manual_online_status": 1, "subscription_status": 1}
    ).to_list(None)
    users_map = {u["id"]: u for u in users}
    
    # Filtrer UNIQUEMENT ceux qui sont EXPLICITEMENT hors ligne (mode disabled OU manual+offline)
    visible_venues = []
    for v in venues:
        user = users_map.get(v["user_id"])
        if user:
            mode = user.get("online_status_mode", "auto")
            # Masquer SEULEMENT si :
            # 1. Mode disabled (utilisateur a choisi d'être invisible)
            # 2. Mode manual ET manual_status = False (utilisateur a choisi hors ligne)
            if mode == "disabled":
                continue  # Masquer cet établissement
            if mode == "manual" and not user.get("manual_online_status", False):
                continue  # Masquer cet établissement
            # Sinon, afficher (mode auto ou mode manual avec status=true)
        visible_venues.append(v)
    
    venues = visible_venues
    
    if not venues:
        return []
    
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
    """Get all venues the current user is subscribed to with full venue details"""
    pipeline = [
        # Match subscriptions for current user
        {
            "$match": {"subscriber_id": current_user["id"]}
        },
        # Join with venues collection
        {
            "$lookup": {
                "from": "venues",
                "localField": "venue_id",
                "foreignField": "id",
                "as": "venue_details"
            }
        },
        # Unwind venue details (convert array to object)
        {
            "$unwind": {
                "path": "$venue_details",
                "preserveNullAndEmptyArrays": False
            }
        },
        # Project fields needed by frontend
        {
            "$project": {
                "_id": 0,
                "id": 1,
                "venue_id": 1,
                "subscriber_id": 1,
                "subscriber_role": 1,
                "created_at": 1,
                "venue_name": "$venue_details.name",
                "venue_image": "$venue_details.profile_image",
                "city": "$venue_details.city",
                "department": "$venue_details.department"
            }
        }
    ]
    
    subscriptions = await db.venue_subscriptions.aggregate(pipeline).to_list(1000)
    
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
    
    # Get all musicians with location (profile or temporary)
    musicians = await db.musicians.find({}, {"_id": 0}).to_list(2000)
    
    # Count musicians within radius
    count = 0
    for musician in musicians:
        # Use temporary location if active and not expired
        musician_lat = None
        musician_lon = None
        
        if musician.get("temporary_location_enabled"):
            expires = musician.get("temporary_location_expires")
            if expires:
                try:
                    expires_dt = datetime.fromisoformat(expires)
                    if datetime.now(timezone.utc) <= expires_dt:
                        musician_lat = musician.get("temporary_latitude")
                        musician_lon = musician.get("temporary_longitude")
                except:
                    pass
        
        # Fallback to profile location
        if not musician_lat or not musician_lon:
            musician_lat = musician.get("latitude")
            musician_lon = musician.get("longitude")
        
        if musician_lat and musician_lon:
            distance = haversine_distance(
                venue["latitude"], venue["longitude"],
                musician_lat, musician_lon
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




@router.get("/venues/me/past-events")
async def get_my_past_events(authorization: str = Header(None)):
    """Récupère tous les événements passés de l'établissement avec données financières"""
    try:
        user = await get_current_user(authorization)
        if user["role"] != "venue":
            raise HTTPException(status_code=403, detail="Accès réservé aux établissements")
        
        venue_id = user["id"]
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Récupérer tous les types d'événements passés
        concerts = await db.concerts.find({
            "venue_id": venue_id,
            "date": {"$lt": today}
        }, {"_id": 0}).sort("date", -1).to_list(100)
        
        jams = await db.jams.find({
            "venue_id": venue_id,
            "date": {"$lt": today}
        }, {"_id": 0}).sort("date", -1).to_list(100)
        
        karaokes = await db.karaokes.find({
            "venue_id": venue_id,
            "date": {"$lt": today}
        }, {"_id": 0}).sort("date", -1).to_list(100)
        
        spectacles = await db.spectacles.find({
            "venue_id": venue_id,
            "date": {"$lt": today}
        }, {"_id": 0}).sort("date", -1).to_list(100)
        
        # Transformer les données pour correspondre au format attendu par le frontend
        def format_event(event, event_type):
            # Calculer revenue et profit selon le type
            if event_type == "concert":
                revenue = event.get("total_revenue", 0)
                expenses = event.get("expenses", 0) + event.get("artist_payment", 0)
                profit = event.get("net_profit", 0)
            elif event_type in ["jam", "karaoke"]:
                revenue = event.get("bar_revenue", 0)
                expenses = event.get("expenses", 0) + event.get("host_payment", 0)
                profit = event.get("net_profit", 0)
            else:  # spectacle
                revenue = event.get("total_revenue", 0)
                expenses = event.get("expenses", 0) + event.get("artist_payment", 0)
                profit = event.get("net_profit", 0)
            
            # Créer l'objet profitability
            event["profitability"] = {
                "revenue": revenue,
                "expenses": expenses,
                "profit": profit,
                "notes": ""
            }
            event["type"] = event_type
            return event
        
        # Ajouter le type d'événement et formater
        concerts = [format_event(c, "concert") for c in concerts]
        jams = [format_event(j, "jam") for j in jams]
        karaokes = [format_event(k, "karaoke") for k in karaokes]
        spectacles = [format_event(s, "spectacle") for s in spectacles]
        
        # Combiner et trier par date
        all_events = concerts + jams + karaokes + spectacles
        all_events.sort(key=lambda x: x["date"], reverse=True)
        
        return all_events
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching past events: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/venues/me/profitability-stats")
async def get_profitability_stats(authorization: str = Header(None)):
    """Statistiques de rentabilité pour l'établissement"""
    try:
        user = await get_current_user(authorization)
        if user["role"] != "venue":
            raise HTTPException(status_code=403, detail="Accès réservé aux établissements")
        
        venue_id = user["id"]
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Agrégation pour calculer les totaux
        pipeline = [
            {"$match": {"venue_id": venue_id, "date": {"$lt": today}}},
            {"$group": {
                "_id": None,
                "total_revenue": {"$sum": {"$ifNull": ["$total_revenue", "$bar_revenue", 0]}},
                "total_expenses": {"$sum": {"$ifNull": ["$expenses", 0]}},
                "total_profit": {"$sum": {"$ifNull": ["$net_profit", 0]}},
                "event_count": {"$sum": 1}
            }},
            {"$project": {
                "_id": 0,
                "total_revenue": 1,
                "total_expenses": 1,
                "total_profit": 1,
                "event_count": 1
            }}
        ]
        
        concerts_stats = await db.concerts.aggregate(pipeline).to_list(1)
        jams_stats = await db.jams.aggregate(pipeline).to_list(1)
        karaokes_stats = await db.karaokes.aggregate(pipeline).to_list(1)
        spectacles_stats = await db.spectacles.aggregate(pipeline).to_list(1)
        
        def get_stats(stats_list):
            if stats_list:
                return stats_list[0]
            return {"total_revenue": 0, "total_expenses": 0, "total_profit": 0, "event_count": 0}
        
        concerts = get_stats(concerts_stats)
        jams = get_stats(jams_stats)
        karaokes = get_stats(karaokes_stats)
        spectacles = get_stats(spectacles_stats)
        
        return {
            "concerts": concerts,
            "jams": jams,
            "karaokes": karaokes,
            "spectacles": spectacles,
            "total": {
                "revenue": concerts["total_revenue"] + jams["total_revenue"] + karaokes["total_revenue"] + spectacles["total_revenue"],
                "expenses": concerts["total_expenses"] + jams["total_expenses"] + karaokes["total_expenses"] + spectacles["total_expenses"],
                "profit": concerts["total_profit"] + jams["total_profit"] + karaokes["total_profit"] + spectacles["total_profit"],
                "events": concerts["event_count"] + jams["event_count"] + karaokes["event_count"] + spectacles["event_count"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching profitability stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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


@router.post("/venues/me/notify-subscribers")
async def notify_subscribers(
    message: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Send notification to venue subscribers (Jacks)
    
    ⚠️ IMPORTANT: Usage responsable requis
    - N'abusez pas des notifications à des fins commerciales
    - Un usage excessif peut saturer vos abonnés
    - Privilégiez des messages pertinents et utiles
    - Limitez la fréquence d'envoi (max recommandé: 2-3 par semaine)
    """
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can send notifications")
    
    # Get venue profile
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    venue_id = venue["id"]
    venue_name = venue.get("name", "Un établissement")
    notification_message = message.get("message", "")
    
    if not notification_message:
        raise HTTPException(status_code=400, detail="Message is required")
    
    # CHECK WEEKLY LIMIT (3 notifications per week)
    from datetime import timedelta
    one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    # Count notifications sent in the last 7 days
    notifications_sent_count = await db.notifications.count_documents({
        "sender_id": current_user["id"],
        "type": "broadcast",
        "created_at": {"$gte": one_week_ago.isoformat()}
    })
    
    WEEKLY_LIMIT = 3
    if notifications_sent_count >= WEEKLY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Limite hebdomadaire atteinte : vous avez déjà envoyé {notifications_sent_count} notifications cette semaine. Maximum autorisé : {WEEKLY_LIMIT}/semaine. Réessayez dans quelques jours."
        )
    
    # Get all subscribers
    subscriptions = await db.venue_subscriptions.find({"venue_id": venue_id}, {"_id": 0}).to_list(1000)
    
    # Check if there are any subscribers
    if len(subscriptions) == 0:
        raise HTTPException(
            status_code=400,
            detail="Aucun abonné (Jack) trouvé. Personne ne recevra la notification."
        )
    
    # Import send_push_notification
    from routes.push_notifications import send_push_notification
    
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
                "title": f"📢 {venue_name}",
                "message": notification_message,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "read": False
            }
            result = await db.notifications.insert_one(notification)
            logger.info(f"Notification inserted: {result.inserted_id}")
            notifications_created += 1
            
            # Send push notification
            try:
                await send_push_notification(
                    user_id=sub["subscriber_id"],
                    notification_data={
                        "title": f"📢 {venue_name}",
                        "message": notification_message,
                        "link": f"/venue/{venue_id}",
                        "data": {"notification_id": notification["id"]}
                    }
                )
                logger.info(f"Push notification sent to subscriber {sub['subscriber_id']}")
            except Exception as push_error:
                logger.error(f"Error sending push notification: {push_error}")
                # Continue même si le push échoue
                
        except Exception as e:
            logger.error(f"Failed to insert notification: {e}")
    
    return {"recipients_count": notifications_created, "message": "Notifications sent successfully"}


@router.get("/venues/me/notifications-quota")
async def get_notifications_quota(current_user: dict = Depends(get_current_user)):
    """
    Get the remaining notification quota for the current week
    Returns: remaining notifications and reset date
    """
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can check notification quota")
    
    from datetime import timedelta
    
    # Calculate notifications sent in the last 7 days
    one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    notifications_sent_count = await db.notifications.count_documents({
        "sender_id": current_user["id"],
        "type": "broadcast",
        "created_at": {"$gte": one_week_ago.isoformat()}
    })
    
    WEEKLY_LIMIT = 3
    remaining = max(0, WEEKLY_LIMIT - notifications_sent_count)
    
    # Find the oldest notification in the last 7 days to calculate reset date
    oldest_notification = await db.notifications.find_one(
        {
            "sender_id": current_user["id"],
            "type": "broadcast",
            "created_at": {"$gte": one_week_ago.isoformat()}
        },
        {"_id": 0, "created_at": 1},
        sort=[("created_at", 1)]
    )
    
    # Calculate when the oldest notification will be out of the 7-day window
    reset_date = None
    if oldest_notification and notifications_sent_count >= WEEKLY_LIMIT:
        oldest_date = datetime.fromisoformat(oldest_notification["created_at"])
        reset_date = (oldest_date + timedelta(days=7)).isoformat()
    
    return {
        "used": notifications_sent_count,
        "remaining": remaining,
        "total": WEEKLY_LIMIT,
        "reset_date": reset_date,
        "period": "7 days"
    }


@router.post("/venues/me/broadcast-notification")
async def broadcast_notification(
    message: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Send notification to nearby musicians
    
    ⚠️ IMPORTANT: Usage responsable requis
    - N'abusez pas des notifications à des fins commerciales
    - Un usage excessif peut saturer les utilisateurs
    - Privilégiez des messages pertinents pour des opportunités réelles
    - Limitez la fréquence d'envoi (max recommandé: 1-2 par semaine)
    """
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
    
    # CHECK WEEKLY LIMIT (3 notifications per week)
    from datetime import timedelta
    one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    # Count notifications sent in the last 7 days
    notifications_sent_count = await db.notifications.count_documents({
        "sender_id": current_user["id"],
        "type": "broadcast",
        "created_at": {"$gte": one_week_ago.isoformat()}
    })
    
    WEEKLY_LIMIT = 3
    if notifications_sent_count >= WEEKLY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Limite hebdomadaire atteinte : vous avez déjà envoyé {notifications_sent_count} notifications cette semaine. Maximum autorisé : {WEEKLY_LIMIT}/semaine. Réessayez dans quelques jours."
        )
    
    if not venue.get("latitude") or not venue.get("longitude"):
        raise HTTPException(status_code=400, detail="Venue location not set")
    
    venue_lat = venue["latitude"]
    venue_lon = venue["longitude"]
    
    # Find nearby musicians
    all_musicians = await db.musicians.find({}, {"_id": 0}).to_list(10000)
    nearby_musicians = []
    
    for musician in all_musicians:
        # Use temporary location if active and not expired, otherwise use profile location
        musician_lat = None
        musician_lon = None
        
        # Check if temporary location is active
        if musician.get("temporary_location_enabled"):
            expires = musician.get("temporary_location_expires")
            if expires:
                expires_dt = datetime.fromisoformat(expires)
                # Check if not expired
                if datetime.now(timezone.utc) <= expires_dt:
                    musician_lat = musician.get("temporary_latitude")
                    musician_lon = musician.get("temporary_longitude")
        
        # Fallback to profile location if no valid temporary location
        if not musician_lat or not musician_lon:
            musician_lat = musician.get("latitude")
            musician_lon = musician.get("longitude")
        
        # Calculate distance if coordinates are available
        if musician_lat and musician_lon:
            distance = haversine_distance(
                venue_lat, venue_lon,
                musician_lat, musician_lon
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
    # Import send_push_notification
    from routes.push_notifications import send_push_notification
    
    venue_id = venue["id"]
    venue_name = venue.get("name", "Un établissement")
    
    notifications_created = 0
    for musician in nearby_musicians:
        try:
            notification = {
                "id": str(uuid.uuid4()),
                "recipient_id": musician["user_id"],
                "recipient_role": "musician",
                "sender_id": current_user["id"],
                "sender_role": "venue",
                "type": "broadcast",
                "title": f"📍 {venue_name}",
                "message": notification_message,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "read": False
            }
            await db.notifications.insert_one(notification)
            notifications_created += 1
            
            # Send push notification
            try:
                await send_push_notification(
                    user_id=musician["user_id"],
                    notification_data={
                        "title": f"📍 {venue_name}",
                        "message": notification_message,
                        "link": f"/venue/{venue_id}",
                        "data": {"notification_id": notification["id"]}
                    }
                )
                logger.info(f"Push notification sent to musician {musician['user_id']}")
            except Exception as push_error:
                logger.error(f"Error sending push notification: {push_error}")
                # Continue même si le push échoue
                
        except Exception as e:
            logger.error(f"Failed to create notification: {e}")
    
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
    
    # Import send_push_notification
    from routes.push_notifications import send_push_notification
    
    venue_name = venue.get("name", "Un établissement")
    
    # Create notifications for all recipients
    notifications_created = 0
    for recipient_id, recipient_role in all_recipient_ids.items():
        try:
            notification = {
                "id": str(uuid.uuid4()),
                "recipient_id": recipient_id,
                "recipient_role": recipient_role,
                "sender_id": current_user["id"],
                "sender_role": "venue",
                "type": "broadcast",
                "title": f"📢 {venue_name}",
                "message": notification_message,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "read": False
            }
            await db.notifications.insert_one(notification)
            notifications_created += 1
            
            # Send push notification
            try:
                await send_push_notification(
                    user_id=recipient_id,
                    notification_data={
                        "title": f"📢 {venue_name}",
                        "message": notification_message,
                        "link": f"/venue/{venue_id}",
                        "data": {"notification_id": notification["id"]}
                    }
                )
                logger.info(f"Push notification sent to user {recipient_id}")
            except Exception as push_error:
                logger.error(f"Error sending push notification: {push_error}")
                # Continue même si le push échoue
                
        except Exception as e:
            logger.error(f"Failed to create notification: {e}")
    
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

