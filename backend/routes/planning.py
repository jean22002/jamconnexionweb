"""
Planning router - Handles planning slots and concert applications
"""
from fastapi import APIRouter, HTTPException, Depends, Header, Request
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
from routes.audit import log_action  # Import audit logging

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
async def create_planning_slot(data: PlanningSlot, request: Request, current_user: dict = Depends(get_current_user)):
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
    
    # Build slot document (exclude venue_id from data to avoid overriding)
    data_dict = data.model_dump(exclude={"venue_id"})
    slot_doc = {
        "id": slot_id,
        "venue_id": venue["id"],
        "venue_name": venue["name"],
        **data_dict,
        "created_at": now
    }
    
    await db.planning_slots.insert_one(slot_doc)
    
    # Remove MongoDB _id before returning
    slot_doc.pop("_id", None)
    
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


@router.get("/planning/search", response_model=List[PlanningSlotResponse])
async def search_planning_slots(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    region: Optional[str] = None,
    department: Optional[str] = None,
    music_style: Optional[str] = None,
    is_open: bool = True
):
    """Search planning slots with filters (for musicians)"""
    query = {"is_open": is_open}
    
    # Date filters
    if date_from or date_to:
        date_query = {}
        if date_from:
            date_query["$gte"] = date_from
        if date_to:
            date_query["$lte"] = date_to
        if date_query:
            query["date"] = date_query
    
    # Get all matching slots
    slots = await db.planning_slots.find(query, {"_id": 0}).sort("date", 1).to_list(500)
    
    # Filter by venue location (region/department) and music styles
    result = []
    for s in slots:
        try:
            # Get venue info for location filtering
            venue = await db.venues.find_one({"id": s["venue_id"]}, {"_id": 0})
            if not venue:
                logger.warning(f"Venue {s['venue_id']} not found for planning slot {s.get('id')}")
                continue
            
            # Filter by region
            if region and venue.get("region") != region:
                continue
            
            # Filter by department
            if department and venue.get("department") != department:
                continue
            
            # Filter by music style
            if music_style and music_style not in s.get("music_styles", []):
                continue
            
            # Add venue info to slot
            apps_count = await db.applications.count_documents({"planning_slot_id": s["id"]})
            accepted_count = await db.applications.count_documents({
                "planning_slot_id": s["id"],
                "status": "accepted"
            })
            
            # Convert expected_attendance to string if it's an int (legacy data)
            if "expected_attendance" in s and isinstance(s["expected_attendance"], int):
                s["expected_attendance"] = str(s["expected_attendance"])
            
            slot_with_venue = {
                **s,
                "venue_name": venue.get("name"),
                "venue_city": venue.get("city"),
                "venue_region": venue.get("region"),
                "venue_department": venue.get("department"),
                "applications_count": apps_count,
                "accepted_bands_count": accepted_count
            }
            result.append(PlanningSlotResponse(**slot_with_venue))
        except Exception as e:
            logger.error(f"Error processing planning slot {s.get('id')}: {str(e)}")
            continue
    
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
async def update_planning_slot(slot_id: str, data: PlanningSlot, request: Request, current_user: dict = Depends(get_current_user)):
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
async def delete_planning_slot(slot_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    """Delete a planning slot (venue only)"""
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.planning_slots.delete_one({"id": slot_id, "venue_id": venue["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Planning slot not found")
    
    return {"message": "Planning slot deleted"}


# ============= CONCERT APPLICATIONS =============

@router.post("/planning/{slot_id}/apply")
async def apply_to_slot(slot_id: str, band_id: Optional[str] = None, request: Request = None, current_user: dict = Depends(get_current_user)):
    """Apply to a planning slot with optional band selection"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can apply")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    # Verify slot exists and is open
    slot = await db.planning_slots.find_one({"id": slot_id}, {"_id": 0})
    if not slot:
        raise HTTPException(status_code=404, detail="Planning slot not found")
    if not slot.get("is_open", True):
        raise HTTPException(status_code=400, detail="This slot is closed")
    
    # Check if already applied
    existing = await db.applications.find_one({
        "planning_slot_id": slot_id,
        "musician_id": musician["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà postulé à ce créneau")
    
    # Determine band name based on band_id or use solo profile
    band_name = musician.get("pseudo", current_user["name"])  # Default to solo
    band_info = None
    
    if band_id and band_id != "solo":
        # Find the band in musician's bands list
        musician_bands = musician.get("bands", [])
        band_info = next((b for b in musician_bands if b.get("id") == band_id), None)
        
        if not band_info:
            # Try to find in bands collection
            band_doc = await db.bands.find_one({"id": band_id}, {"_id": 0})
            if band_doc and band_doc.get("leader_id") == musician["id"]:
                band_info = band_doc
            else:
                raise HTTPException(status_code=403, detail="Vous ne pouvez candidater qu'avec vos propres groupes")
        
        band_name = band_info.get("name", band_name)
    
    app_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    app_doc = {
        "id": app_id,
        "planning_slot_id": slot_id,
        "musician_id": musician["id"],
        "musician_name": musician.get("pseudo", current_user["name"]),
        "band_id": band_id if band_id and band_id != "solo" else None,
        "band_name": band_name,
        "message": f"Candidature de {band_name}",
        "status": "pending",
        "created_at": now
    }
    
    await db.applications.insert_one(app_doc)
    
    # Notify venue owner
    venue = await db.venues.find_one({"id": slot.get("venue_id")}, {"_id": 0})
    if venue and venue.get("user_id"):
        await create_notification(
            venue["user_id"], 
            "application_received",
            "Nouvelle candidature",
            f"{band_name} a postulé pour le {slot.get('date', 'un créneau')}",
            "/venue"
        )
    
    return {"message": "Candidature envoyée avec succès", "application_id": app_id}


@router.post("/applications", response_model=ConcertApplicationResponse)
async def create_application(data: ConcertApplication, request: Request, current_user: dict = Depends(get_current_user)):
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
            "/venue"
        )
    
    return ConcertApplicationResponse(**app_doc)


@router.get("/applications/my")
async def get_my_applications(request: Request, current_user: dict = Depends(get_current_user)):
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
            # Get venue information
            venue = await db.venues.find_one({"id": slot.get("venue_id")}, {"_id": 0})
            
            # Add all slot and venue information needed for display
            app["slot_venue_name"] = slot.get("venue_name") or (venue.get("name") if venue else None)
            app["slot_venue_city"] = venue.get("city") if venue else None
            app["slot_date"] = slot.get("date")
            app["slot_start_time"] = slot.get("time") or slot.get("start_time")
            app["slot_end_time"] = slot.get("end_time")
            app["music_styles"] = slot.get("music_styles", [])  # Add music styles from slot
            
            # Keep legacy fields for backward compatibility
            app["venue_name"] = slot.get("venue_name")
        result.append(app)
    
    return result


@router.get("/planning/{slot_id}/applications", response_model=List[ConcertApplicationResponse])
async def get_slot_applications(slot_id: str, request: Request, current_user: dict = Depends(get_current_user)):
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
async def accept_application(app_id: str, request: Request, current_user: dict = Depends(get_current_user)):
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
    
    # Audit log: Application accepted
    await log_action(
        user_id=current_user["id"],
        user_role=current_user["role"],
        action="accept_application",
        resource_type="concert_application",
        resource_id=app_id,
        details={
            "slot_date": slot.get("date"),
            "musician_id": app.get("musician_id"),
            "band_name": app.get("band_name")
        },
        request=request,
        status="success"
    )
    
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
        
        # 🎵 ADD CONCERT TO MUSICIAN'S PLANNING
        # Create concert entry for the accepted application
        concert_entry = {
            "id": app_id + "_concert",  # Unique ID based on application
            "venue_name": venue.get("name"),
            "venue_id": venue.get("id"),
            "city": venue.get("city", ""),
            "date": slot.get("date"),
            "time": slot.get("time"),
            "title": slot.get("title", "Concert"),
            "description": slot.get("description"),
            "payment": slot.get("payment"),
            "is_guso": slot.get("is_guso", False),
            "source": "application_accepted",
            "planning_slot_id": slot["id"]
        }
        
        # Add to musician's upcoming concerts/events
        await db.musicians.update_one(
            {"id": app["musician_id"]},
            {"$push": {"upcoming_concerts": concert_entry}}
        )
    
    # Find and notify the band admin if applicable
    band_name = app.get("band_name")
    if band_name:
        # Search for the band across all musicians
        all_musicians = await db.musicians.find({}, {"_id": 0, "bands": 1, "user_id": 1, "pseudo": 1, "id": 1}).to_list(1000)
        
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
                            
                            # 🎵 ADD CONCERT TO BAND ADMIN'S PLANNING
                            # Also add to the band admin's upcoming concerts
                            band_concert_entry = {
                                "id": app_id + "_band_concert",
                                "venue_name": venue.get("name"),
                                "venue_id": venue.get("id"),
                                "city": venue.get("city", ""),
                                "date": slot.get("date"),
                                "time": slot.get("time"),
                                "title": slot.get("title", f"Concert {band_name}"),
                                "description": slot.get("description"),
                                "payment": slot.get("payment"),
                                "is_guso": slot.get("is_guso", False),
                                "band_name": band_name,
                                "source": "band_application_accepted",
                                "planning_slot_id": slot["id"]
                            }
                            
                            await db.musicians.update_one(
                                {"id": admin_id},
                                {"$push": {"upcoming_concerts": band_concert_entry}}
                            )
                        break
    
    return {"message": "Application accepted"}


@router.post("/applications/{app_id}/reject")
async def reject_application(app_id: str, request: Request, current_user: dict = Depends(get_current_user)):
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
    
    # Audit log: Application rejected
    await log_action(
        user_id=current_user["id"],
        user_role=current_user["role"],
        action="reject_application",
        resource_type="concert_application",
        resource_id=app_id,
        details={
            "slot_date": slot.get("date"),
            "musician_id": app.get("musician_id"),
            "band_name": app.get("band_name")
        },
        request=request,
        status="success"
    )
    
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


@router.delete("/applications/my/{app_id}")
async def cancel_my_application(app_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    """Cancel own application (musician only, pending status only)"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can cancel their applications")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")
    
    app = await db.applications.find_one({"id": app_id}, {"_id": 0})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Verify the application belongs to this musician
    if app["musician_id"] != musician["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this application")
    
    # Only pending applications can be cancelled by musicians
    if app.get("status") != "pending":
        raise HTTPException(
            status_code=400, 
            detail="Seules les candidatures en attente peuvent être annulées"
        )
    
    # Delete the application
    await db.applications.delete_one({"id": app_id})
    
    return {"message": "Candidature annulée avec succès"}


@router.delete("/applications/{app_id}")
async def delete_application(app_id: str, request: Request, current_user: dict = Depends(get_current_user)):
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



@router.get("/musician/calendar-events")
async def get_musician_calendar_events(request: Request, current_user: dict = Depends(get_current_user)):
    """Get all calendar events for a musician (accepted applications + confirmed concerts)"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can view their calendar")
    
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        return {"events": [], "eventsByDate": {}}
    
    events = []
    events_by_date = {}
    
    # 1. Get accepted applications (candidatures acceptées)
    accepted_apps = await db.applications.find({
        "musician_id": musician["id"],
        "status": "accepted"
    }, {"_id": 0}).to_list(1000)
    
    for app in accepted_apps:
        # Get slot details
        slot = await db.planning_slots.find_one({"id": app["planning_slot_id"]}, {"_id": 0})
        if not slot:
            continue
            
        # Get venue details
        venue = await db.venues.find_one({"id": slot.get("venue_id")}, {"_id": 0})
        if not venue:
            continue
        
        date = slot.get("date")
        if not date:
            continue
            
        event = {
            "type": "accepted_application",
            "date": date,
            "time": slot.get("time") or slot.get("start_time"),
            "venue_name": venue.get("name"),
            "venue_city": venue.get("city"),
            "venue_department": venue.get("department"),
            "venue_id": venue.get("id"),
            "venue_latitude": venue.get("latitude"),
            "venue_longitude": venue.get("longitude"),
            "band_name": app.get("band_name"),
            "title": f"Concert - {venue.get('name')}",
            "description": slot.get("description"),
            "slot_id": slot.get("id"),
            "application_id": app.get("id")
        }
        events.append(event)
        
        # Add to events_by_date for calendar coloring
        if date not in events_by_date:
            events_by_date[date] = []
        events_by_date[date].append(event)
    
    # 2. Get confirmed concerts from musician's concerts list
    concerts = musician.get("concerts", [])
    for concert in concerts:
        date = concert.get("date")
        if not date:
            continue
            
        event = {
            "type": "confirmed_concert",
            "date": date,
            "time": concert.get("time"),
            "venue_name": concert.get("venue_name"),
            "venue_city": concert.get("city"),
            "venue_department": concert.get("department"),
            "venue_id": concert.get("venue_id"),
            "venue_latitude": concert.get("latitude"),
            "venue_longitude": concert.get("longitude"),
            "title": f"Concert - {concert.get('venue_name', 'Lieu non spécifié')}",
            "description": concert.get("description"),
            "concert_id": concert.get("id")
        }
        events.append(event)
        
        # Add to events_by_date
        if date not in events_by_date:
            events_by_date[date] = []
        events_by_date[date].append(event)
    
    # Sort events by date
    events.sort(key=lambda x: x["date"])
    
    return {
        "events": events,
        "eventsByDate": events_by_date
    }

