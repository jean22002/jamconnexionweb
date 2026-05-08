# 🔗 Référence Rapide API - Tous les Endpoints

**Version** : 2.1  
**Base URL** : `https://jamconnexion.com/api` ou `https://collapsible-map.preview.emergentagent.com/api`  
**Date** : 21 avril 2026

---

## 🔐 Authentification

Tous les endpoints (sauf login/register) nécessitent un token JWT :

```http
Authorization: Bearer {token}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Réponse** :
```json
{
  "token": "eyJhbGciOiJ...",
  "user": { ... }
}
```

---

## 🎸 Musiciens

### Profil

```http
GET  /api/musicians/me
PUT  /api/musicians/me
```

### Localisation Temporaire

```http
GET    /api/musicians/me/temporary-location
POST   /api/musicians/me/temporary-location
DELETE /api/musicians/me/temporary-location
```

Body (POST) :
```json
{
  "method": "gps",
  "latitude": 48.8566,
  "longitude": 2.3522
}
```
ou
```json
{
  "method": "manual",
  "city": "Paris",
  "postal_code": "75001"
}
```

---

## 🎤 Établissements

### Profil

```http
GET  /api/venues/me
PUT  /api/venues/me
GET  /api/venues
GET  /api/venues/{venue_id}
```

### **🆕 Préférences de Notifications**

```http
GET /api/venues/me/notification-preferences
PUT /api/venues/me/notification-preferences
```

Body (PUT) :
```json
{
  "new_participants": true,
  "new_applications": true,
  "application_cancellation": true,
  "new_messages": true,
  "new_followers": true
}
```

### Abonnés (Jacks)

```http
GET /api/venues/me/subscribers
```

### Stats

```http
GET /api/stats/promo
GET /api/stats/promo-musicians
GET /api/stats/counts
```

---

## 📅 Événements

### Concerts

```http
GET  /api/concerts
POST /api/concerts
GET  /api/concerts/{concert_id}
PUT  /api/concerts/{concert_id}
DELETE /api/concerts/{concert_id}
```

### Jams (Bœufs)

```http
GET  /api/jams
POST /api/jams
GET  /api/jams/{jam_id}
PUT  /api/jams/{jam_id}
DELETE /api/jams/{jam_id}
```

### Karaoké

```http
GET  /api/karaoke
POST /api/karaoke
GET  /api/karaoke/{karaoke_id}
PUT  /api/karaoke/{karaoke_id}
DELETE /api/karaoke/{karaoke_id}
```

### Spectacles

```http
GET  /api/spectacles
POST /api/spectacles
GET  /api/spectacles/{spectacle_id}
PUT  /api/spectacles/{spectacle_id}
DELETE /api/spectacles/{spectacle_id}
```

### Participations (Mélomanes)

```http
POST   /api/events/{event_id}/participate
DELETE /api/events/{event_id}/participate
```

---

## 📋 Planning & Candidatures

### Créneaux

```http
GET  /api/planning/slots
POST /api/planning/slots
GET  /api/planning/slots/{slot_id}
PUT  /api/planning/slots/{slot_id}
DELETE /api/planning/slots/{slot_id}
```

### Candidatures

```http
POST   /api/planning/applications
GET    /api/applications/my
GET    /api/venues/me/applications
PUT    /api/applications/{app_id}/accept
PUT    /api/applications/{app_id}/reject
DELETE /api/applications/{app_id}/cancel
DELETE /api/applications/{app_id}
```

---

## 🔔 Notifications

### Récupérer notifications

```http
GET /api/notifications
GET /api/notifications/unread/count
```

### Marquer comme lu

```http
PUT    /api/notifications/{notification_id}/read
PUT    /api/notifications/read-all
```

### Supprimer

```http
DELETE /api/notifications/{notification_id}
DELETE /api/notifications
```

---

## 💬 Messages

```http
GET  /api/messages
POST /api/messages
GET  /api/messages/conversations
GET  /api/messages/conversation/{user_id}
PUT  /api/messages/{message_id}/read
```

---

## 👥 Groupes Musicaux

### Gestion

```http
GET    /api/bands/my
POST   /api/bands
GET    /api/bands/{band_id}
PUT    /api/bands/{band_id}
DELETE /api/bands/{band_id}
```

### Invitations

```http
POST /api/band-invitations/join
GET  /api/band-invitations/pending
PUT  /api/band-invitations/{invitation_id}/accept
PUT  /api/band-invitations/{invitation_id}/reject
```

---

## 🏆 Badges & Trophées

```http
GET /api/badges/my
GET /api/badges/leaderboard
```

---

## 👫 Amis

```http
GET    /api/friends/
POST   /api/friends/request
PUT    /api/friends/{friend_id}/accept
PUT    /api/friends/{friend_id}/reject
DELETE /api/friends/{friend_id}
GET    /api/friends/requests
```

---

## 📊 Abonnements Établissements

### S'abonner (Jack)

```http
POST   /api/venues/{venue_id}/subscribe
DELETE /api/venues/{venue_id}/unsubscribe
GET    /api/my-subscriptions
```

---

## 💳 Stripe (Abonnements PRO)

### Liens de paiement (Redirection externe)

**Musicien PRO** : `https://buy.stripe.com/5kQfZgfFjfVK0te4CZafS04`
- Prix : 6,99€/mois
- Essai : 2 mois gratuits

