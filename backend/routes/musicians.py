"""
Musicians router - Handles musician profiles, friends, and bands
"""
from fastapi import APIRouter, HTTPException, Depends, Header, Query, UploadFile, File, Request
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import os
import logging
import string
import secrets  # Use secrets instead of random for secure tokens

from models import (
    MusicianProfile, MusicianProfileResponse,
    FriendRequest, FriendRequestResponse,
    ConcertUpdateRequest
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


def generate_invite_code() -> str:
    """Génère un code d'invitation unique de 6 caractères (cryptographiquement sécurisé)"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(6))



async def save_to_history(collection_name: str, document_id: str, data: dict, action: str = "update"):
    """Sauvegarde une copie du document dans la collection d'historique"""
    try:
        history_doc = {
            "document_id": document_id,
            "collection": collection_name,
            "action": action,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db[f"{collection_name}_history"].insert_one(history_doc)
        logger.info(f"✅ Saved {collection_name} history for {document_id}")
    except Exception as e:
        logger.error(f"❌ Failed to save history: {e}")


def validate_profile_update(current_profile: dict, update_data: dict, min_fields: int = 3) -> bool:
    """
    Valide qu'une mise à jour de profil n'est pas un écrasement accidentel
    Retourne True si la mise à jour semble valide, False sinon
    """
    # Champs critiques qui ne devraient jamais être tous vides en même temps
    critical_fields = ['pseudo', 'instruments', 'music_styles', 'city', 'bio', 'profile_image']
    
    # Compter combien de champs critiques sont remplis dans la mise à jour
    filled_fields = 0
    for field in critical_fields:
        value = update_data.get(field)
        if value:
            if isinstance(value, (list, str)):
                if len(value) > 0:
                    filled_fields += 1
            else:
                filled_fields += 1
    
    # Si moins de min_fields champs critiques sont remplis, c'est suspect
    if filled_fields < min_fields:
        logger.warning(f"⚠️ Profile update validation failed: only {filled_fields} critical fields filled (min: {min_fields})")
        return False
    
    return True


async def create_band_invite_code_auto(band_id: str, user_id: str) -> None:
    """
    Crée automatiquement un code d'invitation pour un nouveau groupe.
    Appelé lors de la création d'un groupe.
    """
    try:
        # Vérifier si un code existe déjà
        existing_code = await db.band_invite_codes.find_one(
            {"band_id": band_id, "is_active": True},
            {"_id": 0}
        )
        
        if existing_code:
            logger.info(f"Invite code already exists for band {band_id}")
            return
        
        # Générer un code unique
        code = generate_invite_code()
        while await db.band_invite_codes.find_one({"code": code, "is_active": True}):
            code = generate_invite_code()
        
        # Créer le code d'invitation
        invite_code = {
            "id": str(uuid.uuid4()),
            "band_id": band_id,
            "code": code,
            "created_by": user_id,
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "is_active": True,
            "used_by": []
        }
        
        await db.band_invite_codes.insert_one(invite_code)
        logger.info(f"Auto-generated invite code {code} for band {band_id}")
        
    except Exception as e:
        logger.error(f"Failed to create invite code for band {band_id}: {e}")
        # Non-blocking, continue même si la génération échoue


# ============= HELPER FUNCTIONS =============

def calculate_concert_hours_official(concert: dict) -> float:
    """
    Calculate hours for a concert using OFFICIAL INTERMITTENCE LOGIC
    
    Rules (France Travail / ex-Pôle Emploi):
    - Cachet isolé = 12 hours
    - Cachet groupé = 8 hours
    
    Args:
        concert: Concert dictionary with cachet_type field
        
    Returns:
        Hours count (12, 8, or fallback to guso_hours if legacy data)
    """
    cachet_type = concert.get("cachet_type")
    
    if cachet_type == "isolé":
        return 12.0
    elif cachet_type == "groupé":
        return 8.0
    else:
        # Legacy fallback for old data without cachet_type
        return concert.get("guso_hours", 0)



# ============= MUSICIAN PROFILES =============

@router.post("/musicians", response_model=MusicianProfileResponse)
async def create_musician_profile(data: MusicianProfile, request: Request, current_user: dict = Depends(get_current_user)):
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
async def update_musician_profile(data: MusicianProfile, request: Request, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musician accounts can update musician profiles")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # 🛡️ PROTECTION 1: Sauvegarder l'état actuel dans l'historique
    await save_to_history("musicians", musician["id"], musician, action="before_update")
    
    # 🛡️ PROTECTION 2: Valider que ce n'est pas un écrasement accidentel
    update_data_dict = data.model_dump()
    if not validate_profile_update(musician, update_data_dict, min_fields=2):
        logger.error(f"🚨 Blocked suspicious profile update for musician {musician['id']}")
        raise HTTPException(
            status_code=400, 
            detail="Update rejected: too few fields filled. This looks like an accidental data wipe. Please fill at least 2 critical fields (pseudo, instruments, music_styles, city, bio, or profile_image)."
        )
    
    # Add IDs to new concerts
    concerts_with_ids = []
    for concert in data.concerts:
        concert_dict = concert.model_dump()
        if not concert_dict.get("id"):
            concert_dict["id"] = str(uuid.uuid4())
        concerts_with_ids.append(concert_dict)
    
    update_data = data.model_dump()
    update_data["concerts"] = concerts_with_ids
    
    # Sync bands to the bands collection
    if update_data.get("bands"):
        bands_with_ids = []
        for band_data in update_data["bands"]:
            # Utiliser l'ID existant ou générer un nouveau
            band_id = band_data.get("band_id") or band_data.get("id")
            if not band_id:
                band_id = f"band_{int(datetime.now().timestamp() * 1000)}_{uuid.uuid4().hex[:9]}"
            
            # Mettre à jour le band_data avec l'ID
            band_data["band_id"] = band_id
            band_data["id"] = band_id  # Pour compatibilité
            
            # Vérifier si le groupe existe déjà
            existing_band = await db.bands.find_one({"id": band_id}, {"_id": 0})
            
            if not existing_band:
                # Générer un code d'invitation unique
                invite_code = generate_invite_code()
                while await db.bands.find_one({"invite_code": invite_code}):
                    invite_code = generate_invite_code()
                
                # Créer le groupe dans la collection bands
                band_document = {
                    "id": band_id,
                    "name": band_data.get("name"),
                    "leader_id": musician.get("id"),
                    "leader_name": musician.get("pseudo") or musician.get("name"),
                    "description": band_data.get("description"),
                    "members_count": band_data.get("members_count") or 1,
                    "music_styles": band_data.get("music_styles") or [],
                    "band_type": band_data.get("band_type"),
                    "city": band_data.get("city"),
                    "invite_code": invite_code,
                    "created_at": datetime.now().isoformat()
                }
                await db.bands.insert_one(band_document)
                logger.info(f"Band created in bands collection: {band_id} - {band_data.get('name')} - code: {invite_code}")
                
                # Stocker le code aussi dans le band_data pour le profil musicien
                band_data["invite_code"] = invite_code
                
                # Générer automatiquement un code d'invitation dans la collection legacy
                await create_band_invite_code_auto(band_id, current_user["id"])
            else:
                # Si le groupe existe mais n'a pas de code, en générer un
                if not existing_band.get("invite_code"):
                    invite_code = generate_invite_code()
                    while await db.bands.find_one({"invite_code": invite_code}):
                        invite_code = generate_invite_code()
                    await db.bands.update_one({"id": band_id}, {"$set": {"invite_code": invite_code}})
                    band_data["invite_code"] = invite_code
                else:
                    band_data["invite_code"] = existing_band.get("invite_code")
            
            bands_with_ids.append(band_data)
        
        # Remplacer les bands dans update_data avec ceux qui ont des IDs
        update_data["bands"] = bands_with_ids
    
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
async def get_my_musician_profile(request: Request, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musician accounts can access this")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    friends_count = await db.friends.count_documents({
        "$or": [{"from_user_id": current_user["id"]}, {"to_user_id": current_user["id"]}],
        "status": "accepted"
    })
    
    return MusicianProfileResponse(**{**musician, "friends_count": friends_count})


# Alias route for mobile apps (PUT /musicians/me)
@router.put("/musicians/me", response_model=MusicianProfileResponse)
async def update_my_musician_profile(data: MusicianProfile, request: Request, current_user: dict = Depends(get_current_user)):
    """
    Alias de PUT /musicians pour les apps mobiles
    Identique à update_musician_profile mais avec /me au lieu de /{musician_id}
    Inclut les mêmes protections contre l'écrasement accidentel
    """
    # Réutiliser la logique de update_musician_profile (qui inclut les protections)
    return await update_musician_profile(data, current_user)


# 🛡️ Endpoint de restauration depuis l'historique
@router.post("/musicians/me/restore")
async def restore_musician_profile_from_history(
    request: Request,
    timestamp: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Restaure le profil musicien depuis l'historique
    Si timestamp fourni, restaure à ce moment précis
    Sinon, restaure la dernière version sauvegardée
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musician accounts can restore profiles")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Chercher dans l'historique
    query = {"document_id": musician["id"], "collection": "musicians"}
    if timestamp:
        query["timestamp"] = timestamp
    
    history_entry = await db.musicians_history.find_one(
        query,
        {"_id": 0},
        sort=[("timestamp", -1)]  # Plus récent en premier
    )
    
    if not history_entry:
        raise HTTPException(status_code=404, detail="No history found for this profile")
    
    # Restaurer les données
    restored_data = history_entry["data"]
    restored_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Sauvegarder l'état actuel avant restauration
    await save_to_history("musicians", musician["id"], musician, action="before_restore")
    
    # Mettre à jour le profil
    await db.musicians.update_one(
        {"id": musician["id"]},
        {"$set": restored_data}
    )
    
    logger.info(f"✅ Restored profile for musician {musician['id']} from {history_entry['timestamp']}")
    
    # Récupérer friends_count pour la réponse
    friends_count = await db.friends.count_documents({
        "$or": [{"from_user_id": current_user["id"]}, {"to_user_id": current_user["id"]}],
        "status": "accepted"
    })
    
    return {
        "message": "Profile restored successfully",
        "restored_from": history_entry["timestamp"],
        "profile": MusicianProfileResponse(**{**restored_data, "friends_count": friends_count})
    }


# 🛡️ Endpoint pour voir l'historique
@router.get("/musicians/me/history")
async def get_musician_profile_history(request: Request, current_user: dict = Depends(get_current_user)):
    """
    Récupère l'historique des modifications du profil
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musician accounts can view history")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Récupérer les 20 dernières versions
    history = await db.musicians_history.find(
        {"document_id": musician["id"], "collection": "musicians"},
        {"_id": 0, "data": 0}  # Ne pas retourner les données complètes, juste métadata
    ).sort("timestamp", -1).limit(20).to_list(20)
    
    return {
        "count": len(history),
        "history": history
    }

    
    # Utiliser les bands embarqués dans le profil musicien
    bands = musician.get("bands", [])
    
    # Enrichir chaque band : générer invite_code si manquant, définir admin_id
    updated = False
    for band_data in bands:
        band_id = band_data.get("band_id") or band_data.get("id")
        
        # Définir admin_id si absent
        if not band_data.get("admin_id"):
            band_data["admin_id"] = current_user["id"]
            updated = True
        
        # Générer invite_code si absent
        if not band_data.get("invite_code"):
            code = generate_invite_code()
            band_data["invite_code"] = code
            updated = True
            # Aussi mettre à jour la collection bands si le doc existe
            if band_id:
                await db.bands.update_one({"id": band_id}, {"$set": {"invite_code": code}}, upsert=False)
    
    # Sauvegarder les mises à jour dans le profil musicien
    if updated:
        await db.musicians.update_one(
            {"user_id": current_user["id"]},
            {"$set": {"bands": bands}}
        )
    


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
async def get_friend_requests(request: Request, current_user: dict = Depends(get_current_user)):
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
async def get_sent_requests(request: Request, current_user: dict = Depends(get_current_user)):
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
async def cancel_friend_request(request_id: str, request: Request, current_user: dict = Depends(get_current_user)):
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
async def accept_friend_request(request_id: str, request: Request, current_user: dict = Depends(get_current_user)):
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
async def reject_friend_request(request_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    request = await db.friends.find_one({"id": request_id, "to_user_id": current_user["id"]})
    if not request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    await db.friends.delete_one({"id": request_id})
    return {"message": "Friend request rejected"}


@router.get("/friends")
async def list_friends(request: Request, current_user: dict = Depends(get_current_user)):
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
async def remove_friend(friend_user_id: str, request: Request, current_user: dict = Depends(get_current_user)):
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
async def block_user(user_id: str, request: Request, current_user: dict = Depends(get_current_user)):
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
async def unblock_user(user_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    """Unblock a user"""
    result = await db.blocked_users.delete_one({
        "blocker_id": current_user["id"],
        "blocked_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blocage introuvable")
    
    return {"message": "Utilisateur débloqué"}


@router.get("/users/blocked")
async def get_blocked_users(request: Request, current_user: dict = Depends(get_current_user)):
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
async def get_current_participation(request: Request, current_user: dict = Depends(get_current_user)):
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
    request: Request, current_user: dict = Depends(get_current_user)
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
            from utils.geocoding import geocode_address
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
async def disable_temporary_location(request: Request, current_user: dict = Depends(get_current_user)):
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
async def get_temporary_location_status(request: Request, current_user: dict = Depends(get_current_user)):
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



# ============================================================================
# MUSICIEN PRO SUBSCRIPTION
# ============================================================================

@router.post("/musicians/me/subscribe-pro")
async def create_pro_subscription(request: Request, current_user: dict = Depends(get_current_user)):
    """
    Create Stripe Checkout session for Musicien PRO subscription
    - FREE TRIAL: 7 days
    - Then: 6.99€/month with automatic renewal
    - Cancelable anytime before anniversary date
    
    Returns checkout URL for frontend redirect
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can subscribe to PRO")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Check if already PRO
    if musician.get("subscription_tier") == "pro" and musician.get("subscription_status") == "active":
        raise HTTPException(status_code=400, detail="Already subscribed to PRO")
    
    import stripe
    stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
    
    try:
        # Get or create Stripe customer
        stripe_customer_id = musician.get("stripe_customer_id")
        
        if not stripe_customer_id:
            # Create new customer
            customer = stripe.Customer.create(
                email=current_user["email"],
                name=musician.get("pseudo"),
                metadata={
                    "user_id": current_user["id"],
                    "musician_id": musician["id"],
                    "type": "musician_pro"
                }
            )
            stripe_customer_id = customer.id
            
            # Save customer ID
            await db.musicians.update_one(
                {"user_id": current_user["id"]},
                {"$set": {"stripe_customer_id": stripe_customer_id}}
            )
        
        # Create Checkout Session with 2 MONTHS FREE TRIAL
        frontend_url = os.environ.get("FRONTEND_URL", "https://collapsible-map.preview.emergentagent.com")
        
        checkout_session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': 'Musicien PRO',
                        'description': '7 JOURS GRATUITS puis 6,99€/mois - Annulable à tout moment',
                        'images': ['https://jamconnexion.com/images/pro-badge.png'],
                    },
                    'unit_amount': 699,  # 6.99€ in cents
                    'recurring': {
                        'interval': 'month',
                    },
                },
                'quantity': 1,
            }],
            mode='subscription',
            subscription_data={
                'trial_period_days': 7,  # 7 DAYS FREE TRIAL
                'metadata': {
                    'trial_duration': '7_days',
                    'user_id': current_user["id"]
                }
            },
            success_url=f'{frontend_url}/musician-dashboard?subscription=success&session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{frontend_url}/musician-dashboard?subscription=canceled',
            metadata={
                "user_id": current_user["id"],
                "musician_id": musician["id"],
                "subscription_type": "musician_pro"
            }
        )
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id,
            "trial_days": 7,
            "trial_info": "7 jours gratuits - Premier paiement le " + (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%d/%m/%Y")
        }
    
    except Exception as e:
        logger.error(f"Error creating subscription: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating subscription: {str(e)}")


