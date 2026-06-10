from pydantic import BaseModel, EmailStr
from typing import Optional

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str
    subscription_status: Optional[str] = None
    trial_end: Optional[str] = None
    has_active_subscription: Optional[bool] = False
    # 🆕 Build 95.2 — Consentement publicitaire RGPD (sync Web ↔ Mobile)
    ad_consent: Optional[bool] = None  # None = pas encore demandé, True/False = choix utilisateur
    ad_consent_date: Optional[str] = None  # ISO datetime du dernier choix


class AdConsentUpdate(BaseModel):
    """Body de PATCH /api/auth/me/ad-consent — sync RGPD Web↔Mobile."""
    ad_consent: bool

class TokenResponse(BaseModel):
    token: str
    user: UserResponse
