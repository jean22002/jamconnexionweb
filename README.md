# 🎵 Jam Connexion - Documentation Complète

**Plateforme de mise en relation entre musiciens et établissements**

> Application full-stack (React + FastAPI + MongoDB Atlas) permettant aux musiciens de trouver des scènes et aux établissements de recruter des artistes pour leurs événements.

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
3. [Fonctionnalités principales](#fonctionnalités-principales)
4. [Structure du projet](#structure-du-projet)
5. [Variables d'environnement](#variables-denvironnement)
6. [Démarrage rapide](#démarrage-rapide)
7. [Documentation détaillée](#documentation-détaillée)
8. [API Endpoints](#api-endpoints)
9. [Intégrations tierces](#intégrations-tierces)
10. [Pour l'app mobile](#pour-lapp-mobile)

---

## 🎯 Vue d'ensemble

### Concept
Jam Connexion connecte :
- **Musiciens** : recherche de dates, de scènes, de collaborations
- **Établissements** (bars, salles de concert) : recherche d'artistes pour leurs événements
- **Mélomanes** : découverte de concerts et bœufs près de chez eux

### Modèle économique
- **Gratuit** pour les musiciens
- **Freemium** pour les établissements (7 jours d'essai, puis abonnement PRO)
- Abonnement PRO pour les musiciens (optionnel, fonctionnalités avancées)

### Statistiques actuelles
- **42 établissements** partenaires
- **12 régions** en France
- **100% gratuit** pour musiciens
- Notifications en temps réel
- Carte interactive géolocalisée

---

## 🏗️ Architecture technique

### Stack technique

**Backend :**
- **FastAPI** (Python 3.11)
- **MongoDB Atlas** (base de données production)
- **Motor** (driver MongoDB asynchrone)
- **Socket.IO** (notifications temps réel)
- **Pydantic** (validation des données)
- **JWT** (authentification)

**Frontend :**
- **React 18** (JavaScript)
- **Tailwind CSS** + **Shadcn UI**
- **Leaflet** (carte interactive)
- **Axios** (requêtes HTTP)
- **Socket.IO Client** (WebSocket)
- **React Router** (navigation)

**Infrastructure :**
- **MongoDB Atlas** (database cloud)
- **Cloudflare Pages** (hosting frontend production)
- **Emergent Object Storage** (images/fichiers)
- **Nominatim** (géocodage)

### Schéma d'architecture

```
┌─────────────────┐
│   React App     │ ← Frontend (Cloudflare Pages / Emergent Preview)
│  (Port 3000)    │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│   FastAPI       │ ← Backend (Port 8001)
│   + Socket.IO   │
└────────┬────────┘
         │
         ├─────────► MongoDB Atlas (Database)
         ├─────────► Emergent Object Storage (Images)
         └─────────► Nominatim API (Géocodage)
```

---

## ✨ Fonctionnalités principales

### 🎸 Pour les musiciens

1. **Profil complet**
   - Informations personnelles
   - Styles musicaux
   - Instruments joués
   - Groupes/projets
   - Photos de profil
   - Répertoire musical

2. **Recherche d'opportunités**
   - Carte interactive des établissements
   - Filtres par style musical, région, type d'événement
   - Filtre GUSO (Groupement d'Utilité Sociale)
   - Recherche par candidatures ouvertes

3. **Candidatures**
   - Postulation en 2 clics
   - Choix du groupe/projet
   - Suivi des candidatures (en attente, acceptées, refusées)
   - Historique complet

4. **Planning & Événements**
   - Visualisation du calendrier
   - Participation à des bœufs
   - Participation à des concerts
   - Notifications J-3 et Jour J

5. **Messagerie**
   - Chat direct avec établissements
   - Scroll infini (historique complet)
   - Recherche dans les conversations
   - Notifications en temps réel

6. **Gamification**
   - Badges (Pionnier, Social Butterfly, Jam Master, etc.)
   - Système de points
   - Leaderboard

7. **Notifications géolocalisées**
   - Événements à proximité (rayon configurable)
   - Nouvelles opportunités
   - Réponses aux candidatures

### 🏢 Pour les établissements

1. **Profil établissement**
   - Informations complètes
   - Photos du lieu
   - Équipement disponible
   - Capacité d'accueil
   - Styles musicaux acceptés

2. **Gestion du planning**
   - Création de créneaux (bœufs, concerts)
   - Dates, horaires, cachets
   - Nombre de places disponibles
   - Offres passées automatiquement masquées

3. **Recrutement**
   - Réception des candidatures
   - Filtrage par style, instrument
   - Acceptation/refus en 1 clic
   - Nettoyage automatique des candidatures obsolètes

4. **Messagerie pro**
   - Paramètres de confidentialité (tous, PRO uniquement, connectés uniquement)
   - Historique des échanges

5. **Analytics**
   - Statistiques de fréquentation
   - Villes les plus actives
   - Performance des événements

6. **Facturation**
   - Export des factures en ZIP
   - Suivi des abonnements

### 🎧 Pour les mélomanes

1. **Découverte**
   - Carte des concerts à venir
   - Filtres par style
   - Événements à proximité

2. **Participation**
   - Inscription aux concerts
   - Notifications personnalisées (rayon configurable)

3. **Réseau social**
   - Liste d'amis
   - Partage d'événements

---

## 📁 Structure du projet

```
/app
├── backend/                    # API FastAPI
│   ├── routes/                # Endpoints API
│   │   ├── auth.py           # Authentification (login, register)
│   │   ├── musicians.py      # CRUD musiciens
│   │   ├── venues.py         # CRUD établissements
│   │   ├── melomanes.py      # CRUD mélomanes
│   │   ├── planning.py       # Gestion planning & candidatures
│   │   ├── messages.py       # Messagerie (scroll infini, recherche)
│   │   ├── notifications.py  # Notifications
│   │   ├── files.py          # Proxy pour images (Object Storage)
│   │   ├── badges.py         # Système de badges
│   │   ├── moderation.py     # Signalements & modération
│   │   ├── moderation_settings.py  # Paramètres admin
│   │   ├── chat.py           # Chat temps réel (Socket.IO)
│   │   └── ...
│   ├── models/               # Schémas Pydantic
│   ├── utils/                # Utilitaires (auth, storage, etc.)
│   ├── middleware/           # Rate limiting, etc.
│   ├── server.py             # Point d'entrée FastAPI
│   ├── notifications_scheduler.py  # Cron notifications
│   └── requirements.txt      # Dépendances Python
│
├── frontend/                  # Application React
│   ├── src/
│   │   ├── pages/            # Pages principales
│   │   ├── components/       # Composants réutilisables
│   │   ├── features/         # Features complexes (dashboards)
│   │   ├── context/          # Contexts React (Auth, Badge, etc.)
│   │   ├── hooks/            # Hooks personnalisés
│   │   └── App.js            # Router principal
│   ├── public/
│   └── package.json          # Dépendances JS
│
├── memory/                    # Documents de référence
│   ├── PRD.md                # Product Requirements
│   └── test_credentials.md   # Identifiants de test
│
└── test_reports/             # Résultats des tests
```

---

## 🔐 Variables d'environnement

### Backend (`/app/backend/.env`)

```bash
# MongoDB (PRODUCTION)
MONGO_URL_PRODUCTION=mongodb+srv://...  # MongoDB Atlas
DB_NAME=test_database
ENVIRONMENT=production

# JWT
SECRET_KEY=votre-secret-jwt
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# Emergent Object Storage
EMERGENT_STORAGE_BUCKET=jamconnexion
EMERGENT_STORAGE_ACCESS_KEY=...
EMERGENT_STORAGE_SECRET_KEY=...
EMERGENT_STORAGE_ENDPOINT=https://integrations.emergentagent.com

# Resend (Emails)
RESEND_API_KEY=re_...

# Stripe (Paiements)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...

# Cloudflare (optionnel)
CLOUDFLARE_ZONE_ID=...
CLOUDFLARE_API_TOKEN=...
```

### Frontend (`/app/frontend/.env`)

```bash
# Backend API URL
REACT_APP_BACKEND_URL=https://jamconnexion.com
# OU en dev/preview :
# REACT_APP_BACKEND_URL=https://collapsible-map.preview.emergentagent.com
# OU en local :
# REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## 🚀 Démarrage rapide

### Prérequis

- **Python 3.11+**
- **Node.js 18+** & **Yarn**
- **MongoDB Atlas** (ou MongoDB local)

### Installation

#### 1. Backend

```bash
cd /app/backend

# Installer les dépendances
pip install -r requirements.txt

# Configurer .env
cp .env.example .env
# Éditer .env avec vos clés

# Démarrer le serveur
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

Le backend sera accessible sur `http://localhost:8001`

#### 2. Frontend

```bash
cd /app/frontend

# Installer les dépendances
yarn install

# Démarrer le serveur de développement
yarn start
```

Le frontend sera accessible sur `http://localhost:3000`

### Comptes de test

Voir `/app/memory/test_credentials.md` pour les identifiants.

**Exemple :**
- **Musicien** : `test@gmail.com` / `test`
- **Établissement** : `bar@gmail.com` / `test`
- **Admin** : `admin@example.com` / `admin`

---

## 📚 Documentation détaillée

### Backend
→ Voir `/app/backend/README.md`

### Frontend
→ Voir `/app/frontend/README.md`

### API Endpoints
→ Voir `/app/API_DOCUMENTATION.md`

---

## 🔌 API Endpoints (Résumé)

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/verify-email` - Vérification email
- `GET /api/auth/me` - Profil utilisateur

### Musiciens
- `GET /api/musicians` - Liste des musiciens
- `GET /api/musicians/{id}` - Détails musicien
- `PUT /api/musicians/{id}` - Mise à jour profil
- `POST /api/musicians/bands` - Créer un groupe

### Établissements
- `GET /api/venues` - Liste des établissements (avec lat/long/region)
- `GET /api/venues/{id}` - Détails établissement
- `PUT /api/venues/{id}` - Mise à jour profil

### Planning & Candidatures
- `GET /api/planning/jams` - Liste des bœufs
- `GET /api/planning/concerts` - Liste des concerts
- `POST /api/planning/{slot_id}/apply` - Postuler (avec band_id)
- `GET /api/planning/applications` - Mes candidatures
- `PUT /api/planning/applications/{id}/accept` - Accepter candidature
- `DELETE /api/planning/cleanup-obsolete` - Nettoyer candidatures obsolètes

### Messagerie
- `POST /api/messages` - Envoyer message
- `GET /api/messages/inbox?limit=50&offset=0` - Messages reçus (pagination)
- `GET /api/messages/sent?limit=50&offset=0` - Messages envoyés (pagination)
- `GET /api/messages/conversation/{partner_id}?limit=50&offset=0` - Conversation (scroll infini)
- `GET /api/messages/search?query=...&partner_id=...` - Recherche messages
- `PUT /api/messages/{id}/read` - Marquer comme lu

### Notifications
- `GET /api/notifications` - Liste notifications
- `PUT /api/notifications/{id}/read` - Marquer comme lue
- `WebSocket /api/socket.io` - Notifications temps réel

### Fichiers
- `GET /api/files/{filename}` - Proxy pour images (Object Storage)
- `POST /api/upload/musician-photo` - Upload photo musicien
- `POST /api/upload/venue-photo` - Upload photo établissement

### Admin
- `GET /api/admin/moderation-settings` - Paramètres modération
- `PUT /api/admin/moderation-settings` - Mettre à jour paramètres
- `GET /api/admin/reports` - Liste signalements

**Documentation complète :** `/app/API_DOCUMENTATION.md`

---

## 🔗 Intégrations tierces

### 1. MongoDB Atlas
- **Usage** : Base de données principale
- **Collections** : users, musicians, venues, melomanes, messages, notifications, etc.
- **Connection string** : Dans `MONGO_URL_PRODUCTION`

### 2. Emergent Object Storage
- **Usage** : Stockage des photos de profil et images
- **Endpoints** : Via proxy `/api/files/{filename}`
- **Bucket** : `jamconnexion`

### 3. Resend
- **Usage** : Envoi d'emails (vérification, notifications)
- **API Key** : `RESEND_API_KEY`

### 4. Stripe
- **Usage** : Abonnements PRO
- **Mode** : Test (clés de test fournies)
- **Webhooks** : `/api/webhooks/stripe`

### 5. Nominatim (OpenStreetMap)
- **Usage** : Géocodage automatique des adresses
- **API** : Publique, pas de clé requise
- **Rate limit** : 1 req/sec

### 6. Socket.IO
- **Usage** : Notifications temps réel
- **Endpoint** : `wss://jamconnexion.com/api/socket.io`

---

## 📱 Pour l'app mobile

### Points d'intégration clés

#### 1. Authentification
- Utiliser JWT tokens (retourné par `/api/auth/login`)
- Stocker le token en local (SecureStorage)
- Envoyer dans header : `Authorization: Bearer {token}`

#### 2. API Base URL
- **Production** : `https://jamconnexion.com/api`
- **Preview** : `https://collapsible-map.preview.emergentagent.com/api`

#### 3. WebSocket (Notifications temps réel)
```javascript
import io from 'socket.io-client';

const socket = io('https://jamconnexion.com', {
  path: '/api/socket.io',
  auth: { token: YOUR_JWT_TOKEN }
});

socket.on('new_notification', (data) => {
  // Afficher notification push
});
```

#### 4. Upload d'images
```javascript
const formData = new FormData();
formData.append('file', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'photo.jpg'
});

axios.post(
  'https://jamconnexion.com/api/upload/musician-photo',
  formData,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  }
);
```

#### 5. Carte interactive
- Utiliser `react-native-maps` (Google Maps ou Apple Maps)
- Endpoint : `GET /api/venues` retourne `latitude`, `longitude`, `region`
- Filtrer par `music_styles` côté client

#### 6. Pagination (scroll infini)
- Messages : `GET /api/messages/conversation/{partner_id}?limit=50&offset=0`
- Incrémenter `offset` de 50 à chaque scroll

#### 7. Notifications Push
- Intégrer Firebase Cloud Messaging (FCM)
- Envoyer le token FCM au backend : `POST /api/notifications/register-device`

#### 8. Géolocalisation
- Demander permission localisation
- Envoyer lat/long au backend pour calcul de proximité
- Backend utilise formule Haversine pour distances

#### 9. Formats de dates
- Toutes les dates sont en **ISO 8601** (ex: `2026-04-13T12:30:00Z`)
- Timezone : **Europe/Paris** pour affichage

#### 10. Gestion des erreurs
- **401** : Token expiré → Rediriger vers login
- **403** : Accès refusé (ex: musicien FREE tente d'accéder fonctionnalité PRO)
- **404** : Ressource non trouvée
- **429** : Rate limit dépassé → Retry après X secondes

### Modèles de données principaux

#### User
```json
{
  "id": "uuid",
  "email": "test@gmail.com",
  "name": "John Doe",
  "role": "musician" | "venue" | "melomane" | "admin",
  "subscription_tier": "free" | "pro",
  "subscription_status": "active" | "inactive",
  "created_at": "2026-01-01T00:00:00Z"
}
```

#### Musician
```json
{
  "user_id": "uuid",
  "instruments": ["Guitare", "Piano"],
  "music_styles": ["Rock", "Blues"],
  "experience_years": 10,
  "latitude": 48.8566,
  "longitude": 2.3522,
  "profile_image": "url",
  "bands": [
    {
      "id": "uuid",
      "name": "The Beatles",
      "invite_code": "ABC123"
    }
  ]
}
```

#### Venue
```json
{
  "user_id": "uuid",
  "name": "Le Caveau",
  "city": "Paris",
  "department": "75",
  "region": "Île-de-France",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "capacity": 150,
  "equipment": ["Sono", "Lumières"],
  "music_styles": ["Jazz", "Blues"],
  "is_guso": false,
  "profile_image": "url"
}
```

#### Planning Slot (Jam/Concert)
```json
{
  "id": "uuid",
  "venue_id": "uuid",
  "venue_name": "Le Caveau",
  "type": "jam" | "concert",
  "date": "2026-12-31",
  "start_time": "20:00",
  "end_time": "23:00",
  "music_styles": ["Jazz"],
  "slots_available": 3,
  "payment": 150.00,
  "status": "open" | "closed"
}
```

#### Message
```json
{
  "id": "uuid",
  "sender_id": "uuid",
  "sender_name": "John Doe",
  "sender_image": "url",
  "recipient_id": "uuid",
  "recipient_name": "Jane Doe",
  "subject": "Proposition de concert",
  "content": "Bonjour, je...",
  "is_read": false,
  "created_at": "2026-04-13T12:00:00Z"
}
```

### Fonctionnalités critiques pour mobile

1. **Notifications push** (Firebase)
2. **Géolocalisation** (permission utilisateur)
3. **Upload de photos** (camera + galerie)
4. **Carte interactive** (react-native-maps)
5. **Chat temps réel** (Socket.IO)
6. **Mode hors-ligne** (cache local avec AsyncStorage)

### Recommandations architecture mobile

**Stack suggérée :**
- **React Native** (cross-platform iOS/Android)
- **Expo** (gestion simplifiée)
- **React Navigation** (navigation)
- **React Query** (cache & synchronisation API)
- **Socket.IO Client** (WebSocket)
- **React Native Maps** (carte)
- **Expo Image Picker** (photos)
- **Expo Notifications** (push)

---

## 🧪 Tests

### Identifiants de test
Voir `/app/memory/test_credentials.md`

### Tests backend
```bash
cd /app/backend
pytest tests/
```

### Tests frontend
Utiliser le testing agent d'Emergent ou :
```bash
cd /app/frontend
yarn test
```

---

## 🐛 Problèmes connus & Solutions

### 1. Erreur 404 sur `/api/messages`
**Cause** : Build frontend avec mauvaise `REACT_APP_BACKEND_URL`  
**Solution** : Rebuild avec bonne URL + redéployer

### 2. Images ne s'affichent pas
**Cause** : Object Storage nécessite proxy backend  
**Solution** : Toujours utiliser `/api/files/{filename}`, jamais les URLs S3 directes

### 3. Socket.IO déconnexion
**Cause** : Token JWT expiré ou mauvaise config  
**Solution** : Vérifier token dans `auth` du socket

---

## 📞 Support

Pour toute question technique, consulter :
- `/app/backend/README.md` (Backend)
- `/app/API_DOCUMENTATION.md` (API)
- `/app/memory/PRD.md` (Spécifications produit)

---

**Dernière mise à jour** : 13 avril 2026  
**Version** : 2.0.0  
**Auteur** : Équipe Jam Connexion
