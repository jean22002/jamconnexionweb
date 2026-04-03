from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Request
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging

from utils import get_current_user
from utils.storage import upload_image, validate_file
from middleware.rate_limit import limiter

router = APIRouter(prefix="/upload", tags=["Uploads"])

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

logger = logging.getLogger(__name__)


async def process_image_upload(file: UploadFile, user_id: str, image_type: str, folder: str) -> dict:
    """
    Process and upload an image with validation and optimization
    
    Args:
        file: Uploaded file
        user_id: User ID
        image_type: 'profile', 'cover', 'standard'
        folder: Storage folder
    
    Returns:
        {"url": "...", "thumbnail_url": "..." (optional)}
    """
    # Read file content
    content = await file.read()
    
    # Validate file
    content_type = file.content_type or "image/jpeg"
    is_valid, error = validate_file(content, content_type, file.filename or "image.jpg")
    
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    # Upload and optimize
    try:
        result = upload_image(content, user_id, image_type, folder)
        return result
    except Exception as e:
        logger.error(f"Image upload failed: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'upload de l'image")

@router.post("/image")
@limiter.limit("20/hour")
async def upload_image_generic(
    request: Request,
    file: UploadFile = File(...),
    folder: str = "images",
    current_user: dict = Depends(get_current_user)
):
    """Upload an image file and return the URL (generic endpoint)"""
    result = await process_image_upload(file, current_user["id"], "standard", folder)
    return {
        "url": result["url"],
        "filename": file.filename,
        "size": result["size"]
    }


@router.post("/musician-photo")
@limiter.limit("20/hour")
async def upload_musician_photo(
    request: Request,
    file: UploadFile = File(...),
    photo_type: str = "profile",  # 'profile' or 'cover'
    current_user: dict = Depends(get_current_user)
):
    """
    Upload musician profile or cover photo with optimization
    Returns URL to use in profile update
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can upload musician photos")
    
    image_type = "profile" if photo_type == "profile" else "cover"
    folder = "profiles" if photo_type == "profile" else "covers"
    
    result = await process_image_upload(file, current_user["id"], image_type, folder)
    
    return {
        "url": result["url"],
        "type": photo_type,
        "size": result["size"]
    }


@router.post("/band-photo")
@limiter.limit("20/hour")
async def upload_band_photo(
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload band photo with optimization
    Returns URL to use when saving band info
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can upload band photos")
    
    result = await process_image_upload(file, current_user["id"], "profile", "bands")
    
    return {
        "url": result["url"],
        "size": result["size"]
    }


@router.post("/venue-photo")
@limiter.limit("20/hour")
async def upload_venue_photo(
    request: Request,
    file: UploadFile = File(...),
    photo_type: str = "profile",  # 'profile' or 'cover'
    current_user: dict = Depends(get_current_user)
):
    """
    Upload venue profile or cover photo with optimization
    Returns URL to use in profile update
    """
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can upload venue photos")
    
    image_type = "profile" if photo_type == "profile" else "cover"
    folder = "profiles" if photo_type == "profile" else "covers"
    
    result = await process_image_upload(file, current_user["id"], image_type, folder)
    
    return {
        "url": result["url"],
        "type": photo_type,
        "size": result["size"]
    }


@router.post("/event-photo")
@limiter.limit("30/hour")
async def upload_event_photo(
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload event photo with optimization and thumbnail generation
    Returns URL and thumbnail URL
    """
    result = await process_image_upload(file, current_user["id"], "standard", "events")
    
    response = {
        "url": result["url"],
        "size": result["size"]
    }
    
    if "thumbnail_url" in result:
        response["thumbnail_url"] = result["thumbnail_url"]
    
    return response
