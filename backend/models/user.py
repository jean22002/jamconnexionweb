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

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str
    subscription_status: Optional[str] = None
    trial_end: Optional[str] = None
    has_active_subscription: Optional[bool] = False

class TokenResponse(BaseModel):
    token: str
    user: UserResponse
