from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request, UploadFile, File
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
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

