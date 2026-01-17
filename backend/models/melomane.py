from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MelomaneBase(BaseModel):
    user_id: str
    pseudo: str
    bio: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = "France"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    # Préférences musicales
    favorite_styles: List[str] = []
    favorite_venues: List[str] = []
    
    # Profil
    profile_picture: Optional[str] = None
    cover_photo: Optional[str] = None
    
    # Social
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    
    # Notifications
    notifications_enabled: bool = True
    notification_radius_km: float = 50.0
    
    # Statistiques
    events_attended: int = 0
    favorite_count: int = 0
    
    created_at: str

class MelomaneCreate(BaseModel):
    pseudo: str
    bio: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = "France"
    favorite_styles: List[str] = []
    profile_picture: Optional[str] = None
    notifications_enabled: bool = True
    notification_radius_km: float = 50.0

class MelomaneUpdate(BaseModel):
    pseudo: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    favorite_styles: Optional[List[str]] = None
    profile_picture: Optional[str] = None
    cover_photo: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    notification_radius_km: Optional[float] = None

class MelomaneResponse(BaseModel):
    id: str
    user_id: str
    pseudo: str
    bio: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    postal_code: Optional[str] = None
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    favorite_styles: List[str]
    favorite_venues: List[str]
    profile_picture: Optional[str] = None
    cover_photo: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    notifications_enabled: bool
    notification_radius_km: float
    events_attended: int
    favorite_count: int
    created_at: str
