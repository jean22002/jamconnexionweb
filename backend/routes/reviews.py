from fastapi import APIRouter, HTTPException, Depends, Header
from datetime import datetime, timezone
from typing import List
import uuid

from models import ReviewCreate, ReviewResponse, ReviewResponseRequest

router = APIRouter(prefix="/reviews", tags=["Reviews"])

# DB will be injected by the main server
db = None

def set_db(database):
    global db
    db = database

async def get_current_user_local(authorization: str = Header(None)):
    """Import get_current_user locally to avoid circular imports"""
    from utils import get_current_user
    return await get_current_user(authorization, db)

@router.post("", response_model=ReviewResponse)
async def create_review(data: ReviewCreate, current_user: dict = Depends(get_current_user_local)):
    """Create a review for a venue (only after event is finished)"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Seuls les musiciens peuvent laisser des avis")
    
    # Check if venue exists
    venue = await db.venues.find_one({"id": data.venue_id}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Établissement non trouvé")
    
    # Check if event exists and is finished
    event = None
    event_title = None
    
    # Search in all event collections (jams, concerts, karaoke, spectacles)
    for collection_name in ["jams", "concerts", "karaoke_events", "spectacle_events"]:
        event = await db[collection_name].find_one({"id": data.event_id}, {"_id": 0})
        if event:
            event_title = event.get("title", event.get("theme", ""))
            break
    
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    # Verify event is finished (date in the past)
    event_date_str = event.get("date") or event.get("start_date")
    if event_date_str:
        try:
            from dateutil import parser
            event_date = parser.parse(event_date_str)
            now = datetime.now(timezone.utc)
            if event_date > now:
                raise HTTPException(
                    status_code=400, 
                    detail="Vous ne pouvez laisser un avis qu'après la fin de l'événement"
                )
        except Exception:
            pass  # Si parsing échoue, on laisse passer
    
    # Check if venue matches event
    if event.get("venue_id") != data.venue_id:
        raise HTTPException(status_code=400, detail="L'événement n'est pas associé à cet établissement")
    
    # Check if musician already reviewed this event
    existing = await db.reviews.find_one({
        "event_id": data.event_id,
        "musician_id": current_user["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà laissé un avis pour cet événement")
    
    # Get musician profile
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Profil musicien non trouvé")
    
    review_doc = {
        "id": str(uuid.uuid4()),
        "venue_id": data.venue_id,
        "event_id": data.event_id,
        "event_title": event_title,
        "musician_id": current_user["id"],
        "musician_name": musician.get("pseudo", current_user["name"]),
        "musician_image": musician.get("profile_image"),
        "overall_rating": data.overall_rating,
        "ambiance_rating": data.ambiance_rating,
        "quality_rating": data.quality_rating,
        "professionalism_rating": data.professionalism_rating,
        "comment": data.comment,
        "venue_response": None,
        "venue_response_date": None,
        "is_reported": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review_doc)
    
    return ReviewResponse(**review_doc)

@router.post("/{review_id}/respond")
async def respond_to_review(review_id: str, data: ReviewResponseRequest, current_user: dict = Depends(get_current_user_local)):
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
async def delete_review(review_id: str, current_user: dict = Depends(get_current_user_local)):
    """Delete a review (only by the author)"""
    review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if review["musician_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.reviews.delete_one({"id": review_id})
    
    return {"message": "Review deleted"}

@router.post("/{review_id}/report")
async def report_review(review_id: str, current_user: dict = Depends(get_current_user_local)):
    """Report a review as inappropriate"""
    review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    await db.reviews.update_one(
        {"id": review_id},
        {"$set": {"is_reported": True}}
    )
    
    return {"message": "Review reported"}


@router.get("/venue/{venue_id}", response_model=List[ReviewResponse])
async def get_venue_reviews(venue_id: str, limit: int = 50):
    """Get all reviews for a venue"""
    reviews = await db.reviews.find(
        {"venue_id": venue_id, "is_reported": False},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return [ReviewResponse(**r) for r in reviews]


@router.get("/venue/{venue_id}/stats")
async def get_venue_review_stats(venue_id: str):
    """Get review statistics for a venue"""
    reviews = await db.reviews.find(
        {"venue_id": venue_id, "is_reported": False},
        {"_id": 0}
    ).to_list(1000)
    
    if not reviews:
        return {
            "total_reviews": 0,
            "average_overall": 0,
            "average_ambiance": 0,
            "average_quality": 0,
            "average_professionalism": 0,
            "rating_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        }
    
    total = len(reviews)
    
    # Calculate averages
    sum_overall = sum(r.get("overall_rating", 0) for r in reviews)
    sum_ambiance = sum(r.get("ambiance_rating", 0) for r in reviews if r.get("ambiance_rating"))
    sum_quality = sum(r.get("quality_rating", 0) for r in reviews if r.get("quality_rating"))
    sum_professionalism = sum(r.get("professionalism_rating", 0) for r in reviews if r.get("professionalism_rating"))
    
    count_ambiance = sum(1 for r in reviews if r.get("ambiance_rating"))
    count_quality = sum(1 for r in reviews if r.get("quality_rating"))
    count_professionalism = sum(1 for r in reviews if r.get("professionalism_rating"))
    
    # Rating distribution
    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r in reviews:
        rating = int(round(r.get("overall_rating", 0)))
        if 1 <= rating <= 5:
            distribution[rating] += 1
    
    return {
        "total_reviews": total,
        "average_overall": round(sum_overall / total, 2) if total > 0 else 0,
        "average_ambiance": round(sum_ambiance / count_ambiance, 2) if count_ambiance > 0 else 0,
        "average_quality": round(sum_quality / count_quality, 2) if count_quality > 0 else 0,
        "average_professionalism": round(sum_professionalism / count_professionalism, 2) if count_professionalism > 0 else 0,
        "rating_distribution": distribution
    }
