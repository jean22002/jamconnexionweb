from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import jwt
import os
import logging

from models.badge import Badge, UserBadge, BadgeResponse, UserStatsResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/badges", tags=["badges"])

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

# Définition des badges par défaut
DEFAULT_BADGES = [
    # Badges Musiciens
    {
        "id": "musician_first_event",
        "name": "Premier Concert",
        "description": "A participé à son premier événement",
        "icon": "🎸",
        "category": "musician",
        "tier": "bronze",
        "requirement_type": "event_participation",
        "requirement_value": 1,
        "points": 50,
        "is_secret": False,
        "unlock_message": "Félicitations ! Vous avez participé à votre premier événement !"
    },
    {
        "id": "musician_5_events",
        "name": "Artiste Confirmé",
        "description": "A participé à 5 événements",
        "icon": "🎭",
        "category": "musician",
        "tier": "silver",
        "requirement_type": "event_participation",
        "requirement_value": 5,
        "points": 200,
        "is_secret": False,
        "unlock_message": "Impressionnant ! Vous êtes un artiste confirmé !"
    },
    {
        "id": "musician_10_events",
        "name": "Performer Pro",
        "description": "A participé à 10 événements",
        "icon": "⭐",
        "category": "musician",
        "tier": "gold",
        "requirement_type": "event_participation",
        "requirement_value": 10,
        "points": 500,
        "is_secret": False,
        "unlock_message": "Extraordinaire ! Vous êtes un vrai professionnel !"
    },
    {
        "id": "musician_5_friends",
        "name": "Réseau Musical",
        "description": "A 5 amis musiciens",
        "icon": "🤝",
        "category": "musician",
        "tier": "bronze",
        "requirement_type": "friend_count",
        "requirement_value": 5,
        "points": 100,
        "is_secret": False,
        "unlock_message": "Vous commencez à construire votre réseau !"
    },
    {
        "id": "musician_20_friends",
        "name": "Connecteur",
        "description": "A 20 amis musiciens",
        "icon": "👥",
        "category": "musician",
        "tier": "gold",
        "requirement_type": "friend_count",
        "requirement_value": 20,
        "points": 300,
        "is_secret": False,
        "unlock_message": "Votre réseau est impressionnant !"
    },
    
    # Badges Établissements
    {
        "id": "venue_first_event",
        "name": "Premier Événement",
        "description": "A organisé son premier événement",
        "icon": "🎪",
        "category": "venue",
        "tier": "bronze",
        "requirement_type": "event_created",
        "requirement_value": 1,
        "points": 50,
        "is_secret": False,
        "unlock_message": "Bravo ! Votre premier événement est créé !"
    },
    {
        "id": "venue_10_events",
        "name": "Organisateur Actif",
        "description": "A organisé 10 événements",
        "icon": "🎉",
        "category": "venue",
        "tier": "silver",
        "requirement_type": "event_created",
        "requirement_value": 10,
        "points": 250,
        "is_secret": False,
        "unlock_message": "Vous êtes un organisateur actif !"
    },
    {
        "id": "venue_50_events",
        "name": "Scène Légendaire",
        "description": "A organisé 50 événements",
        "icon": "🏆",
        "category": "venue",
        "tier": "legendary",
        "requirement_type": "event_created",
        "requirement_value": 50,
        "points": 1000,
        "is_secret": False,
        "unlock_message": "Votre établissement est une légende !"
    },
    {
        "id": "venue_10_subscribers",
        "name": "Populaire",
        "description": "A 10 abonnés",
        "icon": "📢",
        "category": "venue",
        "tier": "bronze",
        "requirement_type": "subscriber_count",
        "requirement_value": 10,
        "points": 150,
        "is_secret": False,
        "unlock_message": "Votre établissement devient populaire !"
    },
    
    # Badges Mélomanes
    {
        "id": "melomane_first_event",
        "name": "Premier Concert",
        "description": "A assisté à son premier événement",
        "icon": "🎵",
        "category": "melomane",
        "tier": "bronze",
        "requirement_type": "event_attendance",
        "requirement_value": 1,
        "points": 50,
        "is_secret": False,
        "unlock_message": "Bienvenue dans la communauté musicale !"
    },
    {
        "id": "melomane_10_events",
        "name": "Fan Assidu",
        "description": "A assisté à 10 événements",
        "icon": "🎶",
        "category": "melomane",
        "tier": "silver",
        "requirement_type": "event_attendance",
        "requirement_value": 10,
        "points": 200,
        "is_secret": False,
        "unlock_message": "Vous êtes un vrai passionné !"
    },
    {
        "id": "melomane_5_venues",
        "name": "Explorateur",
        "description": "A visité 5 établissements différents",
        "icon": "🗺️",
        "category": "melomane",
        "tier": "silver",
        "requirement_type": "venue_visit",
        "requirement_value": 5,
        "points": 150,
        "is_secret": False,
        "unlock_message": "Vous explorez la scène musicale !"
    },
    
    # Badges Universels
    {
        "id": "early_adopter",
        "name": "Pionnier",
        "description": "Membre depuis le début",
        "icon": "🌟",
        "category": "universal",
        "tier": "platinum",
        "requirement_type": "account_age",
        "requirement_value": 1,
        "points": 500,
        "is_secret": True,
        "unlock_message": "Merci d'être un membre fondateur !"
    }
]