@router.get("/musicians/me/subscription-status")
async def get_subscription_status(request: Request, current_user: dict = Depends(get_current_user)):
    """Get current subscription status with trial information"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can access subscription")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Check if in trial period
    subscription_started = musician.get("subscription_started")
    in_trial = False
    trial_ends = None
    days_remaining = None
    
    if subscription_started and musician.get("subscription_tier") == "pro":
        started_dt = datetime.fromisoformat(subscription_started)
        trial_end_dt = started_dt + timedelta(days=7)  # 7 days trial
        now = datetime.now(timezone.utc)
        
        if now < trial_end_dt:
            in_trial = True
            trial_ends = trial_end_dt.isoformat()
            days_remaining = (trial_end_dt - now).days
    
    return {
        "tier": musician.get("subscription_tier", "free"),
        "status": musician.get("subscription_status", "inactive"),
        "started": subscription_started,
        "expires": musician.get("subscription_expires"),
        "in_trial": in_trial,
        "trial_ends": trial_ends,
        "trial_days_remaining": days_remaining,
        "first_payment_date": trial_ends if in_trial else None,
        "features": {
            "accounting": musician.get("subscription_tier") == "pro",
            "analytics": musician.get("subscription_tier") == "pro",
            "badge": musician.get("subscription_tier") == "pro",
            "priority": musician.get("subscription_tier") == "pro"
        }
    }


@router.post("/musicians/me/cancel-subscription")
async def cancel_pro_subscription(request: Request, current_user: dict = Depends(get_current_user)):
    """Cancel PRO subscription (will remain active until end of period)"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can cancel subscription")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    stripe_subscription_id = musician.get("stripe_subscription_id")
    if not stripe_subscription_id:
        raise HTTPException(status_code=400, detail="No active subscription found")
    
    import stripe
    stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
    
    try:
        # Cancel at period end (user keeps access until then)
        subscription = stripe.Subscription.modify(
            stripe_subscription_id,
            cancel_at_period_end=True
        )
        
        await db.musicians.update_one(
            {"user_id": current_user["id"]},
            {"$set": {"subscription_status": "canceled"}}
        )
        
        return {
            "message": "Subscription canceled",
            "access_until": subscription.current_period_end
        }
    
    except Exception as e:
        logger.error(f"Error canceling subscription: {e}")
        raise HTTPException(status_code=500, detail=f"Error canceling subscription: {str(e)}")


