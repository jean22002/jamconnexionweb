from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class JamEvent(BaseModel):
    date: str
    start_time: str
    end_time: str
    music_styles: List[str] = []
    rules: Optional[str] = None
    has_instruments: bool = False
    has_pa_system: bool = False
    instruments_available: List[str] = []
    additional_info: Optional[str] = None

class JamEventResponse(BaseModel):
    id: str
    venue_id: str
    venue_name: str
    date: str
    start_time: str
    end_time: str
    music_styles: List[str] = []
    rules: Optional[str] = None
    has_instruments: bool = False
    has_pa_system: bool = False
    instruments_available: List[str] = []
    additional_info: Optional[str] = None
    created_at: str
    participants_count: int = 0

class ConcertBand(BaseModel):
    name: str
    musician_id: Optional[str] = None
    members_count: Optional[int] = None
    photo: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None

class ConcertEvent(BaseModel):
    date: str
    start_time: str
    end_time: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    bands: List[ConcertBand] = []
    price: Optional[str] = None
    music_styles: List[str] = []
    # Catering
    has_catering: bool = False
    catering_drinks: int = 0
    catering_respect: bool = False
    catering_tbd: bool = False
    # Accommodation
    has_accommodation: bool = False
    accommodation_capacity: int = 0
    accommodation_tbd: bool = False

class ConcertEventResponse(BaseModel):
    id: str
    venue_id: str
    venue_name: str
    date: str
    start_time: str
    end_time: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    bands: List[Dict[str, Any]] = []
    price: Optional[str] = None
    music_styles: List[str] = []
    participants_count: int = 0
    created_at: str
    # Catering
    has_catering: bool = False
    catering_drinks: int = 0
    catering_respect: bool = False
    catering_tbd: bool = False
    # Accommodation
    has_accommodation: bool = False
    accommodation_capacity: int = 0
    accommodation_tbd: bool = False

class KaraokeEvent(BaseModel):
    date: str
    start_time: str
    end_time: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    music_styles: List[str] = []

class KaraokeEventResponse(BaseModel):
    id: str
    venue_id: str
    venue_name: str
    date: str
    start_time: str
    end_time: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    music_styles: List[str] = []
    participants_count: int = 0
    created_at: str

class SpectacleEvent(BaseModel):
    date: str
    start_time: str
    end_time: Optional[str] = None
    type: str  # humour, theatre, magie, danse, cirque, conte, autre
    artist_name: str
    description: Optional[str] = None
    price: Optional[str] = None

class SpectacleEventResponse(BaseModel):
    id: str
    venue_id: str
    venue_name: str
    date: str
    start_time: str
    end_time: Optional[str] = None
    type: str
    artist_name: str
    description: Optional[str] = None
    price: Optional[str] = None
    participants_count: int = 0
    created_at: str

class PlanningSlot(BaseModel):
    date: str
    time: Optional[str] = None
    title: Optional[str] = None
    music_styles: List[str] = []
    description: Optional[str] = None
    expected_band_style: Optional[str] = None
    expected_attendance: Optional[int] = None
    payment: Optional[str] = None
    is_open: bool = True
    artist_categories: List[str] = []
    num_bands_needed: int = 1
    application_type: str = "bands"
    has_catering: bool = False
    catering_drinks: Optional[int] = 0
    catering_respect: bool = False
    catering_tbd: bool = False
    has_accommodation: bool = False
    accommodation_capacity: Optional[int] = 0
    accommodation_tbd: bool = False

class PlanningSlotResponse(BaseModel):
    id: str
    venue_id: str
    venue_name: str
    date: str
    time: Optional[str] = None
    title: Optional[str] = None
    music_styles: List[str] = []
    description: Optional[str] = None
    expected_band_style: Optional[str] = None
    expected_attendance: Optional[int] = None
    payment: Optional[str] = None
    is_open: bool = True
    applications_count: int = 0
    accepted_bands_count: int = 0
    num_bands_needed: int = 1
    application_type: str = "bands"
    created_at: str
    artist_categories: List[str] = []
    has_catering: bool = False
    catering_drinks: Optional[int] = 0
    catering_respect: bool = False
    catering_tbd: bool = False
    has_accommodation: bool = False
    accommodation_capacity: Optional[int] = 0
    accommodation_tbd: bool = False

class ConcertApplication(BaseModel):
    planning_slot_id: str
    band_name: str
    band_photo: Optional[str] = None
    description: Optional[str] = None
    music_style: str
    links: Optional[Dict[str, str]] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

class ConcertApplicationResponse(BaseModel):
    id: str
    planning_slot_id: str
    musician_id: str
    musician_name: str
    band_name: str
    band_photo: Optional[str] = None
    description: Optional[str] = None
    music_style: str
    links: Optional[Dict[str, str]] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    status: str  # pending, accepted, rejected
    created_at: str
