# 📱 README - Application Mobile Jam Connexion

## Vue d'ensemble

Jam Connexion est une plateforme de mise en relation entre **Musiciens**, **Mélomanes** et **Établissements** (bars, clubs, salles de concert).

---

## 🎭 Types de Profils

### 1. Musicien (`musician`)
- Créé des groupes (bands)
- Postule à des événements
- Consulte les offres des établissements
- Participe à des bœufs, karaoké, concerts

### 2. Mélomane (`melomane`)
- Découvre les événements musicaux
- Suit des musiciens/groupes
- Participe à des événements publics
- Laisse des avis

### 3. Établissement (`venue`)
- Crée des événements (bœufs, karaoké, concerts, spectacles)
- Publie des offres musicales
- Gère les candidatures
- Consulte les profils musiciens

---

## 🔐 Authentification & Profils

### API : `/api/auth/login`

**Request** :
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** :
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "musician" // ou "venue" ou "melomane"
  }
}
```

### Logique de Récupération du Profil

Selon le `role` retourné, l'app mobile appelle l'endpoint approprié :

#### Si `role === "musician"` :
```http
GET /api/musicians/me
Authorization: Bearer {token}
```

**Response** :
```json
{
  "id": "musician_123",
  "name": "GuitaristeTest",
  "email": "musicien@test.com",
  "instruments": ["Guitare", "Piano"],
  "genres": ["Rock", "Jazz"],
  "bands": [
    {
      "id": "band_1",
      "name": "The Beatles",
      "role": "admin" // ou "member"
    }
  ],
  "is_pro": false,
  "profile_complete": 85,
  "latitude": 48.8566,
  "longitude": 2.3522
}
```

#### Si `role === "venue"` :
```http
GET /api/venues/me
Authorization: Bearer {token}
```

**Response** :
```json
{
  "id": "venue_123",
  "name": "Bar Test",
  "email": "bar@test.com",
  "address": "123 rue Example",
  "city": "Paris",
  "venue_type": "Bar",
  "capacity": 100,
  "is_pro": true,
  "latitude": 48.8566,
  "longitude": 2.3522,
  "upcoming_events": [...]
}
```

#### Si `role === "melomane"` :
```http
GET /api/melomanes/me
Authorization: Bearer {token}
```

**Response** :
```json
{
  "id": "melomane_123",
  "name": "MusiqueAmateur",
  "email": "melomane@test.com",
  "favorite_genres": ["Rock", "Pop"],
  "followed_musicians": ["musician_456"],
  "latitude": 48.8566,
  "longitude": 2.3522
}
```

---

## 🎯 Logiques d'Interaction

### 1️⃣ Musicien → Établissement : "Se Connecter" (Postuler)

**Scénario** : Un musicien voit une offre d'un établissement et appuie sur "Se connecter à cet établissement"

#### Étape 1 : Consulter les Événements Disponibles

```http
GET /api/planning/search?venue_id={venue_id}
Authorization: Bearer {token}
```

**Response** :
```json
[
  {
    "id": "event_1",
    "type": "boeuf", // ou "karaoke", "concert", "spectacle"
    "venue_id": "venue_123",
    "venue_name": "Bar Test",
    "date": "2026-04-15T20:00:00Z",
    "genres": ["Rock", "Jazz"],
    "expected_attendance": 50,
    "applications_count": 3,
    "status": "open" // ou "closed", "cancelled"
  }
]
```

#### Étape 2 : Postuler à un Événement

```http
POST /api/applications
Authorization: Bearer {token}
Content-Type: application/json

