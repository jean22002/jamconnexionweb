from fastapi import APIRouter, Depends, HTTPException, Header, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from uuid import uuid4
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])

# DB will be injected
db = None

def set_db(database):
    global db
    db = database

# ============================================
# Auth Helper
# ============================================

async def get_current_user_local(authorization: str = Header(None)):
    """Import get_current_user locally to avoid circular imports"""
    from utils import get_current_user
    return await get_current_user(authorization, db)

# ============================================
# Models
# ============================================

class CreateConversationRequest(BaseModel):
    participant_id: str  # user_id de l'autre personne
    initial_message: Optional[str] = None

class SendMessageRequest(BaseModel):
    conversation_id: str
    content: str
    type: str = "text"  # "text", "image", "audio"
    attachment: Optional[str] = None

# ============================================
# Endpoints
# ============================================

@router.get("/conversations")
async def get_conversations(user: dict = Depends(get_current_user_local)):
    """
    Récupère toutes les conversations de l'utilisateur.
    
    Retourne les conversations triées par date de mise à jour (plus récente en premier).
    """
    try:
        conversations = await db.conversations.find(
            {"participants.user_id": user["id"]},
            {"_id": 0}
        ).sort("updated_at", -1).to_list(100)
        
        # Ajouter unread_count pour l'utilisateur
        for conv in conversations:
            conv["my_unread_count"] = conv.get("unread_count", {}).get(user["id"], 0)
        
        return conversations
        
    except Exception as e:
        logger.error(f"Error fetching conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversations")
