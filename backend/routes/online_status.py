from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
import os

from utils import get_current_user

router = APIRouter(prefix="/online-status", tags=["Online Status"])

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Pydantic models
class OnlineStatusModeUpdate(BaseModel):
    mode: str  # "auto", "manual", "disabled"

class ManualStatusUpdate(BaseModel):
    is_online: bool

# Durée après laquelle un utilisateur est considéré hors ligne (5 minutes)
ONLINE_THRESHOLD_MINUTES = 5

@router.get("/mode")
async def get_online_status_mode(current_user: dict = Depends(get_current_user)):
    """Récupérer le mode de statut en ligne de l'utilisateur"""
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    return {
        "mode": user.get("online_status_mode", "auto"),
        "manual_status": user.get("manual_online_status", False),
        "last_activity": user.get("last_activity"),
        "is_online": await is_user_online(user)
    }

@router.put("/mode")
async def update_online_status_mode(
    data: OnlineStatusModeUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Mettre à jour le mode de statut en ligne"""
    if data.mode not in ["auto", "manual", "disabled"]:
        raise HTTPException(
            status_code=400,
            detail="Le mode doit être 'auto', 'manual' ou 'disabled'"
        )
    
    now = datetime.now(timezone.utc).isoformat()
    
    update_data = {
        "online_status_mode": data.mode,
        "updated_at": now
    }
    
    # Si on passe en mode auto, mettre à jour last_activity
    if data.mode == "auto":
        update_data["last_activity"] = now
        update_data["manual_online_status"] = False
    
    # Si on passe en mode manuel, initialiser à "en ligne" par défaut
    if data.mode == "manual":
        update_data["manual_online_status"] = True
    
    # Si on désactive, mettre manual_status à False
    if data.mode == "disabled":
        update_data["manual_online_status"] = False
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": update_data}
    )
    
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    return {
        "mode": data.mode,
        "manual_status": user.get("manual_online_status", False),
        "is_online": await is_user_online(user),
        "message": f"Mode de statut en ligne mis à jour: {data.mode}"
    }

@router.put("/manual")
async def update_manual_status(
    data: ManualStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Mettre à jour manuellement le statut en ligne (uniquement en mode manuel)"""
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    mode = user.get("online_status_mode", "auto")
    if mode != "manual":
        raise HTTPException(
            status_code=400,
            detail="Le statut manuel ne peut être modifié qu'en mode 'manual'"
        )
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {
            "manual_online_status": data.is_online,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "manual_status": data.is_online,
        "message": f"Statut manuel mis à jour: {'en ligne' if data.is_online else 'hors ligne'}"
    }

@router.post("/heartbeat")
async def update_activity(current_user: dict = Depends(get_current_user)):
    """Mettre à jour l'activité de l'utilisateur (pour le mode auto)"""
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    mode = user.get("online_status_mode", "auto")
    
    # Mettre à jour last_activity seulement en mode auto
    if mode == "auto":
        now = datetime.now(timezone.utc).isoformat()
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"last_activity": now}}
        )
        return {"last_activity": now, "is_online": True}
    
    return {
        "last_activity": user.get("last_activity"),
        "is_online": await is_user_online(user)
    }

@router.get("/user/{user_id}")
async def get_user_online_status(user_id: str):
    """Récupérer le statut en ligne d'un utilisateur (public)"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    return {
        "user_id": user_id,
        "is_online": await is_user_online(user),
        "mode": user.get("online_status_mode", "auto")
    }

# Helper function
async def is_user_online(user: dict) -> bool:
    """Détermine si un utilisateur est en ligne selon son mode"""
    mode = user.get("online_status_mode", "auto")
    
    if mode == "disabled":
        return False
    
    if mode == "manual":
        return user.get("manual_online_status", False)
    
    # Mode auto: vérifier last_activity
    last_activity = user.get("last_activity")
    if not last_activity:
        return False
    
    try:
        last_active_dt = datetime.fromisoformat(last_activity.replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        time_diff = now - last_active_dt
        return time_diff < timedelta(minutes=ONLINE_THRESHOLD_MINUTES)
    except:
        return False
