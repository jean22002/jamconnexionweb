from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from uuid import uuid4
import logging

from firebase_config import send_push_notification, send_push_to_multiple, is_firebase_initialized

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications/firebase", tags=["firebase-push"])

# DB will be injected
db = None

def set_db(database):
    global db
    db = database

# ============================================
# Auth Helper
# ============================================

async def get_current_user_local(authorization: str = Header(None)):
    """Import get_current_user locally to avoid circular imports"""
    from utils import get_current_user
    return await get_current_user(authorization, db)

# ============================================
# Models
# ============================================

class RegisterDeviceRequest(BaseModel):
    fcm_token: str
    device_type: str  # "ios" ou "android"
    device_model: Optional[str] = None
    os_version: Optional[str] = None

class SendNotificationRequest(BaseModel):
    user_id: str
    title: str
    body: str
    data: Optional[dict] = None

# ============================================
# Endpoints
# ============================================

@router.post("/register-device")
async def register_device(
    request: RegisterDeviceRequest,
    user: dict = Depends(get_current_user_local)
):
    """
    Enregistre le token FCM d'un appareil mobile.
    
    L'application mobile React Native doit appeler cet endpoint après :
    1. L'utilisateur s'est connecté
    2. L'app a obtenu le token FCM de Firebase
    
    Exemple d'appel depuis React Native :
    ```javascript
    import messaging from '@react-native-firebase/messaging';
    
    const fcmToken = await messaging().getToken();
    await api.post('/notifications/firebase/register-device', {
      fcm_token: fcmToken,
      device_type: Platform.OS // 'ios' ou 'android'
    });
    ```
    """
    try:
        # Vérifier si l'appareil est déjà enregistré
        existing = await db.firebase_devices.find_one({
            "user_id": user["id"],
            "fcm_token": request.fcm_token
        })
        
        now = datetime.now(timezone.utc)
        
        if existing:
            # Mettre à jour
            await db.firebase_devices.update_one(
                {"id": existing["id"]},
                {
                    "$set": {
                        "device_type": request.device_type,
                        "device_model": request.device_model,
                        "os_version": request.os_version,
                        "updated_at": now,
                        "active": True
                    }
                }
            )
            logger.info(f"✅ Updated FCM token for user {user['id']}")
            return {"success": True, "message": "Token mis à jour", "device_id": existing["id"]}
        
        # Créer nouvel enregistrement
        device_id = str(uuid4())
        device_doc = {
            "id": device_id,
            "user_id": user["id"],
            "user_email": user["email"],
            "user_role": user["role"],
            "fcm_token": request.fcm_token,
            "device_type": request.device_type,
            "device_model": request.device_model,
            "os_version": request.os_version,
            "active": True,
            "created_at": now,
            "updated_at": now
        }
        
        await db.firebase_devices.insert_one(device_doc)
        logger.info(f"✅ Registered new FCM device for user {user['id']}")
        
        return {"success": True, "message": "Token enregistré", "device_id": device_id}
        
    except Exception as e:
        logger.error(f"❌ Error registering device: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/unregister-device")
async def unregister_device(
    fcm_token: str,
    user: dict = Depends(get_current_user_local)
):
    """
    Désactive un token FCM (lors de la déconnexion ou désinstallation).
    """
    try:
        result = await db.firebase_devices.update_many(
            {"user_id": user["id"], "fcm_token": fcm_token},
            {"$set": {"active": False, "updated_at": datetime.now(timezone.utc)}}
        )
        
        if result.modified_count > 0:
            logger.info(f"✅ Unregistered device for user {user['id']}")
            return {"success": True, "message": "Appareil désenregistré"}
        else:
            raise HTTPException(status_code=404, detail="Appareil non trouvé")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error unregistering device: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_firebase_status(user: dict = Depends(get_current_user_local)):
    """
    Retourne le statut des appareils enregistrés pour cet utilisateur.
    """
    try:
        devices = await db.firebase_devices.find(
            {"user_id": user["id"], "active": True},
            {"_id": 0, "fcm_token": 0}  # Exclure le token pour sécurité
        ).to_list(10)
        
        return {
            "firebase_initialized": is_firebase_initialized(),
            "device_count": len(devices),
            "devices": devices
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send")
async def send_notification_endpoint(
    request: SendNotificationRequest,
    user: dict = Depends(get_current_user_local)
):
    """
    Envoie une notification Firebase à un utilisateur spécifique.
    
    ⚠️ USAGE INTERNE UNIQUEMENT ⚠️
    
    Cet endpoint est appelé par d'autres parties du backend
    (par exemple quand une candidature est acceptée).
    
    Les apps mobiles N'APPELLENT PAS cet endpoint directement.
    """
    try:
        # Récupérer tous les appareils actifs de l'utilisateur cible
        devices = await db.firebase_devices.find(
            {"user_id": request.user_id, "active": True},
            {"_id": 0}
        ).to_list(10)
        
        if not devices:
            return {
                "success": False,
                "message": "Aucun appareil enregistré pour cet utilisateur"
            }
        
        # Extraire les tokens
        fcm_tokens = [device["fcm_token"] for device in devices]
        
        # Envoyer notification
        result = await send_push_to_multiple(
            fcm_tokens=fcm_tokens,
            title=request.title,
            body=request.body,
            data=request.data
        )
        
        # Sauvegarder dans l'historique notifications
        await db.notifications.insert_one({
            "id": str(uuid4()),
            "user_id": request.user_id,
            "title": request.title,
            "message": request.body,
            "type": request.data.get("type", "general") if request.data else "general",
            "is_read": False,
            "created_at": datetime.now(timezone.utc)
        })
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Error sending notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Helper Function (utilisé par autres routes)
# ============================================

async def send_firebase_push_to_user(
    user_id: str,
    title: str,
    body: str,
    data: dict = None
) -> bool:
    """
    Fonction helper pour envoyer une notification Firebase.
    
    Peut être importée et utilisée par d'autres modules :
    
    ```python
    from routes.firebase_push import send_firebase_push_to_user
    
    # Dans un autre endpoint
    await send_firebase_push_to_user(
        user_id="usr_123",
        title="Candidature acceptée !",
        body="Votre candidature a été acceptée.",
        data={"type": "application_accepted", "event_id": "evt_456"}
    )
    ```
    
    Returns:
        bool: True si au moins une notification a été envoyée
    """
    try:
        if not is_firebase_initialized():
            logger.warning("Firebase not initialized, skipping push")
            return False
        
        # Récupérer appareils
        devices = await db.firebase_devices.find(
            {"user_id": user_id, "active": True},
            {"_id": 0}
        ).to_list(10)
        
        if not devices:
            logger.info(f"No devices registered for user {user_id}")
            return False
        
        fcm_tokens = [device["fcm_token"] for device in devices]
        
        # Envoyer
        result = await send_push_to_multiple(
            fcm_tokens=fcm_tokens,
            title=title,
            body=body,
            data=data
        )
        
        return result.get("success", False) and result.get("success_count", 0) > 0
        
    except Exception as e:
        logger.error(f"Error in send_firebase_push_to_user: {e}")
        return False
