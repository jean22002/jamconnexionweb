# 🔧 Jam Connexion - Backend Documentation

**FastAPI + MongoDB Atlas + Socket.IO**

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Stack technique](#stack-technique)
3. [Structure des fichiers](#structure-des-fichiers)
4. [Configuration](#configuration)
5. [Modèles de données](#modèles-de-données)
6. [Routes API](#routes-api)
7. [Authentification](#authentification)
8. [Base de données](#base-de-données)
9. [Notifications temps réel](#notifications-temps-réel)
10. [Scheduler](#scheduler)
11. [Déploiement](#déploiement)

---

## 🎯 Vue d'ensemble

Le backend Jam Connexion est une **API REST** construite avec **FastAPI** qui gère :
- Authentification JWT
- CRUD pour musiciens, établissements, mélomanes
- Gestion du planning et des candidatures
- Messagerie avec scroll infini et recherche
- Notifications en temps réel (Socket.IO)
- Upload de fichiers (Object Storage)
- Système de badges et gamification
- Modération et signalements

---

## 🛠️ Stack technique

| Technologie | Version | Usage |
|------------|---------|-------|
| **Python** | 3.11+ | Langage backend |
| **FastAPI** | 0.110+ | Framework API REST |
| **Uvicorn** | 0.27+ | Serveur ASGI |
| **Motor** | 3.3+ | Driver MongoDB asynchrone |
| **Pydantic** | 2.6+ | Validation des données |
| **python-jose** | 3.3+ | JWT tokens |
| **bcrypt** | 4.1+ | Hashing de mots de passe |
| **python-socketio** | 5.11+ | WebSocket temps réel |
| **Boto3** | 1.34+ | S3 Object Storage |
| **Resend** | 0.7+ | Envoi d'emails |
| **Stripe** | 8.0+ | Paiements |

---

## 📁 Structure des fichiers

```
/app/backend/
├── routes/                      # Endpoints API
│   ├── auth.py                 # Authentification
│   ├── musicians.py            # CRUD musiciens
│   ├── venues.py               # CRUD établissements
│   ├── melomanes.py            # CRUD mélomanes
│   ├── planning.py             # Planning & candidatures
│   ├── messages.py             # Messagerie (NEW: scroll infini, recherche)
│   ├── notifications.py        # Notifications
│   ├── files.py                # Proxy Object Storage
│   ├── badges.py               # Gamification
│   ├── moderation.py           # Signalements
│   ├── moderation_settings.py  # Paramètres admin (NEW)
│   ├── chat.py                 # Socket.IO handlers
│   ├── accounting.py           # Facturation
│   ├── config.py               # Configuration app
│   └── webhooks.py             # Webhooks Stripe
│
├── models/                      # Schémas Pydantic
│   ├── __init__.py             # Exports
│   ├── user.py                 # User, Login, Register
│   ├── musician.py             # MusicianProfile, Band
│   ├── venue.py                # VenueProfile
│   ├── planning.py             # Jam, Concert, Application
│   ├── message.py              # MessageCreate, MessageResponse
│   ├── notification.py         # Notification
│   ├── badge.py                # Badge
│   └── moderation.py           # ModerationSettings (NEW)
│
├── utils/                       # Utilitaires
│   ├── auth.py                 # get_current_user, verify_token
│   ├── storage.py              # Object Storage upload/download
│   ├── email.py                # Resend email sender
│   └── geocoding.py            # Nominatim API
│
├── middleware/                  # Middlewares
│   └── rate_limit.py           # Rate limiting
│
├── tests/                       # Tests
│   └── test_*.py
│
├── server.py                    # Point d'entrée FastAPI
├── notifications_scheduler.py  # Cron notifications (refactorisé)
├── requirements.txt            # Dépendances Python
├── .env                        # Variables d'environnement
└── README.md                   # Ce fichier
```

---

## ⚙️ Configuration

### Variables d'environnement (`.env`)

```bash
# MongoDB
MONGO_URL_PRODUCTION=mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=true&w=majority
DB_NAME=test_database
ENVIRONMENT=production

# JWT
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200  # 30 jours

# Object Storage (Emergent S3)
EMERGENT_STORAGE_BUCKET=jamconnexion
EMERGENT_STORAGE_ACCESS_KEY=your-access-key
EMERGENT_STORAGE_SECRET_KEY=your-secret-key
EMERGENT_STORAGE_ENDPOINT=https://integrations.emergentagent.com

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxx
```

### Démarrage

```bash
# Installation des dépendances
pip install -r requirements.txt

# Démarrer le serveur (dev)
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Démarrer le serveur (prod)
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 4

# Démarrer avec supervisor (recommandé en prod)
sudo supervisorctl start backend
```

Le serveur sera accessible sur `http://localhost:8001`

**Documentation interactive** : `http://localhost:8001/docs`

---

## 🗄️ Modèles de données

### User

```python
class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str  # "musician", "venue", "melomane", "admin"

class User(BaseModel):
    id: str
    email: str
    name: str
    role: str
    email_verified: bool = False
    subscription_tier: str = "free"  # "free", "pro"
    subscription_status: str = "inactive"  # "active", "inactive"
    created_at: str
```

### Musician

```python
class MusicianProfile(BaseModel):
    user_id: str
    instruments: List[str] = []
    music_styles: List[str] = []
    experience_years: int = 0
    city: Optional[str] = None
    department: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    repertoire: Optional[str] = None
    availability: Optional[str] = None
    bands: List[Band] = []

class Band(BaseModel):
    id: str
    name: str
    admin_id: str
    invite_code: str  # Généré automatiquement
    members: List[str] = []
    created_at: str
```

### Venue

```python
class VenueProfile(BaseModel):
    user_id: str
    name: str
    city: str
    address: str
    postal_code: str
    department: str
    region: str
    latitude: float
    longitude: float
    phone: Optional[str] = None
    capacity: int = 0
    equipment: List[str] = []
    music_styles: List[str] = []
    description: Optional[str] = None
    profile_image: Optional[str] = None
    is_guso: bool = False
    allow_messages_from: str = "everyone"  # "everyone", "pro_only", "connected_only"
```

### Planning (Jam/Concert)

```python
class PlanningSlot(BaseModel):
    id: str
    venue_id: str
    venue_name: str
    type: str  # "jam", "concert"
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str
    music_styles: List[str]
    slots_available: int
    slots_total: int
    payment: float = 0.0
    description: Optional[str] = None
    status: str = "open"  # "open", "closed"
```

### Application (Candidature)

```python
class Application(BaseModel):
    id: str
    slot_id: str
    musician_id: str
    band_id: Optional[str] = None  # NEW: Support groupes
    status: str = "pending"  # "pending", "accepted", "rejected"
    applied_at: str
    responded_at: Optional[str] = None
```

### Message

```python
class MessageCreate(BaseModel):
    recipient_id: str
    subject: str
    content: str

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    sender_image: Optional[str] = None
    recipient_id: str
    recipient_name: str
    subject: str
    content: str
    is_read: bool = False
    created_at: str
```

### ModerationSettings (NEW)

```python
class ModerationSettings(BaseModel):
    auto_ban_report_threshold: int = 5
    temp_ban_duration_days: int = 7
    pioneer_badge_threshold: int = 100
    social_butterfly_participation_threshold: int = 10
    jam_master_participation_threshold: int = 25
    notification_radius_default_km: int = 50
    nearby_musician_radius_km: int = 70
    auto_review_threshold: int = 3
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None
```

---

## 🔌 Routes API

### Structure

Chaque fichier dans `/routes` correspond à un domaine fonctionnel :

```python
# Exemple: routes/musicians.py
from fastapi import APIRouter

router = APIRouter(prefix="/musicians", tags=["Musicians"])

db = None

def set_db(database):
    global db
    db = database

@router.get("")
async def get_musicians():
    musicians = await db.musicians.find({}, {"_id": 0}).to_list(100)
    return musicians
```

### Enregistrement dans `server.py`

```python
import routes.musicians as musicians

# Injecter la DB
musicians.set_db(db)

# Inclure le router
api_router.include_router(musicians.router)
```

### Conventions

- **Préfixe** : `/api` (défini dans `server.py`)
- **Tags** : Pour organisation dans Swagger
- **Projection MongoDB** : Toujours exclure `_id` avec `{"_id": 0}`
- **Rate limiting** : Utiliser `@limiter.limit("X/minute")`

---

## 🔐 Authentification

### Génération de token JWT

```python
from utils.auth import create_access_token

token = create_access_token(data={"sub": user["id"]})
```

### Validation de token

```python
from utils.auth import get_current_user

@router.get("/protected")
async def protected_route(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}
```

### Hashing de mots de passe

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash
hashed = pwd_context.hash("password123")

# Verify
is_valid = pwd_context.verify("password123", hashed)
```

---

## 🗃️ Base de données

### MongoDB Atlas

**Collections principales** :
- `users` : Tous les utilisateurs
- `musicians` : Profils musiciens
- `venues` : Profils établissements
- `melomanes` : Profils mélomanes
- `bands` : Groupes musicaux
- `jams` : Bœufs
- `concerts` : Concerts
- `event_participations` : Participations aux événements
- `planning_applications` : Candidatures
- `messages` : Messages
- `notifications` : Notifications
- `badges` : Badges disponibles
- `user_badges` : Badges débloqués
- `reports` : Signalements
- `moderation_settings` : Paramètres modération (NEW)

### Connexion

```python
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.getenv("MONGO_URL_PRODUCTION")
DB_NAME = os.getenv("DB_NAME")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
```

### Requêtes

```python
# Find all
musicians = await db.musicians.find({}, {"_id": 0}).to_list(100)

# Find one
musician = await db.musicians.find_one({"user_id": user_id}, {"_id": 0})

# Insert
await db.musicians.insert_one(musician_doc)

# Update
await db.musicians.update_one(
    {"user_id": user_id},
    {"$set": {"name": "New Name"}}
)

# Delete
await db.musicians.delete_one({"user_id": user_id})
```

### Indexes recommandés

```javascript
// Dans MongoDB Atlas
db.musicians.createIndex({ "user_id": 1 }, { unique: true })
db.venues.createIndex({ "latitude": 1, "longitude": 1 })
db.messages.createIndex({ "sender_id": 1, "created_at": -1 })
db.messages.createIndex({ "recipient_id": 1, "created_at": -1 })
db.notifications.createIndex({ "user_id": 1, "created_at": -1 })
```

---

## 🔔 Notifications temps réel

### Socket.IO Setup

```python
# server.py
import socketio

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*'
)

app = socketio.ASGIApp(sio, app, socketio_path='/api/socket.io')
```

### Authentification WebSocket

```python
@sio.event
async def connect(sid, environ, auth):
    token = auth.get('token')
    user = await verify_token(token)
    
    if user:
        await sio.save_session(sid, {'user_id': user['id']})
        return True
    else:
        return False
```

### Envoi de notification

```python
# Depuis n'importe quelle route
from server import sio

await sio.emit('new_notification', {
    "title": "Nouveau message !",
    "message": "...",
    "link": "/messages"
}, room=user_id)
```

### Côté client (React)

```javascript
import io from 'socket.io-client';

const socket = io('https://jamconnexion.com', {
  path: '/api/socket.io',
  auth: { token: JWT_TOKEN }
});

socket.on('new_notification', (data) => {
  toast.info(data.title);
});
```

---

## ⏰ Scheduler (Notifications automatiques)

### `notifications_scheduler.py`

**Fonctionnement** :
- Cron exécuté toutes les 30 minutes
- Vérifie si on est dans la fenêtre 12h30 (±5min)
- Envoie notifications J-3 et Jour J

**Fonctions refactorisées** (NEW) :
- `notify_event_participants(db, event, event_type, days_before)`
- `notify_nearby_musicians(db, event, venue, event_type, radius_km=70)`
- `notify_nearby_melomanes(db, event, venue)`

**Démarrage** :
```bash
# Via crontab
*/30 * * * * cd /app/backend && python3 notifications_scheduler.py
```

**Logs** :
```bash
tail -f /var/log/cron.log
```

---

## 📤 Upload de fichiers

### Object Storage (Emergent S3)

**Configuration** :
```python
# utils/storage.py
import boto3

s3_client = boto3.client(
    's3',
    aws_access_key_id=EMERGENT_STORAGE_ACCESS_KEY,
    aws_secret_access_key=EMERGENT_STORAGE_SECRET_KEY,
    endpoint_url=EMERGENT_STORAGE_ENDPOINT
)
```

**Upload** :
```python
from utils.storage import upload_file

url = await upload_file(
    file_content=file.file.read(),
    filename=file.filename,
    folder="profiles",
    user_id=user_id
)
# Retourne: "/api/files/jamconnexion/profiles/{user_id}/{filename}"
```

**Proxy** (Obligatoire pour affichage) :
```python
# routes/files.py
@router.get("/files/{filename:path}")
async def get_file(filename: str):
    obj = s3_client.get_object(Bucket=BUCKET, Key=filename)
    return StreamingResponse(obj['Body'], media_type=obj.get('ContentType'))
```

---

## 🧪 Tests

### Structure

```
/app/backend/tests/
├── test_auth.py
├── test_musicians.py
├── test_venues.py
├── test_messages.py
└── ...
```

### Exécution

```bash
# Tous les tests
pytest tests/

# Un fichier spécifique
pytest tests/test_auth.py

# Avec verbosité
pytest tests/ -v

# Avec coverage
pytest tests/ --cov=routes --cov-report=html
```

### Exemple de test

```python
# tests/test_auth.py
import pytest
from httpx import AsyncClient
from server import app

@pytest.mark.asyncio
async def test_login():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/auth/login", json={
            "email": "test@gmail.com",
            "password": "test"
        })
        
        assert response.status_code == 200
        assert "token" in response.json()
```

---

## 🚀 Déploiement

### Production (Supervisor)

**Configuration** (`/etc/supervisor/conf.d/backend.conf`) :
```ini
[program:backend]
command=/usr/bin/python3 -m uvicorn server:app --host 0.0.0.0 --port 8001
directory=/app/backend
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/backend.err.log
stdout_logfile=/var/log/supervisor/backend.out.log
environment=PATH="/usr/bin",ENVIRONMENT="production"
```

**Commandes** :
```bash
# Démarrer
sudo supervisorctl start backend

# Arrêter
sudo supervisorctl stop backend

# Redémarrer
sudo supervisorctl restart backend

# Status
sudo supervisorctl status backend

# Logs
tail -f /var/log/supervisor/backend.err.log
```

### Docker (optionnel)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

```bash
# Build
docker build -t jamconnexion-backend .

# Run
docker run -p 8001:8001 --env-file .env jamconnexion-backend
```

---

## 🔧 Dépannage

### Backend ne démarre pas

```bash
# Vérifier les logs
tail -n 100 /var/log/supervisor/backend.err.log

# Vérifier les dépendances
pip list

# Réinstaller
pip install -r requirements.txt --upgrade
```

### Erreurs MongoDB

```bash
# Tester la connexion
python3 -c "
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()
client = AsyncIOMotorClient(os.getenv('MONGO_URL_PRODUCTION'))
print('Connected:', client.admin.command('ping'))
"
```

### Socket.IO ne fonctionne pas

- Vérifier que `/api/socket.io` est accessible
- Vérifier le token JWT dans `auth`
- Vérifier les logs serveur

---

## 📚 Ressources

- **FastAPI Docs** : https://fastapi.tiangolo.com/
- **Motor Docs** : https://motor.readthedocs.io/
- **Socket.IO Docs** : https://python-socketio.readthedocs.io/
- **Pydantic Docs** : https://docs.pydantic.dev/

---

**Dernière mise à jour** : 13 avril 2026  
**Auteur** : Équipe Jam Connexion
