from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.gzip import GZipMiddleware  # NEW: Gzip compression
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
import logging
from pathlib import Path
import stripe

# Import performance optimization middlewares
from middleware.cache_headers import CacheHeadersMiddleware
from middleware.rate_limit import limiter, rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# Import utility functions
from utils import geocode_city

ROOT_DIR = Path(__file__).parent
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

load_dotenv(ROOT_DIR / '.env')

# Setup logging FIRST
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB connection - Use production URL if ENVIRONMENT is production
environment = os.environ.get('ENVIRONMENT', 'development')
if environment == 'production':
    mongo_url = os.environ.get('MONGO_URL_PRODUCTION', os.environ['MONGO_URL'])
    logger.info(f"🌍 Using PRODUCTION MongoDB: {mongo_url.split('@')[1] if '@' in mongo_url else 'Atlas'}")
else:
    mongo_url = os.environ['MONGO_URL']
    logger.info("💻 Using DEVELOPMENT MongoDB: localhost:27017")

# MongoDB Connection with Optimized Pooling
client = AsyncIOMotorClient(
    mongo_url,
    maxPoolSize=100,           # Maximum 100 concurrent connections
    minPoolSize=10,            # Keep 10 connections always open
    maxIdleTimeMS=45000,       # Close idle connections after 45s
    serverSelectionTimeoutMS=5000,  # Timeout for server selection
    connectTimeoutMS=10000,    # Connection timeout
    socketTimeoutMS=45000,     # Socket timeout
    retryWrites=True,          # Retry failed writes
    retryReads=True            # Retry failed reads
)
db = client[os.environ['DB_NAME']]
logger.info("✅ MongoDB Connection Pool configured: maxPoolSize=100, minPoolSize=10")

# Stripe configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
STRIPE_PRICE_ID = os.environ.get('STRIPE_PRICE_ID', 'price_1SpH8aBykagrgoTUBAdOU10z')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')
SUBSCRIPTION_PRICE = 12.99
stripe.api_key = STRIPE_API_KEY

# Create FastAPI app
app = FastAPI(
    title="Jam Connexion API",
    description="API for connecting musicians with venues",
    version="2.0.0"
)

# Add rate limiter state to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# PERFORMANCE OPTIMIZATION MIDDLEWARES (Order matters!)
# 1. Gzip Compression - Compress responses (must be first for compression)
app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,  # Only compress responses larger than 1KB
    compresslevel=6     # Balance between speed and compression ratio (1-9)
)

# 2. CORS Configuration (Must be after Gzip for headers to work)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # Keep wildcard for backward compatibility
        "https://*.preview.emergentagent.com",  # Mobile development
        "https://preview.emergentagent.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Cache-Control", "CDN-Cache-Control", "Retry-After"]
)

# 3. Cache Headers Middleware - Adds Cache-Control headers
app.add_middleware(CacheHeadersMiddleware)

logger.info("✅ Performance middlewares configured: Gzip, Cache Headers, Rate Limiting")

# Create main API router
api_router = APIRouter(prefix="/api")

