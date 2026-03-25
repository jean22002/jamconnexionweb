"""
Band invitations and member management routes
"""
from fastapi import APIRouter, Depends, HTTPException
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
async def get_current_user_local(authorization: str = Depends(lambda: None)):
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
        "link": f"/dashboard",
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
        "link": f"/dashboard",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification_doc)
    
    return {
        "message": "Vous avez rejoint le groupe avec succès",
        "band_id": band["id"],
        "band_name": band["name"]
    }
