# 📦 FICHIERS DE DÉPLOIEMENT - JAM CONNEXION

## 🎯 Objectif
Ce dossier contient les **4 fichiers modifiés** pour corriger les erreurs Socket.IO sur www.jamconnexion.com

---

## 📂 Structure des fichiers

```
DEPLOY_FILES/
├── backend/
│   └── websocket.py                      (Backend Socket.IO)
└── frontend/
    ├── src/pages/
    │   ├── VenueDashboard.jsx            (Dashboard Établissement)
    │   └── MusicianDashboard.jsx         (Dashboard Musicien)
    └── public/
        └── service-worker.js             (Service Worker PWA)
```

---

## 🚀 MÉTHODE 1 : Déploiement SSH (Recommandé)

### Connexion à votre serveur
```bash
ssh votre_utilisateur@votre_serveur.com
```

### Uploader les fichiers (depuis votre machine locale)
```bash
# Copier tous les fichiers en une commande
scp -r DEPLOY_FILES/* votre_utilisateur@votre_serveur.com:/app/
```

### Sur le serveur, rebuild et restart
```bash
cd /app/frontend
yarn build
sudo supervisorctl restart backend frontend
```

---

## 📤 MÉTHODE 2 : Déploiement FTP/SFTP

### Avec FileZilla, Cyberduck ou équivalent :

1. **Connectez-vous à votre serveur FTP/SFTP**
2. **Uploadez les fichiers en respectant l'arborescence** :
   ```
   backend/websocket.py 
     → Vers : /app/backend/websocket.py
   
   frontend/src/pages/VenueDashboard.jsx 
     → Vers : /app/frontend/src/pages/VenueDashboard.jsx
   
   frontend/src/pages/MusicianDashboard.jsx 
     → Vers : /app/frontend/src/pages/MusicianDashboard.jsx
   
   frontend/public/service-worker.js 
     → Vers : /app/frontend/public/service-worker.js
   ```

3. **Ensuite connectez-vous en SSH** et exécutez :
   ```bash
   cd /app/frontend
   yarn build
   sudo supervisorctl restart backend frontend
   ```

---

## 🌐 MÉTHODE 3 : Via interface Emergent

Si www.jamconnexion.com est hébergé sur Emergent :

1. **Ouvrez l'interface de gestion Emergent**
2. **Accédez à l'onglet "Code" ou "Files"**
3. **Remplacez les 4 fichiers manuellement**
4. **Cliquez sur "Re-deploy changes"**

---

## ✅ VÉRIFICATION POST-DÉPLOIEMENT

### 1. Vider le cache du navigateur
Sur www.jamconnexion.com :
- **Mac** : Cmd + Shift + R
- **Windows** : Ctrl + Shift + R
- **Ou** : Navigation privée (Cmd/Ctrl + Shift + N)

### 2. Se connecter et tester
- Email : `test@gmail.com`
- Mot de passe : `test`

### 3. Ouvrir DevTools > Console
Chercher ces messages :
```
✅ Socket.IO connected
🔔 Notifications temps réel activées
```

### 4. Vérifier l'absence d'erreurs
Ne devrait PLUS voir :
```
❌ Socket.IO connection error: "server error"
⚠️ fetchEvents: No profile ID, skipping fetch
```

---

## 📝 CHANGEMENTS TECHNIQUES

### Backend (`websocket.py`)
- ✅ Logs détaillés à chaque étape du handshake
- ✅ `always_connect=False` (sécurité)
- ✅ Traceback complet des exceptions avec `exc_info=True`

### Frontend (`VenueDashboard.jsx` & `MusicianDashboard.jsx`)
- ✅ Ajout de `autoConnect: !!profile?.id`
- ✅ Le WebSocket attend que le profil soit chargé avant de se connecter

### PWA (`service-worker.js`)
- ✅ `CACHE_VERSION` passé de `v7.1` à `v7.2`
- ✅ Force le rafraîchissement du cache client

---

## ❓ Besoin d'aide ?

Si vous ne savez pas comment accéder à votre serveur ou uploader les fichiers, dites-moi :
- A) J'ai accès SSH
- B) J'utilise FTP/FileZilla
- C) Mon site est sur Emergent
- D) Mon site est sur une autre plateforme (Vercel, Netlify, etc.)
- E) Je ne sais pas

Et je vous fournirai des instructions détaillées ! 🚀
