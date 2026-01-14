from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from typing import List
import os
import uuid

from models import ReviewCreate, ReviewResponse, ReviewResponseRequest
from utils import get_current_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

@router.post("", response_model=ReviewResponse)
async def create_review(data: ReviewCreate, current_user: dict = Depends(get_current_user)):
    """Create a review for a venue"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can write reviews")
    
    # Check if venue exists
    venue = await db.venues.find_one({"id": data.venue_id}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    # Check if musician already reviewed this venue
    existing = await db.reviews.find_one({
        "venue_id": data.venue_id,
        "musician_id": current_user["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà laissé un avis pour cet établissement")
    
    # Get musician profile
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    review_doc = {
        "id": str(uuid.uuid4()),
        "venue_id": data.venue_id,
        "musician_id": current_user["id"],
        "musician_name": musician.get("pseudo", current_user["name"]),
        "musician_image": musician.get("profile_image"),
        "rating": data.rating,
        "comment": data.comment,
        "venue_response": None,
        "venue_response_date": None,
        "is_reported": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review_doc)
    
    return ReviewResponse(**review_doc)

@router.post("/{review_id}/respond")
async def respond_to_review(review_id: str, data: ReviewResponseRequest, current_user: dict = Depends(get_current_user)):
    """Venue responds to a review"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can respond to reviews")
    
    # Get venue
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Get review and verify it belongs to this venue
    review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if review["venue_id"] != venue["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.reviews.update_one(
        {"id": review_id},
        {"$set": {
            "venue_response": data.response,
            "venue_response_date": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Response added successfully"}

@router.delete("/{review_id}")
async def delete_review(review_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a review (only by the author)"""
    review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if review["musician_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.reviews.delete_one({"id": review_id})
    
    return {"message": "Review deleted"}

@router.post("/{review_id}/report")
async def report_review(review_id: str, current_user: dict = Depends(get_current_user)):
    """Report a review as inappropriate"""
    review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    await db.reviews.update_one(
        {"id": review_id},
        {"$set": {"is_reported": True}}
    )
    
    return {"message": "Review reported"}
