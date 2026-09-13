"""
Legacy upload utility — refactored to use Emergent Object Storage.
Build 152.23 — Local pod filesystem is ephemeral in production, so all uploads
are now sent to Object Storage. Callers still receive a URL path they can store
in Mongo (`/api/files/{path}` served by routes/files.py).
"""
from fastapi import UploadFile
import mimetypes

from .storage import upload_image, upload_document

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif', '.webp'}


async def save_upload_file(file: UploadFile, folder: str = "", optimize: bool = True) -> str:
    """
    Save an uploaded file to Emergent Object Storage.

    Args:
        file: FastAPI UploadFile
        folder: Storage folder (venue-gallery, events, etc.)
        optimize: If True and the file is an image → resize + WebP

    Returns:
        Public-facing URL served by /api/files/{path}
    """
    content = await file.read()
    filename = file.filename or "upload.bin"
    extension = f".{filename.rsplit('.', 1)[-1].lower()}" if "." in filename else ""
    is_image = extension in IMAGE_EXTENSIONS

    # `user_id` is only used to shard the storage path — we use the folder name
    # here since the legacy signature doesn't carry the user context.
    owner = folder or "generic"
    storage_folder = folder or "uploads"

    if optimize and is_image:
        result = upload_image(content, user_id=owner, image_type="standard", folder=storage_folder)
    else:
        content_type = file.content_type or mimetypes.guess_type(filename)[0] or "application/octet-stream"
        result = upload_document(content, user_id=owner, filename=filename, content_type=content_type, folder=storage_folder)

    return result["url"]
