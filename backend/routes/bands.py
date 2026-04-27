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
import secrets  # Use secrets instead of random for secure tokens
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


# ============= HELPER FUNCTIONS =============

async def is_band_member(band_id: str, user_id: str) -> bool:
    """Vérifie si un utilisateur est membre d'un groupe"""
    # Chercher le musicien qui possède ce groupe
    musician = await db.musicians.find_one(
        {"bands.band_id": band_id},
        {"_id": 0, "user_id": 1, "bands": 1}
    )
    
    if not musician:
        return False
    
    # Trouver le groupe spécifique
    band = next((b for b in musician.get("bands", []) if b.get("band_id") == band_id), None)
    if not band:
        return False
    
    # Vérifier si l'utilisateur est admin ou membre
    if musician["user_id"] == user_id:
        return True
    
    members = band.get("members", [])
    return any(m.get("user_id") == user_id for m in members)


# ============= BANDS DIRECTORY =============

@router.get("/bands/{band_id}/events")
async def get_band_events(
    band_id: str,
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Récupère les événements (concerts) d'un groupe pour ses membres"""
    
    # Vérifier que l'utilisateur est membre du groupe
    if not await is_band_member(band_id, current_user["id"]):
        raise HTTPException(
            status_code=403, 
            detail="Vous n'êtes pas membre de ce groupe"
        )
    
    # Construire le filtre de date si spécifié
    date_filter = {}
    if month and year:
        # Format: "2026-04-15"
        start_date = f"{year:04d}-{month:02d}-01"
        # Dernier jour du mois
        if month == 12:
            end_date = f"{year+1:04d}-01-01"
        else:
            end_date = f"{year:04d}-{month+1:02d}-01"
        
        date_filter = {
            "date": {
                "$gte": start_date,
                "$lt": end_date
            }
        }
    
    # Récupérer les concerts du groupe
    concerts = await db.concerts.find(
        {
            "band_id": band_id,
            **date_filter
        },
        {"_id": 0}
    ).to_list(1000)
    
    # Enrichir avec les infos de l'établissement
    for concert in concerts:
        venue = await db.venues.find_one(
            {"id": concert.get("venue_id")},
            {"_id": 0, "name": 1, "city": 1}
        )
        if venue:
            concert["venue_name"] = venue.get("name", "Établissement")
            concert["venue_city"] = venue.get("city", "")
    
    return concerts


@router.get("/bands/{band_id}/calendar.ics")
async def get_band_calendar(
    band_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Export du calendrier du groupe au format iCalendar (.ics)"""
    from fastapi.responses import Response
    
    # Vérifier que l'utilisateur est membre du groupe
    if not await is_band_member(band_id, current_user["id"]):
        raise HTTPException(
            status_code=403, 
            detail="Vous n'êtes pas membre de ce groupe"
        )
    
    # Récupérer le nom du groupe
    musician = await db.musicians.find_one(
        {"bands.band_id": band_id},
        {"_id": 0, "bands": 1}
    )
    band = next((b for b in musician.get("bands", []) if b.get("band_id") == band_id), None)
    band_name = band.get("name", "Groupe") if band else "Groupe"
    
    # Récupérer tous les concerts futurs
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    concerts = await db.concerts.find(
        {
            "band_id": band_id,
            "date": {"$gte": today}
        },
        {"_id": 0}
    ).sort("date", 1).to_list(1000)
    
    # Construire le fichier .ics
    ics_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Jam Connexion//Band Calendar//FR",
        f"X-WR-CALNAME:{band_name} - Planning",
        "X-WR-TIMEZONE:Europe/Paris",
        "CALSCALE:GREGORIAN"
    ]
    
    for concert in concerts:
        # Récupérer les infos de l'établissement
        venue = await db.venues.find_one(
            {"id": concert.get("venue_id")},
            {"_id": 0, "name": 1, "city": 1, "address": 1}
        )
        venue_name = venue.get("name", "Établissement") if venue else "Établissement"
        venue_city = venue.get("city", "") if venue else ""
        venue_address = venue.get("address", "") if venue else ""
        
        # Format date pour iCal (YYYYMMDD)
        event_date = concert["date"].replace("-", "")
        event_uid = f"{concert.get('id', uuid.uuid4())}@jamconnexion.com"
        
        ics_lines.extend([
            "BEGIN:VEVENT",
            f"UID:{event_uid}",
            f"DTSTAMP:{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}",
            f"DTSTART;VALUE=DATE:{event_date}",
            f"SUMMARY:Concert {band_name} @ {venue_name}",
            f"LOCATION:{venue_address}, {venue_city}",
            f"DESCRIPTION:Concert de {band_name} à {venue_name}",
            "STATUS:CONFIRMED",
            "END:VEVENT"
        ])
    
    ics_lines.append("END:VCALENDAR")
    
    ics_content = "\r\n".join(ics_lines)
    
    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f'attachment; filename="{band_name.replace(" ", "_")}_planning.ics"'
        }
    )


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
    """Génère un code d'invitation unique de 6 caractères (cryptographiquement sécurisé)"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(6))


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



# ============= BAND CRUD ENDPOINTS (mobile + web) =============

def _parse_band_id(band_id: str):
    """
    Parse a composite band_id of the form '{musician_uuid}-{band_name}'.
    UUID is 36 chars (8-4-4-4-12), followed by '-' then the band name (which may contain dashes).
    Returns (musician_id, band_name).
    """
    if not band_id or len(band_id) < 38 or band_id[36] != "-":
        return None, None
    return band_id[:36], band_id[37:]


def _build_band_payload(data: dict) -> dict:
    """Whitelist of fields a user can set on a band, with defaults."""
    return {
        "name": data.get("name", "").strip(),
        "photo": data.get("photo", ""),
        "description": data.get("description", ""),
        "members_count": data.get("members_count", 1),
        "music_styles": data.get("music_styles", []),
        "band_type": data.get("band_type", ""),
        "repertoire_type": data.get("repertoire_type", ""),
        "show_duration": data.get("show_duration", ""),
        "city": data.get("city", ""),
        "postal_code": data.get("postal_code", ""),
        "department": data.get("department", ""),
        "department_name": data.get("department_name", ""),
        "region": data.get("region", ""),
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "facebook": data.get("facebook", ""),
        "instagram": data.get("instagram", ""),
        "youtube": data.get("youtube", ""),
        "website": data.get("website", ""),
        "bandcamp": data.get("bandcamp", ""),
        "looking_for_concerts": data.get("looking_for_concerts", True),
        "looking_for_members": data.get("looking_for_members", False),
        "looking_for_profiles": data.get("looking_for_profiles", []),
        "has_sound_engineer": data.get("has_sound_engineer", False),
        "is_association": data.get("is_association", False),
        "association_name": data.get("association_name"),
        "has_label": data.get("has_label", False),
        "label_name": data.get("label_name"),
        "label_city": data.get("label_city"),
        "payment_methods": data.get("payment_methods", []),
        "equipment": data.get("equipment", []),
        "is_public": data.get("is_public", True),
    }


def _serialize_band(musician: dict, band: dict) -> dict:
    """Build the public band representation expected by the clients."""
    band_id = f"{musician['id']}-{band.get('name', '')}"
    return {
        "id": band_id,
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
        "postal_code": band.get("postal_code"),
        "department": band.get("department"),
        "department_name": band.get("department_name"),
        "region": band.get("region"),
        "latitude": band.get("latitude"),
        "longitude": band.get("longitude"),
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
        "invite_code": band.get("invite_code"),
        "is_association": band.get("is_association", False),
        "association_name": band.get("association_name"),
        "has_label": band.get("has_label", False),
        "label_name": band.get("label_name"),
        "label_city": band.get("label_city"),
        "payment_methods": band.get("payment_methods", []),
        "equipment": band.get("equipment", []),
        "is_public": band.get("is_public", True),
    }


@router.post("/bands", status_code=201)
async def create_band(payload: dict, current_user: dict = Depends(get_current_user)):
    """Create a new band for the currently logged-in musician."""
    if current_user.get("role") != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can create bands")

    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")

    band_payload = _build_band_payload(payload)
    if not band_payload["name"]:
        raise HTTPException(status_code=400, detail="Band name is required")

    # Prevent duplicate band name for the same musician
    for existing in musician.get("bands", []):
        if existing.get("name", "").strip().lower() == band_payload["name"].lower():
            raise HTTPException(status_code=400, detail="You already have a band with this name")

    band_payload["admin_id"] = current_user["id"]
    band_payload["invite_code"] = musician["id"][:8].upper()
    band_payload["created_at"] = datetime.now(timezone.utc).isoformat()

    await db.musicians.update_one(
        {"user_id": current_user["id"]},
        {"$push": {"bands": band_payload}}
    )

    return _serialize_band(musician, band_payload)


@router.get("/musicians/bands/{band_id}")
async def get_band_by_id(band_id: str):
    """Retrieve a single band by its composite id '{musician_id}-{band_name}'."""
    musician_id, band_name = _parse_band_id(band_id)
    if not musician_id:
        raise HTTPException(status_code=404, detail="Groupe non trouvé")

    musician = await db.musicians.find_one({"id": musician_id}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Groupe non trouvé")

    band = next((b for b in musician.get("bands", []) if b.get("name") == band_name), None)
    if not band:
        raise HTTPException(status_code=404, detail="Groupe non trouvé")

    return _serialize_band(musician, band)


@router.put("/musicians/bands/{band_id}")
async def update_band(band_id: str, payload: dict, current_user: dict = Depends(get_current_user)):
    """Update a band. Only the band admin can update."""
    musician_id, band_name = _parse_band_id(band_id)
    if not musician_id:
        raise HTTPException(status_code=404, detail="Groupe non trouvé")

    musician = await db.musicians.find_one({"id": musician_id}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Groupe non trouvé")

    band = next((b for b in musician.get("bands", []) if b.get("name") == band_name), None)
    if not band:
        raise HTTPException(status_code=404, detail="Groupe non trouvé")

    if band.get("admin_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Seul l'administrateur du groupe peut le modifier")

    # Partial merge: only update fields present in payload, keep the rest.
    allowed = _build_band_payload(payload)
    update_fields = {k: v for k, v in allowed.items() if k in payload}

    # Handle band rename: name change requires new array entry placement
    new_name = update_fields.get("name", band.get("name"))

    set_ops = {f"bands.$.{k}": v for k, v in update_fields.items()}
    if set_ops:
        await db.musicians.update_one(
            {"id": musician_id, "bands.name": band_name},
            {"$set": set_ops}
        )

    # Re-fetch the updated musician/band
    musician = await db.musicians.find_one({"id": musician_id}, {"_id": 0})
    band = next((b for b in musician.get("bands", []) if b.get("name") == new_name), None)
    if not band:
        raise HTTPException(status_code=500, detail="Update failed")

    return _serialize_band(musician, band)


@router.delete("/musicians/bands/{band_id}")
async def delete_band(band_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a band. Only the band admin can delete."""
    musician_id, band_name = _parse_band_id(band_id)
    if not musician_id:
        raise HTTPException(status_code=404, detail="Groupe non trouvé")

    musician = await db.musicians.find_one({"id": musician_id}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Groupe non trouvé")

    band = next((b for b in musician.get("bands", []) if b.get("name") == band_name), None)
    if not band:
        raise HTTPException(status_code=404, detail="Groupe non trouvé")

    if band.get("admin_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Seul l'administrateur du groupe peut le supprimer")

    await db.musicians.update_one(
        {"id": musician_id},
        {"$pull": {"bands": {"name": band_name}}}
    )

    return {"message": "Groupe supprimé", "id": band_id}
