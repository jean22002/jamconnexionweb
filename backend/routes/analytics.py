"""
Analytics router - Platform analytics and metrics for admin dashboard
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from datetime import datetime, timezone, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])

# MongoDB database (will be injected)
db = None

def set_db(database):
    global db
    db = database

# Import auth helper from reports router
import jwt
import os

JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret')
JWT_ALGORITHM = "HS256"

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

async def get_admin_user(authorization: str = Header(None)):
    """Vérifie que l'utilisateur est un administrateur"""
    user = await get_current_user(authorization)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    return user


@router.get("/overview")
async def get_analytics_overview(
    period: str = "7d",  # 7d, 30d, 90d, 1y
    admin_user: dict = Depends(get_admin_user)
):
    """
    Vue d'ensemble des analytics de la plateforme
    """
    try:
        # Calculer la date de début selon la période
        now = datetime.now(timezone.utc)
        
        if period == "7d":
            start_date = now - timedelta(days=7)
        elif period == "30d":
            start_date = now - timedelta(days=30)
        elif period == "90d":
            start_date = now - timedelta(days=90)
        elif period == "1y":
            start_date = now - timedelta(days=365)
        else:
            start_date = now - timedelta(days=7)
        
        start_date_iso = start_date.isoformat()
        
        # === MÉTRIQUES UTILISATEURS ===
        total_users = await db.users.count_documents({})
        new_users = await db.users.count_documents({
            "created_at": {"$gte": start_date_iso}
        })
        
        # Utilisateurs par rôle
        musicians_count = await db.users.count_documents({"role": "musician"})
        venues_count = await db.users.count_documents({"role": "venue"})
        melomanes_count = await db.users.count_documents({"role": "melomane"})
        
        # Utilisateurs actifs (qui ont fait une action dans la période)
        active_users_events = await db.event_participations.distinct("participant_id", {
            "joined_at": {"$gte": start_date_iso}
        })
        active_users_messages = await db.messages.distinct("sender_id", {
            "timestamp": {"$gte": start_date_iso}
        })
        active_users = len(set(active_users_events + active_users_messages))
        
        # === MÉTRIQUES ÉVÉNEMENTS ===
        total_events = await db.events.count_documents({})
        new_events = await db.events.count_documents({
            "created_at": {"$gte": start_date_iso}
        })
        
        # Événements par type
        events_by_type = await db.events.aggregate([
            {"$group": {"_id": "$type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]).to_list(100)
        
        # Participations aux événements
        total_participations = await db.event_participations.count_documents({})
        new_participations = await db.event_participations.count_documents({
            "joined_at": {"$gte": start_date_iso}
        })
        
        # === MÉTRIQUES SOCIALES ===
        total_friendships = await db.friends.count_documents({"status": "accepted"})
        new_friendships = await db.friends.count_documents({
            "status": "accepted",
            "created_at": {"$gte": start_date_iso}
        })
        
        total_messages = await db.messages.count_documents({})
        new_messages = await db.messages.count_documents({
            "timestamp": {"$gte": start_date_iso}
        })
        
        # === MÉTRIQUES BADGES ===
        total_badges_unlocked = await db.user_badges.count_documents({})
        new_badges_unlocked = await db.user_badges.count_documents({
            "unlocked_at": {"$gte": start_date_iso}
        })
        
        # Badges les plus débloqués
        top_badges = await db.user_badges.aggregate([
            {"$group": {"_id": "$badge_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]).to_list(10)
        
        # === MÉTRIQUES MODÉRATION ===
        total_reports = await db.reports.count_documents({})
        new_reports = await db.reports.count_documents({
            "created_at": {"$gte": start_date_iso}
        })
        
        pending_reports = await db.reports.count_documents({"status": "pending"})
        resolved_reports = await db.reports.count_documents({"status": "resolved"})
        
        # Taux de résolution
        resolution_rate = (resolved_reports / total_reports * 100) if total_reports > 0 else 0
        
        # Utilisateurs suspendus
        suspended_users = await db.users.count_documents({"is_suspended": True})
        permanently_banned = await db.users.count_documents({"is_permanently_banned": True})
        
        return {
            "period": period,
            "start_date": start_date_iso,
            "end_date": now.isoformat(),
            "users": {
                "total": total_users,
                "new": new_users,
                "active": active_users,
                "by_role": {
                    "musicians": musicians_count,
                    "venues": venues_count,
                    "melomanes": melomanes_count
                }
            },
            "events": {
                "total": total_events,
                "new": new_events,
                "participations": {
                    "total": total_participations,
                    "new": new_participations
                },
                "by_type": [{"type": item["_id"], "count": item["count"]} for item in events_by_type]
            },
            "social": {
                "friendships": {
                    "total": total_friendships,
                    "new": new_friendships
                },
                "messages": {
                    "total": total_messages,
                    "new": new_messages
                }
            },
            "gamification": {
                "badges_unlocked": {
                    "total": total_badges_unlocked,
                    "new": new_badges_unlocked
                },
                "top_badges": [{"badge_id": item["_id"], "count": item["count"]} for item in top_badges]
            },
            "moderation": {
                "reports": {
                    "total": total_reports,
                    "new": new_reports,
                    "pending": pending_reports,
                    "resolved": resolved_reports,
                    "resolution_rate": round(resolution_rate, 2)
                },
                "suspended_users": suspended_users,
                "permanently_banned": permanently_banned
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching analytics overview: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")


@router.get("/timeseries")
async def get_timeseries_data(
    metric: str,  # users, events, participations, messages, reports
    period: str = "7d",
    admin_user: dict = Depends(get_admin_user)
):
    """
    Données de série temporelle pour graphiques
    """
    try:
        now = datetime.now(timezone.utc)
        
        # Déterminer le nombre de points de données et l'intervalle
        if period == "7d":
            days = 7
            interval_hours = 24
        elif period == "30d":
            days = 30
            interval_hours = 24
        elif period == "90d":
            days = 90
            interval_hours = 24 * 7  # Points hebdomadaires
        elif period == "1y":
            days = 365
            interval_hours = 24 * 30  # Points mensuels
        else:
            days = 7
            interval_hours = 24
        
        start_date = now - timedelta(days=days)
        
        # Générer les buckets de temps
        time_buckets = []
        current = start_date
        while current <= now:
            time_buckets.append(current)
            current += timedelta(hours=interval_hours)
        
        # Sélectionner la collection appropriée
        collection_map = {
            "users": "users",
            "events": "events",
            "participations": "event_participations",
            "messages": "messages",
            "reports": "reports",
            "friendships": "friends"
        }
        
        date_field_map = {
            "users": "created_at",
            "events": "created_at",
            "participations": "joined_at",
            "messages": "timestamp",
            "reports": "created_at",
            "friendships": "created_at"
        }
        
        if metric not in collection_map:
            raise HTTPException(status_code=400, detail=f"Métrique invalide: {metric}")
        
        collection_name = collection_map[metric]
        date_field = date_field_map[metric]
        collection = db[collection_name]
        
        # Compter les documents pour chaque bucket
        data_points = []
        for i in range(len(time_buckets) - 1):
            bucket_start = time_buckets[i].isoformat()
            bucket_end = time_buckets[i + 1].isoformat()
            
            count = await collection.count_documents({
                date_field: {
                    "$gte": bucket_start,
                    "$lt": bucket_end
                }
            })
            
            data_points.append({
                "date": time_buckets[i].isoformat(),
                "value": count
            })
        
        return {
            "metric": metric,
            "period": period,
            "data": data_points
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching timeseries data: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")


@router.get("/engagement")
async def get_engagement_metrics(
    admin_user: dict = Depends(get_admin_user)
):
    """
    Métriques d'engagement détaillées
    """
    try:
        # Événements les plus populaires
        popular_events = await db.events.aggregate([
            {
                "$lookup": {
                    "from": "event_participations",
                    "localField": "id",
                    "foreignField": "event_id",
                    "as": "participations"
                }
            },
            {
                "$addFields": {
                    "participation_count": {"$size": "$participations"}
                }
            },
            {
                "$sort": {"participation_count": -1}
            },
            {
                "$limit": 10
            },
            {
                "$project": {
                    "_id": 0,
                    "id": 1,
                    "title": 1,
                    "type": 1,
                    "date": 1,
                    "participation_count": 1
                }
            }
        ]).to_list(10)
        
        # Utilisateurs les plus actifs (par nombre de participations)
        most_active_users = await db.event_participations.aggregate([
            {
                "$group": {
                    "_id": "$participant_id",
                    "participation_count": {"$sum": 1}
                }
            },
            {
                "$sort": {"participation_count": -1}
            },
            {
                "$limit": 10
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "_id",
                    "foreignField": "id",
                    "as": "user"
                }
            },
            {
                "$unwind": "$user"
            },
            {
                "$project": {
                    "_id": 0,
                    "user_id": "$_id",
                    "name": "$user.name",
                    "email": "$user.email",
                    "role": "$user.role",
                    "participation_count": 1
                }
            }
        ]).to_list(10)
        
        # Taux de conversion (inscriptions -> participations)
        total_users = await db.users.count_documents({})
        users_with_participations = len(await db.event_participations.distinct("participant_id"))
        conversion_rate = (users_with_participations / total_users * 100) if total_users > 0 else 0
        
        # Moyenne de participations par utilisateur
        total_participations = await db.event_participations.count_documents({})
        avg_participations = (total_participations / total_users) if total_users > 0 else 0
        
        return {
            "popular_events": popular_events,
            "most_active_users": most_active_users,
            "conversion_rate": round(conversion_rate, 2),
            "avg_participations_per_user": round(avg_participations, 2)
        }
        
    except Exception as e:
        logger.error(f"Error fetching engagement metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")
