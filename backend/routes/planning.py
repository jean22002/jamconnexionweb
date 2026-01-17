"""
Planning router - Handles planning slots and concert applications
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
import os
import logging

from models import (
    PlanningSlot, PlanningSlotResponse,
    ConcertApplication, ConcertApplicationResponse
)

router = APIRouter()
db = None
logger = logging.getLogger(__name__)

JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret')
JWT_ALGORITHM = "HS256"

def set_db(database):
    global db
    db = database

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def create_notification(user_id: str, notif_type: str, title: str, message: str, link: Optional[str] = None):
    """Create a notification for a user"""
    notif_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    notif_doc = {
        "id": notif_id,
        "user_id": user_id,
        "type": notif_type,
        "title": title,
        "message": message,
        "link": link,
        "read": False,
        "created_at": now
    }
    
    await db.notifications.insert_one(notif_doc)


async def notify_venue_subscribers(venue_id: str, notif_type: str, title: str, message: str, link: Optional[str] = None):
    """Notify all subscribers of a venue"""
    subs = await db.venue_subscriptions.find({"venue_id": venue_id}, {"_id": 0}).to_list(1000)
    for sub in subs:
        await create_notification(sub["subscriber_id"], notif_type, title, message, link)


# ============= PLANNING SLOTS =============

@router.post("/planning", response_model=PlanningSlotResponse)
async def create_planning_slot(data: PlanningSlot, current_user: dict = Depends(get_current_user)):
    """Create a planning slot (venue only)"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can create planning slots")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Check if slot already exists at this date
    existing_slot = await db.planning_slots.find_one({
        "venue_id": venue["id"],
        "date": data.date
    }, {"_id": 0})
    
    if existing_slot:
        raise HTTPException(
            status_code=400, 
            detail=f"Un créneau pour candidatures est déjà ouvert le {data.date}. Vous ne pouvez pas créer deux créneaux le même jour."
        )
    
    slot_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    slot_doc = {
        "id": slot_id,
        "venue_id": venue["id"],
        "venue_name": venue["name"],
        **data.model_dump(),
        "created_at": now
    }
    
    await db.planning_slots.insert_one(slot_doc)
    
    # Notify subscribers about open slot
    styles = ", ".join(data.music_styles) if data.music_styles else "Tous styles"
    await notify_venue_subscribers(
        venue["id"], 
        "planning_slot", 
        f"Date disponible chez {venue['name']}", 
        f"Le {data.date} - {styles}", 
        f"/venue/{venue['id']}"
    )
    
    return PlanningSlotResponse(**slot_doc, applications_count=0, accepted_bands_count=0)


@router.get("/planning", response_model=List[PlanningSlotResponse])
async def list_planning_slots(venue_id: Optional[str] = None, is_open: bool = True):
    """List planning slots"""
    query = {"is_open": is_open}
    if venue_id:
        query["venue_id"] = venue_id
    
    slots = await db.planning_slots.find(query, {"_id": 0}).sort("date", 1).to_list(100)
    
    result = []
    for s in slots:
        apps_count = await db.applications.count_documents({"planning_slot_id": s["id"]})
        accepted_count = await db.applications.count_documents({
            "planning_slot_id": s["id"],
            "status": "accepted"
        })
        result.append(PlanningSlotResponse(
            **s, 
            applications_count=apps_count,
            accepted_bands_count=accepted_count
        ))
    
    return result


@router.get("/venues/{venue_id}/planning", response_model=List[PlanningSlotResponse])
async def get_venue_planning(venue_id: str):
    """Get planning slots for a specific venue"""
    slots = await db.planning_slots.find({"venue_id": venue_id}, {"_id": 0}).sort("date", 1).to_list(100)
    
    result = []
    for s in slots:
        apps_count = await db.applications.count_documents({"planning_slot_id": s["id"]})
        accepted_count = await db.applications.count_documents({
            "planning_slot_id": s["id"],
            "status": "accepted"
        })
        result.append(PlanningSlotResponse(
            **s, 
            applications_count=apps_count,
            accepted_bands_count=accepted_count
        ))
    
    return result


