"""
Bands router - Handles bands directory and join requests
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from math import radians, sin, cos, sqrt, atan2
import jwt
import os
import logging
import random
import string
from models.band_invite import (
    BandInviteCodeResponse, 
    JoinBandRequest, 
    JoinBandResponse, 
    InviteCodeMember
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


# ============= BANDS DIRECTORY =============

@router.get("/bands")
async def get_bands_directory(
    department: Optional[str] = None, 
    city: Optional[str] = None,
    music_style: Optional[str] = None,
    band_type: Optional[str] = None,
    repertoire_type: Optional[str] = None,
    looking_for_members: Optional[bool] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius: Optional[float] = None
):
    """Get public bands directory with optional filters or geolocation"""
    # Get all musicians with bands
    musicians = await db.musicians.find({}, {"_id": 0}).to_list(2000)
    
    # Extract all bands from all musicians
    all_bands = []
    for musician in musicians:
        # Check new format (multiple bands)
        if musician.get("bands"):
            for band in musician["bands"]:
                if band.get("is_public", True):  # Only public bands
                    # Apply text filters (only if not using geolocation)
                    if not (latitude and longitude and radius):
                        if department and band.get("department") != department:
                            continue
                        if city and band.get("city", "").lower() != city.lower():
                            continue
                    
                    if music_style and music_style not in band.get("music_styles", []):
                        continue
                    if band_type and band.get("band_type") != band_type:
                        continue
                    if repertoire_type and band.get("repertoire_type") != repertoire_type:
                        continue
                    if looking_for_members is not None and band.get("looking_for_members", False) != looking_for_members:
                        continue
                    
                    band_data = {
                        "id": f"{musician['id']}-{band.get('name', '')}",
                        "musician_id": musician["id"],
                        "musician_user_id": musician["user_id"],
                        "musician_name": musician.get("pseudo", ""),
                        "name": band.get("name"),
                        "photo": band.get("photo"),
                        "description": band.get("description"),
                        "members_count": band.get("members_count"),
                        "music_styles": band.get("music_styles", []),
                        "band_type": band.get("band_type"),
                        "repertoire_type": band.get("repertoire_type"),
                        "show_duration": band.get("show_duration"),
                        "city": band.get("city"),
                        "department": band.get("department"),
                        "region": band.get("region"),
                        "facebook": band.get("facebook"),
                        "instagram": band.get("instagram"),
                        "youtube": band.get("youtube"),
                        "website": band.get("website"),
                        "bandcamp": band.get("bandcamp"),
                        "looking_for_concerts": band.get("looking_for_concerts", True),
                        "looking_for_members": band.get("looking_for_members", False),
                        "looking_for_profiles": band.get("looking_for_profiles", []),
                        "has_sound_engineer": band.get("has_sound_engineer", False),
                        "admin_id": band.get("admin_id"),
                        "is_association": band.get("is_association", False),
                        "association_name": band.get("association_name"),
                        "has_label": band.get("has_label", False),
                        "label_name": band.get("label_name"),
                        "label_city": band.get("label_city")
                    }
                    
                    # Calculate distance if geolocation mode
                    if latitude and longitude and radius:
                        # Try to get band location first, fallback to musician location
                        band_lat = band.get("latitude") or musician.get("latitude")
                        band_lon = band.get("longitude") or musician.get("longitude")
                        
                        if band_lat and band_lon:
                            lat1, lon1 = radians(latitude), radians(longitude)
                            lat2, lon2 = radians(band_lat), radians(band_lon)
                            
                            dlat = lat2 - lat1
                            dlon = lon2 - lon1
                            
                            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                            c = 2 * atan2(sqrt(a), sqrt(1-a))
                            distance_km = 6371 * c
                            
                            if distance_km <= radius:
                                band_data["distance_km"] = round(distance_km, 1)
                                all_bands.append(band_data)
                        else:
                            # Skip bands without any location in geolocation mode
                            continue
                    else:
                        all_bands.append(band_data)
    
    # Sort by distance if in geolocation mode
    if latitude and longitude and radius:
        all_bands.sort(key=lambda x: x.get("distance_km", 999))
    
    return all_bands


@router.get("/bands/departments")
async def get_available_departments():
    """Get list of departments where bands are available"""
    musicians = await db.musicians.find({}, {"_id": 0, "bands": 1, "department": 1}).to_list(2000)
    
    departments = set()
    for musician in musicians:
        if musician.get("bands"):
            for band in musician["bands"]:
                dept = band.get("department")
                if dept:
                    departments.add(dept)
        # Fallback to musician's department
        elif musician.get("department"):
            departments.add(musician["department"])
    
    return {"departments": sorted(list(departments))}


# ============= BAND INVITE CODES =============

def generate_invite_code() -> str:
    """Génère un code d'invitation unique de 6 caractères"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choices(characters, k=6))


