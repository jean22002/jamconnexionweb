"""
Planning router - Handles planning slots and concert applications
"""
from fastapi import APIRouter, HTTPException, Depends, Header, Request
from typing import List, Optional
from pydantic import BaseModel, Field
import uuid
from datetime import datetime, timezone
import jwt
import os
import logging
from pymongo.errors import DuplicateKeyError

# Build 152.9 — Emergent push helper (safe: never blocks main flow)
from routes.push import send_push

from models import (
    PlanningSlot, PlanningSlotResponse,
    ConcertApplication, ConcertApplicationResponse
)
from routes.audit import log_action  # Import audit logging
from utils.date_normalization import normalize_event_dates  # 🛡️ Build 95 date safety

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
        "is_open": data_dict.get("is_open", True),  # Garantir le champ même si modèle modifié
        "created_at": now
    }
    
    await db.planning_slots.insert_one(slot_doc)
    
    # Remove MongoDB _id before returning
    slot_doc.pop("_id", None)
    
    # 🔔 Notification temps réel : Nouvelle offre disponible pour musiciens PRO
    try:
        from websocket import notify_new_slot
        # Récupérer tous les abonnés de cet établissement qui sont musiciens PRO
        subscriptions = await db.venue_subscriptions.find({
            "venue_id": venue["id"],
            "subscriber_role": "musician"
        }, {"_id": 0}).to_list(1000)
        
        for sub in subscriptions:
            # Vérifier si le musicien est PRO
            musician_user = await db.users.find_one(
                {"id": sub["subscriber_id"]},
                {"_id": 0, "id": 1}
            )
            if musician_user:
                musician_profile = await db.musicians.find_one(
                    {"user_id": musician_user["id"]},
                    {"_id": 0, "tier": 1}
                )
                if musician_profile and musician_profile.get("tier") == "pro":
                    await notify_new_slot(
                        musician_user["id"],
                        venue.get("name", "un établissement"),
                        data.date,
                        slot_id
                    )
    except Exception as e:
        logger.warning(f"Could not send WebSocket notifications for new slot: {e}")
    
    # Notify subscribers about open slot (legacy notification DB)
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
async def list_planning_slots(venue_id: Optional[str] = None, is_open: bool = True, include_past: bool = False):
    """List planning slots (only future slots by default)"""
    from datetime import datetime, timezone
    
    query = {"is_open": is_open}
    if venue_id:
        query["venue_id"] = venue_id
    
    # By default, only show future slots
    if not include_past:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        query["date"] = {"$gte": today}
    
    slots = await db.planning_slots.find(query, {"_id": 0}).sort("date", 1).to_list(100)

    # 🛡️ Build 95 — normalisation défensive YYYY-MM-DD
    normalize_event_dates(slots, fields=['date'])
    
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
    from datetime import datetime, timezone
    
    query = {"is_open": is_open}
    
    # Always filter out past dates - only show future slots
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Date filters
    if date_from or date_to:
        date_query = {}
        # Ensure date_from is at least today
        if date_from:
            date_query["$gte"] = max(date_from, today) if date_from else today
        else:
            date_query["$gte"] = today
        if date_to:
            date_query["$lte"] = date_to
        if date_query:
            query["date"] = date_query
    else:
        # No date filter specified - only show future slots
        query["date"] = {"$gte": today}
    
    # Get all matching slots
    slots = await db.planning_slots.find(query, {"_id": 0}).sort("date", 1).to_list(500)
    
    # 🛡️ Build 95 — normalisation défensive YYYY-MM-DD
    normalize_event_dates(slots, fields=['date'])
    
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
async def get_venue_planning(venue_id: str, include_past: bool = False):
    """Get planning slots for a specific venue (only future slots by default)"""
    from datetime import datetime, timezone
    
    query = {"venue_id": venue_id}
    
    # By default, only show future slots
    if not include_past:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        query["date"] = {"$gte": today}
    
    slots = await db.planning_slots.find(query, {"_id": 0}).sort("date", 1).to_list(100)

    # 🛡️ Build 95 — normalisation défensive YYYY-MM-DD
    normalize_event_dates(slots, fields=['date'])
    
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
    
    # 🔔 Notification temps réel : Nouvelle candidature
    try:
        from websocket import notify_new_application
        venue = await db.venues.find_one({"id": slot.get("venue_id")}, {"_id": 0})
        if venue and venue.get("user_id"):
            await notify_new_application(
                venue["user_id"],
                band_name,
                f"Créneau du {slot.get('date', 'date inconnue')}",
                app_id
            )
            # Legacy notification DB
            await create_notification(
                venue["user_id"], 
                "application_received",
                "Nouvelle candidature",
                f"{band_name} a postulé pour le {slot.get('date', 'un créneau')}",
                "/venue"
            )
    except Exception as e:
        logger.warning(f"Could not send WebSocket notification: {e}")
    
    return {"message": "Candidature envoyée avec succès", "application_id": app_id}


