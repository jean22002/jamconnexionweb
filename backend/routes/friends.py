"""
Friends router - Handles friend requests and friendships (Jacks system)
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
import uuid
from datetime import datetime, timezone

from models import FriendRequest, FriendRequestResponse
from utils import get_current_user, create_notification, get_db

router = APIRouter(prefix="/friends", tags=["Friends"])
db = get_db()


@router.post("/request")
async def send_friend_request(data: FriendRequest, current_user: dict = Depends(get_current_user)):
    """Send a friend request to another musician"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can send friend requests")
    
    if data.to_user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")
    
    # Check if target user exists and is a musician
    target_user = await db.users.find_one({"id": data.to_user_id}, {"_id": 0})
    if not target_user or target_user["role"] != "musician":
        raise HTTPException(status_code=404, detail="Target musician not found")
    
    # Check if already friends or request exists
    existing = await db.friends.find_one({
        "$or": [
            {"user1_id": current_user["id"], "user2_id": data.to_user_id},
            {"user1_id": data.to_user_id, "user2_id": current_user["id"]}
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Friend request already exists or already friends")
    
    request_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Get sender's musician profile for image
    sender_musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    sender_image = sender_musician.get("profile_image") if sender_musician else None
    
    friend_doc = {
        "id": request_id,
        "user1_id": current_user["id"],
        "user1_name": current_user["name"],
        "user1_image": sender_image,
        "user2_id": data.to_user_id,
        "status": "pending",
        "created_at": now
    }
    
    await db.friends.insert_one(friend_doc)
    
    # Create notification for target user
    await create_notification(
        data.to_user_id,
        "friend_request",
        "Nouvelle demande d'ami",
        f"{current_user['name']} vous a envoyé une demande d'ami",
        f"/musician/{sender_musician['id'] if sender_musician else ''}"
    )
    
    return {"message": "Friend request sent", "request_id": request_id}


@router.get("/requests", response_model=List[FriendRequestResponse])
async def get_friend_requests(current_user: dict = Depends(get_current_user)):
    """Get all pending friend requests received by current user"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can view friend requests")
    
    requests = await db.friends.find({
        "user2_id": current_user["id"],
        "status": "pending"
    }, {"_id": 0}).to_list(100)
    
    result = []
    for req in requests:
        result.append(FriendRequestResponse(
            id=req["id"],
            from_user_id=req["user1_id"],
            from_user_name=req["user1_name"],
            from_user_image=req.get("user1_image"),
            to_user_id=req["user2_id"],
            status=req["status"],
            created_at=req["created_at"]
        ))
    
    return result


@router.get("/sent")
async def get_sent_friend_requests(current_user: dict = Depends(get_current_user)):
    """Get friend requests sent by current user"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can send friend requests")
    
    requests = await db.friends.find({
        "user1_id": current_user["id"],
        "status": "pending"
    }, {"_id": 0}).to_list(100)
    
    result = []
    for req in requests:
        # Get recipient's musician profile
        recipient_musician = await db.musicians.find_one({"user_id": req["user2_id"]}, {"_id": 0})
        if recipient_musician:
            result.append({
                "id": req["id"],
                "to_user_id": req["user2_id"],
                "to_user_name": recipient_musician.get("pseudo", "Musicien"),
                "to_user_image": recipient_musician.get("profile_image"),
                "status": req["status"],
                "created_at": req["created_at"]
            })
    
    return result


@router.delete("/cancel/{request_id}")
async def cancel_friend_request(request_id: str, current_user: dict = Depends(get_current_user)):
    """Cancel a pending friend request sent by current user"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can cancel friend requests")
    
    request = await db.friends.find_one({
        "id": request_id,
        "user1_id": current_user["id"],
        "status": "pending"
    }, {"_id": 0})
    
    if not request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    # Delete the request
    await db.friends.delete_one({"id": request_id})
    
    # Delete notification
    await db.notifications.delete_many({
        "user_id": request["user2_id"],
        "type": "friend_request"
    })
    
    return {"message": "Friend request cancelled"}


@router.post("/accept/{request_id}")
async def accept_friend_request(request_id: str, current_user: dict = Depends(get_current_user)):
    """Accept a friend request"""
    request = await db.friends.find_one({"id": request_id, "user2_id": current_user["id"]}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    await db.friends.update_one({"id": request_id}, {"$set": {"status": "accepted"}})
    
    # Notify the requester
    await create_notification(
        request["user1_id"],
        "friend_accepted",
        "Demande d'ami acceptée",
        f"{current_user['name']} a accepté votre demande d'ami",
        None
    )
    
    # Check for new badges for both users (friend count badges)
    try:
        from utils.badge_checker import check_and_award_badges_internal
        await check_and_award_badges_internal(db, current_user["id"])
        await check_and_award_badges_internal(db, request["user1_id"])
    except Exception as e:
        logger.warning(f"Could not check badges: {e}")
    
    return {"message": "Friend request accepted"}


@router.post("/reject/{request_id}")
async def reject_friend_request(request_id: str, current_user: dict = Depends(get_current_user)):
    """Reject a friend request"""
    request = await db.friends.find_one({"id": request_id, "user2_id": current_user["id"]}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    await db.friends.update_one({"id": request_id}, {"$set": {"status": "rejected"}})
    return {"message": "Friend request rejected"}


@router.get("/")
async def get_friends(current_user: dict = Depends(get_current_user)):
    """Get all accepted friends of current user"""
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can view friends")
    
    friendships = await db.friends.find({
        "$or": [{"user1_id": current_user["id"]}, {"user2_id": current_user["id"]}],
        "status": "accepted"
    }, {"_id": 0}).to_list(100)
    
    friends = []
    for f in friendships:
        friend_id = f["user2_id"] if f["user1_id"] == current_user["id"] else f["user1_id"]
        musician = await db.musicians.find_one({"user_id": friend_id}, {"_id": 0})
        if musician:
            friends.append({
                "id": musician["id"],
                "user_id": musician["user_id"],
                "friend_id": musician["user_id"],  # Ajouté pour compatibilité frontend
                "pseudo": musician.get("pseudo", ""),
                "profile_image": musician.get("profile_image"),
                "instruments": musician.get("instruments", []),
                "city": musician.get("city")
            })
    
    return friends


@router.delete("/{friend_user_id}")
async def remove_friend(friend_user_id: str, current_user: dict = Depends(get_current_user)):
    """Remove a friend"""
    result = await db.friends.delete_one({
        "$or": [
            {"user1_id": current_user["id"], "user2_id": friend_user_id},
            {"user1_id": friend_user_id, "user2_id": current_user["id"]}
        ],
        "status": "accepted"
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Friendship not found")
    
    return {"message": "Friend removed"}
