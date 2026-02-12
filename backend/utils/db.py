"""
Database utility functions
"""
import re
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
import os

# MongoDB connection singleton
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME')]


def get_db():
    """Get database instance"""
    return db


def normalize_image_url(url: Optional[str]) -> Optional[str]:
    """
    Normalize image URLs to ensure consistency in storage.
    Converts full URLs to relative paths starting with /api/uploads/
    Handles edge cases like double /api/ prefixes.
    
    Args:
        url: The URL to normalize
        
    Returns:
        Normalized URL or None if input is empty
        
    Examples:
        >>> normalize_image_url("https://example.com/api/uploads/image.jpg")
        "/api/uploads/image.jpg"
        >>> normalize_image_url("/api/api/uploads/image.jpg")
        "/api/uploads/image.jpg"
    """
    if not url or not url.strip():
        return None
    
    # Remove any http(s):// protocol and domain
    normalized = re.sub(r'https?://[^/]+', '', url)
    
    # Fix double /api/ prefix (e.g., /api/api/uploads → /api/uploads)
    normalized = re.sub(r'/api/api/', '/api/', normalized)
    
    # Ensure it starts with /api/uploads if it's an upload path
    if 'uploads' in normalized and not normalized.startswith('/api/uploads'):
        normalized = re.sub(r'^/?(uploads/)', r'/api/uploads/', normalized)
    
    return normalized if normalized else None
