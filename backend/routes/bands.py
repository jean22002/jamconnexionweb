"""
Bands router - Handles bands directory and join requests
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from math import radians, sin, cos, sqrt, atan2
import jwt
import os
import logging

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