@router.post("/initialize")
async def initialize_badges(current_user: dict = Depends(get_current_user)):
    """Initialize default badges (admin only - for now open to all for testing)"""
    try:
        # Vérifier si les badges existent déjà
        existing_count = await db.badges.count_documents({})
        if existing_count > 0:
            return {"message": f"{existing_count} badges already exist", "initialized": False}
        
        # Insérer les badges par défaut
        badges_to_insert = []
        for badge_data in DEFAULT_BADGES:
            badge_doc = {
                **badge_data,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            badges_to_insert.append(badge_doc)
        
        if badges_to_insert:
            await db.badges.insert_many(badges_to_insert)
        
        return {"message": f"{len(badges_to_insert)} badges initialized successfully", "initialized": True}
    except Exception as e:
        logger.error(f"Error initializing badges: {e}")
        raise HTTPException(status_code=500, detail=f"Error initializing badges: {str(e)}")

@router.get("/all", response_model=List[BadgeResponse])
async def get_all_badges(current_user: dict = Depends(get_current_user)):
    """Get all badges with unlock status for current user"""
    try:
        # Récupérer tous les badges
        all_badges = await db.badges.find({}, {"_id": 0}).to_list(100)
        
        # Récupérer les badges débloqués par l'utilisateur
        user_badges = await db.user_badges.find(
            {"user_id": current_user["id"]},
            {"_id": 0}
        ).to_list(100)
        
        unlocked_badge_ids = {ub["badge_id"]: ub for ub in user_badges}
        
        # Construire la réponse avec le statut de déverrouillage
        response = []
        for badge in all_badges:
            # Filtrer les badges selon la catégorie de l'utilisateur
            if badge["category"] not in [current_user["role"], "universal"]:
                continue
            
            is_unlocked = badge["id"] in unlocked_badge_ids
            user_badge_data = unlocked_badge_ids.get(badge["id"], {})
            
            # Calculer la progression actuelle
            progress = await calculate_badge_progress(current_user, badge)
            progress_percentage = (progress / badge["requirement_value"]) * 100 if badge["requirement_value"] > 0 else 0
            
            badge_response = BadgeResponse(
                **badge,
                unlocked=is_unlocked,
                unlocked_at=user_badge_data.get("unlocked_at"),
                progress=progress,
                progress_percentage=min(100, progress_percentage)
            )
            response.append(badge_response)
        
        return response
    except Exception as e:
        logger.error(f"Error fetching badges: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching badges: {str(e)}")

@router.get("/my-badges", response_model=List[BadgeResponse])
async def get_my_badges(current_user: dict = Depends(get_current_user)):
    """Get only unlocked badges for current user"""
    try:
        # Récupérer les badges débloqués
        user_badges = await db.user_badges.find(
            {"user_id": current_user["id"]},
            {"_id": 0}
        ).to_list(100)
        
        response = []
        for ub in user_badges:
            badge = await db.badges.find_one({"id": ub["badge_id"]}, {"_id": 0})
            if badge:
                badge_response = BadgeResponse(
                    **badge,
                    unlocked=True,
                    unlocked_at=ub["unlocked_at"],
                    progress=badge["requirement_value"],
                    progress_percentage=100.0
                )
                response.append(badge_response)
        
        # Trier par date de déverrouillage (plus récent en premier)
        response.sort(key=lambda x: x.unlocked_at or "", reverse=True)
        return response
    except Exception as e:
        logger.error(f"Error fetching user badges: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching user badges: {str(e)}")

@router.get("/stats", response_model=UserStatsResponse)
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    """Get gamification stats for current user"""
    try:
        # Compter les badges par tier
        user_badges = await db.user_badges.find(
            {"user_id": current_user["id"]},
            {"_id": 0, "badge_id": 1}
        ).to_list(100)
        
        badges_by_tier = {"bronze": 0, "silver": 0, "gold": 0, "platinum": 0, "legendary": 0}
        total_points = 0
        
        for ub in user_badges:
            badge = await db.badges.find_one({"id": ub["badge_id"]}, {"_id": 0})
            if badge:
                badges_by_tier[badge["tier"]] += 1
                total_points += badge["points"]
        
        # Calculer le niveau basé sur les points
        level = calculate_level(total_points)
        next_level_points = calculate_points_for_level(level + 1)
        current_level_points = calculate_points_for_level(level)
        level_progress = ((total_points - current_level_points) / (next_level_points - current_level_points)) * 100
        
        return UserStatsResponse(
            user_id=current_user["id"],
            total_points=total_points,
            badges_count=len(user_badges),
            badges_by_tier=badges_by_tier,
            level=level,
            level_progress=level_progress,
            next_level_points=next_level_points
        )
    except Exception as e:
        logger.error(f"Error fetching user stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching user stats: {str(e)}")

@router.post("/check")
async def check_and_award_badges(current_user: dict = Depends(get_current_user)):
    """Check and award badges based on current user activity"""
    try:
        newly_unlocked = []
        
        # Récupérer tous les badges disponibles pour l'utilisateur
        all_badges = await db.badges.find({
            "category": {"$in": [current_user["role"], "universal"]}
        }, {"_id": 0}).to_list(100)
        
        for badge in all_badges:
            # Vérifier si le badge est déjà débloqué
            existing = await db.user_badges.find_one({
                "user_id": current_user["id"],
                "badge_id": badge["id"]
            })
            
            if existing:
                continue
            
            # Vérifier si l'utilisateur mérite le badge
            if await check_badge_eligibility(current_user, badge):
                # Attribuer le badge
                user_badge_doc = {
                    "id": str(uuid.uuid4()),
                    "user_id": current_user["id"],
                    "badge_id": badge["id"],
                    "unlocked_at": datetime.now(timezone.utc).isoformat(),
                    "progress": badge["requirement_value"]
                }
                await db.user_badges.insert_one(user_badge_doc)
                newly_unlocked.append(badge)
                
                # Créer une notification
                await create_badge_notification(current_user["id"], badge)
        
        return {
            "message": f"{len(newly_unlocked)} nouveaux badges débloqués",
            "newly_unlocked": [{"id": b["id"], "name": b["name"], "icon": b["icon"]} for b in newly_unlocked]
        }
    except Exception as e:
        logger.error(f"Error checking badges: {e}")
        raise HTTPException(status_code=500, detail=f"Error checking badges: {str(e)}")

# ===== Fonctions utilitaires =====

async def calculate_badge_progress(user: dict, badge: dict) -> int:
    """Calculate current progress for a badge"""
    try:
        req_type = badge["requirement_type"]
        
        if req_type == "event_participation":
            # Pour les musiciens
            count = await db.event_participations.count_documents({
                "participant_id": user["id"],
                "participant_type": "musician"
            })
            return count
        
        elif req_type == "event_attendance":
            # Pour les mélomanes
            count = await db.event_participations.count_documents({
                "participant_id": user["id"],
                "participant_type": "melomane"
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
            return jams_count + concerts_count
        
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
            
            unique_venues = set(p["venue_id"] for p in participations)
            return len(unique_venues)
        
        elif req_type == "account_age":
            # Vérifier l'âge du compte (en jours)
            created_at = datetime.fromisoformat(user["created_at"])
            days_old = (datetime.now(timezone.utc) - created_at).days
            return days_old
        
        return 0
    except Exception as e:
        logger.error(f"Error calculating progress: {e}")
        return 0

async def check_badge_eligibility(user: dict, badge: dict) -> bool:
    """Check if user is eligible for a badge"""
    progress = await calculate_badge_progress(user, badge)
    return progress >= badge["requirement_value"]

def calculate_level(points: int) -> int:
    """Calculate level based on total points (exponential curve)"""
    # Niveau 1: 0 points, Niveau 2: 100, Niveau 3: 250, etc.
    level = 1
    required = 0
    while points >= required:
        level += 1
        required = calculate_points_for_level(level)
    return level - 1

def calculate_points_for_level(level: int) -> int:
    """Calculate points required for a specific level"""
    if level <= 1:
        return 0
    # Formule exponentielle : points = 100 * (level - 1)^1.5
    return int(100 * ((level - 1) ** 1.5))

async def create_badge_notification(user_id: str, badge: dict):
    """Create a notification for badge unlock"""
    try:
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
            from routes.push_notifications import send_push_notification
            await send_push_notification(
                user_id=user_id,
                notification_data={
                    "title": f"🏆 Badge débloqué !",
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
            logger.error(f"Error sending push notification for badge: {push_error}")
    except Exception as e:
        logger.error(f"Error creating badge notification: {e}")
