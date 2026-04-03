"""
Object Storage utilities for file uploads (invoices, receipts, images, etc.)
Uses Emergent Object Storage API with image optimization
"""
import os
import requests
import logging
from typing import Tuple, Optional
from io import BytesIO
from PIL import Image
import uuid

logger = logging.getLogger(__name__)

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "jamconnexion"  # Prefix for all file paths
storage_key = None  # Module-level, set once and reused globally

ALLOWED_MIME_TYPES = {
    "application/pdf": ["pdf"],
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"]
}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# Image optimization settings
IMAGE_QUALITY = 85  # JPEG quality
MAX_IMAGE_WIDTH = 1920  # Max width for full images
MAX_IMAGE_HEIGHT = 1080  # Max height for full images
THUMBNAIL_SIZE = (300, 300)  # Thumbnail dimensions
PROFILE_SIZE = (800, 800)  # Profile image dimensions


def init_storage() -> str:
    """
    Initialize storage connection. Call ONCE at startup.
    Returns a session-scoped, reusable storage_key.
    """
    global storage_key
    
    if storage_key:
        return storage_key
    
    if not EMERGENT_KEY:
        raise ValueError("EMERGENT_LLM_KEY not set in environment")
    
    try:
        resp = requests.post(
            f"{STORAGE_URL}/init",
            json={"emergent_key": EMERGENT_KEY},
            timeout=30
        )
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("✅ Object storage initialized successfully")
        return storage_key
    except Exception as e:
        logger.error(f"❌ Failed to initialize storage: {e}")
        raise


def validate_file(content: bytes, content_type: str, filename: str) -> Tuple[bool, Optional[str]]:
    """
    Validate file size and type
    Returns (is_valid, error_message)
    """
    # Check size
    if len(content) > MAX_FILE_SIZE:
        return False, f"File size exceeds maximum of {MAX_FILE_SIZE / 1024 / 1024}MB"
    
    # Check content type
    if content_type not in ALLOWED_MIME_TYPES:
        return False, f"File type {content_type} not allowed. Allowed: PDF, JPEG, PNG, WebP"
    
    # Check extension
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_MIME_TYPES[content_type]:
        return False, f"File extension .{ext} does not match content type {content_type}"
    
    return True, None


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """
    Upload file to storage.
    Returns {"path": "...", "size": 123, "etag": "..."}
    """
    key = init_storage()
    
    try:
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={
                "X-Storage-Key": key,
                "Content-Type": content_type
            },
            data=data,
            timeout=120
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Failed to upload file to {path}: {e}")
        raise


def get_object(path: str) -> Tuple[bytes, str]:
    """
    Download file from storage.
    Returns (content_bytes, content_type)
    """
    key = init_storage()
    
    try:
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
            timeout=60
        )
        resp.raise_for_status()
        return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
    except Exception as e:
        logger.error(f"Failed to download file from {path}: {e}")
        raise


def generate_storage_path(user_id: str, file_id: str, extension: str, file_type: str = "invoices") -> str:
    """
    Generate standardized storage path
    Format: {app_name}/{file_type}/{user_id}/{file_id}.{ext}
    file_type: invoices, profiles, covers, events, thumbnails
    """
    return f"{APP_NAME}/{file_type}/{user_id}/{file_id}.{extension}"


def optimize_image(image_data: bytes, image_type: str = "standard") -> Tuple[bytes, str]:
    """
    Optimize image: resize, compress, convert to WebP
    
    Args:
        image_data: Raw image bytes
        image_type: 'profile' (800x800), 'cover' (1920x400), 'thumbnail' (300x300), 'standard' (1920x1080)
    
    Returns:
        (optimized_bytes, content_type)
    """
    try:
        # Open image
        img = Image.open(BytesIO(image_data))
        
        # Convert RGBA to RGB for JPEG/WebP
        if img.mode in ('RGBA', 'LA', 'P'):
            # Create white background
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize based on type
        if image_type == 'profile':
            # Square crop for profile
            size = min(img.size)
            left = (img.width - size) // 2
            top = (img.height - size) // 2
            img = img.crop((left, top, left + size, top + size))
            img.thumbnail(PROFILE_SIZE, Image.Resampling.LANCZOS)
        
        elif image_type == 'cover':
            # Wide aspect ratio for cover (16:9 or similar)
            target_ratio = 4.8  # 1920/400
            current_ratio = img.width / img.height
            
            if current_ratio > target_ratio:
                # Too wide, crop width
                new_width = int(img.height * target_ratio)
                left = (img.width - new_width) // 2
                img = img.crop((left, 0, left + new_width, img.height))
            else:
                # Too tall, crop height
                new_height = int(img.width / target_ratio)
                top = (img.height - new_height) // 2
                img = img.crop((0, top, img.width, top + new_height))
            
            img.thumbnail((1920, 400), Image.Resampling.LANCZOS)
        
        elif image_type == 'thumbnail':
            img.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
        
        else:  # standard
            img.thumbnail((MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT), Image.Resampling.LANCZOS)
        
        # Save as WebP (better compression)
        output = BytesIO()
        img.save(output, format='WEBP', quality=IMAGE_QUALITY, method=6)
        output.seek(0)
        
        return output.read(), "image/webp"
    
    except Exception as e:
        logger.error(f"Image optimization failed: {e}")
        # Return original if optimization fails
        return image_data, "image/jpeg"


def upload_image(
    image_data: bytes,
    user_id: str,
    image_type: str = "standard",
    folder: str = "images"
) -> dict:
    """
    Upload and optimize an image
    
    Args:
        image_data: Raw image bytes
        user_id: User ID
        image_type: 'profile', 'cover', 'thumbnail', 'standard'
        folder: Storage folder (profiles, covers, events)
    
    Returns:
        {
            "url": "https://...",
            "path": "jamconnexion/...",
            "size": 12345,
            "thumbnail_url": "https://..." (if applicable)
        }
    """
    # Generate unique file ID
    file_id = str(uuid.uuid4())
    
    # Optimize image
    optimized_data, content_type = optimize_image(image_data, image_type)
    
    # Upload main image
    path = generate_storage_path(user_id, file_id, "webp", folder)
    result = put_object(path, optimized_data, content_type)
    
    # Generate public URL
    url = f"{STORAGE_URL}/objects/{path}"
    
    response = {
        "url": url,
        "path": path,
        "size": result.get("size", len(optimized_data))
    }
    
    # Create thumbnail for events/galleries
    if folder == "events" and image_type == "standard":
        thumb_data, thumb_type = optimize_image(image_data, "thumbnail")
        thumb_path = generate_storage_path(user_id, f"{file_id}_thumb", "webp", "thumbnails")
        put_object(thumb_path, thumb_data, thumb_type)
        response["thumbnail_url"] = f"{STORAGE_URL}/objects/{thumb_path}"
    
    return response
