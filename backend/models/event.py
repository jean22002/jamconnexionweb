from pydantic import BaseModel, model_validator
from typing import Optional, List, Dict, Any

VALID_PAYMENT_METHODS = {"facture", "guso", "promotion"}
VALID_PAYMENT_MODES = {"especes", "cheque", "virement"}


class PaymentValidationMixin:
    """
    Mixin Pydantic appliquant les règles métier :
      - payment_method ∈ {facture, guso, promotion, None}
      - payment_mode ∈ {especes, cheque, virement, None}
      - method = "promotion" → mode forcé à None, amount à 0
      - method ∈ {facture, guso} → mode obligatoire
    """

    @model_validator(mode="after")
    def _validate_payment_fields(self):
        method = getattr(self, "payment_method", None)
        mode = getattr(self, "payment_mode", None)

        if method is not None and method not in VALID_PAYMENT_METHODS:
            raise ValueError(
                f"payment_method invalide. Valeurs autorisées : {sorted(VALID_PAYMENT_METHODS)}"
            )
        if mode is not None and mode not in VALID_PAYMENT_MODES:
            raise ValueError(
                f"payment_mode invalide. Valeurs autorisées : {sorted(VALID_PAYMENT_MODES)}"
            )

        if method == "promotion":
            self.payment_mode = None
            self.amount = 0
        elif method in ("facture", "guso") and not mode:
            raise ValueError(
                "payment_mode est obligatoire quand payment_method est 'facture' ou 'guso'"
            )
        return self


class JamEvent(BaseModel, PaymentValidationMixin):
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
    payment_mode: Optional[str] = None  # especes, cheque, virement (si payment_method ∈ facture/guso)
    amount: Optional[float] = None
    payment_status: Optional[str] = "pending"
    invoice_file: Optional[str] = None

class JamEventResponse(BaseModel):
    id: str
    venue_id: str
    venue_name: str = ""  # Default for older records
    date: str
    start_time: str = ""  # Default for older records
    end_time: Optional[str] = ""  # Default for older records
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
    payment_mode: Optional[str] = None
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

class ConcertEvent(BaseModel, PaymentValidationMixin):
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
    payment_mode: Optional[str] = None  # especes, cheque, virement (si payment_method ∈ facture/guso)
    amount: Optional[float] = None
    payment_status: Optional[str] = "pending"
    invoice_file: Optional[str] = None
    # GUSO fields (for intermittent artists)
    is_guso: bool = False
    cachet_type: Optional[str] = None  # "isolé" or "groupé"
    guso_contract_type: Optional[str] = None  # "CDDU", "CDD", etc.

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
    payment_mode: Optional[str] = None
    amount: Optional[float] = None
    payment_status: Optional[str] = "pending"
    invoice_file: Optional[str] = None
    # GUSO fields
    is_guso: bool = False
    cachet_type: Optional[str] = None
    guso_contract_type: Optional[str] = None

class KaraokeEvent(BaseModel, PaymentValidationMixin):
    date: str
    start_time: str
    end_time: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    music_styles: List[str] = []
    host_name: Optional[str] = None
    # Comptabilité
    payment_method: Optional[str] = None
    payment_mode: Optional[str] = None  # especes, cheque, virement (si payment_method ∈ facture/guso)
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
    payment_mode: Optional[str] = None
    amount: Optional[float] = None
    payment_status: Optional[str] = "pending"
    invoice_file: Optional[str] = None

class SpectacleEvent(BaseModel, PaymentValidationMixin):
    date: str
    start_time: str
    end_time: Optional[str] = None
    type: str  # Concert, Théâtre, Stand-up, etc.
    artist_name: str
    description: Optional[str] = None
    price: Optional[str] = None
    # Comptabilité
    payment_method: Optional[str] = None
    payment_mode: Optional[str] = None  # especes, cheque, virement (si payment_method ∈ facture/guso)
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
    payment_mode: Optional[str] = None
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
    venue_id: Optional[str] = None  # Optional in request, will be set from auth
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
    is_guso: bool = False  # GUSO contract
    is_open: bool = True  # Slot ouvert aux candidatures par défaut
    # Catering (boissons)
    has_catering: bool = False
    catering_drinks: int = 0
    catering_respect: bool = False
    catering_tbd: bool = False
    # Meals (repas) — nouveau (mobile)
    has_meals: bool = False
    meals_count: int = 0
    meals_tbd: bool = False
    # Accommodation
    has_accommodation: bool = False
    accommodation_capacity: int = 0
    accommodation_tbd: bool = False
    # 🆕 Build 91 — Formation recherchée (filtrage candidatures par taille de projet)
    formation_type: Optional[str] = None  # Solo, Duo, Trio, Quatuor, Quintet, Groupe, ou None (any)
    max_musicians: Optional[int] = None  # 1, 2, 3, 4, 5, 8 ou None

    class Config:
        # Build 152.14 — extra='ignore' : rejette silencieusement les champs inconnus (client input)
        extra = "ignore"

