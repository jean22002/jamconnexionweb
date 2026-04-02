# 💬 Messagerie / Chat - Architecture Messages

<div align="center">

![Chat](https://img.shields.io/badge/Chat-Messaging_System-00B2FF?style=for-the-badge&logo=telegram&logoColor=white)

**Documentation Système de Messagerie pour Jam Connexion Mobile**

</div>

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Architecture](#-architecture)
- [Schéma de Données](#-schéma-de-données)
- [Endpoints Backend](#-endpoints-backend-à-créer)
- [Côté Mobile (React Native)](#-côté-mobile-react-native)
- [Composants UI](#-composants-ui)
- [Temps Réel (WebSocket)](#-temps-réel-websocket)
- [Exemples Code](#-exemples-code)

---

## 🎯 Vue d'ensemble

### État Actuel

✅ **CETTE FONCTIONNALITÉ EST ENTIÈREMENT IMPLÉMENTÉE** (Mise à jour : 2026-04-02)

| Composant | État | Fichier |
|-----------|------|---------|
| Collection `conversations` | ✅ Créée | MongoDB Atlas |
| Collection `messages` | ✅ Créée | MongoDB Atlas |
| Endpoints Backend | ✅ Implémentés | `/app/backend/routes/chat.py` |
| WebSocket Backend | ✅ Configuré | `/app/backend/websocket.py` (Socket.IO) |
| UI Mobile | ⚠️ Partiellement | À vérifier |

**Note** : ⚠️ Problème connu : Erreurs WebSocket en production dues à la configuration Cloudflare Proxy. Le code backend fonctionne.

### Cas d'Usage

| Qui | Avec Qui | Pourquoi |
|-----|----------|----------|
| 🎸 **Musicien** | 🏢 **Établissement** | Poser questions sur un événement, négocier détails |
| 🎸 **Musicien** | 🎸 **Musicien** | Échanger entre membres d'un groupe, organiser répétitions |
| 🏢 **Établissement** | 🎸 **Musicien** | Confirmer candidature, donner informations pratiques |
| 🎵 **Mélomane** | 🏢 **Établissement** | Réserver table, poser questions sur événement |

### Technologies Recommandées

| Composant | Technologie | Pourquoi |
|-----------|-------------|----------|
| **Backend Temps Réel** | Socket.IO | Simple, bi-directionnel, rooms/namespaces |
| **Alternative Backend** | FastAPI WebSocket | Natif FastAPI, mais nécessite gestion rooms manuelle |
| **Mobile** | Socket.IO Client | Compatible React Native, reconnexion auto |
| **Stockage Messages** | MongoDB | Déjà utilisé, flexible pour messages |

---

## 🏗️ Architecture

### Architecture REST + WebSocket

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  📱 APP MOBILE                                              │
│                                                              │
│  ┌────────────────────┐   ┌──────────────────────────┐    │
│  │  REST API (axios)  │   │  WebSocket (Socket.IO)   │    │
│  │                     │   │                           │    │
│  │  - Liste convos    │   │  - Recevoir messages     │    │
│  │  - Historique      │   │  - Envoyer messages      │    │
│  │  - Créer convo     │   │  - Typing indicators     │    │
│  └────────────────────┘   └──────────────────────────┘    │
│           │                           │                     │
└───────────┼───────────────────────────┼─────────────────────┘
            │                           │
            │ HTTPS                     │ WSS
            ↓                           ↓
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  🌐 BACKEND FASTAPI                                         │
│     https://jamconnexion.com                                │
│                                                              │
│  ┌────────────────────┐   ┌──────────────────────────┐    │
│  │  REST Endpoints    │   │  WebSocket Server        │    │
│  │  /api/chat/*       │   │  wss://jamconnexion.com  │    │
│  │                     │   │                           │    │
│  │  - GET convos      │   │  - socket.on("message")  │    │
│  │  - GET messages    │   │  - socket.emit("new_msg") │    │
│  │  - POST create     │   │  - Rooms par conversation │    │
│  └────────────────────┘   └──────────────────────────┘    │
│                                   │                         │
│                                   ↓                         │
│                          ┌─────────────────┐               │
│                          │  Redis (Cache)  │               │
│                          │  Session Socket │               │
│                          └─────────────────┘               │
│                                   │                         │
└───────────────────────────────────┼─────────────────────────┘
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  🗄️ MONGODB ATLAS                                          │
│                                                              │
│  ┌─────────────────────┐   ┌──────────────────────────┐   │
│  │  conversations      │   │  messages                │   │
│  │  {                   │   │  {                        │   │
│  │    id,              │   │    id,                   │   │
│  │    participants,    │   │    conversation_id,      │   │
│  │    last_message,    │   │    sender_id,            │   │
│  │    updated_at       │   │    content,              │   │
│  │  }                   │   │    created_at            │   │
│  │                      │   │  }                        │   │
│  └─────────────────────┘   └──────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Flux Message en Temps Réel

```
1️⃣ Utilisateur A tape message
   ↓
   socket.emit("send_message", { content, conversation_id })

2️⃣ Backend WebSocket reçoit
   - Valide JWT
   - Sauvegarde message dans MongoDB
   - Récupère participants de la conversation
   ↓

3️⃣ Backend émet vers tous les participants
   socket.to(conversation_id).emit("new_message", message)
   ↓

4️⃣ Utilisateur B reçoit (si connecté)
   - Affiche message dans l'UI
   - Joue son de notification
   - Incrémente badge
   ↓

5️⃣ Si Utilisateur B déconnecté
   - Notification push (Firebase)
   - Badge conversation non lue
```

---

## 📊 Schéma de Données

### Collection `conversations`

```javascript
{
  "_id": ObjectId("..."),
  "id": "conv_123",
  "type": "direct", // "direct" ou "group"
  "participants": [
    {
      "user_id": "usr_456",
      "role": "musician",
      "name": "John Doe",
      "avatar": "https://...",
      "last_read_at": "2024-03-15T20:30:00Z"
    },
    {
      "user_id": "usr_789",
      "role": "venue",
      "name": "Le Blue Note",
      "avatar": "https://...",
      "last_read_at": "2024-03-15T20:35:00Z"
    }
  ],
  "last_message": {
    "content": "D'accord, à demain !",
    "sender_id": "usr_456",
    "created_at": "2024-03-15T20:35:00Z"
  },
  "unread_count": {
    "usr_456": 0,
    "usr_789": 1
  },
  "created_at": "2024-03-10T10:00:00Z",
  "updated_at": "2024-03-15T20:35:00Z"
}
```

### Collection `messages`

```javascript
{
  "_id": ObjectId("..."),
  "id": "msg_789",
  "conversation_id": "conv_123",
  "sender_id": "usr_456",
  "sender_name": "John Doe",
  "sender_avatar": "https://...",
  "content": "Salut ! Encore de la place pour la jam session ?",
  "type": "text", // "text", "image", "audio", "file"
  "attachment": null, // URL si type != "text"
  "is_read": false,
  "read_by": ["usr_456"], // Liste des user_id ayant lu
  "created_at": "2024-03-15T20:30:00Z",
  "updated_at": "2024-03-15T20:30:00Z"
}
```

### Indexes MongoDB Recommandés

```javascript
// Collection conversations
db.conversations.createIndex({ "participants.user_id": 1 });
db.conversations.createIndex({ "updated_at": -1 });

// Collection messages
db.messages.createIndex({ "conversation_id": 1, "created_at": -1 });
db.messages.createIndex({ "sender_id": 1 });
```

---

## 🖥️ Endpoints Backend (À CRÉER)

### Installation

```bash
cd /app/backend
pip install python-socketio aiohttp
pip freeze > requirements.txt
```

### Code : Routes REST

**Fichier : `/app/backend/routes/chat.py`** (à créer)

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
from uuid import uuid4
from utils.auth import get_current_user
from database import get_db

router = APIRouter(prefix="/api/chat", tags=["chat"])

# ============================================
# Modèles
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
async def get_conversations(
    user: dict = Depends(get_current_user)
):
    """
    Récupère toutes les conversations de l'utilisateur
    """
    db = get_db()
    
    conversations = await db.conversations.find(
        {"participants.user_id": user["id"]},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(100)
    
    # Ajouter unread_count pour l'utilisateur
    for conv in conversations:
        conv["my_unread_count"] = conv["unread_count"].get(user["id"], 0)
    
    return conversations

@router.post("/conversations")
async def create_conversation(
    request: CreateConversationRequest,
    user: dict = Depends(get_current_user)
):
    """
    Crée une nouvelle conversation (ou retourne existante)
    """
    db = get_db()
    
    # Vérifier si conversation existe déjà
    existing = await db.conversations.find_one({
        "type": "direct",
        "participants.user_id": {"$all": [user["id"], request.participant_id]}
    }, {"_id": 0})
    
    if existing:
        return existing
    
    # Récupérer infos participant
    participant = await db.users.find_one(
        {"id": request.participant_id},
        {"_id": 0, "id": 1, "name": 1, "role": 1}
    )
    
    if not participant:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Récupérer avatar selon le rôle
    avatar_current = await get_user_avatar(db, user["id"], user["role"])
    avatar_participant = await get_user_avatar(db, participant["id"], participant["role"])
    
    # Créer conversation
    conversation_id = f"conv_{uuid4().hex[:12]}"
    conversation = {
        "id": conversation_id,
        "type": "direct",
        "participants": [
            {
                "user_id": user["id"],
                "role": user["role"],
                "name": user["name"],
                "avatar": avatar_current,
                "last_read_at": datetime.now(timezone.utc)
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
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.conversations.insert_one(conversation)
    
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

@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    user: dict = Depends(get_current_user)
):
    """
    Récupère les messages d'une conversation (pagination)
    """
    db = get_db()
    
    # Vérifier que l'utilisateur est participant
    conversation = await db.conversations.find_one({
        "id": conversation_id,
        "participants.user_id": user["id"]
    }, {"_id": 0})
    
    if not conversation:
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    # Pagination
    skip = (page - 1) * limit
    
    messages = await db.messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Inverser pour affichage chronologique
    messages.reverse()
    
    return {
        "messages": messages,
        "page": page,
        "limit": limit,
        "has_more": len(messages) == limit
    }

@router.post("/messages")
async def send_message(
    request: SendMessageRequest,
    user: dict = Depends(get_current_user)
):
    """
    Envoie un message (REST fallback si WebSocket indisponible)
    """
    db = get_db()
    
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

@router.put("/conversations/{conversation_id}/read")
async def mark_conversation_read(
    conversation_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Marque tous les messages d'une conversation comme lus
    """
    db = get_db()
    
    # Mettre à jour last_read_at
    result = await db.conversations.update_one(
        {
            "id": conversation_id,
            "participants.user_id": user["id"]
        },
        {
            "$set": {
                "participants.$.last_read_at": datetime.now(timezone.utc),
                f"unread_count.{user['id']}": 0
            }
        }
    )
    
    if result.modified_count > 0:
        return {"success": True}
    else:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")

# ============================================
# Fonctions Utilitaires
# ============================================

async def get_user_avatar(db, user_id: str, role: str):
    """Récupère l'avatar selon le rôle"""
    if role == "musician":
        profile = await db.musicians.find_one({"user_id": user_id}, {"_id": 0, "profile_picture": 1})
        return profile.get("profile_picture") if profile else None
    elif role == "venue":
        profile = await db.venues.find_one({"user_id": user_id}, {"_id": 0, "profile_image": 1})
        return profile.get("profile_image") if profile else None
    elif role == "melomane":
        profile = await db.melomanes.find_one({"user_id": user_id}, {"_id": 0, "profile_picture": 1})
        return profile.get("profile_picture") if profile else None
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
):
    """Crée et sauvegarde un message"""
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
    
    # Mettre à jour conversation
    conversation = await db.conversations.find_one(
        {"id": conversation_id},
        {"_id": 0, "participants": 1}
    )
    
    # Incrémenter unread_count pour les autres participants
    unread_updates = {}
    for participant in conversation["participants"]:
        if participant["user_id"] != sender_id:
            unread_updates[f"unread_count.{participant['user_id']}"] = {"$inc": 1}
    
    await db.conversations.update_one(
        {"id": conversation_id},
        {
            "$set": {
                "last_message": {
                    "content": content,
                    "sender_id": sender_id,
                    "created_at": now
                },
                "updated_at": now
            },
            "$inc": {k: 1 for k in unread_updates}
        }
    )
    
    return message
```

### Code : WebSocket (Socket.IO)

**Fichier : `/app/backend/websocket.py`** (à créer)

```python
import socketio
from fastapi import FastAPI
from utils.auth import verify_jwt_token

# Créer serveur Socket.IO
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)

# Wrapper ASGI
socket_app = socketio.ASGIApp(sio)

# Stockage des connexions (user_id -> session_id)
user_connections = {}

# ============================================
# Événements Socket.IO
# ============================================

@sio.event
async def connect(sid, environ, auth):
    """Connexion client"""
    try:
        # Vérifier JWT token
        token = auth.get('token')
        if not token:
            return False
        
        user = verify_jwt_token(token)
        if not user:
            return False
        
        # Sauvegarder connexion
        user_connections[user['id']] = sid
        await sio.save_session(sid, {'user_id': user['id'], 'user': user})
        
        print(f"✅ Utilisateur {user['id']} connecté (sid: {sid})")
        return True
        
    except Exception as e:
        print(f"❌ Erreur connexion : {e}")
        return False

@sio.event
async def disconnect(sid):
    """Déconnexion client"""
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    
    if user_id and user_id in user_connections:
        del user_connections[user_id]
    
    print(f"❌ Utilisateur {user_id} déconnecté")

@sio.event
async def join_conversation(sid, data):
    """Rejoindre une room (conversation)"""
    conversation_id = data.get('conversation_id')
    await sio.enter_room(sid, conversation_id)
    print(f"📥 {sid} a rejoint la conversation {conversation_id}")

@sio.event
async def leave_conversation(sid, data):
    """Quitter une room"""
    conversation_id = data.get('conversation_id')
    await sio.leave_room(sid, conversation_id)
    print(f"📤 {sid} a quitté la conversation {conversation_id}")

@sio.event
async def send_message(sid, data):
    """Envoyer un message en temps réel"""
    from database import get_db
    from routes.chat import send_message_internal, get_user_avatar
    
    session = await sio.get_session(sid)
    user = session.get('user')
    
    conversation_id = data.get('conversation_id')
    content = data.get('content')
    
    if not conversation_id or not content:
        await sio.emit('error', {'message': 'Données manquantes'}, room=sid)
        return
    
    db = get_db()
    
    # Récupérer avatar
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
    
    # Émettre vers tous les participants de la conversation
    await sio.emit('new_message', message, room=conversation_id, skip_sid=sid)
    
    # Confirmer au sender
    await sio.emit('message_sent', message, room=sid)
    
    print(f"💬 Message envoyé dans {conversation_id} par {user['id']}")

@sio.event
async def typing(sid, data):
    """Indicateur "en train d'écrire""""
    session = await sio.get_session(sid)
    user = session.get('user')
    conversation_id = data.get('conversation_id')
    
    # Émettre aux autres participants
    await sio.emit('user_typing', {
        'user_id': user['id'],
        'user_name': user['name'],
        'conversation_id': conversation_id
    }, room=conversation_id, skip_sid=sid)

# ============================================
# Intégration avec FastAPI
# ============================================

def init_websocket(app: FastAPI):
    """Monter Socket.IO sur FastAPI"""
    app.mount('/socket.io', socket_app)
    print("✅ WebSocket Socket.IO initialisé sur /socket.io")
```

### Intégration dans `server.py`

```python
# /app/backend/server.py

from websocket import init_websocket
from routes import chat

# Inclure routeur
app.include_router(chat.router)

# Initialiser WebSocket
init_websocket(app)
```

---

## 📱 Côté Mobile (React Native)

### Installation

```bash
npm install socket.io-client
npm install @react-native-community/netinfo  # Détection connexion
npm install react-native-gifted-chat  # UI Chat (optionnel)
```

### Configuration Socket.IO

**Fichier : `src/services/socketService.js`**

```javascript
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_URL } from '../config';

class SocketService {
  socket = null;
  connected = false;

  async connect() {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (!token) {
        console.log('❌ Pas de token JWT');
        return false;
      }

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connecté:', this.socket.id);
        this.connected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Socket déconnecté');
        this.connected = false;
      });

      this.socket.on('error', (error) => {
        console.error('Socket erreur:', error);
      });

      return true;
    } catch (error) {
      console.error('Erreur connexion socket:', error);
      return false;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  joinConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('join_conversation', { conversation_id: conversationId });
    }
  }

  leaveConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('leave_conversation', { conversation_id: conversationId });
    }
  }

  sendMessage(conversationId, content) {
    if (this.socket) {
      this.socket.emit('send_message', {
        conversation_id: conversationId,
        content
      });
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  onMessageSent(callback) {
    if (this.socket) {
      this.socket.on('message_sent', callback);
    }
  }

  sendTyping(conversationId) {
    if (this.socket) {
      this.socket.emit('typing', { conversation_id: conversationId });
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }
}

export default new SocketService();
```

**Fichier : `src/config.js`**
```javascript
export const API_URL = 'https://jamconnexion.com/api';
export const SOCKET_URL = 'https://jamconnexion.com'; // Socket.IO se connecte à la racine
```

### Écran Liste Conversations

**Fichier : `src/screens/ConversationsScreen.js`**

```javascript
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, Image } from 'react-native';
import api from '../services/api';
import socketService from '../services/socketService';

const ConversationsScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    
    // Connecter socket
    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/chat/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderConversation = ({ item }) => {
    // Trouver l'autre participant
    const otherParticipant = item.participants.find(
      (p) => p.user_id !== currentUserId
    );

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => navigation.navigate('Chat', { conversation: item })}
      >
        <Image
          source={{ uri: otherParticipant.avatar || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        <View style={styles.conversationInfo}>
          <Text style={styles.name}>{otherParticipant.name}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message?.content || 'Aucun message'}
          </Text>
        </View>
        {item.my_unread_count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.my_unread_count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchConversations}
      />
    </View>
  );
};

const styles = {
  container: { flex: 1, backgroundColor: '#fff' },
  conversationItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  conversationInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '600' },
  lastMessage: { fontSize: 14, color: '#666', marginTop: 4 },
  badge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' }
};

export default ConversationsScreen;
```

### Écran Chat (Avec Gifted Chat)

**Fichier : `src/screens/ChatScreen.js`**

```javascript
import React, { useEffect, useState, useCallback } from 'react';
import { GiftedChat, Bubble, InputToolbar } from 'react-native-gifted-chat';
import api from '../services/api';
import socketService from '../services/socketService';

const ChatScreen = ({ route }) => {
  const { conversation } = route.params;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
    
    // Rejoindre la conversation
    socketService.joinConversation(conversation.id);

    // Écouter nouveaux messages
    socketService.onNewMessage((message) => {
      addMessage(message);
    });

    // Marquer comme lu
    markAsRead();

    return () => {
      socketService.leaveConversation(conversation.id);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/chat/conversations/${conversation.id}/messages`);
      const formattedMessages = response.data.messages.map(formatMessage);
      setMessages(formattedMessages.reverse());
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMessage = (msg) => ({
    _id: msg.id,
    text: msg.content,
    createdAt: new Date(msg.created_at),
    user: {
      _id: msg.sender_id,
      name: msg.sender_name,
      avatar: msg.sender_avatar
    }
  });

  const addMessage = (message) => {
    setMessages((prev) => GiftedChat.append(prev, [formatMessage(message)]));
  };

  const markAsRead = async () => {
    try {
      await api.put(`/chat/conversations/${conversation.id}/read`);
    } catch (error) {
      console.error('Erreur marquage lu:', error);
    }
  };

  const onSend = useCallback((newMessages = []) => {
    const message = newMessages[0];
    
    // Envoyer via socket
    socketService.sendMessage(conversation.id, message.text);
    
    // Ajouter optimistic update
    setMessages((prev) => GiftedChat.append(prev, newMessages));
  }, []);

  return (
    <GiftedChat
      messages={messages}
      onSend={onSend}
      user={{
        _id: currentUserId  // À remplacer par l'ID réel
      }}
      placeholder="Tapez un message..."
      renderBubble={(props) => (
        <Bubble
          {...props}
          wrapperStyle={{
            right: { backgroundColor: '#007AFF' },
            left: { backgroundColor: '#E5E5EA' }
          }}
        />
      )}
      renderInputToolbar={(props) => (
        <InputToolbar
          {...props}
          containerStyle={{
            borderTopColor: '#E8E8E8',
            borderTopWidth: 1,
            padding: 8
          }}
        />
      )}
      loadEarlier={false}
      infiniteScroll
    />
  );
};

export default ChatScreen;
```

---

## 🎯 Résumé pour l'Agent Mobile

### ✅ Backend À CRÉER

1. Installer `python-socketio`
2. Créer `/app/backend/routes/chat.py` (endpoints REST)
3. Créer `/app/backend/websocket.py` (Socket.IO)
4. Créer collections MongoDB `conversations` et `messages`
5. Intégrer dans `server.py`

### ✅ Mobile À FAIRE

1. Installer `socket.io-client` et `react-native-gifted-chat`
2. Créer `socketService.js`
3. Créer écrans `ConversationsScreen` et `ChatScreen`
4. Connecter socket au login, déconnecter au logout
5. Gérer notifications push pour messages (via Firebase)

---

<div align="center">

**Socket.IO = Temps réel** ⚡  
**MongoDB = Persistance** 💾  
**Gifted Chat = UI professionnelle** 💬

</div>
