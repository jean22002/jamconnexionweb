# 📊 Jam Connexion - Data Models & Database Schema

**Database** : MongoDB Atlas
**Collections** : 10 principales

---

## 👤 USERS (Collection `users`)

**Description** : Utilisateurs du système (authentification)

```javascript
{
  "id": "uuid-string",                    // UUID custom
  "email": "user@example.com",            // Unique
  "password": "hashed_password",          // bcrypt
  "name": "Nom Complet",
  "role": "musician" | "venue" | "melomane",
  "created_at": "2026-03-28T10:00:00Z",   // ISO datetime
  "subscription_status": "active" | "canceled" | null,
  "trial_end": "2026-04-04T10:00:00Z" | null
}
```

**Indexes** :
- `email` (unique)
- `id` (unique)

---

## 🎸 MUSICIANS (Collection `musicians`)

**Description** : Profils des musiciens

```javascript
{
  "id": "uuid-string",
  "user_id": "uuid-string",              // FK → users.id
  "pseudo": "ArtistName",
  "bio": "Guitariste passionné...",
  "city": "Paris",
  "department": "75",
  "region": "Île-de-France",
  "music_styles": ["Blues", "Rock", "Jazz"],
  "instruments": ["Guitare", "Basse"],
  "profile_picture": "/api/uploads/musicians/photo.jpg",
  "tier": "free" | "pro",
  "pro_since": "2026-03-01T00:00:00Z" | null,
  "created_at": "2026-01-15T10:00:00Z"
}
```

**Indexes** :
- `user_id` (unique)
- `id` (unique)
- `city`
- `region`

---

## 🎭 MELOMANES (Collection `melomanes`)

**Description** : Profils des mélomanes

```javascript
{
  "id": "uuid-string",
  "user_id": "uuid-string",              // FK → users.id
  "pseudo": "MusicLover",
  "bio": "Passionné de musique live...",
  "city": "Marseille",
  "department": "13",
  "region": "Provence-Alpes-Côte d'Azur",
  "favorite_styles": ["Rock", "Metal", "Punk"],
  "profile_picture": "/api/uploads/melomanes/photo.jpg",
  "created_at": "2026-02-20T14:30:00Z"
}
```

**Indexes** :
- `user_id` (unique)
- `id` (unique)

---

## 🏢 VENUES (Collection `venues`)

**Description** : Établissements (bars, clubs, salles de concert)

```javascript
{
  "id": "uuid-string",
  "user_id": "uuid-string",              // FK → users.id
  "name": "Le Jazz Club",
  "description": "Club de jazz intimiste...",
  "city": "Paris",
  "department": "75",
  "region": "Île-de-France",
  "address": "10 Rue de la Musique",
  "postal_code": "75001",
  "latitude": 48.8566,                    // Required for map
  "longitude": 2.3522,                    // Required for map
  "music_styles": ["Jazz", "Blues", "Soul"],
  "capacity": 150,
  "profile_image": "/api/uploads/venues/club-photo.jpg",
  "cover_image": "/api/uploads/venues/club-cover.jpg",
  "phone": "0123456789",
  "email": "contact@jazzclub.fr",
  "website": "https://jazzclub.fr",
  "opening_hours": "20h-2h du mardi au samedi",
  "created_at": "2026-01-10T09:00:00Z"
}
```

**Indexes** :
- `user_id` (unique)
- `id` (unique)
- `city`
- `region`
- `latitude, longitude` (geospatial)

---

## 📅 PLANNING_SLOTS (Collection `planning_slots`)

**Description** : Créneaux disponibles créés par les établissements

```javascript
{
  "id": "uuid-string",
  "venue_id": "uuid-string",             // FK → venues.id
  "venue_name": "Le Jazz Club",          // Dénormalisé
  "date": "2026-04-15",                  // YYYY-MM-DD
  "start_time": "21:00",                 // HH:MM
  "end_time": "23:00",                   // HH:MM
  "music_styles": ["Jazz", "Blues"],
  "description": "Soirée jazz live...",
  "capacity": 1,                          // Nombre de groupes/musiciens
  "status": "available" | "booked" | "canceled",
  "created_at": "2026-03-20T10:00:00Z"
}
```

**Indexes** :
- `id` (unique)
- `venue_id`
- `date`
- `status`

---

## 🎤 APPLICATIONS (Collection `concert_applications`)

**Description** : Candidatures des musiciens aux créneaux

```javascript
{
  "id": "uuid-string",
  "slot_id": "uuid-string",              // FK → planning_slots.id
  "musician_id": "uuid-string",          // FK → musicians.id
  "band_id": "uuid-string" | null,       // FK → bands.id (optionnel)
  "band_name": "Mon Groupe",
  "musician_name": "John Doe",
  "message": "Nous serions ravis de jouer...",
  "status": "pending" | "accepted" | "rejected",
  "created_at": "2026-03-28T15:00:00Z",
  "updated_at": "2026-03-29T10:00:00Z"
}
```

