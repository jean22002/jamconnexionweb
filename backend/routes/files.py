"""
Public file proxy for Object Storage
Serves files from authenticated storage to public browsers
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from utils.storage import get_object
import logging

router = APIRouter(prefix="/files", tags=["files"])
logger = logging.getLogger(__name__)

@router.get("/{full_path:path}")
async def serve_file(full_path: str):
    """
    Public proxy endpoint to serve files from Object Storage
    Fetches file from authenticated storage and returns it to browser
    
    Example: GET /api/files/jamconnexion/profiles/user-id/file.webp
    """
    try:
        # Fetch file from storage (authenticated)
        file_data, content_type = get_object(full_path)
        
        if not file_data:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Return file with proper headers for browser caching
        return Response(
            content=file_data,
            media_type=content_type or "application/octet-stream",
            headers={
                "Cache-Control": "public, max-age=31536000, immutable",  # 1 year cache
                "Access-Control-Allow-Origin": "*",  # Allow CORS for images
            }
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        logger.error(f"Error serving file {full_path}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving file")
