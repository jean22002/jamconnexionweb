"""
Reports router - Handles profile reporting for inappropriate behavior
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List
import uuid
from datetime import datetime, timezone
import jwt
import os
import logging

from models.report import ReportCreate, ReportResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])

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


# Liste des raisons de signalement valides
VALID_REPORT_REASONS = [
    "Comportement inapproprié / Harcèlement",
    "Contenu offensant / Langage inapproprié",
    "Faux profil / Usurpation d'identité",
    "Spam / Publicité non sollicitée",
    "Non-respect du règlement",
    "Contenu illégal",
    "Autre"
]


async def check_user_interaction(reporter_user_id: str, reported_user_id: str, reported_profile_type: str) -> bool:
    """
    Vérifie si l'utilisateur a interagi avec le profil signalé
    (amis, participations communes, abonnements, messages, etc.)
    """
    try:
        # Vérifier les relations d'amitié
        friendship = await db.friends.find_one({
            "$or": [
                {"user1_id": reporter_user_id, "user2_id": reported_user_id},
                {"user1_id": reported_user_id, "user2_id": reporter_user_id}
            ],
            "status": "accepted"
        })
        if friendship:
            return True
        
        # Vérifier les abonnements aux établissements
        if reported_profile_type == "venue":
            reported_venue = await db.venues.find_one({"user_id": reported_user_id}, {"_id": 0})
            if reported_venue:
                subscription = await db.venue_subscriptions.find_one({
                    "subscriber_id": reporter_user_id,
                    "venue_id": reported_venue["id"]
                })
                if subscription:
                    return True
        
        # Vérifier les participations communes aux événements
        reporter_participations = await db.event_participations.find(
            {"participant_id": reporter_user_id},
            {"_id": 0, "event_id": 1}
        ).to_list(1000)
        
        reported_participations = await db.event_participations.find(
            {"participant_id": reported_user_id},
            {"_id": 0, "event_id": 1}
        ).to_list(1000)
        
        reporter_event_ids = {p["event_id"] for p in reporter_participations}
        reported_event_ids = {p["event_id"] for p in reported_participations}
        
        if reporter_event_ids & reported_event_ids:  # Intersection non vide
            return True
        
        # Vérifier les messages échangés
        message = await db.messages.find_one({
            "$or": [
                {"sender_id": reporter_user_id, "receiver_id": reported_user_id},
                {"sender_id": reported_user_id, "receiver_id": reporter_user_id}
            ]
        })
        if message:
            return True
        
        return False
        
    except Exception as e:
        logger.error(f"Error checking user interaction: {e}")
        return False


async def send_report_email(report_data: dict):
    """
    Envoie un email à l'administrateur pour notifier d'un nouveau signalement
    """
    try:
        from utils.email import send_email
        
        admin_email = os.environ.get('ADMIN_EMAIL', 'admin@jamconnexion.com')
        
        subject = f"🚨 Nouveau Signalement - {report_data['reported_profile_name']}"
        
        body = f"""
        <h2>Nouveau Signalement de Profil</h2>
        
        <h3>Profil Signalé</h3>
        <ul>
            <li><strong>Nom:</strong> {report_data['reported_profile_name']}</li>
            <li><strong>Type:</strong> {report_data['reported_profile_type']}</li>
            <li><strong>Email:</strong> {report_data['reported_user_email']}</li>
            <li><strong>ID Utilisateur:</strong> {report_data['reported_user_id']}</li>
        </ul>
        
        <h3>Signalement par</h3>
        <ul>
            <li><strong>Email:</strong> {report_data['reporter_email']}</li>
            <li><strong>ID Utilisateur:</strong> {report_data['reporter_user_id']}</li>
        </ul>
        
        <h3>Détails du Signalement</h3>
        <ul>
            <li><strong>Raison:</strong> {report_data['reason']}</li>
            <li><strong>Détails:</strong> {report_data.get('details', 'Aucun détail fourni')}</li>
            <li><strong>Date:</strong> {report_data['created_at']}</li>
        </ul>
        
        <p><strong>ID du Signalement:</strong> {report_data['id']}</p>
        
        <p>Veuillez examiner ce signalement et prendre les mesures appropriées.</p>
        """
        
        await send_email(
            to_email=admin_email,
            subject=subject,
            body=body
        )
        logger.info(f"Report email sent to admin for report {report_data['id']}")
        
    except Exception as e:
        logger.error(f"Error sending report email: {e}")
        # Ne pas faire échouer la création du signalement si l'email échoue


@router.post("/", response_model=ReportResponse)
async def create_report(
    report: ReportCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Créer un signalement de profil
    
    Restrictions:
    - L'utilisateur doit avoir interagi avec le profil signalé
    - Un seul signalement par utilisateur par profil
    """
    try:
        # Validation de la raison
        if report.reason not in VALID_REPORT_REASONS:
            raise HTTPException(
                status_code=400,
                detail=f"Raison invalide. Raisons valides: {', '.join(VALID_REPORT_REASONS)}"
            )
        
        # Vérifier que l'utilisateur ne se signale pas lui-même
        if current_user["id"] == report.reported_user_id:
            raise HTTPException(
                status_code=400,
                detail="Vous ne pouvez pas signaler votre propre profil"
            )
        
        # Récupérer les informations de l'utilisateur signalé
        reported_user = await db.users.find_one({"id": report.reported_user_id}, {"_id": 0})
        if not reported_user:
            raise HTTPException(status_code=404, detail="Utilisateur signalé non trouvé")
        
        # Vérifier le type de profil
        if report.reported_profile_type not in ["musician", "venue", "melomane"]:
            raise HTTPException(
                status_code=400,
                detail="Type de profil invalide. Types valides: musician, venue, melomane"
            )
        
        # Récupérer le nom du profil signalé
        reported_profile_name = reported_user["name"]
        if report.reported_profile_type == "musician":
            musician_profile = await db.musicians.find_one(
                {"user_id": report.reported_user_id},
                {"_id": 0, "pseudo": 1}
            )
            if musician_profile:
                reported_profile_name = musician_profile.get("pseudo", reported_user["name"])
        elif report.reported_profile_type == "venue":
            venue_profile = await db.venues.find_one(
                {"user_id": report.reported_user_id},
                {"_id": 0, "name": 1}
            )
            if venue_profile:
                reported_profile_name = venue_profile.get("name", reported_user["name"])
        elif report.reported_profile_type == "melomane":
            melomane_profile = await db.melomanes.find_one(
                {"user_id": report.reported_user_id},
                {"_id": 0, "pseudo": 1}
            )
            if melomane_profile:
                reported_profile_name = melomane_profile.get("pseudo", reported_user["name"])
        
        # Vérifier que l'utilisateur a interagi avec le profil signalé
        has_interaction = await check_user_interaction(
            current_user["id"],
            report.reported_user_id,
            report.reported_profile_type
        )
        
        if not has_interaction:
            raise HTTPException(
                status_code=403,
                detail="Vous devez avoir interagi avec ce profil pour pouvoir le signaler (ami, participation commune, abonnement, message)"
            )
        
        # Vérifier si l'utilisateur a déjà signalé ce profil
        existing_report = await db.reports.find_one({
            "reporter_user_id": current_user["id"],
            "reported_user_id": report.reported_user_id
        })
        
        if existing_report:
            raise HTTPException(
                status_code=400,
                detail="Vous avez déjà signalé ce profil"
            )
        
        # Créer le signalement
        report_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        report_doc = {
            "id": report_id,
            "reporter_user_id": current_user["id"],
            "reporter_email": current_user["email"],
            "reported_user_id": report.reported_user_id,
            "reported_user_email": reported_user["email"],
            "reported_profile_type": report.reported_profile_type,
            "reported_profile_name": reported_profile_name,
            "reason": report.reason,
            "details": report.details,
            "status": "pending",
            "created_at": now,
            "reviewed_at": None,
            "admin_notes": None
        }
        
        await db.reports.insert_one(report_doc)
        
        # Envoyer l'email à l'administrateur
        await send_report_email(report_doc)
        
        logger.info(f"Report created: {report_id} by user {current_user['id']} against user {report.reported_user_id}")
        
        return ReportResponse(**report_doc)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating report: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création du signalement: {str(e)}")


