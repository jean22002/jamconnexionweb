from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReportCreate(BaseModel):
    """Modèle pour créer un signalement"""
    reported_user_id: str = Field(..., description="ID de l'utilisateur signalé")
    reported_profile_type: str = Field(..., description="Type de profil: musician, venue, melomane")
    reason: str = Field(..., description="Raison du signalement")
    details: Optional[str] = Field(None, description="Détails supplémentaires du signalement")

class ReportResponse(BaseModel):
    """Modèle de réponse pour un signalement"""
    id: str
    reporter_user_id: str
    reporter_email: str
    reported_user_id: str
    reported_user_email: str
    reported_profile_type: str
    reported_profile_name: str
    reason: str
    details: Optional[str]
    status: str = "pending"  # pending, reviewed, resolved, dismissed
    created_at: str
    reviewed_at: Optional[str] = None
    admin_notes: Optional[str] = None
