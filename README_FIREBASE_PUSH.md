# 🔔 Firebase Push Notifications - Architecture Notifications

<div align="center">

![Firebase](https://img.shields.io/badge/Firebase-Cloud_Messaging-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

**Documentation Firebase Cloud Messaging pour Jam Connexion Mobile**

</div>

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Architecture](#-architecture)
- [Configuration Firebase](#-configuration-firebase)
- [Côté Backend (FastAPI)](#-côté-backend-fastapi)
- [Côté Mobile (React Native)](#-côté-mobile-react-native)
- [Types de Notifications](#-types-de-notifications)
- [Flux Complet](#-flux-complet)
- [Exemples Code](#-exemples-code)

---

## 🎯 Vue d'ensemble

### État Actuel

⚠️ **ATTENTION : Cette fonctionnalité N'EST PAS ENCORE IMPLÉMENTÉE**

| Composant | État | Action requise |
|-----------|------|----------------|
| Projet Firebase | ❌ Pas créé | Créer un projet Firebase Console |
| Backend FastAPI | ❌ Pas configuré | Installer `firebase-admin`, créer endpoints |
| App Mobile | ❌ Pas configuré | Installer `@react-native-firebase/messaging` |
| Collection `notifications` | ✅ Existe (web) | Adapter pour push mobile |

### Pourquoi Firebase Cloud Messaging (FCM) ?

| Critère | FCM | Alternatives |
|---------|-----|-------------|
| 🆓 **Gratuit** | Oui (quota généreux) | OneSignal (freemium), Pusher (payant) |
| 📱 **Cross-platform** | iOS + Android | ✅ |
| 🚀 **Scalabilité** | Excellente | - |
| 🔧 **Intégration** | Simple | - |
| 📊 **Analytics** | Intégré | - |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  📱 APP MOBILE (React Native)                               │
│                                                              │
│  1. Demande permission notifications                        │
│  2. Récupère FCM Token (ex: "fJ3K...xyz")                   │
│  3. Envoie token au backend                                 │
│  4. Écoute notifications en temps réel                      │
│                                                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ POST /api/notifications/register-device
                 │ { "fcm_token": "fJ3K...xyz" }
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  🌐 BACKEND FASTAPI                                         │
│     https://jamconnexion.com/api                            │
│                                                              │
│  1. Reçoit FCM token                                        │
│  2. Stocke token dans MongoDB (collection users)           │
│  3. Quand événement se produit :                            │
│     - Nouvelle invitation groupe                            │
│     - Candidature acceptée                                  │
│     - Nouveau message                                       │
│  4. Envoie notification via Firebase Admin SDK             │
│                                                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ Firebase Admin SDK
                 │ send_to_device(token, message)
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  🔥 FIREBASE CLOUD MESSAGING (Google Cloud)                │
│                                                              │
│  1. Reçoit requête du backend                               │
│  2. Route la notification vers l'appareil                   │
│  3. Gère la livraison (retry, etc.)                         │
│                                                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ Push notification
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  📱 APPAREIL UTILISATEUR                                    │
│                                                              │
│  - Notification affichée dans la barre système             │
│  - Son/vibration selon paramètres                           │
│  - Tap → Ouvre l'app sur l'écran ciblé                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration Firebase

### Étape 1 : Créer le Projet Firebase

1. **Aller sur** : https://console.firebase.google.com/
2. **Créer un projet** : "JamConnexion"
3. **Activer Google Analytics** : Optionnel (recommandé)

### Étape 2 : Ajouter les Apps

#### App Android

```
Nom du package : com.jamconnexion.mobile
Nom de l'app : Jam Connexion
Certificat SHA-1 : (optionnel pour notifications)
```

**Télécharger** : `google-services.json` → Placer dans `/android/app/`

#### App iOS

```
Bundle ID : com.jamconnexion.mobile
Nom de l'app : Jam Connexion
```

**Télécharger** : `GoogleService-Info.plist` → Placer dans `/ios/JamConnexion/`

### Étape 3 : Générer la Clé Backend (Service Account)

1. **Console Firebase** → ⚙️ Paramètres projet → **Comptes de service**
2. **Générer une nouvelle clé privée**
3. Télécharger le fichier JSON (ex: `jamconnexion-firebase-adminsdk.json`)
4. **Placer côté backend** : `/app/backend/firebase-credentials.json`

**Exemple du fichier :**
```json
{
  "type": "service_account",
  "project_id": "jamconnexion-abc123",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xyz@jamconnexion-abc123.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

⚠️ **IMPORTANT** : Ajouter ce fichier dans `.gitignore` !

---

## 🖥️ Côté Backend (FastAPI)

### Installation

```bash
cd /app/backend
pip install firebase-admin
pip freeze > requirements.txt
```

### Configuration

**Fichier : `/app/backend/.env`**
```env
# Ajouter
FIREBASE_CREDENTIALS_PATH=/app/backend/firebase-credentials.json
```

### Code : Initialisation Firebase

**Fichier : `/app/backend/firebase_config.py`** (à créer)
```python
import firebase_admin
from firebase_admin import credentials, messaging
import os

# Initialiser Firebase Admin SDK
def initialize_firebase():
    cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
    
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin SDK initialisé")
    else:
        print("⚠️ Firebase déjà initialisé")

# Envoyer une notification à un utilisateur
async def send_push_notification(
    fcm_token: str,
    title: str,
    body: str,
    data: dict = None
):
    """
    Envoie une notification push via FCM
    
    Args:
        fcm_token: Token FCM de l'appareil
        title: Titre de la notification
        body: Corps du message
        data: Données supplémentaires (optionnel)
    """
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body
            ),
            data=data or {},
            token=fcm_token
        )
        
        response = messaging.send(message)
        print(f"✅ Notification envoyée : {response}")
        return {"success": True, "message_id": response}
        
    except Exception as e:
        print(f"❌ Erreur envoi notification : {e}")
        return {"success": False, "error": str(e)}

# Envoyer à plusieurs appareils
async def send_push_to_multiple(
    fcm_tokens: list,
    title: str,
    body: str,
    data: dict = None
):
    """
    Envoie une notification à plusieurs appareils
    """
    try:
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body
            ),
            data=data or {},
            tokens=fcm_tokens
        )
        
        response = messaging.send_multicast(message)
        print(f"✅ {response.success_count}/{len(fcm_tokens)} notifications envoyées")
        return {
            "success": True,
            "success_count": response.success_count,
            "failure_count": response.failure_count
        }
        
    except Exception as e:
        print(f"❌ Erreur envoi multiple : {e}")
        return {"success": False, "error": str(e)}
```

### Code : Endpoints API

**Fichier : `/app/backend/routes/notifications.py`** (à créer ou modifier)
```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from utils.auth import get_current_user
from firebase_config import send_push_notification
from database import get_db

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

# ============================================
# Modèles
# ============================================

class RegisterDeviceRequest(BaseModel):
    fcm_token: str
    device_type: str  # "ios" ou "android"

class SendNotificationRequest(BaseModel):
    user_id: str
    title: str
    body: str
    data: Optional[dict] = None

# ============================================
# Endpoints
# ============================================

@router.post("/register-device")
async def register_device(
    request: RegisterDeviceRequest,
    user: dict = Depends(get_current_user)
):
    """
    Enregistre le FCM token de l'appareil mobile
    
    L'app mobile appelle cet endpoint après avoir obtenu
    le token FCM au démarrage.
    """
    db = get_db()
    
    # Mettre à jour le token dans la collection users
    result = await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "fcm_token": request.fcm_token,
                "device_type": request.device_type,
                "fcm_updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.modified_count > 0:
        return {
            "success": True,
            "message": "Token FCM enregistré"
        }
    else:
        raise HTTPException(status_code=500, detail="Échec enregistrement token")

@router.post("/send")
async def send_notification_to_user(
    request: SendNotificationRequest,
    user: dict = Depends(get_current_user)
):
    """
    Envoie une notification à un utilisateur spécifique
    
    USAGE INTERNE : Appelé par d'autres endpoints backend
    (ex: quand une candidature est acceptée)
    """
    db = get_db()
    
    # Récupérer le token FCM de l'utilisateur cible
    target_user = await db.users.find_one(
        {"id": request.user_id},
        {"_id": 0, "fcm_token": 1}
    )
    
    if not target_user or not target_user.get("fcm_token"):
        return {
            "success": False,
            "message": "Utilisateur n'a pas activé les notifications"
        }
    
    # Envoyer la notification
    result = await send_push_notification(
        fcm_token=target_user["fcm_token"],
        title=request.title,
        body=request.body,
        data=request.data
    )
    
    # Sauvegarder dans la collection notifications
    await db.notifications.insert_one({
        "id": str(uuid4()),
        "user_id": request.user_id,
        "title": request.title,
        "message": request.body,
        "type": request.data.get("type", "general") if request.data else "general",
        "is_read": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    return result

@router.get("/history")
async def get_notification_history(
    user: dict = Depends(get_current_user)
):
    """
    Récupère l'historique des notifications de l'utilisateur
    """
    db = get_db()
    
    notifications = await db.notifications.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return notifications

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Marque une notification comme lue
    """
    db = get_db()
    
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": user["id"]},
        {"$set": {"is_read": True}}
    )
    
    if result.modified_count > 0:
        return {"success": True}
    else:
        raise HTTPException(status_code=404, detail="Notification non trouvée")
```

### Intégration dans `server.py`

```python
# /app/backend/server.py

from firebase_config import initialize_firebase
from routes import notifications

# Au démarrage
@app.on_event("startup")
async def startup_event():
    initialize_firebase()  # Initialiser Firebase

# Inclure le routeur
app.include_router(notifications.router)
```

### Exemple : Notification Automatique

**Quand une candidature est acceptée :**

```python
# Dans /app/backend/routes/applications.py

from firebase_config import send_push_notification

@router.post("/applications/{application_id}/accept")
async def accept_application(application_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    
    # ... logique d'acceptation ...
    
    # Récupérer le musicien
    musician = await db.musicians.find_one({"id": app["musician_id"]})
    musician_user = await db.users.find_one(
        {"id": musician["user_id"]},
        {"_id": 0, "fcm_token": 1}
    )
    
    # Envoyer notification push
    if musician_user and musician_user.get("fcm_token"):
        await send_push_notification(
            fcm_token=musician_user["fcm_token"],
            title="Candidature acceptée ! 🎉",
            body=f"Votre candidature pour {event['title']} a été acceptée.",
            data={
                "type": "application_accepted",
                "application_id": application_id,
                "event_id": app["event_id"]
            }
        )
    
    return {"success": True}
```

---

## 📱 Côté Mobile (React Native)

### Installation

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging

# iOS uniquement
cd ios && pod install && cd ..
```

### Configuration Android

**Fichier : `/android/app/google-services.json`**
- Placer le fichier téléchargé depuis Firebase Console

**Fichier : `/android/build.gradle`**
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

**Fichier : `/android/app/build.gradle`**
```gradle
apply plugin: 'com.google.gms.google-services'
```

### Configuration iOS

**Fichier : `/ios/JamConnexion/GoogleService-Info.plist`**
- Placer le fichier téléchargé depuis Firebase Console

**Xcode :**
1. Ouvrir `JamConnexion.xcworkspace`
2. Ajouter `GoogleService-Info.plist` au projet
3. Capabilities → Push Notifications → ON

### Code : Initialisation

**Fichier : `src/services/notificationService.js`**
```javascript
import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

class NotificationService {
  
  // Demander la permission
  async requestPermission() {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ Permission notifications accordée');
        return true;
      } else {
        console.log('❌ Permission notifications refusée');
        return false;
      }
    } catch (error) {
      console.error('Erreur demande permission:', error);
      return false;
    }
  }

  // Récupérer le FCM token
  async getToken() {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Erreur récupération token:', error);
      return null;
    }
  }

  // Enregistrer le token sur le backend
  async registerDevice() {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) return false;

      const token = await this.getToken();
      if (!token) return false;

      // Envoyer au backend
      await api.post('/notifications/register-device', {
        fcm_token: token,
        device_type: Platform.OS // "ios" ou "android"
      });

      // Sauvegarder localement
      await AsyncStorage.setItem('fcm_token', token);
      console.log('✅ Token enregistré sur le backend');
      return true;

    } catch (error) {
      console.error('Erreur enregistrement device:', error);
      return false;
    }
  }

  // Écouter les notifications (app en premier plan)
  onForegroundMessage(callback) {
    return messaging().onMessage(async remoteMessage => {
      console.log('📩 Notification reçue (foreground):', remoteMessage);
      
      // Afficher une alerte ou un toast
      Alert.alert(
        remoteMessage.notification.title,
        remoteMessage.notification.body,
        [
          { text: 'OK', onPress: () => callback(remoteMessage) }
        ]
      );
    });
  }

  // Gérer tap sur notification (app en arrière-plan)
  onNotificationOpenedApp(callback) {
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('👆 Notification tapped (background):', remoteMessage);
      callback(remoteMessage);
    });
  }

  // Gérer notification au lancement de l'app (app fermée)
  async getInitialNotification(callback) {
    const remoteMessage = await messaging().getInitialNotification();
    if (remoteMessage) {
      console.log('🚀 App lancée via notification:', remoteMessage);
      callback(remoteMessage);
    }
  }

  // Écouter les changements de token
  onTokenRefresh(callback) {
    return messaging().onTokenRefresh(async token => {
      console.log('🔄 Token FCM rafraîchi:', token);
      
      // Mettre à jour sur le backend
      await api.post('/notifications/register-device', {
        fcm_token: token,
        device_type: Platform.OS
      });
      
      callback(token);
    });
  }
}

export default new NotificationService();
```

### Intégration dans App.js

```javascript
// App.js ou navigation principale

import React, { useEffect } from 'react';
import notificationService from './services/notificationService';
import { useNavigation } from '@react-navigation/native';

function App() {
  const navigation = useNavigation();

  useEffect(() => {
    // 1. Enregistrer l'appareil au démarrage
    notificationService.registerDevice();

    // 2. Écouter notifications (app ouverte)
    const unsubscribeForeground = notificationService.onForegroundMessage(
      (message) => {
        console.log('Message reçu:', message);
        // Vous pouvez naviguer vers un écran spécifique
        if (message.data.type === 'application_accepted') {
          navigation.navigate('MyApplications');
        }
      }
    );

    // 3. Écouter tap notification (app en arrière-plan)
    notificationService.onNotificationOpenedApp((message) => {
      handleNotificationNavigation(message);
    });

    // 4. Gérer notification au lancement (app fermée)
    notificationService.getInitialNotification((message) => {
      handleNotificationNavigation(message);
    });

    // 5. Écouter refresh token
    const unsubscribeTokenRefresh = notificationService.onTokenRefresh(
      (token) => {
        console.log('Token mis à jour:', token);
      }
    );

    // Cleanup
    return () => {
      unsubscribeForeground();
      unsubscribeTokenRefresh();
    };
  }, []);

  const handleNotificationNavigation = (message) => {
    const { type, event_id, application_id } = message.data || {};

    switch (type) {
      case 'application_accepted':
        navigation.navigate('EventDetails', { eventId: event_id });
        break;
      case 'new_message':
        navigation.navigate('Chat', { conversationId: message.data.conversation_id });
        break;
      case 'band_invite':
        navigation.navigate('BandInvite', { bandId: message.data.band_id });
        break;
      default:
        navigation.navigate('Notifications');
    }
  };

  return (
    // Votre app...
  );
}

export default App;
```

---

## 🔔 Types de Notifications

| Type | Déclencheur | Titre | Navigation |
|------|-------------|-------|------------|
| `application_accepted` | Candidature acceptée | "Candidature acceptée ! 🎉" | EventDetails |
| `application_rejected` | Candidature rejetée | "Candidature refusée" | MyApplications |
| `new_message` | Nouveau message chat | "Nouveau message de [Nom]" | Chat |
| `band_invite` | Invitation groupe | "Invitation à rejoindre [Groupe]" | BandInvite |
| `event_reminder` | Rappel événement (24h avant) | "Rappel : [Événement] demain" | EventDetails |
| `event_cancelled` | Événement annulé | "Événement annulé : [Titre]" | MyParticipations |
| `new_review` | Avis reçu | "Nouvel avis sur votre profil" | Profile |
| `subscription_expiring` | Abonnement expire dans 7j | "Votre abonnement PRO expire bientôt" | Subscription |

---

## 🔄 Flux Complet (Exemple)

### Scénario : Candidature Acceptée

```
1️⃣ Établissement accepte candidature
   ↓
   POST /api/applications/{id}/accept

2️⃣ Backend (applications.py)
   - Mise à jour status dans MongoDB
   - Récupère fcm_token du musicien
   - Appelle send_push_notification()
   ↓

3️⃣ Firebase Admin SDK
   - Envoie requête à Firebase Cloud Messaging
   ↓

4️⃣ Firebase Cloud Messaging
   - Route vers l'appareil du musicien
   ↓

5️⃣ App Mobile (Musicien)
   - Reçoit notification
   - Affiche popup si app ouverte
   - OU affiche dans barre notifications si fermée
   ↓

6️⃣ Utilisateur tape sur notification
   - App s'ouvre
   - Navigation vers EventDetails
```

---

## 📊 Données de Notification

### Format Envoyé par Backend

```json
{
  "notification": {
    "title": "Candidature acceptée ! 🎉",
    "body": "Votre candidature pour Jam Session Rock a été acceptée."
  },
  "data": {
    "type": "application_accepted",
    "application_id": "app_123",
    "event_id": "evt_456",
    "timestamp": "2024-03-15T20:30:00Z"
  }
}
```

### Reçu par l'App Mobile

```javascript
{
  messageId: "0:1234567890",
  notification: {
    title: "Candidature acceptée ! 🎉",
    body: "Votre candidature pour Jam Session Rock a été acceptée.",
  },
  data: {
    type: "application_accepted",
    application_id: "app_123",
    event_id: "evt_456",
    timestamp: "2024-03-15T20:30:00Z"
  },
  sentTime: 1234567890000,
  ttl: 2419200
}
```

---

## 🧪 Tests

### Test 1 : Enregistrement Device

```javascript
// Dans l'app mobile, après login
const testRegister = async () => {
  const result = await notificationService.registerDevice();
  console.log('Enregistrement:', result ? '✅' : '❌');
};
```

### Test 2 : Notification Manuelle (Backend)

```python
# Script test côté backend
import asyncio
from firebase_config import send_push_notification

async def test_notification():
    result = await send_push_notification(
        fcm_token="YOUR_TEST_TOKEN_HERE",
        title="Test Notification",
        body="Ceci est un test",
        data={"type": "test"}
    )
    print(result)

asyncio.run(test_notification())
```

### Test 3 : Notification via Postman

```bash
POST https://jamconnexion.com/api/notifications/send
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "user_id": "usr_123",
  "title": "Test Postman",
  "body": "Message de test",
  "data": {
    "type": "test"
  }
}
```

---

## ⚠️ Points d'Attention

### 1. Permissions iOS

- L'utilisateur DOIT accepter les notifications
- Demander au bon moment (après login, pas au démarrage)

### 2. Tokens Expirés

- FCM tokens peuvent expirer
- Implémenter `onTokenRefresh` pour mettre à jour

### 3. App Tuée (Killed)

- Sur Android, notifications fonctionnent même si app tuée
- Sur iOS, peut nécessiter "Background App Refresh" activé

### 4. Badge iOS

```javascript
// Mettre à jour le badge (nombre)
import notifee from '@notifee/react-native';

await notifee.setBadgeCount(5); // Affiche "5" sur l'icône app
await notifee.decrementBadgeCount(); // Décrémente de 1
```

### 5. Quota Firebase

- **Gratuit** : Illimité pour les notifications
- **Payant si** : Utilisation d'autres services Firebase (Firestore, Storage, etc.)

---

## 🎯 Résumé pour l'Agent Mobile

### ✅ À FAIRE

1. Installer `@react-native-firebase/messaging`
2. Configurer `google-services.json` (Android) et `GoogleService-Info.plist` (iOS)
3. Demander permission au démarrage (après login)
4. Récupérer FCM token
5. Envoyer token au backend via `POST /api/notifications/register-device`
6. Écouter notifications avec `onMessage`, `onNotificationOpenedApp`, `getInitialNotification`
7. Implémenter navigation basée sur `data.type`

### ❌ À NE PAS FAIRE

- ❌ Ne PAS implémenter un système de notifications custom (utiliser FCM)
- ❌ Ne PAS oublier de gérer le refresh du token
- ❌ Ne PAS demander la permission dès le splash screen (attendre login)

---

<div align="center">

**Firebase = Push Notifications fiables** 🔔  
**Backend = Déclencheur automatique** 🚀  
**App Mobile = Réception + Navigation** 📱

</div>
