import httpx
from math import radians, sin, cos, sqrt, atan2
from typing import Optional, Tuple

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
