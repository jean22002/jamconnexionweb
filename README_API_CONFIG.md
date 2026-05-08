# ⚙️ ENDPOINT /api/config - Configuration Mobile

<div align="center">

**Documentation complète de l'endpoint de configuration**

Pour récupérer toutes les clés nécessaires au mobile

</div>

---

## 🎯 Objectif

L'endpoint `/api/config` centralise **toutes les clés de configuration** nécessaires pour faire fonctionner l'application mobile :
- 🔥 **Firebase** (Push Notifications)
- 💳 **Stripe** (Paiements)
- 💬 **WebSocket** (Chat temps réel)

**Avantages** :
✅ Un seul endpoint à appeler
✅ Pas besoin de hardcoder les clés dans le mobile
✅ Facile à mettre à jour côté backend

---

## 📡 Endpoint

### GET /api/config

**URL complète** : `https://jamconnexion.com/api/config`

**Méthode** : `GET`

**Authentification** : ❌ Aucune (endpoint public)

**Rate Limit** : Aucune limite

---

## 📦 Réponse

### Structure JSON

```json
{
  "firebase": {
    "apiKey": "AIzaSyDaGmWJrgZHRrcRc9TesT...",
    "authDomain": "jam-connexion.firebaseapp.com",
    "projectId": "jam-connexion",
    "storageBucket": "jam-connexion.appspot.com",
    "messagingSenderId": "123456789012",
    "appId": "1:123456789012:web:abc123def456"
  },
  "stripe": {
    "publishable_key": "pk_test_51Abc123..."
  },
  "websocket": {
    "url": "wss://jamconnexion.com/socket.io",
    "path": "/socket.io"
  }
}
```

---

## 🔥 Intégration Mobile

### 1. Appel de l'API au lancement

```javascript
// src/services/configService.js
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

export const fetchAppConfig = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/config`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération de la config:', error);
    throw error;
  }
};
```

---

### 2. Stockage dans Context React

```javascript
// src/context/ConfigContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchAppConfig } from '../services/configService';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const appConfig = await fetchAppConfig();
        setConfig(appConfig);
      } catch (error) {
        console.error('Impossible de charger la config');
      } finally {
        setLoading(false);
      }
    };
    
    loadConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig doit être utilisé dans ConfigProvider');
  }
  return context;
};
```

---

### 3. Utilisation dans App.js

```javascript
// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ConfigProvider } from './src/context/ConfigContext';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ConfigProvider>
  );
}
```

---

## 🔥 Utilisation Firebase

### Initialisation Firebase avec la config

```javascript
// src/services/firebaseService.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import { useConfig } from '../context/ConfigContext';

export const initializeFirebase = (firebaseConfig) => {
  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);
  return { app, messaging };
};

export const requestNotificationPermission = async (messaging) => {
  try {
    const token = await getToken(messaging, {
      vapidKey: 'YOUR_VAPID_KEY'  // À récupérer depuis Firebase Console
    });
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Erreur permission notifications:', error);
    return null;
  }
};
```

**Dans votre composant** :
```javascript
import { useConfig } from '../context/ConfigContext';
import { initializeFirebase } from '../services/firebaseService';

const MyComponent = () => {
  const { config } = useConfig();
  
  useEffect(() => {
    if (config?.firebase) {
      const { messaging } = initializeFirebase(config.firebase);
      // Utiliser Firebase...
    }
  }, [config]);
};
```

---

## 💳 Utilisation Stripe

### Configuration Stripe avec la clé publique

```javascript
// src/services/stripeService.js
import { StripeProvider } from '@stripe/stripe-react-native';
import { useConfig } from '../context/ConfigContext';

const StripeWrapper = ({ children }) => {
  const { config } = useConfig();
  
  if (!config?.stripe) {
    return null; // Ou un loader
  }
  
  return (
    <StripeProvider publishableKey={config.stripe.publishable_key}>
      {children}
    </StripeProvider>
  );
};

export default StripeWrapper;
```

---

## 💬 Utilisation WebSocket

### Connexion Socket.IO avec l'URL dynamique

```javascript
// src/services/socketService.js
import io from 'socket.io-client';
import { useConfig } from '../context/ConfigContext';

export const useSocket = (token) => {
  const { config } = useConfig();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!config?.websocket || !token) return;

    const socketInstance = io(config.websocket.url, {
      path: config.websocket.path,
      auth: { token },
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('Socket connecté !');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [config, token]);

  return socket;
};
```

---

## 🧪 Test de l'Endpoint

### Via cURL

```bash
curl -X GET https://jamconnexion.com/api/config
```

### Réponse attendue

```json
{
  "firebase": {...},
  "stripe": {...},
  "websocket": {...}
}
```

---

## ⚠️ Gestion des Erreurs

### Cas d'erreur possibles

| Erreur | Cause | Solution |
|--------|-------|----------|
| **500 Internal Error** | Variables d'environnement manquantes côté backend | Vérifier `.env` backend |
| **Timeout** | Backend non démarré | Vérifier `supervisorctl status` |
| **Clés Firebase invalides** | Configuration Firebase incorrecte | Vérifier Firebase Console |

### Exemple de gestion d'erreur

```javascript
const { config, loading } = useConfig();

if (loading) {
  return <LoadingScreen />;
}

if (!config) {
  return (
    <ErrorScreen 
      message="Impossible de charger la configuration. Vérifiez votre connexion."
      onRetry={() => window.location.reload()}
    />
  );
}
```

---

## 🔐 Sécurité

### Clés exposées

✅ **Firebase API Key** : Peut être exposée (Google le recommande)
✅ **Stripe Publishable Key** : Peut être exposée (commence par `pk_`)
✅ **WebSocket URL** : Publique

❌ **JAMAIS exposer** :
- Stripe Secret Key (`sk_...`)
- Firebase Admin SDK (`serviceAccount.json`)
- JWT Secret

---

## 📝 Code Backend (Référence)

### Fichier : `/app/backend/routes/config.py`

```python
from fastapi import APIRouter
import os

router = APIRouter()

@router.get("/config")
async def get_mobile_config():
    """Retourne la configuration pour l'app mobile"""
    return {
        "firebase": {
            "apiKey": os.getenv("FIREBASE_API_KEY"),
            "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN"),
            "projectId": os.getenv("FIREBASE_PROJECT_ID"),
            "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET"),
            "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID"),
            "appId": os.getenv("FIREBASE_APP_ID")
        },
        "stripe": {
            "publishable_key": os.getenv("STRIPE_PUBLISHABLE_KEY")
        },
        "websocket": {
            "url": "wss://jamconnexion.com/socket.io",
            "path": "/socket.io"
        }
    }
```

---

## 📞 Questions Fréquentes

### Q1 : Dois-je appeler `/api/config` à chaque démarrage ?
**R** : Oui, mais vous pouvez mettre en cache pendant 24h pour réduire les appels.

### Q2 : Que faire si Firebase est `null` ?
**R** : L'utilisateur n'a pas encore configuré Firebase. Désactiver les notifications push.

### Q3 : Peut-on tester en local ?
**R** : Oui, remplacer `https://jamconnexion.com` par `http://localhost:8001` (ou l'URL du backend en dev).

---

<div align="center">

**Endpoint /api/config : ✅ PRÊT**

Intégrer au lancement de l'app mobile

</div>