async def create_conversation(
    request: CreateConversationRequest,
    user: dict = Depends(get_current_user_local)
):
    """
    Crée une nouvelle conversation directe avec un utilisateur.
    
    Si une conversation existe déjà entre ces 2 utilisateurs, retourne la conversation existante.
    """
    try:
        # Vérifier si conversation existe déjà
        existing = await db.conversations.find_one({
            "type": "direct",
            "participants.user_id": {"$all": [user["id"], request.participant_id]}
        }, {"_id": 0})
        
        if existing:
            logger.info(f"Conversation already exists: {existing['id']}")
            return existing
        
        # Récupérer infos participant
        participant = await db.users.find_one(
            {"id": request.participant_id},
            {"_id": 0, "id": 1, "name": 1, "role": 1}
        )
        
        if not participant:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
        # Récupérer avatars
        avatar_current = await get_user_avatar(db, user["id"], user["role"])
        avatar_participant = await get_user_avatar(db, participant["id"], participant["role"])
        
        # Créer conversation
        conversation_id = f"conv_{uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        
        conversation = {
            "id": conversation_id,
            "type": "direct",
            "participants": [
                {
                    "user_id": user["id"],
                    "role": user["role"],
                    "name": user["name"],
                    "avatar": avatar_current,
                    "last_read_at": now
                },
                {
                    "user_id": participant["id"],
                    "role": participant["role"],
                    "name": participant["name"],
                    "avatar": avatar_participant,
                    "last_read_at": None
                }
            ],
            "last_message": None,
            "unread_count": {
                user["id"]: 0,
                participant["id"]: 0
            },
            "created_at": now,
            "updated_at": now
        }
        
        await db.conversations.insert_one(conversation)
        logger.info(f"Created conversation {conversation_id}")
        
        # Envoyer message initial si fourni
        if request.initial_message:
            await send_message_internal(
                db=db,
                conversation_id=conversation_id,
                sender_id=user["id"],
                sender_name=user["name"],
                sender_avatar=avatar_current,
                content=request.initial_message
            )
        
        return conversation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    user: dict = Depends(get_current_user_local)
):
    """
    Récupère les messages d'une conversation avec pagination.
    
    Args:
        conversation_id: ID de la conversation
        page: Numéro de page (commence à 1)
        limit: Nombre de messages par page (max 100)
    
    Returns:
        {
            "messages": [...],
            "page": 1,
            "limit": 50,
            "has_more": true
        }
    """
    try:
        # Vérifier que l'utilisateur est participant
        conversation = await db.conversations.find_one({
            "id": conversation_id,
            "participants.user_id": user["id"]
        }, {"_id": 0})
        
        if not conversation:
            raise HTTPException(status_code=403, detail="Accès refusé à cette conversation")
        
        # Pagination
        skip = (page - 1) * limit
        
        messages = await db.messages.find(
            {"conversation_id": conversation_id},
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        # Inverser pour affichage chronologique (plus ancien en premier)
        messages.reverse()
        
        return {
            "messages": messages,
            "page": page,
            "limit": limit,
            "has_more": len(messages) == limit
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/messages")
async def send_message(
    request: SendMessageRequest,
    user: dict = Depends(get_current_user_local)
):
    """
    Envoie un message dans une conversation.
    
    ⚠️ NOTE: Utiliser WebSocket pour l'envoi en temps réel est recommandé.
    Cet endpoint REST est un fallback si WebSocket n'est pas disponible.
    """
    try:
        # Vérifier conversation
        conversation = await db.conversations.find_one({
            "id": request.conversation_id,
            "participants.user_id": user["id"]
        }, {"_id": 0})
        
        if not conversation:
            raise HTTPException(status_code=403, detail="Conversation non trouvée")
        
        # Récupérer avatar
        avatar = await get_user_avatar(db, user["id"], user["role"])
        
        # Créer message
        message = await send_message_internal(
            db=db,
            conversation_id=request.conversation_id,
            sender_id=user["id"],
            sender_name=user["name"],
            sender_avatar=avatar,
            content=request.content,
            msg_type=request.type,
            attachment=request.attachment
        )
        
        # TODO: Émettre via WebSocket si connecté
        # TODO: Envoyer notification push si déconnecté
        
        return message
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/conversations/{conversation_id}/read")
async def mark_conversation_read(
    conversation_id: str,
    user: dict = Depends(get_current_user_local)
):
    """
    Marque tous les messages d'une conversation comme lus.
    
    Met à jour :
    - `last_read_at` du participant
    - `unread_count` à 0 pour cet utilisateur
    """
    try:
        now = datetime.now(timezone.utc)
        
        # Mettre à jour last_read_at et unread_count
        result = await db.conversations.update_one(
            {
                "id": conversation_id,
                "participants.user_id": user["id"]
            },
            {
                "$set": {
                    "participants.$.last_read_at": now,
                    f"unread_count.{user['id']}": 0
                }
            }
        )
        
        if result.modified_count > 0:
            logger.info(f"Marked conversation {conversation_id} as read for user {user['id']}")
            return {"success": True}
        else:
            raise HTTPException(status_code=404, detail="Conversation non trouvée")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking conversation read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user: dict = Depends(get_current_user_local)
):
    """
    Supprime une conversation (seulement pour l'utilisateur, pas pour les autres participants).
    
    En réalité, on pourrait ajouter un champ `deleted_by` pour soft delete.
    """
    try:
        # Pour l'instant, on empêche la suppression (fonctionnalité future)
        raise HTTPException(
            status_code=501,
            detail="La suppression de conversations n'est pas encore implémentée"
        )
        
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Fonctions Utilitaires
# ============================================

async def get_user_avatar(db, user_id: str, role: str) -> Optional[str]:
    """
    Récupère l'avatar d'un utilisateur selon son rôle.
    
    Returns:
        str: URL de l'avatar ou None
    """
    try:
        if role == "musician":
            profile = await db.musicians.find_one(
                {"user_id": user_id},
                {"_id": 0, "profile_picture": 1}
            )
            return profile.get("profile_picture") if profile else None
            
        elif role == "venue":
            profile = await db.venues.find_one(
                {"user_id": user_id},
                {"_id": 0, "profile_image": 1}
            )
            return profile.get("profile_image") if profile else None
            
        elif role == "melomane":
            profile = await db.melomanes.find_one(
                {"user_id": user_id},
                {"_id": 0, "profile_picture": 1}
            )
            return profile.get("profile_picture") if profile else None
            
        return None
        
    except Exception as e:
        logger.error(f"Error getting user avatar: {e}")
        return None


async def send_message_internal(
    db,
    conversation_id: str,
    sender_id: str,
    sender_name: str,
    sender_avatar: str,
    content: str,
    msg_type: str = "text",
    attachment: str = None
) -> dict:
    """
    Crée et sauvegarde un message dans MongoDB.
    
    Cette fonction est utilisée par :
    - L'endpoint REST `/messages`
    - Le WebSocket `send_message` event
    
    Returns:
        dict: Le message créé
    """
    try:
        message_id = f"msg_{uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        
        message = {
            "id": message_id,
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "sender_name": sender_name,
            "sender_avatar": sender_avatar,
            "content": content,
            "type": msg_type,
            "attachment": attachment,
            "is_read": False,
            "read_by": [sender_id],
            "created_at": now,
            "updated_at": now
        }
        
        await db.messages.insert_one(message)
        
        # Mettre à jour la conversation
        conversation = await db.conversations.find_one(
            {"id": conversation_id},
            {"_id": 0, "participants": 1, "unread_count": 1}
        )
        
        if conversation:
            # Incrémenter unread_count pour les autres participants
            update_ops = {
                "$set": {
                    "last_message": {
                        "content": content,
                        "sender_id": sender_id,
                        "created_at": now
                    },
                    "updated_at": now
                }
            }
            
            # Incrémenter unread pour chaque participant sauf l'expéditeur
            for participant in conversation["participants"]:
                if participant["user_id"] != sender_id:
                    current_count = conversation.get("unread_count", {}).get(participant["user_id"], 0)
                    update_ops["$set"][f"unread_count.{participant['user_id']}"] = current_count + 1
            
            await db.conversations.update_one(
                {"id": conversation_id},
                update_ops
            )
        
        logger.info(f"Message {message_id} created in conversation {conversation_id}")
        return message
        
    except Exception as e:
        logger.error(f"Error creating message: {e}")
        raise
