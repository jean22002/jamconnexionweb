import socketio
import logging
from fastapi import FastAPI

logger = logging.getLogger(__name__)

# Créer serveur Socket.IO avec configuration Cloudflare-friendly
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    # Keep-alive pour Cloudflare (timeout 100s)
    ping_interval=25,      # Envoyer un ping toutes les 25 secondes
    ping_timeout=60,       # Timeout si pas de pong en 60 secondes
    # Logs désactivés en production
    logger=False,
    engineio_logger=False,
    # Sécurité: Rejeter les connexions sans auth valide
    always_connect=False,
)

# Wrapper ASGI pour FastAPI
socket_app = socketio.ASGIApp(sio)

# Stockage des connexions utilisateurs (user_id -> session_id)
user_connections = {}

# DB (sera injecté)
db = None

def set_db(database):
    global db
    db = database

# ============================================
# Événements Socket.IO
# ============================================

@sio.event
async def connect(sid, environ, auth):
    """
    Gère la connexion d'un client WebSocket.
    
    Le client mobile doit envoyer son JWT token dans l'auth :
    ```javascript
    import io from 'socket.io-client';
    
    const socket = io('https://jamconnexion.com', {
      auth: { token: jwt_token },
      transports: ['websocket']
    });
    ```
    """
    try:
        logger.info(f"🔌 New connection attempt: {sid[:8]}... | Auth data received: {bool(auth)}")
        
        # Vérifier JWT token
        token = auth.get('token') if auth else None
        if not token:
            logger.warning(f"❌ Connection rejected (no token): {sid} | Auth: {auth}")
            return False
        
        logger.info(f"🔑 Token received for {sid[:8]}... (length: {len(token)})")
        
        # Valider token
        from utils.auth import decode_token
        payload = decode_token(token)
        
        logger.info(f"✅ Token decoded successfully | Payload keys: {list(payload.keys())}")
        
        # Extraire les infos utilisateur du payload
        user_id = payload.get('user_id')
        user_email = payload.get('email', '')
        user_role = payload.get('role', 'musician')
        
        if not user_id:
            logger.error(f"❌ Connection rejected (no user_id in payload): {sid} | Payload: {payload}")
            return False
        
        user = {
            'id': user_id,
            'name': user_email.split('@')[0] if user_email else 'Unknown',
            'role': user_role
        }
        
        logger.info(f"👤 User extracted: {user}")
        
        # Sauvegarder session
        user_connections[user['id']] = sid
        await sio.save_session(sid, {'user_id': user['id'], 'user': user})
        
        logger.info(f"✅ User {user['id']} ({user['name']}) connected successfully (sid: {sid[:8]}...)")
        return True
        
    except Exception as e:
        logger.error(f"❌ CRITICAL ERROR during connection handshake: {e}", exc_info=True)
        logger.error(f"   └─ SID: {sid} | Auth received: {auth}")
        return False


@sio.event
async def disconnect(sid):
    """
    Gère la déconnexion d'un client.
    """
    try:
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        
        if user_id and user_id in user_connections:
            del user_connections[user_id]
        
        logger.info(f"❌ User {user_id} disconnected (sid: {sid[:8]}...)")
        
    except Exception as e:
        logger.error(f"Error during disconnect: {e}")


