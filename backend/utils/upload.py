import aiofiles
from pathlib import Path
from fastapi import UploadFile
import uuid

ROOT_DIR = Path(__file__).parent.parent
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

async def save_upload_file(file: UploadFile, folder: str = "") -> str:
    """Save uploaded file and return its URL path"""
    if folder:
        target_dir = UPLOADS_DIR / folder
        target_dir.mkdir(exist_ok=True)
    else:
        target_dir = UPLOADS_DIR
    
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = target_dir / unique_filename
    
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    
    if folder:
        return f"/uploads/{folder}/{unique_filename}"
    return f"/uploads/{unique_filename}"
