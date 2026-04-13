# 📡 Jam Connexion - API Documentation

**Base URL Production** : `https://jamconnexion.com/api`  
**Base URL Preview** : `https://collapsible-map.preview.emergentagent.com/api`  
**Base URL Local** : `http://localhost:8001/api`

---

## 📋 Table des matières

1. [Authentification](#authentification)
2. [Musiciens](#musiciens)
3. [Établissements](#établissements)
4. [Mélomanes](#mélomanes)
5. [Planning & Candidatures](#planning--candidatures)
6. [Messagerie](#messagerie)
7. [Notifications](#notifications)
8. [Fichiers & Uploads](#fichiers--uploads)
9. [Badges & Gamification](#badges--gamification)
10. [Modération](#modération)
11. [Admin](#admin)
12. [WebSocket (Socket.IO)](#websocket-socketio)
13. [Codes d'erreur](#codes-derreur)

---

## 🔐 Authentification

### Headers requis

Pour toutes les routes protégées :
```http
Authorization: Bearer {JWT_TOKEN}
```

---

### `POST /auth/register`

**Description** : Inscription d'un nouvel utilisateur

**Body** :
```json
{
  "email": "test@gmail.com",
  "password": "password123",
  "name": "John Doe",
  "role": "musician"  // "musician", "venue", "melomane"
}
```

**Response 201** :
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "email": "test@gmail.com",
    "name": "John Doe",
    "role": "musician",
    "email_verified": false
  }
}
```

---

### `POST /auth/login`

**Description** : Connexion utilisateur

**Body** :
```json
{
  "email": "test@gmail.com",
  "password": "password123"
}
```

**Response 200** :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "test@gmail.com",
    "name": "John Doe",
    "role": "musician",
    "subscription_tier": "free",
    "subscription_status": "inactive"
  }
}
```

---

### `GET /auth/me`

**Description** : Récupérer le profil de l'utilisateur connecté

**Headers** : `Authorization: Bearer {token}`

**Response 200** :
```json
{
  "id": "uuid",
  "email": "test@gmail.com",
  "name": "John Doe",
  "role": "musician",
  "subscription_tier": "pro",
  "subscription_status": "active",
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

### `POST /auth/verify-email`

**Description** : Vérifier l'email via code

**Body** :
```json
{
  "email": "test@gmail.com",
  "code": "123456"
}
```

**Response 200** :
```json
{
  "message": "Email verified successfully"
}
```

---

## 🎸 Musiciens

### `GET /musicians`

**Description** : Liste de tous les musiciens

**Query params** :
- `limit` (optionnel) : Nombre max de résultats (défaut: 100)
- `offset` (optionnel) : Pagination (défaut: 0)
- `style` (optionnel) : Filtrer par style musical

**Response 200** :
```json
[
  {
    "user_id": "uuid",
    "name": "John Doe",
    "instruments": ["Guitare", "Piano"],
    "music_styles": ["Rock", "Blues"],
    "experience_years": 10,
    "city": "Paris",
    "department": "75",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "profile_image": "/api/files/jamconnexion/profiles/...",
    "bio": "Musicien passionné...",
    "repertoire": "Reprises & Compositions",
    "availability": "weekends",
    "bands": [
      {
        "id": "uuid",
        "name": "The Beatles",
        "role": "admin",
        "invite_code": "ABC123"
      }
    ]
  }
]
```

---

### `GET /musicians/{id}`

**Description** : Détails d'un musicien

**Response 200** : (même structure que ci-dessus)

---

### `PUT /musicians/{id}`

**Description** : Mettre à jour le profil musicien

**Headers** : `Authorization: Bearer {token}`

**Body** :
```json
{
  "name": "John Doe",
  "instruments": ["Guitare"],
  "music_styles": ["Rock"],
  "experience_years": 12,
  "bio": "...",
  "city": "Paris",
  "latitude": 48.8566,
  "longitude": 2.3522
}
```

**Response 200** :
```json
{
  "message": "Profile updated",
  "musician": { /* profil mis à jour */ }
}
```

---

### `POST /musicians/bands`

**Description** : Créer un groupe

**Headers** : `Authorization: Bearer {token}`

**Body** :
```json
{
  "name": "The Rolling Stones",
  "description": "Rock band",
  "members": ["uuid1", "uuid2"]
}
```

**Response 201** :
```json
{
  "id": "uuid",
  "name": "The Rolling Stones",
  "admin_id": "uuid",
  "invite_code": "XYZ789",  // Généré automatiquement
  "created_at": "2026-04-13T12:00:00Z"
}
```

---

### `POST /musicians/bands/join`

**Description** : Rejoindre un groupe via code d'invitation

**Headers** : `Authorization: Bearer {token}`

**Body** :
```json
{
  "invite_code": "XYZ789"
}
```

**Response 200** :
```json
{
  "message": "Joined band successfully",
  "band": { /* détails du groupe */ }
}
```

---

## 🏢 Établissements

### `GET /venues`

**Description** : Liste de tous les établissements

**Query params** :
- `limit`, `offset` : Pagination
- `style` : Filtre par style musical
- `region` : Filtre par région
- `has_slots` : true/false (a des créneaux disponibles)

**Response 200** :
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Le Caveau",
    "city": "Paris",
    "address": "10 rue de la Paix",
    "postal_code": "75001",
    "department": "75",
    "region": "Île-de-France",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "phone": "+33123456789",
    "capacity": 150,
    "equipment": ["Sono", "Lumières", "Backline"],
    "music_styles": ["Jazz", "Blues"],
    "description": "Bar jazz cosy...",
    "profile_image": "/api/files/...",
    "cover_image": "/api/files/...",
    "is_guso": false,
    "allow_messages_from": "everyone",  // "everyone", "pro_only", "connected_only"
    "social_links": {
      "website": "https://...",
      "facebook": "...",
      "instagram": "..."
    }
  }
]
```

---

### `GET /venues/{id}`

**Description** : Détails d'un établissement

**Response 200** : (même structure)

---

### `PUT /venues/{id}`

**Description** : Mettre à jour le profil établissement

**Headers** : `Authorization: Bearer {token}`

**Body** : (champs modifiables)

**Response 200** :
```json
{
  "message": "Venue updated",
  "venue": { /* profil mis à jour */ }
}
```

---

## 🎧 Mélomanes

### `GET /melomanes`

**Description** : Liste des mélomanes

**Response 200** :
```json
[
  {
    "user_id": "uuid",
    "name": "Jane Doe",
    "favorite_styles": ["Rock", "Pop"],
    "city": "Lyon",
    "latitude": 45.75,
    "longitude": 4.85,
    "notifications_enabled": true,
    "notification_radius_km": 50,
    "profile_image": "/api/files/..."
  }
]
```

---

### `PUT /melomanes/{id}`

**Description** : Mettre à jour profil mélomane

**Headers** : `Authorization: Bearer {token}`

**Body** :
```json
{
  "favorite_styles": ["Jazz"],
  "notification_radius_km": 70
}
```

---

## 📅 Planning & Candidatures

### `GET /planning/jams`

**Description** : Liste des bœufs (jams)

**Query params** :
- `date_from` : Filtrer à partir d'une date (format YYYY-MM-DD)
- `style` : Style musical
- `region` : Région

**Response 200** :
```json
[
  {
    "id": "uuid",
    "venue_id": "uuid",
    "venue_name": "Le Caveau",
    "venue_city": "Paris",
    "type": "jam",
    "date": "2026-12-31",
    "start_time": "20:00",
    "end_time": "23:00",
    "music_styles": ["Jazz", "Blues"],
    "slots_available": 3,
    "slots_total": 5,
    "payment": 150.00,
    "description": "Soirée jam jazz",
    "requirements": "Niveau intermédiaire",
    "status": "open"
  }
]
```

---

### `GET /planning/concerts`

**Description** : Liste des concerts

**Query params** : (idem jams)

**Response 200** :
```json
[
  {
    "id": "uuid",
    "venue_id": "uuid",
    "venue_name": "Le Caveau",
    "type": "concert",
    "date": "2027-01-15",
    "start_time": "21:00",
    "title": "Soirée Blues",
    "music_styles": ["Blues"],
    "slots_available": 1,
    "payment": 300.00,
    "status": "open"
  }
]
```

---

### `POST /planning/{slot_id}/apply`

**Description** : Postuler à un créneau

**Headers** : `Authorization: Bearer {token}`

**Body** :
```json
{
  "band_id": "uuid",  // Optionnel pour musiciens solo
  "message": "Bonjour, je suis intéressé..."
}
```

**Response 201** :
```json
{
  "id": "uuid",
  "slot_id": "uuid",
  "musician_id": "uuid",
  "band_id": "uuid",
  "status": "pending",
  "applied_at": "2026-04-13T12:00:00Z"
}
```

---

### `GET /planning/applications`

**Description** : Mes candidatures

**Headers** : `Authorization: Bearer {token}`

**Query params** :
- `status` : "pending", "accepted", "rejected"

**Response 200** :
```json
[
  {
    "id": "uuid",
    "slot_id": "uuid",
    "event_type": "jam",
    "event_date": "2026-12-31",
    "venue_name": "Le Caveau",
    "band_name": "The Beatles",
    "status": "accepted",
    "applied_at": "2026-04-01T10:00:00Z",
    "responded_at": "2026-04-02T14:00:00Z"
  }
]
```

---

### `PUT /planning/applications/{id}/accept`

**Description** : Accepter une candidature (établissement uniquement)

**Headers** : `Authorization: Bearer {token}`

**Response 200** :
```json
{
  "message": "Application accepted",
  "application": { /* candidature mise à jour */ }
}
```

---

### `PUT /planning/applications/{id}/reject`

**Description** : Refuser une candidature

**Response 200** : (idem accept)

---

### `DELETE /planning/cleanup-obsolete`

**Description** : Supprimer les candidatures pour offres passées (établissement)

**Headers** : `Authorization: Bearer {token}`

**Response 200** :
```json
{
  "message": "42 obsolete applications deleted"
}
```

---

## 💬 Messagerie

### `POST /messages`

**Description** : Envoyer un message

**Headers** : `Authorization: Bearer {token}`

**Rate limit** : 20/minute

**Body** :
```json
{
  "recipient_id": "uuid",
  "subject": "Proposition de concert",
  "content": "Bonjour, je serais intéressé..."
}
```

**Response 201** :
```json
{
  "id": "uuid",
  "sender_id": "uuid",
  "sender_name": "John Doe",
  "sender_image": "/api/files/...",
  "recipient_id": "uuid",
  "recipient_name": "Jane Doe",
  "subject": "Proposition de concert",
  "content": "Bonjour...",
  "is_read": false,
  "created_at": "2026-04-13T12:00:00Z"
}
```

---

### `GET /messages/inbox`

**Description** : Messages reçus

**Headers** : `Authorization: Bearer {token}`

**Query params** :
- `limit` (défaut: 100) : Nombre de messages
- `offset` (défaut: 0) : Pagination

**Response 200** :
```json
[
  {
    "id": "uuid",
    "sender_id": "uuid",
    "sender_name": "John Doe",
    "sender_image": "/api/files/...",
    "subject": "Re: Concert",
    "content": "D'accord pour...",
    "is_read": false,
    "created_at": "2026-04-13T14:00:00Z"
  }
]
```

---

### `GET /messages/sent`

**Description** : Messages envoyés

**Query params** : (idem inbox)

**Response 200** : (même structure)

---

### `GET /messages/conversation/{partner_id}`

**Description** : Conversation avec un utilisateur (pour scroll infini)

**Headers** : `Authorization: Bearer {token}`

**Query params** :
- `limit` (défaut: 50)
- `offset` (défaut: 0)

**Response 200** :
```json
[
  {
    "id": "uuid",
    "sender_id": "uuid",
    "sender_name": "John Doe",
    "content": "Bonjour !",
    "created_at": "2026-04-13T12:00:00Z"
  },
  {
    "id": "uuid2",
    "sender_id": "partner_id",
    "sender_name": "Jane Doe",
    "content": "Salut !",
    "created_at": "2026-04-13T12:05:00Z"
  }
]
```

---

### `GET /messages/search`

**Description** : Rechercher dans les messages

**Headers** : `Authorization: Bearer {token}`

**Query params** :
- `query` (requis) : Texte recherché
- `partner_id` (optionnel) : Limiter à une conversation
- `limit` (défaut: 50)

**Response 200** :
```json
[
  {
    "id": "uuid",
    "sender_name": "John Doe",
    "content": "... texte contenant la recherche ...",
    "created_at": "2026-04-10T10:00:00Z"
  }
]
```

---

### `PUT /messages/{id}/read`

**Description** : Marquer un message comme lu

**Headers** : `Authorization: Bearer {token}`

**Response 200** :
```json
{
  "message": "Message marked as read"
}
```

---

## 🔔 Notifications

### `GET /notifications`

**Description** : Liste des notifications

**Headers** : `Authorization: Bearer {token}`

**Query params** :
- `unread_only` : true/false
- `limit`, `offset`

**Response 200** :
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "type": "jam_reminder",
    "title": "🎸 C'est aujourd'hui : Bœuf à 20:00 !",
    "message": "Le bœuf à Le Caveau commence à 20:00. À ce soir !",
    "link": "/venues/uuid",
    "read": false,
    "created_at": "2026-04-13T12:30:00Z"
  }
]
```

---

### `PUT /notifications/{id}/read`

**Description** : Marquer comme lue

**Headers** : `Authorization: Bearer {token}`

**Response 200** :
```json
{
  "message": "Notification marked as read"
}
```

---

### `POST /notifications/register-device`

**Description** : Enregistrer un token FCM pour push mobile

**Headers** : `Authorization: Bearer {token}`

**Body** :
```json
{
  "fcm_token": "firebase-cloud-messaging-token",
  "platform": "ios"  // ou "android"
}
```

**Response 200** :
```json
{
  "message": "Device registered"
}
```

---

## 📁 Fichiers & Uploads

### `GET /files/{filename}`

**Description** : Récupérer une image/fichier (proxy Object Storage)

**Exemple** :
```
GET /api/files/jamconnexion/profiles/abc-123/photo.webp
```

**Response 200** : Image binaire

---

### `POST /upload/musician-photo`

**Description** : Upload photo de profil musicien

**Headers** : 
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Body** :
```
file: <image.jpg>
```

**Response 200** :
```json
{
  "url": "/api/files/jamconnexion/profiles/uuid/photo.webp"
}
```

---

### `POST /upload/venue-photo`

**Description** : Upload photo établissement

(Même structure que musician-photo)

---

### `POST /upload/melomane-photo`

**Description** : Upload photo mélomane

(Même structure)

---

## 🏆 Badges & Gamification

### `GET /badges`

**Description** : Liste de tous les badges disponibles

**Response 200** :
```json
[
  {
    "id": "pioneer",
    "name": "Pionnier",
    "description": "Parmi les 100 premiers utilisateurs",
    "icon": "🚀",
    "points": 50
  },
  {
    "id": "social_butterfly",
    "name": "Social Butterfly",
    "description": "Participé à 10 événements",
    "icon": "🦋",
    "points": 30
  }
]
```

---

### `GET /badges/my-badges`

**Description** : Mes badges débloqués

**Headers** : `Authorization: Bearer {token}`

**Response 200** :
```json
[
  {
    "badge_id": "pioneer",
    "unlocked_at": "2026-01-15T10:00:00Z"
  }
]
```

---

### `GET /leaderboard`

**Description** : Classement des utilisateurs par points

**Query params** :
- `limit` (défaut: 100)

**Response 200** :
```json
[
  {
    "rank": 1,
    "user_id": "uuid",
    "name": "John Doe",
    "points": 250,
    "badges_count": 5
  }
]
```

---

## ⚠️ Modération

### `POST /moderation/report`

**Description** : Signaler un utilisateur

**Headers** : `Authorization: Bearer {token}`

**Body** :
```json
{
  "reported_user_id": "uuid",
  "reason": "spam",  // "spam", "harassment", "inappropriate", "fake"
  "description": "Cet utilisateur..."
}
```

**Response 201** :
```json
{
  "message": "Report submitted"
}
```

---

### `GET /moderation/my-reports`

**Description** : Mes signalements

**Headers** : `Authorization: Bearer {token}`

**Response 200** :
```json
[
  {
    "id": "uuid",
    "reported_user_id": "uuid",
    "reason": "spam",
    "status": "pending",
    "created_at": "2026-04-10T10:00:00Z"
  }
]
```

---

## 👨‍💼 Admin

### `GET /admin/moderation-settings`

**Description** : Récupérer paramètres de modération (admin uniquement)

**Headers** : `Authorization: Bearer {token}`

**Response 200** :
```json
{
  "auto_ban_report_threshold": 5,
  "temp_ban_duration_days": 7,
  "pioneer_badge_threshold": 100,
  "social_butterfly_participation_threshold": 10,
  "jam_master_participation_threshold": 25,
  "notification_radius_default_km": 50,
  "nearby_musician_radius_km": 70,
  "auto_review_threshold": 3,
  "updated_at": "2026-04-13T10:00:00Z",
  "updated_by": "admin-uuid"
}
```

---

### `PUT /admin/moderation-settings`

**Description** : Mettre à jour les paramètres (admin uniquement)

**Headers** : `Authorization: Bearer {token}`

**Body** :
```json
{
  "auto_ban_report_threshold": 6,
  "notification_radius_default_km": 60
}
```

**Response 200** : (paramètres mis à jour)

---

### `POST /admin/moderation-settings/reset`

**Description** : Réinitialiser aux valeurs par défaut

**Headers** : `Authorization: Bearer {token}`

**Response 200** :
```json
{
  "message": "Moderation settings reset to defaults",
  "settings": { /* valeurs par défaut */ }
}
```

---

### `GET /admin/reports`

**Description** : Liste de tous les signalements (admin uniquement)

**Headers** : `Authorization: Bearer {token}`

**Response 200** :
```json
[
  {
    "id": "uuid",
    "reporter_id": "uuid",
    "reporter_name": "John Doe",
    "reported_user_id": "uuid",
    "reported_user_name": "Spammer",
    "reason": "spam",
    "description": "...",
    "status": "pending",
    "created_at": "2026-04-10T10:00:00Z"
  }
]
```

---

## 🔌 WebSocket (Socket.IO)

### Connexion

```javascript
import io from 'socket.io-client';

const socket = io('https://jamconnexion.com', {
  path: '/api/socket.io',
  transports: ['websocket'],
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected to Socket.IO');
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

---

### Événements disponibles

#### `new_notification`

**Description** : Notification en temps réel

**Payload** :
```json
{
  "id": "uuid",
  "type": "jam_reminder",
  "title": "🎸 C'est aujourd'hui !",
  "message": "Le bœuf commence à 20:00",
  "link": "/venues/uuid",
  "created_at": "2026-04-13T12:30:00Z"
}
```

**Usage** :
```javascript
socket.on('new_notification', (notification) => {
  // Afficher notification push
  console.log('New notification:', notification.title);
});
```

---

#### `new_message`

**Description** : Nouveau message reçu

**Payload** :
```json
{
  "id": "uuid",
  "sender_id": "uuid",
  "sender_name": "Jane Doe",
  "content": "Salut !",
  "created_at": "2026-04-13T14:00:00Z"
}
```

**Usage** :
```javascript
socket.on('new_message', (message) => {
  // Mettre à jour la conversation
  console.log('New message from:', message.sender_name);
});
```

---

#### `application_status_changed`

**Description** : Changement de statut de candidature

**Payload** :
```json
{
  "application_id": "uuid",
  "status": "accepted",
  "event_date": "2026-12-31",
  "venue_name": "Le Caveau"
}
```

---

## ❌ Codes d'erreur

### HTTP Status Codes

| Code | Signification | Exemple |
|------|---------------|---------|
| 200 | OK | Requête réussie |
| 201 | Created | Ressource créée |
| 400 | Bad Request | Paramètres invalides |
| 401 | Unauthorized | Token manquant ou expiré |
| 403 | Forbidden | Accès refusé (ex: musicien FREE tente accès PRO) |
| 404 | Not Found | Ressource inexistante |
| 409 | Conflict | Conflit (ex: email déjà utilisé) |
| 429 | Too Many Requests | Rate limit dépassé |
| 500 | Internal Server Error | Erreur serveur |

---

### Erreurs détaillées

**Format** :
```json
{
  "detail": "Message d'erreur détaillé"
}
```

**Exemples** :

#### 401 Unauthorized
```json
{
  "detail": "Invalid token or expired"
}
```

#### 403 Forbidden
```json
{
  "detail": "Cet établissement n'accepte que les messages des musiciens PRO. Passez à l'abonnement PRO pour le contacter."
}
```

#### 404 Not Found
```json
{
  "detail": "Recipient not found"
}
```

#### 429 Rate Limit
```json
{
  "detail": "Rate limit exceeded. Try again in 60 seconds."
}
```

---

## 🧪 Exemples d'utilisation

### JavaScript (Axios)

```javascript
import axios from 'axios';

const API_URL = 'https://jamconnexion.com/api';

// Login
const login = async () => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email: 'test@gmail.com',
    password: 'test'
  });
  
  const token = response.data.token;
  localStorage.setItem('token', token);
  return token;
};

// Get venues
const getVenues = async (token) => {
  const response = await axios.get(`${API_URL}/venues`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  return response.data;
};

// Send message
const sendMessage = async (token, recipientId, content) => {
  const response = await axios.post(
    `${API_URL}/messages`,
    {
      recipient_id: recipientId,
      subject: 'Hello',
      content: content
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  
  return response.data;
};
```

---

### React Native (Axios)

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://jamconnexion.com/api';

// Login & save token
const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password
  });
  
  const token = response.data.token;
  await AsyncStorage.setItem('jwt_token', token);
  return token;
};

// Get token from storage
const getToken = async () => {
  return await AsyncStorage.getItem('jwt_token');
};

// Fetch with auth
const fetchProtectedData = async (endpoint) => {
  const token = await getToken();
  
  const response = await axios.get(`${API_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  return response.data;
};

// Upload image
const uploadImage = async (uri) => {
  const token = await getToken();
  
  const formData = new FormData();
  formData.append('file', {
    uri: uri,
    type: 'image/jpeg',
    name: 'photo.jpg'
  });
  
  const response = await axios.post(
    `${API_URL}/upload/musician-photo`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  
  return response.data.url;
};
```

---

### cURL

```bash
# Login
curl -X POST https://jamconnexion.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"test"}'

# Get venues (avec token)
curl -X GET https://jamconnexion.com/api/venues \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send message
curl -X POST https://jamconnexion.com/api/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_id":"uuid",
    "subject":"Hello",
    "content":"Bonjour!"
  }'

# Upload image
curl -X POST https://jamconnexion.com/api/upload/musician-photo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

---

## 📱 Considérations Mobile

### Rate Limiting

Respecter les limites :
- `/messages` : 20 requêtes/minute
- `/upload/*` : 10 requêtes/minute
- Autres : 100 requêtes/minute

### Retry Logic

En cas d'erreur 429, attendre `Retry-After` header secondes avant de réessayer.

### Offline Mode

Implémenter un cache local avec :
- AsyncStorage (React Native)
- Realm / WatermelonDB (pour données complexes)

### Pagination

Toujours utiliser `limit` et `offset` pour éviter de charger trop de données.

**Exemple scroll infini** :
```javascript
const loadMoreMessages = async () => {
  const offset = messages.length;
  const newMessages = await fetchMessages(partnerId, 50, offset);
  setMessages([...messages, ...newMessages]);
};
```

---

**Dernière mise à jour** : 13 avril 2026  
**Version API** : 2.0.0
