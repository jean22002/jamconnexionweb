from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import jwt
import os
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications/push", tags=["push-notifications"])

# MongoDB database (will be injected)
db = None

def set_db(database):
    global db
    db = database

JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret')
JWT_ALGORITHM = "HS256"

# Helper function for authentication
async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

class PushSubscription(BaseModel):
    subscription: Dict[str, Any]
    user_agent: Optional[str] = None
    platform: Optional[str] = None

class UnsubscribeRequest(BaseModel):
    endpoint: str

@router.post("/subscribe")
async def subscribe_to_push(data: PushSubscription, current_user: dict = Depends(get_current_user)):
    """Subscribe user to push notifications"""
    try:
        subscription_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        # Vérifier si l'abonnement existe déjà
        existing = await db.push_subscriptions.find_one({
            "user_id": current_user["id"],
            "endpoint": data.subscription.get("endpoint")
        })
        
        if existing:
            # Mettre à jour l'abonnement existant
            await db.push_subscriptions.update_one(
                {"id": existing["id"]},
                {"$set": {
                    "subscription": data.subscription,
                    "user_agent": data.user_agent,
                    "platform": data.platform,
                    "updated_at": now,
                    "active": True
                }}
            )
            logger.info(f"Updated push subscription for user {current_user['id']}")
            return {"message": "Subscription updated", "id": existing["id"]}
        
        # Créer un nouvel abonnement
        subscription_doc = {
            "id": subscription_id,
            "user_id": current_user["id"],
            "user_email": current_user["email"],
            "user_role": current_user["role"],
            "subscription": data.subscription,
            "endpoint": data.subscription.get("endpoint"),
            "user_agent": data.user_agent,
            "platform": data.platform,
            "active": True,
            "created_at": now,
            "updated_at": now
        }
        
        await db.push_subscriptions.insert_one(subscription_doc)
        logger.info(f"Created push subscription for user {current_user['id']}")
        
        return {"message": "Subscribed successfully", "id": subscription_id}
    except Exception as e:
        logger.error(f"Error subscribing to push: {e}")
        raise HTTPException(status_code=500, detail=f"Error subscribing: {str(e)}")

@router.post("/unsubscribe")
async def unsubscribe_from_push(data: UnsubscribeRequest, current_user: dict = Depends(get_current_user)):
    """Unsubscribe user from push notifications"""
    try:
        result = await db.push_subscriptions.update_many(
            {
                "user_id": current_user["id"],
                "endpoint": data.endpoint
            },
            {"$set": {
                "active": False,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.modified_count > 0:
            logger.info(f"Unsubscribed push for user {current_user['id']}")
            return {"message": "Unsubscribed successfully"}
        else:
            raise HTTPException(status_code=404, detail="Subscription not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unsubscribing from push: {e}")
        raise HTTPException(status_code=500, detail=f"Error unsubscribing: {str(e)}")

@router.get("/status")
async def get_push_status(current_user: dict = Depends(get_current_user)):
    """Get user's push notification status"""
    try:
        subscriptions = await db.push_subscriptions.find({
            "user_id": current_user["id"],
            "active": True
        }, {"_id": 0}).to_list(10)
        
        return {
            "subscribed": len(subscriptions) > 0,
            "subscription_count": len(subscriptions),
            "subscriptions": [
                {
                    "id": sub["id"],
                    "platform": sub.get("platform"),
                    "created_at": sub["created_at"]
                }
                for sub in subscriptions
            ]
        }
    except Exception as e:
        logger.error(f"Error getting push status: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# Fonction helper pour envoyer une notification push à un utilisateur
async def send_push_notification(user_id: str, notification_data: Dict[str, Any]):
    """
    Envoie une notification push à tous les appareils d'un utilisateur
    
    notification_data should include:
    - title: str
    - message: str
    - link: str (optional)
    - data: dict (optional)
    """
    try:
        # Récupérer tous les abonnements actifs de l'utilisateur
        subscriptions = await db.push_subscriptions.find({
            "user_id": user_id,
            "active": True
        }, {"_id": 0}).to_list(100)
        
        if not subscriptions:
            logger.info(f"No active push subscriptions for user {user_id}")
            return False
        
        # Charger la clé VAPID privée
        vapid_private_key_file = os.environ.get('VAPID_PRIVATE_KEY_FILE', '/tmp/vapid_private.pem')
        vapid_claims_email = os.environ.get('VAPID_CLAIMS_EMAIL', 'noreply@jamconnexion.com')
        
        from pywebpush import webpush, WebPushException
        from py_vapid import Vapid
        
        # Charger la clé privée VAPID
        vapid = Vapid()
        vapid.from_file(vapid_private_key_file)
        vapid_claims = {"sub": f"mailto:{vapid_claims_email}"}
        
        success_count = 0
        failed_count = 0
        
        # Envoyer la notification à tous les appareils
        for sub in subscriptions:
            try:
                webpush(
                    subscription_info=sub["subscription"],
                    data=json.dumps(notification_data),
                    vapid_private_key=vapid,
                    vapid_claims=vapid_claims,
                    timeout=10
                )
                success_count += 1
                logger.info(f"Push notification sent successfully to device {sub['id'][:8]}...")
            except WebPushException as e:
                failed_count += 1
                logger.error(f"Error sending push to device {sub['id'][:8]}...: {e}")
                
                # Si l'abonnement n'est plus valide (410 Gone), le désactiver
                if e.response and e.response.status_code == 410:
                    logger.info(f"Deactivating invalid subscription {sub['id'][:8]}...")
                    await db.push_subscriptions.update_one(
                        {"id": sub["id"]},
                        {"$set": {"active": False}}
                    )
            except Exception as e:
                failed_count += 1
                logger.error(f"Unexpected error sending push to device {sub['id'][:8]}...: {e}")
        
        logger.info(f"Push notification sent: {success_count} success, {failed_count} failed")
        return success_count > 0
        
    except Exception as e:
        logger.error(f"Error sending push notification: {e}")
        return False
    except Exception as e:
        logger.error(f"Error sending push notification: {e}")
        return False
