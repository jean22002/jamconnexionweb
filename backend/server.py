from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutSessionRequest
import math

ROOT_DIR = Path(__file__).parent
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

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============= MODELS =============

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str  # "musician" or "venue"

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

class VenueProfile(BaseModel):
    name: str
    description: Optional[str] = None
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
    equipment: List[str] = []
    music_styles: List[str] = []
    jam_days: List[str] = []
    opening_hours: Optional[str] = None
    cover_image: Optional[str] = None

class VenueProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    address: str
    city: str
    postal_code: str
    latitude: float
    longitude: float
    phone: Optional[str] = None
    website: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    has_stage: bool
    has_sound_engineer: bool
    equipment: List[str]
    music_styles: List[str]
    jam_days: List[str]
    opening_hours: Optional[str] = None
    cover_image: Optional[str] = None
    created_at: str
    subscription_status: Optional[str] = None

class MusicianProfile(BaseModel):
    name: str
    bio: Optional[str] = None
    instruments: List[str] = []
    music_styles: List[str] = []
    experience_years: Optional[int] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    profile_image: Optional[str] = None

class MusicianProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str
    bio: Optional[str] = None
    instruments: List[str]
    music_styles: List[str]
    experience_years: Optional[int] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    profile_image: Optional[str] = None
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
    
    # Venues get 2 months free trial
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
            id=user_id,
            email=data.email,
            name=data.name,
            role=data.role,
            created_at=now,
            subscription_status=subscription_status,
            trial_end=trial_end
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
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            created_at=user["created_at"],
            subscription_status=user.get("subscription_status"),
            trial_end=user.get("trial_end")
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        created_at=current_user["created_at"],
        subscription_status=current_user.get("subscription_status"),
        trial_end=current_user.get("trial_end")
    )

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
        subscription_status=current_user.get("subscription_status")
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
    return VenueProfileResponse(**updated, subscription_status=current_user.get("subscription_status"))

@api_router.get("/venues/me", response_model=VenueProfileResponse)
async def get_my_venue(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can access this")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    return VenueProfileResponse(**venue, subscription_status=current_user.get("subscription_status"))

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
        # Only show active/trial venues
        if subscription_status in ["active", "trial"]:
            result.append(VenueProfileResponse(**v, subscription_status=subscription_status))
    
    return result

@api_router.get("/venues/{venue_id}", response_model=VenueProfileResponse)
async def get_venue(venue_id: str):
    venue = await db.venues.find_one({"id": venue_id}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    user = await db.users.find_one({"id": venue["user_id"]}, {"_id": 0})
    subscription_status = user.get("subscription_status") if user else None
    
    return VenueProfileResponse(**venue, subscription_status=subscription_status)

@api_router.post("/venues/nearby", response_model=List[VenueProfileResponse])
async def find_nearby_venues(data: NearbySearchRequest):
    """Find venues within a radius using Haversine formula"""
    all_venues = await db.venues.find({}, {"_id": 0}).to_list(500)
    
    nearby = []
    for v in all_venues:
        distance = haversine_distance(
            data.latitude, data.longitude,
            v["latitude"], v["longitude"]
        )
        if distance <= data.radius_km:
            user = await db.users.find_one({"id": v["user_id"]}, {"_id": 0})
            subscription_status = user.get("subscription_status") if user else None
            if subscription_status in ["active", "trial"]:
                v["distance_km"] = round(distance, 2)
                nearby.append(VenueProfileResponse(**v, subscription_status=subscription_status))
    
    nearby.sort(key=lambda x: x.model_dump().get("distance_km", 999))
    return nearby

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in km"""
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

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
    
    musician_doc = {
        "id": musician_id,
        "user_id": current_user["id"],
        **data.model_dump(),
        "created_at": now
    }
    
    await db.musicians.insert_one(musician_doc)
    
    return MusicianProfileResponse(**musician_doc)

@api_router.put("/musicians", response_model=MusicianProfileResponse)
async def update_musician_profile(data: MusicianProfile, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musician accounts can update musician profiles")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    await db.musicians.update_one(
        {"user_id": current_user["id"]},
        {"$set": data.model_dump()}
    )
    
    updated = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    return MusicianProfileResponse(**updated)

@api_router.get("/musicians/me", response_model=MusicianProfileResponse)
async def get_my_musician_profile(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musician accounts can access this")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    return MusicianProfileResponse(**musician)

@api_router.get("/musicians", response_model=List[MusicianProfileResponse])
async def list_musicians(instrument: Optional[str] = None, style: Optional[str] = None):
    query = {}
    if instrument:
        query["instruments"] = {"$in": [instrument]}
    if style:
        query["music_styles"] = {"$in": [style]}
    
    musicians = await db.musicians.find(query, {"_id": 0}).to_list(100)
    return [MusicianProfileResponse(**m) for m in musicians]

# ============= PAYMENT ROUTES =============

SUBSCRIPTION_PRICE = 10.00  # 10€/month

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
        metadata={
            "user_id": current_user["id"],
            "email": current_user["email"],
            "type": "venue_subscription"
        }
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
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
    
    # Update transaction in database
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    
    if transaction and transaction.get("payment_status") != "paid":
        if status.payment_status == "paid":
            # Update transaction
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "status": "completed",
                    "payment_status": "paid",
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Update user subscription
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$set": {
                    "subscription_status": "active",
                    "subscription_started": datetime.now(timezone.utc).isoformat()
                }}
            )
        elif status.status == "expired":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"status": "expired", "payment_status": "failed"}}
            )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

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
                await db.users.update_one(
                    {"id": user_id},
                    {"$set": {"subscription_status": "active"}}
                )
                
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {"status": "completed", "payment_status": "paid"}}
                )
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}

# ============= HEALTH CHECK =============

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
