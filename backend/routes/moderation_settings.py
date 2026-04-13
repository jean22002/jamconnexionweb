from fastapi import APIRouter, HTTPException, Depends, Header
from datetime import datetime, timezone
from models.moderation import ModerationSettings, ModerationSettingsUpdate

router = APIRouter(prefix="/admin/moderation-settings", tags=["Moderation Settings"])

# DB will be injected by the main server
db = None

def set_db(database):
    global db
    db = database

async def get_current_user_local(authorization: str = Header(None)):
    """Import get_current_user locally to avoid circular imports"""
    from utils import get_current_user
    return await get_current_user(request=None, authorization=authorization, db=db)

async def verify_admin(current_user: dict = Depends(get_current_user_local)):
    """Verify that the current user is an admin"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("", response_model=ModerationSettings)
async def get_moderation_settings(current_user: dict = Depends(verify_admin)):
    """Get current moderation settings"""
    settings = await db.moderation_settings.find_one({}, {"_id": 0})
    
    if not settings:
        # Return default settings if none exist
        default_settings = ModerationSettings()
        return default_settings
    
    return ModerationSettings(**settings)


@router.put("", response_model=ModerationSettings)
async def update_moderation_settings(
    updates: ModerationSettingsUpdate,
    current_user: dict = Depends(verify_admin)
):
    """Update moderation settings (admin only)"""
    # Get current settings or create defaults
    current_settings = await db.moderation_settings.find_one({}, {"_id": 0})
    
    if not current_settings:
        current_settings = ModerationSettings().dict()
    
    # Update only provided fields
    update_data = updates.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["updated_by"] = current_user["id"]
    
    # Merge with current settings
    for key, value in update_data.items():
        current_settings[key] = value
    
    # Upsert to database
    await db.moderation_settings.update_one(
        {},  # Match any document (there should only be one)
        {"$set": current_settings},
        upsert=True
    )
    
    return ModerationSettings(**current_settings)


@router.post("/reset")
async def reset_to_defaults(current_user: dict = Depends(verify_admin)):
    """Reset moderation settings to defaults"""
    default_settings = ModerationSettings()
    default_settings.updated_at = datetime.now(timezone.utc).isoformat()
    default_settings.updated_by = current_user["id"]
    
    await db.moderation_settings.delete_many({})
    await db.moderation_settings.insert_one(default_settings.dict())
    
    return {"message": "Moderation settings reset to defaults", "settings": default_settings}