# ============================================================================
# MUSICIEN PRO - COMPTABILITÉ
# ============================================================================

@router.get("/musicians/me/accounting/summary")
async def get_accounting_summary(
    request: Request,
    year: int = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get accounting summary (PRO feature)
    Returns: total revenues, expenses, concerts count, payment pending
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can access accounting")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Check PRO subscription
    if musician.get("subscription_tier") != "pro":
        raise HTTPException(status_code=403, detail="PRO subscription required for accounting features")
    
    # Get current year if not specified
    if not year:
        year = datetime.now(timezone.utc).year
    
    concerts = musician.get("concerts", [])
    
    # Filter by year
    year_concerts = [c for c in concerts if c.get("date", "").startswith(str(year))]
    
    # Calculate totals
    total_revenues = sum(c.get("cachet", 0) for c in year_concerts if c.get("cachet"))
    paid_revenues = sum(c.get("cachet", 0) for c in year_concerts if c.get("payment_status") == "paid")
    pending_revenues = sum(c.get("cachet", 0) for c in year_concerts if c.get("payment_status") == "pending")
    
    concerts_count = len(year_concerts)
    paid_count = len([c for c in year_concerts if c.get("payment_status") == "paid"])
    pending_count = len([c for c in year_concerts if c.get("payment_status") == "pending"])
    
    return {
        "year": year,
        "total_revenues": round(total_revenues, 2),
        "paid_revenues": round(paid_revenues, 2),
        "pending_revenues": round(pending_revenues, 2),
        "concerts_count": concerts_count,
        "paid_count": paid_count,
        "pending_count": pending_count,
        "average_cachet": round(total_revenues / concerts_count, 2) if concerts_count > 0 else 0
    }


@router.get("/musicians/me/accounting/concerts")
async def get_accounting_concerts(
    request: Request,
    year: int = None,
    region: str = None,
    formation_type: str = None,
    payment_status: str = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed concerts list with filters (PRO feature)
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can access accounting")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Check PRO subscription
    if musician.get("subscription_tier") != "pro":
        raise HTTPException(status_code=403, detail="PRO subscription required")
    
    concerts = musician.get("concerts", [])
    
    # Apply filters
    if year:
        concerts = [c for c in concerts if c.get("date", "").startswith(str(year))]
    
    if region:
        concerts = [c for c in concerts if c.get("region", "").lower() == region.lower()]
    
    if formation_type:
        concerts = [c for c in concerts if c.get("formation_type") == formation_type]
    
    if payment_status:
        concerts = [c for c in concerts if c.get("payment_status") == payment_status]
    
    # Sort by date descending
    concerts.sort(key=lambda x: x.get("date", ""), reverse=True)
    
    return concerts


@router.post("/musicians/me/accounting/export")
async def export_accounting_data(
    year: int,
    request: Request,
    format: str = "csv",  # "csv" or "pdf"
    current_user: dict = Depends(get_current_user)
):
    """
    Export accounting data (PRO feature)
    Returns: download URL
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can export accounting")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Check PRO subscription
    if musician.get("subscription_tier") != "pro":
        raise HTTPException(status_code=403, detail="PRO subscription required")
    
    concerts = musician.get("concerts", [])
    year_concerts = [c for c in concerts if c.get("date", "").startswith(str(year))]
    
    if format == "csv":
        # Generate CSV
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "Date", "Établissement", "Ville", "Région", "Formation", 
            "Cachet (€)", "Statut Paiement", "Date Paiement", "Facture N°", "Notes"
        ])
        
        # Data
        for concert in year_concerts:
            writer.writerow([
                concert.get("date", ""),
                concert.get("venue_name", ""),
                concert.get("city", ""),
                concert.get("region", ""),
                concert.get("formation_type", ""),
                concert.get("cachet", ""),
                concert.get("payment_status", ""),
                concert.get("payment_date", ""),
                concert.get("invoice_number", ""),
                concert.get("notes", "")
            ])
        
        csv_content = output.getvalue()
        
        # For now, return as inline data (could upload to S3 for production)
        import base64
        csv_base64 = base64.b64encode(csv_content.encode()).decode()
        
        return {
            "format": "csv",
            "filename": f"comptabilite_{year}_{musician.get('pseudo', 'musicien')}.csv",
            "data": csv_base64,
            "download_url": f"data:text/csv;base64,{csv_base64}"
        }
    
    else:
        raise HTTPException(status_code=400, detail="Only CSV format supported for now")


@router.get("/musicians/me/accounting/export/csv")
async def export_accounting_csv(
    request: Request,
    year: int = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Export accounting data as CSV file (PRO feature)
    """
    from fastapi.responses import StreamingResponse
    import csv
    import io
    
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can export accounting")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Check PRO subscription
    if musician.get("subscription_tier") != "pro":
        raise HTTPException(status_code=403, detail="PRO subscription required")
    
    if not year:
        year = datetime.now(timezone.utc).year
    
    concerts = musician.get("concerts", [])
    year_concerts = [c for c in concerts if c.get("date", "").startswith(str(year))]
    
    # Generate CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Date", "Établissement", "Ville", "Région", "Formation", 
        "Cachet (€)", "Statut Paiement", "Date Paiement", "Facture N°", "Notes"
    ])
    
    # Data
    for concert in year_concerts:
        writer.writerow([
            concert.get("date", ""),
            concert.get("venue_name", ""),
            concert.get("city", ""),
            concert.get("region", ""),
            concert.get("formation_type", ""),
            concert.get("cachet", ""),
            concert.get("payment_status", ""),
            concert.get("payment_date", ""),
            concert.get("invoice_number", ""),
            concert.get("notes", "")
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=comptabilite_{year}.csv"
        }
    )



