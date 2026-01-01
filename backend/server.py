from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request, UploadFile, File
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutSessionRequest
import math
import aiofiles

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

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============= MODELS =============

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str
    subscription_status: Optional[str] = None
    trial_end: Optional[str] = None

# Band Model (for musicians)
class BandInfo(BaseModel):
    name: str
    photo: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    youtube: Optional[str] = None
    website: Optional[str] = None
    bandcamp: Optional[str] = None

# Musician Concert
class MusicianConcert(BaseModel):
    id: Optional[str] = None
    date: str
    venue_id: Optional[str] = None  # If venue is in database
    venue_name: Optional[str] = None  # Manual entry
    city: str
    description: Optional[str] = None

# Enhanced Musician Profile
class MusicianProfile(BaseModel):
    pseudo: str
    age: Optional[int] = None
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    instruments: List[str] = []
    music_styles: List[str] = []
    experience_years: Optional[int] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    youtube: Optional[str] = None
    bandcamp: Optional[str] = None
    # Band info
    has_band: bool = False
    band: Optional[BandInfo] = None
    # Concerts
    concerts: List[MusicianConcert] = []

class MusicianProfileResponse(BaseModel):
    id: str
    user_id: str
    pseudo: str
    age: Optional[int] = None
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    instruments: List[str] = []
    music_styles: List[str] = []
    experience_years: Optional[int] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    youtube: Optional[str] = None
    bandcamp: Optional[str] = None
    has_band: bool = False
    band: Optional[Dict[str, Any]] = None
    concerts: List[Dict[str, Any]] = []
    friends_count: int = 0
    created_at: str

# Friend Request
class FriendRequest(BaseModel):
    to_user_id: str

class FriendRequestResponse(BaseModel):
    id: str
    from_user_id: str
    from_user_name: str
    from_user_image: Optional[str] = None
    to_user_id: str
    status: str  # pending, accepted, rejected
    created_at: str

# Enhanced Venue Profile
class VenueProfile(BaseModel):
    name: str
    description: Optional[str] = None
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    address: str
    city: str
    postal_code: str
    latitude: float
    longitude: float
    phone: Optional[str] = None
    website: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    has_stage: bool = False
    has_sound_engineer: bool = False
    has_pa_system: bool = False
    equipment: List[str] = []
    music_styles: List[str] = []
    opening_hours: Optional[str] = None

class VenueProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    address: str
    city: str
    postal_code: str
    latitude: float
    longitude: float
    phone: Optional[str] = None
    website: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    has_stage: bool = False
    has_sound_engineer: bool = False
    has_pa_system: bool = False
    equipment: List[str] = []
    music_styles: List[str] = []
    opening_hours: Optional[str] = None
    created_at: str
    subscription_status: Optional[str] = None
    subscribers_count: int = 0

# Jam Event (Boeuf musical)
class JamEvent(BaseModel):
    date: str
    start_time: str
    end_time: str
    music_styles: List[str] = []
    rules: Optional[str] = None
    has_instruments: bool = False
    has_pa_system: bool = False
    instruments_available: List[str] = []
    additional_info: Optional[str] = None

class JamEventResponse(BaseModel):
    id: str
    venue_id: str
    venue_name: str
    date: str
    start_time: str
    end_time: str
    music_styles: List[str] = []
    rules: Optional[str] = None
    has_instruments: bool = False
    has_pa_system: bool = False
    instruments_available: List[str] = []
    additional_info: Optional[str] = None
    created_at: str

# Concert Event
class ConcertBand(BaseModel):
    name: str
    musician_id: Optional[str] = None  # Link to musician if registered
    photo: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None

class ConcertEvent(BaseModel):
    date: str
    start_time: str
    title: Optional[str] = None
    description: Optional[str] = None
    bands: List[ConcertBand] = []
    price: Optional[str] = None

class ConcertEventResponse(BaseModel):
    id: str
    venue_id: str
    venue_name: str
    date: str
    start_time: str
    title: Optional[str] = None
    description: Optional[str] = None
    bands: List[Dict[str, Any]] = []
    price: Optional[str] = None
    created_at: str