**Établissement PRO** : `https://buy.stripe.com/3cI8wOfFj5h68ZKd9vafS03`
- Prix : 12,99€/mois
- Essai : 6 mois gratuits (100 premiers)

### URLs de retour

```
Success: /payment/success
Cancel:  /payment/cancel
```

---

## 🌐 Statut en ligne

```http
POST /api/online-status/heartbeat
GET  /api/online-status/mode
```

---

## 📤 Upload de fichiers

```http
POST /api/uploads/profile-image
POST /api/uploads/cover-image
POST /api/uploads/event-image
```

**Note** : Utiliser `multipart/form-data`

---

## 🔍 Recherche

### Musiciens à proximité

```http
POST /api/musicians/nearby
```

Body :
```json
{
  "latitude": 48.8566,
  "longitude": 2.3522,
  "radius_km": 50
}
```

### Établissements à proximité

```http
POST /api/venues/nearby
```

---

## 🌐 WebSocket (Notifications temps réel)

### Connexion

```javascript
import io from 'socket.io-client';

const socket = io('https://jamconnexion.com', {
  path: '/api/socket.io',
  auth: { token: jwt_token },
  transports: ['websocket']
});

socket.on('notification', (data) => {
  console.log('New notification:', data);
});
```

### Événements reçus

- `notification` - Nouvelle notification
- `application_status` - Statut de candidature
- `new_message` - Nouveau message
- `badge_unlocked` - Nouveau badge

---

## 📝 Codes de Réponse HTTP

| Code | Signification |
|------|---------------|
| `200` | Succès |
| `201` | Créé avec succès |
| `400` | Requête invalide |
| `401` | Non authentifié (token manquant/invalide) |
| `403` | Interdit (permissions insuffisantes) |
| `404` | Ressource non trouvée |
| `409` | Conflit (doublon) |
| `500` | Erreur serveur |

---

## 🧪 Comptes de Test

```javascript
// Musicien
{
  email: "test@gmail.com",
  password: "test"
}

// Établissement
{
  email: "bar@gmail.com",
  password: "test"
}

// Mélomane
{
  email: "melomane@test.com",
  password: "test"
}
```

---

## 📦 Format des Données

### Dates

Toutes les dates sont en **ISO 8601** :

```
"2026-04-21T10:30:00Z"
```

### IDs

Tous les IDs sont des **UUID v4** :

```
"550e8400-e29b-41d4-a716-446655440000"
```

### Images

URLs complètes retournées :

```
"https://storage.jamconnexion.com/images/profile_123.jpg"
```

---

## 🔄 Pagination

Les endpoints de liste supportent la pagination :

```http
GET /api/events?limit=20&skip=0
```

Paramètres :
- `limit` : Nombre d'éléments (défaut: 50, max: 100)
- `skip` : Nombre d'éléments à sauter (défaut: 0)

---

## 🚨 Gestion des Erreurs

Format standard :

```json
{
  "detail": "Message d'erreur descriptif"
}
```

### Exemple d'intégration avec gestion d'erreur

```javascript
try {
  const response = await fetch(`${API_URL}/api/venues/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  
  const data = await response.json();
  return data;
  
} catch (error) {
  if (error.message.includes('401')) {
    // Token expiré, redemander connexion
  } else if (error.message.includes('403')) {
    // Permissions insuffisantes
  } else {
    // Erreur générique
  }
}
```

---

## 📞 Support

- **Documentation complète** : `/app/API_SYNC_NOTIFICATION_PREFERENCES.md`
- **Credentials de test** : `/app/memory/test_credentials.md`
- **PRD** : `/app/memory/PRD.md`

---

**Version** : 2.1  
**Dernière mise à jour** : 21 avril 2026