@router.get("/musicians/me/accounting/invoices/download")
async def download_invoices_zip(
    request: Request,
    year: int = None,
    type: str = "all",  # 'all', 'guso', 'classic'
    start_date: str = None,  # Format: YYYY-MM-DD
    end_date: str = None,    # Format: YYYY-MM-DD
    current_user: dict = Depends(get_current_user)
):
    """
    Download all invoices as ZIP file (PRO feature)
    Filters: all, guso, classic
    Period: year OR start_date/end_date
    """
    import zipfile
    import io
    import aiohttp
    from fastapi.responses import StreamingResponse
    
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can download invoices")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Check PRO status - Feature reserved for PRO subscribers
    if musician.get("subscription_tier") != "pro":
        raise HTTPException(status_code=403, detail="Abonnement PRO requis pour télécharger les factures")
    
    concerts = musician.get("concerts", [])
    
    # Determine date range
    if start_date and end_date:
        # Use custom period
        date_start = datetime.fromisoformat(start_date)
        date_end = datetime.fromisoformat(end_date)
        period_label = f"{start_date}_au_{end_date}"
    elif year:
        # Use specific year
        date_start = datetime(year, 1, 1)
        date_end = datetime(year, 12, 31, 23, 59, 59)
        period_label = str(year)
    else:
        # Default to current year
        current_year = datetime.now(timezone.utc).year
        date_start = datetime(current_year, 1, 1)
        date_end = datetime(current_year, 12, 31, 23, 59, 59)
        period_label = str(current_year)
    
    # Filter concerts by date range and type
    filtered_concerts = []
    for concert in concerts:
        try:
            concert_date = datetime.fromisoformat(concert.get("date", ""))
            
            # Check if in date range
            if not (date_start <= concert_date <= date_end):
                continue
            
            # Filter by type
            if type == "guso" and not concert.get("is_guso"):
                continue
            elif type == "classic" and concert.get("is_guso"):
                continue
            
            # Only include concerts with invoice_url
            if concert.get("invoice_url"):
                filtered_concerts.append(concert)
        except Exception:
            continue
    
    if not filtered_concerts:
        raise HTTPException(status_code=404, detail="Aucune facture trouvée pour ce filtre")
    
    # Create ZIP file in memory
    zip_buffer = io.BytesIO()
    
    async with aiohttp.ClientSession() as session:
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for idx, concert in enumerate(filtered_concerts, 1):
                invoice_url = concert.get("invoice_url")
                if not invoice_url:
                    continue
                
                try:
                    # Download invoice file
                    async with session.get(invoice_url) as response:
                        if response.status == 200:
                            file_content = await response.read()
                            
                            # Generate filename
                            venue_name = concert.get("venue_name", "etablissement").replace("/", "-")
                            date_str = concert.get("date", "")[:10]  # YYYY-MM-DD
                            invoice_number = concert.get("invoice_number", f"INV{idx:03d}")
                            guso_label = "_GUSO" if concert.get("is_guso") else ""
                            
                            # Get file extension from URL or default to .pdf
                            ext = ".pdf"
                            if "." in invoice_url:
                                ext = "." + invoice_url.split(".")[-1].split("?")[0]
                            
                            filename = f"{date_str}_{venue_name}_{invoice_number}{guso_label}{ext}"
                            
                            # Add to ZIP
                            zip_file.writestr(filename, file_content)
                except Exception as e:
                    logger.error(f"Error downloading invoice {invoice_url}: {e}")
                    continue
    
    # Prepare ZIP for download
    zip_buffer.seek(0)
    
    filter_label = type if type != "all" else "toutes"
    filename = f"factures_{filter_label}_{period_label}.zip"
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )



