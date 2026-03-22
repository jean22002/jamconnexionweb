from fastapi import APIRouter, HTTPException, Depends, Header
from datetime import datetime, timezone
from typing import List
import uuid
import logging

from models.melomane import MelomaneCreate, MelomaneUpdate, MelomaneResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/melomanes", tags=["Melomanes"])

# DB will be injected by the main server
db = None

def set_db(database):
    global db
    db = database

async def get_current_user_local(authorization: str = Header(None)):
    """Import get_current_user locally to avoid circular imports"""
    from utils import get_current_user
    return await get_current_user(authorization, db)

# Create melomane profile
@router.post("/", response_model=MelomaneResponse)
async def create_melomane_profile(
    data: MelomaneCreate,
    current_user: dict = Depends(get_current_user_local)
):
    user_id = current_user["id"]
    
    # Check if profile already exists
    existing = await db.melomanes.find_one({"user_id": user_id}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Melomane profile already exists")
    
    # Geocode city if provided
    latitude, longitude = None, None
    if data.city:
        from utils import geocode_city
        lat, lon = await geocode_city(data.city)
        latitude, longitude = lat, lon
    
    # Normalize profile_picture URL
    from server import normalize_image_url
    profile_picture_url = normalize_image_url(data.profile_picture) if data.profile_picture else None
    
    melomane_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "pseudo": data.pseudo,
        "bio": data.bio,
        "city": data.city,
        "region": data.region,
        "postal_code": data.postal_code,
        "country": data.country or "France",
        "latitude": latitude,
        "longitude": longitude,
        "favorite_styles": data.favorite_styles or [],
        "favorite_venues": [],
        "profile_picture": profile_picture_url,
        "cover_photo": None,
        "facebook": None,
        "instagram": None,
        "twitter": None,
        "notifications_enabled": data.notifications_enabled,
        "notification_radius_km": data.notification_radius_km or 50.0,
        "events_attended": 0,
        "favorite_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.melomanes.insert_one(melomane_doc)
    return MelomaneResponse(**melomane_doc)

# Get current melomane profile
@router.get("/me", response_model=MelomaneResponse)
async def get_my_melomane_profile(current_user: dict = Depends(get_current_user_local)):
    user_id = current_user["id"]
    melomane = await db.melomanes.find_one({"user_id": user_id}, {"_id": 0})
    
    if not melomane:
        raise HTTPException(status_code=404, detail="Melomane profile not found")
    
    return MelomaneResponse(**melomane)

# Update melomane profile
@router.put("/me", response_model=MelomaneResponse)
async def update_melomane_profile(
    data: MelomaneUpdate,
    current_user: dict = Depends(get_current_user_local)
):
    user_id = current_user["id"]
    
    melomane = await db.melomanes.find_one({"user_id": user_id}, {"_id": 0})
    if not melomane:
        raise HTTPException(status_code=404, detail="Melomane profile not found")
    
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    
    # Normalize profile_picture URL if provided
    if "profile_picture" in update_data and update_data["profile_picture"]:
        from server import normalize_image_url
        update_data["profile_picture"] = normalize_image_url(update_data["profile_picture"])
    
    # Geocode city if changed
    if "city" in update_data and update_data["city"]:
        from utils import geocode_city
        lat, lon = await geocode_city(update_data["city"])
        update_data["latitude"] = lat
        update_data["longitude"] = lon
    
    if update_data:
        await db.melomanes.update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )
    
    updated_melomane = await db.melomanes.find_one({"user_id": user_id}, {"_id": 0})
    return MelomaneResponse(**updated_melomane)

# Get all melomanes (for map)
@router.get("/", response_model=List[MelomaneResponse])
async def get_all_melomanes():
    try:
        # Fetch all melomanes with all fields
        melomanes = await db.melomanes.find(
            {},
            {"_id": 0}
        ).limit(1000).to_list(1000)
        return [MelomaneResponse(**m) for m in melomanes]
    except Exception as e:
        logger.error(f"Error fetching melomanes: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching melomanes: {str(e)}")

# Get melomane by ID
@router.get("/{melomane_id}", response_model=MelomaneResponse)
async def get_melomane_by_id(melomane_id: str):
    melomane = await db.melomanes.find_one({"id": melomane_id}, {"_id": 0})
    
    if not melomane:
        raise HTTPException(status_code=404, detail="Melomane not found")
    
    return MelomaneResponse(**melomane)

# Mark participation to an event
@router.post("/events/{event_id}/participate")
async def mark_participation(
    event_id: str,
    event_type: str,  # jam, concert, karaoke, spectacle
    current_user: dict = Depends(get_current_user_local)
):
    user_id = current_user["id"]
    
    # Check if already participating
    existing = await db.event_participations.find_one({
        "event_id": event_id,
        "participant_id": user_id,
        "participant_type": "melomane"
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already marked as participating")
    
    # Create participation
    participation_doc = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "event_type": event_type,
        "participant_id": user_id,
        "participant_type": "melomane",
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.event_participations.insert_one(participation_doc)
    
    # Increment events_attended counter
    await db.melomanes.update_one(
        {"user_id": user_id},
        {"$inc": {"events_attended": 1}}
    )
    
    # Check for new badges
    try:
        from utils.badge_checker import check_and_award_badges_internal
        await check_and_award_badges_internal(db, user_id)
    except Exception as e:
        logger.warning(f"Could not check badges: {e}")
    
    return {"message": "Participation marked successfully"}

# Remove participation
@router.delete("/events/{event_id}/participate")
async def remove_participation(
    event_id: str,
    current_user: dict = Depends(get_current_user_local)
):
    user_id = current_user["id"]
    
    result = await db.event_participations.delete_one({
        "event_id": event_id,
        "participant_id": user_id,
        "participant_type": "melomane"
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Participation not found")
    
    # Decrement events_attended counter
    await db.melomanes.update_one(
        {"user_id": user_id},
        {"$inc": {"events_attended": -1}}
    )
    
    return {"message": "Participation removed"}

# Get melomane participations
@router.get("/me/participations")
async def get_my_participations(current_user: dict = Depends(get_current_user_local)):
    user_id = current_user["id"]
    
    participations = await db.event_participations.find({
        "user_id": user_id,
        "user_role": "melomane"
    }, {"_id": 0}).to_list(1000)
    
    # Enrich with event and venue details
    enriched_participations = []
    for participation in participations:
        event_id = participation.get("event_id")
        event_type = participation.get("event_type")
        
        # Get event details based on type
        event = None
        if event_type == "jam":
            event = await db.jams.find_one({"id": event_id}, {"_id": 0})
        elif event_type == "concert":
            event = await db.concerts.find_one({"id": event_id}, {"_id": 0})
        elif event_type == "karaoke":
            event = await db.karaoke_events.find_one({"id": event_id}, {"_id": 0})
        elif event_type == "spectacle":
            event = await db.spectacle_events.find_one({"id": event_id}, {"_id": 0})
        
        if event:
            # Get venue details
            venue = await db.venues.find_one({"id": event.get("venue_id")}, {"_id": 0, "name": 1, "city": 1})
            
            # Merge all data
            enriched_participations.append({
                **participation,
                "venue_id": event.get("venue_id"),
                "venue_name": venue.get("name") if venue else "Établissement inconnu",
                "venue_city": venue.get("city") if venue else None,
                "event_date": event.get("date"),
                "event_time": event.get("start_time"),
                "event_title": event.get("title") if event_type == "concert" else None
            })
        else:
            enriched_participations.append(participation)
    
    return enriched_participations