@router.put("/planning/{slot_id}", response_model=PlanningSlotResponse)
async def update_planning_slot(slot_id: str, data: PlanningSlot, current_user: dict = Depends(get_current_user)):
    """Update a planning slot (venue only)"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can update planning slots")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Verify the slot belongs to this venue
    existing_slot = await db.planning_slots.find_one({"id": slot_id, "venue_id": venue["id"]}, {"_id": 0})
    if not existing_slot:
        raise HTTPException(status_code=404, detail="Planning slot not found")
    
    # Update the slot with new data
    update_data = {
        **data.model_dump(),
        "venue_id": venue["id"],
        "venue_name": venue["name"]
    }
    
    await db.planning_slots.update_one(
        {"id": slot_id, "venue_id": venue["id"]},
        {"$set": update_data}
    )
    
    # Get updated slot
    updated_slot = await db.planning_slots.find_one({"id": slot_id}, {"_id": 0})
    
    # Count applications
    apps_count = await db.applications.count_documents({"planning_slot_id": slot_id})
    accepted_count = await db.applications.count_documents({
        "planning_slot_id": slot_id,
        "status": "accepted"
    })
    
    return PlanningSlotResponse(**updated_slot, applications_count=apps_count, accepted_bands_count=accepted_count)


@router.delete("/planning/{slot_id}")
async def delete_planning_slot(slot_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a planning slot (venue only)"""
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.planning_slots.delete_one({"id": slot_id, "venue_id": venue["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Planning slot not found")
    
    return {"message": "Planning slot deleted"}


# ============= CONCERT APPLICATIONS =============

@router.post("/applications", response_model=ConcertApplicationResponse)
async def create_application(data: ConcertApplication, current_user: dict = Depends(get_current_user)):
    """Create an application to a planning slot (musician only)"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can apply")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Validate that the band belongs to the musician or is their solo profile
    band_name = data.band_name
    is_solo = band_name == musician.get("pseudo") or "solo" in band_name.lower()
    
    if not is_solo:
        # Check if band exists in musician's bands
        musician_bands = musician.get("bands", [])
        band_exists = any(band.get("name") == band_name for band in musician_bands)
        
        if not band_exists:
            raise HTTPException(
                status_code=403, 
                detail="Vous ne pouvez postuler qu'avec vos propres groupes ou votre profil solo"
            )
    
    slot = await db.planning_slots.find_one({"id": data.planning_slot_id}, {"_id": 0})
    if not slot or not slot.get("is_open", True):
        raise HTTPException(status_code=404, detail="Planning slot not found or closed")
    
    # Check if already applied
    existing = await db.applications.find_one({
        "planning_slot_id": data.planning_slot_id,
        "musician_id": musician["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this slot")
    
    app_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    app_doc = {
        "id": app_id,
        "planning_slot_id": data.planning_slot_id,
        "musician_id": musician["id"],
        "musician_name": musician.get("pseudo", current_user["name"]),
        **data.model_dump(),
        "status": "pending",
        "created_at": now
    }
    
    await db.applications.insert_one(app_doc)
    
    # Notify venue owner
    venue = await db.venues.find_one({"id": slot["venue_id"]}, {"_id": 0})
    if venue:
        await create_notification(
            venue["user_id"], 
            "application_received",
            "Nouvelle candidature",
            f"{data.band_name} a postulé pour le {slot['date']}",
            f"/venue"
        )
    
    return ConcertApplicationResponse(**app_doc)


@router.get("/applications/my")
async def get_my_applications(current_user: dict = Depends(get_current_user)):
    """Get all my applications (musician only)"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can view their applications")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        return []
    
    applications = await db.applications.find({"musician_id": musician["id"]}, {"_id": 0}).to_list(100)
    
    result = []
    for app in applications:
        slot = await db.planning_slots.find_one({"id": app["planning_slot_id"]}, {"_id": 0})
        if slot:
            app["venue_name"] = slot.get("venue_name")
            app["slot_date"] = slot.get("date")
        result.append(app)
    
    return result


@router.get("/planning/{slot_id}/applications", response_model=List[ConcertApplicationResponse])
async def get_slot_applications(slot_id: str, current_user: dict = Depends(get_current_user)):
    """Get all applications for a planning slot (venue only)"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can view applications")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    slot = await db.planning_slots.find_one({"id": slot_id, "venue_id": venue["id"]}, {"_id": 0})
    if not slot:
        raise HTTPException(status_code=404, detail="Planning slot not found")
    
    applications = await db.applications.find({"planning_slot_id": slot_id}, {"_id": 0}).to_list(100)
    return [ConcertApplicationResponse(**a) for a in applications]


@router.post("/applications/{app_id}/accept")
async def accept_application(app_id: str, current_user: dict = Depends(get_current_user)):
    """Accept an application (venue only)"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can accept applications")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    app = await db.applications.find_one({"id": app_id}, {"_id": 0})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    slot = await db.planning_slots.find_one({"id": app["planning_slot_id"], "venue_id": venue["id"]}, {"_id": 0})
    if not slot:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update application status
    await db.applications.update_one({"id": app_id}, {"$set": {"status": "accepted"}})
    
    # Count accepted applications for this slot
    accepted_count = await db.applications.count_documents({
        "planning_slot_id": slot["id"],
        "status": "accepted"
    })
    
    # Get number of bands needed (default to 1 if not set)
    num_bands_needed = slot.get("num_bands_needed", 1)
    
    # Close slot only if we have enough accepted bands
    if accepted_count >= num_bands_needed:
        await db.planning_slots.update_one({"id": slot["id"]}, {"$set": {"is_open": False}})
    
    # Notify musician
    musician = await db.musicians.find_one({"id": app["musician_id"]}, {"_id": 0})
    if musician:
        await create_notification(
            musician["user_id"], 
            "application_accepted",
            "Candidature acceptée!",
            f"Votre candidature pour le {slot['date']} chez {venue['name']} a été acceptée!",
            f"/venue/{venue['id']}"
        )
    
    # Find and notify the band admin if applicable
    band_name = app.get("band_name")
    if band_name:
        # Search for the band across all musicians
        all_musicians = await db.musicians.find({}, {"_id": 0, "bands": 1, "user_id": 1, "pseudo": 1}).to_list(1000)
        
        for m in all_musicians:
            if m.get("bands"):
                for band in m["bands"]:
                    if band.get("name") == band_name and band.get("admin_id"):
                        # Found the band admin!
                        admin_id = band["admin_id"]
                        
                        # Get admin's full profile
                        admin_musician = await db.musicians.find_one({"id": admin_id}, {"_id": 0})
                        if admin_musician:
                            # Send notification to the band admin
                            await create_notification(
                                admin_musician["user_id"], 
                                "band_concert_confirmed",
                                f"🎉 Concert confirmé pour {band_name}",
                                f"{venue['name']} a validé votre groupe pour le {slot['date']}. Vous pouvez maintenant communiquer avec l'établissement.",
                                f"/venue/{venue['id']}"
                            )
                        break
    
    return {"message": "Application accepted"}