# Planning/Open dates for concerts
class PlanningSlot(BaseModel):
    date: str
    music_styles: List[str] = []
    description: Optional[str] = None
    is_open: bool = True

class PlanningSlotResponse(BaseModel):
    id: str
    venue_id: str
    venue_name: str
    date: str
    music_styles: List[str] = []
    description: Optional[str] = None
    is_open: bool = True
    applications_count: int = 0
    created_at: str

# Application/Candidature
class ConcertApplication(BaseModel):
    planning_slot_id: str
    band_name: str
    band_photo: Optional[str] = None
    description: Optional[str] = None
    music_style: str
    links: Optional[Dict[str, str]] = None  # facebook, instagram, youtube, etc.
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

class ConcertApplicationResponse(BaseModel):
    id: str
    planning_slot_id: str
    musician_id: str
    musician_name: str
    band_name: str
    band_photo: Optional[str] = None
    description: Optional[str] = None
    music_style: str
    links: Optional[Dict[str, str]] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    status: str  # pending, accepted, rejected
    created_at: str

# Subscription to venue
class VenueSubscription(BaseModel):
    venue_id: str

# Notification
class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str  # jam_reminder, concert_reminder, friend_request, application_received, etc.
    title: str
    message: str
    link: Optional[str] = None
    read: bool = False
    created_at: str

class NearbySearchRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 50.0

class CheckoutRequest(BaseModel):
    origin_url: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

# ============= FILE UPLOAD HELPERS =============

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

async def save_upload_file(file: UploadFile, folder: str = "") -> str:
    """Save uploaded file and return the URL path"""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WebP.")
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    
    # Create folder if specified
    save_dir = UPLOADS_DIR / folder if folder else UPLOADS_DIR
    save_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = save_dir / filename
    
    # Read and check file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux. Maximum 5MB.")
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    # Return relative URL path
    if folder:
        return f"/uploads/{folder}/{filename}"
    return f"/uploads/{filename}"

# ============= AUTH HELPERS =============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

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
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

# ============= AUTH ROUTES =============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if data.role not in ["musician", "venue"]:
        raise HTTPException(status_code=400, detail="Role must be 'musician' or 'venue'")
    
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
    query = {}
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
        result.append(MusicianProfileResponse(**m, friends_count=friends_count))
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
    
    return VenueProfileResponse(**updated, subscription_status=current_user.get("subscription_status"), subscribers_count=subscribers_count)

