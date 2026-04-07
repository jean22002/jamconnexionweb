import httpx
from math import radians, sin, cos, sqrt, atan2
from typing import Optional, Tuple
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

async def geocode_city(city_name: str) -> Tuple[Optional[float], Optional[float]]:
    """Get GPS coordinates from city name using French government API"""
    if not city_name:
        return None, None
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://geo.api.gouv.fr/communes?nom={city_name}&fields=centre&limit=1",
                timeout=5.0
            )
            data = response.json()
            if data and len(data) > 0:
                coords = data[0].get("centre", {}).get("coordinates")
                if coords and len(coords) == 2:
                    return coords[1], coords[0]  # lat, lon
    except Exception:
        pass
    return None, None

async def geocode_address(data: dict):
    """Geocode a city and postal code to get coordinates"""
    city = data.get("city")
    postal_code = data.get("postal_code")
    
    if not city:
        raise HTTPException(status_code=400, detail="City is required")
    
    try:
        latitude, longitude = await geocode_city(city)
        
        if not latitude or not longitude:
            raise HTTPException(status_code=404, detail="Unable to geocode the provided address")
        
        return {
            "latitude": latitude,
            "longitude": longitude,
            "city": city,
            "postal_code": postal_code
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Geocoding error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error during geocoding")


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS coordinates in kilometers"""
    R = 6371  # Earth radius in km
    
    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)
    
    a = sin(delta_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    return R * c