class PlanningSlotResponse(BaseModel):
    id: str
    venue_id: str
    venue_name: Optional[str] = None
    venue_city: Optional[str] = None
    venue_region: Optional[str] = None
    venue_department: Optional[str] = None
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
    accepted_bands_count: int = 0
    is_open: bool = True
    # Catering (boissons)
    has_catering: bool = False
    catering_drinks: int = 0
    catering_respect: bool = False
    catering_tbd: bool = False
    # Meals (repas) — nouveau (mobile)
    has_meals: bool = False
    meals_count: int = 0
    meals_tbd: bool = False
    # Accommodation
    has_accommodation: bool = False
    accommodation_capacity: int = 0
    accommodation_tbd: bool = False
    is_guso: bool = False  # GUSO contract
    # 🆕 Build 91 — Formation recherchée
    formation_type: Optional[str] = None
    max_musicians: Optional[int] = None
    created_at: str
    
    class Config:
        # Build 152.14 — extra='ignore' : évite le leak DB (_id ObjectId, etc.) → response
        extra = "ignore"

# Modèle pour les candidatures de concerts
class ConcertApplication(BaseModel):
    # Build 152.12 — Accepte concert_id OU planning_slot_id (rétro-compat mobile)
    concert_id: Optional[str] = None
    planning_slot_id: Optional[str] = None
    band_name: str
    band_id: Optional[str] = None
    band_type: Optional[str] = None  # 'Solo' | 'Groupe'
    band_members: List[str] = []
    members_count: Optional[int] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    message: Optional[str] = None
    # Fields sometimes sent by mobile — accept them silently
    has_catering: Optional[bool] = None
    catering_drinks: Optional[int] = None
    catering_tbd: Optional[bool] = None
    has_meals: Optional[bool] = None
    meals_count: Optional[int] = None
    meals_tbd: Optional[bool] = None
    has_accommodation: Optional[bool] = None
    accommodation_capacity: Optional[int] = None
    accommodation_tbd: Optional[bool] = None

    class Config:
        # Build 152.14 — extra='ignore' : rejette silencieusement les champs inconnus du client
        extra = "ignore"


class ConcertApplicationResponse(BaseModel):
    id: str
    concert_id: Optional[str] = None
    planning_slot_id: Optional[str] = None
    band_name: Optional[str] = None
    band_id: Optional[str] = None
    band_type: Optional[str] = None  # 'group' or 'solo'
    band_members: List[str] = []
    members_count: Optional[int] = None
    musician_id: Optional[str] = None
    musician_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    message: Optional[str] = None
    status: str = "pending"  # pending, accepted, rejected, cancelled
    created_at: Optional[str] = None
    # Boissons
    has_catering: Optional[bool] = None
    catering_drinks: Optional[int] = None
    catering_tbd: Optional[bool] = None
    # Repas (nouveau mobile)
    has_meals: Optional[bool] = None
    meals_count: Optional[int] = None
    meals_tbd: Optional[bool] = None
    # Hébergement
    has_accommodation: Optional[bool] = None
    accommodation_capacity: Optional[int] = None
    accommodation_tbd: Optional[bool] = None
    # Cancellation flow (Build 152.6)
    cancellation_status: Optional[str] = None
    cancellation_requested_at: Optional[str] = None
    cancellation_resolved_at: Optional[str] = None
    cancellation_reason: Optional[str] = None
    cancellation_message: Optional[str] = None
    
    class Config:
        # Build 152.13 — extra='ignore' évite les leaks DB (ObjectId, etc.) → response
        extra = "ignore"


