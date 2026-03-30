# 🗄️ MongoDB Atlas - Architecture Base de Données

<div align="center">

![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

**Documentation MongoDB Atlas pour Jam Connexion Mobile**

</div>

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Architecture](#-architecture)
- [Ce que l'Agent Mobile DOIT savoir](#-ce-que-lagent-mobile-doit-savoir)
- [Ce que l'Agent Mobile NE DOIT PAS faire](#-ce-que-lagent-mobile-ne-doit-pas-faire)
- [Schéma de Données](#-schéma-de-données)
- [Exemples API](#-exemples-api)

---

## 🎯 Vue d'ensemble

**MongoDB Atlas** est la base de données **cloud** utilisée par Jam Connexion en production.

### Configuration Actuelle

```env
MONGO_URL_PRODUCTION="mongodb+srv://jean_jamconnexion:marcel22021983@customer-apps.xtch2ol.mongodb.net/test_database?retryWrites=true&w=majority"
DB_NAME="test_database"
ENVIRONMENT='production'
```

### Collections Principales

| Collection | Description | Documents |
|------------|-------------|-----------|
| `users` | Comptes utilisateurs (auth) | ~500 |
| `musicians` | Profils musiciens | ~200 |
| `venues` | Profils établissements | ~125 |
| `melomanes` | Profils mélomanes | ~100 |
| `bands` | Groupes musicaux | ~50 |
| `events` | Événements (jams, concerts, etc.) | ~300 |
| `applications` | Candidatures musiciens ↔ établissements | ~150 |
| `participations` | Participations événements | ~400 |
| `notifications` | Notifications utilisateurs | ~1000 |
| `reviews` | Avis/Reviews | ~80 |

---

## 🏗️ Architecture

### ⚠️ IMPORTANT : L'app mobile NE SE CONNECTE PAS directement à MongoDB

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  📱 APPLICATION MOBILE (React Native)                   │
│                                                          │
│       ❌ PAS de connexion MongoDB directe               │
│       ✅ Uniquement requêtes HTTP (axios)               │
│                                                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTPS (axios)
                     ↓
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  🌐 API BACKEND (FastAPI)                               │
│     https://jamconnexion.com/api                         │
│                                                          │
│     - Reçoit requêtes HTTP                              │
│     - Valide JWT tokens                                 │
│     - Applique la logique métier                        │
│     - Fait les requêtes MongoDB                         │
│                                                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Connection String MongoDB
                     ↓
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  🗄️ MONGODB ATLAS (Cloud Database)                     │
│     Cluster: customer-apps.xtch2ol.mongodb.net          │
│     Database: test_database                             │
│                                                          │
│     - Stocke toutes les données                         │
│     - Gère les transactions                             │
│     - Backups automatiques                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Pourquoi cette architecture ?

| Raison | Explication |
|--------|-------------|
| 🔐 **Sécurité** | La connection string MongoDB contient credentials sensibles |
| 🛡️ **Protection** | Empêche accès direct à la base depuis l'app |
| ✅ **Validation** | Le backend valide toutes les données avant insertion |
| 🔒 **Autorisation** | Le backend vérifie les permissions (JWT) |
| 🚀 **Performance** | Le backend peut optimiser les requêtes |
| 🧹 **Logique métier** | Toute la logique est centralisée |

---

## ✅ Ce que l'Agent Mobile DOIT savoir

### 1. MongoDB Atlas est TRANSPARENT pour l'app mobile

L'app mobile **ne sait même pas** que MongoDB existe. Elle voit seulement une **API REST**.

### 2. Pas besoin d'installer de driver MongoDB

```bash
# ❌ NE PAS FAIRE
npm install mongodb
npm install mongoose
npm install realm

# ✅ À LA PLACE, utiliser axios (déjà installé)
npm install axios
```

### 3. Toutes les opérations passent par l'API

**CRUD Exemples :**

| Opération | SQL | MongoDB | App Mobile |
|-----------|-----|---------|------------|
| **Create** | INSERT | `insertOne()` | `POST /api/...` |
| **Read** | SELECT | `find()` | `GET /api/...` |
| **Update** | UPDATE | `updateOne()` | `PUT /api/...` |
| **Delete** | DELETE | `deleteOne()` | `DELETE /api/...` |

### 4. Exemples Concrets

**Créer un profil musicien :**
```javascript
// ❌ JAMAIS FAIRE ÇA (connexion directe MongoDB)
const client = new MongoClient(MONGO_URL);
await client.db('test_database').collection('musicians').insertOne({
  pseudo: "John Doe",
  instruments: ["Guitare"]
});

// ✅ TOUJOURS FAIRE ÇA (via API)
await api.post('/musicians/me', {
  pseudo: "John Doe",
  instruments: ["Guitare"]
});
```

**Récupérer des établissements :**
```javascript
// ❌ JAMAIS
const venues = await db.collection('venues').find({}).toArray();

// ✅ TOUJOURS
const response = await api.get('/venues');
const venues = response.data;
```

---

## ❌ Ce que l'Agent Mobile NE DOIT PAS faire

### 1. ❌ Ne JAMAIS stocker la connection string MongoDB

```javascript
// ❌ INTERDIT - FAILLE DE SÉCURITÉ CRITIQUE
const MONGO_URL = "mongodb+srv://jean_jamconnexion:marcel22021983@...";

// ❌ INTERDIT - Même dans .env
MONGO_URL=mongodb+srv://...
```

**Pourquoi ?**
- L'app mobile est **décompilable**
- N'importe qui peut extraire les credentials
- Accès direct à toute la base de données = catastrophe

### 2. ❌ Ne PAS installer de driver MongoDB

```bash
# ❌ Ces packages sont INUTILES dans React Native
npm install mongodb
npm install mongoose
npm install realm
```

### 3. ❌ Ne PAS essayer de se connecter directement

```javascript
// ❌ INTERDIT
import { MongoClient } from 'mongodb';
const client = new MongoClient(MONGO_URL);
await client.connect();
```

### 4. ❌ Ne PAS implémenter de logique métier côté mobile

```javascript
// ❌ MAUVAIS - Logique dans l'app
const canApply = (musician, event) => {
  return musician.styles.some(s => event.styles.includes(s));
};

// ✅ BON - Laisser le backend décider
await api.post(`/events/${eventId}/apply`);
// Le backend vérifie si le musicien peut postuler
```

---

## 📊 Schéma de Données

### Collection `users`

```javascript
{
  "_id": ObjectId("..."),
  "id": "usr_123",
  "email": "john@example.com",
  "password": "$2b$12$...", // Hashé avec bcrypt
  "name": "John Doe",
  "role": "musician", // "musician", "venue", "melomane", "admin"
  "email_verified": true,
  "created_at": ISODate("2024-01-15T10:30:00Z")
}
```

### Collection `musicians`

```javascript
{
  "_id": ObjectId("..."),
  "id": "mus_456",
  "user_id": "usr_123",
  "pseudo": "JohnTheGuitarist",
  "instruments": ["Guitare", "Basse"],
  "music_styles": ["Rock", "Blues"],
  "city": "Paris",
  "region": "Île-de-France",
  "bio": "Guitariste passionné...",
  "profile_picture": "https://...",
  "is_pro": false,
  "created_at": ISODate("2024-01-15T10:35:00Z")
}
```

### Collection `venues`

```javascript
{
  "_id": ObjectId("..."),
  "id": "venue_789",
  "user_id": "usr_124",
  "name": "Le Blue Note",
  "address": "25 Rue des Lombards",
  "city": "Paris",
  "postal_code": "75011",
  "latitude": 48.8583,
  "longitude": 2.3470,
  "music_styles": ["Jazz", "Blues", "Soul"],
  "subscription_status": "active",
  "trial_days_left": 0,
  "profile_image": "https://...",
  "created_at": ISODate("2024-01-10T14:20:00Z")
}
```

### Collection `events`

```javascript
{
  "_id": ObjectId("..."),
  "id": "evt_101",
  "venue_id": "venue_789",
  "type": "jam", // "jam", "concert", "karaoke", "spectacle"
  "title": "Jam Session Rock",
  "date": "2024-03-15",
  "start_time": "20:00",
  "end_time": "23:00",
  "music_styles": ["Rock", "Blues"],
  "max_participants": 5,
  "participants": [
    {"id": "mus_456", "name": "John Doe"}
  ],
  "status": "open", // "open", "full", "cancelled"
  "created_at": ISODate("2024-03-01T09:00:00Z")
}
```

### Collection `bands`

```javascript
{
  "_id": ObjectId("..."),
  "id": "band_202",
  "admin_id": "mus_456",
  "name": "The Rockers",
  "type": "Groupe de reprise",
  "repertoire": "Reprises",
  "music_styles": ["Rock", "Blues"],
  "members": [
    {"id": "mus_456", "role": "Guitariste"},
    {"id": "mus_457", "role": "Batteur"}
  ],
  "invite_code": "ABC123", // Auto-généré
  "created_at": ISODate("2024-02-10T16:45:00Z")
}
```

---

## 🔌 Exemples API (Ce que l'app mobile utilise)

### Authentification

```javascript
// Login
const response = await api.post('/auth/login', {
  email: 'john@example.com',
  password: 'password123'
});

const { token, user } = response.data;
await AsyncStorage.setItem('jwt_token', token);
```

### Profils

```javascript
// Récupérer mon profil musicien
const response = await api.get('/musicians/me');
const musician = response.data;

// Mettre à jour mon profil
await api.put('/musicians/me', {
  bio: 'Nouvelle bio...',
  instruments: ['Guitare', 'Piano']
});
```

### Événements

```javascript
// Lister les événements
const response = await api.get('/events?type=jam');
const jams = response.data;

// Rejoindre un événement
await api.post(`/events/${eventId}/join`);

// Créer un événement (venue)
await api.post('/events', {
  type: 'concert',
  title: 'Concert Rock',
  date: '2024-03-20',
  start_time: '21:00',
  end_time: '23:00'
});
```

### Groupes

```javascript
// Créer un groupe
const response = await api.post('/bands', {
  name: 'The Rockers',
  type: 'Groupe de reprise',
  music_styles: ['Rock', 'Blues']
});

// Le backend génère automatiquement invite_code
console.log(response.data.invite_code); // "ABC123"

// Rejoindre avec code
await api.post('/bands/join', {
  code: 'ABC123'
});
```

---

## 🔐 Sécurité

### Ce que le Backend fait (transparent pour l'app)

1. ✅ **Validation JWT** : Vérifie que l'utilisateur est authentifié
2. ✅ **Permissions** : Vérifie que l'utilisateur a le droit de faire l'action
3. ✅ **Sanitization** : Nettoie les inputs pour éviter injections
4. ✅ **Projections MongoDB** : Exclut `_id` et champs sensibles
5. ✅ **Transactions** : Garantit la cohérence des données

### Exemple Backend (FastAPI)

```python
# L'app mobile appelle GET /api/musicians/me

@router.get("/musicians/me")
async def get_musician_profile(user: dict = Depends(get_current_user)):
    db = get_db()
    
    # 1. Vérifie JWT (get_current_user)
    # 2. Requête MongoDB avec projection (exclut _id)
    musician = await db.musicians.find_one(
        {"user_id": user["id"]},
        {"_id": 0}  # Exclut _id pour éviter erreur sérialisation
    )
    
    # 3. Retourne JSON
    return musician
```

---

## 📝 Bonnes Pratiques

### 1. Toujours utiliser l'API

```javascript
// ✅ BON
const fetchVenues = async () => {
  const response = await api.get('/venues');
  setVenues(response.data);
};
```

### 2. Gérer les erreurs

```javascript
try {
  const response = await api.get('/venues');
  setVenues(response.data);
} catch (error) {
  if (error.response?.status === 401) {
    // Token expiré
    logout();
  } else {
    Toast.show({ text: 'Erreur chargement', type: 'error' });
  }
}
```

### 3. Pagination pour grandes listes

```javascript
// ✅ Pagination côté backend
const response = await api.get('/venues?page=1&limit=20');
```

### 4. Cache local (optionnel)

```javascript
// Pour éviter trop de requêtes, cacher en local
const fetchVenues = async () => {
  // Vérifier cache
  const cached = await AsyncStorage.getItem('venues_cache');
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < 300000) { // 5 minutes
      return data;
    }
  }
  
  // Si pas de cache ou expiré, requête API
  const response = await api.get('/venues');
  
  // Mettre en cache
  await AsyncStorage.setItem('venues_cache', JSON.stringify({
    data: response.data,
    timestamp: Date.now()
  }));
  
  return response.data;
};
```

---

## 🎯 Résumé pour l'Agent Mobile

### ✅ À FAIRE

```javascript
// Configuration Axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://jamconnexion.com/api',
  timeout: 30000
});

// Requêtes API
const venues = await api.get('/venues');
const musician = await api.get('/musicians/me');
await api.post('/events', eventData);
```

### ❌ À NE PAS FAIRE

```javascript
// ❌ PAS de connexion MongoDB directe
import { MongoClient } from 'mongodb'; // ❌
const MONGO_URL = "mongodb+srv://..."; // ❌
await client.connect(); // ❌
```

---

## 🗂️ Collections Utilisées par l'App

| Collection | Utilisée via | Exemples Endpoints |
|------------|--------------|-------------------|
| `users` | ✅ Indirect | `/auth/login`, `/auth/register` |
| `musicians` | ✅ Oui | `/musicians/me`, `/musicians?search=...` |
| `venues` | ✅ Oui | `/venues`, `/venues/me`, `/venues/:id` |
| `melomanes` | ✅ Oui | `/melomanes/me` |
| `bands` | ✅ Oui | `/bands`, `/bands/join` |
| `events` | ✅ Oui | `/events`, `/planning/search` |
| `applications` | ✅ Oui | `/applications`, `/applications/sent` |
| `participations` | ✅ Oui | `/musicians/me/participations` |
| `notifications` | ✅ Oui | `/notifications` |
| `reviews` | ✅ Oui | `/reviews` |

**Accès :** 100% via API REST, 0% direct MongoDB

---

<div align="center">

**MongoDB Atlas = Backend uniquement** 🗄️  
**App Mobile = API REST uniquement** 📱  
**Jamais de connexion directe !** 🔒

</div>
