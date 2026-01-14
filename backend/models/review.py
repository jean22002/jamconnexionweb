from pydantic import BaseModel
from typing import Optional

class ReviewCreate(BaseModel):
    venue_id: str
    rating: int  # 1-5 stars
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: str
    venue_id: str
    musician_id: str
    musician_name: str
    musician_image: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    venue_response: Optional[str] = None
    venue_response_date: Optional[str] = None
    is_reported: bool = False
    created_at: str

class ReviewResponseRequest(BaseModel):
    response: str
