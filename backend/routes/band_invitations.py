"""
Band invitations and member management routes
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import random
import string
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter(prefix="/bands", tags=["bands"])

# Database will be injected
db: AsyncIOMotorDatabase = None

def get_db():
    from server import db as database
    return database

# Dependency to get current user
async def get_current_user_local(authorization: str = Header(None)):
    from utils import get_current_user
    return await get_current_user(authorization, get_db())


class InviteMemberRequest(BaseModel):
    email_or_pseudo: str


class JoinBandRequest(BaseModel):
    code: str


class InvitationResponse(BaseModel):
    id: str
    band_id: str
    band_name: str
    invited_email: Optional[str] = None
    invited_pseudo: Optional[str] = None
    code: str
    expires_at: str
    created_at: str


def generate_code() -> str:
    """Generate a 6-character alphanumeric code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


@router.post("/{band_id}/invite")
async def invite_member(
    band_id: str,
    data: InviteMemberRequest,
    current_user: dict = Depends(get_current_user_local)
):
    """
    Invite a musician to join a band
    Only the band admin can send invitations
    """
    db = get_db()
    
    # Check if band exists
    band = await db.bands.find_one({"id": band_id}, {"_id": 0})
    if not band:
        raise HTTPException(status_code=404, detail="Groupe non trouvé")
    
    # Check if current user is the admin of this band
    if band.get("admin_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Seul l'admin du groupe peut envoyer des invitations")
    
    # Find the musician to invite (by email or pseudo)
    invited_user = await db.users.find_one({
        "$or": [
            {"email": data.email_or_pseudo},
            {"name": data.email_or_pseudo}
        ],
        "role": "musician"
    }, {"_id": 0})
    
    if not invited_user:
        raise HTTPException(
            status_code=404, 
            detail="Musicien non trouvé. Vérifiez l'email ou le pseudo."
        )
    
    # Check if musician is already a member
    existing_member = next(
        (m for m in band.get("members", []) if m.get("user_id") == invited_user["id"]),
        None
    )
    if existing_member:
        raise HTTPException(status_code=400, detail="Ce musicien est déjà membre du groupe")
    
    # Check if there's already a pending invitation
    existing_invitation = await db.band_invitations.find_one({
        "band_id": band_id,
        "invited_user_id": invited_user["id"],
        "status": "pending",
        "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
    }, {"_id": 0})
    
    if existing_invitation:
        # Return existing invitation
        return {
            "message": "Une invitation est déjà en attente pour ce musicien",
            "code": existing_invitation["code"],
            "invitation_id": existing_invitation["id"]
        }
    
    # Generate unique code
    code = generate_code()
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    invitation_doc = {
        "id": f"inv_{code}",
        "band_id": band_id,
        "band_name": band["name"],
        "admin_id": current_user["id"],
        "admin_name": current_user["name"],
        "invited_user_id": invited_user["id"],
        "invited_email": invited_user.get("email"),
        "invited_pseudo": invited_user.get("name"),
        "code": code,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at.isoformat()
    }
    
    await db.band_invitations.insert_one(invitation_doc)
    
    # Create notification for invited user
    notification_doc = {
        "id": f"notif_{code}",
        "recipient_id": invited_user["id"],
        "recipient_role": "musician",
        "sender_id": current_user["id"],
        "sender_role": current_user.get("role", "musician"),
        "type": "band_invitation",
        "title": f"Invitation à rejoindre {band['name']}",
        "message": f"{current_user['name']} vous invite à rejoindre son groupe. Code: {code}",
        "link": "/dashboard",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "metadata": {
            "code": code,
            "band_id": band_id,
            "band_name": band["name"]
        }
    }
    await db.notifications.insert_one(notification_doc)
    
    return {
        "message": "Invitation envoyée avec succès",
        "code": code,
        "invitation_id": invitation_doc["id"],
        "expires_at": expires_at.isoformat()
    }


@router.get("/{band_id}/invitations", response_model=List[InvitationResponse])
async def get_band_invitations(
    band_id: str,
    current_user: dict = Depends(get_current_user_local)
):
    """Get all pending invitations for a band"""
    db = get_db()
    
    # Check if user is admin of this band
    band = await db.bands.find_one({"id": band_id}, {"_id": 0})
    if not band or band.get("admin_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    invitations = await db.band_invitations.find({
        "band_id": band_id,
        "status": "pending",
        "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
    }, {"_id": 0}).to_list(100)
    
    return [InvitationResponse(**inv) for inv in invitations]


