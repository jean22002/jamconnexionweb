from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid

from models import UserRegister, UserLogin, UserResponse, TokenResponse
from utils import hash_password, verify_password, create_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

@router.post("/register", response_model=TokenResponse)
async def register(data: UserRegister):
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
    
    # Créer automatiquement le profil correspondant au rôle
    if data.role == "musician":
        musician_profile = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "pseudo": data.name,
            "instruments": [],
            "music_styles": [],
            "created_at": now
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
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["email"], user["role"])
    
    return TokenResponse(
        token=token,
        user=UserResponse(
            id=user["id"], email=user["email"], name=user["name"], role=user["role"],
            created_at=user["created_at"], subscription_status=user.get("subscription_status"),
            trial_end=user.get("trial_end")
        )
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"], email=current_user["email"], name=current_user["name"],
        role=current_user["role"], created_at=current_user["created_at"],
        subscription_status=current_user.get("subscription_status"),
        trial_end=current_user.get("trial_end")
    )
