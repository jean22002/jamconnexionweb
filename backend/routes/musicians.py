"""
Musicians router - Handles musician profiles, friends, and bands
"""
from fastapi import APIRouter, HTTPException, Depends, Header, Query
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
        "$or": [{"from_user_id": current_user["id"]}, {"to_user_id": current_user["id"]}],
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
    
    # Auto-geocode if city and postal_code are provided but latitude/longitude are missing
    if update_data.get("city") and update_data.get("postal_code"):
        if not update_data.get("latitude") or not update_data.get("longitude") or update_data.get("latitude") == 0:
            try:
                from routes.geocode import geocode_address
                geocode_result = await geocode_address(
                    city=update_data["city"],
                    postal_code=update_data["postal_code"]
                )
                if geocode_result:
                    update_data["latitude"] = geocode_result["latitude"]
                    update_data["longitude"] = geocode_result["longitude"]
                    update_data["department"] = geocode_result.get("department") or update_data.get("department")
                    update_data["region"] = geocode_result.get("region") or update_data.get("region")
                    logger.info(f"Auto-geocoded musician {current_user['id']}: {update_data['city']} -> ({update_data['latitude']}, {update_data['longitude']})")
            except Exception as geocode_error:
                logger.warning(f"Geocoding failed for musician {current_user['id']}: {geocode_error}")
                # Continue without geocoding - non-blocking
    
    await db.musicians.update_one(
        {"user_id": current_user["id"]},
        {"$set": update_data}
    )
    
    updated = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    friends_count = await db.friends.count_documents({
        "$or": [{"from_user_id": current_user["id"]}, {"to_user_id": current_user["id"]}],
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
        "$or": [{"from_user_id": current_user["id"]}, {"to_user_id": current_user["id"]}],
        "status": "accepted"
    })
    
    # Récupérer les groupes dont le musicien est le leader
    bands = await db.bands.find({"leader_id": musician["id"]}, {"_id": 0}).to_list(100)
    
    return MusicianProfileResponse(**{**musician, "friends_count": friends_count, "bands": bands})


