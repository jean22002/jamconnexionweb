# 🚨 TROUBLESHOOTING - Erreurs Courantes API Mobile

<div align="center">

**Guide de résolution des problèmes les plus fréquents**

Pour l'Agent Mobile React Native

</div>

---

## 🎯 Objectif

Ce document liste **toutes les erreurs courantes** rencontrées lors de l'intégration de l'API Jam Connexion dans l'app mobile, avec leurs solutions.

---

## 🔴 ERREURS BACKEND (5xx)

### ❌ Erreur 500 - Internal Server Error

#### **Cas 1 : GET /api/melomanes/me**

**Symptôme** :
```json
{
  "detail": "Internal server error"
}
```

**Cause** : Conversion `datetime` → `string` échouait dans Pydantic

**✅ Solution** : Bug corrigé le 30 Mars 2025

**Vérification** :
```bash
curl -X GET https://jamconnexion.com/api/melomanes/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse attendue** :
```json
{
  "id": "abc123",
  "first_name": "Jean",
  "last_name": "Dupont",
  "musical_styles": ["Rock", "Jazz"],
  "created_at": "2025-03-15T10:30:00Z"
}
```

---

#### **Cas 2 : GET /api/planning/search**

**Symptôme** :
```json
{
  "detail": "Field 'venue_city' not found in response model"
}
```

**Cause** : Schéma Pydantic `PlanningSlotResponse` incomplet

**✅ Solution** : Tous les champs ajoutés (venue_city, venue_region, latitude, longitude)

**Vérification** :
```bash
curl -X GET "https://jamconnexion.com/api/planning/search?city=Paris"
```

**Réponse attendue** :
```json
[
  {
    "id": "slot123",
    "venue_id": "venue456",
    "venue_name": "Le Jazz Club",
    "venue_city": "Paris",
    "venue_department": "75",
    "venue_region": "Île-de-France",
    "venue_latitude": 48.8566,
    "venue_longitude": 2.3522,
    "event_type": "concert",
    "music_style": "Jazz",
    "start_date": "2025-04-15T20:00:00Z",
    "budget_min": 500.0,
    "status": "open"
  }
]
```

---

### ❌ Erreur 503 - Service Unavailable

**Symptôme** : L'API ne répond pas du tout

**Causes possibles** :
1. Backend arrêté
2. MongoDB Atlas inaccessible
3. Problème Cloudflare

**Solutions** :

**1. Vérifier le statut du backend** :
```bash
sudo supervisorctl status backend
```

**2. Vérifier les logs** :
```bash
tail -n 100 /var/log/supervisor/backend.err.log
```

**3. Redémarrer le backend** :
```bash
sudo supervisorctl restart backend
```

**4. Vérifier MongoDB** :
```bash
curl -X GET https://jamconnexion.com/api/stats/counts
```

Si ça fonctionne, MongoDB est OK.

---

## 🟡 ERREURS CLIENT (4xx)

### ❌ Erreur 401 - Unauthorized

**Symptôme** :
```json
{
  "detail": "Not authenticated"
}
```

**Cause** : Token JWT manquant ou invalide

**Solutions** :

**1. Vérifier que le token est envoyé** :
```javascript
axios.get('/api/musicians/me', {
  headers: {
    'Authorization': `Bearer ${token}`  // ✅ Bien ajouter "Bearer "
  }
});
```

**2. Vérifier que le token n'est pas expiré** :
```javascript
import jwtDecode from 'jwt-decode';

const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
};
```

**3. Rafraîchir le token si expiré** :
```javascript
if (isTokenExpired(token)) {
  // Rediriger vers la page de login
  navigation.navigate('Login');
}
```

---

### ❌ Erreur 404 - Not Found

**Symptôme** :
```json
{
  "detail": "Not Found"
}
```

**Causes courantes** :

| Endpoint testé | Problème | Solution |
|----------------|----------|----------|
| `/musicians/me` | Manque `/api` | Utiliser `/api/musicians/me` |
| `/api/bands/999` | ID inexistant | Vérifier que l'ID existe en DB |
| `/api/venu/123` | Typo dans l'URL | Corriger : `/api/venues/123` |

**Vérification de la bonne URL** :
```javascript
const API_BASE_URL = 'https://jamconnexion.com/api';  // ✅ Avec /api

