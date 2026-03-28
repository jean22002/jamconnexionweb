# 📡 Jam Connexion - Documentation API Complète

**Base URL** : `https://collapsible-map.preview.emergentagent.com/api`
**Production URL** : `https://jamconnexion.com/api`

**Stack** : FastAPI + MongoDB Atlas

---

## 🔐 AUTHENTIFICATION

### POST `/auth/register`
**Description** : Créer un nouveau compte utilisateur

**Body** :
```json
{
  "email": "user@example.com",
  "password": "motdepasse123",
  "name": "Nom Complet",
  "role": "musician" | "venue" | "melomane"
}
```

**Response 201** :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Nom Complet",
    "role": "musician",
    "created_at": "2026-03-28T10:00:00Z",
    "subscription_status": null,
    "trial_end": null
  }
}
```

**Errors** :
- `400` : Email déjà utilisé
- `422` : Données invalides

---

### POST `/auth/login`
**Description** : Se connecter avec email/password

**Body** :
```json
{
  "email": "user@example.com",
  "password": "motdepasse123"
}
```

**Response 200** :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Nom Complet",
    "role": "musician",
    "created_at": "2026-03-28T10:00:00Z",
    "subscription_status": "active",
    "trial_end": "2026-04-04T10:00:00Z"
  }
}
```

**Errors** :
- `401` : Email ou mot de passe incorrect
- `422` : Données invalides

---

### GET `/auth/me`
**Description** : Récupérer les infos de l'utilisateur connecté

**Headers** :
```
Authorization: Bearer <token>
```

**Response 200** :
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Nom Complet",
  "role": "musician",
  "created_at": "2026-03-28T10:00:00Z",
  "subscription_status": "active",
  "trial_end": "2026-04-04T10:00:00Z"
}
```

**Errors** :
- `401` : Token invalide ou expiré

---

## 🎸 PROFIL MUSICIEN

### GET `/musicians/me`
**Description** : Récupérer le profil du musicien connecté

**Headers** :
```
Authorization: Bearer <token>
```

**Response 200** :
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "pseudo": "PseudoArtiste",
  "bio": "Guitariste passionné de blues...",
  "city": "Paris",
  "department": "75",
  "region": "Île-de-France",
  "music_styles": ["Blues", "Rock", "Jazz"],
  "instruments": ["Guitare", "Basse"],
  "profile_picture": "/api/uploads/musicians/photo.jpg",
  "tier": "pro",
  "created_at": "2026-01-15T10:00:00Z"
}
```

---

### PUT `/musicians/me`
**Description** : Mettre à jour le profil musicien

**Headers** :
```
Authorization: Bearer <token>
```

**Body** :
```json
{
  "pseudo": "NouveauPseudo",
  "bio": "Nouvelle bio...",
  "city": "Lyon",
  "department": "69",
  "region": "Auvergne-Rhône-Alpes",
  "music_styles": ["Jazz", "Soul"],
  "instruments": ["Piano"],
  "profile_picture": "/api/uploads/musicians/new-photo.jpg"
}
```

