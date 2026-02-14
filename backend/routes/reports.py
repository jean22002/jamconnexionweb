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