# Mount static files for uploads under /api prefix
app.mount("/api/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Import and include refactored routers
from routes import (
    auth_router, account_router, uploads_router, 
    payments_router, webhooks_router,
    messages_router, reviews_router, notifications_router
)
import routes.messages as messages
import routes.reviews as reviews
import routes.notifications as notifications
import routes.melomanes as melomanes
import routes.musicians as musicians
import routes.venues as venues
import routes.events as events
import routes.planning as planning
import routes.bands as bands
import routes.band_invitations as band_invitations  # NEW: Band member invitations
import routes.badges as badges
import routes.push_notifications as push_notifications
import routes.friends as friends
import routes.reports as reports
import routes.analytics as analytics
import routes.audit as audit  # NEW: Audit logging
import routes.online_status as online_status
import routes.accounting as accounting
import routes.firebase_push as firebase_push
import routes.chat as chat
import routes.config as config  # NEW: Configuration endpoint for mobile

# Include routers with basic functionality
api_router.include_router(auth_router)
api_router.include_router(account_router)
api_router.include_router(uploads_router)
api_router.include_router(payments_router)
api_router.include_router(webhooks_router)
api_router.include_router(messages_router)
api_router.include_router(reviews_router)
api_router.include_router(notifications_router)

# Inject DB connection to routers that need it
messages.set_db(db)
reviews.set_db(db)
notifications.set_db(db)
melomanes.set_db(db)
musicians.set_db(db)
events.set_db(db)
planning.set_db(db)
bands.set_db(db)
band_invitations.db = db  # NEW: Band invitations
badges.set_db(db)
push_notifications.set_db(db)
reports.set_db(db)
analytics.set_db(db)
audit.set_db(db)  # NEW: Audit logging
accounting.set_db(db)
firebase_push.set_db(db)
chat.set_db(db)

# Include domain-specific routers
api_router.include_router(melomanes.router)
api_router.include_router(musicians.router)
api_router.include_router(venues.router)
api_router.include_router(events.router)
api_router.include_router(planning.router)
api_router.include_router(bands.router)
api_router.include_router(band_invitations.router)  # NEW: Band invitations
api_router.include_router(badges.router)
api_router.include_router(push_notifications.router)
api_router.include_router(friends.router)
api_router.include_router(reports.router)
api_router.include_router(analytics.router)
api_router.include_router(audit.router)  # NEW: Audit logging
api_router.include_router(online_status.router)
api_router.include_router(accounting.router, prefix="/accounting", tags=["Accounting"])
api_router.include_router(firebase_push.router)
api_router.include_router(chat.router)
api_router.include_router(config.router)  # NEW: Mobile app configuration

# Stats endpoint for Landing page
@api_router.get("/stats/counts")
async def get_stats_counts():
    """Return public counts for the landing page"""
    musicians_count = await db.musicians.count_documents({})
    venues_count = await db.venues.count_documents({})
    return {"musicians": musicians_count, "venues": venues_count}

# Geocoding utility endpoint
@api_router.post("/geocode")
async def geocode_address(data: dict):
    """Geocode a city and postal code to get coordinates"""
    city = data.get("city")
    postal_code = data.get("postal_code")
    
    if not city:
        raise HTTPException(status_code=400, detail="City is required")
    
    try:
        latitude, longitude = await geocode_city(city)
        
        if not latitude or not longitude:
            raise HTTPException(status_code=404, detail="Unable to geocode the provided address")
        
        return {
            "latitude": latitude,
            "longitude": longitude,
            "city": city,
            "postal_code": postal_code
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Geocoding error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error during geocoding")

# Include main API router
app.include_router(api_router)

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Jam Connexion API v2.0", "status": "healthy"}

# Health check endpoint (at root level for local testing)
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Health check endpoint under /api for external access through ingress
@app.get("/api/health")
def api_health_check():
    return {"status": "healthy"}

# Startup event
@app.on_event("startup")
async def startup_db_client():
    logger.info("Connected to MongoDB")
    
    # Initialize object storage
    try:
        from utils.storage import init_storage
        init_storage()
    except Exception as e:
        logger.warning(f"⚠️  Object storage init failed (non-critical): {e}")
    
    # Initialize Firebase (for mobile push notifications)
    try:
        from firebase_config import initialize_firebase
        if initialize_firebase():
            logger.info("✅ Firebase Cloud Messaging initialized")
        else:
            logger.warning("⚠️  Firebase not initialized (credentials missing). Mobile push notifications disabled.")
    except Exception as e:
        logger.warning(f"⚠️  Firebase init failed (non-critical): {e}")
    
    # Initialize WebSocket (Socket.IO for real-time chat)
    try:
        from websocket import init_websocket, set_db as ws_set_db
        ws_set_db(db)
        init_websocket(app)
        logger.info("✅ WebSocket Socket.IO initialized for real-time chat")
    except Exception as e:
        logger.error(f"❌ WebSocket init failed: {e}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logger.info("Disconnected from MongoDB")
