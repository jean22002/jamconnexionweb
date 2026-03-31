# 📱 MESSAGE POUR L'AGENT MOBILE - Corrections API Jam Connexion

## ✅ CORRECTIONS APPORTÉES

Tous les bugs signalés ont été corrigés et l'API est maintenant prête pour l'intégration mobile.

---

## 🐛 BUGS CORRIGÉS

### 1. ✅ GET /api/melomanes/me (était : 500) → **CORRIGÉ**
**Problème** : Erreur Pydantic lors de la conversion `datetime` → `string`  
**Solution** : Conversion robuste avec gestion des cas edge + valeurs par défaut

### 2. ✅ PUT /api/melomanes/me (était : 500) → **CORRIGÉ**
**Problème** : Même erreur de sérialisation  
**Solution** : Conversion + normalisation des champs obligatoires

### 3. ✅ GET /api/planning/search (était : 500) → **CORRIGÉ**
**Problème** : Schéma Pydantic incomplet (champs `venue_city`, `venue_region`, etc. manquants)  
**Solution** : Ajout de tous les champs dans `PlanningSlotResponse`

### 4. ✅ PUT /musicians/me et PUT /venues/me (était : 405) → **CORRIGÉ**
**Problème** : Routes non définies (l'API utilisait `/musicians` et `/venues` sans `/me`)  
**Solution** : Ajout des routes alias `PUT /musicians/me` et `PUT /venues/me`

---

## ⚙️ CONFIGURATION AJOUTÉE

### 5. ✅ CORS pour Emergent Agent
**Domaines autorisés** :
- `https://*.preview.emergentagent.com` ✅
- `https://preview.emergentagent.com` ✅

Vous pouvez maintenant tester l'API depuis votre environnement de développement Emergent.

---

### 6. ✅ Firebase - Fichiers & Documentation

**Fichiers créés** :
- `/app/firebase-credentials.json.template` (template pour le backend)
- `/app/FIREBASE_MOBILE_SETUP.md` (guide complet d'intégration)

**Ce que vous devez faire** :
1. Créer un projet Firebase ([console.firebase.google.com](https://console.firebase.google.com/))
2. Télécharger `google-services.json` (Android)
3. Télécharger `GoogleService-Info.plist` (iOS)
4. Placer les fichiers dans votre projet React Native :
   - `android/app/google-services.json`
   - `ios/GoogleService-Info.plist`

**Installation packages** :
```bash
yarn add @react-native-firebase/app @react-native-firebase/messaging
```

📖 **Consultez** `FIREBASE_MOBILE_SETUP.md` pour le guide complet (code inclus).

---

### 7. ✅ WebSocket/Chat - Déjà implémenté

**URL WebSocket** : `wss://jamconnexion.com/socket.io`

**Installation** :
```bash
yarn add socket.io-client
```

**Utilisation** :
```javascript
import io from 'socket.io-client';

const socket = io('https://jamconnexion.com', {
  path: '/socket.io',
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('✅ Connecté au chat en temps réel');
  
  // Authentification
  socket.emit('authenticate', { token: yourAuthToken });
});

socket.on('message', (data) => {
  console.log('Nouveau message:', data);
});
```

📖 **Documentation complète** : `README_CHAT.md`

---

### 8. ✅ Configuration centralisée - Nouvel endpoint

**Nouveau** : `GET /api/config`

Cet endpoint retourne **toutes les configurations** nécessaires pour l'app mobile :

**Requête** :
```bash
GET https://jamconnexion.com/api/config
```

**Réponse** :
```json
{
  "api_base_url": "https://jamconnexion.com",
  "websocket_url": "wss://jamconnexion.com/socket.io",
  "stripe": {
    "publishable_key": "pk_live_XXXXXXXXXXXXXXXXX",
    "subscription_price": 12.99,
    "currency": "eur"
  },
  "firebase": {
    "enabled": true,
    "message": "Firebase Cloud Messaging is enabled for push notifications"
  },
  "version": "2.0.0",
  "features": {
    "chat": true,
    "push_notifications": true,
    "payments": true,
    "real_time_updates": true
  }
}
```

**Utilisation dans React Native** :
```javascript
const [config, setConfig] = useState(null);

useEffect(() => {
  axios.get('https://jamconnexion.com/api/config')
    .then(response => {
      setConfig(response.data);
      
      // Utiliser la clé Stripe
      const stripeKey = response.data.stripe.publishable_key;
      
      // Utiliser l'URL WebSocket
      const wsUrl = response.data.websocket_url;
    });
}, []);
```

---

## 🎯 ENDPOINTS CORRIGÉS - À UTILISER

### ✅ Profil Mélomane
```bash
# Récupérer le profil
GET /api/melomanes/me
Authorization: Bearer {token}

# Mettre à jour le profil
PUT /api/melomanes/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "pseudo": "MusicLover",
  "bio": "Passionné de jazz",
  "city": "Lyon",
  "region": "Auvergne-Rhône-Alpes",
  "postal_code": "69001",
  "favorite_styles": ["Jazz", "Blues"],
  "profile_picture": "/api/uploads/melomanes/abc123.jpg",
  "notifications_enabled": true,
  "notification_radius_km": 50
}
```

### ✅ Profil Musicien
```bash
# Les deux routes fonctionnent maintenant :
PUT /api/musicians/me      ✅ NOUVEAU (mobile-friendly)
PUT /api/musicians         ✅ Existant (backward compatible)
```

### ✅ Profil Établissement
```bash
# Les deux routes fonctionnent maintenant :
PUT /api/venues/me         ✅ NOUVEAU (mobile-friendly)
PUT /api/venues            ✅ Existant (backward compatible)
```

### ✅ Planning/Recherche
```bash
GET /api/planning/search?date_from=2026-04-01&region=Auvergne-Rhône-Alpes&music_style=Jazz

# Réponse avec tous les champs :
[
  {
    "id": "slot_123",
    "venue_id": "venue_456",
    "venue_name": "Le Jazz Club",
    "venue_city": "Lyon",           # ← NOUVEAU
    "venue_region": "Auvergne-Rhône-Alpes",  # ← NOUVEAU
    "venue_department": "Rhône",    # ← NOUVEAU
    "date": "2026-04-15",
    "time": "20:00",
    "title": "Soirée Jazz",
    "music_styles": ["Jazz", "Blues"],
    "applications_count": 3,
    "accepted_bands_count": 1,      # ← NOUVEAU
    "is_open": true,                # ← NOUVEAU
    ...
  }
]
```

---

## 📚 DOCUMENTATION COMPLÈTE

Tous les README sont disponibles dans `/app/` :

| Fichier | Contenu |
|---------|---------|
| `README_FIREBASE_PUSH.md` | API Push Notifications (backend) |
| `FIREBASE_MOBILE_SETUP.md` | Guide complet Firebase mobile |
| `README_CHAT.md` | Chat temps réel (Socket.IO) |
| `README_UPLOADS.md` | Upload d'images |
| `README_PROFILE_MUSICIAN.md` | Profil Musicien (tous les champs) |
| `README_PROFILE_VENUE.md` | Profil Établissement |
| `README_PROFILE_MELOMANE.md` | Profil Mélomane |
| `README_SAVE_MECHANISM.md` | Mécanisme de sauvegarde |
| `INDEX_MOBILE.md` | Index de toute la documentation |

---

## 🧪 TESTS RECOMMANDÉS

### 1. Test des endpoints corrigés

```bash
# Login
TOKEN=$(curl -X POST https://jamconnexion.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"test"}' \
  | jq -r '.token')

# Test GET /melomanes/me
curl -X GET https://jamconnexion.com/api/melomanes/me \
  -H "Authorization: Bearer $TOKEN"

# Test PUT /melomanes/me
curl -X PUT https://jamconnexion.com/api/melomanes/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pseudo":"TestUser","city":"Paris"}'

# Test planning/search
curl -X GET "https://jamconnexion.com/api/planning/search?is_open=true"

# Test config
curl -X GET https://jamconnexion.com/api/config
```

### 2. Test CORS depuis Emergent

Vérifiez que vos requêtes depuis `*.preview.emergentagent.com` passent sans erreur CORS.

---

## ⚡ PROCHAINES ÉTAPES

1. ✅ **Tester** tous les endpoints corrigés
2. ✅ **Configurer Firebase** (suivre `FIREBASE_MOBILE_SETUP.md`)
3. ✅ **Récupérer** la clé Stripe via `GET /api/config`
4. ✅ **Intégrer** Socket.IO pour le chat (suivre `README_CHAT.md`)
5. ✅ **Implémenter** les profils (suivre les README correspondants)

---

## 🆘 SUPPORT

Si vous rencontrez des problèmes :

1. **Erreur 500** : Vérifiez les logs backend (`/var/log/supervisor/backend.err.log`)
2. **Erreur CORS** : Vérifiez l'origine de votre requête (doit être `*.preview.emergentagent.com`)
3. **Erreur Firebase** : Vérifiez que les fichiers sont bien placés
4. **Erreur Stripe** : Utilisez `GET /api/config` pour récupérer la bonne clé

**Backend en production** : https://jamconnexion.com  
**Version API** : 2.0.0

---

**Date de mise à jour** : 2026-03-31  
**Status** : ✅ Tous les bugs corrigés, API prête pour l'intégration mobile