{
  "event_id": "event_1",
  "event_type": "boeuf",
  "message": "Je serais ravi de participer !",
  "instrument": "Guitare"
}
```

**Response** :
```json
{
  "id": "application_123",
  "event_id": "event_1",
  "musician_id": "musician_123",
  "status": "pending", // ou "accepted", "rejected"
  "created_at": "2026-03-31T20:00:00Z"
}
```

#### Étape 3 : Suivi de la Candidature

```http
GET /api/applications/my-applications
Authorization: Bearer {token}
```

**Response** :
```json
[
  {
    "id": "application_123",
    "event_id": "event_1",
    "event_type": "boeuf",
    "venue_name": "Bar Test",
    "status": "pending",
    "applied_at": "2026-03-31T20:00:00Z"
  }
]
```

---

### 2️⃣ Établissement → Musicien : Consulter & Accepter

**Scénario** : Un établissement consulte les candidatures et accepte un musicien

#### Étape 1 : Voir les Candidatures

```http
GET /api/applications?event_id={event_id}
Authorization: Bearer {token}
```

**Response** :
```json
[
  {
    "id": "application_123",
    "musician_id": "musician_123",
    "musician_name": "GuitaristeTest",
    "instrument": "Guitare",
    "message": "Je serais ravi de participer !",
    "status": "pending",
    "profile_picture": "https://..."
  }
]
```

#### Étape 2 : Accepter/Rejeter une Candidature

```http
PATCH /api/applications/{application_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "accepted" // ou "rejected"
}
```

**Response** :
```json
{
  "id": "application_123",
  "status": "accepted",
  "updated_at": "2026-03-31T21:00:00Z"
}
```

---

### 3️⃣ Musicien → Groupe : Rejoindre un Groupe

**Scénario** : Un musicien reçoit une invitation à rejoindre un groupe

#### Étape 1 : Voir les Invitations

```http
GET /api/bands/invitations
Authorization: Bearer {token}
```

**Response** :
```json
[
  {
    "id": "invitation_1",
    "band_id": "band_456",
    "band_name": "The Beatles",
    "invited_by": "musician_789",
    "invited_by_name": "John Lennon",
    "status": "pending",
    "created_at": "2026-03-30T15:00:00Z"
  }
]
```

#### Étape 2 : Accepter/Refuser l'Invitation

```http
POST /api/bands/{band_id}/respond-invitation
Authorization: Bearer {token}
Content-Type: application/json

{
  "invitation_id": "invitation_1",
  "accept": true // ou false
}
```

**Response** :
```json
{
  "success": true,
  "message": "Vous avez rejoint le groupe The Beatles",
  "band_id": "band_456"
}
```

---

### 4️⃣ Mélomane → Événement : Découvrir & Participer

**Scénario** : Un mélomane découvre des événements et s'inscrit

#### Étape 1 : Découvrir les Événements

```http
GET /api/planning/search?latitude=48.8566&longitude=2.3522&radius=10
Authorization: Bearer {token}
```

**Response** :
```json
[
  {
    "id": "event_2",
    "type": "concert",
    "venue_name": "Le Zénith",
    "band_name": "The Beatles",
    "date": "2026-05-01T20:00:00Z",
    "genres": ["Rock"],
    "price": 25.0,
    "distance": 3.5 // km
  }
]
```

#### Étape 2 : Participer à un Événement

```http
POST /api/participations
Authorization: Bearer {token}
Content-Type: application/json

{
  "event_id": "event_2",
  "event_type": "concert",
  "number_of_tickets": 2
}
```

**Response** :
```json
{
  "id": "participation_123",
  "event_id": "event_2",
  "status": "confirmed",
  "tickets": 2,
  "total_price": 50.0
}
```

---

## 🔄 Relations & Flux de Données

### Diagramme des Relations

```
┌─────────────┐
│  MUSICIEN   │─────┐
│             │     │
│ - Postule   │     │
│ - Participe │     │
└─────────────┘     │
                    │
                    ▼
              ┌──────────────┐
              │  ÉVÉNEMENT   │
              │              │
              │ - Bœuf       │
              │ - Karaoké    │◄────┐
              │ - Concert    │     │
              │ - Spectacle  │     │
              └──────────────┘     │
                    ▲              │
                    │              │
┌─────────────┐     │         ┌────────────────┐
│  MÉLOMANE   │─────┘         │ ÉTABLISSEMENT  │
│             │               │                │
│ - Découvre  │               │ - Crée         │
│ - Participe │               │ - Gère         │
└─────────────┘               └────────────────┘
       │                               │
       │                               │
       └───────────► AVIS ◄────────────┘
```

---

## 🔔 Notifications en Temps Réel (WebSocket)

### Connexion Socket.IO

**Endpoint** : `wss://collapsible-map.preview.emergentagent.com/socket.io`