@router.patch("/musicians/me/concerts/{concert_id}")
async def update_concert(
    concert_id: str,
    data: ConcertUpdateRequest,
    request: Request, current_user: dict = Depends(get_current_user)
):
    """Update concert payment information (PRO feature)"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can update concerts")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    concerts = musician.get("concerts", [])
    concert_index = next((i for i, c in enumerate(concerts) if c.get("id") == concert_id), None)
    
    if concert_index is None:
        raise HTTPException(status_code=404, detail="Concert not found")
    
    # Update fields
    if data.payment_status is not None:
        concerts[concert_index]["payment_status"] = data.payment_status
        if data.payment_status == "paid" and not concerts[concert_index].get("payment_date"):
            concerts[concert_index]["payment_date"] = datetime.now(timezone.utc).isoformat()
    
    if data.payment_date is not None:
        concerts[concert_index]["payment_date"] = data.payment_date
    
    if data.cachet is not None:
        concerts[concert_index]["cachet"] = data.cachet
    
    if data.invoice_url is not None:
        concerts[concert_index]["invoice_url"] = data.invoice_url
    
    if data.invoice_number is not None:
        concerts[concert_index]["invoice_number"] = data.invoice_number
    
    if data.notes is not None:
        concerts[concert_index]["notes"] = data.notes
    
    # GUSO fields
    if data.cachet_type is not None:
        concerts[concert_index]["cachet_type"] = data.cachet_type
        # If cachet_type is set, remove guso_hours (use official logic)
        if data.cachet_type in ["isolé", "groupé"] and "guso_hours" in concerts[concert_index]:
            del concerts[concert_index]["guso_hours"]
    
    if data.guso_hours is not None:
        concerts[concert_index]["guso_hours"] = data.guso_hours
        # If custom hours are set, remove cachet_type
        if "cachet_type" in concerts[concert_index]:
            concerts[concert_index]["cachet_type"] = None
    
    if data.guso_contract_type is not None:
        concerts[concert_index]["guso_contract_type"] = data.guso_contract_type
    
    # Save
    await db.musicians.update_one(
        {"user_id": current_user["id"]},
        {"$set": {"concerts": concerts}}
    )
    
    return {"message": "Concert updated successfully", "concert": concerts[concert_index]}


# ============================================================================
# GUSO ACCOUNTING
# ============================================================================

@router.get("/musicians/me/guso/summary")
async def get_guso_summary(
    request: Request,
    year: int = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get GUSO accounting summary (PRO feature)
    Returns: total hours, concerts count, threshold progress (507h)
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can access GUSO accounting")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Check PRO subscription
    if musician.get("subscription_tier") != "pro":
        raise HTTPException(status_code=403, detail="PRO subscription required for GUSO accounting")
    
    # Get current year if not specified
    if not year:
        year = datetime.now(timezone.utc).year
    
    concerts = musician.get("concerts", [])
    
    # Filter GUSO concerts by year
    guso_concerts = [
        c for c in concerts 
        if c.get("is_guso") and c.get("date", "").startswith(str(year))
    ]
    
    # Calculate totals using OFFICIAL INTERMITTENCE LOGIC
    # Hours are calculated ONLY from cachet_type, NOT from euros:
    # - cachet isolé = 12 hours
    # - cachet groupé = 8 hours
    total_hours = 0
    cachets_isoles_count = 0
    cachets_groupes_count = 0
    
    for c in guso_concerts:
        cachet_type = c.get("cachet_type")
        if cachet_type == "isolé":
            total_hours += 12
            cachets_isoles_count += 1
        elif cachet_type == "groupé":
            total_hours += 8
            cachets_groupes_count += 1
        # If no cachet_type specified yet, fallback to old guso_hours (for legacy data)
        elif c.get("guso_hours"):
            total_hours += c.get("guso_hours", 0)
    
    total_cachet = sum(c.get("cachet", 0) for c in guso_concerts if c.get("cachet"))
    declared_count = len([c for c in guso_concerts if c.get("guso_declared")])
    pending_count = len([c for c in guso_concerts if not c.get("guso_declared")])
    
    # Calculate progress towards 507h threshold
    threshold = 507
    progress_percentage = min(100, (total_hours / threshold) * 100) if total_hours > 0 else 0
    hours_remaining = max(0, threshold - total_hours)
    
    # Status based on hours
    status = "inactive"
    if total_hours >= threshold:
        status = "eligible"  # Eligible for intermittent status
    elif total_hours >= threshold * 0.75:  # 75% of threshold
        status = "close"  # Close to threshold
    elif total_hours > 0:
        status = "active"  # Has some hours
    
    return {
        "year": year,
        "total_hours": round(total_hours, 2),
        "total_cachet": round(total_cachet, 2),
        "concerts_count": len(guso_concerts),
        "declared_count": declared_count,
        "pending_count": pending_count,
        "threshold": threshold,
        "hours_remaining": round(hours_remaining, 2),
        "progress_percentage": round(progress_percentage, 2),
        "status": status,
        "guso_number": musician.get("guso_number"),
        "is_guso_member": musician.get("is_guso_member", False),
        "manual_hours": musician.get(f"guso_manual_hours_{year}"),
        "manual_cachet": musician.get(f"guso_manual_cachet_{year}"),
        # Official intermittence breakdown
        "cachets_isoles_count": cachets_isoles_count,
        "cachets_groupes_count": cachets_groupes_count,
        "hours_from_isoles": cachets_isoles_count * 12,
        "hours_from_groupes": cachets_groupes_count * 8
    }


@router.put("/musicians/me/guso/manual")
async def update_guso_manual_values(
    data: dict,
    request: Request, current_user: dict = Depends(get_current_user)
):
    """
    Update manual GUSO hours and cachet values (PRO feature)
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can update GUSO values")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Check PRO subscription
    if musician.get("subscription_tier") != "pro":
        raise HTTPException(status_code=403, detail="PRO subscription required")
    
    year = data.get("year", datetime.now(timezone.utc).year)
    manual_hours = data.get("manual_hours")
    manual_cachet = data.get("manual_cachet")
    
    # Update the musician document with year-specific manual values
    await db.musicians.update_one(
        {"user_id": current_user["id"]},
        {
            "$set": {
                f"guso_manual_hours_{year}": manual_hours,
                f"guso_manual_cachet_{year}": manual_cachet
            }
        }
    )
    
    return {"success": True, "year": year, "manual_hours": manual_hours, "manual_cachet": manual_cachet}