@router.post("/applications/{app_id}/reject")
async def reject_application(app_id: str, current_user: dict = Depends(get_current_user)):
    """Reject an application (venue only)"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can reject applications")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    app = await db.applications.find_one({"id": app_id}, {"_id": 0})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    slot = await db.planning_slots.find_one({"id": app["planning_slot_id"], "venue_id": venue["id"]}, {"_id": 0})
    if not slot:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.applications.update_one({"id": app_id}, {"$set": {"status": "rejected"}})
    
    # Notify musician
    musician = await db.musicians.find_one({"id": app["musician_id"]}, {"_id": 0})
    if musician:
        await create_notification(
            musician["user_id"], 
            "application_rejected",
            "Candidature non retenue",
            f"Votre candidature pour le {slot['date']} n'a pas été retenue",
            None
        )
    
    return {"message": "Application rejected"}


@router.delete("/applications/{app_id}")
async def delete_application(app_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an application (venue can cancel an accepted application)"""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can delete applications")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    app = await db.applications.find_one({"id": app_id}, {"_id": 0})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    slot = await db.planning_slots.find_one({"id": app["planning_slot_id"], "venue_id": venue["id"]}, {"_id": 0})
    if not slot:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # If the application was accepted, notify the musician about cancellation
    if app.get("status") == "accepted":
        musician = await db.musicians.find_one({"id": app["musician_id"]}, {"_id": 0})
        if musician:
            await create_notification(
                musician["user_id"],
                "application_cancelled",
                "Candidature annulée",
                f"Votre candidature acceptée pour le {slot['date']} chez {venue['name']} a été annulée par l'établissement.",
                None
            )
        
        # Reopen slot if it was closed due to this application
        accepted_count = await db.applications.count_documents({
            "planning_slot_id": slot["id"],
            "status": "accepted"
        })
        
        # After deleting this one, check if we need to reopen
        if accepted_count - 1 < slot.get("num_bands_needed", 1):
            await db.planning_slots.update_one(
                {"id": slot["id"]},
                {"$set": {"is_open": True}}
            )
    
    # Delete the application
    await db.applications.delete_one({"id": app_id})
    
    return {"message": "Application deleted"}
