from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging

from utils import get_current_user, save_upload_file

router = APIRouter(prefix="/upload", tags=["Uploads"])

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

logger = logging.getLogger(__name__)

@router.post("/image")
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

@router.post("/musician-photo")
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

@router.post("/band-photo")
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

@router.post("/venue-photo")
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
