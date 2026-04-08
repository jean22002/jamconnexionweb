from fastapi import APIRouter, HTTPException, Depends, Request, Response
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import logging

from models import UserRegister, UserLogin, UserResponse, TokenResponse
from utils import hash_password, verify_password, create_token, get_current_user
from utils.email import send_welcome_email, send_verification_email, send_account_activated_email
from middleware.rate_limit import limiter
from routes.audit import log_action  # Import audit logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

@router.post("/register", response_model=TokenResponse)
@limiter.limit("5/hour")
async def register(request: Request, data: UserRegister):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Adresse email déjà existante")
    
    if data.role not in ["musician", "venue", "melomane"]:
        raise HTTPException(status_code=400, detail="Le rôle doit être 'musician', 'venue' ou 'melomane'")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Générer un token de vérification unique
    verification_token = str(uuid.uuid4())
    verification_expires = (datetime.now(timezone.utc) + timedelta(hours=48)).isoformat()
    
    trial_end = None
    subscription_status = None
    if data.role == "venue":
        trial_end = (datetime.now(timezone.utc) + timedelta(days=60)).isoformat()
        subscription_status = "trial"
    
    user_doc = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "role": data.role,
        "created_at": now,
        "subscription_status": subscription_status,
        "trial_end": trial_end,
        "email_verified": False,
        "verification_token": verification_token,
        "verification_token_expires": verification_expires,
        "verification_resend_count": 0,
        "verification_last_resend": None
    }
    
    await db.users.insert_one(user_doc)
    
    # Audit log: User registration
    await log_action(
        user_id=user_id,
        user_role=data.role,
        action="register",
        resource_type="user",
        resource_id=user_id,
        details={"email": data.email, "name": data.name},
        request=request,
        status="success"
    )
    
    # Créer automatiquement le profil correspondant au rôle
    if data.role == "musician":
        # Auto-activate PRO for all new musicians
        pro_start = datetime.now(timezone.utc)
        pro_end = pro_start + timedelta(days=365)
        
        musician_profile = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "pseudo": data.name,
            "instruments": [],
            "music_styles": [],
            "created_at": now,
            "subscription_tier": "pro",
            "subscription_status": "active",
            "subscription_started": pro_start.isoformat(),
            "subscription_expires": pro_end.isoformat(),
            "is_pro": True,
            "pro_subscription_status": "active"
        }
        await db.musicians.insert_one(musician_profile)
    elif data.role == "melomane":
        melomane_profile = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "pseudo": data.name,
            "favorite_styles": [],
            "created_at": now
        }
        await db.melomanes.insert_one(melomane_profile)
    
    token = create_token(user_id, data.email, data.role)
    
    # Envoyer l'email de vérification (non-bloquant)
    try:
        await send_verification_email(data.name, data.email, verification_token)
    except Exception as e:
        # Ne pas bloquer l'inscription si l'email échoue
        logger.error(f"Failed to send verification email to {data.email}: {str(e)}")
    
    return TokenResponse(
        token=token,
        user=UserResponse(
            id=user_id, email=data.email, name=data.name, role=data.role,
            created_at=now, subscription_status=subscription_status, trial_end=trial_end
        )
    )

