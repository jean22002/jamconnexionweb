# 🔥 Configuration Firebase - Instructions Pas à Pas

<div align="center">

**Guide pour activer les Push Notifications Mobiles**

</div>

---

## 📋 Ce que vous devez faire

Le backend est prêt pour Firebase Cloud Messaging, **mais Firebase nécessite une configuration manuelle** (création de projet, téléchargement de clés).

⏱️ **Temps estimé** : 10-15 minutes

---

## Étape 1 : Créer un Projet Firebase

### 1.1 Aller sur Firebase Console

Ouvrir : https://console.firebase.google.com/

### 1.2 Créer le Projet

1. Cliquer sur **"Ajouter un projet"** (ou "Create a project")
2. **Nom du projet** : `JamConnexion` (ou au choix)
3. **Google Analytics** : Optionnel (recommandé pour les stats)
4. Cliquer sur **"Créer le projet"**
5. Attendre la création (30 secondes environ)

---

## Étape 2 : Ajouter les Applications Mobile

### 2.1 Application Android

1. Dans le projet Firebase, cliquer sur l'icône **Android** (robot)
2. **Nom du package Android** : `com.jamconnexion.mobile`
3. **Nom de l'application** : `Jam Connexion`
4. **Certificat SHA-1** : Laisser vide (pas nécessaire pour FCM)
5. Cliquer sur **"Enregistrer l'application"**
6. **Télécharger** `google-services.json`
   - ⚠️ **Important** : Ce fichier sera donné à l'Agent Mobile
   - Sauvegarder dans un endroit accessible

### 2.2 Application iOS

1. Cliquer sur l'icône **iOS** (pomme)
2. **Bundle ID** : `com.jamconnexion.mobile`
3. **Nom de l'application** : `Jam Connexion`
4. Cliquer sur **"Enregistrer l'application"**
5. **Télécharger** `GoogleService-Info.plist`
   - ⚠️ **Important** : Ce fichier sera donné à l'Agent Mobile
   - Sauvegarder dans un endroit accessible

---

## Étape 3 : Générer la Clé Backend (Service Account)

### 3.1 Accéder aux Comptes de Service

1. Dans Firebase Console, cliquer sur ⚙️ **"Paramètres du projet"** (en haut à gauche)
2. Aller dans l'onglet **"Comptes de service"**
3. Sélectionner **"Firebase Admin SDK"**

### 3.2 Générer la Clé Privée

1. Cliquer sur **"Générer une nouvelle clé privée"**
2. Confirmer en cliquant sur **"Générer la clé"**
3. Un fichier JSON sera téléchargé automatiquement
   - Nom du fichier : `jamconnexion-firebase-adminsdk-xxxxx.json`

⚠️ **IMPORTANT** : Ce fichier contient des credentials secrets. **NE PAS le partager publiquement.**

---

## Étape 4 : Installer la Clé sur le Backend

### Option A : Via Terminal SSH (Recommandé)

```bash
# 1. Uploader le fichier sur le serveur (depuis votre machine locale)
scp ~/Downloads/jamconnexion-firebase-adminsdk-xxxxx.json user@jamconnexion.com:/tmp/

# 2. Connecter au serveur
ssh user@jamconnexion.com

# 3. Déplacer le fichier vers le backend
sudo mv /tmp/jamconnexion-firebase-adminsdk-xxxxx.json /app/backend/firebase-credentials.json

# 4. Vérifier que le fichier existe
ls -lh /app/backend/firebase-credentials.json
# Devrait afficher : -rw-r--r-- 1 root root 2.3K ...

# 5. Redémarrer le backend
sudo supervisorctl restart backend

# 6. Vérifier les logs
tail -f /var/log/supervisor/backend.err.log
```

**Attendu dans les logs :**
```
✅ Firebase Cloud Messaging initialized
✅ WebSocket Socket.IO initialized for real-time chat
```

### Option B : Via Interface Emergent (si disponible)

1. Aller dans l'interface de gestion de fichiers Emergent
2. Naviguer vers `/app/backend/`
3. Uploader le fichier JSON téléchargé
4. Renommer en `firebase-credentials.json`
5. Redémarrer le backend