**Client Mobile (exemple React Native)** :

```javascript
import io from 'socket.io-client';

const socket = io('https://collapsible-map.preview.emergentagent.com', {
  auth: { token: userToken },
  transports: ['websocket', 'polling']
});

// Écouter les notifications
socket.on('notification', (message) => {
  const { notification_type, data } = message;
  
  switch(notification_type) {
    case 'new_invitation':
      // Afficher: "Invitation au groupe {data.band_name}"
      break;
    case 'application_accepted':
      // Afficher: "Votre candidature a été acceptée !"
      break;
    case 'new_event':
      // Afficher: "Nouvel événement: {data.event_name}"
      break;
  }
});

// Déconnexion
socket.on('disconnect', () => {
  console.log('WebSocket déconnecté');
});
```

### Types de Notifications

| Type | Destinataire | Déclencheur |
|------|-------------|-------------|
| `new_invitation` | Musicien | Invité à un groupe |
| `application_accepted` | Musicien | Candidature acceptée |
| `application_rejected` | Musicien | Candidature rejetée |
| `new_application` | Établissement | Nouvelle candidature |
| `new_event` | Tous | Nouvel événement créé |
| `event_reminder` | Participants | Rappel 24h avant |

---

## 📍 Géolocalisation & Recherche

### Recherche d'Établissements à Proximité

```http
GET /api/venues?latitude=48.8566&longitude=2.3522&radius=10
Authorization: Bearer {token}
```

**Response** :
```json
[
  {
    "id": "venue_123",
    "name": "Bar Test",
    "address": "123 rue Example",
    "city": "Paris",
    "distance": 2.3, // km
    "latitude": 48.8600,
    "longitude": 2.3500,
    "upcoming_events_count": 5
  }
]
```

### Recherche de Musiciens/Groupes

```http
GET /api/musicians/search?latitude=48.8566&longitude=2.3522&genres=Rock,Jazz&radius=20
Authorization: Bearer {token}
```

**Response** :
```json
[
  {
    "id": "musician_456",
    "name": "GuitaristeTest",
    "instruments": ["Guitare"],
    "genres": ["Rock"],
    "distance": 5.2, // km
    "is_pro": false,
    "bands": [...]
  }
]
```

---

## 🛡️ Modération (Nouveauté P3A)

### Configuration des Seuils de Modération

**Pour un Établissement** :

```http
GET /api/moderation/settings/venue/{venue_id}
Authorization: Bearer {token}
```

**Response** :
```json
{
  "entity_type": "venue",
  "entity_id": "venue_123",
  "auto_approve_delay": 24, // heures
  "auto_reject_delay": 72,
  "review_required_delay": 12,
  "require_manual_review": false,
  "enabled": true
}
```

**Mettre à jour** :

```http
PUT /api/moderation/settings/venue/{venue_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "auto_approve_delay": 48,
  "enabled": true
}
```

---

## 📊 Statistiques & Analytics

### Pour Établissement

```http
GET /api/stats/venue/{venue_id}
Authorization: Bearer {token}
```

**Response** :
```json
{
  "total_events": 45,
  "total_applications": 123,
  "accepted_applications": 67,
  "upcoming_events": 8,
  "total_reviews": 34,
  "average_rating": 4.2
}
```

### Pour Musicien

```http
GET /api/stats/musician/{musician_id}
Authorization: Bearer {token}
```

**Response** :
```json
{
  "total_applications": 23,
  "accepted_applications": 15,
  "total_participations": 12,
  "bands_count": 2,
  "average_rating": 4.5
}
```

---

## 🔑 Résumé des Endpoints Clés

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `POST /api/auth/logout` - Déconnexion

### Profils
- `GET /api/musicians/me` - Profil musicien
- `GET /api/venues/me` - Profil établissement
- `GET /api/melomanes/me` - Profil mélomane
- `PUT /api/musicians/me` - Mise à jour profil musicien

### Événements & Planning
- `GET /api/planning/search` - Rechercher événements
- `POST /api/applications` - Postuler à un événement
- `GET /api/applications/my-applications` - Mes candidatures

### Groupes (Bands)
- `GET /api/bands/my-bands` - Mes groupes
- `POST /api/bands` - Créer un groupe
- `POST /api/bands/{id}/invite` - Inviter un membre
- `GET /api/bands/invitations` - Mes invitations