@router.get("/my-reports", response_model=List[ReportResponse])
async def get_my_reports(current_user: dict = Depends(get_current_user)):
    """
    Récupérer tous les signalements créés par l'utilisateur actuel
    """
    try:
        reports = await db.reports.find(
            {"reporter_user_id": current_user["id"]},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        return [ReportResponse(**report) for report in reports]
        
    except Exception as e:
        logger.error(f"Error fetching user reports: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")



# ==================== ADMIN ROUTES ====================

# Helper function for admin authentication
async def get_admin_user(authorization: str = Header(None)):
    """Vérifie que l'utilisateur est un administrateur"""
    user = await get_current_user(authorization)
    
    # Vérifier si l'utilisateur a le rôle admin
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    return user


@router.get("/admin/all", response_model=List[ReportResponse])
async def get_all_reports_admin(
    status: str = None,
    reason: str = None,
    profile_type: str = None,
    limit: int = 100,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Récupérer tous les signalements (Admin uniquement)
    
    Filtres optionnels:
    - status: pending, reviewed, resolved, dismissed
    - reason: raison du signalement
    - profile_type: musician, venue, melomane
    - limit: nombre max de résultats (défaut: 100)
    """
    try:
        # Construire le filtre
        filter_query = {}
        
        if status:
            filter_query["status"] = status
        
        if reason:
            filter_query["reason"] = reason
        
        if profile_type:
            filter_query["reported_profile_type"] = profile_type
        
        # Récupérer les signalements
        reports = await db.reports.find(
            filter_query,
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return [ReportResponse(**report) for report in reports]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching all reports: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")


@router.get("/admin/stats")
async def get_reports_statistics(admin_user: dict = Depends(get_admin_user)):
    """
    Récupérer les statistiques des signalements (Admin uniquement)
    """
    try:
        # Total des signalements
        total_reports = await db.reports.count_documents({})
        
        # Signalements par statut
        pending_count = await db.reports.count_documents({"status": "pending"})
        reviewed_count = await db.reports.count_documents({"status": "reviewed"})
        resolved_count = await db.reports.count_documents({"status": "resolved"})
        dismissed_count = await db.reports.count_documents({"status": "dismissed"})
        
        # Signalements par raison (agrégation)
        reasons_pipeline = [
            {"$group": {"_id": "$reason", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        reasons_stats = await db.reports.aggregate(reasons_pipeline).to_list(100)
        
        # Signalements par type de profil
        profile_types_pipeline = [
            {"$group": {"_id": "$reported_profile_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        profile_types_stats = await db.reports.aggregate(profile_types_pipeline).to_list(100)
        
        # Top utilisateurs signalés
        top_reported_pipeline = [
            {"$group": {
                "_id": "$reported_user_id",
                "count": {"$sum": 1},
                "email": {"$first": "$reported_user_email"},
                "name": {"$first": "$reported_profile_name"}
            }},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        top_reported = await db.reports.aggregate(top_reported_pipeline).to_list(10)
        
        # Signalements des 7 derniers jours
        seven_days_ago = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        seven_days_ago = seven_days_ago.replace(day=seven_days_ago.day - 7).isoformat()
        
        recent_reports = await db.reports.count_documents({
            "created_at": {"$gte": seven_days_ago}
        })
        
        return {
            "total_reports": total_reports,
            "by_status": {
                "pending": pending_count,
                "reviewed": reviewed_count,
                "resolved": resolved_count,
                "dismissed": dismissed_count
            },
            "by_reason": [{"reason": item["_id"], "count": item["count"]} for item in reasons_stats],
            "by_profile_type": [{"type": item["_id"], "count": item["count"]} for item in profile_types_stats],
            "top_reported_users": [
                {
                    "user_id": item["_id"],
                    "email": item["email"],
                    "name": item["name"],
                    "count": item["count"]
                }
                for item in top_reported
            ],
            "recent_reports_7_days": recent_reports
        }
        
    except Exception as e:
        logger.error(f"Error fetching reports statistics: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")


@router.patch("/admin/{report_id}/status")
async def update_report_status(
    report_id: str,
    status: str,
    admin_notes: str = None,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Mettre à jour le statut d'un signalement (Admin uniquement)
    
    Statuts valides: pending, reviewed, resolved, dismissed
    """
    try:
        valid_statuses = ["pending", "reviewed", "resolved", "dismissed"]
        
        if status not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Statut invalide. Statuts valides: {', '.join(valid_statuses)}"
            )
        
        # Vérifier que le signalement existe
        report = await db.reports.find_one({"id": report_id}, {"_id": 0})
        if not report:
            raise HTTPException(status_code=404, detail="Signalement non trouvé")
        
        # Mettre à jour le signalement
        update_data = {
            "status": status,
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }
        
        if admin_notes:
            update_data["admin_notes"] = admin_notes
        
        await db.reports.update_one(
            {"id": report_id},
            {"$set": update_data}
        )
        
        logger.info(f"Report {report_id} status updated to {status} by admin {admin_user['id']}")
        
        # Récupérer le signalement mis à jour
        updated_report = await db.reports.find_one({"id": report_id}, {"_id": 0})
        
        return ReportResponse(**updated_report)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating report status: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")


@router.post("/admin/suspend-user/{user_id}")
async def suspend_user(
    user_id: str,
    duration_days: int = 7,
    reason: str = None,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Suspendre un utilisateur (Admin uniquement)
    
    Args:
    - user_id: ID de l'utilisateur à suspendre
    - duration_days: Durée de suspension en jours (défaut: 7)
    - reason: Raison de la suspension
    """
    try:
        # Vérifier que l'utilisateur existe
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
        # Calculer la date de fin de suspension
        suspended_until = datetime.now(timezone.utc)
        suspended_until = suspended_until.replace(day=suspended_until.day + duration_days)
        
        # Mettre à jour l'utilisateur
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "is_suspended": True,
                "suspended_until": suspended_until.isoformat(),
                "suspension_reason": reason or "Violation du règlement"
            }}
        )
        
        logger.info(f"User {user_id} suspended by admin {admin_user['id']} until {suspended_until}")
        
        return {
            "message": "Utilisateur suspendu avec succès",
            "user_id": user_id,
            "suspended_until": suspended_until.isoformat(),
            "duration_days": duration_days
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error suspending user: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")


@router.post("/admin/unsuspend-user/{user_id}")
async def unsuspend_user(
    user_id: str,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Lever la suspension d'un utilisateur (Admin uniquement)
    """
    try:
        # Vérifier que l'utilisateur existe
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
        # Mettre à jour l'utilisateur
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "is_suspended": False,
                "suspended_until": None,
                "suspension_reason": None
            }}
        )
        
        logger.info(f"User {user_id} unsuspended by admin {admin_user['id']}")
        
        return {
            "message": "Suspension levée avec succès",
            "user_id": user_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unsuspending user: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")



@router.get("/admin/user/{user_id}/history")
async def get_user_history(
    user_id: str,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Récupérer l'historique complet d'un utilisateur (Admin uniquement)
    
    Inclut:
    - Informations du profil
    - Signalements reçus
    - Événements créés/participations
    - Messages envoyés (aperçu)
    - Amitiés
    - Statut de suspension
    """
    try:
        # Récupérer l'utilisateur
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
        # Récupérer le profil spécifique selon le role
        profile = None
        if user["role"] == "musician":
            profile = await db.musicians.find_one({"user_id": user_id}, {"_id": 0})
        elif user["role"] == "venue":
            profile = await db.venues.find_one({"user_id": user_id}, {"_id": 0})
        elif user["role"] == "melomane":
            profile = await db.melomanes.find_one({"user_id": user_id}, {"_id": 0})
        
        # Récupérer les signalements reçus
        reports_received = await db.reports.find(
            {"reported_user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(50)
        
        # Récupérer les signalements créés
        reports_created = await db.reports.find(
            {"reporter_user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(50)
        
        # Récupérer les événements (créés si venue, participations si musician/melomane)
        events_data = {"created": [], "participated": []}
        
        if user["role"] == "venue":
            venue_profile = await db.venues.find_one({"user_id": user_id}, {"_id": 0})
            if venue_profile:
                events_created = await db.events.find(
                    {"venue_id": venue_profile["id"]},
                    {"_id": 0}
                ).sort("date", -1).limit(20).to_list(20)
                events_data["created"] = events_created
        
        # Participations aux événements
        participations = await db.event_participations.find(
            {"participant_id": user_id},
            {"_id": 0}
        ).to_list(100)
        
        # Récupérer les détails des événements participés
        event_ids = [p["event_id"] for p in participations[:20]]
        if event_ids:
            events_participated = await db.events.find(
                {"id": {"$in": event_ids}},
                {"_id": 0}
            ).to_list(20)
            events_data["participated"] = events_participated
        
        # Récupérer les amitiés
        friends = await db.friends.find(
            {
                "$or": [
                    {"user1_id": user_id},
                    {"user2_id": user_id}
                ],
                "status": "accepted"
            },
            {"_id": 0}
        ).to_list(100)
        
        # Récupérer un aperçu des messages (nombre total)
        messages_sent_count = await db.messages.count_documents({"sender_id": user_id})
        messages_received_count = await db.messages.count_documents({"receiver_id": user_id})
        
        # Récupérer les derniers messages
        recent_messages = await db.messages.find(
            {
                "$or": [
                    {"sender_id": user_id},
                    {"receiver_id": user_id}
                ]
            },
            {"_id": 0, "id": 1, "sender_id": 1, "receiver_id": 1, "timestamp": 1, "content": 1}
        ).sort("timestamp", -1).limit(10).to_list(10)
        
        # Récupérer les badges
        badges = await db.user_badges.find(
            {"user_id": user_id},
            {"_id": 0}
        ).to_list(100)
        
        # Récupérer les avis donnés/reçus
        reviews_given = await db.reviews.find(
            {"reviewer_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(20).to_list(20)
        
        reviews_received_count = 0
        if user["role"] == "venue":
            venue_profile = await db.venues.find_one({"user_id": user_id}, {"_id": 0})
            if venue_profile:
                reviews_received_count = await db.reviews.count_documents({"venue_id": venue_profile["id"]})
        
        return {
            "user": user,
            "profile": profile,
            "reports": {
                "received": reports_received,
                "created": reports_created,
                "received_count": len(reports_received),
                "created_count": len(reports_created)
            },
            "events": {
                "created": events_data["created"],
                "participated": events_data["participated"],
                "created_count": len(events_data["created"]),
                "participated_count": len(participations)
            },
            "social": {
                "friends_count": len(friends),
                "friends": friends[:20]  # Limiter à 20 pour l'affichage
            },
            "messages": {
                "sent_count": messages_sent_count,
                "received_count": messages_received_count,
                "recent": recent_messages
            },
            "badges": badges,
            "reviews": {
                "given": reviews_given,
                "given_count": len(reviews_given),
                "received_count": reviews_received_count
            },
            "suspension_status": {
                "is_suspended": user.get("is_suspended", False),
                "suspended_until": user.get("suspended_until"),
                "suspension_reason": user.get("suspension_reason")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user history: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")