@router.get("/musicians", response_model=List[MusicianProfileResponse])
async def list_musicians(
    instrument: Optional[str] = None, 
    style: Optional[str] = None, 
    city: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page (max 100)")
):
    """Get musicians with pagination and filters"""
    query = {"pseudo": {"$exists": True, "$ne": ""}}  # Ne retourner que les musiciens avec un pseudo valide
    if instrument:
        query["instruments"] = {"$regex": instrument, "$options": "i"}
    if style:
        query["music_styles"] = {"$regex": style, "$options": "i"}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    
    # Calculate pagination
    skip = (page - 1) * limit
    
    # Projection: only load necessary fields for list view
    projection = {
        "_id": 0,
        "id": 1,
        "user_id": 1,
        "pseudo": 1,
        "city": 1,
        "department": 1,
        "postal_code": 1,
        "profile_image": 1,
        "cover_image": 1,
        "bio": 1,
        "instruments": 1,
        "music_styles": 1,
        "experience_years": 1,
        "available_for_gigs": 1,
        "bands": 1,
        "concerts": 1,
        "created_at": 1
    }
    
    # Get paginated musicians
    musicians = await db.musicians.find(query, projection).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Import de la fonction is_user_online
    from routes.online_status import is_user_online
    
    # Optimisation: Récupérer tous les users
    user_ids = [m["user_id"] for m in musicians]
    
    if user_ids:
        users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0}).to_list(None)
        users_map = {u["id"]: u for u in users}
        
        # Filtrer UNIQUEMENT ceux qui sont EXPLICITEMENT hors ligne
        visible_musicians = []
        for m in musicians:
            user = users_map.get(m["user_id"])
            if user:
                mode = user.get("online_status_mode", "auto")
                # Masquer SEULEMENT si :
                # 1. Mode disabled (utilisateur a choisi d'être invisible)
                # 2. Mode manual ET manual_status = False (utilisateur a choisi hors ligne)
                if mode == "disabled":
                    continue  # Masquer ce musicien
                if mode == "manual" and not user.get("manual_online_status", False):
                    continue  # Masquer ce musicien
                # Sinon, afficher (mode auto ou mode manual avec status=true)
            visible_musicians.append(m)
        
        musicians = visible_musicians
        user_ids = [m["user_id"] for m in musicians]
    
    if user_ids:
        # Agrégation pour compter les amis de tous les musiciens en une requête
        friend_counts_pipeline = [
            {
                "$match": {
                    "$or": [
                        {"from_user_id": {"$in": user_ids}, "status": "accepted"},
                        {"to_user_id": {"$in": user_ids}, "status": "accepted"}
                    ]
                }
            },
            {
                "$project": {
                    "user_id": {
                        "$cond": [
                            {"$in": ["$from_user_id", user_ids]},
                            "$from_user_id",
                            "$to_user_id"
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
        "$or": [{"from_user_id": musician["user_id"]}, {"to_user_id": musician["user_id"]}],
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
    
    # Vérifier si l'utilisateur est bloqué (dans les deux sens)
    is_blocked = await db.blocked_users.find_one({
        "$or": [
            {"blocker_id": current_user["id"], "blocked_id": request.to_user_id},
            {"blocker_id": request.to_user_id, "blocked_id": current_user["id"]}
        ]
    })
    if is_blocked:
        raise HTTPException(status_code=403, detail="Impossible d'envoyer une demande d'ami")
    
    # Vérifier s'il existe déjà une amitié ou demande
    existing_friendship = await db.friends.find_one({
        "$or": [
            {"from_user_id": current_user["id"], "to_user_id": request.to_user_id},
            {"from_user_id": request.to_user_id, "to_user_id": current_user["id"]}
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
    """Get incoming friend requests with enriched sender data (optimized with aggregation)"""
    # Utiliser une agrégation pour éviter le problème N+1
    pipeline = [
        # 1. Filtrer les requêtes pending pour l'utilisateur actuel
        {
            "$match": {
                "to_user_id": current_user["id"],
                "status": "pending"
            }
        },
        # 2. Joindre avec la collection users
        {
            "$lookup": {
                "from": "users",
                "localField": "from_user_id",
                "foreignField": "id",
                "as": "from_user_data"
            }
        },
        {"$unwind": {"path": "$from_user_data", "preserveNullAndEmptyArrays": False}},
        # 3. Joindre avec musicians (si role = musician)
        {
            "$lookup": {
                "from": "musicians",
                "let": {"user_id": "$from_user_data.id", "role": "$from_user_data.role"},
                "pipeline": [
                    {"$match": {"$expr": {
                        "$and": [
                            {"$eq": ["$$role", "musician"]},
                            {"$eq": ["$user_id", "$$user_id"]}
                        ]
                    }}}
                ],
                "as": "musician_data"
            }
        },
        # 4. Joindre avec venues (si role = venue)
        {
            "$lookup": {
                "from": "venues",
                "let": {"user_id": "$from_user_data.id", "role": "$from_user_data.role"},
                "pipeline": [
                    {"$match": {"$expr": {
                        "$and": [
                            {"$eq": ["$$role", "venue"]},
                            {"$eq": ["$user_id", "$$user_id"]}
                        ]
                    }}}
                ],
                "as": "venue_data"
            }
        },
        # 5. Joindre avec melomanes (si role = melomane)
        {
            "$lookup": {
                "from": "melomanes",
                "let": {"user_id": "$from_user_data.id", "role": "$from_user_data.role"},
                "pipeline": [
                    {"$match": {"$expr": {
                        "$and": [
                            {"$eq": ["$$role", "melomane"]},
                            {"$eq": ["$user_id", "$$user_id"]}
                        ]
                    }}}
                ],
                "as": "melomane_data"
            }
        },
        # 6. Projeter les champs finaux
        {
            "$project": {
                "_id": 0,
                "id": 1,
                "from_user_id": 1,
                "to_user_id": 1,
                "status": 1,
                "created_at": 1,
                "from_user_role": "$from_user_data.role",
                # Profile ID selon le rôle
                "from_profile_id": {
                    "$switch": {
                        "branches": [
                            {
                                "case": {"$eq": ["$from_user_data.role", "musician"]},
                                "then": {"$arrayElemAt": ["$musician_data.id", 0]}
                            },
                            {
                                "case": {"$eq": ["$from_user_data.role", "venue"]},
                                "then": {"$arrayElemAt": ["$venue_data.id", 0]}
                            },
                            {
                                "case": {"$eq": ["$from_user_data.role", "melomane"]},
                                "then": {"$arrayElemAt": ["$melomane_data.id", 0]}
                            }
                        ],
                        "default": None
                    }
                },
                "from_user_name": {
                    "$switch": {
                        "branches": [
                            {
                                "case": {"$eq": ["$from_user_data.role", "musician"]},
                                "then": {"$arrayElemAt": ["$musician_data.pseudo", 0]}
                            },
                            {
                                "case": {"$eq": ["$from_user_data.role", "venue"]},
                                "then": {"$arrayElemAt": ["$venue_data.name", 0]}
                            },
                            {
                                "case": {"$eq": ["$from_user_data.role", "melomane"]},
                                "then": {"$arrayElemAt": ["$melomane_data.pseudo", 0]}
                            }
                        ],
                        "default": "$from_user_data.email"
                    }
                },
                "from_user_image": {
                    "$switch": {
                        "branches": [
                            {
                                "case": {"$eq": ["$from_user_data.role", "musician"]},
                                "then": {"$arrayElemAt": ["$musician_data.profile_image", 0]}
                            },
                            {
                                "case": {"$eq": ["$from_user_data.role", "venue"]},
                                "then": {"$arrayElemAt": ["$venue_data.profile_image", 0]}
                            },
                            {
                                "case": {"$eq": ["$from_user_data.role", "melomane"]},
                                "then": {"$arrayElemAt": ["$melomane_data.profile_image", 0]}
                            }
                        ],
                        "default": None
                    }
                },
                "from_user_city": {
                    "$switch": {
                        "branches": [
                            {
                                "case": {"$eq": ["$from_user_data.role", "musician"]},
                                "then": {"$arrayElemAt": ["$musician_data.city", 0]}
                            },
                            {
                                "case": {"$eq": ["$from_user_data.role", "venue"]},
                                "then": {"$arrayElemAt": ["$venue_data.city", 0]}
                            },
                            {
                                "case": {"$eq": ["$from_user_data.role", "melomane"]},
                                "then": {"$arrayElemAt": ["$melomane_data.city", 0]}
                            }
                        ],
                        "default": None
                    }
                },
                "from_user_instruments": {
                    "$cond": {
                        "if": {"$eq": ["$from_user_data.role", "musician"]},
                        "then": {
                            "$reduce": {
                                "input": {"$slice": [{"$arrayElemAt": ["$musician_data.instruments", 0]}, 3]},
                                "initialValue": "",
                                "in": {
                                    "$concat": [
                                        "$$value",
                                        {"$cond": [{"$eq": ["$$value", ""]}, "", ", "]},
                                        "$$this"
                                    ]
                                }
                            }
                        },
                        "else": None
                    }
                },
                "from_user_styles": {
                    "$cond": {
                        "if": {"$eq": ["$from_user_data.role", "musician"]},
                        "then": {
                            "$reduce": {
                                "input": {"$slice": [{"$arrayElemAt": ["$musician_data.music_styles", 0]}, 3]},
                                "initialValue": "",
                                "in": {
                                    "$concat": [
                                        "$$value",
                                        {"$cond": [{"$eq": ["$$value", ""]}, "", ", "]},
                                        "$$this"
                                    ]
                                }
                            }
                        },
                        "else": None
                    }
                }
            }
        },
        # 7. Filtrer les résultats qui ont un profile_id valide
        {
            "$match": {
                "from_profile_id": {"$ne": None}
            }
        }
    ]
    
    result = await db.friends.aggregate(pipeline).to_list(100)
    return result



@router.get("/friends/sent")
async def get_sent_requests(current_user: dict = Depends(get_current_user)):
    """Get sent friend requests (optimized with aggregation)"""
    # Utiliser une agrégation pour éviter le problème N+1
    pipeline = [
        # 1. Filtrer les requêtes envoyées par l'utilisateur
        {
            "$match": {
                "from_user_id": current_user["id"],
                "status": "pending"
            }
        },
        # 2. Joindre avec users
        {
            "$lookup": {
                "from": "users",
                "localField": "to_user_id",
                "foreignField": "id",
                "as": "to_user_data"
            }
        },
        {"$unwind": {"path": "$to_user_data", "preserveNullAndEmptyArrays": False}},
        # 3. Joindre avec musicians
        {
            "$lookup": {
                "from": "musicians",
                "let": {"user_id": "$to_user_data.id", "role": "$to_user_data.role"},
                "pipeline": [
                    {"$match": {"$expr": {
                        "$and": [
                            {"$eq": ["$$role", "musician"]},
                            {"$eq": ["$user_id", "$$user_id"]}
                        ]
                    }}}
                ],
                "as": "musician_data"
            }
        },
        # 4. Joindre avec venues
        {
            "$lookup": {
                "from": "venues",
                "let": {"user_id": "$to_user_data.id", "role": "$to_user_data.role"},
                "pipeline": [
                    {"$match": {"$expr": {
                        "$and": [
                            {"$eq": ["$$role", "venue"]},
                            {"$eq": ["$user_id", "$$user_id"]}
                        ]
                    }}}
                ],
                "as": "venue_data"
            }
        },
        # 5. Joindre avec melomanes
        {
            "$lookup": {
                "from": "melomanes",
                "let": {"user_id": "$to_user_data.id", "role": "$to_user_data.role"},
                "pipeline": [
                    {"$match": {"$expr": {
                        "$and": [
                            {"$eq": ["$$role", "melomane"]},
                            {"$eq": ["$user_id", "$$user_id"]}
                        ]
                    }}}
                ],
                "as": "melomane_data"
            }
        },
        # 6. Projeter les champs finaux
        {
            "$project": {
                "_id": 0,
                "id": 1,
                "from_user_id": 1,
                "to_user_id": 1,
                "status": 1,
                "created_at": 1,
                # to_user enrichi
                "to_user": {
                    "id": "$to_user_data.id",
                    "email": "$to_user_data.email",
                    "role": "$to_user_data.role",
                    "pseudo": {
                        "$switch": {
                            "branches": [
                                {
                                    "case": {"$eq": ["$to_user_data.role", "musician"]},
                                    "then": {"$arrayElemAt": ["$musician_data.pseudo", 0]}
                                },
                                {
                                    "case": {"$eq": ["$to_user_data.role", "venue"]},
                                    "then": {"$arrayElemAt": ["$venue_data.name", 0]}
                                },
                                {
                                    "case": {"$eq": ["$to_user_data.role", "melomane"]},
                                    "then": {"$arrayElemAt": ["$melomane_data.pseudo", 0]}
                                }
                            ],
                            "default": "$to_user_data.email"
                        }
                    },
                    "profile_image": {
                        "$switch": {
                            "branches": [
                                {
                                    "case": {"$eq": ["$to_user_data.role", "musician"]},
                                    "then": {"$arrayElemAt": ["$musician_data.profile_image", 0]}
                                },
                                {
                                    "case": {"$eq": ["$to_user_data.role", "venue"]},
                                    "then": {"$arrayElemAt": ["$venue_data.profile_image", 0]}
                                },
                                {
                                    "case": {"$eq": ["$to_user_data.role", "melomane"]},
                                    "then": {"$arrayElemAt": ["$melomane_data.profile_image", 0]}
                                }
                            ],
                            "default": None
                        }
                    },
                    "city": {
                        "$switch": {
                            "branches": [
                                {
                                    "case": {"$eq": ["$to_user_data.role", "musician"]},
                                    "then": {"$arrayElemAt": ["$musician_data.city", 0]}
                                },
                                {
                                    "case": {"$eq": ["$to_user_data.role", "venue"]},
                                    "then": {"$arrayElemAt": ["$venue_data.city", 0]}
                                },
                                {
                                    "case": {"$eq": ["$to_user_data.role", "melomane"]},
                                    "then": {"$arrayElemAt": ["$melomane_data.city", 0]}
                                }
                            ],
                            "default": None
                        }
                    }
                }
            }
        }
    ]
    
    result = await db.friends.aggregate(pipeline).to_list(100)
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
    
    # Accepter la demande
    await db.friends.update_one({"id": request_id}, {"$set": {"status": "accepted"}})
    
    # Créer une notification pour l'expéditeur
    notification_id = str(uuid.uuid4())
    accepter_user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    accepter_name = accepter_user.get("name", "Un utilisateur") if accepter_user else "Un utilisateur"
    
    notification_doc = {
        "id": notification_id,
        "user_id": request["from_user_id"],
        "type": "friend_accepted",
        "message": f"{accepter_name} a accepté votre demande d'ami",
        "related_id": request_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "read": False
    }
    await db.notifications.insert_one(notification_doc)
    
    # Supprimer la notification de demande d'ami pour l'accepteur
    await db.notifications.delete_many({
        "related_id": request_id,
        "type": "friend_request",
        "user_id": current_user["id"]
    })
    
    return {"message": "Demande d'ami acceptée"}
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
    """List all friends of the current user (optimized with aggregation)"""
    # Utiliser une agrégation pour éviter le problème N+1
    pipeline = [
        # 1. Filtrer les amitiés acceptées (bidirectionnel)
        {
            "$match": {
                "$or": [
                    {"from_user_id": current_user["id"], "status": "accepted"},
                    {"to_user_id": current_user["id"], "status": "accepted"}
                ]
            }
        },
        # 2. Calculer l'ID de l'ami (l'autre personne)
        {
            "$addFields": {
                "friend_user_id": {
                    "$cond": {
                        "if": {"$eq": ["$from_user_id", current_user["id"]]},
                        "then": "$to_user_id",
                        "else": "$from_user_id"
                    }
                }
            }
        },
        # 3. Joindre avec users pour obtenir le rôle
        {
            "$lookup": {
                "from": "users",
                "localField": "friend_user_id",
                "foreignField": "id",
                "as": "friend_user_data"
            }
        },
        {"$unwind": {"path": "$friend_user_data", "preserveNullAndEmptyArrays": False}},
        # 4. Joindre avec musicians
        {
            "$lookup": {
                "from": "musicians",
                "let": {"user_id": "$friend_user_data.id", "role": "$friend_user_data.role"},
                "pipeline": [
                    {"$match": {"$expr": {
                        "$and": [
                            {"$eq": ["$$role", "musician"]},
                            {"$eq": ["$user_id", "$$user_id"]}
                        ]
                    }}}
                ],
                "as": "musician_data"
            }
        },
        # 5. Joindre avec venues
        {
            "$lookup": {
                "from": "venues",
                "let": {"user_id": "$friend_user_data.id", "role": "$friend_user_data.role"},
                "pipeline": [
                    {"$match": {"$expr": {
                        "$and": [
                            {"$eq": ["$$role", "venue"]},
                            {"$eq": ["$user_id", "$$user_id"]}
                        ]
                    }}}
                ],
                "as": "venue_data"
            }
        },
        # 6. Joindre avec melomanes
        {
            "$lookup": {
                "from": "melomanes",
                "let": {"user_id": "$friend_user_data.id", "role": "$friend_user_data.role"},
                "pipeline": [
                    {"$match": {"$expr": {
                        "$and": [
                            {"$eq": ["$$role", "melomane"]},
                            {"$eq": ["$user_id", "$$user_id"]}
                        ]
                    }}}
                ],
                "as": "melomane_data"
            }
        },
        # 7. Projeter les champs finaux
        {
            "$project": {
                "_id": 0,
                "friend_id": "$friend_user_id",
                "user_id": "$friend_user_id",
                "friend_name": "$friend_user_data.name",
                "friend_email": "$friend_user_data.email",
                "friend_role": "$friend_user_data.role",
                "since": "$created_at",
                # Profile ID selon le rôle
                "profile_id": {
                    "$switch": {
                        "branches": [
                            {
                                "case": {"$eq": ["$friend_user_data.role", "musician"]},
                                "then": {"$arrayElemAt": ["$musician_data.id", 0]}
                            },
                            {
                                "case": {"$eq": ["$friend_user_data.role", "venue"]},
                                "then": {"$arrayElemAt": ["$venue_data.id", 0]}
                            },
                            {
                                "case": {"$eq": ["$friend_user_data.role", "melomane"]},
                                "then": {"$arrayElemAt": ["$melomane_data.id", 0]}
                            }
                        ],
                        "default": None
                    }
                },
                # Pseudo/Nom selon le rôle
                "pseudo": {
                    "$switch": {
                        "branches": [
                            {
                                "case": {"$eq": ["$friend_user_data.role", "musician"]},
                                "then": {"$arrayElemAt": ["$musician_data.pseudo", 0]}
                            },
                            {
                                "case": {"$eq": ["$friend_user_data.role", "venue"]},
                                "then": {"$arrayElemAt": ["$venue_data.name", 0]}
                            },
                            {
                                "case": {"$eq": ["$friend_user_data.role", "melomane"]},
                                "then": {"$arrayElemAt": ["$melomane_data.pseudo", 0]}
                            }
                        ],
                        "default": "$friend_user_data.email"
                    }
                },
                # Image de profil
                "profile_image": {
                    "$switch": {
                        "branches": [
                            {
                                "case": {"$eq": ["$friend_user_data.role", "musician"]},
                                "then": {"$arrayElemAt": ["$musician_data.profile_image", 0]}
                            },
                            {
                                "case": {"$eq": ["$friend_user_data.role", "venue"]},
                                "then": {"$arrayElemAt": ["$venue_data.profile_image", 0]}
                            },
                            {
                                "case": {"$eq": ["$friend_user_data.role", "melomane"]},
                                "then": {"$arrayElemAt": ["$melomane_data.profile_image", 0]}
                            }
                        ],
                        "default": None
                    }
                },
                # Ville
                "city": {
                    "$switch": {
                        "branches": [
                            {
                                "case": {"$eq": ["$friend_user_data.role", "musician"]},
                                "then": {"$arrayElemAt": ["$musician_data.city", 0]}
                            },
                            {
                                "case": {"$eq": ["$friend_user_data.role", "venue"]},
                                "then": {"$arrayElemAt": ["$venue_data.city", 0]}
                            },
                            {
                                "case": {"$eq": ["$friend_user_data.role", "melomane"]},
                                "then": {"$arrayElemAt": ["$melomane_data.city", 0]}
                            }
                        ],
                        "default": None
                    }
                },
                # Instruments (seulement pour musiciens)
                "instruments": {
                    "$cond": {
                        "if": {"$eq": ["$friend_user_data.role", "musician"]},
                        "then": {"$arrayElemAt": ["$musician_data.instruments", 0]},
                        "else": []
                    }
                }
            }
        }
    ]
    
    result = await db.friends.aggregate(pipeline).to_list(1000)
    return result


@router.delete("/friends/{friend_user_id}")
async def remove_friend(friend_user_id: str, current_user: dict = Depends(get_current_user)):
    """Remove a friend"""
    result = await db.friends.delete_one({
        "$or": [
            {"from_user_id": current_user["id"], "to_user_id": friend_user_id, "status": "accepted"},
            {"from_user_id": friend_user_id, "to_user_id": current_user["id"], "status": "accepted"}
        ]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Friendship not found")
    
    return {"message": "Friend removed"}


# ============= BLOCK SYSTEM =============

@router.post("/users/block/{user_id}")
async def block_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Block a user"""
    # Vérifier que l'utilisateur ne se bloque pas lui-même
    if current_user["id"] == user_id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous bloquer vous-même")
    
    # Vérifier que l'utilisateur cible existe
    target_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    # Vérifier si déjà bloqué
    existing_block = await db.blocked_users.find_one({
        "blocker_id": current_user["id"],
        "blocked_id": user_id
    })
    if existing_block:
        raise HTTPException(status_code=400, detail="Utilisateur déjà bloqué")
    
    # Supprimer l'amitié si elle existe
    await db.friends.delete_many({
        "$or": [
            {"from_user_id": current_user["id"], "to_user_id": user_id},
            {"from_user_id": user_id, "to_user_id": current_user["id"]}
        ]
    })
    
    # Supprimer toutes les demandes d'ami en attente dans les deux sens
    await db.friends.delete_many({
        "$or": [
            {"from_user_id": current_user["id"], "to_user_id": user_id, "status": "pending"},
            {"from_user_id": user_id, "to_user_id": current_user["id"], "status": "pending"}
        ]
    })
    
    # Créer le blocage
    block_id = str(uuid.uuid4())
    block_doc = {
        "id": block_id,
        "blocker_id": current_user["id"],
        "blocked_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.blocked_users.insert_one(block_doc)
    
    return {"message": "Utilisateur bloqué"}


@router.delete("/users/unblock/{user_id}")
async def unblock_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Unblock a user"""
    result = await db.blocked_users.delete_one({
        "blocker_id": current_user["id"],
        "blocked_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blocage introuvable")
    
    return {"message": "Utilisateur débloqué"}


@router.get("/users/blocked")
async def get_blocked_users(current_user: dict = Depends(get_current_user)):
    """Get list of blocked users"""
    blocks = await db.blocked_users.find({
        "blocker_id": current_user["id"]
    }, {"_id": 0}).to_list(1000)
    
    result = []
    for block in blocks:
        # Récupérer les infos de l'utilisateur bloqué
        blocked_user = await db.users.find_one({"id": block["blocked_id"]}, {"_id": 0, "password": 0})
        if blocked_user:
            blocked_data = {
                "user_id": block["blocked_id"],
                "name": blocked_user.get("name"),
                "email": blocked_user.get("email"),
                "role": blocked_user.get("role"),
                "blocked_at": block.get("created_at")
            }
            
            # Récupérer le profil selon le rôle
            if blocked_user.get("role") == "musician":
                musician = await db.musicians.find_one({"user_id": block["blocked_id"]}, {"_id": 0})
                if musician:
                    blocked_data["pseudo"] = musician.get("pseudo")
                    blocked_data["profile_image"] = musician.get("profile_image")
            elif blocked_user.get("role") == "venue":
                venue = await db.venues.find_one({"user_id": block["blocked_id"]}, {"_id": 0})
                if venue:
                    blocked_data["pseudo"] = venue.get("name")
                    blocked_data["profile_image"] = venue.get("profile_image")
            elif blocked_user.get("role") == "melomane":
                melomane = await db.melomanes.find_one({"user_id": block["blocked_id"]}, {"_id": 0})
                if melomane:
                    blocked_data["pseudo"] = melomane.get("pseudo")
                    blocked_data["profile_image"] = melomane.get("profile_image")
            
            result.append(blocked_data)
    
    return result




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



# ============================================================================
# TEMPORARY LOCATION - HYBRID GEOLOCATION SYSTEM
# ============================================================================

@router.post("/musicians/me/temporary-location")
async def set_temporary_location(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Activate temporary location for 24 hours (hybrid geolocation system)
    
    Methods:
    1. GPS: {"method": "gps", "latitude": 48.8566, "longitude": 2.3522}
    2. Manual: {"method": "manual", "city": "Paris", "postal_code": "75001"}
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can set temporary location")
    
    method = data.get("method", "gps")
    
    # Calculate expiration (24 hours from now)
    from datetime import timedelta
    expires = datetime.now(timezone.utc) + timedelta(hours=24)
    
    update_data = {
        "temporary_location_enabled": True,
        "temporary_location_expires": expires.isoformat()
    }
    
    if method == "gps":
        # GPS coordinates provided
        latitude = data.get("latitude")
        longitude = data.get("longitude")
        
        if not latitude or not longitude:
            raise HTTPException(status_code=400, detail="Latitude and longitude required for GPS method")
        
        update_data["temporary_latitude"] = latitude
        update_data["temporary_longitude"] = longitude
        
        # Reverse geocode to get city name (optional, for display)
        try:
            # Simple reverse geocode - could be improved with actual API
            update_data["temporary_city"] = f"GPS ({latitude:.4f}, {longitude:.4f})"
        except Exception:
            update_data["temporary_city"] = "Position GPS"
    
    elif method == "manual":
        # Manual city input
        city = data.get("city")
        postal_code = data.get("postal_code")
        
        if not city:
            raise HTTPException(status_code=400, detail="City required for manual method")
        
        # Geocode the city
        try:
            from server import geocode_address
            result = await geocode_address({"city": city, "postal_code": postal_code})
            
            if result and result.get("latitude"):
                update_data["temporary_latitude"] = result["latitude"]
                update_data["temporary_longitude"] = result["longitude"]
                update_data["temporary_city"] = city
            else:
                raise HTTPException(status_code=404, detail=f"Unable to geocode city: {city}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Geocoding error: {str(e)}")
    
    else:
        raise HTTPException(status_code=400, detail="Invalid method. Use 'gps' or 'manual'")
    
    # Update musician profile
    await db.musicians.update_one(
        {"user_id": current_user["id"]},
        {"$set": update_data}
    )
    
    return {
        "message": "Temporary location activated",
        "expires": expires.isoformat(),
        "city": update_data.get("temporary_city"),
        "method": method
    }


@router.delete("/musicians/me/temporary-location")
async def disable_temporary_location(current_user: dict = Depends(get_current_user)):
    """Disable temporary location (return to profile city)"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can disable temporary location")
    
    await db.musicians.update_one(
        {"user_id": current_user["id"]},
        {"$set": {
            "temporary_location_enabled": False,
            "temporary_latitude": None,
            "temporary_longitude": None,
            "temporary_city": None,
            "temporary_location_expires": None
        }}
    )
    
    return {"message": "Temporary location disabled"}


@router.get("/musicians/me/temporary-location")
async def get_temporary_location_status(current_user: dict = Depends(get_current_user)):
    """Get temporary location status"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can access this")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Check if expired
    enabled = musician.get("temporary_location_enabled", False)
    expires = musician.get("temporary_location_expires")
    
    if enabled and expires:
        expires_dt = datetime.fromisoformat(expires)
        if datetime.now(timezone.utc) > expires_dt:
            # Expired - disable automatically
            await db.musicians.update_one(
                {"user_id": current_user["id"]},
                {"$set": {
                    "temporary_location_enabled": False,
                    "temporary_latitude": None,
                    "temporary_longitude": None,
                    "temporary_city": None,
                    "temporary_location_expires": None
                }}
            )
            enabled = False
            expires = None
    
    return {
        "enabled": enabled,
        "latitude": musician.get("temporary_latitude"),
        "longitude": musician.get("temporary_longitude"),
        "city": musician.get("temporary_city"),
        "expires": expires,
        "profile_city": musician.get("city"),
        "profile_latitude": musician.get("latitude"),
        "profile_longitude": musician.get("longitude")
    }
