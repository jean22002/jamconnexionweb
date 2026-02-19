"""
Events router - Handles all event types (jams, concerts, karaoke, spectacles) and participations
"""
from fastapi import APIRouter, HTTPException, Depends, Header, UploadFile, File
from fastapi.responses import FileResponse
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
import os
import logging
from math import radians, sin, cos, sqrt, atan2
from pathlib import Path

from models import (
    JamEvent, JamEventResponse,
    ConcertEvent, ConcertEventResponse,
    KaraokeEvent, KaraokeEventResponse,
    SpectacleEvent, SpectacleEventResponse
)

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


async def notify_venue_subscribers(venue_id: str, event_type: str, title: str, message: str, link: str):
    """Send notification to all venue subscribers"""
    try:
        subscriptions = await db.venue_subscriptions.find({"venue_id": venue_id}, {"_id": 0}).to_list(1000)
        
        for sub in subscriptions:
            notification_id = str(uuid.uuid4())
            notification_doc = {
                "id": notification_id,
                "user_id": sub["subscriber_id"],
                "type": event_type,
                "title": title,
                "message": message,
                "link": link,
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.notifications.insert_one(notification_doc)
        
        logger.info(f"Notified {len(subscriptions)} subscribers for venue {venue_id}")
    except Exception as e:
        logger.error(f"Error notifying subscribers: {e}")


# ============= JAM EVENTS (Boeuf musical) =============

@router.post("/jams", response_model=JamEventResponse)
async def create_jam_event(data: JamEvent, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can create jam events")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Check if jam already exists at this date
    existing_jam = await db.jams.find_one({
        "venue_id": venue["id"],
        "date": data.date
    }, {"_id": 0})
    
    if existing_jam:
        raise HTTPException(
            status_code=400, 
            detail=f"Un bœuf est déjà prévu le {data.date}. Vous ne pouvez pas créer deux bœufs le même jour."
        )
    
    jam_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    jam_doc = {
        "id": jam_id,
        "venue_id": venue["id"],
        "venue_name": venue["name"],
        **data.model_dump(),
        "created_at": now
    }
    
    await db.jams.insert_one(jam_doc)
    
    # Notify subscribers
    await notify_venue_subscribers(
        venue["id"], 
        "jam_event", 
        f"Nouveau boeuf musical chez {venue['name']}", 
        f"Le {data.date} de {data.start_time} à {data.end_time}", 
        f"/venue/{venue['id']}"
    )
    
    # Check for new badges (event created)
    try:
        from utils.badge_checker import check_and_award_badges_internal
        await check_and_award_badges_internal(db, current_user["id"])
    except Exception as e:
        logger.warning(f"Could not check badges: {e}")
    
    # Alert nearby venues (within 100km)
    try:
        # Optimisation: Ne récupérer que les champs nécessaires pour le calcul de distance et notification
        all_venues = await db.venues.find(
            {},
            {"_id": 0, "id": 1, "user_id": 1, "latitude": 1, "longitude": 1, "name": 1}
        ).to_list(1000)
        
        nearby_venues = []
        for other_venue in all_venues:
            if other_venue["id"] == venue["id"]:
                continue
            
            if not other_venue.get("latitude") or not other_venue.get("longitude"):
                continue
            
            if not venue.get("latitude") or not venue.get("longitude"):
                continue
            
            # Calculate distance using Haversine formula
            lat1, lon1 = radians(venue["latitude"]), radians(venue["longitude"])
            lat2, lon2 = radians(other_venue["latitude"]), radians(other_venue["longitude"])
            
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * atan2(sqrt(a), sqrt(1-a))
            distance_km = 6371 * c
            
            if distance_km <= 100:
                nearby_venues.append({
                    "venue": other_venue,
                    "distance_km": round(distance_km, 1)
                })
        
        # Send notification to each nearby venue
        for nearby in nearby_venues:
            notification = {
                "id": str(uuid.uuid4()),
                "user_id": nearby["venue"]["user_id"],
                "type": "nearby_jam_alert",
                "title": "🎵 Bœuf planifié à proximité",
                "message": f"{venue['name']} organise un bœuf le {data.date} de {data.start_time} à {data.end_time} ({nearby['distance_km']}km de chez vous). Pensez à vérifier votre planning !",
                "data": {
                    "jam_id": jam_id,
                    "venue_id": venue["id"],
                    "venue_name": venue["name"],
                    "date": data.date,
                    "start_time": data.start_time,
                    "end_time": data.end_time,
                    "distance_km": nearby["distance_km"]
                },
                "is_read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.notifications.insert_one(notification)
        
        logger.info(f"✅ Alerted {len(nearby_venues)} nearby venues about jam on {data.date}")
    except Exception as e:
        logger.error(f"⚠️ Error alerting nearby venues: {e}")
    
    return JamEventResponse(**jam_doc)


@router.get("/jams", response_model=List[JamEventResponse])
async def list_jam_events(venue_id: Optional[str] = None, date_from: Optional[str] = None):
    query = {}
    if venue_id:
        query["venue_id"] = venue_id
    if date_from:
        query["date"] = {"$gte": date_from}
    
    jams = await db.jams.find(query, {"_id": 0}).sort("date", 1).to_list(100)
    return [JamEventResponse(**j) for j in jams]


@router.get("/venues/{venue_id}/jams", response_model=List[JamEventResponse])
async def get_venue_jams(venue_id: str):
    """Get all jams for a venue with participants count (optimized with aggregation)"""
    # Utiliser une agrégation pour compter les participants en une seule requête
    pipeline = [
        # 1. Filtrer les jams du venue
        {"$match": {"venue_id": venue_id}},
        # 2. Joindre avec event_participations pour compter
        {
            "$lookup": {
                "from": "event_participations",
                "let": {"jam_id": "$id"},
                "pipeline": [
                    {
                        "$match": {
                            "$expr": {
                                "$and": [
                                    {"$eq": ["$event_id", "$$jam_id"]},
                                    {"$eq": ["$event_type", "jam"]},
                                    {"$ne": ["$active", False]}
                                ]
                            }
                        }
                    },
                    {"$count": "count"}
                ],
                "as": "participants_data"
            }
        },
        # 3. Extraire le count (ou 0 si pas de participants)
        {
            "$addFields": {
                "participants_count": {
                    "$ifNull": [
                        {"$arrayElemAt": ["$participants_data.count", 0]},
                        0
                    ]
                }
            }
        },
        # 4. Retirer _id et les champs temporaires
        {
            "$project": {
                "_id": 0,
                "participants_data": 0
            }
        },
        # 5. Trier par date
        {"$sort": {"date": 1}}
    ]
    
    jams = await db.jams.aggregate(pipeline).to_list(100)
    return [JamEventResponse(**jam) for jam in jams]


@router.delete("/jams/{jam_id}")
async def delete_jam_event(jam_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can delete jam events")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    result = await db.jams.delete_one({"id": jam_id, "venue_id": venue["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Jam event not found")
    
    return {"message": "Jam event deleted"}


@router.put("/jams/{jam_id}", response_model=JamEventResponse)
async def update_jam_event(jam_id: str, data: JamEvent, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can update jam events")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    jam = await db.jams.find_one({"id": jam_id, "venue_id": venue["id"]}, {"_id": 0})
    if not jam:
        raise HTTPException(status_code=404, detail="Jam event not found")
    
    # Check for conflicts if date changed
    if data.date != jam.get("date"):
        existing = await db.jams.find_one({
            "venue_id": venue["id"],
            "date": data.date,
            "id": {"$ne": jam_id}
        })
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Un bœuf est déjà prévu le {data.date}"
            )
    
    update_data = data.model_dump()
    update_data["venue_name"] = venue["name"]
    
    await db.jams.update_one(
        {"id": jam_id},
        {"$set": update_data}
    )
    
    updated = await db.jams.find_one({"id": jam_id}, {"_id": 0})
    return JamEventResponse(**updated)


# ============= CONCERT EVENTS =============

@router.post("/concerts", response_model=ConcertEventResponse)
async def create_concert_event(data: ConcertEvent, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can create concert events")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    concert_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    concert_doc = {
        "id": concert_id,
        "venue_id": venue["id"],
        "venue_name": venue["name"],
        **data.model_dump(),
        "created_at": now
    }
    
    await db.concerts.insert_one(concert_doc)
    
    # Notify subscribers
    await notify_venue_subscribers(
        venue["id"],
        "concert_event",
        f"Nouveau concert chez {venue['name']}",
        f"Le {data.date} de {data.start_time} à {data.end_time}",
        f"/venue/{venue['id']}"
    )
    
    # Check for new badges (event created)
    try:
        from utils.badge_checker import check_and_award_badges_internal
        await check_and_award_badges_internal(db, current_user["id"])
    except Exception as e:
        logger.warning(f"Could not check badges: {e}")
    
    # Count participants
    participants_count = await db.event_participations.count_documents({
        "event_id": concert_id,
        "event_type": "concert",
        "active": True
    })
    
    return ConcertEventResponse(**concert_doc, participants_count=participants_count)


@router.get("/concerts", response_model=List[ConcertEventResponse])
async def list_concerts(venue_id: Optional[str] = None):
    """List all concerts with participants count (optimized with aggregation)"""
    # Construire le match query
    match_query = {}
    if venue_id:
        match_query["venue_id"] = venue_id
    
    # Utiliser une agrégation pour compter les participants en une seule requête
    pipeline = [
        # 1. Filtrer les concerts
        {"$match": match_query} if match_query else {"$match": {}},
        # 2. Joindre avec event_participations pour compter
        {
            "$lookup": {
                "from": "event_participations",
                "let": {"concert_id": "$id"},
                "pipeline": [
                    {
                        "$match": {
                            "$expr": {
                                "$and": [
                                    {"$eq": ["$event_id", "$$concert_id"]},
                                    {"$eq": ["$event_type", "concert"]},
                                    {"$eq": ["$active", True]}
                                ]
                            }
                        }
                    },
                    {"$count": "count"}
                ],
                "as": "participants_data"
            }
        },
        # 3. Extraire le count
        {
            "$addFields": {
                "participants_count": {
                    "$ifNull": [
                        {"$arrayElemAt": ["$participants_data.count", 0]},
                        0
                    ]
                }
            }
        },
        # 4. Retirer _id et champs temporaires
        {
            "$project": {
                "_id": 0,
                "participants_data": 0
            }
        },
        # 5. Trier par date
        {"$sort": {"date": 1}}
    ]
    
    concerts = await db.concerts.aggregate(pipeline).to_list(100)
    return [ConcertEventResponse(**concert) for concert in concerts]


@router.get("/venues/{venue_id}/concerts", response_model=List[ConcertEventResponse])
async def get_venue_concerts(venue_id: str):
    """Get all concerts for a venue with participants count (optimized with aggregation)"""
    # Utiliser une agrégation pour compter les participants en une seule requête
    pipeline = [
        # 1. Filtrer les concerts du venue
        {"$match": {"venue_id": venue_id}},
        # 2. Joindre avec event_participations pour compter
        {
            "$lookup": {
                "from": "event_participations",
                "let": {"concert_id": "$id"},
                "pipeline": [
                    {
                        "$match": {
                            "$expr": {
                                "$and": [
                                    {"$eq": ["$event_id", "$$concert_id"]},
                                    {"$eq": ["$event_type", "concert"]},
                                    {"$eq": ["$active", True]}
                                ]
                            }
                        }
                    },
                    {"$count": "count"}
                ],
                "as": "participants_data"
            }
        },
        # 3. Extraire le count
        {
            "$addFields": {
                "participants_count": {
                    "$ifNull": [
                        {"$arrayElemAt": ["$participants_data.count", 0]},
                        0
                    ]
                }
            }
        },
        # 4. Retirer _id et champs temporaires
        {
            "$project": {
                "_id": 0,
                "participants_data": 0
            }
        },
        # 5. Trier par date
        {"$sort": {"date": 1}}
    ]
    
    concerts = await db.concerts.aggregate(pipeline).to_list(100)
    return [ConcertEventResponse(**concert) for concert in concerts]


@router.delete("/concerts/{concert_id}")
async def delete_concert(concert_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can delete concerts")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    result = await db.concerts.delete_one({"id": concert_id, "venue_id": venue["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Concert not found")
    
    # Delete associated participations
    await db.event_participations.delete_many({
        "event_id": concert_id,
        "event_type": "concert"
    })
    
    return {"message": "Concert deleted"}


@router.put("/concerts/{concert_id}", response_model=ConcertEventResponse)
async def update_concert(concert_id: str, data: ConcertEvent, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can update concerts")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    concert = await db.concerts.find_one({"id": concert_id, "venue_id": venue["id"]}, {"_id": 0})
    if not concert:
        raise HTTPException(status_code=404, detail="Concert not found")
    
    update_data = data.model_dump()
    update_data["venue_name"] = venue["name"]
    
    await db.concerts.update_one(
        {"id": concert_id},
        {"$set": update_data}
    )
    
    updated = await db.concerts.find_one({"id": concert_id}, {"_id": 0})
    participants_count = await db.event_participations.count_documents({
        "event_id": concert_id,
        "event_type": "concert",
        "active": True
    })
    
    return ConcertEventResponse(**updated, participants_count=participants_count)


# ============= KARAOKE EVENTS =============

@router.post("/karaoke", response_model=KaraokeEventResponse)
async def create_karaoke_event(data: KaraokeEvent, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can create karaoke events")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    karaoke_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    karaoke_doc = {
        "id": karaoke_id,
        "venue_id": venue["id"],
        "venue_name": venue["name"],
        **data.model_dump(),
        "created_at": now
    }
    
    await db.karaoke.insert_one(karaoke_doc)
    
    return KaraokeEventResponse(**karaoke_doc)


@router.get("/karaoke", response_model=List[KaraokeEventResponse])
async def list_karaoke_events(venue_id: Optional[str] = None):
    query = {}
    if venue_id:
        query["venue_id"] = venue_id
    
    events = await db.karaoke.find(query, {"_id": 0}).sort("date", 1).to_list(100)
    return [KaraokeEventResponse(**e) for e in events]


@router.get("/venues/{venue_id}/karaoke", response_model=List[KaraokeEventResponse])
async def get_venue_karaoke(venue_id: str):
    events = await db.karaoke.find({"venue_id": venue_id}, {"_id": 0}).sort("date", 1).to_list(100)
    return [KaraokeEventResponse(**e) for e in events]


@router.delete("/karaoke/{karaoke_id}")
async def delete_karaoke(karaoke_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can delete karaoke events")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    result = await db.karaoke.delete_one({"id": karaoke_id, "venue_id": venue["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Karaoke event not found")
    
    return {"message": "Karaoke event deleted"}


@router.put("/karaoke/{karaoke_id}", response_model=KaraokeEventResponse)
async def update_karaoke(karaoke_id: str, data: KaraokeEvent, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can update karaoke events")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    karaoke = await db.karaoke.find_one({"id": karaoke_id, "venue_id": venue["id"]}, {"_id": 0})
    if not karaoke:
        raise HTTPException(status_code=404, detail="Karaoke event not found")
    
    update_data = data.model_dump()
    update_data["venue_name"] = venue["name"]
    
    await db.karaoke.update_one(
        {"id": karaoke_id},
        {"$set": update_data}
    )
    
    updated = await db.karaoke.find_one({"id": karaoke_id}, {"_id": 0})
    return KaraokeEventResponse(**updated)


# ============= SPECTACLE EVENTS =============

@router.post("/spectacle", response_model=SpectacleEventResponse)
async def create_spectacle_event(data: SpectacleEvent, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can create spectacle events")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    spectacle_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    spectacle_doc = {
        "id": spectacle_id,
        "venue_id": venue["id"],
        "venue_name": venue["name"],
        **data.model_dump(),
        "created_at": now
    }
    
    await db.spectacle.insert_one(spectacle_doc)
    
    return SpectacleEventResponse(**spectacle_doc)


@router.get("/spectacle", response_model=List[SpectacleEventResponse])
async def list_spectacle_events(venue_id: Optional[str] = None):
    query = {}
    if venue_id:
        query["venue_id"] = venue_id
    
    events = await db.spectacle.find(query, {"_id": 0}).sort("date", 1).to_list(100)
    return [SpectacleEventResponse(**e) for e in events]


@router.get("/venues/{venue_id}/spectacle", response_model=List[SpectacleEventResponse])
async def get_venue_spectacle(venue_id: str):
    events = await db.spectacle.find({"venue_id": venue_id}, {"_id": 0}).sort("date", 1).to_list(100)
    return [SpectacleEventResponse(**e) for e in events]


@router.delete("/spectacle/{spectacle_id}")
async def delete_spectacle(spectacle_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can delete spectacle events")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    result = await db.spectacle.delete_one({"id": spectacle_id, "venue_id": venue["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Spectacle event not found")
    
    return {"message": "Spectacle event deleted"}


@router.put("/spectacle/{spectacle_id}", response_model=SpectacleEventResponse)
async def update_spectacle(spectacle_id: str, data: SpectacleEvent, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can update spectacle events")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    spectacle = await db.spectacle.find_one({"id": spectacle_id, "venue_id": venue["id"]}, {"_id": 0})
    if not spectacle:
        raise HTTPException(status_code=404, detail="Spectacle event not found")
    
    update_data = data.model_dump()
    update_data["venue_name"] = venue["name"]
    
    await db.spectacle.update_one(
        {"id": spectacle_id},
        {"$set": update_data}
    )
    
    updated = await db.spectacle.find_one({"id": spectacle_id}, {"_id": 0})
    return SpectacleEventResponse(**updated)


# ============= EVENT PARTICIPATIONS =============

@router.post("/events/{event_id}/join")
async def join_event(event_id: str, event_type: str, current_user: dict = Depends(get_current_user)):
    """Join an event (for musicians and melomanes)"""
    if current_user["role"] not in ["musician", "melomane"]:
        raise HTTPException(status_code=403, detail="Only musicians and melomanes can join events")
    
    # Check if event exists
    event = None
    if event_type == "jam":
        event = await db.jams.find_one({"id": event_id}, {"_id": 0})
    elif event_type == "concert":
        event = await db.concerts.find_one({"id": event_id}, {"_id": 0})
    elif event_type == "karaoke":
        event = await db.karaoke.find_one({"id": event_id}, {"_id": 0})
    elif event_type == "spectacle":
        event = await db.spectacle.find_one({"id": event_id}, {"_id": 0})
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if already participating (active)
    existing_active = await db.event_participations.find_one({
        "event_id": event_id,
        "user_id": current_user["id"],
        "active": True
    })
    
    if existing_active:
        raise HTTPException(status_code=400, detail="Already participating in this event")
    
    # Check if there's an inactive participation (previously left)
    existing_inactive = await db.event_participations.find_one({
        "event_id": event_id,
        "user_id": current_user["id"],
        "active": False
    })
    
    if existing_inactive:
        # Reactivate the existing participation
        await db.event_participations.update_one(
            {"id": existing_inactive["id"]},
            {"$set": {"active": True, "rejoined_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"message": "Successfully joined event", "participation_id": existing_inactive["id"]}
    
    # Create new participation
    participation_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    participation_doc = {
        "id": participation_id,
        "event_id": event_id,
        "event_type": event_type,
        "user_id": current_user["id"],
        "user_role": current_user["role"],
        "active": True,
        "created_at": now
    }
    
    await db.event_participations.insert_one(participation_doc)
    
    # ✨ NOUVEAU : Notifier l'établissement de la participation
    try:
        # Récupérer les infos du venue
        venue = await db.venues.find_one({"id": event["venue_id"]}, {"_id": 0, "user_id": 1, "name": 1})
        
        if venue:
            # Récupérer les infos du participant
            participant_name = "Un utilisateur"
            participant_type = "utilisateur"
            
            if current_user["role"] == "musician":
                musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0, "pseudo": 1})
                if musician:
                    participant_name = musician.get("pseudo", "Un musicien")
                    participant_type = "musicien"
            elif current_user["role"] == "melomane":
                melomane = await db.melomanes.find_one({"user_id": current_user["id"]}, {"_id": 0, "pseudo": 1})
                if melomane:
                    participant_name = melomane.get("pseudo", "Un mélomane")
                    participant_type = "mélomane"
            
            # Créer la notification pour l'établissement
            event_type_label = {
                "jam": "bœuf",
                "concert": "concert",
                "karaoke": "karaoké",
                "spectacle": "spectacle"
            }
            
            notification_title = f"🎵 Nouvelle participation : {participant_name}"
            notification_message = f"{participant_name} ({participant_type}) a rejoint votre {event_type_label.get(event_type, 'événement')} du {event.get('date', 'TBD')}"
            
            notification = {
                "id": str(uuid.uuid4()),
                "user_id": venue["user_id"],
                "type": "new_participation",
                "title": notification_title,
                "message": notification_message,
                "related_id": event_id,
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.notifications.insert_one(notification)
            logger.info(f"✓ Notification sent to venue {venue['user_id']} for participation in event {event_id}")
            
            # 🔔 NOUVEAU : Envoyer notification push en temps réel
            try:
                from routes.push_notifications import send_push_notification
                await send_push_notification(
                    user_id=venue["user_id"],
                    notification_data={
                        "title": notification_title,
                        "message": notification_message,
                        "link": f"/venue-dashboard?tab=planning",
                        "data": {
                            "type": "new_participation",
                            "event_id": event_id,
                            "event_type": event_type
                        }
                    }
                )
                logger.info(f"✓ Push notification sent to venue {venue['user_id']}")
            except Exception as push_error:
                logger.warning(f"Push notification failed (non-blocking): {push_error}")
            
    except Exception as e:
        logger.error(f"Failed to create venue notification: {e}")
    
    # Check for new badges (for musicians participating in events)
    try:
        from utils.badge_checker import check_and_award_badges_internal
        if current_user["role"] == "musician":
            await check_and_award_badges_internal(db, current_user["id"])
    except Exception as e:
        logger.warning(f"Could not check badges: {e}")
    
    return {"message": "Successfully joined event", "participation_id": participation_id}


@router.post("/events/{event_id}/leave")
async def leave_event(event_id: str, current_user: dict = Depends(get_current_user)):
    """Leave an event"""
    result = await db.event_participations.update_one(
        {"event_id": event_id, "user_id": current_user["id"], "active": True},
        {"$set": {"active": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Participation not found")
    
    return {"message": "Successfully left event"}


@router.get("/events/{event_id}/participants")
async def get_event_participants(event_id: str):
    """Get all participants of an event"""
    participations = await db.event_participations.find({
        "event_id": event_id,
        "active": True
    }, {"_id": 0}).to_list(1000)
    
    return participations


@router.get("/musicians/me/participations")
async def get_my_participations(current_user: dict = Depends(get_current_user)):
    """Get all my event participations with enriched data"""
    if current_user["role"] not in ["musician", "melomane"]:
        raise HTTPException(status_code=403, detail="Only musicians and melomanes can access this")
    
    participations = await db.event_participations.find({
        "user_id": current_user["id"],
        "active": True
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


# ============= ACCOUNTING - UPDATE PAYMENT STATUS =============

from pydantic import BaseModel

class PaymentStatusUpdate(BaseModel):
    payment_status: str

@router.patch("/jams/{jam_id}/payment-status")
async def update_jam_payment_status(
    jam_id: str,
    data: PaymentStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update only the payment status of a jam event"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can update payment status")
    
    # Validate status
    valid_statuses = ["Payé", "En attente", "Annulé", "Non spécifié"]
    if data.payment_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    jam = await db.jams.find_one({"id": jam_id, "venue_id": venue["id"]}, {"_id": 0})
    if not jam:
        raise HTTPException(status_code=404, detail="Jam event not found")
    
    # Update only payment_status
    await db.jams.update_one(
        {"id": jam_id},
        {"$set": {"payment_status": data.payment_status}}
    )
    
    return {"success": True, "payment_status": data.payment_status}


@router.patch("/concerts/{concert_id}/payment-status")
async def update_concert_payment_status(
    concert_id: str,
    data: PaymentStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update only the payment status of a concert event"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can update payment status")
    
    # Validate status
    valid_statuses = ["Payé", "En attente", "Annulé", "Non spécifié"]
    if data.payment_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    concert = await db.concerts.find_one({"id": concert_id, "venue_id": venue["id"]}, {"_id": 0})
    if not concert:
        raise HTTPException(status_code=404, detail="Concert not found")
    
    # Update only payment_status
    await db.concerts.update_one(
        {"id": concert_id},
        {"$set": {"payment_status": data.payment_status}}
    )
    
    return {"success": True, "payment_status": data.payment_status}


@router.patch("/karaoke/{karaoke_id}/payment-status")
async def update_karaoke_payment_status(
    karaoke_id: str,
    payment_status: str,
    current_user: dict = Depends(get_current_user)
):
    """Update only the payment status of a karaoke event"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can update payment status")
    
    # Validate status
    valid_statuses = ["Payé", "En attente", "Annulé", "Non spécifié"]
    if payment_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    karaoke = await db.karaoke.find_one({"id": karaoke_id, "venue_id": venue["id"]}, {"_id": 0})
    if not karaoke:
        raise HTTPException(status_code=404, detail="Karaoke event not found")
    
    # Update only payment_status
    await db.karaoke.update_one(
        {"id": karaoke_id},
        {"$set": {"payment_status": payment_status}}
    )
    
    return {"success": True, "payment_status": payment_status}


@router.patch("/spectacle/{spectacle_id}/payment-status")
async def update_spectacle_payment_status(
    spectacle_id: str,
    payment_status: str,
    current_user: dict = Depends(get_current_user)
):
    """Update only the payment status of a spectacle event"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can update payment status")
    
    # Validate status
    valid_statuses = ["Payé", "En attente", "Annulé", "Non spécifié"]
    if payment_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    spectacle = await db.spectacle.find_one({"id": spectacle_id, "venue_id": venue["id"]}, {"_id": 0})
    if not spectacle:
        raise HTTPException(status_code=404, detail="Spectacle event not found")
    
    # Update only payment_status
    await db.spectacle.update_one(
        {"id": spectacle_id},
        {"$set": {"payment_status": payment_status}}
    )
    
    return {"success": True, "payment_status": payment_status}



# ============= INVOICE FILE UPLOAD =============

UPLOAD_DIR = Path("/app/backend/uploads/invoices")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def get_file_extension(filename: str) -> str:
    """Get file extension in lowercase"""
    return Path(filename).suffix.lower()

@router.post("/jams/{jam_id}/invoice")
async def upload_jam_invoice(
    jam_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload invoice file for a jam event"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can upload invoices")
    
    # Validate file extension
    file_ext = get_file_extension(file.filename)
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Validate file size
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max size: 10MB")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    jam = await db.jams.find_one({"id": jam_id, "venue_id": venue["id"]}, {"_id": 0})
    if not jam:
        raise HTTPException(status_code=404, detail="Jam event not found")
    
    # Generate unique filename
    unique_filename = f"{jam_id}_{uuid.uuid4().hex[:8]}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Update database
    await db.jams.update_one(
        {"id": jam_id},
        {"$set": {"invoice_file": unique_filename}}
    )
    
    return {"success": True, "filename": unique_filename}


@router.post("/concerts/{concert_id}/invoice")
async def upload_concert_invoice(
    concert_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload invoice file for a concert event"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can upload invoices")
    
    # Validate file extension
    file_ext = get_file_extension(file.filename)
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Validate file size
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max size: 10MB")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    concert = await db.concerts.find_one({"id": concert_id, "venue_id": venue["id"]}, {"_id": 0})
    if not concert:
        raise HTTPException(status_code=404, detail="Concert not found")
    
    # Generate unique filename
    unique_filename = f"{concert_id}_{uuid.uuid4().hex[:8]}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Update database
    await db.concerts.update_one(
        {"id": concert_id},
        {"$set": {"invoice_file": unique_filename}}
    )
    
    return {"success": True, "filename": unique_filename}


@router.post("/karaoke/{karaoke_id}/invoice")
async def upload_karaoke_invoice(
    karaoke_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload invoice file for a karaoke event"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can upload invoices")
    
    file_ext = get_file_extension(file.filename)
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max size: 10MB")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    karaoke = await db.karaoke.find_one({"id": karaoke_id, "venue_id": venue["id"]}, {"_id": 0})
    if not karaoke:
        raise HTTPException(status_code=404, detail="Karaoke event not found")
    
    unique_filename = f"{karaoke_id}_{uuid.uuid4().hex[:8]}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    await db.karaoke.update_one(
        {"id": karaoke_id},
        {"$set": {"invoice_file": unique_filename}}
    )
    
    return {"success": True, "filename": unique_filename}


@router.post("/spectacle/{spectacle_id}/invoice")
async def upload_spectacle_invoice(
    spectacle_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload invoice file for a spectacle event"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can upload invoices")
    
    file_ext = get_file_extension(file.filename)
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max size: 10MB")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    spectacle = await db.spectacle.find_one({"id": spectacle_id, "venue_id": venue["id"]}, {"_id": 0})
    if not spectacle:
        raise HTTPException(status_code=404, detail="Spectacle event not found")
    
    unique_filename = f"{spectacle_id}_{uuid.uuid4().hex[:8]}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    await db.spectacle.update_one(
        {"id": spectacle_id},
        {"$set": {"invoice_file": unique_filename}}
    )
    
    return {"success": True, "filename": unique_filename}


@router.get("/invoices/{filename}")
async def get_invoice_file(
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """Download/view an invoice file"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can access invoices")
    
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Invoice file not found")
    
    # Determine media type based on extension
    file_ext = get_file_extension(filename)
    media_types = {
        ".pdf": "application/pdf",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp"
    }
    media_type = media_types.get(file_ext, "application/octet-stream")
    
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=filename
    )