**Response 200** :
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "pseudo": "NouveauPseudo",
  ...
}
```

---

## 🎭 PROFIL MÉLOMANE

### GET `/melomanes/me`
**Description** : Récupérer le profil du mélomane connecté

**Headers** :
```
Authorization: Bearer <token>
```

**Response 200** :
```json
{
  "id": "uuid",
  "user_id": "uuid",
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

---

### PUT `/melomanes/me`
**Description** : Mettre à jour le profil mélomane

**Headers** :
```
Authorization: Bearer <token>
```

**Body** :
```json
{
  "pseudo": "NewPseudo",
  "bio": "Updated bio...",
  "city": "Nice",
  "favorite_styles": ["Jazz", "Blues"]
}
```

---

## 🏢 ÉTABLISSEMENTS

### GET `/venues`
**Description** : Récupérer la liste de tous les établissements

**Query Parameters** :
- `limit` (optional) : Nombre max de résultats (défaut: 100)
- `skip` (optional) : Pagination offset (défaut: 0)

**Response 200** :
```json
[
  {
    "id": "uuid",
    "name": "Le Jazz Club",
    "city": "Paris",
    "department": "75",
    "region": "Île-de-France",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "music_styles": ["Jazz", "Blues", "Soul"],
    "capacity": 150,
    "profile_image": "/api/uploads/venues/club-photo.jpg",
    "cover_image": "/api/uploads/venues/club-cover.jpg",
    "description": "Club de jazz intimiste...",
    "address": "10 Rue de la Musique",
    "postal_code": "75001",
    "phone": "0123456789",
    "email": "contact@jazzclub.fr",
    "website": "https://jazzclub.fr",
    "opening_hours": "20h-2h du mardi au samedi"
  }
]
```

---

### GET `/venues/{venue_id}`
**Description** : Récupérer les détails d'un établissement

**Response 200** :
```json
{
  "id": "uuid",
  "name": "Le Jazz Club",
  "city": "Paris",
  ...
}
```

**Errors** :
- `404` : Établissement non trouvé

---

### GET `/venues/my`
**Description** : Récupérer le profil de l'établissement connecté

**Headers** :
```
Authorization: Bearer <token>
```

**Response 200** :
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Le Jazz Club",
  ...
}
```

---

### PUT `/venues/my`
**Description** : Mettre à jour le profil établissement

**Headers** :
```
Authorization: Bearer <token>
```

**Body** : (Même structure que GET /venues/{id})

---

## 📅 PLANNING & ÉVÉNEMENTS

### GET `/planning/my`
**Description** : Récupérer les créneaux de planning d'un établissement

**Headers** :
```
Authorization: Bearer <token>
```

**Response 200** :
```json
[
  {
    "id": "slot_uuid",
    "venue_id": "uuid",
    "venue_name": "Le Jazz Club",
    "date": "2026-04-15",
    "start_time": "21:00",
    "end_time": "23:00",
    "music_styles": ["Jazz", "Blues"],
    "description": "Soirée jazz...",
    "status": "available",
    "created_at": "2026-03-20T10:00:00Z"
  }
]
```

---

### POST `/planning/slots`
**Description** : Créer un nouveau créneau de planning (établissement uniquement)

**Headers** :
```
Authorization: Bearer <token>
```

**Body** :
```json
{
  "date": "2026-04-15",
  "start_time": "21:00",
  "end_time": "23:00",
  "music_styles": ["Jazz", "Blues"],
  "description": "Soirée jazz live",
  "capacity": 1
}
```

**Response 201** :
```json
{
  "id": "slot_uuid",
  "venue_id": "uuid",
  ...
}
```

---

### GET `/planning/available`
**Description** : Récupérer tous les créneaux disponibles (pour musiciens)

**Headers** :
```
Authorization: Bearer <token>
```

**Response 200** : Array de slots disponibles

---

## 🎤 CANDIDATURES

### POST `/applications`
**Description** : Postuler à un créneau (musicien uniquement)

**Headers** :
```
Authorization: Bearer <token>
```

**Body** :
```json
{
  "slot_id": "slot_uuid",
  "band_id": "band_uuid",
  "message": "Nous serions ravis de jouer..."
}
```

**Response 201** :
```json
{
  "id": "application_uuid",
  "slot_id": "slot_uuid",
  "band_id": "band_uuid",
  "band_name": "Mon Groupe",
  "musician_id": "uuid",
  "message": "Nous serions ravis...",
  "status": "pending",
  "created_at": "2026-03-28T15:00:00Z"
}
```

---

### GET `/applications/my`
**Description** : Récupérer mes candidatures (musicien)

**Headers** :
```
Authorization: Bearer <token>
```

**Response 200** :
```json
[
  {
    "id": "application_uuid",
    "slot_id": "slot_uuid",
    "slot_date": "2026-04-15",
    "slot_start_time": "21:00",
    "slot_venue_name": "Le Jazz Club",
    "slot_venue_city": "Paris",
    "music_styles": ["Jazz", "Blues"],
    "band_name": "Mon Groupe",
    "status": "pending",
    "created_at": "2026-03-28T15:00:00Z"
  }
]
```

---

### GET `/applications/slot/{slot_id}`
**Description** : Récupérer les candidatures pour un créneau (établissement)

**Headers** :
```
Authorization: Bearer <token>
```

**Response 200** : Array de candidatures

---

### POST `/applications/{application_id}/accept`
**Description** : Accepter une candidature (établissement)

**Headers** :
```
Authorization: Bearer <token>
```

**Response 200** :
```json
{
  "id": "application_uuid",
  "status": "accepted",
  ...
}
```

---

### POST `/applications/{application_id}/reject`
**Description** : Refuser une candidature (établissement)

**Headers** :
```
Authorization: Bearer <token>
```

**Response 200** :
```json
{
  "id": "application_uuid",
  "status": "rejected",
  ...
}
```

---

## 🎸 GROUPES (BANDS)

### GET `/bands/my`
**Description** : Récupérer mes groupes (musicien)

**Headers** :
```
Authorization: Bearer <token>
```

**Response 200** :
```json
[
  {
    "id": "band_uuid",
    "name": "Mon Groupe",
    "admin_id": "musician_uuid",
    "members": [
      {
        "musician_id": "uuid",
        "name": "John Doe",
        "instrument": "Guitare",
        "status": "active"
      }
    ],
    "music_styles": ["Rock", "Blues"],
    "bio": "Groupe de rock formé en 2020...",
    "invite_code": "ABC123",
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

---

### POST `/bands`
**Description** : Créer un nouveau groupe (musicien)

**Headers** :
```
Authorization: Bearer <token>
```

**Body** :
```json
{
  "name": "Nouveau Groupe",
  "music_styles": ["Jazz", "Fusion"],
  "bio": "Description du groupe..."
}
```

**Response 201** : Groupe créé avec invite_code auto-généré

---

### POST `/bands/{band_id}/join`
**Description** : Rejoindre un groupe avec code d'invitation

**Headers** :
```
Authorization: Bearer <token>
```

**Body** :
```json
{
  "invite_code": "ABC123"
}
```

---

## 🔔 CONNEXIONS / ABONNEMENTS

### POST `/subscribe/{venue_id}`
**Description** : Se connecter à un établissement (mélomane/musicien)

**Headers** :
```
Authorization: Bearer <token>
```

**Response 201** :
```json
{
  "user_id": "uuid",
  "venue_id": "venue_uuid",
  "created_at": "2026-03-28T16:00:00Z"
}
```

---

### DELETE `/unsubscribe/{venue_id}`
**Description** : Se déconnecter d'un établissement

**Headers** :
```
Authorization: Bearer <token>
```

**Response 204** : No content

---

### GET `/my-subscriptions`
**Description** : Récupérer mes connexions

**Headers** :
```
Authorization: Bearer <token>
```

**Response 200** :
```json
[
  {
    "venue_id": "uuid",
    "venue_name": "Le Jazz Club",
    "city": "Paris",
    "created_at": "2026-03-28T16:00:00Z"
  }
]
```

---

## 📊 STATISTIQUES

### GET `/stats/counts`
**Description** : Récupérer les compteurs pour la landing page

**Response 200** :
```json
{
  "musicians": 150,
  "venues": 42,
  "melomanes": 320,
  "events": 87
}
```

---

## 📤 UPLOADS

### POST `/uploads/profile`
**Description** : Upload d'une image de profil

**Headers** :
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body** :
```
file: <image_file>
```

**Response 200** :
```json
{
  "url": "/api/uploads/musicians/uuid_filename.jpg"
}
```

**Limits** :
- Max file size: 10MB
- Formats acceptés: jpg, jpeg, png, webp

---

## 🔧 UTILITAIRES

### GET `/health`
**Description** : Health check de l'API

**Response 200** :
```json
{
  "status": "ok",
  "timestamp": "2026-03-28T17:00:00Z"
}
```

---

## ⚠️ CODES D'ERREUR COMMUNS

- `400` : Bad Request - Données invalides
- `401` : Unauthorized - Token manquant ou invalide
- `403` : Forbidden - Pas les permissions
- `404` : Not Found - Ressource non trouvée
- `422` : Unprocessable Entity - Validation échouée
- `500` : Internal Server Error - Erreur serveur

---

## 🔑 AUTHENTIFICATION

Toutes les routes protégées nécessitent un header :
```
Authorization: Bearer <token>
```

Le token JWT est retourné par `/auth/login` et `/auth/register`.

**Durée de vie** : 30 jours

---

## 📝 NOTES POUR MOBILE AGENT

1. **MongoDB Atlas** : Base de données en production
2. **CORS** : Activé pour tous les domaines
3. **Rate Limiting** : 100 requêtes/minute par IP
4. **Image Storage** : Fichiers stockés sur le serveur, URLs relatives
5. **Géolocalisation** : Latitude/longitude requises pour les établissements
6. **Pagination** : Limite de 100 résultats par défaut

---

**Date de dernière mise à jour** : 28 mars 2026
**Version API** : 1.0
