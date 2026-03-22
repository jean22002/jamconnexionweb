"""
Object Storage utilities for file uploads (invoices, receipts, etc.)
Uses Emergent Object Storage API
"""
import os
import requests
import logging
from typing import Tuple, Optional

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


def generate_storage_path(user_id: str, file_id: str, extension: str) -> str:
    """
    Generate standardized storage path
    Format: {app_name}/invoices/{user_id}/{file_id}.{ext}
    """
    return f"{APP_NAME}/invoices/{user_id}/{file_id}.{extension}"
