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
    return await get_current_user(request=None, authorization=authorization, db=db)

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
    Enrichit les participants avec name/role/avatar si manquants (compatibilité Web ↔ Mobile).
    """
    try:
        conversations = await db.conversations.find(
            {"participants.user_id": user["id"]},
            {"_id": 0}
        ).sort("updated_at", -1).to_list(100)
        
        # Cache pour éviter les requêtes redondantes
        user_cache = {}
        
        async def enrich_participant(p):
            uid = p.get("user_id")
            if not uid:
                return p
            # Fields déjà présents → on complète seulement les manquants
            need_name = not p.get("name")
            need_role = not p.get("role")
            need_avatar = "avatar" not in p or p.get("avatar") is None
            if not (need_name or need_role or need_avatar):
                return p
            
            if uid not in user_cache:
                u = await db.users.find_one(
                    {"id": uid},
                    {"_id": 0, "id": 1, "name": 1, "role": 1, "email": 1}
                )
                user_cache[uid] = u or {}
            u = user_cache[uid]
            if need_role and u.get("role"):
                p["role"] = u["role"]
            if need_name:
                resolved = await resolve_display_name(db, u)
                if resolved:
                    p["name"] = resolved
            if need_avatar and u.get("role"):
                p["avatar"] = await get_user_avatar(db, uid, u["role"])
            return p
        
        # Enrichir les participants + ajouter unread_count pour l'utilisateur
        for conv in conversations:
            participants = conv.get("participants", [])
            for i, p in enumerate(participants):
                participants[i] = await enrich_participant(p)
            conv["participants"] = participants
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
            {"_id": 0, "id": 1, "name": 1, "role": 1, "email": 1}
        )
        
        if not participant:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
        # === Check messaging preferences (venue recipient + musician sender) ===
        # Pour une NOUVELLE conversation, appliquer les restrictions de l'établissement.
        if participant.get("role") == "venue" and user.get("role") == "musician":
            venue_profile = await db.venues.find_one({"user_id": participant["id"]}, {"_id": 0})
            pref = (venue_profile or {}).get("allow_messages_from", "everyone")
            if pref != "everyone":
                if pref == "none":
                    raise HTTPException(status_code=403, detail="Ce lieu n'accepte pas de nouveaux messages")
                elif pref in ("pros_only", "pro_only"):
                    sender_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
                    is_pro = bool(
                        sender_user and
                        sender_user.get("subscription_tier") == "pro" and
                        sender_user.get("subscription_status") == "active"
                    )
                    if not is_pro:
                        raise HTTPException(status_code=403, detail="Ce lieu n'accepte que les messages des musiciens PRO")
                elif pref == "connected_only":
                    venue_id = (venue_profile or {}).get("id")
                    sub = None
                    if venue_id:
                        sub = await db.venue_subscriptions.find_one({
                            "venue_id": venue_id,
                            "user_id": user["id"]
                        })
                    if not sub:
                        raise HTTPException(status_code=403, detail="Ce lieu n'accepte que les messages de ses Jacks")
        
        # Récupérer avatars
        avatar_current = await get_user_avatar(db, user["id"], user["role"])
        avatar_participant = await get_user_avatar(db, participant["id"], participant["role"])
        
        # Récupérer noms de profil (fallback sur email si name manquant en DB)
        current_name = await resolve_display_name(db, user)
        participant_name = await resolve_display_name(db, participant)
        
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
                    "name": current_name,
                    "avatar": avatar_current,
                    "last_read_at": now
                },
                {
                    "user_id": participant["id"],
                    "role": participant["role"],
                    "name": participant_name,
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
        # Build 152.19 — retire l'`_id` ObjectId muté par insert_one (non-JSON-serializable)
        conversation.pop("_id", None)
        logger.info(f"Created conversation {conversation_id}")
        
        # Envoyer message initial si fourni
        if request.initial_message:
            await send_message_internal(
                db=db,
                conversation_id=conversation_id,
                sender_id=user["id"],
                sender_name=current_name,
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
        sender_name = await resolve_display_name(db, user)
        
        # Créer message
        message = await send_message_internal(
            db=db,
            conversation_id=request.conversation_id,
            sender_id=user["id"],
            sender_name=sender_name,
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

            # Build 152.21 — Marquer la notification message associée comme lue dans db.notifications
            try:
                await db.notifications.update_many(
                    {
                        "user_id": user["id"],
                        "type": "new_message",
                        "data.conversation_id": conversation_id,
                    },
                    {"$set": {"read": True, "read_at": now.isoformat()}},
                )
            except Exception as e:
                logger.warning(f"[chat] Failed to mark notifications read for {conversation_id}: {e}")

            # Build 152.20 — Émettre Socket.IO 'messages_read' dans la room de la conv
            # pour que les ticks passent au bleu côté clients connectés.
            try:
                from websocket import sio
                # Récupérer les IDs des messages marqués comme lus (ceux non envoyés par l'utilisateur courant)
                unread_msgs = await db.messages.find(
                    {
                        "conversation_id": conversation_id,
                        "sender_id": {"$ne": user["id"]},
                        "read_by": {"$nin": [user["id"]]},
                    },
                    {"_id": 0, "id": 1},
                ).to_list(500)
                message_ids = [m["id"] for m in unread_msgs]

                # Marquer chaque message comme lu par cet utilisateur (idempotent)
                if message_ids:
                    await db.messages.update_many(
                        {"conversation_id": conversation_id, "id": {"$in": message_ids}},
                        {"$addToSet": {"read_by": user["id"]}, "$set": {"is_read": True}},
                    )

                await sio.emit(
                    "messages_read",
                    {
                        "conversation_id": conversation_id,
                        "reader_id": user["id"],
                        "read_at": now.isoformat(),
                        "message_ids": message_ids,
                    },
                    room=conversation_id,
                )
            except Exception as e:
                logger.warning(f"[chat] failed to emit messages_read for {conversation_id}: {e}")

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
    Supprime une conversation ET tous ses messages (hard delete).

    Build 152.20 — Implémentation demandée par le mobile. L'utilisateur doit être
    participant de la conversation. La suppression est totale (pas de soft delete)
    pour les 2 côtés de la conv, car un chat 1:1 sans l'autre n'a pas de sens.
    """
    try:
        conv = await db.conversations.find_one({
            "id": conversation_id,
            "participants.user_id": user["id"],
        }, {"_id": 0, "id": 1})
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation introuvable")

        msg_res = await db.messages.delete_many({"conversation_id": conversation_id})
        conv_res = await db.conversations.delete_one({"id": conversation_id})

        logger.info(
            f"[chat] Deleted conversation {conversation_id} by user {user['id']} "
            f"({msg_res.deleted_count} messages)"
        )
        return {
            "success": True,
            "deleted_messages": msg_res.deleted_count,
            "deleted_conversation": conv_res.deleted_count,
        }

    except HTTPException:
        raise
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


