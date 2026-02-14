"""
Auto-moderation system - Automatic actions based on reports
"""
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone, timedelta
import logging

logger = logging.getLogger(__name__)

# Configuration des seuils
AUTO_SUSPEND_THRESHOLD = 3  # Nombre de signalements résolus avant suspension auto
FIRST_SUSPENSION_DAYS = 7
SECOND_SUSPENSION_DAYS = 30
PERMANENT_BAN_AFTER = 3  # Nombre de suspensions avant ban permanent


async def check_auto_moderation(db: AsyncIOMotorDatabase, user_id: str):
    """
    Vérifie si un utilisateur doit être automatiquement modéré
    basé sur le nombre de signalements résolus contre lui.
    
    Retourne un dict avec les actions prises, ou None si aucune action
    """
    try:
        # Compter les signalements résolus contre cet utilisateur
        resolved_reports_count = await db.reports.count_documents({
            "reported_user_id": user_id,
            "status": "resolved"
        })
        
        if resolved_reports_count < AUTO_SUSPEND_THRESHOLD:
            return None
        
        # Récupérer l'utilisateur
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            return None
        
        # Vérifier l'historique des suspensions
        suspension_history = user.get("suspension_history", [])
        suspension_count = len(suspension_history)
        
        # Déterminer l'action à prendre
        action = None
        duration_days = None
        reason = f"Suspension automatique : {resolved_reports_count} signalements résolus"
        
        if suspension_count == 0:
            # Première suspension : 7 jours
            action = "suspend"
            duration_days = FIRST_SUSPENSION_DAYS
        elif suspension_count == 1:
            # Deuxième suspension : 30 jours
            action = "suspend"
            duration_days = SECOND_SUSPENSION_DAYS
        elif suspension_count >= 2:
            # Troisième suspension et plus : bannissement permanent
            action = "permanent_ban"
            duration_days = None
            reason = f"Bannissement permanent : {resolved_reports_count} signalements résolus et {suspension_count} suspensions"
        
        # Vérifier si déjà suspendu
        if user.get("is_suspended") and not user.get("is_permanently_banned"):
            logger.info(f"User {user_id} already suspended, skipping auto-moderation")
            return None
        
        if user.get("is_permanently_banned"):
            logger.info(f"User {user_id} already permanently banned")
            return None
        
        # Appliquer l'action
        if action == "suspend":
            suspended_until = datetime.now(timezone.utc) + timedelta(days=duration_days)
            
            # Ajouter à l'historique
            suspension_entry = {
                "suspended_at": datetime.now(timezone.utc).isoformat(),
                "suspended_until": suspended_until.isoformat(),
                "duration_days": duration_days,
                "reason": reason,
                "type": "automatic"
            }
            
            await db.users.update_one(
                {"id": user_id},
                {
                    "$set": {
                        "is_suspended": True,
                        "suspended_until": suspended_until.isoformat(),
                        "suspension_reason": reason
                    },
                    "$push": {"suspension_history": suspension_entry}
                }
            )
            
            logger.info(f"Auto-suspended user {user_id} for {duration_days} days")
            
            return {
                "action": "suspended",
                "duration_days": duration_days,
                "suspended_until": suspended_until.isoformat(),
                "reason": reason,
                "suspension_number": suspension_count + 1
            }
            
        elif action == "permanent_ban":
            # Bannissement permanent
            ban_entry = {
                "banned_at": datetime.now(timezone.utc).isoformat(),
                "reason": reason,
                "type": "automatic"
            }
            
            await db.users.update_one(
                {"id": user_id},
                {
                    "$set": {
                        "is_suspended": True,
                        "is_permanently_banned": True,
                        "suspended_until": None,
                        "suspension_reason": reason
                    },
                    "$push": {"suspension_history": ban_entry}
                }
            )
            
            logger.info(f"Permanently banned user {user_id}")
            
            return {
                "action": "permanently_banned",
                "reason": reason,
                "suspension_count": suspension_count
            }
        
        return None
        
    except Exception as e:
        logger.error(f"Error in auto-moderation check for user {user_id}: {e}")
        return None


async def send_suspension_notification(db: AsyncIOMotorDatabase, user_id: str, action_result: dict):
    """
    Envoie une notification (email + app) à l'utilisateur suspendu
    """
    try:
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            return
        
        # Notification dans l'app
        notification_doc = {
            "id": str(__import__("uuid").uuid4()),
            "user_id": user_id,
            "type": "suspension" if action_result["action"] == "suspended" else "permanent_ban",
            "title": "Suspension de compte" if action_result["action"] == "suspended" else "Bannissement permanent",
            "message": action_result["reason"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "read": False,
            "data": action_result
        }
        
        await db.notifications.insert_one(notification_doc)
        
        # Email de notification
        try:
            from utils.email import send_email
            
            if action_result["action"] == "suspended":
                subject = "⚠️ Votre compte Jam Connexion a été suspendu"
                body = f"""
                <h2>Suspension de compte</h2>
                
                <p>Bonjour {user['name']},</p>
                
                <p>Votre compte Jam Connexion a été suspendu automatiquement.</p>
                
                <h3>Détails de la suspension</h3>
                <ul>
                    <li><strong>Raison:</strong> {action_result['reason']}</li>
                    <li><strong>Durée:</strong> {action_result['duration_days']} jours</li>
                    <li><strong>Fin de suspension:</strong> {datetime.fromisoformat(action_result['suspended_until']).strftime('%d/%m/%Y à %H:%M')}</li>
                    <li><strong>Nombre de suspensions:</strong> {action_result['suspension_number']}</li>
                </ul>
                
                <p><strong>⚠️ Attention:</strong> Une nouvelle violation du règlement pourrait entraîner un bannissement permanent.</p>
                
                <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter notre équipe de support.</p>
                
                <p>Cordialement,<br>L'équipe Jam Connexion</p>
                """
            else:  # permanent_ban
                subject = "🚫 Votre compte Jam Connexion a été banni définitivement"
                body = f"""
                <h2>Bannissement permanent</h2>
                
                <p>Bonjour {user['name']},</p>
                
                <p>Votre compte Jam Connexion a été banni définitivement.</p>
                
                <h3>Raison</h3>
                <p>{action_result['reason']}</p>
                
                <p>Ce bannissement est permanent et votre compte ne peut plus être réactivé.</p>
                
                <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter notre équipe de support.</p>
                
                <p>Cordialement,<br>L'équipe Jam Connexion</p>
                """
            
            await send_email(
                to_email=user["email"],
                subject=subject,
                body=body
            )
            
            logger.info(f"Suspension notification sent to {user['email']}")
            
        except Exception as e:
            logger.error(f"Error sending suspension email: {e}")
        
    except Exception as e:
        logger.error(f"Error sending suspension notification: {e}")
