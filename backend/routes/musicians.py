"""
Musicians router - Handles musician profiles, friends, and bands
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
import os
import logging

from models import (
    MusicianProfile, MusicianProfileResponse,
    FriendRequest, FriendRequestResponse
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


# ============= MUSICIAN PROFILES =============

@router.post("/musicians", response_model=MusicianProfileResponse)
async def create_musician_profile(data: MusicianProfile, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musician accounts can create musician profiles")
    
    existing = await db.musicians.find_one({"user_id": current_user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Musician profile already exists")
    
    musician_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Add IDs to concerts
    concerts_with_ids = []
    for concert in data.concerts:
        concert_dict = concert.model_dump()
        concert_dict["id"] = str(uuid.uuid4())
        concerts_with_ids.append(concert_dict)
    
    musician_doc = {
        "id": musician_id,
        "user_id": current_user["id"],
        **data.model_dump(),
        "concerts": concerts_with_ids,
        "created_at": now
    }
    
    await db.musicians.insert_one(musician_doc)
    
    friends_count = await db.friends.count_documents({
        "$or": [{"user1_id": current_user["id"]}, {"user2_id": current_user["id"]}],
        "status": "accepted"
    })
    
    return MusicianProfileResponse(**{**musician_doc, "friends_count": friends_count})


@router.put("/musicians", response_model=MusicianProfileResponse)
async def update_musician_profile(data: MusicianProfile, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musician accounts can update musician profiles")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Add IDs to new concerts
    concerts_with_ids = []
    for concert in data.concerts:
        concert_dict = concert.model_dump()
        if not concert_dict.get("id"):
            concert_dict["id"] = str(uuid.uuid4())
        concerts_with_ids.append(concert_dict)
    
    update_data = data.model_dump()
    update_data["concerts"] = concerts_with_ids
    
    await db.musicians.update_one(
        {"user_id": current_user["id"]},
        {"$set": update_data}
    )
    
    updated = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    friends_count = await db.friends.count_documents({
        "$or": [{"user1_id": current_user["id"]}, {"user2_id": current_user["id"]}],
        "status": "accepted"
    })
    
    return MusicianProfileResponse(**{**updated, "friends_count": friends_count})


@router.get("/musicians/me", response_model=MusicianProfileResponse)
async def get_my_musician_profile(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musician accounts can access this")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    friends_count = await db.friends.count_documents({
        "$or": [{"user1_id": current_user["id"]}, {"user2_id": current_user["id"]}],
        "status": "accepted"
    })
    
    return MusicianProfileResponse(**{**musician, "friends_count": friends_count})


@router.get("/musicians", response_model=List[MusicianProfileResponse])
async def list_musicians(instrument: Optional[str] = None, style: Optional[str] = None, city: Optional[str] = None):
    query = {"pseudo": {"$exists": True, "$ne": ""}}  # Ne retourner que les musiciens avec un pseudo valide
    if instrument:
        query["instruments"] = {"$regex": instrument, "$options": "i"}
    if style:
        query["music_styles"] = {"$regex": style, "$options": "i"}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    
    musicians = await db.musicians.find(query, {"_id": 0}).to_list(100)
    
    # Optimisation: Récupérer tous les compteurs d'amis en une seule requête
    user_ids = [m["user_id"] for m in musicians]
    
    if user_ids:
        # Agrégation pour compter les amis de tous les musiciens en une requête
        friend_counts_pipeline = [
            {
                "$match": {
                    "$or": [
                        {"user1_id": {"$in": user_ids}, "status": "accepted"},
                        {"user2_id": {"$in": user_ids}, "status": "accepted"}
                    ]
                }
            },
            {
                "$project": {
                    "user_id": {
                        "$cond": [
                            {"$in": ["$user1_id", user_ids]},
                            "$user1_id",
                            "$user2_id"
                        ]
                    }
                }
            },
            {
                "$group": {
                    "_id": "$user_id",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        friend_counts_result = await db.friends.aggregate(friend_counts_pipeline).to_list(None)
        friend_counts_map = {item["_id"]: item["count"] for item in friend_counts_result}
    else:
        friend_counts_map = {}
    
    # Construire le résultat avec les compteurs d'amis
    result = []
    for m in musicians:
        friends_count = friend_counts_map.get(m["user_id"], 0)
        try:
            result.append(MusicianProfileResponse(**{**m, "friends_count": friends_count}))
        except Exception as e:
            # Skip musicians with invalid data
            logger.warning(f"Skipping musician {m.get('id')} due to validation error: {e}")
            continue
    
    return result


@router.get("/musicians/{musician_id}", response_model=MusicianProfileResponse)
async def get_musician(musician_id: str):
    musician = await db.musicians.find_one({"id": musician_id}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician not found")
    
    friends_count = await db.friends.count_documents({
        "$or": [{"user1_id": musician["user_id"]}, {"user2_id": musician["user_id"]}],
        "status": "accepted"
    })
    
    return MusicianProfileResponse(**{**musician, "friends_count": friends_count})


# ============= BANDS SEARCH =============

@router.get("/bands/search")
async def search_bands(query: str = "", limit: int = 10):
    """Rechercher des groupes par nom"""
    if not query or len(query) < 2:
        return []
    
    # Rechercher dans tous les profils de musiciens qui ont des groupes
    musicians = await db.musicians.find({}, {"_id": 0, "bands": 1, "pseudo": 1}).to_list(1000)
    
    all_bands = []
    for musician in musicians:
        if musician.get("bands"):
            for band in musician["bands"]:
                if query.lower() in band.get("name", "").lower():
                    # Ajouter le pseudo du musicien propriétaire
                    band_info = band.copy()
                    band_info["musician_name"] = musician.get("pseudo", "")
                    all_bands.append(band_info)
    
    # Limiter les résultats
    return all_bands[:limit]


# ============= FRIENDS SYSTEM =============

@router.post("/friends/request")
async def send_friend_request(request: FriendRequest, current_user: dict = Depends(get_current_user)):
    # Vérifier que l'utilisateur cible existe
    target_user = await db.users.find_one({"id": request.to_user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="Utilisateur cible introuvable")
    
    # Ne pas permettre de s'ajouter soi-même
    if current_user["id"] == request.to_user_id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous ajouter vous-même")
    
    # Vérifier s'il existe déjà une amitié
    existing_friendship = await db.friends.find_one({
        "$or": [
            {"user1_id": current_user["id"], "user2_id": request.to_user_id},
            {"user1_id": request.to_user_id, "user2_id": current_user["id"]}
        ]
    })
    if existing_friendship:
        raise HTTPException(status_code=400, detail="Demande d'ami déjà existante ou amitié déjà établie")
    
    # Créer la demande d'ami
    friend_request_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    friend_request_doc = {
        "id": friend_request_id,
        "from_user_id": current_user["id"],
        "to_user_id": request.to_user_id,
        "status": "pending",
        "created_at": now
    }
    
    await db.friends.insert_one(friend_request_doc)
    
    # Créer une notification pour l'utilisateur cible
    notification_id = str(uuid.uuid4())
    from_user_name = current_user.get("name", "Un musicien")
    
    notification_doc = {
        "id": notification_id,
        "user_id": request.to_user_id,
        "type": "friend_request",
        "title": "Nouvelle demande d'ami",
        "message": f"{from_user_name} vous a envoyé une demande d'ami",
        "read": False,
        "created_at": now,
        "related_id": friend_request_id
    }
    
    await db.notifications.insert_one(notification_doc)
    
    return {"message": "Demande d'ami envoyée", "request_id": friend_request_id}


@router.get("/friends/requests")
async def get_friend_requests(current_user: dict = Depends(get_current_user)):
    """Get incoming friend requests"""
    requests = await db.friends.find({
        "to_user_id": current_user["id"],
        "status": "pending"
    }, {"_id": 0}).to_list(100)
    
    # Récupérer les infos des expéditeurs
    result = []
    for req in requests:
        from_user = await db.users.find_one({"id": req["from_user_id"]}, {"_id": 0, "password": 0})
        if from_user:
            # Récupérer l'ID du profil selon le rôle
            profile_id = None
            if from_user.get("role") == "musician":
                musician = await db.musicians.find_one({"user_id": from_user["id"]}, {"_id": 0, "id": 1, "pseudo": 1, "profile_image": 1, "city": 1, "instruments": 1, "music_styles": 1})
                if musician:
                    profile_id = musician.get("id")
                    req["from_user_name"] = musician.get("pseudo", from_user.get("email"))
                    req["from_user_image"] = musician.get("profile_image")
                    req["from_user_city"] = musician.get("city")
                    req["from_user_instruments"] = ", ".join(musician.get("instruments", [])[:3]) if musician.get("instruments") else None
                    req["from_user_styles"] = ", ".join(musician.get("music_styles", [])[:3]) if musician.get("music_styles") else None
            elif from_user.get("role") == "venue":
                venue = await db.venues.find_one({"user_id": from_user["id"]}, {"_id": 0, "id": 1, "name": 1, "profile_image": 1, "city": 1})
                if venue:
                    profile_id = venue.get("id")
                    req["from_user_name"] = venue.get("name", from_user.get("email"))
                    req["from_user_image"] = venue.get("profile_image")
                    req["from_user_city"] = venue.get("city")
            elif from_user.get("role") == "melomane":
                melomane = await db.melomanes.find_one({"user_id": from_user["id"]}, {"_id": 0, "id": 1, "pseudo": 1, "profile_image": 1, "city": 1})
                if melomane:
                    profile_id = melomane.get("id")
                    req["from_user_name"] = melomane.get("pseudo", from_user.get("email"))
                    req["from_user_image"] = melomane.get("profile_image")
                    req["from_user_city"] = melomane.get("city")
            
            if profile_id:
                req["from_profile_id"] = profile_id
                req["from_user_role"] = from_user.get("role")
                result.append(req)
    
    return result


@router.get("/friends/sent")
async def get_sent_requests(current_user: dict = Depends(get_current_user)):
    """Get sent friend requests"""
    requests = await db.friends.find({
        "from_user_id": current_user["id"],
        "status": "pending"
    }, {"_id": 0}).to_list(100)
    
    # Récupérer les infos des destinataires
    result = []
    for req in requests:
        to_user = await db.users.find_one({"id": req["to_user_id"]}, {"_id": 0, "password": 0})
        if to_user:
            # Récupérer le profil du musicien si c'est un musicien
            if to_user.get("role") == "musician":
                musician = await db.musicians.find_one({"user_id": to_user["id"]}, {"_id": 0})
                if musician:
                    to_user["pseudo"] = musician.get("pseudo")
            req["to_user"] = to_user
            result.append(req)
    
    return result


@router.delete("/friends/cancel/{request_id}")
async def cancel_friend_request(request_id: str, current_user: dict = Depends(get_current_user)):
    """Cancel a sent friend request"""
    # Vérifier que la demande existe et appartient à l'utilisateur
    request = await db.friends.find_one({
        "id": request_id,
        "from_user_id": current_user["id"],
        "status": "pending"
    })
    
    if not request:
        raise HTTPException(status_code=404, detail="Demande d'ami introuvable")
    
    # Supprimer la demande
    await db.friends.delete_one({"id": request_id})
    
    # Supprimer la notification associée
    await db.notifications.delete_many({
        "related_id": request_id,
        "type": "friend_request"
    })
    
    return {"message": "Demande annulée"}


@router.post("/friends/accept/{request_id}")
async def accept_friend_request(request_id: str, current_user: dict = Depends(get_current_user)):
    request = await db.friends.find_one({"id": request_id, "to_user_id": current_user["id"], "status": "pending"})
    if not request:
        raise HTTPException(status_code=404, detail="Demande d'ami introuvable")
    
    await db.friends.update_one({"id": request_id}, {"$set": {"status": "accepted"}})
    return {"message": "Demande d'ami acceptée"}


@router.post("/friends/reject/{request_id}")
async def reject_friend_request(request_id: str, current_user: dict = Depends(get_current_user)):
    request = await db.friends.find_one({"id": request_id, "to_user_id": current_user["id"]})
    if not request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    await db.friends.delete_one({"id": request_id})
    return {"message": "Friend request rejected"}


@router.get("/friends")
async def list_friends(current_user: dict = Depends(get_current_user)):
    """List all friends of the current user"""
    # Chercher les amitiés acceptées (utilise from_user_id et to_user_id)
    friendships = await db.friends.find({
        "$or": [
            {"from_user_id": current_user["id"], "status": "accepted"},
            {"to_user_id": current_user["id"], "status": "accepted"}
        ]
    }, {"_id": 0}).to_list(1000)
    
    result = []
    for friendship in friendships:
        # Déterminer qui est l'ami
        friend_id = friendship["to_user_id"] if friendship.get("from_user_id") == current_user["id"] else friendship.get("from_user_id")
        
        # Récupérer les infos de l'ami
        friend_user = await db.users.find_one({"id": friend_id}, {"_id": 0, "password": 0})
        if friend_user:
            friend_data = {
                "friend_id": friend_id,
                "user_id": friend_id,  # Ajouter pour compatibilité
                "friend_name": friend_user.get("name"),
                "friend_email": friend_user.get("email"),
                "friend_role": friend_user.get("role"),
                "since": friendship.get("created_at")
            }
            
            # Récupérer le profil selon le rôle
            if friend_user.get("role") == "musician":
                musician = await db.musicians.find_one({"user_id": friend_id}, {"_id": 0})
                if musician:
                    friend_data["pseudo"] = musician.get("pseudo")
                    friend_data["profile_image"] = musician.get("profile_image")
                    friend_data["profile_id"] = musician.get("id")  # ID du profil musicien
                    friend_data["city"] = musician.get("city")
                    friend_data["instruments"] = musician.get("instruments", [])
            elif friend_user.get("role") == "venue":
                venue = await db.venues.find_one({"user_id": friend_id}, {"_id": 0})
                if venue:
                    friend_data["pseudo"] = venue.get("name")
                    friend_data["profile_image"] = venue.get("profile_image")
                    friend_data["profile_id"] = venue.get("id")
                    friend_data["city"] = venue.get("city")
            elif friend_user.get("role") == "melomane":
                melomane = await db.melomanes.find_one({"user_id": friend_id}, {"_id": 0})
                if melomane:
                    friend_data["pseudo"] = melomane.get("pseudo")
                    friend_data["profile_image"] = melomane.get("profile_image")
                    friend_data["profile_id"] = melomane.get("id")
                    friend_data["city"] = melomane.get("city")
            
            result.append(friend_data)
    
    return result


@router.delete("/friends/{friend_user_id}")
async def remove_friend(friend_user_id: str, current_user: dict = Depends(get_current_user)):
    """Remove a friend"""
    result = await db.friends.delete_one({
        "$or": [
            {"user1_id": current_user["id"], "user2_id": friend_user_id},
            {"user1_id": friend_user_id, "user2_id": current_user["id"]}
        ],
        "status": "accepted"
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Friendship not found")
    
    return {"message": "Friend removed"}




# ============= MUSICIAN PARTICIPATIONS =============

@router.get("/musicians/me/current-participation")
async def get_current_participation(current_user: dict = Depends(get_current_user)):
    """Get current/upcoming event participation for the musician"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can access this")
    
    from datetime import datetime, timezone
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Get active participations
    participations = await db.event_participations.find({
        "user_id": current_user["id"],
        "active": True
    }, {"_id": 0}).to_list(100)
    
    result = []
    for participation in participations:
        event_type = participation.get("event_type")
        event_id = participation.get("event_id")
        
        # Get event details
        event = None
        if event_type == "jam":
            event = await db.jams.find_one({"id": event_id}, {"_id": 0})
        elif event_type == "concert":
            event = await db.concerts.find_one({"id": event_id}, {"_id": 0})
        elif event_type == "karaoke":
            event = await db.karaoke.find_one({"id": event_id}, {"_id": 0})
        elif event_type == "spectacle":
            event = await db.spectacle.find_one({"id": event_id}, {"_id": 0})
        
        if event and event.get("date", "") >= today:
            # Get venue details
            venue = await db.venues.find_one({"id": event.get("venue_id")}, {"_id": 0})
            
            result.append({
                "participation_id": participation.get("id"),
                "event_id": event_id,
                "event_type": event_type,
                "event": event,
                "venue": venue,
                "joined_at": participation.get("created_at")
            })
    
    # Sort by event date
    result.sort(key=lambda x: x.get("event", {}).get("date", ""))
    
    return result
