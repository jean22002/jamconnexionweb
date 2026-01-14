from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
load_dotenv(ROOT_DIR / '.env')

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Import routers
from routes import auth_router, uploads_router

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

# Mount static files
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Create main API router
api_router = APIRouter(prefix="/api")

# Include all route modules
api_router.include_router(auth_router)
api_router.include_router(uploads_router)

# TODO: Add remaining routers progressively
# api_router.include_router(musicians_router)
# api_router.include_router(venues_router)
# api_router.include_router(events_router)
# api_router.include_router(messages_router)
# api_router.include_router(payments_router)
# api_router.include_router(reviews_router)

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
