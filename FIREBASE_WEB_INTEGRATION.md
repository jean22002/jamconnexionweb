# 🔥 Firebase Web Integration - Jam Connexion

## 📋 Configuration Récupérée

La configuration Firebase est maintenant **automatiquement disponible** via l'endpoint `/api/config`.

### Endpoint API

```bash
GET https://jamconnexion.com/api/config
```

### Réponse

```json
{
  "firebase": {
    "enabled": true,
    "apiKey": "AIzaSyAdn69SgtZgL498Annze1zcSGLfvlWNKcA",
    "authDomain": "jamconnexion.firebaseapp.com",
    "projectId": "jamconnexion",
    "storageBucket": "jamconnexion.firebasestorage.app",
    "messagingSenderId": "958386684567",
    "appId": "1:958386684567:web:a8f19cbf531f26562dfd2"
  }
}
```

---

## 🌐 Intégration Frontend Web

### 1. Installation

```bash
cd /app/frontend
npm install firebase
```

### 2. Créer le Service Firebase

**Fichier** : `/app/frontend/src/services/firebase.js`

```javascript
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

let app = null;
let messaging = null;

export const initializeFirebase = async () => {
  try {
    // Récupérer la config depuis le backend
    const response = await fetch('/api/config');
    const config = await response.json();
    
    if (!config.firebase || !config.firebase.enabled) {
      console.warn('Firebase non configuré');
      return null;
    }
    
    // Initialiser Firebase
    app = initializeApp(config.firebase);
    messaging = getMessaging(app);
    
    console.log('✅ Firebase initialisé');
    return messaging;
  } catch (error) {
    console.error('❌ Erreur Firebase:', error);
    return null;
  }
};

export const requestNotificationPermission = async () => {
  try {
    if (!messaging) {
      await initializeFirebase();
    }
    
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'VOTRE_VAPID_KEY_PUBLIC'  // À récupérer dans Firebase Console
      });
      
      console.log('🔔 FCM Token:', token);
      
      // Envoyer le token au backend
      await fetch('/api/notifications/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fcm_token: token })
      });
      
      return token;
    } else {
      console.log('❌ Permission notifications refusée');
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur permission:', error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('📬 Message reçu:', payload);
      resolve(payload);
    });
  });
```

### 3. Utiliser dans l'App

**Fichier** : `/app/frontend/src/App.js`

```javascript
import { useEffect } from 'react';
import { initializeFirebase, requestNotificationPermission, onMessageListener } from './services/firebase';

function App() {
  useEffect(() => {
    // Initialiser Firebase au démarrage
    const setupFirebase = async () => {
      const messaging = await initializeFirebase();
      
      if (messaging) {
        // Demander la permission pour les notifications
        await requestNotificationPermission();
        
        // Écouter les messages
        onMessageListener().then(payload => {
          // Afficher une notification toast ou un modal
          console.log('Nouveau message:', payload);
        });
      }
    };
    
    setupFirebase();
  }, []);
  
  return (
    <div className="App">
      {/* Votre app */}
    </div>
  );
}
```

---

## 📱 Intégration Mobile (React Native)

### 1. Installation

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

### 2. Configuration iOS

**Fichier** : `ios/[AppName]/GoogleService-Info.plist`

Téléchargez depuis Firebase Console > Project Settings > iOS

### 3. Configuration Android

**Fichier** : `android/app/google-services.json`

Téléchargez depuis Firebase Console > Project Settings > Android

### 4. Service Firebase Mobile

```javascript
import messaging from '@react-native-firebase/messaging';
import { useEffect } from 'react';

export const usePushNotifications = () => {
  useEffect(() => {
    // Demander la permission
    const requestPermission = async () => {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ Permission notifications accordée');
        
        // Récupérer le token
        const token = await messaging().getToken();
        console.log('🔔 FCM Token:', token);
        
        // Envoyer au backend
        await fetch('https://jamconnexion.com/api/notifications/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fcm_token: token })
        });
      }
    };

    requestPermission();

    // Écouter les messages en foreground
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('📬 Message reçu:', remoteMessage);
    });

    return unsubscribe;
  }, []);
};
```

---

## 🔐 Sécurité

### Variables d'environnement Backend

Les clés Firebase sont stockées dans `/app/backend/.env` :

```bash
FIREBASE_API_KEY=AIzaSyAdn69SgtZgL498Annze1zcSGLfvlWNKcA
FIREBASE_AUTH_DOMAIN=jamconnexion.firebaseapp.com
FIREBASE_PROJECT_ID=jamconnexion
FIREBASE_STORAGE_BUCKET=jamconnexion.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=958386684567
FIREBASE_APP_ID=1:958386684567:web:a8f19cbf531f26562dfd2
```

⚠️ **Note** : Ces clés sont **publiques** et peuvent être exposées côté client (c'est normal pour Firebase Web SDK).

---

## 🧪 Test

### Via cURL

```bash
curl https://jamconnexion.com/api/config | jq '.firebase'
```

### Réponse attendue

```json
{
  "enabled": true,
  "apiKey": "AIzaSyAdn69SgtZgL498Annze1zcSGLfvlWNKcA",
  "authDomain": "jamconnexion.firebaseapp.com",
  "projectId": "jamconnexion",
  "storageBucket": "jamconnexion.firebasestorage.app",
  "messagingSenderId": "958386684567",
  "appId": "1:958386684567:web:a8f19cbf531f26562dfd2"
}
```

---

## 📖 Documentation Firebase

- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
- [Firebase Cloud Messaging Web](https://firebase.google.com/docs/cloud-messaging/js/client)
- [React Native Firebase](https://rnfirebase.io/)

---

## ✅ Checklist

- [x] Configuration Firebase ajoutée au backend (.env)
- [x] Endpoint `/api/config` retourne la config Firebase
- [ ] Firebase SDK installé dans le frontend
- [ ] Service Firebase créé
- [ ] Notifications testées

---

**Date** : 31 Mars 2025  
**Status** : ✅ Configuration prête - En attente d'intégration frontend