@router.get("/musicians/me/guso/concerts")
async def get_guso_concerts(
    request: Request,
    year: int = None,
    declared: bool = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get GUSO concerts list with filters (PRO feature)
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can access GUSO concerts")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Check PRO subscription
    if musician.get("subscription_tier") != "pro":
        raise HTTPException(status_code=403, detail="PRO subscription required")
    
    concerts = musician.get("concerts", [])
    
    # Filter GUSO concerts
    guso_concerts = [c for c in concerts if c.get("is_guso")]
    
    # Apply filters
    if year:
        guso_concerts = [c for c in guso_concerts if c.get("date", "").startswith(str(year))]
    
    if declared is not None:
        guso_concerts = [c for c in guso_concerts if c.get("guso_declared") == declared]
    
    # Sort by date descending
    guso_concerts.sort(key=lambda x: x.get("date", ""), reverse=True)
    
    return guso_concerts


@router.patch("/musicians/me/guso/concerts/{concert_id}/declare")
async def mark_concert_as_declared(
    concert_id: str,
    request: Request, current_user: dict = Depends(get_current_user)
):
    """Mark a GUSO concert as declared"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can update concerts")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    concerts = musician.get("concerts", [])
    concert_index = next((i for i, c in enumerate(concerts) if c.get("id") == concert_id), None)
    
    if concert_index is None:
        raise HTTPException(status_code=404, detail="Concert not found")
    
    if not concerts[concert_index].get("is_guso"):
        raise HTTPException(status_code=400, detail="This concert is not marked as GUSO")
    
    # Mark as declared
    concerts[concert_index]["guso_declared"] = True
    
    # Save
    await db.musicians.update_one(
        {"user_id": current_user["id"]},
        {"$set": {"concerts": concerts}}
    )
    
    return {"message": "Concert marked as declared", "concert": concerts[concert_index]}







@router.put("/musicians/me/concerts/{concert_id}/guso-declaration")
async def update_concert_guso_declaration(
    concert_id: str,
    data: dict,
    request: Request, current_user: dict = Depends(get_current_user)
):
    """
    Update GUSO declaration status for a concert
    Body: {"is_declared": true/false}
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can update concerts")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Get is_declared from body
    is_declared = data.get("is_declared")
    if is_declared is None:
        raise HTTPException(status_code=400, detail="is_declared field is required")
    
    concerts = musician.get("concerts", [])
    concert_index = next((i for i, c in enumerate(concerts) if c.get("id") == concert_id), None)
    
    if concert_index is None:
        raise HTTPException(status_code=404, detail="Concert not found")
    
    if not concerts[concert_index].get("is_guso"):
        raise HTTPException(status_code=400, detail="This concert is not marked as GUSO")
    
    # Update declaration status
    concerts[concert_index]["guso_declared"] = bool(is_declared)
    
    # Save
    await db.musicians.update_one(
        {"user_id": current_user["id"]},
        {"$set": {"concerts": concerts}}
    )
    
    return {
        "message": "Concert declaration status updated", 
        "concert_id": concert_id,
        "guso_declared": bool(is_declared)
    }


@router.get("/musicians/me/guso/export/csv")
async def export_guso_csv(
    request: Request,
    year: int = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Export GUSO data as CSV file (PRO feature)
    """
    from fastapi.responses import StreamingResponse
    import csv
    import io
    
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can export GUSO data")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Check PRO subscription
    if musician.get("subscription_tier") != "pro":
        raise HTTPException(status_code=403, detail="PRO subscription required")
    
    if not year:
        year = datetime.now(timezone.utc).year
    
    concerts = musician.get("concerts", [])
    guso_concerts = [
        c for c in concerts 
        if c.get("is_guso") and c.get("date", "").startswith(str(year))
    ]
    
    # Generate CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Date", "Établissement", "Ville", "Type Cachet", "Heures France Travail", "Cachet (€)", 
        "Type Contrat", "Statut Paiement", "Déclaré GUSO", "Notes"
    ])
    
    # Data
    for concert in guso_concerts:
        cachet_type = concert.get("cachet_type", "")
        hours = calculate_concert_hours_official(concert)
        
        writer.writerow([
            concert.get("date", ""),
            concert.get("venue_name", ""),
            concert.get("city", ""),
            cachet_type.capitalize() if cachet_type else "Non spécifié",
            hours,
            concert.get("cachet", ""),
            concert.get("guso_contract_type", ""),
            concert.get("payment_status", ""),
            "Oui" if concert.get("guso_declared") else "Non",
            concert.get("notes", "")
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=guso_{year}.csv"
        }
    )


# ============================================================================
# INVOICE/FILE UPLOADS
# ============================================================================

@router.post("/musicians/me/concerts/{concert_id}/upload-invoice")
async def upload_invoice(
    concert_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload invoice for a concert (PRO feature)
    Allowed formats: PDF, JPEG, PNG, WebP
    Max size: 5MB
    """
    from fastapi import UploadFile, File
    from utils.storage import put_object, validate_file, generate_storage_path
    
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can upload invoices")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Check PRO subscription
    if musician.get("subscription_tier") != "pro":
        raise HTTPException(status_code=403, detail="PRO subscription required")
    
    # Find concert
    concerts = musician.get("concerts", [])
    concert_index = next((i for i, c in enumerate(concerts) if c.get("id") == concert_id), None)
    
    if concert_index is None:
        raise HTTPException(status_code=404, detail="Concert not found")
    
    # Read file content
    content = await file.read()
    content_type = file.content_type or "application/octet-stream"
    
    # Validate file
    is_valid, error_msg = validate_file(content, content_type, file.filename)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Generate unique file ID and path
    file_id = str(uuid.uuid4())
    extension = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    storage_path = generate_storage_path(current_user["id"], file_id, extension)
    
    try:
        # Upload to storage
        result = put_object(storage_path, content, content_type)
        
        # Update concert with invoice info
        concerts[concert_index]["invoice_url"] = storage_path
        concerts[concert_index]["invoice_filename"] = file.filename
        concerts[concert_index]["invoice_uploaded_at"] = datetime.now(timezone.utc).isoformat()
        
        # Save to database
        await db.musicians.update_one(
            {"user_id": current_user["id"]},
            {"$set": {"concerts": concerts}}
        )
        
        return {
            "message": "Invoice uploaded successfully",
            "file_id": file_id,
            "storage_path": result["path"],
            "filename": file.filename,
            "size": result["size"]
        }
    
    except Exception as e:
        logger.error(f"Failed to upload invoice: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/musicians/me/concerts/{concert_id}/invoice")
async def get_invoice(
    concert_id: str,
    request: Request, current_user: dict = Depends(get_current_user)
):
    """
    Download/view invoice for a concert
    """
    from fastapi.responses import Response
    from utils.storage import get_object
    
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can view invoices")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Find concert
    concert = next((c for c in musician.get("concerts", []) if c.get("id") == concert_id), None)
    
    if not concert:
        raise HTTPException(status_code=404, detail="Concert not found")
    
    if not concert.get("invoice_url"):
        raise HTTPException(status_code=404, detail="No invoice uploaded for this concert")
    
    try:
        # Get file from storage
        content, content_type = get_object(concert["invoice_url"])
        
        # Return file
        return Response(
            content=content,
            media_type=content_type,
            headers={
                "Content-Disposition": f'inline; filename="{concert.get("invoice_filename", "invoice.pdf")}"'
            }
        )
    
    except Exception as e:
        logger.error(f"Failed to retrieve invoice: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve invoice")


@router.delete("/musicians/me/concerts/{concert_id}/invoice")
async def delete_invoice(
    concert_id: str,
    request: Request, current_user: dict = Depends(get_current_user)
):
    """
    Delete invoice for a concert (soft delete - removes reference from DB)
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can delete invoices")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Find concert
    concerts = musician.get("concerts", [])
    concert_index = next((i for i, c in enumerate(concerts) if c.get("id") == concert_id), None)
    
    if concert_index is None:
        raise HTTPException(status_code=404, detail="Concert not found")
    
    if not concerts[concert_index].get("invoice_url"):
        raise HTTPException(status_code=404, detail="No invoice to delete")
    
    # Remove invoice reference (soft delete)
    concerts[concert_index]["invoice_url"] = None
    concerts[concert_index]["invoice_filename"] = None
    concerts[concert_index]["invoice_uploaded_at"] = None
    
    # Save to database
    await db.musicians.update_one(
        {"user_id": current_user["id"]},
        {"$set": {"concerts": concerts}}
    )
    
    return {"message": "Invoice deleted successfully"}


# ============================================================================
# ANALYTICS PRO
# ============================================================================

@router.get("/musicians/me/analytics")
async def get_analytics(
    request: Request,
    year: int = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get advanced analytics for PRO musicians
    Returns: revenue trends, performance metrics, comparisons
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can access analytics")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Check PRO subscription
    if musician.get("subscription_tier") != "pro":
        raise HTTPException(status_code=403, detail="PRO subscription required for analytics")
    
    if not year:
        year = datetime.now(timezone.utc).year
    
    concerts = musician.get("concerts", [])
    
    # Filter concerts by year
    year_concerts = [c for c in concerts if c.get("date", "").startswith(str(year))]
    paid_concerts = [c for c in year_concerts if c.get("payment_status") == "paid"]
    
    # Calculate monthly revenue
    monthly_revenue = {}
    monthly_concerts = {}
    for month in range(1, 13):
        month_str = f"{year}-{month:02d}"
        month_concerts_list = [c for c in paid_concerts if c.get("date", "").startswith(month_str)]
        monthly_revenue[month] = sum(c.get("cachet", 0) for c in month_concerts_list if c.get("cachet"))
        monthly_concerts[month] = len(month_concerts_list)
    
    # Calculate total revenue
    total_revenue = sum(monthly_revenue.values())
    total_concerts = len(paid_concerts)
    
    # Calculate average, min, max cachet
    cachets = [c.get("cachet") for c in paid_concerts if c.get("cachet")]
    avg_cachet = sum(cachets) / len(cachets) if cachets else 0
    min_cachet = min(cachets) if cachets else 0
    max_cachet = max(cachets) if cachets else 0
    
    # Top cities
    city_stats = {}
    for concert in paid_concerts:
        city = concert.get("city")
        if city:
            if city not in city_stats:
                city_stats[city] = {"count": 0, "revenue": 0}
            city_stats[city]["count"] += 1
            city_stats[city]["revenue"] += concert.get("cachet", 0)
    
    top_cities = sorted(
        [{"city": k, "concerts": v["count"], "revenue": v["revenue"]} for k, v in city_stats.items()],
        key=lambda x: x["revenue"],
        reverse=True
    )[:5]
    
    # Top venues
    venue_stats = {}
    for concert in paid_concerts:
        venue = concert.get("venue_name")
        if venue:
            if venue not in venue_stats:
                venue_stats[venue] = {"count": 0, "revenue": 0}
            venue_stats[venue]["count"] += 1
            venue_stats[venue]["revenue"] += concert.get("cachet", 0)
    
    top_venues = sorted(
        [{"venue": k, "concerts": v["count"], "revenue": v["revenue"]} for k, v in venue_stats.items()],
        key=lambda x: x["revenue"],
        reverse=True
    )[:5]
    
    # Calculate growth rate (compare with previous year)
    previous_year = year - 1
    previous_year_concerts = [c for c in concerts if c.get("date", "").startswith(str(previous_year))]
    previous_paid = [c for c in previous_year_concerts if c.get("payment_status") == "paid"]
    previous_revenue = sum(c.get("cachet", 0) for c in previous_paid if c.get("cachet"))
    
    growth_rate = 0
    if previous_revenue > 0:
        growth_rate = ((total_revenue - previous_revenue) / previous_revenue) * 100
    
    # Get average stats from other PRO musicians for comparison
    all_pro_musicians = await db.musicians.find(
        {
            "subscription_tier": "pro",
            "user_id": {"$ne": current_user["id"]}  # Exclude current user
        },
        {"_id": 0, "concerts": 1}
    ).to_list(1000)
    
    # Calculate industry average
    all_year_concerts = []
    for m in all_pro_musicians:
        m_concerts = [c for c in m.get("concerts", []) if c.get("date", "").startswith(str(year)) and c.get("payment_status") == "paid"]
        all_year_concerts.extend(m_concerts)
    
    industry_avg_revenue = 0
    industry_avg_concerts = 0
    industry_avg_cachet = 0
    
    if all_year_concerts:
        industry_revenues = [c.get("cachet", 0) for c in all_year_concerts if c.get("cachet")]
        industry_avg_revenue = sum(industry_revenues) / len(all_pro_musicians) if all_pro_musicians else 0
        industry_avg_concerts = len(all_year_concerts) / len(all_pro_musicians) if all_pro_musicians else 0
        industry_avg_cachet = sum(industry_revenues) / len(industry_revenues) if industry_revenues else 0
    
    # Performance vs industry
    revenue_vs_industry = ((total_revenue - industry_avg_revenue) / industry_avg_revenue * 100) if industry_avg_revenue > 0 else 0
    concerts_vs_industry = ((total_concerts - industry_avg_concerts) / industry_avg_concerts * 100) if industry_avg_concerts > 0 else 0
    cachet_vs_industry = ((avg_cachet - industry_avg_cachet) / industry_avg_cachet * 100) if industry_avg_cachet > 0 else 0
    
    return {
        "year": year,
        "summary": {
            "total_revenue": round(total_revenue, 2),
            "total_concerts": total_concerts,
            "avg_cachet": round(avg_cachet, 2),
            "min_cachet": round(min_cachet, 2),
            "max_cachet": round(max_cachet, 2),
            "growth_rate": round(growth_rate, 2)
        },
        "monthly_data": [
            {
                "month": month,
                "month_name": datetime(year, month, 1).strftime("%b"),
                "revenue": round(monthly_revenue[month], 2),
                "concerts": monthly_concerts[month]
            }
            for month in range(1, 13)
        ],
        "top_cities": top_cities,
        "top_venues": top_venues,
        "industry_comparison": {
            "avg_revenue": round(industry_avg_revenue, 2),
            "avg_concerts": round(industry_avg_concerts, 2),
            "avg_cachet": round(industry_avg_cachet, 2),
            "revenue_vs_industry": round(revenue_vs_industry, 2),
            "concerts_vs_industry": round(concerts_vs_industry, 2),
            "cachet_vs_industry": round(cachet_vs_industry, 2)
        }
    }



@router.post("/musicians/contact-band")
async def contact_band(
    band_id: str,
    band_name: str,
    subject: str,
    content: str,
    request: Request, current_user: dict = Depends(get_current_user)
):
    """
    Permet à un musicien de contacter un groupe via email
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can contact bands")
    
    # Récupérer les informations du groupe
    band = await db.bands.find_one({"id": band_id}, {"_id": 0})
    if not band:
        raise HTTPException(status_code=404, detail="Band not found")
    
    # Récupérer le profil de l'expéditeur
    sender = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not sender:
        raise HTTPException(status_code=404, detail="Sender profile not found")
    
    # Récupérer l'admin du groupe
    admin_user = await db.users.find_one({"id": band.get("admin_id")}, {"_id": 0})
    if not admin_user:
        # Essayer avec le leader_id
        leader = await db.musicians.find_one({"id": band.get("leader_id")}, {"_id": 0})
        if leader:
            admin_user = await db.users.find_one({"id": leader.get("user_id")}, {"_id": 0})
    
    if not admin_user:
        raise HTTPException(status_code=404, detail="Band admin not found")
    
    # Envoyer l'email à l'admin du groupe
    try:
        from utils.email import send_email, SENDER_EMAIL
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f0f; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f0f;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(56, 189, 248, 0.2);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #38bdf8;">
                                💬 Nouveau message pour {band_name}
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <div style="background-color: rgba(56, 189, 248, 0.1); border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.2); padding: 20px; margin-bottom: 20px;">
                                <p style="margin: 0 0 10px; font-size: 14px; color: #94a3b8;">
                                    <strong>De :</strong> {sender.get('pseudo', 'Un musicien')}
                                </p>
                                <p style="margin: 0; font-size: 14px; color: #94a3b8;">
                                    <strong>Objet :</strong> {subject}
                                </p>
                            </div>
                            
                            <div style="background-color: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #cbd5e1; white-space: pre-wrap;">
{content}
                                </p>
                            </div>
                            
                            <p style="margin: 0; font-size: 14px; color: #94a3b8; text-align: center;">
                                Pour répondre, connectez-vous sur <a href="https://jamconnexion.com" style="color: #38bdf8; text-decoration: none;">Jam Connexion</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(56, 189, 248, 0.2);">
                            <p style="margin: 0; font-size: 12px; color: #64748b;">
                                © 2026 Jam Connexion. Tous droits réservés.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        """
        
        success = await send_email(
            to_email=admin_user["email"],
            subject=f"Message de {sender.get('pseudo', 'un musicien')} - {subject}",
            html_content=html_content,
            from_email=f"Jam Connexion <{SENDER_EMAIL}>"
        )
        
        if success:
            logger.info(f"Contact email sent to band {band_name} admin {admin_user['email']}")
            return {"success": True, "message": "Message envoyé avec succès"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
            
    except Exception as e:
        logger.error(f"Failed to send contact email: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send message")
