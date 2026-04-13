from pydantic import BaseModel
from typing import Optional


class ModerationSettings(BaseModel):
    """Settings for moderation thresholds"""
    # Report thresholds
    auto_ban_report_threshold: int = 5  # Number of reports before auto-ban
    temp_ban_duration_days: int = 7  # Duration of temporary ban
    
    # Gamification thresholds
    pioneer_badge_threshold: int = 100  # Number of early users
    social_butterfly_participation_threshold: int = 10  # Events to unlock badge
    jam_master_participation_threshold: int = 25  # Jams to unlock badge
    
    # Notification settings
    notification_radius_default_km: int = 50  # Default notification radius for melomanes
    nearby_musician_radius_km: int = 70  # Radius for nearby musician notifications
    
    # Content moderation
    auto_review_threshold: int = 3  # Number of reports before auto-review
    
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None


class ModerationSettingsUpdate(BaseModel):
    """Payload for updating moderation settings"""
    auto_ban_report_threshold: Optional[int] = None
    temp_ban_duration_days: Optional[int] = None
    pioneer_badge_threshold: Optional[int] = None
    social_butterfly_participation_threshold: Optional[int] = None
    jam_master_participation_threshold: Optional[int] = None
    notification_radius_default_km: Optional[int] = None
    nearby_musician_radius_km: Optional[int] = None
    auto_review_threshold: Optional[int] = None
