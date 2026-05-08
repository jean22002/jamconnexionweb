# 🚀 Guide de Déploiement - Jam Connexion

Documentation complète pour déployer Jam Connexion en production sur Emergent Platform avec MongoDB Atlas.

---

## 📋 Table des matières

- [Prérequis](#-prérequis)
- [Configuration MongoDB Atlas](#-configuration-mongodb-atlas)
- [Configuration Emergent Platform](#️-configuration-emergent-platform)
- [Variables d'environnement](#-variables-denvironnement)
- [Déploiement initial](#-déploiement-initial)
- [Domaine personnalisé (Cloudflare)](#-domaine-personnalisé-cloudflare)
- [Déploiement continu](#-déploiement-continu)
- [Monitoring et logs](#-monitoring-et-logs)
- [Rollback](#-rollback)
- [Troubleshooting](#-troubleshooting)

---

## ✅ Prérequis

Avant de commencer, vous devez avoir :

- ✅ Un compte **Emergent Platform**
- ✅ Un compte **MongoDB Atlas** (gratuit tier M0 suffisant pour débuter)
- ✅ Un compte **GitHub** pour le code source
- ✅ (Optionnel) Un domaine personnalisé avec accès DNS
- ✅ (Optionnel) Un compte **Cloudflare** pour le proxy/CDN

---

## 🗄️ Configuration MongoDB Atlas

### 1. Créer un cluster

1. Aller sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créer un nouveau projet : "JamConnexion"
3. Créer un cluster :
   - **Provider** : AWS
   - **Region** : EU-WEST-3 (Paris) pour la France
   - **Tier** : M0 (Free) ou M10+ (Production)
   - **Nom** : customer-apps

### 2. Configurer l'accès réseau

```
Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
```

⚠️ **Note** : En production, restreindre aux IPs Emergent Platform si possible.

### 3. Créer un utilisateur database

```
Database Access → Add New Database User
- Username: jean_jamconnexion
- Password: [générer un mot de passe sécurisé]
- Database User Privileges: Atlas admin
```

### 4. Récupérer la connection string

```
Databases → Connect → Connect your application
- Driver: Python
- Version: 3.11 or later

Connection String:
mongodb+srv://jean_jamconnexion:<password>@customer-apps.xtch2ol.mongodb.net/?retryWrites=true&w=majority
```

### 5. Créer la base de données

```javascript
// Via MongoDB Compass ou Shell
use test_database

// Créer les collections
db.createCollection("users")
db.createCollection("venues")
db.createCollection("musicians")
db.createCollection("jams")
db.createCollection("concerts")
db.createCollection("karaoke")
db.createCollection("spectacle")
db.createCollection("messages")
db.createCollection("notifications")
db.createCollection("venue_subscriptions")
db.createCollection("bands")
db.createCollection("applications")
db.createCollection("event_participations")
```

### 6. Créer les index pour les performances

```javascript
// Index pour les recherches fréquentes
db.venues.createIndex({ "latitude": 1, "longitude": 1 })
db.venues.createIndex({ "city": 1 })
db.venues.createIndex({ "music_styles": 1 })
db.venues.createIndex({ "user_id": 1 })

db.musicians.createIndex({ "user_id": 1 })
db.musicians.createIndex({ "music_styles": 1 })
db.musicians.createIndex({ "city": 1 })

db.jams.createIndex({ "venue_id": 1, "date": -1 })
db.concerts.createIndex({ "venue_id": 1, "date": -1 })
db.karaoke.createIndex({ "venue_id": 1, "date": -1 })
db.spectacle.createIndex({ "venue_id": 1, "date": -1 })

db.messages.createIndex({ "sender_id": 1, "receiver_id": 1 })
db.notifications.createIndex({ "user_id": 1, "read": 1 })
```

---

## 🖥️ Configuration Emergent Platform

### 1. Créer un nouveau projet

1. Se connecter sur [Emergent Platform](https://emergentagent.com)
2. Créer un nouveau projet : "Jam Connexion"
3. Sélectionner le template : **Full Stack (React + FastAPI + MongoDB)**

### 2. Connecter le repository GitHub

```
Settings → GitHub Integration
- Repository: votre-username/jam-connexion
- Branch: main
- Auto-deploy: Enabled
```

### 3. Configuration des services

Emergent configure automatiquement :
- ✅ Frontend React sur port 3000
- ✅ Backend FastAPI sur port 8001
- ✅ Supervisor pour la gestion des processus
- ✅ Nginx comme reverse proxy
- ✅ Hot reload activé pour le développement

### 4. Structure des URLs

```
Kubernetes Ingress:
├── /* (root)              → Frontend (port 3000)
└── /api/*                 → Backend (port 8001)

Production URLs:
- Preview: https://[project-slug].preview.emergentagent.com
- Custom: https://www.jamconnexion.com (si configuré)
```

---

## 🔐 Variables d'environnement

### Backend (`/app/backend/.env`)

```bash
# ==========================================
# MongoDB Configuration
# ==========================================
MONGO_URL="mongodb+srv://jean_jamconnexion:VOTRE_PASSWORD@customer-apps.xtch2ol.mongodb.net/test_database?retryWrites=true&w=majority"
DB_NAME="test_database"
ENVIRONMENT="production"

# ==========================================
# Security
# ==========================================
JWT_SECRET="[générer une clé aléatoire sécurisée]"
CORS_ORIGINS="*"

# ==========================================
# Stripe Payment (Production Keys)
# ==========================================
STRIPE_API_KEY="sk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PRICE_ID="price_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# ==========================================
# Email Service (Resend)
# ==========================================
RESEND_API_KEY="re_..."
SENDER_EMAIL="noreply@jamconnexion.com"

# ==========================================
# Application URLs
# ==========================================
APP_URL="https://jamconnexion.com"

# ==========================================
# Firebase Push Notifications
# ==========================================
FIREBASE_CREDENTIALS_PATH="/app/backend/firebase-credentials.json"
FIREBASE_API_KEY="AIzaSy..."
FIREBASE_AUTH_DOMAIN="jamconnexion.firebaseapp.com"
FIREBASE_PROJECT_ID="jamconnexion"
FIREBASE_STORAGE_BUCKET="jamconnexion.firebasestorage.app"
FIREBASE_MESSAGING_SENDER_ID="958386684567"
FIREBASE_APP_ID="1:958386684567:web:..."

# ==========================================
# Emergent LLM Key (optionnel)
# ==========================================
EMERGENT_LLM_KEY="sk-emergent-..."

# ==========================================
# VAPID (Push Notifications)
# ==========================================
VAPID_PRIVATE_KEY_FILE="/tmp/vapid_private.pem"
VAPID_CLAIMS_EMAIL="noreply@jamconnexion.com"
```

### Frontend (`/app/frontend/.env`)

```bash
# Backend API URL
# Note: Laisser vide pour utiliser le même domaine (Kubernetes routing)
REACT_APP_BACKEND_URL=

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY="AIzaSy..."
REACT_APP_FIREBASE_AUTH_DOMAIN="jamconnexion.firebaseapp.com"
REACT_APP_FIREBASE_PROJECT_ID="jamconnexion"
REACT_APP_FIREBASE_STORAGE_BUCKET="jamconnexion.firebasestorage.app"
REACT_APP_FIREBASE_MESSAGING_SENDER_ID="958386684567"
REACT_APP_FIREBASE_APP_ID="1:958386684567:web:..."
```

### ⚠️ Sécurité des secrets

**JAMAIS commiter les fichiers `.env` dans Git !**

Ajouter au `.gitignore` :
```
.env
.env.local
.env.production
firebase-credentials.json
```

---

## 🚀 Déploiement initial

### 1. Préparer le code

```bash
# Cloner le repository
git clone https://github.com/votre-username/jam-connexion.git
cd jam-connexion

# Créer les fichiers .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Éditer les .env avec vos vraies valeurs
nano backend/.env
nano frontend/.env
```

### 2. Test local (recommandé)

```bash
# Terminal 1 - Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001

# Terminal 2 - Frontend
cd frontend
yarn install
yarn start
```

Vérifier que tout fonctionne sur `http://localhost:3000`

### 3. Commit et push

```bash
git add .
git commit -m "feat: initial production setup"
git push origin main
```

### 4. Déploiement sur Emergent

1. Emergent détecte automatiquement le push
2. Build du frontend et backend
3. Déploiement automatique
4. URL preview disponible : `https://[slug].preview.emergentagent.com`

### 5. Vérification

```bash
# Tester l'API
curl https://[slug].preview.emergentagent.com/api/venues

# Tester le frontend
curl https://[slug].preview.emergentagent.com

# Vérifier les logs
# (via l'interface Emergent)
```

---

## 🌐 Domaine personnalisé (Cloudflare)

### 1. Configurer Cloudflare DNS

Aller dans Cloudflare Dashboard → DNS → Add Record

**Record 1 (Root domain) :**
```
Type: A
Name: @ (ou jamconnexion.com)
Content: [IP fournie par Emergent]
Proxy status: Proxied (orange cloud)
TTL: Auto
```

**Record 2 (www subdomain) :**
```
Type: CNAME
Name: www
Content: jamconnexion.com
Proxy status: Proxied
TTL: Auto
```

### 2. Configurer SSL/TLS

```
SSL/TLS → Overview
- SSL/TLS encryption mode: Full (strict)

SSL/TLS → Edge Certificates
- Always Use HTTPS: On
- Automatic HTTPS Rewrites: On
- Minimum TLS Version: 1.2
```

### 3. Configurer les redirections

```
Rules → Page Rules → Create Page Rule

Rule 1: Force HTTPS
- URL: http://*jamconnexion.com/*
- Setting: Always Use HTTPS

Rule 2: www to non-www redirect
- URL: www.jamconnexion.com/*
- Setting: Forwarding URL (301)
- Destination: https://jamconnexion.com/$1
```

### 4. Optimisations Cloudflare

```
Speed → Optimization
- Auto Minify: ✓ JavaScript, ✓ CSS, ✓ HTML
- Brotli: On

Caching → Configuration
- Caching Level: Standard
- Browser Cache TTL: 4 hours
```

### 5. Lier le domaine dans Emergent

```
Emergent Platform → Settings → Custom Domain
- Domain: jamconnexion.com
- Verify DNS configuration
- Enable SSL certificate
```

---

## 🔄 Déploiement continu

### Workflow Git

```bash
# 1. Créer une branche feature
git checkout -b feature/nouvelle-fonctionnalite

# 2. Développer et tester localement
# ... modifications ...

# 3. Commit
git add .
git commit -m "feat: ajouter nouvelle fonctionnalité"

# 4. Push vers GitHub
git push origin feature/nouvelle-fonctionnalite

# 5. Créer une Pull Request sur GitHub
# 6. Review et merge vers main
# 7. Emergent déploie automatiquement !
```

### Via l'interface Emergent

**Méthode "Save to Github" :**
1. Faire vos modifications dans l'éditeur Emergent
2. Cliquer sur "Save to Github" en bas de l'interface
3. Emergent commit et push automatiquement
4. Déploiement automatique déclenché

### Vérifier le déploiement

```bash
# Via Emergent UI
Dashboard → Deployments → View logs

# Via SSH (si accès disponible)
ssh user@[emergent-server]
sudo supervisorctl status
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/frontend.err.log
```

---

## 📊 Monitoring et logs

### Logs Backend

```bash
# Logs en temps réel
tail -f /var/log/supervisor/backend.out.log
tail -f /var/log/supervisor/backend.err.log

# Dernières 100 lignes
tail -n 100 /var/log/supervisor/backend.err.log

# Recherche dans les logs
grep "ERROR" /var/log/supervisor/backend.err.log
```

### Logs Frontend

```bash
# Logs de build
tail -f /var/log/supervisor/frontend.out.log

# Erreurs
tail -f /var/log/supervisor/frontend.err.log
```

### Commandes Supervisor

```bash
# Statut de tous les services
sudo supervisorctl status

# Redémarrer un service
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# Redémarrer tous les services
sudo supervisorctl restart all

# Arrêter/démarrer
sudo supervisorctl stop backend
sudo supervisorctl start backend
```

### Monitoring MongoDB Atlas

```
MongoDB Atlas Dashboard → Metrics
- Connections
- Operations per second
- Network
- Memory usage
- Disk IOPS

Alerts: Configurer des alertes pour
- High CPU usage
- High connection count
- Low disk space
```

---

## ⏪ Rollback

### Via Git

```bash
# 1. Identifier le commit à restaurer
git log --oneline

# 2. Rollback vers un commit précédent
git revert [commit-hash]

# Ou reset (attention, destructif)
git reset --hard [commit-hash]

# 3. Push
git push origin main --force
```

### Via Emergent UI

```
Emergent Platform → Deployments → History
- Sélectionner un déploiement précédent
- Cliquer sur "Rollback to this version"
- Confirmer
```

### Rollback MongoDB

```javascript
// Si vous avez besoin de restaurer des données
// Utiliser les backups MongoDB Atlas

Atlas Dashboard → Backups
- Select restore point
- Choose target cluster
- Confirm restore
```

---

## 🔧 Troubleshooting

### Backend ne démarre pas

**Symptômes** : 502 Bad Gateway, API inaccessible

**Solutions** :
```bash
# 1. Vérifier les logs
tail -n 50 /var/log/supervisor/backend.err.log

# 2. Vérifier les dépendances
pip freeze | grep -E "fastapi|motor|pydantic"

# 3. Tester manuellement
cd /app/backend
python -c "import server; print('OK')"

# 4. Vérifier MongoDB connection
python -c "from motor.motor_asyncio import AsyncIOMotorClient; print('OK')"

# 5. Redémarrer
sudo supervisorctl restart backend
```

### Frontend affiche une page blanche

**Symptômes** : Écran blanc, erreurs dans la console

**Solutions** :
```bash
# 1. Vérifier les logs
tail -n 50 /var/log/supervisor/frontend.err.log

# 2. Vérifier le build
cd /app/frontend
yarn build

# 3. Vérifier la variable d'environnement
cat .env | grep REACT_APP_BACKEND_URL

# 4. Redémarrer
sudo supervisorctl restart frontend
```

### Les événements n'apparaissent pas

**Symptômes** : Liste vide dans l'onglet Comptabilité

**Causes possibles** :
1. **Mauvaise base de données** : Événements dans MongoDB Local au lieu d'Atlas
2. **Mauvais venue_id** : Incohérence entre user_id et venue profile id
3. **Champs manquants** : Pydantic rejette les événements

**Solutions** :
```bash
# 1. Vérifier la connexion MongoDB
python3 << EOF
from dotenv import load_dotenv
import os
load_dotenv('/app/backend/.env')
print(os.environ.get('MONGO_URL'))
EOF

# 2. Vérifier les événements dans Atlas
# Via MongoDB Compass ou Shell
use test_database
db.jams.find({"venue_id": "venue-1771535930121"}).count()

# 3. Vérifier les champs requis
db.karaoke.findOne({"venue_id": "venue-1771535930121"})
# Doit avoir: id, venue_id, date, start_time, created_at
```

### Erreurs 404 sur /api/*

**Symptômes** : Appels API retournent 404

**Causes** : Kubernetes Ingress mal configuré

**Solutions** :
```bash
# 1. Vérifier que le backend tourne
sudo supervisorctl status backend

# 2. Tester directement le backend
curl http://localhost:8001/api/venues

# 3. Vérifier les routes
curl https://jamconnexion.com/api/venues
```

### Performances lentes

**Causes possibles** :
1. Requêtes MongoDB non optimisées
2. Pas d'index sur les collections
3. Trop de données chargées

**Solutions** :
```javascript
// 1. Créer des index
db.jams.createIndex({ "venue_id": 1, "date": -1 })

// 2. Limiter les résultats
db.jams.find({}).limit(50)

// 3. Utiliser des projections
db.jams.find({}, { "_id": 0, "title": 1, "date": 1 })
```

---

## 📞 Support

### Ressources

- **Documentation Emergent** : https://docs.emergentagent.com
- **MongoDB Atlas Docs** : https://www.mongodb.com/docs/atlas/
- **FastAPI Docs** : https://fastapi.tiangolo.com
- **React Docs** : https://react.dev

### Contact

- **Support Emergent** : support@emergentagent.com
- **Issues GitHub** : https://github.com/votre-username/jam-connexion/issues

---

## ✅ Checklist finale

Avant de mettre en production :

- [ ] ✅ MongoDB Atlas configuré avec IP whitelist
- [ ] ✅ Toutes les variables d'environnement configurées
- [ ] ✅ Fichiers `.env` NON commités dans Git
- [ ] ✅ Tests locaux passés
- [ ] ✅ Déploiement preview testé
- [ ] ✅ Domaine personnalisé configuré
- [ ] ✅ SSL/HTTPS actif
- [ ] ✅ Cloudflare proxy actif
- [ ] ✅ Monitoring configuré
- [ ] ✅ Backups MongoDB activés
- [ ] ✅ Documentation à jour
- [ ] ✅ Credentials de test documentés

---

**🎉 Félicitations ! Votre application Jam Connexion est maintenant en production !**

Pour toute question, consultez la documentation ou contactez le support.
