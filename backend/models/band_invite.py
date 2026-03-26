"""
Modèle pour les codes d'invitation de groupe
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class BandInviteCode(BaseModel):
    """Code d'invitation pour rejoindre un groupe"""
    id: str
    band_id: str
    code: str = Field(..., min_length=6, max_length=6, description="Code d'invitation (6 caractères)")
    created_by: str = Field(..., description="User ID de l'administrateur qui a créé le code")
    created_at: datetime
    expires_at: datetime = Field(..., description="Date d'expiration (7 jours après création)")
    is_active: bool = True
    used_by: List[str] = Field(default_factory=list, description="Liste des user_id ayant utilisé ce code")

class BandInviteCodeCreate(BaseModel):
    """Requête pour créer un code d'invitation"""
    band_id: str

class BandInviteCodeResponse(BaseModel):
    """Réponse contenant le code d'invitation"""
    code: str
    band_id: str
    band_name: str
    expires_at: datetime
    members_joined: int = Field(..., description="Nombre de membres ayant rejoint via ce code")

class JoinBandRequest(BaseModel):
    """Requête pour rejoindre un groupe via code"""
    code: str = Field(..., min_length=6, max_length=6)

class JoinBandResponse(BaseModel):
    """Réponse après avoir rejoint un groupe"""
    success: bool
    message: str
    band_id: str
    band_name: str

class InviteCodeMember(BaseModel):
    """Membre ayant rejoint via code d'invitation"""
    user_id: str
    pseudo: str
    profile_image: Optional[str] = None
    joined_at: datetime
