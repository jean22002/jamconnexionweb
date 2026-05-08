import firebase_admin
from firebase_admin import credentials, messaging
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Variable globale pour tracker l'initialisation
_firebase_initialized = False

def initialize_firebase():
    """
    Initialise Firebase Admin SDK pour l'envoi de notifications push mobile.
    
    IMPORTANT: Avant d'utiliser cette fonction, vous devez :
    1. Créer un projet Firebase sur https://console.firebase.google.com/
    2. Aller dans Paramètres projet > Comptes de service
    3. Générer une nouvelle clé privée (fichier JSON)
    4. Placer ce fichier dans /app/backend/firebase-credentials.json
    5. Ajouter FIREBASE_CREDENTIALS_PATH dans .env
    """
    global _firebase_initialized
    
    if _firebase_initialized:
        logger.info("⚠️  Firebase déjà initialisé, skip")
        return True
    
    try:
        # Vérifier si Firebase est déjà initialisé
        if firebase_admin._apps:
            logger.info("✅ Firebase Admin SDK déjà initialisé")
            _firebase_initialized = True
            return True
        
        # Chemin du fichier de credentials
        cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH', '/app/backend/firebase-credentials.json')
        
        # Vérifier si le fichier existe
        if not Path(cred_path).exists():
            logger.warning(
                f"⚠️  Firebase credentials file not found at {cred_path}. "
                "Mobile push notifications will not work. "
                "See README_FIREBASE_PUSH.md for setup instructions."
            )
            return False
        
        # Initialiser Firebase
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        
        logger.info("✅ Firebase Admin SDK initialisé avec succès")
        _firebase_initialized = True
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur initialisation Firebase: {e}")
        return False


async def send_push_notification(
    fcm_token: str,
    title: str,
    body: str,
    data: dict = None
) -> dict:
    """
    Envoie une notification push mobile via Firebase Cloud Messaging.
    
    Args:
        fcm_token: Token FCM de l'appareil mobile
        title: Titre de la notification
        body: Corps du message
        data: Données supplémentaires (optionnel)
    
    Returns:
        dict: {"success": bool, "message_id": str ou "error": str}
    """
    if not _firebase_initialized:
        logger.warning("Firebase not initialized, cannot send push notification")
        return {"success": False, "error": "Firebase not initialized"}
    
    try:
        # Construire le message
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body
            ),
            data=data or {},
            token=fcm_token,
            # Options Android
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    sound='default',
                    channel_id='jam_connexion_notifications'
                )
            ),
            # Options iOS (APNs)
            apns=messaging.APNSConfig(
                headers={'apns-priority': '10'},
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound='default',
                        badge=1
                    )
                )
            )
        )
        
        # Envoyer
        response = messaging.send(message)
        logger.info(f"✅ Push notification sent successfully: {response}")
        
        return {"success": True, "message_id": response}
        
    except messaging.UnregisteredError:
        logger.warning(f"Token FCM invalide ou expiré: {fcm_token[:20]}...")
        return {"success": False, "error": "unregistered_token"}
        
    except Exception as e:
        logger.error(f"❌ Erreur envoi push notification: {e}")
        return {"success": False, "error": str(e)}


async def send_push_to_multiple(
    fcm_tokens: list,
    title: str,
    body: str,
    data: dict = None
) -> dict:
    """
    Envoie une notification push à plusieurs appareils.
    
    Args:
        fcm_tokens: Liste de tokens FCM
        title: Titre de la notification
        body: Corps du message
        data: Données supplémentaires
    
    Returns:
        dict: {"success": bool, "success_count": int, "failure_count": int}
    """
    if not _firebase_initialized:
        return {"success": False, "error": "Firebase not initialized"}
    
    try:
        # Construire le message multicast
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body
            ),
            data=data or {},
            tokens=fcm_tokens,
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    sound='default'
                )
            ),
            apns=messaging.APNSConfig(
                headers={'apns-priority': '10'},
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(sound='default')
                )
            )
        )
        
        # Envoyer
        response = messaging.send_multicast(message)
        
        logger.info(
            f"✅ Multicast push sent: {response.success_count}/{len(fcm_tokens)} succeeded, "
            f"{response.failure_count} failed"
        )
        
        return {
            "success": True,
            "success_count": response.success_count,
            "failure_count": response.failure_count,
            "responses": [
                {
                    "success": resp.success,
                    "message_id": resp.message_id if resp.success else None,
                    "error": str(resp.exception) if not resp.success else None
                }
                for resp in response.responses
            ]
        }
        
    except Exception as e:
        logger.error(f"❌ Erreur envoi multicast: {e}")
        return {"success": False, "error": str(e)}


def is_firebase_initialized() -> bool:
    """Retourne True si Firebase est initialisé."""
    return _firebase_initialized
