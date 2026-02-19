from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class BandInfo(BaseModel):
    name: str
    photo: Optional[str] = None
    description: Optional[str] = None
    members_count: Optional[int] = None
    music_styles: List[str] = []
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    youtube: Optional[str] = None
    website: Optional[str] = None
    bandcamp: Optional[str] = None
    looking_for_concerts: bool = True
    looking_for_members: bool = False
    looking_for_profiles: List[str] = []  # Profils recherchés (batteur, guitariste, etc.)
    is_public: bool = True
    # Nouveaux champs
    band_type: Optional[str] = None
    repertoire_type: Optional[str] = None
    show_duration: Optional[str] = None
    admin_id: Optional[str] = None
    has_sound_engineer: bool = False
    is_association: bool = False
    association_name: Optional[str] = None
    has_label: bool = False
    label_name: Optional[str] = None
    label_city: Optional[str] = None
    # Location info
    city: Optional[str] = None
    postal_code: Optional[str] = None
    department: Optional[str] = None
    department_name: Optional[str] = None
    region: Optional[str] = None
    # Comptabilité / Paiements
    payment_methods: List[str] = []  # ["facture", "guso"]

class MusicianConcert(BaseModel):
    id: Optional[str] = None
    date: str
    venue_id: Optional[str] = None
    venue_name: Optional[str] = None
    city: str
    description: Optional[str] = None

class MusicianProfile(BaseModel):
    pseudo: str
    age: Optional[int] = None
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    instruments: List[str] = []
    music_styles: List[str] = []
    experience_years: Optional[int] = None
    experience_level: Optional[str] = None
    city: Optional[str] = None
    department: Optional[str] = None
    region: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    youtube: Optional[str] = None
    bandcamp: Optional[str] = None
    has_band: bool = False
    band: Optional[BandInfo] = None
    bands: List[BandInfo] = []
    solo_profile: Optional[Dict[str, Any]] = None
    concerts: List[MusicianConcert] = []

class MusicianProfileResponse(BaseModel):
    id: str
    user_id: str
    pseudo: str
    age: Optional[int] = None
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    instruments: List[str] = []
    music_styles: List[str] = []
    experience_years: Optional[int] = None
    experience_level: Optional[str] = None
    city: Optional[str] = None
    department: Optional[str] = None
    region: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    youtube: Optional[str] = None
    bandcamp: Optional[str] = None
    has_band: bool = False
    band: Optional[Dict[str, Any]] = None
    bands: List[Dict[str, Any]] = []
    solo_profile: Optional[Dict[str, Any]] = None
    concerts: List[Dict[str, Any]] = []
    friends_count: int = 0
    created_at: str

class FriendRequest(BaseModel):
    to_user_id: str

class FriendRequestResponse(BaseModel):
    id: str
    from_user_id: str
    from_user_name: str
    from_user_image: Optional[str] = None
    to_user_id: str
    status: str  # pending, accepted, rejected
    created_at: str

class BandJoinRequest(BaseModel):
    band_name: str
    message: Optional[str] = None
    musician_name: str

class BandJoinRequestResponse(BaseModel):
    id: str
    band_name: str
    musician_id: str
    musician_name: str
    admin_id: str
    message: Optional[str] = None
    status: str  # pending, accepted, rejected
    created_at: str