@router.post("/login")
@limiter.limit("10/5minutes")
async def login(request: Request, response: Response, data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    
    if not user:
        logger.warning(f"Login attempt for non-existent email: {data.email}")
        await log_action(
            user_id=data.email,
            user_role="unknown",
            action="login",
            resource_type="auth",
            details={"email": data.email, "reason": "user_not_found"},
            request=request,
            status="failed"
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Vérifier le mot de passe
    password_valid = verify_password(data.password, user["password"])
    logger.info(f"Password verification for {data.email}: {password_valid}")
    
    if not password_valid:
        logger.warning(f"Invalid password for {data.email}")
        await log_action(
            user_id=data.email,
            user_role="unknown",
            action="login",
            resource_type="auth",
            details={"email": data.email, "reason": "invalid_password"},
            request=request,
            status="failed"
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Vérifier si l'email est vérifié (seulement pour les nouveaux comptes)
    # Les anciens comptes (email_verified == null) peuvent se connecter
    email_verified = user.get("email_verified")
    if email_verified is not None and not email_verified:
        raise HTTPException(
            status_code=403, 
            detail="Veuillez vérifier votre email avant de vous connecter. Consultez votre boîte mail."
        )
    
    # Audit log: Successful login
    await log_action(
        user_id=user["id"],
        user_role=user["role"],
        action="login",
        resource_type="auth",
        request=request,
        status="success"
    )
    
    token = create_token(user["id"], user["email"], user["role"])
    
    # Set httpOnly cookie for security
    is_production = os.environ.get('ENVIRONMENT') == 'production'
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=is_production,  # HTTPS only in production
        samesite="lax",
        max_age=3600 * 24 * 7,  # 7 days
        path="/"
    )
    
    # Return user info without token (token is in httpOnly cookie)
    return {
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name", user["email"]),
            "role": user["role"],
            "created_at": user["created_at"].isoformat() if isinstance(user["created_at"], datetime) else user["created_at"],
            "subscription_status": user.get("subscription_status"),
            "trial_end": user.get("trial_end").isoformat() if isinstance(user.get("trial_end"), datetime) else user.get("trial_end")
        }
    }


@router.post("/logout")
async def logout(response: Response):
    """Logout - Delete httpOnly cookie"""
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Déconnexion réussie"}

@router.get("/me", response_model=UserResponse)
async def get_me(request: Request, current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"], email=current_user["email"], name=current_user.get("name", current_user["email"]),
        role=current_user["role"], 
        created_at=current_user["created_at"].isoformat() if isinstance(current_user["created_at"], datetime) else current_user["created_at"],
        subscription_status=current_user.get("subscription_status"),
        trial_end=current_user.get("trial_end").isoformat() if isinstance(current_user.get("trial_end"), datetime) else current_user.get("trial_end")
    )

@router.post("/logout")
async def logout(response: Response):
    """Logout - Delete httpOnly cookie"""
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Déconnexion réussie"}


@router.get("/verify-email")
async def verify_email(token: str):
    """
    Vérifie l'email d'un utilisateur via le token de vérification
    """
    user = await db.users.find_one({"verification_token": token}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="Token de vérification invalide")
    
    # Vérifier si le token est expiré
    expires = datetime.fromisoformat(user["verification_token_expires"])
    if expires < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=400, 
            detail="Le lien de vérification a expiré. Demandez un nouveau lien."
        )
    
    # Vérifier si déjà vérifié
    if user.get("email_verified", False):
        return {"message": "Email déjà vérifié", "already_verified": True}
    
    # Marquer l'email comme vérifié
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "email_verified": True,
                "verification_token": None,
                "verification_token_expires": None
            }
        }
    )
    
    # Envoyer l'email de confirmation d'activation
    try:
        await send_account_activated_email(user.get("name", ""), user["email"])
    except Exception as e:
        logger.error(f"Failed to send activation email to {user['email']}: {str(e)}")
    
    return {"message": "Email vérifié avec succès !", "email": user["email"]}


@router.post("/resend-verification")
@limiter.limit("3/day")
async def resend_verification(request: Request, email: str):
    """
    Renvoie l'email de vérification (limité à 3 par jour)
    """
    user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Vérifier si déjà vérifié
    if user.get("email_verified", False):
        raise HTTPException(status_code=400, detail="Email déjà vérifié")
    
    # Vérifier le nombre de renvois aujourd'hui
    resend_count = user.get("verification_resend_count", 0)
    last_resend = user.get("verification_last_resend")
    
    if last_resend:
        last_resend_date = datetime.fromisoformat(last_resend).date()
        today = datetime.now(timezone.utc).date()
        
        # Reset le compteur si c'est un nouveau jour
        if last_resend_date < today:
            resend_count = 0
    
    if resend_count >= 3:
        raise HTTPException(
            status_code=429, 
            detail="Vous avez atteint la limite de 3 renvois par jour. Réessayez demain."
        )
    
    # Générer un nouveau token
    new_token = str(uuid.uuid4())
    new_expires = (datetime.now(timezone.utc) + timedelta(hours=48)).isoformat()
    
    # Mettre à jour l'utilisateur
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "verification_token": new_token,
                "verification_token_expires": new_expires,
                "verification_resend_count": resend_count + 1,
                "verification_last_resend": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Envoyer le nouvel email
    try:
        await send_verification_email(user.get("name", ""), user["email"], new_token)
    except Exception as e:
        logger.error(f"Failed to resend verification email to {user['email']}: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'envoi de l'email")
    
    return {"message": "Email de vérification renvoyé avec succès"}

