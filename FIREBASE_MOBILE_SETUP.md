# 🔥 Configuration Firebase pour Jam Connexion Mobile

## 📱 Fichiers nécessaires pour l'app mobile

### 1. **Android** : `google-services.json`

**Où le placer dans votre projet React Native :**
```
android/app/google-services.json
```

**Comment l'obtenir :**
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet (ou créez-en un nouveau)
3. Cliquez sur l'icône Android ⚙️
4. Cliquez sur "Télécharger google-services.json"
5. Placez le fichier dans `android/app/`

**Structure du fichier :**
```json
{
  "project_info": {
    "project_number": "123456789",
    "project_id": "jam-connexion",
    "storage_bucket": "jam-connexion.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:123456789:android:abcdef",
        "android_client_info": {
          "package_name": "com.jamconnexion.app"
        }
      }
    }
  ]
}
```

---

### 2. **iOS** : `GoogleService-Info.plist`

**Où le placer dans votre projet React Native :**
```
ios/GoogleService-Info.plist
```

**Comment l'obtenir :**
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Cliquez sur l'icône iOS 🍎
4. Cliquez sur "Télécharger GoogleService-Info.plist"
5. Placez le fichier dans `ios/`
6. Ajoutez-le à Xcode (clic droit sur le projet → Add Files)

**Structure du fichier :**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CLIENT_ID</key>
	<string>123456789-abcdef.apps.googleusercontent.com</string>
	<key>REVERSED_CLIENT_ID</key>
	<string>com.googleusercontent.apps.123456789-abcdef</string>
	<key>API_KEY</key>
	<string>AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</string>
	<key>GCM_SENDER_ID</key>
	<string>123456789</string>
	<key>PLIST_VERSION</key>
	<string>1</string>
	<key>BUNDLE_ID</key>
	<string>com.jamconnexion.app</string>
	<key>PROJECT_ID</key>
	<string>jam-connexion</string>
	<key>STORAGE_BUCKET</key>
	<string>jam-connexion.appspot.com</string>
</dict>
</plist>
```

---

### 3. **Backend** : `firebase-credentials.json`

**Où le placer :**
```
/app/backend/firebase-credentials.json
```

**Comment l'obtenir :**
1. Firebase Console → Paramètres du projet ⚙️
2. Onglet "Comptes de service"
3. Cliquez sur "Générer une nouvelle clé privée"
4. Téléchargez le fichier JSON
5. Renommez-le en `firebase-credentials.json`
6. Placez-le dans `/app/backend/`

**⚠️ IMPORTANT** :
- Ce fichier contient des **secrets** - ne jamais le committer sur Git
- Ajoutez-le au `.gitignore`
- Utilisez des variables d'environnement en production

---

## 🚀 Intégration React Native

### Installation des packages

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
# ou
yarn add @react-native-firebase/app @react-native-firebase/messaging
```

### Configuration Android

**`android/build.gradle`** :
```gradle
buildscript {
  dependencies {
    classpath 'com.google.gms:google-services:4.3.15'
  }
}
```

**`android/app/build.gradle`** :
```gradle
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services'  // ← Ajouter cette ligne
```

### Configuration iOS

**`ios/Podfile`** :
```ruby
pod 'Firebase/Messaging'
```

Puis exécutez :
```bash
cd ios && pod install
```

---

## 📲 Utilisation dans l'app

### 1. Initialisation Firebase

```javascript
// App.js
import messaging from '@react-native-firebase/messaging';

// Demander la permission (iOS)
async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    return true;
  }
  return false;
}

// Obtenir le token FCM
async function getFCMToken() {
  const token = await messaging().getToken();
  console.log('FCM Token:', token);
  return token;
}

// Dans votre useEffect
useEffect(() => {
  requestUserPermission().then(allowed => {
    if (allowed) {
      getFCMToken().then(token => {
        // Envoyer le token au backend
        saveTokenToBackend(token);
      });
    }
  });
}, []);
```

### 2. Enregistrer le token au backend

```javascript
const saveTokenToBackend = async (fcmToken) => {
  try {
    await axios.post(
      'https://jamconnexion.com/api/push/register',
      { fcm_token: fcmToken },
      {
        headers: {
          'Authorization': `Bearer ${yourAuthToken}`
        }
      }
    );
    console.log('✅ Token FCM enregistré au backend');
  } catch (error) {
    console.error('❌ Erreur enregistrement token:', error);
  }
};
```

### 3. Recevoir les notifications

```javascript
// Notification en arrière-plan
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message reçu en arrière-plan:', remoteMessage);
});

// Notification en foreground
useEffect(() => {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('Message reçu en foreground:', remoteMessage);
    
    // Afficher une notification locale
    // ou mettre à jour l'UI
  });

  return unsubscribe;
}, []);
```

---

## 🔑 Variables d'environnement

Ajoutez dans votre `.env` (React Native) :

```bash
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FIREBASE_PROJECT_ID=jam-connexion
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:android:abcdef
```

---

## ✅ Vérification

### Test de l'envoi de notification depuis le backend

```bash
curl -X POST https://jamconnexion.com/api/push/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID",
    "title": "Test Notification",
    "body": "Ceci est un test",
    "data": {
      "type": "test"
    }
  }'
```

---

## 📚 Documentation complète

- [React Native Firebase](https://rnfirebase.io/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- `README_FIREBASE_PUSH.md` (backend)

---

**Dernière mise à jour :** 2026-03-31  
**Contact :** Équipe Backend Jam Connexion
