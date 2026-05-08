# 🚀 QUICK START - Intégration Mobile Jam Connexion

<div align="center">

**Guide de Démarrage Rapide pour l'Agent Mobile**

Tout ce qu'il faut savoir en 10 minutes

</div>

---

## 🎯 Objectif

Vous êtes l'**Agent Mobile** externe chargé de développer l'application React Native. Ce guide vous donne **l'essentiel** pour démarrer rapidement sans vous perdre dans 20+ fichiers README.

---

## ⚡ 3 Étapes pour Démarrer

### 1️⃣ Configuration de Base (5 min)

**Créer le projet React Native** :
```bash
npx react-native init JamConnexion
cd JamConnexion
```

**Installer les dépendances essentielles** :
```bash
# API & Réseau
yarn add axios

# Navigation
yarn add @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
yarn add react-native-screens react-native-safe-area-context

# State Management (optionnel)
yarn add @react-native-async-storage/async-storage
```

**Configurer l'URL de l'API** :
```javascript
// src/config/api.js
export const API_BASE_URL = 'https://jamconnexion.com/api';
export const WS_URL = 'wss://jamconnexion.com/socket.io';
```

---

### 2️⃣ Récupérer la Configuration Backend (2 min)

**Créer un service de configuration** :
```javascript
// src/services/configService.js
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export const fetchAppConfig = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/config`);
    return response.data;
    // Retourne : { firebase: {...}, stripe: {...}, websocket: {...} }
  } catch (error) {
    console.error('Config error:', error);
    throw error;
  }
};
```

**Créer un Context pour la config** :
```javascript
// src/context/ConfigContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchAppConfig } from '../services/configService';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppConfig()
      .then(setConfig)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);
```

---

### 3️⃣ Authentification JWT (3 min)

**Service d'authentification** :
```javascript
// src/services/authService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

export const login = async (email, password) => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, {
    email,
    password
  });
  
  const { token, user } = response.data;
  await AsyncStorage.setItem('authToken', token);
  return { token, user };
};

export const getToken = async () => {
  return await AsyncStorage.getItem('authToken');
};

export const logout = async () => {
  await AsyncStorage.removeItem('authToken');
};
```

**Intercepteur Axios pour ajouter le token** :
```javascript
// src/config/axiosConfig.js
import axios from 'axios';
import { getToken } from '../services/authService';
import { API_BASE_URL } from './api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## 📱 Structure Recommandée

```
JamConnexion/
├── src/
│   ├── config/
│   │   ├── api.js              # URLs de base
│   │   └── axiosConfig.js      # Axios avec intercepteurs
│   ├── context/
│   │   ├── ConfigContext.js    # Config backend (Firebase, Stripe)
│   │   └── AuthContext.js      # État d'authentification
│   ├── services/
│   │   ├── authService.js      # Login, logout, register
│   │   ├── configService.js    # GET /api/config
│   │   ├── musicianService.js  # API musiciens
│   │   ├── venueService.js     # API établissements
│   │   └── socketService.js    # Socket.IO (chat)
│   ├── screens/
│   │   ├── Auth/
│   │   │   ├── LoginScreen.js
│   │   │   └── RegisterScreen.js
│   │   ├── Musician/
│   │   │   ├── DashboardScreen.js
│   │   │   ├── ProfileScreen.js
│   │   │   └── MapScreen.js
│   │   └── Venue/
│   │       └── DashboardScreen.js
│   ├── navigation/
│   │   └── RootNavigator.js
│   └── App.js
└── package.json
```

---

## 🔑 Endpoints Prioritaires

### Authentification
```bash
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/verify-email?token=...
```

### Profil Utilisateur
```bash
GET  /api/musicians/me
PUT  /api/musicians/me
GET  /api/venues/me
PUT  /api/venues/me
GET  /api/melomanes/me
PUT  /api/melomanes/me
```

### Configuration
```bash
GET  /api/config  # Firebase, Stripe, WebSocket
```

### Recherche
```bash
GET  /api/venues?city=Paris&region=Île-de-France
GET  /api/bands?music_style=Rock
GET  /api/planning/search?is_open=true
```

---

## 🧪 Test Rapide de l'API

**Tester depuis le terminal** :
```bash
# Récupérer la config
curl https://jamconnexion.com/api/config

# Login
curl -X POST https://jamconnexion.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"test"}'

# Récupérer le profil musicien (remplacer TOKEN)
curl https://jamconnexion.com/api/musicians/me \
  -H "Authorization: Bearer TOKEN"
```

---

## 📖 Documentation Complète

### 🆕 Commencer par ces 3 fichiers (Priorité Max)

| Fichier | Temps de lecture | Utilité |
|---------|------------------|---------|
| **README_CHANGELOG_MOBILE.md** | 5 min | Tous les changements API récents |
| **README_API_CONFIG.md** | 10 min | Endpoint `/api/config` expliqué |
| **README_TROUBLESHOOTING_MOBILE.md** | Référence | Solutions aux erreurs 500, 405, CORS, etc. |

### Ensuite, consulter selon les besoins

