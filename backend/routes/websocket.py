"""
WebSocket Server pour les notifications temps réel
Gère les connexions WebSocket et le broadcasting des événements
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from typing import Dict, Set, Optional
import json
import logging
from datetime import datetime, timezone

from utils.auth import decode_token

router = APIRouter(prefix="/ws", tags=["websocket"])
logger = logging.getLogger(__name__)

# Store active connections: {user_id: Set[WebSocket]}
active_connections: Dict[str, Set[WebSocket]] = {}

# Store connection metadata: {websocket_id: user_info}
connection_metadata: Dict[int, dict] = {}


class ConnectionManager:
    """Gestionnaire de connexions WebSocket"""
    
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.connection_metadata: Dict[int, dict] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str, user_type: str):
        """Accepte une nouvelle connexion"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        self.connection_metadata[id(websocket)] = {
            "user_id": user_id,
            "user_type": user_type,
            "connected_at": datetime.now(timezone.utc)
        }
        
        logger.info(f"✅ WebSocket connected: user_id={user_id}, type={user_type}, total_connections={len(self.active_connections[user_id])}")
        
        # Send welcome message
        await self.send_personal_message({
            "type": "connection_established",
            "message": "Connexion établie",
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }, websocket)
    
    def disconnect(self, websocket: WebSocket):
        """Déconnecte un client"""
        ws_id = id(websocket)
        
        if ws_id in self.connection_metadata:
            user_id = self.connection_metadata[ws_id]["user_id"]
            
            if user_id in self.active_connections:
                self.active_connections[user_id].discard(websocket)
                
                # Remove user entry if no more connections
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
            
            del self.connection_metadata[ws_id]
            logger.info(f"❌ WebSocket disconnected: user_id={user_id}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Envoie un message à une connexion spécifique"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
    
    async def send_to_user(self, user_id: str, message: dict):
        """Envoie un message à toutes les connexions d'un utilisateur"""
        if user_id in self.active_connections:
            disconnected = set()
            
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to user {user_id}: {e}")
                    disconnected.add(websocket)
            
            # Clean up disconnected websockets
            for ws in disconnected:
                self.disconnect(ws)
    
    async def broadcast(self, message: dict, exclude_user_id: Optional[str] = None):
        """Broadcast un message à tous les utilisateurs connectés"""
        for user_id, connections in list(self.active_connections.items()):
            if exclude_user_id and user_id == exclude_user_id:
                continue
            
            await self.send_to_user(user_id, message)
    
    async def broadcast_to_type(self, user_type: str, message: dict):
        """Broadcast à un type d'utilisateur spécifique (musician, venue, melomane)"""
        for ws_id, metadata in self.connection_metadata.items():
            if metadata["user_type"] == user_type:
                user_id = metadata["user_id"]
                await self.send_to_user(user_id, message)
    
    def get_active_users_count(self) -> int:
        """Retourne le nombre d'utilisateurs connectés"""
        return len(self.active_connections)
    
    def get_total_connections_count(self) -> int:
        """Retourne le nombre total de connexions"""
        return sum(len(connections) for connections in self.active_connections.values())


# Global connection manager
manager = ConnectionManager()


@router.websocket("/notifications")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT token pour l'authentification")
):
    """
    Endpoint WebSocket pour les notifications temps réel
    
    Usage:
    ws://localhost:8001/api/ws/notifications?token=YOUR_JWT_TOKEN
    
    Messages reçus:
    - {"type": "ping"} -> Keepalive
    - {"type": "subscribe", "channel": "events"} -> Subscribe to a channel
    
    Messages envoyés:
    - {"type": "notification", "data": {...}} -> Nouvelle notification
    - {"type": "event", "event_type": "...", "data": {...}} -> Événement métier
    """
    
    # Authenticate user from token
    try:
        payload = decode_token(token)
        user_id = payload.get("id")
        user_type = payload.get("type", "unknown")
        
        if not user_id:
            await websocket.close(code=1008, reason="Invalid token")
            return
    
    except Exception as e:
        logger.error(f"WebSocket auth error: {e}")
        await websocket.close(code=1008, reason="Authentication failed")
        return
    
    # Connect the user
    await manager.connect(websocket, user_id, user_type)
    
    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                message_type = message.get("type")
                
                # Handle ping/pong for keepalive
                if message_type == "ping":
                    await manager.send_personal_message({"type": "pong"}, websocket)
                
                # Handle subscription requests
                elif message_type == "subscribe":
                    channel = message.get("channel")
                    logger.info(f"User {user_id} subscribed to channel: {channel}")
                    await manager.send_personal_message({
                        "type": "subscribed",
                        "channel": channel
                    }, websocket)
                
                # Echo other messages (for debugging)
                else:
                    logger.info(f"Received message from {user_id}: {message_type}")
            
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received from {user_id}")
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info(f"Client {user_id} disconnected normally")
    
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(websocket)


@router.get("/stats")
async def websocket_stats():
    """Retourne les statistiques des connexions WebSocket"""
    return {
        "active_users": manager.get_active_users_count(),
        "total_connections": manager.get_total_connections_count(),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# Fonctions utilitaires pour envoyer des notifications depuis d'autres routes

async def notify_user(user_id: str, notification_type: str, data: dict):
    """
    Envoie une notification à un utilisateur spécifique
    
    Usage depuis d'autres routes:
    from routes.websocket import notify_user
    await notify_user("user_123", "new_message", {"from": "...", "text": "..."})
    """
    message = {
        "type": "notification",
        "notification_type": notification_type,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await manager.send_to_user(user_id, message)


async def broadcast_event(event_type: str, data: dict, exclude_user_id: Optional[str] = None):
    """
    Broadcast un événement à tous les utilisateurs
    
    Usage:
    await broadcast_event("new_jam_created", {"venue_id": "...", "date": "..."})
    """
    message = {
        "type": "event",
        "event_type": event_type,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await manager.broadcast(message, exclude_user_id=exclude_user_id)


async def notify_user_type(user_type: str, notification_type: str, data: dict):
    """
    Envoie une notification à tous les utilisateurs d'un type donné
    
    Usage:
    await notify_user_type("musician", "new_venue_event", {...})
    """
    message = {
        "type": "notification",
        "notification_type": notification_type,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await manager.broadcast_to_type(user_type, message)