@sio.event
async def join_conversation(sid, data):
    """
    Permet à un utilisateur de rejoindre une "room" de conversation.
    
    Usage mobile :
    ```javascript
    socket.emit('join_conversation', { conversation_id: 'conv_123' });
    ```
    """
    try:
        conversation_id = data.get('conversation_id')
        if not conversation_id:
            await sio.emit('error', {'message': 'conversation_id manquant'}, room=sid)
            return
        
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        
        # Vérifier que l'utilisateur est participant de cette conversation
        conversation = await db.conversations.find_one({
            "id": conversation_id,
            "participants.user_id": user_id
        }, {"_id": 0})
        
        if not conversation:
            await sio.emit('error', {'message': 'Conversation non trouvée'}, room=sid)
            return
        
        # Rejoindre la room
        await sio.enter_room(sid, conversation_id)
        logger.info(f"📥 User {user_id} joined conversation {conversation_id}")
        
        await sio.emit('joined_conversation', {'conversation_id': conversation_id}, room=sid)
        
    except Exception as e:
        logger.error(f"Error joining conversation: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)


@sio.event
async def leave_conversation(sid, data):
    """
    Permet à un utilisateur de quitter une room de conversation.
    """
    try:
        conversation_id = data.get('conversation_id')
        if not conversation_id:
            return
        
        await sio.leave_room(sid, conversation_id)
        
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        logger.info(f"📤 User {user_id} left conversation {conversation_id}")
        
    except Exception as e:
        logger.error(f"Error leaving conversation: {e}")


@sio.event
async def send_message(sid, data):
    """
    Reçoit un message d'un client et le diffuse aux autres participants.
    
    Usage mobile :
    ```javascript
    socket.emit('send_message', {
      conversation_id: 'conv_123',
      content: 'Salut !'
    });
    ```
    """
    try:
        conversation_id = data.get('conversation_id')
        content = data.get('content')
        
        if not conversation_id or not content:
            await sio.emit('error', {'message': 'Données manquantes'}, room=sid)
            return
        
        session = await sio.get_session(sid)
        user = session.get('user')
        
        # Récupérer infos utilisateur
        from routes.chat import get_user_avatar, send_message_internal
        avatar = await get_user_avatar(db, user['id'], user['role'])
        
        # Sauvegarder message dans MongoDB
        message = await send_message_internal(
            db=db,
            conversation_id=conversation_id,
            sender_id=user['id'],
            sender_name=user['name'],
            sender_avatar=avatar,
            content=content
        )
        
        # Émettre vers tous les participants (sauf l'expéditeur)
        await sio.emit('new_message', message, room=conversation_id, skip_sid=sid)
        
        # Confirmer à l'expéditeur
        await sio.emit('message_sent', message, room=sid)
        
        logger.info(f"💬 Message sent in {conversation_id} by {user['id']}")
        
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)


@sio.event
async def typing(sid, data):
    """
    Indique qu'un utilisateur est en train d'écrire.
    
    Usage mobile :
    ```javascript
    socket.emit('typing', { conversation_id: 'conv_123' });
    ```
    """
    try:
        conversation_id = data.get('conversation_id')
        if not conversation_id:
            return
        
        session = await sio.get_session(sid)
        user = session.get('user')
        
        # Émettre aux autres participants
        await sio.emit('user_typing', {
            'user_id': user['id'],
            'user_name': user['name'],
            'conversation_id': conversation_id
        }, room=conversation_id, skip_sid=sid)
        
    except Exception as e:
        logger.error(f"Error in typing event: {e}")


# ============================================
# Fonction d'initialisation
# ============================================

def init_websocket(app: FastAPI):
    """
    Monte Socket.IO sur l'application FastAPI.
    
    À appeler depuis server.py :
    ```python
    from websocket import init_websocket
    init_websocket(app)
    ```
    """
    app.mount('/socket.io', socket_app)
    logger.info("✅ WebSocket Socket.IO initialized on /socket.io")


# ============================================
# Helper pour envoyer des événements côté serveur
# ============================================

async def emit_to_user(user_id: str, event: str, data: dict):
    """
    Envoie un événement Socket.IO à un utilisateur spécifique.
    
    Utile pour notifier un utilisateur depuis n'importe où dans le backend :
    
    ```python
    from websocket import emit_to_user
    
    await emit_to_user(
        user_id="usr_123",
        event="notification",
        data={"title": "Nouveau message", "body": "..."}
    )
    ```
    """
    try:
        if user_id in user_connections:
            sid = user_connections[user_id]
            await sio.emit(event, data, room=sid)
            return True
        else:
            logger.debug(f"User {user_id} not connected via WebSocket")
            return False
    except Exception as e:
        logger.error(f"Error emitting to user {user_id}: {e}")
        return False
