from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request, UploadFile, File
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import stripe
import math
import jwt

# Import models from models package
from models import (
    UserRegister, UserLogin, UserResponse, TokenResponse,
    BandInfo, MusicianConcert, MusicianProfile, MusicianProfileResponse,
    FriendRequest, FriendRequestResponse, BandJoinRequest, BandJoinRequestResponse,
    VenueProfile, VenueProfileResponse, VenueSubscription, NearbySearchRequest,
    JamEvent, JamEventResponse, ConcertBand, ConcertEvent, ConcertEventResponse,
    KaraokeEvent, KaraokeEventResponse, SpectacleEvent, SpectacleEventResponse,
    PlanningSlot, PlanningSlotResponse, ConcertApplication, ConcertApplicationResponse,
    ReviewCreate, ReviewResponse, ReviewResponseRequest,
    MessageCreate, MessageResponse,
    CheckoutRequest,
    NotificationResponse,
    ProfitabilityData, ProfitabilityResponse
)

# Import utility functions
from utils import hash_password, verify_password, create_token, geocode_city, haversine_distance, save_upload_file

ROOT_DIR = Path(__file__).parent
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret')
JWT_ALGORITHM = "HS256"

STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
STRIPE_PRICE_ID = os.environ.get('STRIPE_PRICE_ID', 'price_1SpH8aBykagrgoTUBAdOU10z')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')
SUBSCRIPTION_PRICE = 14.99

stripe.api_key = STRIPE_API_KEY

# Create FastAPI app
app = FastAPI(
    title="Jam Connexion API",
    description="API for connecting musicians with venues",
    version="2.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create main API router
api_router = APIRouter(prefix="/api")

# Import and include refactored routers
from routes import auth_router, account_router, uploads_router, payments_router, webhooks_router

# Include refactored routers (these replace old endpoints)
api_router.include_router(auth_router)
api_router.include_router(account_router)
api_router.include_router(uploads_router)
api_router.include_router(payments_router)
api_router.include_router(webhooks_router)

# Helper function needed by legacy routes
async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Adresse email déjà existante")
    
    if data.role not in ["musician", "venue"]:
        raise HTTPException(status_code=400, detail="Le rôle doit être 'musician' ou 'venue'")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
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
        "trial_end": trial_end
    }
    
    await db.users.insert_one(user_doc)
    token = create_token(user_id, data.email, data.role)
    
    return TokenResponse(
        token=token,
        user=UserResponse(
            id=user_id, email=data.email, name=data.name, role=data.role,
            created_at=now, subscription_status=subscription_status, trial_end=trial_end
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["email"], user["role"])
    
    return TokenResponse(
        token=token,
        user=UserResponse(
            id=user["id"], email=user["email"], name=user["name"], role=user["role"],
            created_at=user["created_at"], subscription_status=user.get("subscription_status"),
            trial_end=user.get("trial_end")
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"], email=current_user["email"], name=current_user["name"],
        role=current_user["role"], created_at=current_user["created_at"],
        subscription_status=current_user.get("subscription_status"),
        trial_end=current_user.get("trial_end")
    )

@api_router.post("/account/suspend")
async def suspend_account(current_user: dict = Depends(get_current_user)):
    """Suspend user account for up to 60 days"""
    suspend_until = (datetime.now(timezone.utc) + timedelta(days=60)).isoformat()
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {
            "account_status": "suspended",
            "suspended_until": suspend_until,
            "suspended_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "message": "Compte suspendu avec succès",
        "suspended_until": suspend_until,
        "days": 60
    }

@api_router.delete("/account/delete")
async def delete_account(current_user: dict = Depends(get_current_user)):
    """Permanently delete user account and all associated data"""
    user_id = current_user["id"]
    role = current_user["role"]
    
    if role == "venue":
        # Find venue
        venue = await db.venues.find_one({"user_id": user_id}, {"_id": 0})
        if venue:
            venue_id = venue["id"]
            
            # Delete all venue-related data
            await db.jams.delete_many({"venue_id": venue_id})
            await db.concerts.delete_many({"venue_id": venue_id})
            await db.karaokes.delete_many({"venue_id": venue_id})
            await db.spectacles.delete_many({"venue_id": venue_id})
            await db.planning_slots.delete_many({"venue_id": venue_id})
            await db.applications.delete_many({"venue_id": venue_id})
            await db.reviews.delete_many({"venue_id": venue_id})
            await db.venue_subscriptions.delete_many({"venue_id": venue_id})
            await db.event_participations.delete_many({"venue_id": venue_id})
            
            # Delete venue profile
            await db.venues.delete_one({"user_id": user_id})
    
    elif role == "musician":
        # Find musician
        musician = await db.musicians.find_one({"user_id": user_id}, {"_id": 0})
        if musician:
            musician_id = musician["id"]
            
            # Delete all musician-related data
            await db.applications.delete_many({"musician_id": musician_id})
            await db.event_participations.delete_many({"musician_id": musician_id})
            await db.venue_subscriptions.delete_many({"musician_id": musician_id})
            await db.friend_requests.delete_many({
                "$or": [
                    {"from_user_id": user_id},
                    {"to_user_id": user_id}
                ]
            })
            
            # Delete musician profile
            await db.musicians.delete_one({"user_id": user_id})
    
    # Delete notifications
    await db.notifications.delete_many({"user_id": user_id})
    
    # Delete messages
    await db.messages.delete_many({
        "$or": [
            {"from_user_id": user_id},
            {"to_user_id": user_id}
        ]
    })
    
    # Finally, delete user account
    await db.users.delete_one({"id": user_id})
    
    return {"message": "Compte supprimé définitivement"}

# ============= FILE UPLOAD ROUTES =============

@api_router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    folder: str = "profiles",
    current_user: dict = Depends(get_current_user)
):
    """Upload an image file and return the URL"""
    try:
        url = await save_upload_file(file, folder)
        return {"url": url, "filename": file.filename}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'upload")

@api_router.post("/upload/musician-photo")
async def upload_musician_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload musician profile photo"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can upload musician photos")
    
    url = await save_upload_file(file, "musicians")
    
    # Update musician profile with new photo
    await db.musicians.update_one(
        {"user_id": current_user["id"]},
        {"$set": {"profile_image": url}}
    )
    
    return {"url": url}

@api_router.post("/upload/band-photo")
async def upload_band_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload band photo"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can upload band photos")
    
    url = await save_upload_file(file, "bands")
    
    # Update musician's band photo
    await db.musicians.update_one(
        {"user_id": current_user["id"]},
        {"$set": {"band.photo": url}}
    )
    
    return {"url": url}

