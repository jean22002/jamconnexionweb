from pydantic import BaseModel
from typing import List, Optional

class VenueProfile(BaseModel):
    name: str
    description: Optional[str] = None
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    address: str
    city: str
    department: Optional[str] = None
    region: Optional[str] = None
    postal_code: str
    latitude: float
    longitude: float
    phone: Optional[str] = None
    website: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    has_stage: bool = False
    has_sound_engineer: bool = False
    has_pa_system: bool = False
    has_lights: bool = False
    stage_size: Optional[str] = None
    pa_mixer_name: Optional[str] = None
    pa_speakers_name: Optional[str] = None
    pa_power: Optional[str] = None
    has_auto_light: bool = False
    has_light_table: bool = False
    equipment: List[str] = []
    music_styles: List[str] = []
    opening_hours: Optional[str] = None
    show_reviews: bool = True
    allow_messages_from: str = "everyone"
    gallery: List[str] = []
    subscription_status: Optional[str] = "trial"
    trial_end: Optional[str] = None

class VenueProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    address: str
    city: str
    department: Optional[str] = None
    region: Optional[str] = None
    postal_code: str
    latitude: float
    longitude: float
    phone: Optional[str] = None
    website: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    has_stage: bool = False
    has_sound_engineer: bool = False
    has_pa_system: bool = False
    has_lights: bool = False
    stage_size: Optional[str] = None
    pa_mixer_name: Optional[str] = None
    pa_speakers_name: Optional[str] = None
    pa_power: Optional[str] = None
    has_auto_light: bool = False
    has_light_table: bool = False
    equipment: List[str] = []
    music_styles: List[str] = []
    opening_hours: Optional[str] = None
    created_at: str
    subscription_status: Optional[str] = None
    trial_end: Optional[str] = None
    trial_days_left: Optional[int] = None
    subscribers_count: int = 0
    show_reviews: bool = True
    allow_messages_from: str = "everyone"
    gallery: List[str] = []

class VenueSubscription(BaseModel):
    venue_id: str

class NearbySearchRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 100.0
