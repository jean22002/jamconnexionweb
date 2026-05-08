# ☁️ Cloudflare - Guide pour l'Application Mobile

<div align="center">

![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Status](https://img.shields.io/badge/Status-Actif-success?style=for-the-badge)

**Configuration et bonnes pratiques Cloudflare pour Jam Connexion Mobile**

</div>

---

## 📋 Table des Matières

- [Qu'est-ce que Cloudflare ?](#-quest-ce-que-cloudflare-)
- [Architecture Réseau](#-architecture-réseau)
- [Impact sur l'App Mobile](#-impact-sur-lapp-mobile)
- [Configuration Requise](#-configuration-requise)
- [HTTPS & SSL/TLS](#-https--ssltls)
- [Rate Limiting](#-rate-limiting)
- [Cookies Cloudflare](#-cookies-cloudflare)
- [CORS](#-cors)
- [Gestion des Erreurs](#-gestion-des-erreurs)
- [Monitoring & Debug](#-monitoring--debug)
- [Best Practices](#-best-practices)
- [Troubleshooting](#-troubleshooting)

---

## 🌐 Qu'est-ce que Cloudflare ?

**Cloudflare** est un service de **CDN (Content Delivery Network)** et de **sécurité** qui agit comme un proxy inverse entre votre application mobile et le serveur backend de Jam Connexion.

### Rôle de Cloudflare

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  📱 Application Mobile React Native                         │
│            │                                                 │
│            │ HTTPS Request                                   │
│            ↓                                                 │
│  ☁️ CLOUDFLARE (Proxy Inverse)                              │
│            │                                                 │
│            ├─→ 🛡️ Protection DDoS                           │
│            ├─→ 🔒 Certificat SSL/TLS (HTTPS)                │
│            ├─→ 💾 Cache (ressources statiques)              │
│            ├─→ 🔥 Firewall (WAF - Web Application Firewall) │
│            ├─→ ⏱️ Rate Limiting (limitation de requêtes)    │
│            ├─→ 🍪 Gestion de Cookies                        │
│            │                                                 │
│            ↓                                                 │
│  🖥️ SERVEUR BACKEND (FastAPI)                               │
│     https://jamconnexion.com/api                             │
│            │                                                 │
│            ↓                                                 │
│  🗄️ BASE DE DONNÉES (MongoDB Atlas)                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Avantages pour Jam Connexion

| Fonctionnalité | Bénéfice |
|----------------|----------|
| **CDN Global** | Réduction de la latence (serveurs dans le monde entier) |
| **Protection DDoS** | Résistance aux attaques par déni de service |
| **SSL Automatique** | Certificat HTTPS gratuit et auto-renouvelé |
| **Firewall (WAF)** | Protection contre injections SQL, XSS, etc. |
| **Rate Limiting** | Protection contre les abus et scraping |
| **Cache** | Accélération du chargement des images/assets |
| **Bot Management** | Détection et blocage des bots malveillants |

---

## 🏗️ Architecture Réseau

### Flux de Requête Complet

```
1. L'app mobile envoie une requête :
   GET https://jamconnexion.com/api/venues

2. DNS résout jamconnexion.com → IP Cloudflare

3. Cloudflare reçoit la requête :
   ├─ Vérifie si c'est un bot malveillant
   ├─ Applique les règles de firewall
   ├─ Vérifie le rate limiting
   ├─ Vérifie le cache (pour ressources statiques)
   └─ Si OK → Transfère au backend

4. Backend FastAPI répond :
   HTTP 200 OK
   {
     "venues": [...]
   }

5. Cloudflare ajoute ses headers :
   cf-ray: 9e4123fffb5460b1-ORD
   cf-cache-status: DYNAMIC
   server: cloudflare
   strict-transport-security: max-age=63072000

6. L'app mobile reçoit la réponse
```

---

## 📱 Impact sur l'App Mobile

### ✅ Ce qui fonctionne sans configuration

- ✅ Requêtes HTTPS (SSL automatique)
- ✅ Gestion automatique des cookies Cloudflare
- ✅ Protection DDoS transparente
- ✅ Firewall (requêtes légitimes passent)
- ✅ CORS autorisé (app native non soumise aux restrictions web)

### ⚠️ Ce qui nécessite de l'attention

- ⚠️ **Rate Limiting** : Max ~100 requêtes/minute par IP
- ⚠️ **Headers personnalisés** : Ajouter `User-Agent` pour identifier l'app
- ⚠️ **Gestion erreurs 429** : Too Many Requests
- ⚠️ **Gestion erreurs 5xx** : Cloudflare/Backend down
- ⚠️ **Debounce/Throttle** : Éviter de spammer l'API

---

## ⚙️ Configuration Requise

### Configuration Axios (Recommandée)

```javascript
// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://jamconnexion.com/api',
  timeout: 30000, // 30 secondes (important avec Cloudflare)
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'JamConnexionMobile/1.0 (iOS)', // Identifier l'app
  },
  withCredentials: true, // IMPORTANT : Gérer les cookies Cloudflare
});

// Intercepteur Request : Ajouter JWT
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur Response : Gérer erreurs Cloudflare
api.interceptors.response.use(
  (response) => {
    // Logger cf-ray en dev (utile pour debug)
    if (__DEV__ && response.headers['cf-ray']) {
      console.log('CF-Ray:', response.headers['cf-ray']);
    }
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const cfRay = error.response?.headers['cf-ray'];
    
    // Logger l'erreur avec cf-ray
    console.error('API Error:', {
      status,
      message: error.message,
      cfRay,
      url: error.config?.url
    });
    
    // Gestion spécifique des erreurs Cloudflare
    if (status === 429) {
      console.warn('Rate limit atteint. Retry dans 5s...');
      // Retry automatique après 5 secondes
      await new Promise(resolve => setTimeout(resolve, 5000));
      return api.request(error.config);
    }
    
    if (status === 401) {
      // Token expiré
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('user');
      // NavigationService.navigate('Auth');
    }
    
    // Erreurs Cloudflare 5xx
    if (status >= 520 && status <= 527) {
      console.error('Cloudflare Error:', status);
      // Afficher message utilisateur
      Toast.show({
        text: 'Service temporairement indisponible. Réessayez.',
        type: 'error'
      });
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### Headers Importants

| Header | Valeur | Raison |
|--------|--------|--------|
| `User-Agent` | `JamConnexionMobile/1.0` | Identifier l'app mobile (analytics, rate limiting personnalisé) |
| `Authorization` | `Bearer {token}` | Authentification JWT |
| `Content-Type` | `application/json` | Format des données |
| `Accept` | `application/json` | Format de réponse attendu |

---

## 🔒 HTTPS & SSL/TLS

### Certificat SSL Automatique

Cloudflare fournit un **certificat SSL/TLS automatique** pour `jamconnexion.com`.

**Ce que ça signifie pour l'app mobile :**

✅ **TOUJOURS utiliser HTTPS** (jamais HTTP)
✅ **Certificat valide** reconnu par iOS et Android
✅ **Pas de configuration SSL** nécessaire côté app

### Configuration

```javascript
// ✅ CORRECT
const API_URL = 'https://jamconnexion.com/api';

// ❌ INCORRECT (ne fonctionnera PAS)
const API_URL = 'http://jamconnexion.com/api';
```

### HSTS (HTTP Strict Transport Security)

Cloudflare envoie ce header :
```
strict-transport-security: max-age=63072000; includeSubDomains; preload
```

**Impact :** Le navigateur/app **forcera HTTPS** pendant 2 ans (63072000 secondes).

**Conséquence :** Même si vous essayez une requête HTTP, elle sera automatiquement upgradée en HTTPS.

### SSL Pinning (Optionnel - Production)

Pour une sécurité maximale en production :

```javascript
// react-native-ssl-pinning
import { fetch } from 'react-native-ssl-pinning';

fetch('https://jamconnexion.com/api/venues', {
  method: 'GET',
  sslPinning: {
    certs: ['cloudflare'] // Utilise les certificats Cloudflare
  }
});
```

**⚠️ Attention** : Complexe à maintenir. Recommandé uniquement si exigences de sécurité élevées.

---

## ⏱️ Rate Limiting

### Limites Cloudflare

Cloudflare applique un **rate limiting** pour protéger le serveur :

- **~100 requêtes par minute** par IP (configuration typique)
- Si dépassé → **HTTP 429 Too Many Requests**

### Scénarios Problématiques

| Scénario | Risque | Solution |
|----------|--------|----------|
| **Scroll rapide** (FlatList infini) | 🔴 Haute | Pagination + debounce |
| **Recherche live** (chaque frappe) | 🔴 Haute | Debounce 300-500ms |
| **Pull-to-refresh répété** | 🟡 Moyenne | Cooldown 3-5 secondes |
| **Upload multiple images** | 🟡 Moyenne | Upload séquentiel avec délai |
| **Polling** (actualisation auto) | 🟢 Faible | Intervalle ≥ 30 secondes |

### Solution 1 : Debounce sur Recherche

```javascript
import { debounce } from 'lodash';

const SearchScreen = () => {
  const [query, setQuery] = useState('');
  
  // Attendre 300ms après la dernière frappe avant de chercher
  const searchVenues = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery.trim()) return;
      
      try {
        const response = await api.get(`/venues?search=${searchQuery}`);
        setVenues(response.data);
      } catch (error) {
        console.error('Search error:', error);
      }
    }, 300),
    []
  );
  
  useEffect(() => {
    searchVenues(query);
  }, [query]);
  
  return (
    <TextInput
      placeholder="Rechercher un établissement..."
      value={query}
      onChangeText={setQuery}
    />
  );
};
```

### Solution 2 : Cooldown sur Pull-to-Refresh

```javascript
const [refreshing, setRefreshing] = useState(false);
const [lastRefreshTime, setLastRefreshTime] = useState(0);

const onRefresh = async () => {
  const now = Date.now();
  const timeSinceLastRefresh = now - lastRefreshTime;
  
  // Empêcher refresh si moins de 3 secondes depuis le dernier
  if (timeSinceLastRefresh < 3000) {
    Toast.show({
      text: 'Veuillez attendre avant de rafraîchir à nouveau',
      type: 'warning'
    });
    return;
  }
  
  setRefreshing(true);
  try {
    await fetchData();
    setLastRefreshTime(now);
  } catch (error) {
    console.error('Refresh error:', error);
  } finally {
    setRefreshing(false);
  }
};

<FlatList
  data={data}
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
/>
```

### Solution 3 : Retry avec Backoff Exponentiel

```javascript
const apiWithRetry = async (config, retries = 3) => {
  try {
    return await api(config);
  } catch (error) {
    if (error.response?.status === 429 && retries > 0) {
      const delay = Math.pow(2, 4 - retries) * 1000; // 2s, 4s, 8s
      console.log(`Rate limited. Retry dans ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiWithRetry(config, retries - 1);
    }
    throw error;
  }
};

// Utilisation
const response = await apiWithRetry({
  method: 'GET',
  url: '/venues'
});
```

---

## 🍪 Cookies Cloudflare

### Cookie `__cf_bm`

Cloudflare peut définir un cookie de **bot management** :

```
set-cookie: __cf_bm=X3FYrVvssojPgVogPk17YiZfUx_FJbMxy0cxvUAt3Rg-...; 
HttpOnly; Secure; Path=/; Domain=jamconnexion.com; Expires=...
```

**Rôle** : Distinguer les vrais utilisateurs des bots malveillants.

### Gestion Automatique

Avec `withCredentials: true` dans Axios, les cookies sont **automatiquement gérés** :

```javascript
const api = axios.create({
  baseURL: 'https://jamconnexion.com/api',
  withCredentials: true, // ← Active la gestion des cookies
});
```

**React Native** stocke les cookies via `@react-native-cookies/cookies` (optionnel).

### Vérification

```javascript
import CookieManager from '@react-native-cookies/cookies';

// Voir les cookies pour jamconnexion.com
CookieManager.get('https://jamconnexion.com').then((cookies) => {
  console.log('Cookies Cloudflare:', cookies);
});
```

**⚠️ Note** : Normalement, vous n'avez **rien à faire**. Axios gère tout automatiquement.

---

## 🌍 CORS

### Configuration Backend

Le backend a configuré :
```python
CORS_ORIGINS="*"
```

**Headers de réponse** :
```
access-control-allow-origin: *
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
access-control-allow-headers: Content-Type, Authorization
```

### Impact sur l'App Mobile

🟢 **AUCUN PROBLÈME** : Les applications natives (React Native) **ne sont PAS soumises aux restrictions CORS**.

CORS concerne uniquement les **navigateurs web** (politique de sécurité Same-Origin).

**Vous pouvez faire des requêtes depuis n'importe où sans erreur CORS.**

---

## ❌ Gestion des Erreurs

### Codes d'Erreur Cloudflare

| Code HTTP | Nom | Cause | Solution |
|-----------|-----|-------|----------|
| **429** | Too Many Requests | Rate limit dépassé | Attendre + retry avec délai |
| **502** | Bad Gateway | Backend down/redémarre | Retry après 5-10 secondes |
| **503** | Service Unavailable | Maintenance backend | Afficher message maintenance |
| **520** | Web Server Returned Unknown Error | Erreur backend non gérée | Vérifier logs backend |
| **521** | Web Server Is Down | Backend arrêté | Contacter support |
| **522** | Connection Timed Out | Backend ne répond pas | Retry ou timeout |
| **523** | Origin Is Unreachable | Backend inaccessible | Vérifier connexion |
| **524** | A Timeout Occurred | Requête > 100 secondes | Optimiser backend |

### Gestion dans l'App

```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const cfRay = error.response?.headers['cf-ray'];
    
    // Message utilisateur selon le code
    let userMessage = 'Une erreur est survenue';
    
    switch(status) {
      case 429:
        userMessage = 'Trop de requêtes. Veuillez patienter...';
        break;
      case 502:
      case 503:
        userMessage = 'Service temporairement indisponible. Réessayez.';
        break;
      case 520:
      case 521:
      case 522:
      case 523:
      case 524:
        userMessage = 'Erreur de connexion au serveur.';
        console.error('Cloudflare Error:', { status, cfRay });
        break;
      default:
        userMessage = error.response?.data?.detail || error.message;
    }
    
    Toast.show({ text: userMessage, type: 'error' });
    
    return Promise.reject(error);
  }
);
```

---

## 📊 Monitoring & Debug

### Header `cf-ray`

Chaque requête a un **identifiant unique** :
```
cf-ray: 9e4123fffb5460b1-ORD
```

**Utilité** : Debug et support.

### Logger cf-ray en cas d'erreur

```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const cfRay = error.response?.headers['cf-ray'];
    
    // Logger dans console
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      cfRay: cfRay,
      message: error.message
    });
    
    // Envoyer à un service de monitoring (optionnel)
    // Sentry.captureException(error, {
    //   extra: { cfRay, url: error.config?.url }
    // });
    
    return Promise.reject(error);
  }
);
```

### Contacter Support

Si un utilisateur rencontre une erreur persistante :

1. Récupérer le `cf-ray` de l'erreur
2. Contacter Cloudflare Support avec cet ID
3. Ils pourront retracer la requête exacte

---

## ✅ Best Practices

### Checklist Configuration

```
Configuration API
 ☐ Utiliser HTTPS uniquement (https://jamconnexion.com/api)
 ☐ Inclure User-Agent personnalisé
 ☐ Activer withCredentials pour cookies
 ☐ Timeout de 30 secondes minimum
 ☐ Intercepteur pour gérer JWT
 ☐ Intercepteur pour gérer erreurs Cloudflare

Rate Limiting
 ☐ Debounce sur recherches (300-500ms)
 ☐ Cooldown sur pull-to-refresh (3-5 secondes)
 ☐ Pagination sur listes longues
 ☐ Retry avec backoff exponentiel pour erreur 429
 ☐ Éviter polling < 30 secondes

Sécurité
 ☐ Jamais de requêtes HTTP (seulement HTTPS)
 ☐ JWT stocké dans AsyncStorage (pas de logs)
 ☐ Valider certificats SSL (pas de bypass)
 ☐ Ne pas exposer cf-ray dans l'UI (seulement logs)

Performance
 ☐ Cache images avec FastImage
 ☐ Éviter requêtes inutiles (useMemo, useCallback)
 ☐ Upload images compressées
 ☐ Gérer états de chargement (spinners)
```

### Code Template Complet

```javascript
// services/api.js - Configuration complète et optimale
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const api = axios.create({
  baseURL: 'https://jamconnexion.com/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': `JamConnexionMobile/1.0 (${Platform.OS})`,
  },
  withCredentials: true,
});

// Request Interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (__DEV__) {
      console.log('→', config.method.toUpperCase(), config.url);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log('✓', response.config.url, response.status);
      if (response.headers['cf-ray']) {
        console.log('  CF-Ray:', response.headers['cf-ray']);
      }
    }
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const cfRay = error.response?.headers['cf-ray'];
    const url = error.config?.url;
    
    // Logging
    console.error('✗ API Error:', { url, status, cfRay });
    
    // Gestion spécifique par code
    if (status === 429) {
      console.warn('Rate limit. Retry dans 5s...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return api.request(error.config);
    }
    
    if (status === 401) {
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('user');
      // NavigationService.navigate('Auth');
    }
    
    if (status >= 520 && status <= 527) {
      console.error('Cloudflare Error:', status);
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🐛 Troubleshooting

### Problème 1 : Erreur 429 constante

**Symptôme** : `HTTP 429 Too Many Requests` à répétition

**Causes possibles :**
- Recherche live sans debounce
- Pull-to-refresh spam
- Boucle infinie de requêtes
- Polling trop fréquent

**Solution :**
1. Ajouter `console.log` pour compter les requêtes
2. Implémenter debounce (300ms min)
3. Ajouter cooldown sur refresh (3s min)
4. Vérifier qu'il n'y a pas de `useEffect` en boucle

```javascript
// Debug : Compter les requêtes
let requestCount = 0;
api.interceptors.request.use((config) => {
  requestCount++;
  console.log(`Request #${requestCount}:`, config.url);
  return config;
});
```

---

### Problème 2 : Cookies non persistés

**Symptôme** : Cookie `__cf_bm` non envoyé avec les requêtes

**Cause** : `withCredentials` manquant

**Solution :**
```javascript
const api = axios.create({
  withCredentials: true, // ← Ajouter ceci
});
```

---

### Problème 3 : Erreur 520-524

**Symptôme** : Erreurs 5xx de Cloudflare

**Cause** : Backend down ou erreur non gérée

**Solution :**
1. Vérifier si `https://jamconnexion.com` est accessible
2. Tester l'endpoint avec `curl` :
   ```bash
   curl -X GET https://jamconnexion.com/api/venues \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
3. Vérifier les logs backend
4. Contacter support avec le `cf-ray`

---

### Problème 4 : Timeout fréquents

**Symptôme** : Requêtes timeout après 30s

**Cause** : Endpoint backend lent (> 30s)

**Solution :**
1. Augmenter le timeout (temporaire) :
   ```javascript
   const api = axios.create({
     timeout: 60000, // 60 secondes
   });
   ```
2. Optimiser l'endpoint backend (pagination, cache)
3. Afficher un loader à l'utilisateur

---

### Problème 5 : CORS errors (rare)

**Symptôme** : Erreur CORS sur certaines requêtes

**Cause** : Mauvaise configuration ou navigateur web intégré

**Solution :**
1. Vérifier que vous utilisez `axios` (pas `fetch` du navigateur)
2. Ne PAS utiliser de WebView pour les requêtes API
3. Vérifier les headers backend CORS

---

## 📚 Ressources

- [Documentation Cloudflare](https://developers.cloudflare.com/)
- [Cloudflare Status](https://www.cloudflarestatus.com/)
- [React Native Axios](https://github.com/axios/axios)
- [Rate Limiting Best Practices](https://developers.cloudflare.com/waf/rate-limiting-rules/)

---

## 🎯 Résumé en 5 Points

1. **HTTPS Obligatoire** : Toujours `https://jamconnexion.com/api`
2. **withCredentials: true** : Pour gérer les cookies Cloudflare
3. **Rate Limiting** : Debounce + cooldown + retry 429
4. **Erreurs 5xx** : Gérer 520-527 avec messages utilisateur
5. **cf-ray** : Logger pour debug et support

---

<div align="center">

**Configuration optimale = App mobile stable et rapide** ⚡

</div>