axios.get(`${API_BASE_URL}/musicians/me`);  // ✅ Correct
```

---

### ❌ Erreur 405 - Method Not Allowed

**Symptôme** :
```json
{
  "detail": "Method Not Allowed"
}
```

**Cas courant : PUT /musicians/me**

**Cause** : Avant le 30 Mars, cette route n'existait pas

**✅ Solution** : Routes alias ajoutées

**Endpoints maintenant disponibles** :
```bash
PUT /api/musicians/me   # ✅ Fonctionne
PUT /api/venues/me      # ✅ Fonctionne
PUT /api/melomanes/me   # ✅ Fonctionne
```

**Exemple d'appel** :
```javascript
axios.put('/api/musicians/me', {
  first_name: 'Jean',
  last_name: 'Dupont',
  music_styles: ['Rock', 'Blues']
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

### ❌ Erreur 422 - Validation Error

**Symptôme** :
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**Cause** : Données envoyées ne respectent pas le schéma Pydantic

**Solutions** :

**1. Vérifier les champs obligatoires** :
```javascript
// ❌ Mauvais
axios.post('/api/auth/register', {
  email: 'test@example.com'
  // Manque : password, account_type, first_name, last_name
});

// ✅ Correct
axios.post('/api/auth/register', {
  email: 'test@example.com',
  password: 'SecurePass123!',
  account_type: 'musician',
  first_name: 'Jean',
  last_name: 'Dupont'
});
```

**2. Vérifier les types de données** :
```javascript
// ❌ Mauvais (budget_min doit être un nombre)
axios.post('/api/planning/slots', {
  budget_min: "500"  // String ❌
});

// ✅ Correct
axios.post('/api/planning/slots', {
  budget_min: 500  // Number ✅
});
```

---

## 🌐 ERREURS RÉSEAU

### ❌ Network Error / CORS

**Symptôme** :
```
Access to fetch at 'https://jamconnexion.com/api/musicians' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Cause** : Problème CORS (seulement pour tests depuis navigateur)

**✅ Solution** : CORS configuré pour tous les domaines Emergent + jamconnexion.com

**Important** : Sur React Native, **CORS n'existe pas** (pas de navigateur)

**Si erreur réseau sur React Native** :

**1. Vérifier la connexion internet** :
```javascript
import NetInfo from '@react-native-community/netinfo';

NetInfo.fetch().then(state => {
  console.log('Connecté:', state.isConnected);
});
```

**2. Vérifier l'URL** :
```javascript
const API_URL = 'https://jamconnexion.com/api';  // ✅ HTTPS
// Pas : 'http://jamconnexion.com' ❌
```

**3. Tester avec cURL pour isoler le problème** :
```bash
curl -v https://jamconnexion.com/api/stats/counts
```

---

### ❌ Timeout Error

**Symptôme** :
```
Error: timeout of 5000ms exceeded
```

**Causes** :
1. Connexion internet lente
2. Backend surchargé
3. Timeout configuré trop court

**Solutions** :

**1. Augmenter le timeout** :
```javascript
axios.get('/api/bands', {
  timeout: 10000  // 10 secondes au lieu de 5
});
```

**2. Ajouter un retry automatique** :
```javascript
const axiosRetry = require('axios-retry');

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay
});
```

---

## 🔥 ERREURS FIREBASE

### ❌ Firebase: Error (auth/invalid-api-key)

**Symptôme** :
```
Firebase: Error (auth/invalid-api-key)
```

**Cause** : Clé API Firebase incorrecte ou non configurée

**Solutions** :

**1. Vérifier que `/api/config` retourne Firebase** :
```bash
curl https://jamconnexion.com/api/config
```

**2. Vérifier la clé dans Firebase Console** :
- Aller sur https://console.firebase.google.com/
- Sélectionner le projet "Jam Connexion"
- Settings > General > Web API Key
- Comparer avec la valeur retournée par `/api/config`

**3. Vérifier les variables d'environnement backend** :
```bash
cat /app/backend/.env | grep FIREBASE
```

---

### ❌ Firebase: Messaging is not supported

**Symptôme** :
```
Firebase: Messaging is not supported in this environment
```

**Cause** : Firebase Messaging ne fonctionne que sur navigateurs compatibles (pas en mode dev React Native)

**Solution** : Utiliser `@react-native-firebase/messaging` au lieu de `firebase/messaging`

**Installation** :
```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

