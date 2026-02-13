from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Badge(BaseModel):
    """Badge model for gamification"""
    id: str
    name: str
    description: str
    icon: str  # Emoji or icon name
    category: str  # 'musician', 'venue', 'melomane', 'universal'
    tier: str  # 'bronze', 'silver', 'gold', 'platinum', 'legendary'
    requirement_type: str  # 'event_count', 'venue_visit', 'friend_count', 'streak', etc.
    requirement_value: int  # Threshold to unlock
    points: int  # Gamification points awarded
    is_secret: bool = False  # Hidden until unlocked
    unlock_message: str
    created_at: str

class UserBadge(BaseModel):
    """User's earned badge"""
    id: str
    user_id: str
    badge_id: str
    unlocked_at: str
    progress: Optional[int] = None  # Current progress towards next tier
    
class BadgeResponse(BaseModel):
    """Response model for badge with unlock status"""
    id: str
    name: str
    description: str
    icon: str
    category: str
    tier: str
    requirement_type: str
    requirement_value: int
    points: int
    is_secret: bool
    unlock_message: str
    unlocked: bool = False
    unlocked_at: Optional[str] = None
    progress: Optional[int] = None
    progress_percentage: Optional[float] = None

class UserStatsResponse(BaseModel):
    """User gamification stats"""
    user_id: str
    total_points: int
    badges_count: int
    badges_by_tier: dict
    level: int
    level_progress: float
    next_level_points: int
    rank: Optional[str] = None