---

## Étape 5 : Vérifier que Firebase Fonctionne

### Test 1 : Vérifier les Logs

```bash
tail -n 50 /var/log/supervisor/backend.err.log
```

**✅ Succès** : Si vous voyez
```
✅ Firebase Cloud Messaging initialized
```

**❌ Échec** : Si vous voyez
```
⚠️  Firebase credentials file not found at /app/backend/firebase-credentials.json
```
→ Retourner à l'Étape 4

### Test 2 : Appeler l'Endpoint API

```bash
# Obtenir un token de test
API_URL="https://jamconnexion.com/api"
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"test"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# Vérifier le statut Firebase
curl -s -X GET "$API_URL/notifications/firebase/status" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin), indent=2))"
```

**Attendu :**
```json
{
  "firebase_initialized": true,  // ✅ doit être true
  "device_count": 0,
  "devices": []
}
```

---

## Étape 6 : Fournir les Fichiers à l'Agent Mobile

L'Agent Mobile aura besoin des fichiers suivants pour configurer l'application React Native :

### Fichiers à Fournir

1. ✅ `google-services.json` (Android)
   - Téléchargé à l'Étape 2.1
   - À placer dans `/android/app/` de l'app mobile

2. ✅ `GoogleService-Info.plist` (iOS)
   - Téléchargé à l'Étape 2.2
   - À placer dans `/ios/JamConnexion/` de l'app mobile

3. ✅ Tous les README
   - `/app/README_FIREBASE_PUSH.md`
   - `/app/README_CHAT.md`
   - `/app/README_UPLOADS.md`
   - Et les 8 autres README déjà créés

---

## 🐛 Troubleshooting

### Problème : "Firebase credentials file not found"

**Solution :**
```bash
# Vérifier que le fichier existe
ls -lh /app/backend/firebase-credentials.json

# Si absent, télécharger à nouveau depuis Firebase Console
# et suivre l'Étape 4
```

### Problème : "Invalid credentials"

**Causes possibles :**
1. Fichier JSON corrompu
2. Mauvais projet Firebase

**Solution :**
```bash
# Re-télécharger le fichier depuis Firebase Console
# Étape 3 : Comptes de service > Générer nouvelle clé
```

### Problème : Backend ne redémarre pas

**Solution :**
```bash
# Vérifier les logs d'erreur
tail -n 100 /var/log/supervisor/backend.err.log

# Redémarrer manuellement
sudo supervisorctl restart backend

# Vérifier le statut
sudo supervisorctl status backend
# Devrait afficher : backend    RUNNING   pid xxxxx, uptime 0:00:XX
```

### Problème : "Permission denied" lors de l'upload

**Solution :**
```bash
# Donner les permissions correctes
sudo chown www-data:www-data /app/backend/firebase-credentials.json
sudo chmod 644 /app/backend/firebase-credentials.json
```

---

## 📊 Récapitulatif

Une fois toutes les étapes terminées, vous devriez avoir :

- [x] Projet Firebase créé
- [x] Application Android ajoutée
- [x] Application iOS ajoutée
- [x] Clé Service Account générée
- [x] Fichier `firebase-credentials.json` installé sur le backend
- [x] Backend redémarré
- [x] Firebase initialisé (logs confirmés)
- [x] Test API passé (`firebase_initialized: true`)
- [x] Fichiers mobile (`google-services.json` + `GoogleService-Info.plist`) prêts à être donnés à l'Agent Mobile

---

## ✅ Prochaine Étape

**Donner les fichiers à l'Agent Mobile** dans l'autre job :

```
Agent Mobile, voici les fichiers de configuration Firebase :

1. google-services.json (Android) - [Coller le contenu]
2. GoogleService-Info.plist (iOS) - [Coller le contenu]

Tu peux maintenant implémenter les notifications push en suivant le README_FIREBASE_PUSH.md
```

---

<div align="center">

**Configuration terminée ! 🎉**

Le backend est maintenant prêt à envoyer des notifications push  
L'Agent Mobile peut commencer le développement

</div>