| Fonctionnalité | README à lire |
|----------------|---------------|
| Architecture globale | `MOBILE_README.md` |
| Dashboard Musicien | `README_MUSICIAN_DASHBOARD.md` |
| Dashboard Établissement | `README_VENUE_DASHBOARD.md` |
| Dashboard Mélomane | `README_MELOMANE_DASHBOARD.md` |
| Chat temps réel | `README_CHAT.md` |
| Notifications Push | `FIREBASE_MOBILE_SETUP.md` + `README_FIREBASE_PUSH.md` |
| Paiements Stripe | `README_STRIPE.md` |
| Upload d'images | `README_UPLOADS.md` |
| Système de Planning | `README_PLANNING_SYSTEM.md` |
| Profil Musicien détaillé | `README_PROFILE_MUSICIAN.md` |
| Profil Établissement | `README_PROFILE_VENUE.md` |
| Profil Mélomane | `README_PROFILE_MELOMANE.md` |

📋 **Index complet** : Voir `INDEX_MOBILE.md`

---

## 🐛 Erreurs Courantes & Solutions Rapides

### ❌ Erreur 401 - Not Authenticated
**Solution** : Vérifier que le token JWT est bien envoyé dans le header `Authorization: Bearer TOKEN`

### ❌ Erreur 404 - Not Found
**Solution** : Ajouter `/api` avant chaque endpoint : `https://jamconnexion.com/api/musicians/me`

### ❌ Erreur 500 - Internal Server Error
**Solution** : Consulter `README_TROUBLESHOOTING_MOBILE.md` (tous les bugs 500 ont été corrigés le 30 Mars)

### ❌ Network Error
**Solution** : Vérifier l'URL (doit être `https://` pas `http://`)

---

## 🔥 Intégrations Optionnelles (Phase 2)

### Firebase (Notifications Push)

**Installation** :
```bash
yarn add @react-native-firebase/app @react-native-firebase/messaging
```

**Configuration** : Suivre `FIREBASE_MOBILE_SETUP.md`

**Récupérer les credentials** :
```javascript
const { config } = useConfig();
console.log(config.firebase);  // apiKey, projectId, etc.
```

---

### Socket.IO (Chat Temps Réel)

**Installation** :
```bash
yarn add socket.io-client
```

**Utilisation** :
```javascript
import io from 'socket.io-client';

const socket = io('https://jamconnexion.com', {
  path: '/socket.io',
  auth: { token: authToken },
  transports: ['websocket'],
});

socket.on('connect', () => console.log('Connecté !'));
socket.on('message', (data) => console.log('Nouveau message:', data));
```

**Documentation complète** : `README_CHAT.md`

---

### Stripe (Paiements)

**Installation** :
```bash
yarn add @stripe/stripe-react-native
```

**Récupérer la clé publique** :
```javascript
const { config } = useConfig();
const publishableKey = config.stripe.publishable_key;

// Utiliser avec StripeProvider
<StripeProvider publishableKey={publishableKey}>
  {/* Votre app */}
</StripeProvider>
```

**Documentation complète** : `README_STRIPE.md`

---

## ✅ Checklist de Démarrage

Avant de commencer à coder les écrans :

- [ ] Projet React Native créé
- [ ] Dépendances de base installées (axios, navigation)
- [ ] URL de l'API configurée (`https://jamconnexion.com/api`)
- [ ] Endpoint `/api/config` testé avec cURL
- [ ] Service d'authentification créé
- [ ] Context Config créé
- [ ] Login/Register fonctionnel (test avec compte `test@gmail.com` / `test`)
- [ ] Token JWT stocké dans AsyncStorage
- [ ] Intercepteur Axios configuré
- [ ] Documentation prioritaire lue (README_CHANGELOG, README_API_CONFIG, README_TROUBLESHOOTING)

---

## 🆘 Besoin d'Aide ?

1. **Erreur technique** → Consulter `README_TROUBLESHOOTING_MOBILE.md`
2. **Question sur une fonctionnalité** → Consulter le README correspondant dans `INDEX_MOBILE.md`
3. **Doute sur un endpoint** → Tester avec `curl` ou Postman
4. **Problème de déploiement** → Contacter l'utilisateur (Jean)

---

## 🎯 Prochaines Étapes

Après cette configuration de base :

1. ✅ **Implémenter les écrans d'authentification** (Login, Register)
2. ✅ **Créer les 3 dashboards** (Musicien, Établissement, Mélomane)
3. ✅ **Intégrer la carte** (Map avec établissements géolocalisés)
4. ✅ **Ajouter le système de Planning** (recherche d'événements)
5. ✅ **Implémenter le chat** (Socket.IO)
6. ✅ **Configurer Firebase** (Push notifications)
7. ✅ **Intégrer Stripe** (Abonnements PRO)

**Consulter les README correspondants pour chaque fonctionnalité.**

---

<div align="center">

**🚀 Vous êtes maintenant prêt à développer l'app mobile ! 🚀**

Backend 100% fonctionnel  
Documentation exhaustive  
Support disponible

**Bon développement !**

</div>

---

**Dernière mise à jour** : 31 Mars 2025  
**Version API** : 2.0.0