async def resolve_display_name(db, user: dict) -> str:
    """
    Résout le nom d'affichage d'un utilisateur avec fallback intelligent :
    1. user.name (collection users)
    2. profile.name / profile.venue_name (collection musicians/venues/melomanes)
    3. user.email (dernier recours)
    """
    name = user.get("name")
    if name:
        return name
    
    user_id = user.get("id")
    role = user.get("role")
    
    try:
        if role == "musician" and user_id:
            profile = await db.musicians.find_one(
                {"user_id": user_id},
                {"_id": 0, "name": 1, "stage_name": 1}
            )
            if profile:
                return profile.get("stage_name") or profile.get("name") or user.get("email", "Utilisateur")
        elif role == "venue" and user_id:
            profile = await db.venues.find_one(
                {"user_id": user_id},
                {"_id": 0, "name": 1, "venue_name": 1}
            )
            if profile:
                return profile.get("venue_name") or profile.get("name") or user.get("email", "Utilisateur")
        elif role == "melomane" and user_id:
            profile = await db.melomanes.find_one(
                {"user_id": user_id},
                {"_id": 0, "name": 1, "username": 1}
            )
            if profile:
                return profile.get("username") or profile.get("name") or user.get("email", "Utilisateur")
    except Exception as e:
        logger.error(f"Error resolving display name: {e}")
    
    return user.get("email", "Utilisateur")


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
        # Build 152.19 — retire l'`_id` ObjectId muté par insert_one (non-JSON-serializable)
        message.pop("_id", None)
        
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

            # Build 152.21 — Persister une notification dans db.notifications pour peupler
            # l'écran /notifications du mobile. Dédupliqué par (conv, recipient) via un id
            # déterministe → 1 seule entrée par conv qui se rafraîchit à chaque nouveau msg.
            content_preview = (content or "")[:120]
            now_iso = now.isoformat() if hasattr(now, "isoformat") else str(now)
            for participant in conversation["participants"]:
                recipient_id = participant["user_id"]
                if recipient_id == sender_id:
                    continue
                notif_id = f"msg_notif_{conversation_id}_{recipient_id}"
                try:
                    await db.notifications.update_one(
                        {"id": notif_id},
                        {
                            "$set": {
                                "id": notif_id,
                                "user_id": recipient_id,
                                "type": "new_message",
                                "title": f"💬 Nouveau message de {sender_name}",
                                "message": content_preview,
                                "link": f"/messages/{conversation_id}",
                                "data": {
                                    "conversation_id": conversation_id,
                                    "sender_id": sender_id,
                                    "sender_name": sender_name,
                                    "message_id": message_id,
                                },
                                "read": False,
                                "updated_at": now_iso,
                            },
                            "$setOnInsert": {"created_at": now_iso},
                        },
                        upsert=True,
                    )
                except Exception as e:
                    logger.warning(f"[chat] Failed to persist notification for {recipient_id}: {e}")
        
        logger.info(f"Message {message_id} created in conversation {conversation_id}")
        return message
        
    except Exception as e:
        logger.error(f"Error creating message: {e}")
        raise
