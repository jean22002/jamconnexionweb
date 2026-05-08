import aiofiles
from pathlib import Path
from fastapi import UploadFile
import uuid
import asyncio
from .image_optimizer import optimize_image

ROOT_DIR = Path(__file__).parent.parent
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# Extensions d'images à optimiser
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif'}

async def save_upload_file(file: UploadFile, folder: str = "", optimize: bool = True) -> str:
    """
    Save uploaded file and return its URL path
    
    Args:
        file: UploadFile object
        folder: Subfolder in uploads directory
        optimize: If True, automatically convert images to WebP
    
    Returns:
        URL path to the saved file
    """
    if folder:
        target_dir = UPLOADS_DIR / folder
        target_dir.mkdir(exist_ok=True, parents=True)
    else:
        target_dir = UPLOADS_DIR
    
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = target_dir / unique_filename
    
    # Save original file
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    
    # Optimize image if it's an image file
    is_image = f".{file_extension.lower()}" in IMAGE_EXTENSIONS
    if optimize and is_image:
        # Run optimization in background to avoid blocking
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            _optimize_image_sync,
            str(file_path)
        )
        
        # Change extension to .webp in the URL
        unique_filename = unique_filename.rsplit('.', 1)[0] + '.webp'
    
    if folder:
        return f"/api/uploads/{folder}/{unique_filename}"
    return f"/api/uploads/{unique_filename}"

def _optimize_image_sync(file_path: str):
    """Synchronous wrapper for image optimization"""
    try:
        result = optimize_image(
            file_path,
            convert_to_webp=True,
            quality=85
        )
        if result.get('success'):
            # Remove original file after successful WebP conversion
            import os
            if os.path.exists(file_path):
                os.remove(file_path)
        return result
    except Exception as e:
        print(f"Error optimizing image {file_path}: {e}")
        return {'success': False, 'error': str(e)}