**Indexes** :
- `id` (unique)
- `slot_id`
- `musician_id`
- `status`

---

## 🎸 BANDS (Collection `bands`)

**Description** : Groupes de musiciens

```javascript
{
  "id": "uuid-string",
  "name": "Mon Groupe",
  "admin_id": "uuid-string",             // FK → musicians.id (créateur)
  "members": [
    {
      "musician_id": "uuid-string",
      "name": "John Doe",
      "instrument": "Guitare",
      "status": "active" | "pending" | "left"
    }
  ],
  "music_styles": ["Rock", "Blues"],
  "bio": "Groupe de rock formé en 2020...",
  "invite_code": "ABC123",               // Auto-généré (6 caractères)
  "created_at": "2026-01-01T00:00:00Z"
}
```

**Indexes** :
- `id` (unique)
- `admin_id`
- `invite_code` (unique)

---

## 🔗 SUBSCRIPTIONS (Collection `subscriptions`)

**Description** : Connexions entre utilisateurs et établissements

```javascript
{
  "id": "uuid-string",
  "user_id": "uuid-string",              // FK → users.id (musician or melomane)
  "venue_id": "uuid-string",             // FK → venues.id
  "created_at": "2026-03-28T16:00:00Z"
}
```

**Indexes** :
- `user_id, venue_id` (compound unique)
- `venue_id`

---

## 🔔 NOTIFICATIONS (Collection `notifications`)

**Description** : Notifications utilisateur

```javascript
{
  "id": "uuid-string",
  "user_id": "uuid-string",              // FK → users.id
  "type": "application_response" | "new_opportunity" | "new_event",
  "title": "Candidature acceptée",
  "message": "Votre candidature au Jazz Club a été acceptée",
  "data": {                               // Metadata JSON
    "application_id": "uuid",
    "venue_id": "uuid"
  },
  "read": false,
  "created_at": "2026-03-29T10:00:00Z"
}
```

**Indexes** :
- `user_id`
- `read`
- `created_at`

---

## 💬 MESSAGES (Collection `messages`) - Future

**Description** : Messages entre utilisateurs

```javascript
{
  "id": "uuid-string",
  "conversation_id": "uuid-string",
  "sender_id": "uuid-string",            // FK → users.id
  "receiver_id": "uuid-string",          // FK → users.id
  "content": "Bonjour, je suis intéressé...",
  "read": false,
  "created_at": "2026-03-29T11:00:00Z"
}
```

---

## 📊 RELATIONS ENTRE ENTITÉS

```
USERS (1) ──→ (1) MUSICIANS
USERS (1) ──→ (1) MELOMANES
USERS (1) ──→ (1) VENUES

VENUES (1) ──→ (N) PLANNING_SLOTS
PLANNING_SLOTS (1) ──→ (N) APPLICATIONS

MUSICIANS (1) ──→ (N) APPLICATIONS
MUSICIANS (1) ──→ (N) BANDS (as admin)
MUSICIANS (N) ──→ (N) BANDS (as members)

USERS (N) ──→ (N) VENUES (via SUBSCRIPTIONS)

USERS (1) ──→ (N) NOTIFICATIONS
```

---

## 🔍 EXEMPLES DE REQUÊTES

### 1. Récupérer tous les établissements avec coordonnées GPS
```javascript
db.venues.find(
  { latitude: { $exists: true }, longitude: { $exists: true } },
  { _id: 0 }
)
```

### 2. Trouver les créneaux disponibles pour "Jazz"
```javascript
db.planning_slots.find({
  music_styles: "Jazz",
  status: "available",
  date: { $gte: "2026-03-29" }
})
```

### 3. Mes candidatures en attente
```javascript
db.concert_applications.find({
  musician_id: "my-musician-id",
  status: "pending"
})
```

### 4. Établissements suivis par un utilisateur
```javascript
db.subscriptions.aggregate([
  { $match: { user_id: "my-user-id" } },
  { $lookup: {
      from: "venues",
      localField: "venue_id",
      foreignField: "id",
      as: "venue"
  }},
  { $unwind: "$venue" }
])
```

---

## 📝 NOTES IMPORTANTES

1. **IDs** : Utilisez UUID v4 custom (pas ObjectId MongoDB)
2. **Dates** : Format ISO 8601 (ex: "2026-03-29T10:00:00Z")
3. **Images** : Stocker uniquement les paths relatifs (ex: `/api/uploads/...`)
4. **Exclusion _id** : Toujours exclure `_id` MongoDB avec `{"_id": 0}`
5. **Géolocalisation** : `latitude` et `longitude` sont **requis** pour venues
6. **Normalisation** : Certaines données dénormalisées pour performance (ex: `venue_name` dans `planning_slots`)

---

**Date** : 28 Mars 2026
**Version** : 1.0