@router.post("/applications", response_model=ConcertApplicationResponse)
async def create_application(data: ConcertApplication, request: Request, current_user: dict = Depends(get_current_user)):
    """Create an application to a planning slot (musician only)"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can apply")

    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")

    # Build 152.12 — Normalisation slot_id (accepte concert_id OU planning_slot_id)
    slot_id = data.planning_slot_id or data.concert_id
    if not slot_id:
        raise HTTPException(status_code=422, detail="Missing planning_slot_id or concert_id")

    # Build 152.15 — Fallback band_name → pseudo du musicien (mode Solo par défaut)
    band_name = data.band_name or musician.get("pseudo") or "Solo"
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

    slot = await db.planning_slots.find_one({"id": slot_id}, {"_id": 0})
    if not slot or not slot.get("is_open", True):
        raise HTTPException(status_code=404, detail="Planning slot not found or closed")

    # Build 152.12 — Check if already applied → HTTP 409 avec detail structuré
    existing = await db.applications.find_one({
        "planning_slot_id": slot_id,
        "musician_id": musician["id"]
    })
    if existing:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "Vous avez déjà postulé sur ce créneau",
                "code": "APPLICATION_ALREADY_EXISTS",
                "existing_application_id": existing.get("id"),
            }
        )

    app_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # Build 152.12 — dump only known fields, force planning_slot_id normalisé
    payload_dump = data.model_dump()
    payload_dump.pop("concert_id", None)  # évite le doublon avec planning_slot_id normalisé
    payload_dump["planning_slot_id"] = slot_id
    # Build 152.15 — force band_name résolu (fallback solo si absent)
    payload_dump["band_name"] = band_name

    app_doc = {
        "id": app_id,
        "musician_id": musician["id"],
        "musician_name": musician.get("pseudo") or current_user.get("name") or "Musicien",
        **payload_dump,
        "status": "pending",
        "created_at": now
    }

    try:
        await db.applications.insert_one(app_doc)
        # Remove MongoDB _id (ObjectId not JSON-serializable) before Pydantic response
        app_doc.pop("_id", None)
    except DuplicateKeyError:
        # Filet de sécurité si un unique index existe côté DB
        raise HTTPException(
            status_code=409,
            detail={
                "message": "Vous avez déjà postulé sur ce créneau",
                "code": "APPLICATION_ALREADY_EXISTS",
            }
        )

    # Notify venue owner
    venue = await db.venues.find_one({"id": slot["venue_id"]}, {"_id": 0})
    if venue:
        await create_notification(
            venue["user_id"],
            "application_received",
            "Nouvelle candidature",
            f"{band_name} a postulé pour le {slot['date']}",
            "/venue"
        )

    return ConcertApplicationResponse(**app_doc)


@router.get("/applications/my")
async def get_my_applications(request: Request, current_user: dict = Depends(get_current_user)):
    """Get all my applications (musician only)"""
    from fastapi import Response as FastAPIResponse
    import json as _json

    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can view their applications")

    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        empty = FastAPIResponse(content="[]", media_type="application/json")
        empty.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        empty.headers["CDN-Cache-Control"] = "no-cache"
        return empty

    applications = await db.applications.find({"musician_id": musician["id"]}, {"_id": 0}).to_list(100)

    # Pré-charger les bands du musicien (embedded) pour résoudre band_type rapidement
    embedded_bands = {b.get("id"): b for b in (musician.get("bands") or []) if b.get("id")}

    result = []
    for app in applications:
        slot = await db.planning_slots.find_one({"id": app["planning_slot_id"]}, {"_id": 0})
        if slot:
            venue = await db.venues.find_one({"id": slot.get("venue_id")}, {"_id": 0})

            # Slot + venue display fields
            app["slot_venue_name"] = slot.get("venue_name") or (venue.get("name") if venue else None)
            app["slot_venue_city"] = venue.get("city") if venue else None
            app["slot_date"] = slot.get("date")
            app["slot_start_time"] = slot.get("time") or slot.get("start_time")
            app["slot_end_time"] = slot.get("end_time")
            app["music_styles"] = slot.get("music_styles", [])

            # Légacy
            app["venue_name"] = slot.get("venue_name")

            # Build 152.15 — expose venue_id (et slot_venue_id) pour permettre au mobile
            # de rebrancher la candidature vers /venues/{id} sans passer par le nom.
            app["venue_id"] = slot.get("venue_id")
            app["slot_venue_id"] = slot.get("venue_id")

        # Résolution band_type (groupe vs Solo)
        bid = app.get("band_id")
        bt = None
        if bid:
            if bid in embedded_bands:
                bt = embedded_bands[bid].get("band_type")
            if not bt:
                band_doc = await db.bands.find_one({"id": bid}, {"_id": 0, "band_type": 1})
                if band_doc:
                    bt = band_doc.get("band_type")
            if not bt:
                bt = "group"
        else:
            # Pas de band_id → considéré Solo (legacy + nouveau)
            bt = "Solo"
        app["band_type"] = bt

        result.append(app)

    # 🛡️ Build 95 — normaliser slot_date au format YYYY-MM-DD
    normalize_event_dates(result, fields=['slot_date', 'date'])

    response = FastAPIResponse(content=_json.dumps(result, default=str), media_type="application/json")
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["CDN-Cache-Control"] = "no-cache"
    response.headers["Pragma"] = "no-cache"
    return response


@router.get("/applications/sent")
async def get_sent_applications(request: Request, current_user: dict = Depends(get_current_user)):
    """Alias of /applications/my for REST symmetry — applications sent by the connected musician."""
    return await get_my_applications(request=request, current_user=current_user)


@router.get("/applications/received")
async def get_received_applications(request: Request, current_user: dict = Depends(get_current_user)):
    """All applications received across the venue's planning slots (venue only)."""
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can view received applications")

    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        return []

    # Get all the venue's planning slots
    slot_ids = [
        s["id"]
        for s in await db.planning_slots.find(
            {"venue_id": venue["id"]}, {"_id": 0, "id": 1}
        ).to_list(1000)
    ]
    if not slot_ids:
        return []

    applications = await db.applications.find(
        {"planning_slot_id": {"$in": slot_ids}}, {"_id": 0}
    ).to_list(2000)

    # Enrich with slot + musician basic info to match what /applications/my returns
    result = []
    for app in applications:
        slot = await db.planning_slots.find_one({"id": app["planning_slot_id"]}, {"_id": 0})
        if slot:
            app["slot_date"] = slot.get("date")
            app["slot_start_time"] = slot.get("time") or slot.get("start_time")
            app["slot_end_time"] = slot.get("end_time")
            app["music_styles"] = slot.get("music_styles", [])
        musician = await db.musicians.find_one({"id": app.get("musician_id")}, {"_id": 0})
        if musician:
            app["musician_pseudo"] = musician.get("pseudo")
            app["musician_city"] = musician.get("city")
        result.append(app)

    # 🛡️ Build 95 — défense en profondeur : tronquer toute date ISO datetime à YYYY-MM-DD
    normalize_event_dates(result, fields=['date', 'slot_date'])

    return result


