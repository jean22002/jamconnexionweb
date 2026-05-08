from pydantic import BaseModel, Field
from typing import Optional

class ReviewCreate(BaseModel):
    venue_id: str
    event_id: str = Field(..., description="ID de l'événement terminé")
    
    # Note globale + critères
    overall_rating: float = Field(..., ge=1, le=5, description="Note globale (1-5)")
    ambiance_rating: Optional[float] = Field(None, ge=1, le=5)
    quality_rating: Optional[float] = Field(None, ge=1, le=5)
    professionalism_rating: Optional[float] = Field(None, ge=1, le=5)
    
    comment: Optional[str] = Field(None, max_length=1000)

class ReviewResponse(BaseModel):
    id: str
    venue_id: str
    musician_id: str
    musician_name: str
    musician_image: Optional[str] = None
    event_id: str
    event_title: Optional[str] = None
    
    # Ratings
    overall_rating: float
    ambiance_rating: Optional[float] = None
    quality_rating: Optional[float] = None
    professionalism_rating: Optional[float] = None
    
    comment: Optional[str] = None
    venue_response: Optional[str] = None
    venue_response_date: Optional[str] = None
    is_reported: bool = False
    created_at: str

class ReviewResponseRequest(BaseModel):
    response: str