@api_router.post("/upload/venue-photo")
async def upload_venue_photo(
    file: UploadFile = File(...),
    photo_type: str = "profile",
    current_user: dict = Depends(get_current_user)
):
    """Upload venue profile or cover photo"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can upload venue photos")
    
    url = await save_upload_file(file, "venues")
    
    # Update venue profile with new photo
    field = "profile_image" if photo_type == "profile" else "cover_image"
    await db.venues.update_one(
        {"user_id": current_user["id"]},
        {"$set": {field: url}}
    )
    
    return {"url": url}

# ============= VENUE GALLERY =============

@api_router.post("/venues/me/gallery")
async def add_gallery_photo(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Add a photo to venue gallery (max 20 photos)"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can manage gallery")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Check gallery limit
    current_gallery = venue.get("gallery", [])
    if len(current_gallery) >= 20:
        raise HTTPException(status_code=400, detail="Limite de 20 photos atteinte. Supprimez des photos avant d'en ajouter.")
    
    # Upload file
    try:
        file_url = await save_upload_file(file, "gallery")
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors du téléchargement")
    
    # Add to gallery
    await db.venues.update_one(
        {"user_id": current_user["id"]},
        {"$push": {"gallery": file_url}}
    )
    
    return {"url": file_url, "message": "Photo ajoutée à la galerie"}

@api_router.delete("/venues/me/gallery")
async def remove_gallery_photo(photo_url: str, current_user: dict = Depends(get_current_user)):
    """Remove a photo from venue gallery"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can manage gallery")
    
    result = await db.venues.update_one(
        {"user_id": current_user["id"]},
        {"$pull": {"gallery": photo_url}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Photo not found in gallery")
    
    return {"message": "Photo supprimée de la galerie"}

# ============= MUSICIAN ROUTES =============

@api_router.post("/musicians", response_model=MusicianProfileResponse)
async def create_musician_profile(data: MusicianProfile, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musician accounts can create musician profiles")
    
    existing = await db.musicians.find_one({"user_id": current_user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Musician profile already exists")
    
    musician_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Add IDs to concerts
    concerts_with_ids = []
    for concert in data.concerts:
        concert_dict = concert.model_dump()
        concert_dict["id"] = str(uuid.uuid4())
        concerts_with_ids.append(concert_dict)
    
    musician_doc = {
        "id": musician_id,
        "user_id": current_user["id"],
        **data.model_dump(),
        "concerts": concerts_with_ids,
        "created_at": now
    }
    
    await db.musicians.insert_one(musician_doc)
    
    friends_count = await db.friends.count_documents({
        "$or": [{"user1_id": current_user["id"]}, {"user2_id": current_user["id"]}],
        "status": "accepted"
    })
    
    return MusicianProfileResponse(**musician_doc, friends_count=friends_count)

@api_router.put("/musicians", response_model=MusicianProfileResponse)
async def update_musician_profile(data: MusicianProfile, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musician accounts can update musician profiles")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Add IDs to new concerts
    concerts_with_ids = []
    for concert in data.concerts:
        concert_dict = concert.model_dump()
        if not concert_dict.get("id"):
            concert_dict["id"] = str(uuid.uuid4())
        concerts_with_ids.append(concert_dict)
    
    update_data = data.model_dump()
    update_data["concerts"] = concerts_with_ids
    
    await db.musicians.update_one(
        {"user_id": current_user["id"]},
        {"$set": update_data}
    )
    
    updated = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    friends_count = await db.friends.count_documents({
        "$or": [{"user1_id": current_user["id"]}, {"user2_id": current_user["id"]}],
        "status": "accepted"
    })
    
    return MusicianProfileResponse(**updated, friends_count=friends_count)

@api_router.get("/musicians/me", response_model=MusicianProfileResponse)
async def get_my_musician_profile(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musician accounts can access this")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    friends_count = await db.friends.count_documents({
        "$or": [{"user1_id": current_user["id"]}, {"user2_id": current_user["id"]}],
        "status": "accepted"
    })
    
    return MusicianProfileResponse(**musician, friends_count=friends_count)

@api_router.get("/musicians", response_model=List[MusicianProfileResponse])
async def list_musicians(instrument: Optional[str] = None, style: Optional[str] = None, city: Optional[str] = None):
    query = {"pseudo": {"$exists": True, "$ne": ""}}  # Ne retourner que les musiciens avec un pseudo valide
    if instrument:
        query["instruments"] = {"$regex": instrument, "$options": "i"}
    if style:
        query["music_styles"] = {"$regex": style, "$options": "i"}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    
    musicians = await db.musicians.find(query, {"_id": 0}).to_list(100)
    result = []
    for m in musicians:
        friends_count = await db.friends.count_documents({
            "$or": [{"user1_id": m["user_id"]}, {"user2_id": m["user_id"]}],
            "status": "accepted"
        })
        try:
            result.append(MusicianProfileResponse(**m, friends_count=friends_count))
        except Exception as e:
            # Skip musicians with invalid data
            logger.warning(f"Skipping musician {m.get('id')} due to validation error: {e}")
            continue
    return result

@api_router.get("/musicians/{musician_id}", response_model=MusicianProfileResponse)
async def get_musician(musician_id: str):
    musician = await db.musicians.find_one({"id": musician_id}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician not found")
    
    friends_count = await db.friends.count_documents({
        "$or": [{"user1_id": musician["user_id"]}, {"user2_id": musician["user_id"]}],
        "status": "accepted"
    })
    
    return MusicianProfileResponse(**musician, friends_count=friends_count)

# ============= BANDS SEARCH =============

@api_router.get("/bands/search")
async def search_bands(query: str = "", limit: int = 10):
    """Rechercher des groupes par nom"""
    if not query or len(query) < 2:
        return []
    
    # Rechercher dans tous les profils de musiciens qui ont des groupes
    musicians = await db.musicians.find({}, {"_id": 0, "bands": 1, "pseudo": 1}).to_list(1000)
    
    all_bands = []
    for musician in musicians:
        if musician.get("bands"):
            for band in musician["bands"]:
                if query.lower() in band.get("name", "").lower():
                    # Ajouter le pseudo du musicien propriétaire
                    band_info = band.copy()
                    band_info["musician_name"] = musician.get("pseudo", "")
                    all_bands.append(band_info)
    
    # Limiter les résultats
    return all_bands[:limit]

# ============= FRIENDS SYSTEM =============

@api_router.post("/friends/request")
async def send_friend_request(data: FriendRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can send friend requests")
    
    if data.to_user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")
    
    # Check if target user exists and is a musician
    target_user = await db.users.find_one({"id": data.to_user_id}, {"_id": 0})
    if not target_user or target_user["role"] != "musician":
        raise HTTPException(status_code=404, detail="Target musician not found")
    
    # Check if already friends or request exists
    existing = await db.friends.find_one({
        "$or": [
            {"user1_id": current_user["id"], "user2_id": data.to_user_id},
            {"user1_id": data.to_user_id, "user2_id": current_user["id"]}
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Friend request already exists or already friends")
    
    request_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Get sender's musician profile for image
    sender_musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    sender_image = sender_musician.get("profile_image") if sender_musician else None
    
    friend_doc = {
        "id": request_id,
        "user1_id": current_user["id"],
        "user1_name": current_user["name"],
        "user1_image": sender_image,
        "user2_id": data.to_user_id,
        "status": "pending",
        "created_at": now
    }
    
    await db.friends.insert_one(friend_doc)
    
    # Create notification for target user
    await create_notification(
        data.to_user_id,
        "friend_request",
        "Nouvelle demande d'ami",
        f"{current_user['name']} vous a envoyé une demande d'ami",
        f"/musician/{sender_musician['id'] if sender_musician else ''}"
    )
    
    return {"message": "Friend request sent", "request_id": request_id}

@api_router.get("/friends/requests")
async def get_friend_requests(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can view friend requests")
    
    requests = await db.friends.find({
        "user2_id": current_user["id"],
        "status": "pending"
    }, {"_id": 0}).to_list(100)
    
    result = []
    for req in requests:
        result.append(FriendRequestResponse(
            id=req["id"],
            from_user_id=req["user1_id"],
            from_user_name=req["user1_name"],
            from_user_image=req.get("user1_image"),
            to_user_id=req["user2_id"],
            status=req["status"],
            created_at=req["created_at"]
        ))
    
    return result

@api_router.get("/friends/sent")
async def get_sent_friend_requests(current_user: dict = Depends(get_current_user)):
    """Get friend requests sent by current user"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can send friend requests")
    
    requests = await db.friends.find({
        "user1_id": current_user["id"],
        "status": "pending"
    }, {"_id": 0}).to_list(100)
    
    result = []
    for req in requests:
        # Get recipient's musician profile
        recipient_musician = await db.musicians.find_one({"user_id": req["user2_id"]}, {"_id": 0})
        if recipient_musician:
            result.append({
                "id": req["id"],
                "to_user_id": req["user2_id"],
                "to_user_name": recipient_musician.get("pseudo", "Musicien"),
                "to_user_image": recipient_musician.get("profile_image"),
                "status": req["status"],
                "created_at": req["created_at"]
            })
    
    return result

@api_router.delete("/friends/cancel/{request_id}")
async def cancel_friend_request(request_id: str, current_user: dict = Depends(get_current_user)):
    """Cancel a pending friend request sent by current user"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can cancel friend requests")
    
    request = await db.friends.find_one({
        "id": request_id,
        "user1_id": current_user["id"],
        "status": "pending"
    }, {"_id": 0})
    
    if not request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    # Delete the request
    await db.friends.delete_one({"id": request_id})
    
    # Delete notification
    await db.notifications.delete_many({
        "user_id": request["user2_id"],
        "type": "friend_request"
    })
    
    return {"message": "Friend request cancelled"}

@api_router.post("/friends/accept/{request_id}")
async def accept_friend_request(request_id: str, current_user: dict = Depends(get_current_user)):
    request = await db.friends.find_one({"id": request_id, "user2_id": current_user["id"]}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    await db.friends.update_one({"id": request_id}, {"$set": {"status": "accepted"}})
    
    # Notify the requester
    await create_notification(
        request["user1_id"],
        "friend_accepted",
        "Demande d'ami acceptée",
        f"{current_user['name']} a accepté votre demande d'ami",
        None
    )
    
    return {"message": "Friend request accepted"}

@api_router.post("/friends/reject/{request_id}")
async def reject_friend_request(request_id: str, current_user: dict = Depends(get_current_user)):
    request = await db.friends.find_one({"id": request_id, "user2_id": current_user["id"]}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    await db.friends.update_one({"id": request_id}, {"$set": {"status": "rejected"}})
    return {"message": "Friend request rejected"}

@api_router.get("/friends")
async def get_friends(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can view friends")
    
    friendships = await db.friends.find({
        "$or": [{"user1_id": current_user["id"]}, {"user2_id": current_user["id"]}],
        "status": "accepted"
    }, {"_id": 0}).to_list(100)
    
    friends = []
    for f in friendships:
        friend_id = f["user2_id"] if f["user1_id"] == current_user["id"] else f["user1_id"]
        musician = await db.musicians.find_one({"user_id": friend_id}, {"_id": 0})
        if musician:
            friends.append({
                "id": musician["id"],
                "user_id": musician["user_id"],
                "pseudo": musician.get("pseudo", ""),
                "profile_image": musician.get("profile_image"),
                "instruments": musician.get("instruments", []),
                "city": musician.get("city")
            })
    
    return friends

@api_router.delete("/friends/{friend_user_id}")
async def remove_friend(friend_user_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.friends.delete_one({
        "$or": [
            {"user1_id": current_user["id"], "user2_id": friend_user_id},
            {"user1_id": friend_user_id, "user2_id": current_user["id"]}
        ],
        "status": "accepted"
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Friendship not found")
    
    return {"message": "Friend removed"}

# ============= VENUE ROUTES =============

@api_router.post("/venues", response_model=VenueProfileResponse)
async def create_venue_profile(data: VenueProfile, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can create venue profiles")
    
    existing = await db.venues.find_one({"user_id": current_user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Venue profile already exists")
    
    venue_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    venue_doc = {
        "id": venue_id,
        "user_id": current_user["id"],
        **data.model_dump(),
        "created_at": now
    }
    
    await db.venues.insert_one(venue_doc)
    
    return VenueProfileResponse(
        **venue_doc,
        subscription_status=current_user.get("subscription_status"),
        subscribers_count=0
    )

@api_router.put("/venues", response_model=VenueProfileResponse)
async def update_venue_profile(data: VenueProfile, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can update venue profiles")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    await db.venues.update_one(
        {"user_id": current_user["id"]},
        {"$set": data.model_dump()}
    )
    
    updated = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    subscribers_count = await db.venue_subscriptions.count_documents({"venue_id": venue["id"]})
    
    # Update the dict
    updated["subscription_status"] = current_user.get("subscription_status")
    updated["subscribers_count"] = subscribers_count
    
    return VenueProfileResponse(**updated)

@api_router.get("/venues/me", response_model=VenueProfileResponse)
async def get_my_venue(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can access this")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    subscribers_count = await db.venue_subscriptions.count_documents({"venue_id": venue["id"]})
    
    # Calculate trial days left and check access
    trial_days_left = None
    subscription_status = current_user.get("subscription_status")
    trial_end = current_user.get("trial_end")
    has_active_subscription = current_user.get("has_active_subscription", False)
    
    # Vérification selon la logique : has_active_subscription OU trial_end
    if has_active_subscription:
        # Abonnement actif : accès OK
        subscription_status = "active"
    elif subscription_status == "trial" and trial_end:
        trial_end_date = datetime.fromisoformat(trial_end)
        now = datetime.now(timezone.utc)
        days_left = (trial_end_date - now).days
        trial_days_left = max(0, days_left)
        
        # Update status to expired if trial ended
        if days_left < 0:
            subscription_status = "expired"
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$set": {"subscription_status": "expired"}}
            )
    
    return VenueProfileResponse(
        **venue,
        subscription_status=subscription_status,
        trial_end=trial_end,
        trial_days_left=trial_days_left,
        subscribers_count=subscribers_count
    )

@api_router.get("/venues/me/subscription-status")
async def check_subscription_status(current_user: dict = Depends(get_current_user)):
    """Check subscription status and days left for venue"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can access this")
    
    subscription_status = current_user.get("subscription_status", "expired")
    trial_end = current_user.get("trial_end")
    
    days_left = 0
    if subscription_status == "trial" and trial_end:
        trial_end_date = datetime.fromisoformat(trial_end)
        now = datetime.now(timezone.utc)
        days_left = (trial_end_date - now).days
        days_left = max(0, days_left)
        
        # Update status if expired
        if days_left <= 0:
            subscription_status = "expired"
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$set": {"subscription_status": "expired"}}
            )
    
    return {
        "status": subscription_status,
        "trial_end": trial_end,
        "days_left": days_left,
        "is_active": subscription_status in ["trial", "active"]
    }

@api_router.get("/venues/me/jams", response_model=List[JamEventResponse])
async def get_my_venue_jams(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can access this")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    jams = await db.jams.find({"venue_id": venue["id"]}, {"_id": 0}).sort("date", 1).to_list(100)
    return [JamEventResponse(**j) for j in jams]

@api_router.get("/venues/me/concerts", response_model=List[ConcertEventResponse])
async def get_my_venue_concerts(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can access this")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    concerts = await db.concerts.find({"venue_id": venue["id"]}, {"_id": 0}).sort("date", 1).to_list(100)
    
    # Add participants count for each concert
    result = []
    for concert in concerts:
        participants_count = await db.event_participations.count_documents({
            "event_id": concert["id"],
            "event_type": "concert"
        })
        result.append(ConcertEventResponse(**concert, participants_count=participants_count))
    
    return result

@api_router.get("/venues", response_model=List[VenueProfileResponse])
async def list_venues(city: Optional[str] = None, style: Optional[str] = None):
    query = {}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if style:
        query["music_styles"] = {"$in": [style]}
    
    venues = await db.venues.find(query, {"_id": 0}).to_list(100)
    
    result = []
    for v in venues:
        user = await db.users.find_one({"id": v["user_id"]}, {"_id": 0})
        user_subscription_status = user.get("subscription_status") if user else None
        if user_subscription_status in ["active", "trial"]:
            subscribers_count = await db.venue_subscriptions.count_documents({"venue_id": v["id"]})
            # Update the dict before creating the response
            v["subscription_status"] = user_subscription_status
            v["subscribers_count"] = subscribers_count
            result.append(VenueProfileResponse(**v))
    
    return result

@api_router.get("/venues/{venue_id}", response_model=VenueProfileResponse)
async def get_venue(venue_id: str):
    venue = await db.venues.find_one({"id": venue_id}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    user = await db.users.find_one({"id": venue["user_id"]}, {"_id": 0})
    user_subscription_status = user.get("subscription_status") if user else None
    subscribers_count = await db.venue_subscriptions.count_documents({"venue_id": venue_id})
    
    # Update the dict before creating the response
    venue["subscription_status"] = user_subscription_status
    venue["subscribers_count"] = subscribers_count
    
    return VenueProfileResponse(**venue)

@api_router.get("/venues/{venue_id}/bands-played")
async def get_bands_played_at_venue(venue_id: str):
    """Get all bands that have played at this venue based on past concerts"""
    venue = await db.venues.find_one({"id": venue_id}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    # Get all past concerts at this venue
    past_concerts = await db.concerts.find(
        {"venue_id": venue_id},
        {"_id": 0}
    ).sort("date", -1).to_list(1000)
    
    # Extract unique band names and get their full info
    bands_info = []
    seen_bands = set()
    
    for concert in past_concerts:
        band_name = concert.get("band_name")
        if band_name and band_name not in seen_bands:
            seen_bands.add(band_name)
            
            # Try to find the band's full profile from musicians
            musician = await db.musicians.find_one(
                {"band.name": band_name},
                {"_id": 0, "band": 1, "user_id": 1, "pseudo": 1}
            )
            
            if musician and musician.get("band"):
                band = musician["band"]
                bands_info.append({
                    "band_name": band_name,
                    "photo": band.get("photo"),
                    "description": band.get("description"),
                    "music_styles": band.get("music_styles", []),
                    "members_count": band.get("members_count"),
                    "facebook": band.get("facebook"),
                    "instagram": band.get("instagram"),
                    "youtube": band.get("youtube"),
                    "website": band.get("website"),
                    "bandcamp": band.get("bandcamp"),
                    "last_played": concert.get("date"),
                    "musician_id": musician.get("user_id")
                })
            else:
                # Band without full profile
                bands_info.append({
                    "band_name": band_name,
                    "photo": None,
                    "description": None,
                    "music_styles": [],
                    "members_count": None,
                    "facebook": None,
                    "instagram": None,
                    "youtube": None,
                    "website": None,
                    "bandcamp": None,
                    "last_played": concert.get("date"),
                    "musician_id": None
                })
    
    return bands_info

@api_router.post("/venues/nearby", response_model=List[VenueProfileResponse])
async def find_nearby_venues(data: NearbySearchRequest):
    all_venues = await db.venues.find({}, {"_id": 0}).to_list(500)
    
    nearby = []
    for v in all_venues:
        distance = haversine_distance(data.latitude, data.longitude, v["latitude"], v["longitude"])
        if distance <= data.radius_km:
            user = await db.users.find_one({"id": v["user_id"]}, {"_id": 0})
            subscription_status = user.get("subscription_status") if user else None
            if subscription_status in ["active", "trial"]:
                subscribers_count = await db.venue_subscriptions.count_documents({"venue_id": v["id"]})
                v["distance_km"] = round(distance, 2)
                v["subscription_status"] = subscription_status
                v["subscribers_count"] = subscribers_count
                nearby.append(VenueProfileResponse(**v))
    
    nearby.sort(key=lambda x: x.model_dump().get("distance_km", 999))
    return nearby

# ============= VENUE SUBSCRIPTION (for musicians to follow venues) =============

@api_router.post("/venues/{venue_id}/subscribe")
async def subscribe_to_venue(venue_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can subscribe to venues")
    
    venue = await db.venues.find_one({"id": venue_id}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    existing = await db.venue_subscriptions.find_one({
        "venue_id": venue_id,
        "user_id": current_user["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already subscribed")
    
    sub_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    sub_doc = {
        "id": sub_id,
        "venue_id": venue_id,
        "user_id": current_user["id"],
        "created_at": now
    }
    
    await db.venue_subscriptions.insert_one(sub_doc)
    return {"message": "Subscribed successfully"}

@api_router.delete("/venues/{venue_id}/subscribe")
async def unsubscribe_from_venue(venue_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.venue_subscriptions.delete_one({
        "venue_id": venue_id,
        "user_id": current_user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    return {"message": "Unsubscribed successfully"}

@api_router.get("/venues/{venue_id}/subscription-status")
async def get_subscription_status(venue_id: str, current_user: dict = Depends(get_current_user)):
    sub = await db.venue_subscriptions.find_one({
        "venue_id": venue_id,
        "user_id": current_user["id"]
    })
    return {"subscribed": sub is not None}

@api_router.get("/my-subscriptions")
async def get_my_subscriptions(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can view subscriptions")
    
    subs = await db.venue_subscriptions.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    
    result = []
    for sub in subs:
        venue = await db.venues.find_one({"id": sub["venue_id"]}, {"_id": 0})
        if venue:
            result.append({
                "venue_id": venue["id"],
                "venue_name": venue["name"],
                "venue_image": venue.get("profile_image"),
                "city": venue["city"]
            })
    
    return result

# ============= JAM EVENTS (Boeuf musical) =============

@api_router.post("/jams", response_model=JamEventResponse)
async def create_jam_event(data: JamEvent, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can create jam events")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Vérifier s'il existe déjà un bœuf à cette date
    existing_jam = await db.jams.find_one({
        "venue_id": venue["id"],
        "date": data.date
    }, {"_id": 0})
    
    if existing_jam:
        raise HTTPException(
            status_code=400, 
            detail=f"Un bœuf est déjà prévu le {data.date}. Vous ne pouvez pas créer deux bœufs le même jour."
        )
    
    jam_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    jam_doc = {
        "id": jam_id,
        "venue_id": venue["id"],
        "venue_name": venue["name"],
        **data.model_dump(),
        "created_at": now
    }
    
    await db.jams.insert_one(jam_doc)
    
    # Notify subscribers
    await notify_venue_subscribers(venue["id"], "jam_event", f"Nouveau boeuf musical chez {venue['name']}", 
                                   f"Le {data.date} de {data.start_time} à {data.end_time}", f"/venue/{venue['id']}")
    
    # NOUVELLE FONCTIONNALITÉ : Alerter les établissements dans un rayon de 100km
    try:
        all_venues = await db.venues.find({}, {"_id": 0}).to_list(1000)
        
        nearby_venues = []
        for other_venue in all_venues:
            if other_venue["id"] == venue["id"]:
                continue
            
            if not other_venue.get("latitude") or not other_venue.get("longitude"):
                continue
            
            if not venue.get("latitude") or not venue.get("longitude"):
                continue
            
            # Calculate distance using Haversine formula
            from math import radians, sin, cos, sqrt, atan2
            
            lat1, lon1 = radians(venue["latitude"]), radians(venue["longitude"])
            lat2, lon2 = radians(other_venue["latitude"]), radians(other_venue["longitude"])
            
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * atan2(sqrt(a), sqrt(1-a))
            distance_km = 6371 * c
            
            if distance_km <= 100:
                nearby_venues.append({
                    "venue": other_venue,
                    "distance_km": round(distance_km, 1)
                })
        
        # Envoyer notification à chaque établissement proche
        for nearby in nearby_venues:
            notification = {
                "id": str(uuid.uuid4()),
                "user_id": nearby["venue"]["user_id"],
                "type": "nearby_jam_alert",
                "title": f"🎵 Bœuf planifié à proximité",
                "message": f"{venue['name']} organise un bœuf le {data.date} de {data.start_time} à {data.end_time} ({nearby['distance_km']}km de chez vous). Pensez à vérifier votre planning !",
                "data": {
                    "jam_id": jam_id,
                    "venue_id": venue["id"],
                    "venue_name": venue["name"],
                    "date": data.date,
                    "start_time": data.start_time,
                    "end_time": data.end_time,
                    "distance_km": nearby["distance_km"]
                },
                "is_read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.notifications.insert_one(notification)
        
        logger.info(f"✅ Alerted {len(nearby_venues)} nearby venues about jam on {data.date}")
    except Exception as e:
        logger.error(f"⚠️ Error alerting nearby venues: {e}")
    
    return JamEventResponse(**jam_doc)

@api_router.get("/jams", response_model=List[JamEventResponse])
async def list_jam_events(venue_id: Optional[str] = None, date_from: Optional[str] = None):
    query = {}
    if venue_id:
        query["venue_id"] = venue_id
    if date_from:
        query["date"] = {"$gte": date_from}
    
    jams = await db.jams.find(query, {"_id": 0}).sort("date", 1).to_list(100)
    
    result = []
    for jam in jams:
        participants_count = await db.event_participations.count_documents({
            "event_id": jam["id"],
            "event_type": "jam",
            "active": True
        })
        result.append(JamEventResponse(**jam, participants_count=participants_count))
    
    return result

@api_router.get("/venues/{venue_id}/jams", response_model=List[JamEventResponse])
async def get_venue_jams(venue_id: str):
    jams = await db.jams.find({"venue_id": venue_id}, {"_id": 0}).sort("date", 1).to_list(100)
    
    result = []
    for jam in jams:
        participants_count = await db.event_participations.count_documents({
            "event_id": jam["id"],
            "event_type": "jam",
            "active": True
        })
        result.append(JamEventResponse(**jam, participants_count=participants_count))
    
    return result

@api_router.delete("/jams/{jam_id}")
async def delete_jam_event(jam_id: str, current_user: dict = Depends(get_current_user)):
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.jams.delete_one({"id": jam_id, "venue_id": venue["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Jam event not found")
    
    return {"message": "Jam event deleted"}

@api_router.put("/jams/{jam_id}", response_model=JamEventResponse)
async def update_jam_event(jam_id: str, data: JamEvent, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can update jam events")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Vérifier que le jam appartient à ce venue
    existing_jam = await db.jams.find_one({"id": jam_id, "venue_id": venue["id"]}, {"_id": 0})
    if not existing_jam:
        raise HTTPException(status_code=404, detail="Jam event not found")
    
    # Mettre à jour le jam
    update_data = {
        **data.model_dump(),
        "venue_name": venue["name"]
    }
    
    await db.jams.update_one(
        {"id": jam_id},
        {"$set": update_data}
    )
    
    # Récupérer le jam mis à jour
    updated_jam = await db.jams.find_one({"id": jam_id}, {"_id": 0})
    return JamEventResponse(**updated_jam)

# ============= EVENT PARTICIPATION (Live Check-in) =============

def is_event_active(event_date: str, start_time: str, end_time: str) -> bool:
    """Check if an event is currently active based on date and time"""
    try:
        now = datetime.now(timezone.utc)
        # Parse event date and times
        event_day = datetime.strptime(event_date, "%Y-%m-%d").date()
        start = datetime.strptime(start_time, "%H:%M").time()
        end = datetime.strptime(end_time, "%H:%M").time()
        
        # Create datetime objects for comparison (assume local time, add 1 hour buffer)
        event_start = datetime.combine(event_day, start).replace(tzinfo=timezone.utc)
        event_end = datetime.combine(event_day, end).replace(tzinfo=timezone.utc)
        
        # Handle events that go past midnight
        if end < start:
            event_end = event_end + timedelta(days=1)
        
        # Add 30 min buffer before and after
        event_start = event_start - timedelta(minutes=30)
        event_end = event_end + timedelta(minutes=30)
        
        return event_start <= now <= event_end
    except Exception as e:
        logger.error(f"Error checking event time: {e}")
        return False

@api_router.get("/venues/{venue_id}/active-events")
async def get_active_events(venue_id: str):
    """Get currently active events at a venue"""
    jams = await db.jams.find({"venue_id": venue_id}, {"_id": 0}).to_list(100)
    
    active_events = []
    for jam in jams:
        if is_event_active(jam["date"], jam["start_time"], jam["end_time"]):
            # Count participants
            participants_count = await db.event_participations.count_documents({
                "event_id": jam["id"],
                "event_type": "jam",
                "active": True
            })
            active_events.append({
                "id": jam["id"],
                "type": "jam",
                "venue_id": venue_id,
                "venue_name": jam["venue_name"],
                "date": jam["date"],
                "start_time": jam["start_time"],
                "end_time": jam["end_time"],
                "music_styles": jam.get("music_styles", []),
                "participants_count": participants_count
            })
    
    return active_events

@api_router.post("/events/{event_id}/join")
async def join_event(event_id: str, event_type: str = "jam", current_user: dict = Depends(get_current_user)):
    """Join an event and notify friends"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can join events")
    
    # Find the event
    if event_type == "jam":
        event = await db.jams.find_one({"id": event_id}, {"_id": 0})
    elif event_type == "concert":
        event = await db.concerts.find_one({"id": event_id}, {"_id": 0})
    else:
        event = await db.concerts.find_one({"id": event_id}, {"_id": 0})
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Allow participation in advance for both concerts and jams
    # Users can register their interest before the event starts
    
    # Get musician profile
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Check if already participating (active)
    existing = await db.event_participations.find_one({
        "event_id": event_id,
        "musician_id": musician["id"],
        "active": True
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already participating in this event")
    
    # Check if there's an inactive participation to reactivate
    inactive_participation = await db.event_participations.find_one({
        "event_id": event_id,
        "musician_id": musician["id"],
        "active": False
    })
    
    now = datetime.now(timezone.utc).isoformat()
    
    if inactive_participation:
        # Reactivate the existing participation
        await db.event_participations.update_one(
            {"id": inactive_participation["id"]},
            {
                "$set": {
                    "active": True,
                    "joined_at": now,
                    "left_at": None
                }
            }
        )
        participation_id = inactive_participation["id"]
    else:
        # Create a new participation record
        participation_id = str(uuid.uuid4())
        
        participation_doc = {
            "id": participation_id,
            "event_id": event_id,
            "event_type": event_type,
            "venue_id": event["venue_id"],
            "venue_name": event["venue_name"],
            "event_date": event["date"],
            "event_start": event.get("start_time", ""),
            "event_end": event.get("end_time", "23:59"),
            "musician_id": musician["id"],
            "musician_user_id": current_user["id"],
            "musician_pseudo": musician.get("pseudo", current_user["name"]),
            "musician_image": musician.get("profile_image"),
            "active": True,
            "joined_at": now
        }
        
        await db.event_participations.insert_one(participation_doc)
    
    # Notify all friends
    friendships = await db.friends.find({
        "$or": [{"user1_id": current_user["id"]}, {"user2_id": current_user["id"]}],
        "status": "accepted"
    }, {"_id": 0}).to_list(100)
    
    for friendship in friendships:
        friend_id = friendship["user2_id"] if friendship["user1_id"] == current_user["id"] else friendship["user1_id"]
        await create_notification(
            friend_id,
            "friend_at_event",
            f"🎵 {musician.get('pseudo', current_user['name'])} est en jam!",
            f"Participe au boeuf musical chez {event['venue_name']}",
            f"/venue/{event['venue_id']}"
        )
    
    return {
        "message": "Joined event successfully",
        "participation_id": participation_id,
        "venue_name": event["venue_name"]
    }

@api_router.post("/events/{event_id}/leave")
async def leave_event(event_id: str, current_user: dict = Depends(get_current_user)):
    """Leave an event (deactivate participation)"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can leave events")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    result = await db.event_participations.update_one(
        {"event_id": event_id, "musician_id": musician["id"], "active": True},
        {"$set": {"active": False, "left_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Si aucune participation active n'a été trouvée, c'est que l'utilisateur a déjà quitté
    # On retourne quand même un succès car le résultat souhaité est atteint
    if result.modified_count == 0:
        # Vérifier si une participation inactive existe déjà
        inactive_participation = await db.event_participations.find_one({
            "event_id": event_id, 
            "musician_id": musician["id"], 
            "active": False
        })
        if inactive_participation:
            return {"message": "Already left this event"}
        else:
            raise HTTPException(status_code=404, detail="Participation not found")
    
    return {"message": "Left event successfully"}

@api_router.get("/events/{event_id}/participants")
async def get_event_participants(event_id: str):
    """Get list of current participants in an event"""
    participants = await db.event_participations.find({
        "event_id": event_id,
        "active": True
    }, {"_id": 0}).to_list(100)
    
    return [{
        "musician_id": p["musician_id"],
        "pseudo": p["musician_pseudo"],
        "profile_image": p.get("musician_image"),
        "joined_at": p["joined_at"]
    } for p in participants]

@api_router.get("/musicians/me/current-participation")
async def get_my_current_participation(current_user: dict = Depends(get_current_user)):
    """Get musician's current active event participation"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can check participation")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        return None
    
    # Find active participation
    participation = await db.event_participations.find_one({
        "musician_id": musician["id"],
        "active": True
    }, {"_id": 0})
    
    if not participation:
        return None
    
    # Check if event is still active (auto-cleanup)
    if not is_event_active(participation["event_date"], participation["event_start"], participation["event_end"]):
        # Event ended, deactivate participation
        await db.event_participations.update_one(
            {"id": participation["id"]},
            {"$set": {"active": False}}
        )
        return None
    
    return participation

@api_router.get("/musicians/me/participations")
async def get_my_participations(current_user: dict = Depends(get_current_user)):
    """Get all musician's active event participations"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can check participation")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        return []
    
    # Find all active participations
    participations = await db.event_participations.find({
        "musician_id": musician["id"],
        "active": True
    }, {"_id": 0}).to_list(100)
    
    return participations

# ============= CONCERT EVENTS =============

@api_router.get("/musicians/{musician_id}/current-participation")
async def get_musician_participation(musician_id: str):
    """Get a musician's current active event participation (public)"""
    musician = await db.musicians.find_one({"id": musician_id}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician not found")
    
    participation = await db.event_participations.find_one({
        "musician_id": musician_id,
        "active": True
    }, {"_id": 0})
    
    if not participation:
        return None
    
    # Check if event is still active
    if not is_event_active(participation["event_date"], participation["event_start"], participation["event_end"]):
        await db.event_participations.update_one(
            {"id": participation["id"]},
            {"$set": {"active": False, "auto_ended": True}}
        )
        return None
    
    return {
        "venue_id": participation["venue_id"],
        "venue_name": participation["venue_name"],
        "event_type": participation["event_type"],
        "joined_at": participation["joined_at"]
    }

# ============= CONCERT EVENTS =============

@api_router.post("/concerts", response_model=ConcertEventResponse)
async def create_concert_event(data: ConcertEvent, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can create concert events")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Vérifier s'il existe déjà un concert à cette date
    existing_concert = await db.concerts.find_one({
        "venue_id": venue["id"],
        "date": data.date
    }, {"_id": 0})
    
    if existing_concert:
        raise HTTPException(
            status_code=400, 
            detail=f"Un concert est déjà prévu le {data.date}. Vous ne pouvez pas créer deux concerts le même jour."
        )
    
    concert_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    concert_doc = {
        "id": concert_id,
        "venue_id": venue["id"],
        "venue_name": venue["name"],
        **data.model_dump(),
        "created_at": now
    }
    
    await db.concerts.insert_one(concert_doc)
    
    # Notify subscribers
    band_names = ", ".join([b.name for b in data.bands]) if data.bands else "TBA"
    await notify_venue_subscribers(venue["id"], "concert_event", f"Nouveau concert chez {venue['name']}", 
                                   f"Le {data.date}: {band_names}", f"/venue/{venue['id']}")
    
    # Notify linked musicians (friends)
    for band in data.bands:
        if band.musician_id:
            musician = await db.musicians.find_one({"id": band.musician_id}, {"_id": 0})
            if musician:
                # Check if they are friends with venue owner
                friendship = await db.friends.find_one({
                    "$or": [
                        {"user1_id": venue["user_id"], "user2_id": musician["user_id"]},
                        {"user1_id": musician["user_id"], "user2_id": venue["user_id"]}
                    ],
                    "status": "accepted"
                })
                if friendship:
                    await create_notification(
                        musician["user_id"], "concert_mention",
                        f"Vous êtes programmé chez {venue['name']}",
                        f"Concert le {data.date}", f"/venue/{venue['id']}"
                    )
    
    return ConcertEventResponse(**concert_doc)

@api_router.get("/concerts", response_model=List[ConcertEventResponse])
async def list_concert_events(venue_id: Optional[str] = None, date_from: Optional[str] = None):
    query = {}
    if venue_id:
        query["venue_id"] = venue_id
    if date_from:
        query["date"] = {"$gte": date_from}
    
    concerts = await db.concerts.find(query, {"_id": 0}).sort("date", 1).to_list(100)
    return [ConcertEventResponse(**c) for c in concerts]

@api_router.get("/venues/{venue_id}/concerts", response_model=List[ConcertEventResponse])
async def get_venue_concerts(venue_id: str):
    concerts = await db.concerts.find({"venue_id": venue_id}, {"_id": 0}).sort("date", 1).to_list(100)
    
    # Add participants count for each concert
    result = []
    for concert in concerts:
        participants_count = await db.event_participations.count_documents({
            "event_id": concert["id"],
            "event_type": "concert"
        })
        result.append(ConcertEventResponse(**concert, participants_count=participants_count))
    
    return result

@api_router.delete("/concerts/{concert_id}")
async def delete_concert_event(concert_id: str, current_user: dict = Depends(get_current_user)):
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Récupérer le concert avant de le supprimer pour notifier les groupes
    concert = await db.concerts.find_one({"id": concert_id, "venue_id": venue["id"]}, {"_id": 0})
    if not concert:
        raise HTTPException(status_code=404, detail="Concert event not found")
    
    # Notifier tous les groupes qui devaient jouer
    if concert.get("bands"):
        for band_info in concert["bands"]:
            band_name = band_info.get("name")
            if band_name:
                # Trouver le musicien propriétaire du groupe
                musicians = await db.musicians.find({}, {"_id": 0}).to_list(1000)
                for musician in musicians:
                    if musician.get("bands"):
                        for band in musician["bands"]:
                            if band.get("name") == band_name:
                                # Notifier le propriétaire du groupe
                                await create_notification(
                                    musician["user_id"],
                                    "concert_cancelled",
                                    "Concert annulé",
                                    f"Le concert du {concert['date']} chez {venue['name']} a été annulé.",
                                    None
                                )
                                break
    
    # Supprimer le concert
    result = await db.concerts.delete_one({"id": concert_id, "venue_id": venue["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Concert event not found")
    
    return {"message": "Concert event deleted"}

@api_router.put("/concerts/{concert_id}", response_model=ConcertEventResponse)
async def update_concert_event(concert_id: str, data: ConcertEvent, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can update concerts")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Vérifier que le concert appartient à ce venue
    existing_concert = await db.concerts.find_one({"id": concert_id, "venue_id": venue["id"]}, {"_id": 0})
    if not existing_concert:
        raise HTTPException(status_code=404, detail="Concert not found")
    
    # Mettre à jour le concert
    update_data = {
        **data.model_dump(),
        "venue_name": venue["name"]
    }
    
    await db.concerts.update_one(
        {"id": concert_id},
        {"$set": update_data}
    )
    
    # Récupérer le concert mis à jour
    updated_concert = await db.concerts.find_one({"id": concert_id}, {"_id": 0})
    return ConcertEventResponse(**updated_concert)



# ============= KARAOKE EVENTS =============

@api_router.post("/karaoke", response_model=KaraokeEventResponse)
async def create_karaoke_event(event: KaraokeEvent, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can create karaoke events")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    karaoke_id = str(uuid.uuid4())
    karaoke_data = {
        "id": karaoke_id,
        "venue_id": venue["id"],
        "venue_name": venue["name"],
        **event.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "participants_count": 0
    }
    
    await db.karaoke.insert_one(karaoke_data)
    return KaraokeEventResponse(**karaoke_data)

@api_router.get("/karaoke", response_model=List[KaraokeEventResponse])
async def get_all_karaoke_events():
    karaoke_events = await db.karaoke.find({}, {"_id": 0}).sort("date", 1).to_list(100)
    return [KaraokeEventResponse(**k) for k in karaoke_events]

@api_router.get("/venues/me/karaoke", response_model=List[KaraokeEventResponse])
async def get_my_karaoke_events(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can access this")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    karaoke_events = await db.karaoke.find({"venue_id": venue["id"]}, {"_id": 0}).sort("date", 1).to_list(100)
    return [KaraokeEventResponse(**k) for k in karaoke_events]

@api_router.get("/venues/{venue_id}/karaoke", response_model=List[KaraokeEventResponse])
async def get_venue_karaoke_events(venue_id: str):
    karaoke_events = await db.karaoke.find({"venue_id": venue_id}, {"_id": 0}).sort("date", 1).to_list(100)
    return [KaraokeEventResponse(**k) for k in karaoke_events]

@api_router.delete("/karaoke/{karaoke_id}")
async def delete_karaoke_event(karaoke_id: str, current_user: dict = Depends(get_current_user)):
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.karaoke.delete_one({"id": karaoke_id, "venue_id": venue["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Karaoke event not found")
    
    return {"message": "Karaoke event deleted"}

@api_router.put("/karaoke/{karaoke_id}", response_model=KaraokeEventResponse)
async def update_karaoke_event(karaoke_id: str, data: KaraokeEvent, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can update karaoke events")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    existing_karaoke = await db.karaoke.find_one({"id": karaoke_id, "venue_id": venue["id"]}, {"_id": 0})
    if not existing_karaoke:
        raise HTTPException(status_code=404, detail="Karaoke event not found")
    
    update_data = {
        **data.model_dump(),
        "venue_name": venue["name"]
    }
    
    await db.karaoke.update_one(
        {"id": karaoke_id},
        {"$set": update_data}
    )
    
    updated_karaoke = await db.karaoke.find_one({"id": karaoke_id}, {"_id": 0})
    return KaraokeEventResponse(**updated_karaoke)

# ============= SPECTACLE EVENTS =============

@api_router.post("/spectacle", response_model=SpectacleEventResponse)
async def create_spectacle_event(event: SpectacleEvent, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can create spectacle events")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    spectacle_id = str(uuid.uuid4())
    spectacle_data = {
        "id": spectacle_id,
        "venue_id": venue["id"],
        "venue_name": venue["name"],
        **event.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "participants_count": 0
    }
    
    await db.spectacle.insert_one(spectacle_data)
    return SpectacleEventResponse(**spectacle_data)

@api_router.get("/spectacle", response_model=List[SpectacleEventResponse])
async def get_all_spectacle_events():
    spectacle_events = await db.spectacle.find({}, {"_id": 0}).sort("date", 1).to_list(100)
    return [SpectacleEventResponse(**s) for s in spectacle_events]

@api_router.get("/venues/me/spectacle", response_model=List[SpectacleEventResponse])
async def get_my_spectacle_events(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can access this")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    spectacle_events = await db.spectacle.find({"venue_id": venue["id"]}, {"_id": 0}).sort("date", 1).to_list(100)
    return [SpectacleEventResponse(**s) for s in spectacle_events]

@api_router.get("/venues/{venue_id}/spectacle", response_model=List[SpectacleEventResponse])
async def get_venue_spectacle_events(venue_id: str):
    spectacle_events = await db.spectacle.find({"venue_id": venue_id}, {"_id": 0}).sort("date", 1).to_list(100)
    return [SpectacleEventResponse(**s) for s in spectacle_events]

@api_router.delete("/spectacle/{spectacle_id}")
async def delete_spectacle_event(spectacle_id: str, current_user: dict = Depends(get_current_user)):
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.spectacle.delete_one({"id": spectacle_id, "venue_id": venue["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Spectacle event not found")
    
    return {"message": "Spectacle event deleted"}

@api_router.put("/spectacle/{spectacle_id}", response_model=SpectacleEventResponse)
async def update_spectacle_event(spectacle_id: str, data: SpectacleEvent, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can update spectacle events")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    existing_spectacle = await db.spectacle.find_one({"id": spectacle_id, "venue_id": venue["id"]}, {"_id": 0})
    if not existing_spectacle:
        raise HTTPException(status_code=404, detail="Spectacle event not found")
    
    update_data = {
        **data.model_dump(),
        "venue_name": venue["name"]
    }
    
    await db.spectacle.update_one(
        {"id": spectacle_id},
        {"$set": update_data}
    )
    
    updated_spectacle = await db.spectacle.find_one({"id": spectacle_id}, {"_id": 0})
    return SpectacleEventResponse(**updated_spectacle)

# ============= PROFITABILITY/RENTABILITÉ =============

@api_router.put("/jams/{jam_id}/profitability")
async def update_jam_profitability(jam_id: str, data: ProfitabilityData, current_user: dict = Depends(get_current_user)):
    """Update profitability data for a jam event"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can update profitability")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Vérifier que le jam appartient à ce venue
    jam = await db.jams.find_one({"id": jam_id, "venue_id": venue["id"]}, {"_id": 0})
    if not jam:
        raise HTTPException(status_code=404, detail="Jam event not found")
    
    # Calculer le profit
    profit = data.revenue - data.expenses
    now = datetime.now(timezone.utc).isoformat()
    
    profitability_data = {
        "revenue": data.revenue,
        "expenses": data.expenses,
        "profit": profit,
        "notes": data.notes,
        "recorded_at": now
    }
    
    # Mettre à jour le jam avec les données de rentabilité
    await db.jams.update_one(
        {"id": jam_id},
        {"$set": {"profitability": profitability_data}}
    )
    
    return ProfitabilityResponse(**profitability_data)

@api_router.put("/concerts/{concert_id}/profitability")
async def update_concert_profitability(concert_id: str, data: ProfitabilityData, current_user: dict = Depends(get_current_user)):
    """Update profitability data for a concert event"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can update profitability")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Vérifier que le concert appartient à ce venue
    concert = await db.concerts.find_one({"id": concert_id, "venue_id": venue["id"]}, {"_id": 0})
    if not concert:
        raise HTTPException(status_code=404, detail="Concert event not found")
    
    # Calculer le profit
    profit = data.revenue - data.expenses
    now = datetime.now(timezone.utc).isoformat()
    
    profitability_data = {
        "revenue": data.revenue,
        "expenses": data.expenses,
        "profit": profit,
        "notes": data.notes,
        "recorded_at": now
    }
    
    # Mettre à jour le concert avec les données de rentabilité
    await db.concerts.update_one(
        {"id": concert_id},
        {"$set": {"profitability": profitability_data}}
    )
    
    return ProfitabilityResponse(**profitability_data)

@api_router.get("/venues/me/past-events")
async def get_past_events_with_profitability(current_user: dict = Depends(get_current_user)):
    """Get all past events (jams + concerts) with profitability data for statistics"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can access this")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Date d'aujourd'hui
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Récupérer tous les jams passés
    past_jams = await db.jams.find(
        {"venue_id": venue["id"], "date": {"$lt": today}},
        {"_id": 0}
    ).sort("date", -1).to_list(500)
    
    # Récupérer tous les concerts passés
    past_concerts = await db.concerts.find(
        {"venue_id": venue["id"], "date": {"$lt": today}},
        {"_id": 0}
    ).sort("date", -1).to_list(500)
    
    # Formater les résultats
    events = []
    
    for jam in past_jams:
        events.append({
            "id": jam["id"],
            "type": "jam",
            "date": jam["date"],
            "start_time": jam.get("start_time", ""),
            "end_time": jam.get("end_time", ""),
            "music_styles": jam.get("music_styles", []),
            "title": f"Bœuf - {', '.join(jam.get('music_styles', ['Musique']))}",
            "profitability": jam.get("profitability", None)
        })
    
    for concert in past_concerts:
        events.append({
            "id": concert["id"],
            "type": "concert",
            "date": concert["date"],
            "start_time": concert.get("start_time", ""),
            "end_time": concert.get("end_time", ""),
            "music_styles": [],  # Les concerts n'ont pas de music_styles direct
            "title": concert.get("title", "Concert"),
            "bands": concert.get("bands", []),
            "profitability": concert.get("profitability", None)
        })
    
    # Trier par date (plus récent en premier)
    events.sort(key=lambda x: x["date"], reverse=True)
    
    return events

@api_router.get("/venues/me/profitability-stats")
async def get_profitability_statistics(current_user: dict = Depends(get_current_user)):
    """Get profitability statistics by style and period"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can access this")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Date d'aujourd'hui
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Récupérer tous les événements passés avec rentabilité
    past_jams = await db.jams.find(
        {"venue_id": venue["id"], "date": {"$lt": today}, "profitability": {"$exists": True}},
        {"_id": 0}
    ).to_list(500)
    
    past_concerts = await db.concerts.find(
        {"venue_id": venue["id"], "date": {"$lt": today}, "profitability": {"$exists": True}},
        {"_id": 0}
    ).to_list(500)
    
    # Statistiques globales
    total_revenue = 0
    total_expenses = 0
    total_profit = 0
    event_count = 0
    
    # Statistiques par style
    by_style = {}
    
    # Statistiques par période (mois)
    by_month = {}
    
    # Traiter les jams
    for jam in past_jams:
        prof = jam.get("profitability", {})
        if not prof:
            continue
            
        event_count += 1
        revenue = prof.get("revenue", 0)
        expenses = prof.get("expenses", 0)
        profit = prof.get("profit", 0)
        
        total_revenue += revenue
        total_expenses += expenses
        total_profit += profit
        
        # Par style
        for style in jam.get("music_styles", ["Non spécifié"]):
            if style not in by_style:
                by_style[style] = {"count": 0, "revenue": 0, "expenses": 0, "profit": 0}
            by_style[style]["count"] += 1
            by_style[style]["revenue"] += revenue
            by_style[style]["expenses"] += expenses
            by_style[style]["profit"] += profit
        
        # Par mois
        month_key = jam["date"][:7]  # YYYY-MM
        if month_key not in by_month:
            by_month[month_key] = {"count": 0, "revenue": 0, "expenses": 0, "profit": 0}
        by_month[month_key]["count"] += 1
        by_month[month_key]["revenue"] += revenue
        by_month[month_key]["expenses"] += expenses
        by_month[month_key]["profit"] += profit
    
    # Traiter les concerts
    for concert in past_concerts:
        prof = concert.get("profitability", {})
        if not prof:
            continue
            
        event_count += 1
        revenue = prof.get("revenue", 0)
        expenses = prof.get("expenses", 0)
        profit = prof.get("profit", 0)
        
        total_revenue += revenue
        total_expenses += expenses
        total_profit += profit
        
        # Les concerts vont dans "Concert" comme style
        style = "Concert"
        if style not in by_style:
            by_style[style] = {"count": 0, "revenue": 0, "expenses": 0, "profit": 0}
        by_style[style]["count"] += 1
        by_style[style]["revenue"] += revenue
        by_style[style]["expenses"] += expenses
        by_style[style]["profit"] += profit
        
        # Par mois
        month_key = concert["date"][:7]  # YYYY-MM
        if month_key not in by_month:
            by_month[month_key] = {"count": 0, "revenue": 0, "expenses": 0, "profit": 0}
        by_month[month_key]["count"] += 1
        by_month[month_key]["revenue"] += revenue
        by_month[month_key]["expenses"] += expenses
        by_month[month_key]["profit"] += profit
    
    # Calculer les moyennes par style
    for style in by_style:
        count = by_style[style]["count"]
        if count > 0:
            by_style[style]["avg_profit"] = round(by_style[style]["profit"] / count, 2)
            by_style[style]["avg_revenue"] = round(by_style[style]["revenue"] / count, 2)
    
    # Calculer les moyennes par mois
    for month in by_month:
        count = by_month[month]["count"]
        if count > 0:
            by_month[month]["avg_profit"] = round(by_month[month]["profit"] / count, 2)
    
    return {
        "global": {
            "total_revenue": round(total_revenue, 2),
            "total_expenses": round(total_expenses, 2),
            "total_profit": round(total_profit, 2),
            "event_count": event_count,
            "avg_profit_per_event": round(total_profit / event_count, 2) if event_count > 0 else 0
        },
        "by_style": by_style,
        "by_month": by_month
    }

# ============= PLANNING SLOTS (Open dates for concerts) =============

@api_router.post("/planning", response_model=PlanningSlotResponse)
async def create_planning_slot(data: PlanningSlot, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can create planning slots")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Vérifier s'il existe déjà un créneau Planning à cette date
    existing_slot = await db.planning_slots.find_one({
        "venue_id": venue["id"],
        "date": data.date
    }, {"_id": 0})
    
    if existing_slot:
        raise HTTPException(
            status_code=400, 
            detail=f"Un créneau pour candidatures est déjà ouvert le {data.date}. Vous ne pouvez pas créer deux créneaux le même jour."
        )
    
    slot_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    slot_doc = {
        "id": slot_id,
        "venue_id": venue["id"],
        "venue_name": venue["name"],
        **data.model_dump(),
        "created_at": now
    }
    
    await db.planning_slots.insert_one(slot_doc)
    
    # Notify subscribers about open slot
    styles = ", ".join(data.music_styles) if data.music_styles else "Tous styles"
    await notify_venue_subscribers(venue["id"], "planning_slot", f"Date disponible chez {venue['name']}", 
                                   f"Le {data.date} - {styles}", f"/venue/{venue['id']}")
    
    return PlanningSlotResponse(**slot_doc, applications_count=0, accepted_bands_count=0)

@api_router.get("/planning", response_model=List[PlanningSlotResponse])
async def list_planning_slots(venue_id: Optional[str] = None, is_open: bool = True):
    query = {"is_open": is_open}
    if venue_id:
        query["venue_id"] = venue_id
    
    slots = await db.planning_slots.find(query, {"_id": 0}).sort("date", 1).to_list(100)
    
    result = []
    for s in slots:
        apps_count = await db.applications.count_documents({"planning_slot_id": s["id"]})
        accepted_count = await db.applications.count_documents({
            "planning_slot_id": s["id"],
            "status": "accepted"
        })
        result.append(PlanningSlotResponse(
            **s, 
            applications_count=apps_count,
            accepted_bands_count=accepted_count
        ))
    
    return result

@api_router.get("/venues/{venue_id}/planning", response_model=List[PlanningSlotResponse])
async def get_venue_planning(venue_id: str):
    slots = await db.planning_slots.find({"venue_id": venue_id}, {"_id": 0}).sort("date", 1).to_list(100)
    
    result = []
    for s in slots:
        apps_count = await db.applications.count_documents({"planning_slot_id": s["id"]})
        accepted_count = await db.applications.count_documents({
            "planning_slot_id": s["id"],
            "status": "accepted"
        })
        result.append(PlanningSlotResponse(
            **s, 
            applications_count=apps_count,
            accepted_bands_count=accepted_count
        ))
    
    return result

@api_router.put("/planning/{slot_id}", response_model=PlanningSlotResponse)
async def update_planning_slot(slot_id: str, data: PlanningSlot, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can update planning slots")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Verify the slot belongs to this venue
    existing_slot = await db.planning_slots.find_one({"id": slot_id, "venue_id": venue["id"]}, {"_id": 0})
    if not existing_slot:
        raise HTTPException(status_code=404, detail="Planning slot not found")
    
    # Update the slot with new data
    update_data = {
        **data.model_dump(),
        "venue_id": venue["id"],
        "venue_name": venue["name"]
    }
    
    await db.planning_slots.update_one(
        {"id": slot_id, "venue_id": venue["id"]},
        {"$set": update_data}
    )
    
    # Get updated slot
    updated_slot = await db.planning_slots.find_one({"id": slot_id}, {"_id": 0})
    
    # Count applications
    apps_count = await db.applications.count_documents({"planning_slot_id": slot_id})
    accepted_count = await db.applications.count_documents({
        "planning_slot_id": slot_id,
        "status": "accepted"
    })
    
    return PlanningSlotResponse(**updated_slot, applications_count=apps_count, accepted_bands_count=accepted_count)

@api_router.delete("/planning/{slot_id}")
async def delete_planning_slot(slot_id: str, current_user: dict = Depends(get_current_user)):
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.planning_slots.delete_one({"id": slot_id, "venue_id": venue["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Planning slot not found")
    
    return {"message": "Planning slot deleted"}

# ============= APPLICATIONS (Candidatures) =============

@api_router.post("/applications", response_model=ConcertApplicationResponse)
async def create_application(data: ConcertApplication, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can apply")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Validate that the band belongs to the musician or is their solo profile
    band_name = data.band_name
    is_solo = band_name == musician.get("pseudo") or "solo" in band_name.lower()
    
    if not is_solo:
        # Check if band exists in musician's bands
        musician_bands = musician.get("bands", [])
        band_exists = any(band.get("name") == band_name for band in musician_bands)
        
        if not band_exists:
            raise HTTPException(
                status_code=403, 
                detail="Vous ne pouvez postuler qu'avec vos propres groupes ou votre profil solo"
            )
    
    slot = await db.planning_slots.find_one({"id": data.planning_slot_id}, {"_id": 0})
    if not slot or not slot.get("is_open", True):
        raise HTTPException(status_code=404, detail="Planning slot not found or closed")
    
    # Check if already applied
    existing = await db.applications.find_one({
        "planning_slot_id": data.planning_slot_id,
        "musician_id": musician["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this slot")
    
    app_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    app_doc = {
        "id": app_id,
        "planning_slot_id": data.planning_slot_id,
        "musician_id": musician["id"],
        "musician_name": musician.get("pseudo", current_user["name"]),
        **data.model_dump(),
        "status": "pending",
        "created_at": now
    }
    
    await db.applications.insert_one(app_doc)
    
    # Notify venue owner
    venue = await db.venues.find_one({"id": slot["venue_id"]}, {"_id": 0})
    if venue:
        await create_notification(
            venue["user_id"], "application_received",
            "Nouvelle candidature",
            f"{data.band_name} a postulé pour le {slot['date']}",
            f"/venue"
        )
    
    return ConcertApplicationResponse(**app_doc)

@api_router.get("/applications/my")
async def get_my_applications(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can view their applications")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        return []
    
    applications = await db.applications.find({"musician_id": musician["id"]}, {"_id": 0}).to_list(100)
    
    result = []
    for app in applications:
        slot = await db.planning_slots.find_one({"id": app["planning_slot_id"]}, {"_id": 0})
        if slot:
            app["venue_name"] = slot.get("venue_name")
            app["slot_date"] = slot.get("date")
        result.append(app)
    
    return result

@api_router.get("/planning/{slot_id}/applications", response_model=List[ConcertApplicationResponse])
async def get_slot_applications(slot_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can view applications")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    slot = await db.planning_slots.find_one({"id": slot_id, "venue_id": venue["id"]}, {"_id": 0})
    if not slot:
        raise HTTPException(status_code=404, detail="Planning slot not found")
    
    applications = await db.applications.find({"planning_slot_id": slot_id}, {"_id": 0}).to_list(100)
    return [ConcertApplicationResponse(**a) for a in applications]

@api_router.post("/applications/{app_id}/accept")
async def accept_application(app_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can accept applications")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    app = await db.applications.find_one({"id": app_id}, {"_id": 0})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    slot = await db.planning_slots.find_one({"id": app["planning_slot_id"], "venue_id": venue["id"]}, {"_id": 0})
    if not slot:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update application status
    await db.applications.update_one({"id": app_id}, {"$set": {"status": "accepted"}})
    
    # Count accepted applications for this slot
    accepted_count = await db.applications.count_documents({
        "planning_slot_id": slot["id"],
        "status": "accepted"
    })
    
    # Get number of bands needed (default to 1 if not set)
    num_bands_needed = slot.get("num_bands_needed", 1)
    
    # Close slot only if we have enough accepted bands
    if accepted_count >= num_bands_needed:
        await db.planning_slots.update_one({"id": slot["id"]}, {"$set": {"is_open": False}})
    
    # Notify musician
    musician = await db.musicians.find_one({"id": app["musician_id"]}, {"_id": 0})
    if musician:
        await create_notification(
            musician["user_id"], "application_accepted",
            "Candidature acceptée!",
            f"Votre candidature pour le {slot['date']} chez {venue['name']} a été acceptée!",
            f"/venue/{venue['id']}"
        )
    
    # NOUVELLE FONCTIONNALITÉ : Trouver l'administrateur du groupe et le notifier
    band_name = app.get("band_name")
    if band_name:
        # Rechercher le groupe dans tous les profils de musiciens
        all_musicians = await db.musicians.find({}, {"_id": 0, "bands": 1, "user_id": 1, "pseudo": 1}).to_list(1000)
        
        for m in all_musicians:
            if m.get("bands"):
                for band in m["bands"]:
                    if band.get("name") == band_name and band.get("admin_id"):
                        # Trouvé l'administrateur du groupe !
                        admin_id = band["admin_id"]
                        
                        # Récupérer le profil admin complet
                        admin_musician = await db.musicians.find_one({"id": admin_id}, {"_id": 0})
                        if admin_musician:
                            # Envoyer une notification à l'administrateur du groupe
                            await create_notification(
                                admin_musician["user_id"], 
                                "band_concert_confirmed",
                                f"🎉 Concert confirmé pour {band_name}",
                                f"{venue['name']} a validé votre groupe pour le {slot['date']}. Vous pouvez maintenant communiquer avec l'établissement.",
                                f"/venue/{venue['id']}"
                            )
                        break
    
    return {"message": "Application accepted"}

@api_router.post("/applications/{app_id}/reject")
async def reject_application(app_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can reject applications")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    app = await db.applications.find_one({"id": app_id}, {"_id": 0})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    slot = await db.planning_slots.find_one({"id": app["planning_slot_id"], "venue_id": venue["id"]}, {"_id": 0})
    if not slot:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.applications.update_one({"id": app_id}, {"$set": {"status": "rejected"}})
    
    # Notify musician
    musician = await db.musicians.find_one({"id": app["musician_id"]}, {"_id": 0})
    if musician:
        await create_notification(
            musician["user_id"], "application_rejected",
            "Candidature non retenue",
            f"Votre candidature pour le {slot['date']} n'a pas été retenue",
            None
        )
    
    return {"message": "Application rejected"}

@api_router.delete("/applications/{app_id}")
async def delete_application(app_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an application (for venue to cancel an accepted application)"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can delete applications")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    app = await db.applications.find_one({"id": app_id}, {"_id": 0})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    slot = await db.planning_slots.find_one({"id": app["planning_slot_id"], "venue_id": venue["id"]}, {"_id": 0})
    if not slot:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # If the application was accepted, notify the musician about cancellation
    if app.get("status") == "accepted":
        musician = await db.musicians.find_one({"id": app["musician_id"]}, {"_id": 0})
        if musician:
            await create_notification(
                musician["user_id"],
                "application_cancelled",
                "Candidature annulée",
                f"Votre candidature acceptée pour le {slot['date']} chez {venue['name']} a été annulée par l'établissement.",
                None
            )
        
        # Reopen slot if it was closed due to this application
        accepted_count = await db.applications.count_documents({
            "planning_slot_id": slot["id"],
            "status": "accepted"
        })
        
        # After deleting this one, check if we need to reopen
        if accepted_count - 1 < slot.get("num_bands_needed", 1):
            await db.planning_slots.update_one(
                {"id": slot["id"]},
                {"$set": {"is_open": True}}
            )
    
    # Delete the application
    await db.applications.delete_one({"id": app_id})
    
    return {"message": "Application deleted"}

@api_router.get("/venues/me/subscribers")
async def get_venue_subscribers(current_user: dict = Depends(get_current_user)):
    """Get list of subscribers (musicians) for current venue"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can view their subscribers")
    
    # Get venue profile
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Get all subscriptions for this venue from the CORRECT collection
    subscriptions = await db.venue_subscriptions.find({"venue_id": venue["id"]}, {"_id": 0}).to_list(1000)
    
    # Get musician profiles for each subscriber
    subscribers = []
    for sub in subscriptions:
        musician = await db.musicians.find_one({"user_id": sub["user_id"]}, {"_id": 0})
        if musician:
            subscribers.append({
                "id": musician.get("id"),
                "user_id": musician.get("user_id"),
                "pseudo": musician.get("pseudo", "Musicien"),
                "profile_image": musician.get("profile_image"),
                "city": musician.get("city"),
                "department": musician.get("department"),
                "instruments": musician.get("instruments", []),
                "music_styles": musician.get("music_styles", []),
                "subscribed_at": sub.get("created_at")
            })
    
    return subscribers

# ============= NOTIFICATIONS =============

async def create_notification(user_id: str, notif_type: str, title: str, message: str, link: Optional[str] = None):
    notif_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    notif_doc = {
        "id": notif_id,
        "user_id": user_id,
        "type": notif_type,
        "title": title,
        "message": message,
        "link": link,
        "read": False,
        "created_at": now
    }
    
    await db.notifications.insert_one(notif_doc)

async def notify_venue_subscribers(venue_id: str, notif_type: str, title: str, message: str, link: Optional[str] = None):
    subs = await db.venue_subscriptions.find({"venue_id": venue_id}, {"_id": 0}).to_list(1000)
    for sub in subs:
        await create_notification(sub["user_id"], notif_type, title, message, link)

@api_router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return [NotificationResponse(**n) for n in notifications]

@api_router.get("/notifications/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    count = await db.notifications.count_documents({
        "user_id": current_user["id"],
        "read": False
    })
    return {"count": count}

@api_router.post("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notif_id, "user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    return {"message": "Marked as read"}

@api_router.post("/notifications/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    return {"message": "All marked as read"}

@api_router.delete("/notifications")
async def delete_all_notifications(current_user: dict = Depends(get_current_user)):
    """Delete all notifications for the current user"""
    await db.notifications.delete_many({"user_id": current_user["id"]})
    return {"message": "All notifications deleted"}

# ============= VENUE BROADCAST NOTIFICATIONS =============

class BroadcastNotificationRequest(BaseModel):
    message: str

@api_router.post("/venues/me/broadcast-notification")
async def broadcast_notification_to_nearby_musicians(
    data: BroadcastNotificationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send a broadcast notification to all musicians within 100km radius"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can broadcast notifications")
    
    # Check if venue has active subscription
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    if not user or user.get("subscription_status") not in ["active", "trial"]:
        raise HTTPException(status_code=403, detail="Active subscription required to send broadcast notifications")
    
    # Get venue profile for location
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    venue_lat = venue["latitude"]
    venue_lon = venue["longitude"]
    venue_name = venue["name"]
    
    # Find all musicians
    all_musicians = await db.musicians.find({}, {"_id": 0}).to_list(5000)
    
    # Filter musicians within 100km who have location
    nearby_musicians = []
    for musician in all_musicians:
        # Get musician's location from their profile city coordinates if available
        # For now, we'll use the user's profile. In a real app, musicians would have lat/lon
        # Let's find musicians whose city matches and calculate based on that
        # For simplicity, we'll send to all musicians for now and enhance later
        # But let's implement proper geolocation check
        
        # Check if musician has coordinates (we need to add this to musician profiles)
        # For now, let's send to all musicians as a basic implementation
        nearby_musicians.append(musician)
    
    # Send notifications to all nearby musicians
    notification_count = 0
    for musician in nearby_musicians:
        await create_notification(
            user_id=musician["user_id"],
            notif_type="venue_broadcast",
            title=f"📢 Message de {venue_name}",
            message=data.message,
            link=f"/venue/{venue['id']}"
        )
        notification_count += 1
    
    # Save broadcast history
    broadcast_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    broadcast_doc = {
        "id": broadcast_id,
        "venue_id": venue["id"],
        "venue_name": venue_name,
        "message": data.message,
        "recipients_count": notification_count,
        "created_at": now
    }
    
    await db.broadcast_notifications.insert_one(broadcast_doc)
    
    return {
        "message": "Notification sent successfully",
        "recipients_count": notification_count
    }

@api_router.post("/venues/me/notify-subscribers")
async def notify_subscribers(
    data: BroadcastNotificationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send notification to subscribers (Jacks) only"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can send notifications to subscribers")
    
    # Check if venue has active subscription
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    if not user or user.get("subscription_status") not in ["active", "trial"]:
        raise HTTPException(status_code=403, detail="Active subscription required to send notifications")
    
    # Get venue profile
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    venue_name = venue["name"]
    
    # Get all subscribers from the CORRECT collection
    subscriptions = await db.venue_subscriptions.find({"venue_id": venue["id"]}, {"_id": 0}).to_list(1000)
    
    # Send notifications to each subscriber
    notification_count = 0
    for sub in subscriptions:
        await create_notification(
            user_id=sub["user_id"],
            notif_type="venue_notification",
            title=f"💌 Message de {venue_name}",
            message=data.message,
            link=f"/venue/{venue['id']}"
        )
        notification_count += 1
    
    # Save to broadcast history
    broadcast_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    broadcast_doc = {
        "id": broadcast_id,
        "venue_id": venue["id"],
        "venue_name": venue_name,
        "message": data.message,
        "recipients_count": notification_count,
        "target": "subscribers",
        "created_at": now
    }
    
    await db.broadcast_notifications.insert_one(broadcast_doc)
    
    return {
        "message": "Notification sent to subscribers",
        "recipients_count": notification_count
    }

@api_router.get("/venues/me/broadcast-history")
async def get_broadcast_history(current_user: dict = Depends(get_current_user)):
    """Get venue's broadcast notification history"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can view broadcast history")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    history = await db.broadcast_notifications.find(
        {"venue_id": venue["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return history

@api_router.get("/venues/me/nearby-musicians-count")
async def get_nearby_musicians_count(current_user: dict = Depends(get_current_user)):
    """Get count of musicians within 100km for preview before sending notification"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can check nearby musicians")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # For now, return total musicians count
    # In production, this would calculate based on geolocation
    total_musicians = await db.musicians.count_documents({})
    
    return {
        "count": total_musicians,
        "radius_km": 100
    }

# ============= REVIEW SYSTEM =============

@api_router.post("/reviews", response_model=ReviewResponse)
async def create_review(data: ReviewCreate, current_user: dict = Depends(get_current_user)):
    """Create a review for a venue (only musicians who attended an event can review)"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can leave reviews")
    
    # Validate rating
    if data.rating < 1 or data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Get musician profile
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Check if venue exists
    venue = await db.venues.find_one({"id": data.venue_id}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    # Check if musician has participated in an event at this venue
    has_participated = await db.event_participations.find_one({
        "venue_id": data.venue_id,
        "musician_id": musician["id"]
    })
    
    if not has_participated:
        raise HTTPException(
            status_code=403, 
            detail="Vous devez avoir participé à un événement dans cet établissement pour laisser un avis"
        )
    
    # Check if musician already reviewed this venue
    existing_review = await db.reviews.find_one({
        "venue_id": data.venue_id,
        "musician_id": musician["id"]
    })
    
    if existing_review:
        raise HTTPException(status_code=400, detail="Vous avez déjà laissé un avis pour cet établissement")
    
    # Create review
    review_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    review_doc = {
        "id": review_id,
        "venue_id": data.venue_id,
        "musician_id": musician["id"],
        "musician_user_id": current_user["id"],
        "musician_name": musician.get("pseudo", current_user["name"]),
        "musician_image": musician.get("profile_image"),
        "rating": data.rating,
        "comment": data.comment,
        "venue_response": None,
        "venue_response_date": None,
        "is_reported": False,
        "created_at": now
    }
    
    await db.reviews.insert_one(review_doc)
    
    # Notify venue
    await create_notification(
        venue["user_id"],
        "new_review",
        "⭐ Nouvel avis",
        f"{musician.get('pseudo', current_user['name'])} a laissé un avis ({data.rating}/5 étoiles)",
        f"/venue/{data.venue_id}"
    )
    
    return ReviewResponse(**review_doc)

@api_router.get("/venues/{venue_id}/reviews", response_model=List[ReviewResponse])
async def get_venue_reviews(venue_id: str):
    """Get all reviews for a venue (only if venue allows public reviews)"""
    venue = await db.venues.find_one({"id": venue_id}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    # Check if venue allows public reviews
    if not venue.get("show_reviews", True):
        return []
    
    reviews = await db.reviews.find(
        {"venue_id": venue_id, "is_reported": False},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return [ReviewResponse(**r) for r in reviews]

@api_router.get("/venues/{venue_id}/average-rating")
async def get_venue_average_rating(venue_id: str):
    """Get average rating for a venue"""
    reviews = await db.reviews.find(
        {"venue_id": venue_id, "is_reported": False},
        {"_id": 0}
    ).to_list(1000)
    
    if not reviews:
        return {"average_rating": 0, "total_reviews": 0}
    
    total_rating = sum(r["rating"] for r in reviews)
    average = total_rating / len(reviews)
    
    return {
        "average_rating": round(average, 1),
        "total_reviews": len(reviews)
    }

@api_router.post("/reviews/{review_id}/respond")
async def respond_to_review(review_id: str, data: ReviewResponseRequest, current_user: dict = Depends(get_current_user)):
    """Venue responds to a review"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can respond to reviews")
    
    # Get venue profile
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Get review and verify it belongs to this venue
    review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if review["venue_id"] != venue["id"]:
        raise HTTPException(status_code=403, detail="This review is not for your venue")
    
    # Update review with response
    now = datetime.now(timezone.utc).isoformat()
    await db.reviews.update_one(
        {"id": review_id},
        {"$set": {"venue_response": data.response, "venue_response_date": now}}
    )
    
    # Notify musician

@api_router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a review (only the musician who created it can delete)"""
    # Get the review
    review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Avis non trouvé")
    
    # Check if current user is the musician who created the review
    if current_user["role"] == "musician":
        musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if not musician or review["musician_id"] != musician["id"]:
            raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que vos propres avis")
    else:
        raise HTTPException(status_code=403, detail="Seul l'auteur de l'avis peut le supprimer")
    
    # Delete the review
    result = await db.reviews.delete_one({"id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Avis non trouvé")
    
    return {"message": "Avis supprimé avec succès"}

    await create_notification(
        review["musician_user_id"],
        "review_response",
        "💬 Réponse à votre avis",
        f"{venue['name']} a répondu à votre avis",
        f"/venue/{venue['id']}"
    )
    
    return {"message": "Response added successfully"}

@api_router.post("/reviews/{review_id}/report")
async def report_review(review_id: str, current_user: dict = Depends(get_current_user)):
    """Report an inappropriate review"""
    review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    await db.reviews.update_one(
        {"id": review_id},
        {"$set": {"is_reported": True}}
    )
    
    return {"message": "Review reported successfully"}

@api_router.put("/venues/me/reviews-visibility")
async def toggle_reviews_visibility(show_reviews: bool, current_user: dict = Depends(get_current_user)):
    """Toggle venue reviews visibility"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can toggle reviews visibility")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    await db.venues.update_one(
        {"user_id": current_user["id"]},
        {"$set": {"show_reviews": show_reviews}}
    )
    
    return {"message": "Reviews visibility updated", "show_reviews": show_reviews}

@api_router.get("/venues/me/reviews", response_model=List[ReviewResponse])
async def get_my_venue_reviews(current_user: dict = Depends(get_current_user)):
    """Get all reviews for my venue (including reported ones, for venue owner)"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can view their reviews")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    reviews = await db.reviews.find(
        {"venue_id": venue["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return [ReviewResponse(**r) for r in reviews]

# ============= MESSAGING SYSTEM =============

@api_router.post("/messages", response_model=MessageResponse)
async def send_message(data: MessageCreate, current_user: dict = Depends(get_current_user)):
    """Send a message to another user"""
    # Get recipient info
    recipient = await db.users.find_one({"id": data.recipient_id}, {"_id": 0})
    if not recipient:
        raise HTTPException(status_code=404, detail="Destinataire non trouvé")
    
    # Get sender profile for name/image
    sender_profile = None
    if current_user["role"] == "musician":
        sender_profile = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    elif current_user["role"] == "venue":
        sender_profile = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    
    # NOUVELLE LOGIQUE : Vérifier les restrictions de messagerie si le destinataire est un établissement
    if recipient["role"] == "venue" and current_user["role"] == "musician":
        venue_profile = await db.venues.find_one({"user_id": recipient["id"]}, {"_id": 0})
        
        if venue_profile and venue_profile.get("allow_messages_from") == "connected_only":
            # Le venue accepte uniquement les messages des musiciens connectés (ayant joué ou été acceptés)
            musician_profile = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
            if not musician_profile:
                raise HTTPException(status_code=403, detail="Profil musicien non trouvé")
            
            # Vérifier si le musicien a une candidature acceptée pour ce venue
            # Il faut joindre avec planning_slots pour filtrer par venue_id
            applications_cursor = db.applications.find({
                "musician_id": musician_profile["id"],
                "status": "accepted"
            }, {"_id": 0})
            
            has_accepted_app = False
            async for app in applications_cursor:
                slot = await db.planning_slots.find_one({
                    "id": app["planning_slot_id"],
                    "venue_id": venue_profile["id"]
                }, {"_id": 0})
                if slot:
                    has_accepted_app = True
                    break
            
            # Vérifier si le musicien a participé à un événement de ce venue
            # La table event_participations utilise 'musician_user_id', pas 'user_id'
            has_participated = await db.event_participations.find_one({
                "musician_user_id": current_user["id"],
                "venue_id": venue_profile["id"],
                "active": True
            }, {"_id": 0})
            
            if not has_accepted_app and not has_participated:
                raise HTTPException(
                    status_code=403, 
                    detail="Cet établissement accepte uniquement les messages des musiciens ayant déjà joué chez eux ou dont la candidature a été acceptée"
                )
    
    sender_name = sender_profile.get("pseudo" if current_user["role"] == "musician" else "name", current_user["name"]) if sender_profile else current_user["name"]
    sender_image = sender_profile.get("profile_image") if sender_profile else None
    
    # Create message
    message_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    message_doc = {
        "id": message_id,
        "sender_id": current_user["id"],
        "sender_name": sender_name,
        "sender_image": sender_image,
        "recipient_id": data.recipient_id,
        "recipient_name": recipient["name"],
        "subject": data.subject,
        "content": data.content,
        "is_read": False,
        "created_at": now
    }
    
    await db.messages.insert_one(message_doc)
    
    # Send notification to recipient
    await create_notification(
        data.recipient_id,
        "new_message",
        f"💬 Nouveau message de {sender_name}",
        data.subject,
        f"/messages"
    )
    
    return MessageResponse(**message_doc)

@api_router.get("/messages/inbox", response_model=List[MessageResponse])
async def get_inbox(current_user: dict = Depends(get_current_user)):
    """Get received messages"""
    messages = await db.messages.find(
        {"recipient_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(100).to_list(100)
    
    return [MessageResponse(**m) for m in messages]

@api_router.get("/messages/sent", response_model=List[MessageResponse])
async def get_sent_messages(current_user: dict = Depends(get_current_user)):
    """Get sent messages"""
    messages = await db.messages.find(
        {"sender_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(100).to_list(100)
    
    return [MessageResponse(**m) for m in messages]

@api_router.put("/messages/{message_id}/read")
async def mark_message_read(message_id: str, current_user: dict = Depends(get_current_user)):
    """Mark a message as read"""
    result = await db.messages.update_one(
        {"id": message_id, "recipient_id": current_user["id"]},
        {"$set": {"is_read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return {"message": "Message marqué comme lu"}

@api_router.delete("/messages/conversation/{partner_id}")
async def delete_conversation(partner_id: str, current_user: dict = Depends(get_current_user)):
    """Delete all messages in a conversation with a specific user"""
    # Delete all messages sent by current user to partner
    result1 = await db.messages.delete_many({
        "sender_id": current_user["id"],
        "recipient_id": partner_id
    })
    
    # Delete all messages received from partner
    result2 = await db.messages.delete_many({
        "sender_id": partner_id,
        "recipient_id": current_user["id"]
    })
    
    total_deleted = result1.deleted_count + result2.deleted_count
    
    return {
        "message": "Conversation supprimée",
        "deleted_count": total_deleted
    }

# ============= BANDS DIRECTORY =============

@api_router.get("/bands")
async def get_bands_directory(
    department: Optional[str] = None, 
    city: Optional[str] = None,
    music_style: Optional[str] = None,
    band_type: Optional[str] = None,
    repertoire_type: Optional[str] = None,
    looking_for_members: Optional[bool] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius: Optional[float] = None
):
    """Get public bands directory with optional filters or geolocation"""
    # Get all musicians with bands
    musicians = await db.musicians.find({}, {"_id": 0}).to_list(2000)
    
    # Extract all bands from all musicians
    all_bands = []
    for musician in musicians:
        # Check new format (multiple bands)
        if musician.get("bands"):
            for band in musician["bands"]:
                if band.get("is_public", True):  # Only public bands
                    # Apply text filters (only if not using geolocation)
                    if not (latitude and longitude and radius):
                        if department and band.get("department") != department:
                            continue
                        if city and band.get("city", "").lower() != city.lower():
                            continue
                    
                    if music_style and music_style not in band.get("music_styles", []):
                        continue
                    if band_type and band.get("band_type") != band_type:
                        continue
                    if repertoire_type and band.get("repertoire_type") != repertoire_type:
                        continue
                    if looking_for_members is not None and band.get("looking_for_members", False) != looking_for_members:
                        continue
                    
                    band_data = {
                        "id": f"{musician['id']}-{band.get('name', '')}",
                        "musician_id": musician["id"],
                        "musician_user_id": musician["user_id"],
                        "musician_name": musician.get("pseudo", ""),
                        "name": band.get("name"),
                        "photo": band.get("photo"),
                        "description": band.get("description"),
                        "members_count": band.get("members_count"),
                        "music_styles": band.get("music_styles", []),
                        "band_type": band.get("band_type"),
                        "repertoire_type": band.get("repertoire_type"),
                        "show_duration": band.get("show_duration"),
                        "city": band.get("city"),
                        "department": band.get("department"),
                        "region": band.get("region"),
                        "facebook": band.get("facebook"),
                        "instagram": band.get("instagram"),
                        "youtube": band.get("youtube"),
                        "website": band.get("website"),
                        "bandcamp": band.get("bandcamp"),
                        "looking_for_concerts": band.get("looking_for_concerts", True),
                        "looking_for_members": band.get("looking_for_members", False),
                        "looking_for_profiles": band.get("looking_for_profiles", []),
                        "has_sound_engineer": band.get("has_sound_engineer", False),
                        "admin_id": band.get("admin_id"),
                        "is_association": band.get("is_association", False),
                        "association_name": band.get("association_name"),
                        "has_label": band.get("has_label", False),
                        "label_name": band.get("label_name"),
                        "label_city": band.get("label_city")
                    }
                    
                    # Calculate distance if geolocation mode
                    if latitude and longitude and radius:
                        # Try to get band location first, fallback to musician location
                        band_lat = band.get("latitude") or musician.get("latitude")
                        band_lon = band.get("longitude") or musician.get("longitude")
                        
                        # If no coordinates but we have a city, geocode it on-the-fly
                        if not (band_lat and band_lon):
                            city_to_geocode = band.get("city") or musician.get("city")
                            if city_to_geocode:
                                band_lat, band_lon = await geocode_city(city_to_geocode)
                        
                        if band_lat and band_lon:
                            from math import radians, sin, cos, sqrt, atan2
                            
                            lat1, lon1 = radians(latitude), radians(longitude)
                            lat2, lon2 = radians(band_lat), radians(band_lon)
                            
                            dlat = lat2 - lat1
                            dlon = lon2 - lon1
                            
                            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                            c = 2 * atan2(sqrt(a), sqrt(1-a))
                            distance_km = 6371 * c
                            
                            if distance_km <= radius:
                                band_data["distance_km"] = round(distance_km, 1)
                                all_bands.append(band_data)
                        else:
                            # Skip bands without any location in geolocation mode
                            continue
                    else:
                        all_bands.append(band_data)
        
        # Check old format (single band) for backward compatibility
        elif musician.get("band") and musician.get("has_band"):
            band = musician["band"]
            if band.get("is_public", True):
                # Apply filters
                if not (latitude and longitude and radius):
                    if department and musician.get("department") != department:
                        continue
                    if city and musician.get("city", "").lower() != city.lower():
                        continue
                
                if music_style and music_style not in band.get("music_styles", []):
                    continue
                
                band_data = {
                    "id": musician["id"],
                    "musician_id": musician["id"],
                    "musician_user_id": musician["user_id"],
                    "musician_name": musician.get("pseudo", ""),
                    "name": band.get("name"),
                    "photo": band.get("photo"),
                    "description": band.get("description"),
                    "members_count": band.get("members_count"),
                    "music_styles": band.get("music_styles", []),
                    "city": musician.get("city"),
                    "department": musician.get("department"),
                    "facebook": band.get("facebook"),
                    "instagram": band.get("instagram"),
                    "youtube": band.get("youtube"),
                    "website": band.get("website"),
                    "bandcamp": band.get("bandcamp"),
                    "looking_for_concerts": band.get("looking_for_concerts", True),
                    "looking_for_members": band.get("looking_for_members", False),
                    "is_association": band.get("is_association", False),
                    "association_name": band.get("association_name"),
                    "has_label": band.get("has_label", False),
                    "label_name": band.get("label_name"),
                    "label_city": band.get("label_city")
                }
                
                # Calculate distance if geolocation mode
                if latitude and longitude and radius:
                    band_lat = musician.get("latitude")
                    band_lon = musician.get("longitude")
                    
                    # If no coordinates but we have a city, geocode it on-the-fly
                    if not (band_lat and band_lon):
                        city_to_geocode = musician.get("city")
                        if city_to_geocode:
                            band_lat, band_lon = await geocode_city(city_to_geocode)
                    
                    if band_lat and band_lon:
                        from math import radians, sin, cos, sqrt, atan2
                        
                        lat1, lon1 = radians(latitude), radians(longitude)
                        lat2, lon2 = radians(band_lat), radians(band_lon)
                        
                        dlat = lat2 - lat1
                        dlon = lon2 - lon1
                        
                        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                        c = 2 * atan2(sqrt(a), sqrt(1-a))
                        distance_km = 6371 * c
                        
                        if distance_km <= radius:
                            band_data["distance_km"] = round(distance_km, 1)
                            all_bands.append(band_data)
                    else:
                        continue
                else:
                    all_bands.append(band_data)
    
    # Sort by distance if in geolocation mode
    if latitude and longitude and radius:
        all_bands.sort(key=lambda x: x.get("distance_km", float('inf')))
    
    return all_bands

@api_router.get("/bands/departments")
async def get_bands_by_department():
    """Get bands grouped by department"""
    musicians = await db.musicians.find(
        {"has_band": True, "band.is_public": True},
        {"_id": 0}
    ).to_list(1000)
    
    # Group by department
    departments = {}
    for musician in musicians:
        dept = musician.get("department", "Non spécifié")
        if dept not in departments:
            departments[dept] = []
        
        if musician.get("band"):
            departments[dept].append({
                "id": musician["id"],
                "name": musician["band"].get("name"),
                "city": musician.get("city"),
                "music_styles": musician["band"].get("music_styles", [])
            })
    
    return departments

# ============= BAND JOIN REQUESTS =============

@api_router.post("/bands/join-requests")
async def create_band_join_request(data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """Create a request to join a band"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can request to join bands")
    
    # Get current musician profile
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Find the target musician who owns the band
    target_musician = await db.musicians.find_one({"id": data["musician_id"]}, {"_id": 0})
    if not target_musician:
        raise HTTPException(status_code=404, detail="Target musician not found")
    
    # Find the specific band
    target_band = None
    if target_musician.get("bands"):
        for band in target_musician["bands"]:
            if band.get("name") == data["band_name"]:
                target_band = band
                break
    
    if not target_band:
        raise HTTPException(status_code=404, detail="Band not found")
    
    # Check if admin_id exists, otherwise the band owner is the admin
    admin_id = target_band.get("admin_id") or data["musician_id"]
    
    # Check if request already exists
    existing = await db.band_join_requests.find_one({
        "musician_id": musician["id"],
        "band_name": data["band_name"],
        "admin_id": admin_id,
        "status": "pending"
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending request for this band")
    
    # Create the request
    request_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    request_doc = {
        "id": request_id,
        "musician_id": musician["id"],
        "musician_user_id": musician["user_id"],
        "musician_name": musician.get("pseudo", current_user["name"]),
        "musician_image": musician.get("profile_image"),
        "band_name": data["band_name"],
        "band_owner_id": data["musician_id"],
        "admin_id": admin_id,
        "message": data.get("message", ""),
        "status": "pending",
        "created_at": now
    }
    
    await db.band_join_requests.insert_one(request_doc)
    
    # Get admin's user_id for notification
    admin_musician = await db.musicians.find_one({"id": admin_id}, {"_id": 0})
    if admin_musician:
        admin_user_id = admin_musician.get("user_id")
        # Create notification for admin
        await create_notification(
            admin_user_id,
            "band_join_request",
            "Demande pour rejoindre votre groupe",
            f"{musician.get('pseudo', current_user['name'])} souhaite rejoindre '{data['band_name']}'",
            f"/musician/{musician['id']}"
        )
    
    return {"message": "Band join request sent", "request_id": request_id}

@api_router.get("/bands/join-requests")
async def get_band_join_requests(current_user: dict = Depends(get_current_user)):
    """Get all join requests for bands where current user is admin"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can view band join requests")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Get all pending requests where current musician is the admin
    requests = await db.band_join_requests.find({
        "admin_id": musician["id"],
        "status": "pending"
    }, {"_id": 0}).to_list(100)
    
    return requests

@api_router.put("/bands/join-requests/{request_id}/accept")
async def accept_band_join_request(request_id: str, current_user: dict = Depends(get_current_user)):
    """Accept a band join request"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can accept band join requests")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Get the request
    request = await db.band_join_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Check if current user is the admin
    if request["admin_id"] != musician["id"]:
        raise HTTPException(status_code=403, detail="Only the band admin can accept this request")
    
    # Update request status
    await db.band_join_requests.update_one(
        {"id": request_id},
        {"$set": {"status": "accepted", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Send notification to requester
    await create_notification(
        request["musician_user_id"],
        "band_join_accepted",
        "Demande acceptée !",
        f"Votre demande pour rejoindre '{request['band_name']}' a été acceptée",
        f"/musician/{request['band_owner_id']}"
    )
    
    return {"message": "Request accepted"}

@api_router.put("/bands/join-requests/{request_id}/reject")
async def reject_band_join_request(request_id: str, current_user: dict = Depends(get_current_user)):
    """Reject a band join request"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can reject band join requests")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Get the request
    request = await db.band_join_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Check if current user is the admin
    if request["admin_id"] != musician["id"]:
        raise HTTPException(status_code=403, detail="Only the band admin can reject this request")
    
    # Update request status
    await db.band_join_requests.update_one(
        {"id": request_id},
        {"$set": {"status": "rejected", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Send notification to requester
    await create_notification(
        request["musician_user_id"],
        "band_join_rejected",
        "Demande refusée",
        f"Votre demande pour rejoindre '{request['band_name']}' a été refusée",
        None
    )
    
    return {"message": "Request rejected"}

# ============= PAYMENT ROUTES =============

SUBSCRIPTION_PRICE = 14.99

@api_router.post("/payments/checkout")
async def create_checkout(data: CheckoutRequest, request: Request, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can subscribe")
    
    try:
        success_url = f"{data.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{data.origin_url}/payment/cancel"
        
        # Create Stripe checkout session for subscription
        session = stripe.checkout.Session.create(
            mode='subscription',
            line_items=[{
                'price': STRIPE_PRICE_ID,
                'quantity': 1,
            }],
            success_url=success_url,
            cancel_url=cancel_url,
            client_reference_id=current_user["id"],
            customer_email=current_user["email"],
            metadata={
                "user_id": current_user["id"],
                "email": current_user["email"],
                "type": "venue_subscription"
            }
        )
        
        # Store transaction in database
        transaction_doc = {
            "id": str(uuid.uuid4()),
            "session_id": session.id,
            "user_id": current_user["id"],
            "email": current_user["email"],
            "amount": SUBSCRIPTION_PRICE,
            "currency": "eur",
            "status": "initiated",
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction_doc)
        
        return {"url": session.url, "session_id": session.id}
    
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Erreur lors de la création de la session de paiement: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    try:
        # Retrieve session from Stripe
        session = stripe.checkout.Session.retrieve(session_id)
        
        # Get transaction from database
        transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        
        # Update transaction status if payment is complete
        if transaction and transaction.get("payment_status") != "paid":
            if session.payment_status == "paid":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"status": "completed", "payment_status": "paid", "completed_at": datetime.now(timezone.utc).isoformat()}}
                )
                await db.users.update_one(
                    {"id": current_user["id"]},
                    {"$set": {
                        "subscription_status": "active",
                        "has_active_subscription": True,
                        "subscription_started": datetime.now(timezone.utc).isoformat()
                    }}
                )
            elif session.status == "expired":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"status": "expired", "payment_status": "failed"}}
                )
        
        return {
            "status": session.status,
            "payment_status": session.payment_status,
            "amount_total": session.amount_total,
            "currency": session.currency
        }
    
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Erreur lors de la récupération du statut: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events with signature verification"""
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")
    
    if not STRIPE_WEBHOOK_SECRET:
        logger.warning("Webhook secret not configured - accepting webhook without verification")
        # Process without verification (not recommended for production)
        try:
            event = stripe.Event.construct_from(
                json.loads(payload), stripe.api_key
            )
        except Exception as e:
            logger.error(f"Error parsing webhook payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid payload")
    else:
        # Verify webhook signature
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid webhook signature: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    try:
        if event.type == 'checkout.session.completed':
            session = event.data.object
            
            # Extract user info from metadata
            user_id = session.get('client_reference_id') or session.get('metadata', {}).get('user_id')
            
            if user_id:
                # Update user subscription status
                await db.users.update_one(
                    {"id": user_id},
                    {"$set": {
                        "subscription_status": "active",
                        "has_active_subscription": True,
                        "subscription_started": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                # Update transaction status
                await db.payment_transactions.update_one(
                    {"session_id": session.id},
                    {"$set": {
                        "status": "completed",
                        "payment_status": "paid",
                        "completed_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                logger.info(f"Subscription activated for user {user_id}")
        
        elif event.type == 'customer.subscription.deleted':
            # Handle subscription cancellation
            subscription = event.data.object
            customer_id = subscription.customer
            
            # Find user by Stripe customer ID if stored
            user = await db.users.find_one({"stripe_customer_id": customer_id}, {"_id": 0})
            if user:
                await db.users.update_one(
                    {"id": user["id"]},
                    {"$set": {
                        "subscription_status": "cancelled",
                        "has_active_subscription": False,
                        "subscription_cancelled": datetime.now(timezone.utc).isoformat()
                    }}
                )
                logger.info(f"Subscription cancelled for user {user['id']}")
        
        return {"status": "success"}
    
    except Exception as e:
        logger.error(f"Error processing webhook event: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")

# ============= HEALTH & ROOT =============

@api_router.get("/")
async def root():
    return {"message": "Jam Connexion API", "status": "running"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Include API router in app
app.include_router(api_router)

# Health check endpoint
@app.get("/")
def read_root():
    return {"message": "Jam Connexion API v2.0 - Refactored", "status": "healthy"}

# Startup event
@app.on_event("startup")
async def startup_db_client():
    logger.info("Connected to MongoDB")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
