from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
import stripe

# Import utility functions
from utils import geocode_city

ROOT_DIR = Path(__file__).parent
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
import routes.badges as badges
import routes.push_notifications as push_notifications
import routes.friends as friends
import routes.reports as reports

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
badges.set_db(db)
push_notifications.set_db(db)

# Include domain-specific routers
api_router.include_router(melomanes.router)
api_router.include_router(musicians.router)
api_router.include_router(venues.router)
api_router.include_router(events.router)
api_router.include_router(planning.router)
api_router.include_router(bands.router)
api_router.include_router(badges.router)
api_router.include_router(push_notifications.router)
api_router.include_router(friends.router)

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

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Startup event
@app.on_event("startup")
async def startup_db_client():
    logger.info("Connected to MongoDB")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logger.info("Disconnected from MongoDB")