### Recherche & Découverte
- `GET /api/venues` - Rechercher établissements
- `GET /api/musicians/search` - Rechercher musiciens
- `GET /api/planning/search` - Rechercher événements

### Modération (P3A)
- `GET /api/moderation/settings/{type}/{id}` - Config modération
- `PUT /api/moderation/settings/{type}/{id}` - Mettre à jour

### WebSocket
- `wss://.../socket.io` - Notifications temps réel

---

## 🧪 Tests & Credentials

### Comptes de Test

**Musicien** :
```
Email: test@gmail.com
Password: test
Role: musician
Name: GuitaristeTest
```

**Établissement** :
```
Email: bar@gmail.com
Password: test
Role: venue
Name: Bar Test
```

**Mélomane** :
```
Email: melomane@test.com
Password: test
Role: melomane
```

---

## 📱 Flow Complet : Exemple Concret

### Scénario : Un Musicien Postule à un Bœuf

**1. Connexion**
```
POST /api/auth/login
→ Récupère token + role: "musician"
```

**2. Récupération du profil**
```
GET /api/musicians/me
→ Récupère infos musicien (instruments, genres, localisation)
```

**3. Recherche d'événements**
```
GET /api/planning/search?genres=Rock&latitude=48.8566&longitude=2.3522
→ Liste des bœufs à proximité
```

**4. Consultation d'un événement**
```
Affichage des détails:
- Nom de l'établissement
- Date & heure
- Genres musicaux
- Nombre de candidatures
- Distance
```

**5. Bouton "Postuler" appuyé**
```
POST /api/applications
{
  "event_id": "event_123",
  "event_type": "boeuf",
  "message": "Guitariste rock avec 10 ans d'expérience",
  "instrument": "Guitare"
}
→ Candidature envoyée
```

**6. Notification temps réel (WebSocket)**
```
socket.on('notification', (msg) => {
  if (msg.notification_type === 'application_accepted') {
    // Afficher: "Votre candidature a été acceptée !"
  }
});
```

**7. Consultation du statut**
```
GET /api/applications/my-applications
→ Liste avec status: "accepted"
```

---

## 🎨 Recommandations UX Mobile

### Pour Musiciens
- **Page d'accueil** : Carte des événements à proximité
- **Filtres** : Par genre, date, distance
- **Notifications push** : Candidatures acceptées/rejetées
- **Profil** : Complétion à 100% = plus de visibilité

### Pour Établissements
- **Dashboard** : Vue d'ensemble des événements à venir
- **Gestion** : Accepter/rejeter candidatures en 1 clic
- **Statistiques** : Taux d'acceptation, événements populaires
- **Création rapide** : Templates d'événements

### Pour Mélomanes
- **Découverte** : Feed d'événements recommandés
- **Favoris** : Suivre musiciens/établissements
- **Agenda** : Calendrier des événements auxquels je participe
- **Social** : Partager, inviter des amis

---

## 📞 Support Technique

**En cas de problème** :
- Backend API : `https://collapsible-map.preview.emergentagent.com/api`
- Documentation complète : `/app/README_API_CONFIG.md`
- Troubleshooting : `/app/README_TROUBLESHOOTING_MOBILE.md`

---

**Version** : 1.0  
**Dernière mise à jour** : 31 Mars 2026  
**Contact** : support@jamconnexion.com

---

## 🚀 Quick Start Mobile

```javascript
// 1. Connexion
const login = async (email, password) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const { access_token, user } = await response.json();
  return { token: access_token, role: user.role };
};

// 2. Récupération profil selon role
const getProfile = async (token, role) => {
  const endpoint = {
    'musician': '/api/musicians/me',
    'venue': '/api/venues/me',
    'melomane': '/api/melomanes/me'
  }[role];
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};

// 3. Connexion WebSocket
const connectWebSocket = (token) => {
  const socket = io(API_URL, {
    auth: { token },
    transports: ['websocket', 'polling']
  });
  
  socket.on('notification', handleNotification);
  return socket;
};
```

**Vous êtes prêt à développer l'app mobile ! 🎉**