@router.delete("/{band_id}/invitations/{invitation_id}")
async def cancel_invitation(
    band_id: str,
    invitation_id: str,
    current_user: dict = Depends(get_current_user_local)
):
    """Cancel a pending invitation"""
    db = get_db()
    
    # Check if user is admin
    band = await db.bands.find_one({"id": band_id}, {"_id": 0})
    if not band or band.get("admin_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    result = await db.band_invitations.update_one(
        {"id": invitation_id, "band_id": band_id},
        {"$set": {"status": "cancelled"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Invitation non trouvée")
    
    return {"message": "Invitation annulée"}


@router.post("/join")
async def join_band_with_code(
    data: JoinBandRequest,
    current_user: dict = Depends(get_current_user_local)
):
    """Join a band using an invitation code"""
    db = get_db()
    
    if current_user.get("role") != "musician":
        raise HTTPException(status_code=403, detail="Seuls les musiciens peuvent rejoindre des groupes")
    
    # Find invitation
    invitation = await db.band_invitations.find_one({
        "code": data.code.upper(),
        "invited_user_id": current_user["id"],
        "status": "pending"
    }, {"_id": 0})
    
    if not invitation:
        raise HTTPException(
            status_code=404, 
            detail="Code invalide ou invitation non trouvée. Vérifiez le code ou demandez une nouvelle invitation."
        )
    
    # Check if expired
    if datetime.fromisoformat(invitation["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=400, 
            detail="Cette invitation a expiré. Demandez un nouveau code à l'admin du groupe."
        )
    
    # Get band
    band = await db.bands.find_one({"id": invitation["band_id"]}, {"_id": 0})
    if not band:
        raise HTTPException(status_code=404, detail="Groupe non trouvé")
    
    # Add member to band
    new_member = {
        "user_id": current_user["id"],
        "name": current_user["name"],
        "pseudo": current_user.get("name"),
        "is_admin": False,
        "joined_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bands.update_one(
        {"id": invitation["band_id"]},
        {"$push": {"members": new_member}}
    )
    
    # Mark invitation as accepted
    await db.band_invitations.update_one(
        {"id": invitation["id"]},
        {"$set": {
            "status": "accepted",
            "accepted_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Notify admin
    notification_doc = {
        "id": f"notif_accepted_{data.code}",
        "recipient_id": invitation["admin_id"],
        "recipient_role": "musician",
        "sender_id": current_user["id"],
        "sender_role": "musician",
        "type": "band_member_joined",
        "title": f"{current_user['name']} a rejoint {band['name']}",
        "message": f"{current_user['name']} a accepté l'invitation et est maintenant membre du groupe",
        "link": "/dashboard",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification_doc)
    
    return {
        "message": "Vous avez rejoint le groupe avec succès",
        "band_id": band["id"],
        "band_name": band["name"]
    }



@router.get("/{band_id}/events")
async def get_band_events(
    band_id: str,
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_user_local)
):
    """
    Get all events/concerts for a band
    Accessible by all band members
    """
    db = get_db()
    
    # Check if user is a member of this band
    band = await db.bands.find_one({"id": band_id}, {"_id": 0})
    if not band:
        raise HTTPException(status_code=404, detail="Groupe non trouvé")
    
    # Check if current user is a member or admin
    is_member = (
        band.get("admin_id") == current_user["id"] or
        any(m.get("user_id") == current_user["id"] for m in band.get("members", []))
    )
    
    if not is_member:
        raise HTTPException(
            status_code=403, 
            detail="Seuls les membres du groupe peuvent voir le planning"
        )
    
    # Build query for concerts featuring this band
    query = {
        "bands.name": band["name"]  # Search by band name in concerts
    }
    
    # Filter by month/year if provided
    if month and year:
        # Get date range for the month
        from datetime import date
        import calendar
        
        # First and last day of the month
        first_day = date(year, month, 1).isoformat()
        last_day_num = calendar.monthrange(year, month)[1]
        last_day = date(year, month, last_day_num).isoformat()
        
        query["date"] = {"$gte": first_day, "$lte": last_day}
    
    # Get concerts from database
    concerts = await db.concerts.find(query, {"_id": 0}).to_list(1000)
    
    # Format events for frontend
    events = []
    for concert in concerts:
        # Get venue info
        venue = await db.venues.find_one({"id": concert.get("venue_id")}, {"_id": 0})
        
        event = {
            "id": concert.get("id"),
            "date": concert.get("date"),
            "start_time": concert.get("start_time"),
            "end_time": concert.get("end_time"),
            "venue_name": venue.get("name") if venue else concert.get("venue_name", "Établissement"),
            "venue_city": venue.get("city") if venue else "",
            "venue_id": concert.get("venue_id"),
            "description": concert.get("description"),
            "title": concert.get("title"),
            "status": "confirmed",  # Most band concerts are confirmed
            "payment_method": concert.get("payment_method"),
            "amount": concert.get("amount"),
            "band_name": band["name"]
        }
        events.append(event)
    


# ============= ICAL EXPORT FOR GOOGLE CALENDAR / iOS =============

def generate_ical(events: List[dict], band_name: str) -> str:
    """
    Generate iCalendar format (.ics) for band events
    Compatible with Google Calendar, Apple Calendar (iOS/macOS), Outlook, etc.
    """
    # iCal header
    ical_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Musician Calendar//Band Planning//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{band_name} - Planning",
        "X-WR-TIMEZONE:Europe/Paris",
        "X-WR-CALDESC:Planning des concerts et événements du groupe"
    ]
    
    for event in events:
        # Parse date and time
        event_date = event.get("date", "")
        start_time = event.get("start_time", "20:00")
        end_time = event.get("end_time", "23:00")
        
        # Build datetime string in iCal format (YYYYMMDDTHHMMSS)
        try:
            # Parse ISO date
            date_obj = datetime.fromisoformat(event_date)
            
            # Parse start time
            start_parts = start_time.split(":")
            start_hour = int(start_parts[0]) if start_parts else 20
            start_minute = int(start_parts[1]) if len(start_parts) > 1 else 0
            
            # Parse end time
            end_parts = end_time.split(":")
            end_hour = int(end_parts[0]) if end_parts else 23
            end_minute = int(end_parts[1]) if len(end_parts) > 1 else 0
            
            # Create start and end datetime
            start_dt = date_obj.replace(hour=start_hour, minute=start_minute)
            end_dt = date_obj.replace(hour=end_hour, minute=end_minute)
            
            # Format for iCal (local time)
            dtstart = start_dt.strftime("%Y%m%dT%H%M%S")
            dtend = end_dt.strftime("%Y%m%dT%H%M%S")
            dtstamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
            
        except Exception:
            # Fallback si parsing échoue
            continue
        
        # Event details
        venue_name = event.get("venue_name", "Lieu non spécifié")
        venue_city = event.get("venue_city", "")
        description_text = event.get("description", "")
        event_id = event.get("id", "")
        
        # Build location
        location = venue_name
        if venue_city:
            location = f"{venue_name}, {venue_city}"
        
        # Build description
        description = f"Concert avec {band_name}"
        if description_text:
            description += f"\\n\\n{description_text}"
        if event.get("payment_method"):
            payment_info = event.get("payment_method")
            if payment_info == "guso":
                description += "\\n\\nMode de paiement: GUSO"
            elif payment_info == "facture":
                description += "\\n\\nMode de paiement: Facture"
            elif payment_info == "promotion":
                description += "\\n\\nConcert promotionnel"
        if event.get("amount"):
            description += f"\\n\\nCachet: {event.get('amount')}€"
        
        # Build summary (title)
        summary = f"{venue_name} - {band_name}"
        if event.get("title"):
            summary = f"{event.get('title')} @ {venue_name}"
        
        # Add event to calendar
        ical_lines.extend([
            "BEGIN:VEVENT",
            f"UID:{event_id}@musician-calendar.com",
            f"DTSTAMP:{dtstamp}",
            f"DTSTART:{dtstart}",
            f"DTEND:{dtend}",
            f"SUMMARY:{summary}",
            f"DESCRIPTION:{description}",
            f"LOCATION:{location}",
            "STATUS:CONFIRMED",
            "TRANSP:OPAQUE",
            "END:VEVENT"
        ])
    
    # Close calendar
    ical_lines.append("END:VCALENDAR")
    
    return "\r\n".join(ical_lines)


@router.get("/{band_id}/calendar.ics")
async def export_band_calendar(
    band_id: str,
    current_user: dict = Depends(get_current_user_local)
):
    """
    Export band planning as .ics file
    Compatible with Google Calendar, iOS Calendar, Outlook, etc.
    
    Usage:
    - Download: Click to download and import into any calendar app
    - Subscribe: Use the URL as a calendar subscription (auto-updates)
    """
    db = get_db()
    
    # Check if user is a member of this band
    band = await db.bands.find_one({"id": band_id}, {"_id": 0})
    if not band:
        raise HTTPException(status_code=404, detail="Groupe non trouvé")
    
    # Get musician profile for current user
    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0, "id": 1})
    musician_id = musician.get("id") if musician else None
    
    # Check if current user is a member or admin or leader
    is_member = (
        band.get("leader_id") == musician_id or  # Leader du groupe (compare musician.id)
        band.get("admin_id") == current_user["id"] or   # Admin du groupe
        any(m.get("user_id") == current_user["id"] for m in band.get("members", []))  # Membre
    )
    
    if not is_member:
        raise HTTPException(
            status_code=403, 
            detail="Seuls les membres du groupe peuvent exporter le planning"
        )
    
    # Get all band events
    query = {
        "bands.name": band["name"]
    }
    
    concerts = await db.concerts.find(query, {"_id": 0}).to_list(1000)
    
    # Format events
    events = []
    for concert in concerts:
        # Get venue info
        venue = await db.venues.find_one({"id": concert.get("venue_id")}, {"_id": 0})
        
        event = {
            "id": concert.get("id"),
            "date": concert.get("date"),
            "start_time": concert.get("start_time", "20:00"),
            "end_time": concert.get("end_time", "23:00"),
            "venue_name": venue.get("name") if venue else concert.get("venue_name", "Établissement"),
            "venue_city": venue.get("city") if venue else "",
            "description": concert.get("description", ""),
            "title": concert.get("title", ""),
            "payment_method": concert.get("payment_method"),
            "amount": concert.get("amount"),
        }
        events.append(event)
    
    # Generate iCal content
    ical_content = generate_ical(events, band["name"])
    
    # Return as downloadable .ics file
    filename = f"{band['name'].replace(' ', '_')}_planning.ics"
    
    return Response(
        content=ical_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

    return events