@api_router.get("/venues/me", response_model=VenueProfileResponse)
async def get_my_venue(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can access this")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    subscribers_count = await db.venue_subscriptions.count_documents({"venue_id": venue["id"]})
    
    return VenueProfileResponse(**venue, subscription_status=current_user.get("subscription_status"), subscribers_count=subscribers_count)

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
        subscription_status = user.get("subscription_status") if user else None
        if subscription_status in ["active", "trial"]:
            subscribers_count = await db.venue_subscriptions.count_documents({"venue_id": v["id"]})
            result.append(VenueProfileResponse(**v, subscription_status=subscription_status, subscribers_count=subscribers_count))
    
    return result

@api_router.get("/venues/{venue_id}", response_model=VenueProfileResponse)
async def get_venue(venue_id: str):
    venue = await db.venues.find_one({"id": venue_id}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    user = await db.users.find_one({"id": venue["user_id"]}, {"_id": 0})
    subscription_status = user.get("subscription_status") if user else None
    subscribers_count = await db.venue_subscriptions.count_documents({"venue_id": venue_id})
    
    return VenueProfileResponse(**venue, subscription_status=subscription_status, subscribers_count=subscribers_count)

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
                nearby.append(VenueProfileResponse(**v, subscription_status=subscription_status, subscribers_count=subscribers_count))
    
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
    
    return JamEventResponse(**jam_doc)

@api_router.get("/jams", response_model=List[JamEventResponse])
async def list_jam_events(venue_id: Optional[str] = None, date_from: Optional[str] = None):
    query = {}
    if venue_id:
        query["venue_id"] = venue_id
    if date_from:
        query["date"] = {"$gte": date_from}
    
    jams = await db.jams.find(query, {"_id": 0}).sort("date", 1).to_list(100)
    return [JamEventResponse(**j) for j in jams]

@api_router.get("/venues/{venue_id}/jams", response_model=List[JamEventResponse])
async def get_venue_jams(venue_id: str):
    jams = await db.jams.find({"venue_id": venue_id}, {"_id": 0}).sort("date", 1).to_list(100)
    return [JamEventResponse(**j) for j in jams]

@api_router.delete("/jams/{jam_id}")
async def delete_jam_event(jam_id: str, current_user: dict = Depends(get_current_user)):
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.jams.delete_one({"id": jam_id, "venue_id": venue["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Jam event not found")
    
    return {"message": "Jam event deleted"}

# ============= CONCERT EVENTS =============

@api_router.post("/concerts", response_model=ConcertEventResponse)
async def create_concert_event(data: ConcertEvent, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can create concert events")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
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
    return [ConcertEventResponse(**c) for c in concerts]

@api_router.delete("/concerts/{concert_id}")
async def delete_concert_event(concert_id: str, current_user: dict = Depends(get_current_user)):
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.concerts.delete_one({"id": concert_id, "venue_id": venue["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Concert event not found")
    
    return {"message": "Concert event deleted"}

# ============= PLANNING SLOTS (Open dates for concerts) =============

@api_router.post("/planning", response_model=PlanningSlotResponse)
async def create_planning_slot(data: PlanningSlot, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can create planning slots")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
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
    
    return PlanningSlotResponse(**slot_doc, applications_count=0)

@api_router.get("/planning", response_model=List[PlanningSlotResponse])
async def list_planning_slots(venue_id: Optional[str] = None, is_open: bool = True):
    query = {"is_open": is_open}
    if venue_id:
        query["venue_id"] = venue_id
    
    slots = await db.planning_slots.find(query, {"_id": 0}).sort("date", 1).to_list(100)
    
    result = []
    for s in slots:
        apps_count = await db.applications.count_documents({"planning_slot_id": s["id"]})
        result.append(PlanningSlotResponse(**s, applications_count=apps_count))
    
    return result

@api_router.get("/venues/{venue_id}/planning", response_model=List[PlanningSlotResponse])
async def get_venue_planning(venue_id: str):
    slots = await db.planning_slots.find({"venue_id": venue_id}, {"_id": 0}).sort("date", 1).to_list(100)
    
    result = []
    for s in slots:
        apps_count = await db.applications.count_documents({"planning_slot_id": s["id"]})
        result.append(PlanningSlotResponse(**s, applications_count=apps_count))
    
    return result

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
    
    await db.applications.update_one({"id": app_id}, {"$set": {"status": "accepted"}})
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

# ============= PAYMENT ROUTES =============

SUBSCRIPTION_PRICE = 10.00

@api_router.post("/payments/checkout")
async def create_checkout(data: CheckoutRequest, request: Request, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can subscribe")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{data.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{data.origin_url}/pricing"
    
    checkout_request = CheckoutSessionRequest(
        amount=SUBSCRIPTION_PRICE,
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"user_id": current_user["id"], "email": current_user["email"], "type": "venue_subscription"}
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    transaction_doc = {
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": current_user["id"],
        "email": current_user["email"],
        "amount": SUBSCRIPTION_PRICE,
        "currency": "eur",
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction_doc)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    status = await stripe_checkout.get_checkout_status(session_id)
    
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    
    if transaction and transaction.get("payment_status") != "paid":
        if status.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"status": "completed", "payment_status": "paid", "completed_at": datetime.now(timezone.utc).isoformat()}}
            )
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$set": {"subscription_status": "active", "subscription_started": datetime.now(timezone.utc).isoformat()}}
            )
        elif status.status == "expired":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"status": "expired", "payment_status": "failed"}}
            )
    
    return {"status": status.status, "payment_status": status.payment_status, "amount_total": status.amount_total, "currency": status.currency}

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            user_id = webhook_response.metadata.get("user_id")
            if user_id:
                await db.users.update_one({"id": user_id}, {"$set": {"subscription_status": "active"}})
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {"status": "completed", "payment_status": "paid"}}
                )
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}

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