@router.post("/bands/{band_id}/invite-code", response_model=BandInviteCodeResponse)
async def create_band_invite_code(
    band_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Génère un code d'invitation pour rejoindre un groupe.
    Seul l'admin du groupe peut générer un code.
    Le code est valable 7 jours.
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can create band invite codes")
    
    # Vérifier que le groupe existe
    band = await db.bands.find_one({"id": band_id}, {"_id": 0})
    if not band:
        raise HTTPException(status_code=404, detail="Band not found")
    
    # Vérifier que l'utilisateur est l'admin du groupe
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Vérifier si le musicien est le leader ou admin du groupe
    is_admin = False
    for musician_band in musician.get("bands", []):
        if musician_band.get("band_id") == band_id or musician_band.get("id") == band_id:
            if musician_band.get("admin_id") == current_user["id"]:
                is_admin = True
                break
    
    # Vérifier aussi dans la collection bands
    if not is_admin and band.get("leader_id") == musician.get("id"):
        is_admin = True
    
    if not is_admin:
        raise HTTPException(status_code=403, detail="Only band admin can create invite codes")
    
    # Désactiver les anciens codes actifs
    await db.band_invite_codes.update_many(
        {"band_id": band_id, "is_active": True},
        {"$set": {"is_active": False}}
    )
    
    # Générer un nouveau code unique
    code = generate_invite_code()
    while await db.band_invite_codes.find_one({"code": code, "is_active": True}):
        code = generate_invite_code()
    
    # Créer le code d'invitation
    invite_code = {
        "id": str(uuid.uuid4()),
        "band_id": band_id,
        "code": code,
        "created_by": current_user["id"],
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "is_active": True,
        "used_by": []
    }
    
    await db.band_invite_codes.insert_one(invite_code)
    
    return BandInviteCodeResponse(
        code=code,
        band_id=band_id,
        band_name=band.get("name", ""),
        expires_at=invite_code["expires_at"],
        members_joined=0
    )


@router.get("/bands/{band_id}/invite-code", response_model=BandInviteCodeResponse)
async def get_band_invite_code(
    band_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Récupère le code d'invitation actif pour un groupe.
    Seul l'admin du groupe peut voir le code.
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can access band invite codes")
    
    # Vérifier que le groupe existe
    band = await db.bands.find_one({"id": band_id}, {"_id": 0})
    if not band:
        raise HTTPException(status_code=404, detail="Band not found")
    
    # Vérifier que l'utilisateur est l'admin du groupe
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Vérifier les permissions
    is_admin = False
    for musician_band in musician.get("bands", []):
        if musician_band.get("band_id") == band_id or musician_band.get("id") == band_id:
            if musician_band.get("admin_id") == current_user["id"]:
                is_admin = True
                break
    
    if not is_admin and band.get("leader_id") == musician.get("id"):
        is_admin = True
    
    if not is_admin:
        raise HTTPException(status_code=403, detail="Only band admin can view invite codes")
    
    # Chercher le code actif
    invite_code = await db.band_invite_codes.find_one(
        {"band_id": band_id, "is_active": True},
        {"_id": 0}
    )
    
    if not invite_code:
        raise HTTPException(status_code=404, detail="No active invite code found")
    
    # Vérifier si le code est expiré
    expires_at = invite_code["expires_at"]
    if not expires_at.tzinfo:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        await db.band_invite_codes.update_one(
            {"id": invite_code["id"]},
            {"$set": {"is_active": False}}
        )
        raise HTTPException(status_code=404, detail="Invite code has expired")
    
    return BandInviteCodeResponse(
        code=invite_code["code"],
        band_id=band_id,
        band_name=band.get("name", ""),
        expires_at=invite_code["expires_at"],
        members_joined=len(invite_code.get("used_by", []))
    )


@router.post("/bands/join", response_model=JoinBandResponse)
async def join_band_with_code(
    request: JoinBandRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Permet à un musicien de rejoindre un groupe via un code d'invitation.
    Le musicien est automatiquement ajouté au groupe.
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can join bands")
    
    # Chercher le code d'invitation
    invite_code = await db.band_invite_codes.find_one(
        {"code": request.code.upper(), "is_active": True},
        {"_id": 0}
    )
    
    if not invite_code:
        raise HTTPException(status_code=404, detail="Invalid or expired invite code")
    
    # Vérifier si le code est expiré
    expires_at = invite_code["expires_at"]
    if not expires_at.tzinfo:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        await db.band_invite_codes.update_one(
            {"id": invite_code["id"]},
            {"$set": {"is_active": False}}
        )
        raise HTTPException(status_code=400, detail="This invite code has expired")
    
    # Récupérer le groupe
    band = await db.bands.find_one({"id": invite_code["band_id"]}, {"_id": 0})
    if not band:
        raise HTTPException(status_code=404, detail="Band not found")
    
    # Récupérer le profil du musicien
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Vérifier si le musicien est déjà dans le groupe
    is_already_member = False
    for musician_band in musician.get("bands", []):
        if musician_band.get("band_id") == invite_code["band_id"] or musician_band.get("id") == invite_code["band_id"]:
            is_already_member = True
            break
    
    if is_already_member:
        raise HTTPException(status_code=400, detail="You are already a member of this band")
    
    # Ajouter le musicien au groupe dans la collection musicians
    band_data = {
        "id": invite_code["band_id"],
        "band_id": invite_code["band_id"],
        "name": band.get("name", ""),
        "photo": band.get("photo"),
        "description": band.get("description"),
        "members_count": band.get("members_count"),
        "music_styles": band.get("music_styles", []),
        "facebook": band.get("facebook"),
        "instagram": band.get("instagram"),
        "youtube": band.get("youtube"),
        "website": band.get("website"),
        "bandcamp": band.get("bandcamp"),
        "looking_for_concerts": band.get("looking_for_concerts", True),
        "looking_for_members": band.get("looking_for_members", False),
        "looking_for_profiles": band.get("looking_for_profiles", []),
        "is_public": band.get("is_public", True),
        "band_type": band.get("band_type"),
        "repertoire_type": band.get("repertoire_type"),
        "show_duration": band.get("show_duration"),
        "admin_id": band.get("admin_id"),
        "has_sound_engineer": band.get("has_sound_engineer", False),
        "is_association": band.get("is_association", False),
        "association_name": band.get("association_name"),
        "has_label": band.get("has_label", False),
        "label_name": band.get("label_name"),
        "label_city": band.get("label_city"),
        "city": band.get("city"),
        "postal_code": band.get("postal_code"),
        "department": band.get("department"),
        "department_name": band.get("department_name"),
        "region": band.get("region"),
        "payment_methods": band.get("payment_methods", [])
    }
    
    await db.musicians.update_one(
        {"user_id": current_user["id"]},
        {"$push": {"bands": band_data}}
    )
    
    # Ajouter le musicien dans la liste des utilisateurs du code
    await db.band_invite_codes.update_one(
        {"id": invite_code["id"]},
        {"$addToSet": {"used_by": current_user["id"]}}
    )
    
    return JoinBandResponse(
        success=True,
        message=f"You have successfully joined {band.get('name', 'the band')}!",
        band_id=invite_code["band_id"],
        band_name=band.get("name", "")
    )


@router.get("/bands/{band_id}/invite-code/members", response_model=List[InviteCodeMember])
async def get_invite_code_members(
    band_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Récupère la liste des membres ayant rejoint le groupe via code d'invitation.
    Seul l'admin du groupe peut voir cette liste.
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can access this")
    
    # Vérifier que le groupe existe
    band = await db.bands.find_one({"id": band_id}, {"_id": 0})
    if not band:
        raise HTTPException(status_code=404, detail="Band not found")
    
    # Vérifier que l'utilisateur est l'admin du groupe
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Vérifier les permissions
    is_admin = False
    for musician_band in musician.get("bands", []):
        if musician_band.get("band_id") == band_id or musician_band.get("id") == band_id:
            if musician_band.get("admin_id") == current_user["id"]:
                is_admin = True
                break
    
    if not is_admin and band.get("leader_id") == musician.get("id"):
        is_admin = True
    
    if not is_admin:
        raise HTTPException(status_code=403, detail="Only band admin can view this information")
    
    # Récupérer tous les codes du groupe
    invite_codes = await db.band_invite_codes.find(
        {"band_id": band_id},
        {"_id": 0}
    ).to_list(100)
    
    # Collecter tous les user_id qui ont utilisé un code
    all_user_ids = set()
    for code in invite_codes:
        all_user_ids.update(code.get("used_by", []))
    
    if not all_user_ids:
        return []
    
    # Récupérer les profils des musiciens
    members = []
    for user_id in all_user_ids:
        member_musician = await db.musicians.find_one({"user_id": user_id}, {"_id": 0})
        if member_musician:
            # Trouver quand le membre a rejoint
            joined_at = None
            for code in invite_codes:
                if user_id in code.get("used_by", []):
                    joined_at = code.get("created_at")
                    break
            
            members.append(InviteCodeMember(
                user_id=user_id,
                pseudo=member_musician.get("pseudo", "Unknown"),
                profile_image=member_musician.get("profile_image"),
                joined_at=joined_at or datetime.now(timezone.utc)
            ))
    
    return members
