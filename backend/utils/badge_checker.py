"""
Utilitaire pour la vérification automatique des badges
Ce module est appelé après les actions clés pour attribuer automatiquement les badges
"""
import logging
from typing import Optional
import aiohttp

logger = logging.getLogger(__name__)

async def trigger_badge_check(user_id: str, token: str):
    """
    Déclenche une vérification des badges pour un utilisateur
    Cette fonction est appelée après des actions importantes (événement, ami ajouté, etc.)
    
    Args:
        user_id: ID de l'utilisateur
        token: Token JWT de l'utilisateur
    """
    try:
        # Appel à l'endpoint de vérification des badges
        async with aiohttp.ClientSession() as session:
            async with session.post(
                'http://localhost:8001/api/badges/check',
                headers={'Authorization': f'Bearer {token}'}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    newly_unlocked = data.get('newly_unlocked', [])
                    if newly_unlocked:
                        logger.info(f"User {user_id} unlocked {len(newly_unlocked)} new badges")
                    return newly_unlocked
                else:
                    logger.warning(f"Badge check failed for user {user_id}: {response.status}")
                    return []
    except Exception as e:
        logger.error(f"Error triggering badge check for user {user_id}: {e}")
        return []


async def check_and_award_badges_internal(db, user_id: str) -> list:
    """
    Version interne qui vérifie et attribue les badges directement
    Utilisée quand on a déjà accès à la DB et qu'on n'a pas de token
    
    Args:
        db: Instance de la base de données MongoDB
        user_id: ID de l'utilisateur
        
    Returns:
        Liste des badges nouvellement débloqués
    """
    try:
        from datetime import datetime, timezone
        import uuid
        
        # Récupérer l'utilisateur
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            return []
        
        newly_unlocked = []
        
        # Récupérer tous les badges disponibles pour l'utilisateur
        all_badges = await db.badges.find({
            "category": {"$in": [user["role"], "universal"]}
        }, {"_id": 0}).to_list(100)
        
        for badge in all_badges:
            # Vérifier si le badge est déjà débloqué
            existing = await db.user_badges.find_one({
                "user_id": user_id,
                "badge_id": badge["id"]
            })
            
            if existing:
                continue
            
            # Vérifier si l'utilisateur mérite le badge
            progress = await calculate_badge_progress(db, user, badge)
            if progress >= badge["requirement_value"]:
                # Attribuer le badge
                user_badge_doc = {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "badge_id": badge["id"],
                    "unlocked_at": datetime.now(timezone.utc).isoformat(),
                    "progress": badge["requirement_value"]
                }
                await db.user_badges.insert_one(user_badge_doc)
                newly_unlocked.append(badge)
                
                # Créer une notification
                await create_badge_notification_internal(db, user_id, badge)
        
        if newly_unlocked:
            logger.info(f"User {user_id} unlocked {len(newly_unlocked)} new badges")
        
        return newly_unlocked
    except Exception as e:
        logger.error(f"Error checking badges internally for user {user_id}: {e}")
        return []


async def calculate_badge_progress(db, user: dict, badge: dict) -> int:
    """Calculate current progress for a badge"""
    try:
        req_type = badge["requirement_type"]
        
        if req_type == "event_participation":
            # Pour les musiciens
            count = await db.event_participations.count_documents({
                "participant_id": user["id"],
                "participant_type": "musician",
                "active": True
            })
            return count
        
        elif req_type == "event_attendance":
            # Pour les mélomanes
            count = await db.event_participations.count_documents({
                "participant_id": user["id"],
                "participant_type": "melomane",
                "active": True
            })
            return count
        
        elif req_type == "friend_count":
            # Compter les amis
            count = await db.friends.count_documents({
                "$or": [{"user1_id": user["id"]}, {"user2_id": user["id"]}],
                "status": "accepted"
            })
            return count
        
        elif req_type == "event_created":
            # Pour les établissements
            venue = await db.venues.find_one({"user_id": user["id"]}, {"_id": 0})
            if not venue:
                return 0
            
            jams_count = await db.jams.count_documents({"venue_id": venue["id"]})
            concerts_count = await db.concerts.count_documents({"venue_id": venue["id"]})
            karaoke_count = await db.karaokes.count_documents({"venue_id": venue["id"]})
            spectacle_count = await db.spectacles.count_documents({"venue_id": venue["id"]})
            return jams_count + concerts_count + karaoke_count + spectacle_count
        
        elif req_type == "subscriber_count":
            # Pour les établissements
            venue = await db.venues.find_one({"user_id": user["id"]}, {"_id": 0})
            if not venue:
                return 0
            
            count = await db.venue_subscriptions.count_documents({"venue_id": venue["id"]})
            return count
        
        elif req_type == "venue_visit":
            # Pour les mélomanes - compter les établissements visités
            participations = await db.event_participations.find({
                "participant_id": user["id"],
                "participant_type": "melomane"
            }, {"_id": 0, "venue_id": 1}).to_list(1000)
            
            unique_venues = set(p.get("venue_id") for p in participations if p.get("venue_id"))
            return len(unique_venues)
        
        elif req_type == "account_age":
            # Vérifier l'âge du compte (en jours)
            created_at = datetime.fromisoformat(user["created_at"].replace('Z', '+00:00'))
            days_old = (datetime.now(timezone.utc) - created_at).days
            return days_old
        
        return 0
    except Exception as e:
        logger.error(f"Error calculating progress: {e}")
        return 0


async def create_badge_notification_internal(db, user_id: str, badge: dict):
    """Create a notification for badge unlock"""
    try:
        from datetime import datetime, timezone
        import uuid
        
        notification_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": "badge_unlocked",
            "title": f"🏆 Badge débloqué : {badge['name']}",
            "message": badge["unlock_message"],
            "data": {
                "badge_id": badge["id"],
                "badge_icon": badge["icon"],
                "badge_name": badge["name"],
                "points": badge["points"]
            },
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification_doc)
        
        # Send push notification
        try:
            # Import dynamique pour éviter les imports circulaires
            import sys
            import os
            sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
            from routes.push_notifications import send_push_notification
            
            await send_push_notification(
                user_id=user_id,
                notification_data={
                    "title": "🏆 Badge débloqué !",
                    "message": f"{badge['icon']} {badge['name']} - {badge['unlock_message']}",
                    "link": "/badges",
                    "type": "badge",
                    "icon": badge["icon"],
                    "data": {
                        "badge_id": badge["id"],
                        "points": badge["points"]
                    }
                }
            )
        except Exception as push_error:
            logger.warning(f"Could not send push notification for badge: {push_error}")
    except Exception as e:
        logger.error(f"Error creating badge notification: {e}")
