from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class JamEvent(BaseModel):
    date: str
    start_time: str
    end_time: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    music_styles: List[str] = []
    expected_musicians: int = 5
    has_pa_system: bool = False
    instruments_available: List[str] = []
    additional_info: Optional[str] = None
    # Comptabilité
    payment_method: Optional[str] = None
    amount: Optional[float] = None
    payment_status: Optional[str] = "pending"
    invoice_file: Optional[str] = None

class JamEventResponse(BaseModel):
    id: str
    venue_id: str
    venue_name: str = ""  # Default for older records
    date: str
    start_time: str = ""  # Default for older records
    end_time: str = ""  # Default for older records
    title: Optional[str] = None
    description: Optional[str] = None
    music_styles: List[str] = []
    expected_musicians: int = 5
    has_pa_system: bool = False
    instruments_available: List[str] = []
    additional_info: Optional[str] = None
    created_at: str
    participants_count: int = 0
    # Comptabilité historique
    bar_revenue: Optional[float] = None
    expenses: Optional[float] = None
    net_profit: Optional[float] = None
    payment_method: Optional[str] = None
    amount: Optional[float] = None
    payment_status: Optional[str] = "pending"
    invoice_file: Optional[str] = None

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
    # Comptabilité
    payment_method: Optional[str] = None
    amount: Optional[float] = None
    payment_status: Optional[str] = "pending"
    invoice_file: Optional[str] = None

class ConcertEventResponse(BaseModel):
    id: str
    venue_id: str
    venue_name: str = ""  # Default for older records
    date: str
    start_time: str = ""  # Default for older records
    end_time: Optional[str] = None
    title: Optional[str] = None
    artist_name: Optional[str] = None
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
    # Comptabilité historique détaillée
    ticket_price: Optional[float] = None
    tickets_sold: Optional[int] = None
    total_revenue: Optional[float] = None
    artist_payment: Optional[float] = None
    expenses: Optional[float] = None
    net_profit: Optional[float] = None
    payment_method: Optional[str] = None
    amount: Optional[float] = None
    payment_status: Optional[str] = "pending"
    invoice_file: Optional[str] = None

class KaraokeEvent(BaseModel):
    date: str
    start_time: str
    end_time: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    music_styles: List[str] = []
    host_name: Optional[str] = None
    # Comptabilité
    payment_method: Optional[str] = None
    amount: Optional[float] = None
    payment_status: Optional[str] = "pending"
    invoice_file: Optional[str] = None

class KaraokeEventResponse(BaseModel):
    id: str
    venue_id: str
    venue_name: str = ""  # Default for older records
    date: str
    start_time: str = ""  # Default for older records
    end_time: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    music_styles: List[str] = []
    host_name: Optional[str] = None
    participants_count: int = 0
    created_at: str
    # Comptabilité historique
    bar_revenue: Optional[float] = None
    host_payment: Optional[float] = None
    expenses: Optional[float] = None
    net_profit: Optional[float] = None
    payment_method: Optional[str] = None
    amount: Optional[float] = None
    payment_status: Optional[str] = "pending"
    invoice_file: Optional[str] = None

class SpectacleEvent(BaseModel):
    date: str
    start_time: str
    end_time: Optional[str] = None
    type: str  # Concert, Théâtre, Stand-up, etc.
    artist_name: str
    description: Optional[str] = None
    price: Optional[str] = None
    # Comptabilité
    payment_method: Optional[str] = None
    amount: Optional[float] = None
    payment_status: Optional[str] = "pending"
    invoice_file: Optional[str] = None

class SpectacleEventResponse(BaseModel):
    id: str
    venue_id: str
    venue_name: str = ""  # Default for older records
    date: str
    start_time: str = ""  # Default for older records
    end_time: Optional[str] = None
    type: str
    artist_name: str
    description: Optional[str] = None
    price: Optional[str] = None
    participants_count: int = 0
    created_at: str
    # Comptabilité historique
    ticket_price: Optional[float] = None
    tickets_sold: Optional[int] = None
    total_revenue: Optional[float] = None
    artist_payment: Optional[float] = None
    expenses: Optional[float] = None
    net_profit: Optional[float] = None
    payment_method: Optional[str] = None
    amount: Optional[float] = None
    payment_status: Optional[str] = "pending"
    invoice_file: Optional[str] = None

# Modèles pour les candidatures
class Application(BaseModel):
    musician_id: str
    planning_slot_id: str
    status: str  # pending, accepted, rejected
    created_at: str

class ApplicationResponse(BaseModel):
    id: str
    musician_id: str
    musician_name: Optional[str] = None
    musician_email: Optional[str] = None
    musician_instruments: List[str] = []
    musician_music_styles: List[str] = []
    musician_experience_level: Optional[str] = None
    musician_city: Optional[str] = None
    planning_slot_id: str
    slot_date: Optional[str] = None
    slot_time: Optional[str] = None
    slot_title: Optional[str] = None
    venue_name: Optional[str] = None
    status: str  # pending, accepted, rejected
    created_at: str

# Modèle pour les créneaux de planning
class PlanningSlot(BaseModel):
    venue_id: str
    date: str
    time: Optional[str] = None
    title: Optional[str] = None
    music_styles: List[str] = []
    description: Optional[str] = None
    expected_band_style: Optional[str] = None
    expected_attendance: Optional[str] = None
    payment: Optional[str] = None
    artist_categories: List[str] = []
    num_bands_needed: int = 1
    application_type: str = "bands"  # "bands" or "solo"
    # Catering
    has_catering: bool = False
    catering_drinks: int = 0
    catering_respect: bool = False
    catering_tbd: bool = False
    # Accommodation
    has_accommodation: bool = False
    accommodation_capacity: int = 0
    accommodation_tbd: bool = False

class PlanningSlotResponse(BaseModel):
    id: str
    venue_id: str
    venue_name: Optional[str] = None
    date: str
    time: Optional[str] = None
    title: Optional[str] = None
    music_styles: List[str] = []
    description: Optional[str] = None
    expected_band_style: Optional[str] = None
    expected_attendance: Optional[str] = None
    payment: Optional[str] = None
    artist_categories: List[str] = []
    num_bands_needed: int = 1
    application_type: str = "bands"
    applications_count: int = 0
    # Catering
    has_catering: bool = False
    catering_drinks: int = 0
    catering_respect: bool = False
    catering_tbd: bool = False
    # Accommodation
    has_accommodation: bool = False
    accommodation_capacity: int = 0
    accommodation_tbd: bool = False
    created_at: str

# Modèle pour les candidatures de concerts
class ConcertApplication(BaseModel):
    concert_id: str
    band_name: str
    band_members: List[str] = []
    contact_email: str
    contact_phone: Optional[str] = None
    message: Optional[str] = None


class ConcertApplicationResponse(BaseModel):
    id: str
    concert_id: str
    band_name: str
    band_members: List[str] = []
    contact_email: str
    contact_phone: Optional[str] = None
    message: Optional[str] = None
    status: str = "pending"
    created_at: str

    status: str = "pending"  # pending, accepted, rejected


