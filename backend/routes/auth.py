from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid

from models import UserRegister, UserLogin, UserResponse, TokenResponse
from utils import hash_password, verify_password, create_token, get_current_user
from middleware.rate_limit import limiter
from routes.audit import log_action  # Import audit logging

router = APIRouter(prefix="/auth", tags=["Authentication"])

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

@router.post("/register", response_model=TokenResponse)
@limiter.limit("5/hour")
async def register(request: Request, data: UserRegister):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Adresse email déjà existante")
    
    if data.role not in ["musician", "venue", "melomane"]:
        raise HTTPException(status_code=400, detail="Le rôle doit être 'musician', 'venue' ou 'melomane'")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    trial_end = None
    subscription_status = None
    if data.role == "venue":
        trial_end = (datetime.now(timezone.utc) + timedelta(days=60)).isoformat()
        subscription_status = "trial"
    
    user_doc = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "role": data.role,
        "created_at": now,
        "subscription_status": subscription_status,
        "trial_end": trial_end
    }
    
    await db.users.insert_one(user_doc)
    
    # Audit log: User registration
    await log_action(
        user_id=user_id,
        user_role=data.role,
        action="register",
        resource_type="user",
        resource_id=user_id,
        details={"email": data.email, "name": data.name},
        request=request,
        status="success"
    )
    
    # Créer automatiquement le profil correspondant au rôle
    if data.role == "musician":
        # Auto-activate PRO for all new musicians (for testing)
        pro_start = datetime.now(timezone.utc)
        pro_end = pro_start + timedelta(days=365)
        
        musician_profile = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "pseudo": data.name,
            "instruments": [],
            "music_styles": [],
            "created_at": now,
            # PRO subscription auto-activated
            "subscription_tier": "pro",
            "subscription_status": "active",
            "subscription_started": pro_start.isoformat(),
            "subscription_expires": pro_end.isoformat(),
            "is_pro": True,
            "pro_subscription_status": "active"
        }
        await db.musicians.insert_one(musician_profile)
    elif data.role == "melomane":
        melomane_profile = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "pseudo": data.name,
            "favorite_styles": [],
            "created_at": now
        }
        await db.melomanes.insert_one(melomane_profile)
    
    token = create_token(user_id, data.email, data.role)
    
    return TokenResponse(
        token=token,
        user=UserResponse(
            id=user_id, email=data.email, name=data.name, role=data.role,
            created_at=now, subscription_status=subscription_status, trial_end=trial_end
        )
    )

@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/5minutes")
async def login(request: Request, data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    
    if not user or not verify_password(data.password, user["password"]):
        # Audit log: Failed login attempt
        await log_action(
            user_id=data.email,  # Use email as identifier for failed attempts
            user_role="unknown",
            action="login",
            resource_type="auth",
            details={"email": data.email, "reason": "invalid_credentials"},
            request=request,
            status="failed"
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Audit log: Successful login
    await log_action(
        user_id=user["id"],
        user_role=user["role"],
        action="login",
        resource_type="auth",
        request=request,
        status="success"
    )
    
    token = create_token(user["id"], user["email"], user["role"])
    
    return TokenResponse(
        token=token,
        user=UserResponse(
            id=user["id"], email=user["email"], name=user.get("name", user["email"]), role=user["role"],
            created_at=user["created_at"], subscription_status=user.get("subscription_status"),
            trial_end=user.get("trial_end")
        )
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"], email=current_user["email"], name=current_user.get("name", current_user["email"]),
        role=current_user["role"], created_at=current_user["created_at"],
        subscription_status=current_user.get("subscription_status"),
        trial_end=current_user.get("trial_end")
    )