@router.get("/planning/{slot_id}/applications")
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
    # Robust serialization : on tolère les vieux docs incomplets pour ne jamais renvoyer un 500
    result = []
    for a in applications:
        try:
            result.append(ConcertApplicationResponse(**a))
        except Exception as e:
            logger.warning(f"Skipping malformed application {a.get('id')}: {e}")
            # Fallback : on renvoie le doc brut (FastAPI gère via Pydantic permissive)
            result.append(a)
    return result


@router.post("/applications/{app_id}/accept")
async def accept_application(app_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    """Accept an application (venue only).

    Side-effects garantis :
      1. applications.status = "accepted"
      2. Si num_bands_needed est atteint → planning_slots.is_open = False
      3. INSERT db.concerts (band_id rempli — pour Solo, on résout via musicians.bands[band_type=Solo] ou db.bands[band_type=Solo])
      4. push musicians.upcoming_concerts (legacy mobile)
      5. WebSocket notify_application_status + DB notification
      6. Si band_name → notification au band admin
    """
    from fastapi import Response as FastAPIResponse
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

    # Idempotency : si déjà accepté, on ne rejoue pas les side-effects (évite doublons dans db.concerts)
    already_accepted = app.get("status") == "accepted"

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
    # Build 152.16 — normalisation `max(..., 1)` pour rester cohérent avec la logique de
    # réouverture dans routes/cancellation.py (évite le cas num_bands_needed=0).
    num_bands_needed = max(int(slot.get("num_bands_needed") or 1), 1)
    
    # Close slot only if we have enough accepted bands
    if accepted_count >= num_bands_needed:
        await db.planning_slots.update_one({"id": slot["id"]}, {"$set": {"is_open": False}})

    # 🎵 INSERT INTO db.concerts (single source of truth pour /api/bands/{band_id}/events)
    # On résout le band_id de manière déterministe :
    #   - Si application.band_id existe → on l'utilise
    #   - Sinon (cas Solo), on cherche le band Solo du musicien dans db.bands (band_type="Solo", leader_id=musician_id)
    #   - Sinon, on cherche dans musicians.bands[band_type="Solo"]
    resolved_band_id = app.get("band_id")
    resolved_band_type = None

    musician_for_band = await db.musicians.find_one({"id": app["musician_id"]}, {"_id": 0}) if app.get("musician_id") else None

    if not resolved_band_id and musician_for_band:
        # 1) collection db.bands avec band_type=Solo
        solo_band = await db.bands.find_one(
            {"leader_id": musician_for_band["id"], "band_type": "Solo"},
            {"_id": 0, "id": 1}
        )
        if solo_band:
            resolved_band_id = solo_band["id"]
            resolved_band_type = "Solo"
        else:
            # 2) musicians.bands[] embedded avec band_type=Solo
            for b in (musician_for_band.get("bands") or []):
                if b.get("band_type") == "Solo":
                    resolved_band_id = b.get("id") or b.get("band_id")
                    resolved_band_type = "Solo"
                    break

    if not resolved_band_type and resolved_band_id:
        # Lookup band_type pour info
        band_doc = await db.bands.find_one({"id": resolved_band_id}, {"_id": 0, "band_type": 1})
        if band_doc:
            resolved_band_type = band_doc.get("band_type") or "group"

    concert_doc_id = app_id + "_concert"
    if not already_accepted:
        # Insert dans db.concerts seulement si pas déjà fait (idempotence)
        existing_concert = await db.concerts.find_one({"id": concert_doc_id}, {"_id": 0, "id": 1})
        if not existing_concert:
            concert_doc = {
                "id": concert_doc_id,
                "venue_id": venue.get("id"),
                "venue_name": venue.get("name"),
                "band_id": resolved_band_id,  # peut être None si vraiment aucun band trouvé
                "band_name": app.get("band_name"),
                "band_type": resolved_band_type,
                "musician_id": app.get("musician_id"),
                "date": slot.get("date"),
                "start_time": slot.get("time") or slot.get("start_time"),
                "end_time": slot.get("end_time"),
                "title": slot.get("title") or (f"Concert {app.get('band_name')}" if app.get("band_name") else "Concert"),
                "description": slot.get("description"),
                "music_styles": slot.get("music_styles", []),
                "payment": slot.get("payment"),
                "is_guso": slot.get("is_guso", False),
                "has_catering": slot.get("has_catering"),
                "has_meals": slot.get("has_meals"),
                "has_accommodation": slot.get("has_accommodation"),
                "source": "application_accepted",
                "planning_slot_id": slot["id"],
                "application_id": app_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            try:
                await db.concerts.insert_one(concert_doc)
            except Exception as e:
                logger.warning(f"Failed to insert concert from accepted application {app_id}: {e}")
    
    # Notify musician
    musician = await db.musicians.find_one({"id": app["musician_id"]}, {"_id": 0})
    if musician:
        # 🔔 Notification temps réel : Candidature acceptée
        try:
            from websocket import notify_application_status
            await notify_application_status(
                musician["user_id"],
                "accepted",
                f"Créneau du {slot['date']}",
                venue.get("name", "un établissement")
            )
        except Exception as e:
            logger.warning(f"Could not send WebSocket notification: {e}")
        
        # Legacy notification DB
        await create_notification(
            musician["user_id"], 
            "application_accepted",
            "Candidature acceptée!",
            f"Votre candidature pour le {slot['date']} chez {venue['name']} a été acceptée!",
            f"/venue/{venue['id']}"
        )

        # Build 152.9 — Push notif (never block main flow)
        try:
            await send_push(
                recipients=[musician["user_id"]],
                data={
                    "title": "🎉 Candidature acceptée !",
                    "message": f"{venue['name']} a accepté votre candidature du {slot['date']}",
                    "action_url": "/(tabs)/applications",
                    # Build 152.18 — deeplink explicite pour SuprSend (route liste mobile)
                    "deeplink": "jamconnexion:///(tabs)/applications",
                    "type": "application_accepted",
                    "application_id": app_id,
                },
                idempotency_key=f"app-accept-{app_id}",
            )
        except Exception as e:
            logger.warning(f"Push failed (application_accepted): {e}")
        
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

    # Réponse + Cache-Control no-cache (Cloudflare)
    response = FastAPIResponse(
        content='{"message": "Application accepted", "concert_id": "' + concert_doc_id + '", "band_id": ' + ('"' + resolved_band_id + '"' if resolved_band_id else 'null') + '}',
        media_type="application/json"
    )
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["CDN-Cache-Control"] = "no-cache"
    response.headers["Pragma"] = "no-cache"
    return response


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
        # 🔔 Notification temps réel : Candidature refusée
        try:
            from websocket import notify_application_status
            await notify_application_status(
                musician["user_id"],
                "rejected",
                f"Créneau du {slot['date']}",
                venue.get("name", "un établissement")
            )
        except Exception as e:
            logger.warning(f"Could not send WebSocket notification: {e}")
        
        # Legacy notification DB
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
    
    # Notify venue about cancellation
    slot = await db.planning_slots.find_one({"id": app["planning_slot_id"]}, {"_id": 0})
    if slot:
        venue = await db.venues.find_one({"id": slot["venue_id"]}, {"_id": 0})
        if venue and venue.get("user_id"):
            # Check notification preferences
            from utils.notification_preferences import should_send_notification
            should_notify = await should_send_notification(venue["user_id"], "application_cancellation", "venue")
            
            if should_notify:
                await create_notification(
                    venue["user_id"],
                    "application_cancelled",
                    "Candidature annulée",
                    f"{app.get('musician_name', 'Un musicien')} a annulé sa candidature pour le créneau du {slot.get('date', 'TBD')}",
                    None
                )
                logger.info(f"✓ Cancellation notification sent to venue {venue['user_id']}")
            else:
                logger.info(f"Notification skipped for venue {venue['user_id']} (application_cancellation disabled)")
    
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




@router.delete("/venues/me/cleanup-old-applications")
async def cleanup_old_applications(request: Request, current_user: dict = Depends(get_current_user)):
    """
    Delete all applications for planning slots with past dates (venue only)
    Returns the number of applications deleted
    """
    from datetime import datetime, timezone
    
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can cleanup applications")
    
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # Get today's date
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Find all planning slots from this venue with past dates
    past_slots = await db.planning_slots.find({
        "venue_id": venue["id"],
        "date": {"$lt": today}
    }, {"_id": 0, "id": 1}).to_list(1000)
    
    if not past_slots:
        return {
            "message": "Aucune candidature obsolète à supprimer",
            "deleted_count": 0,
            "past_slots_count": 0
        }
    
    # Get all slot IDs
    past_slot_ids = [slot["id"] for slot in past_slots]
    
    # Delete all applications for these past slots
    delete_result = await db.applications.delete_many({
        "planning_slot_id": {"$in": past_slot_ids}
    })
    
    deleted_count = delete_result.deleted_count
    
    return {
        "message": f"{deleted_count} candidature(s) obsolète(s) supprimée(s) avec succès",
        "deleted_count": deleted_count,
        "past_slots_count": len(past_slots)
    }