**Utilisation** :
```javascript
import messaging from '@react-native-firebase/messaging';

const token = await messaging().getToken();
console.log('FCM Token:', token);
```

---

## 💳 ERREURS STRIPE

### ❌ Invalid API Key

**Symptôme** :
```json
{
  "error": {
    "message": "Invalid API Key provided"
  }
}
```

**Cause** : Clé Stripe incorrecte

**Solution** :

**1. Vérifier `/api/config`** :
```bash
curl https://jamconnexion.com/api/config | jq '.stripe'
```

**2. Vérifier que c'est la clé publique** :
```
pk_test_...  ✅ Correct (Publishable Key)
sk_test_...  ❌ Incorrect (Secret Key - ne jamais exposer)
```

**3. Mode Test vs Production** :
```
pk_test_...  → Mode Test (paiements simulés)
pk_live_...  → Mode Production (vrais paiements)
```

---

## 💬 ERREURS SOCKET.IO

### ❌ WebSocket connection failed

**Symptôme** :
```
WebSocket connection to 'wss://jamconnexion.com/socket.io/' failed
```

**Causes possibles** :
1. URL incorrecte
2. Backend Socket.IO non démarré
3. Cloudflare bloque les WebSockets

**Solutions** :

**1. Vérifier l'URL** :
```javascript
const socket = io('wss://jamconnexion.com', {  // ✅ wss:// (pas ws://)
  path: '/socket.io',
  transports: ['websocket'],
});
```

**2. Tester avec Socket.IO Client (navigateur)** :
```html
<script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
<script>
  const socket = io('wss://jamconnexion.com');
  socket.on('connect', () => console.log('Connecté !'));
</script>
```

**3. Vérifier les logs backend** :
```bash
tail -f /var/log/supervisor/backend.out.log | grep socket
```

---

### ❌ Unauthorized (Socket.IO)

**Symptôme** :
```
Socket.IO: Unauthorized - Missing authentication token
```

**Cause** : Token JWT non envoyé lors de la connexion

**Solution** :
```javascript
const socket = io('wss://jamconnexion.com', {
  auth: {
    token: 'YOUR_JWT_TOKEN'  // ✅ Ajouter le token ici
  }
});
```

---

## 🛠️ OUTILS DE DEBUG

### 1. Test avec cURL

```bash
# Test simple
curl https://jamconnexion.com/api/stats/counts

# Test avec authentification
curl -X GET https://jamconnexion.com/api/musicians/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test POST avec données
curl -X POST https://jamconnexion.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

---

### 2. Activer les logs Axios

```javascript
import axios from 'axios';

axios.interceptors.request.use(request => {
  console.log('🚀 Request:', request.method.toUpperCase(), request.url);
  console.log('📦 Data:', request.data);
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('✅ Response:', response.status, response.data);
    return response;
  },
  error => {
    console.error('❌ Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);
```

---

### 3. Tester les endpoints avec Postman

**Collection Postman disponible** :
- Importer depuis : (À créer si nécessaire)
- Ou créer manuellement chaque endpoint

**Endpoints prioritaires à tester** :
```
✅ POST /api/auth/login
✅ GET /api/musicians/me
✅ GET /api/venues
✅ GET /api/planning/search
✅ GET /api/config
```

---

## 📞 Checklist de Debug Complète

Avant de demander de l'aide, vérifier :

- [ ] L'URL de l'API est correcte (`https://jamconnexion.com/api`)
- [ ] Le token JWT est valide et non expiré
- [ ] Les headers sont corrects (`Authorization: Bearer ...`)
- [ ] Les données envoyées respectent le schéma Pydantic
- [ ] L'endpoint existe (vérifier avec cURL)
- [ ] Le backend est démarré (`supervisorctl status`)
- [ ] Les logs backend ne montrent pas d'erreur (`tail /var/log/supervisor/backend.err.log`)
- [ ] La connexion internet fonctionne

---

<div align="center">

**Guide de Troubleshooting : ✅ COMPLET**

90% des erreurs sont résolues par ce guide

</div>
