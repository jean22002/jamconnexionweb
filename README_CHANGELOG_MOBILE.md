# 📝 CHANGELOG API - Jam Connexion Mobile

<div align="center">

**Journal des Modifications Backend/API**

Dernière mise à jour : 31 Mars 2025

</div>

---

## 🎯 Objectif de ce Document

Ce fichier liste **tous les changements API récents** qui impactent le développement mobile :
- Nouveaux endpoints
- Corrections de bugs
- Modifications de schémas
- Breaking changes

---

## 🚀 DERNIÈRES MODIFICATIONS (31 Mars 2025)

### ✅ 1. Fix Build Frontend (Déploiement)

**Problème** : Le déploiement en production échouait à cause d'imports relatifs incorrects

**Fichier corrigé** : `/app/frontend/src/features/venue-dashboard/tabs/BandsTab.jsx`

**Impact Mobile** : ✅ **Aucun** (problème côté Web uniquement)

**Détails** :
```diff
- import { Button } from "../../components/ui/button";
+ import { Button } from "../../../components/ui/button";
```

**Statut** : ✅ **Déployable en production**

---

### ✅ 2. Endpoint Configuration Mobile - `/api/config`

**Nouveau endpoint** : `GET /api/config`

**Objectif** : Servir toutes les clés de configuration au mobile (Firebase, Stripe, WebSocket)

**Utilisation** :
```javascript
const response = await fetch('https://jamconnexion.com/api/config');
const config = await response.json();

console.log(config);
// {
//   "firebase": {
//     "apiKey": "AIzaSy...",
//     "projectId": "jam-connexion",
//     "messagingSenderId": "123456789",
//     "appId": "1:123456789:web:abc123"
//   },
//   "stripe": {
//     "publishable_key": "pk_test_..."
//   },
//   "websocket": {
//     "url": "wss://jamconnexion.com/socket.io"
//   }
// }
```

**Impact Mobile** : 🔥 **CRITIQUE - À intégrer immédiatement**

**Recommandation** :
1. Appeler `/api/config` au lancement de l'app
2. Stocker la config dans le Context ou Redux
3. Utiliser ces valeurs pour Firebase, Stripe, Socket.IO

---

### ✅ 3. Filtres Avancés - Onglet Groupes (Venue Dashboard)

**Fonctionnalité** : L'onglet "Groupes" du Dashboard Établissement a désormais les mêmes filtres que le Dashboard Musicien

**Filtres ajoutés** :
- 🗺️ **Région** (Île-de-France, Bretagne, etc.)
- 📍 **Département** (75, 92, 93, etc.)
- 🎵 **Style musical** (Rock, Jazz, Électro, etc.)

**Endpoints utilisés** :
```bash
GET /api/bands?region=Île-de-France
GET /api/bands?department=75
GET /api/bands?music_style=Rock
```

**Impact Mobile** : ⚠️ **Recommandé** - Les mêmes filtres devraient être disponibles sur mobile

**UI Web modifiée** : `/app/frontend/src/features/venue-dashboard/tabs/BandsTab.jsx`

---

## 🐛 CORRECTIONS DE BUGS (30 Mars 2025)

### ✅ 4. Fix 500 - `GET /api/melomanes/me`

**Problème** : Erreur Pydantic lors de la conversion `datetime` → `string`

**Solution** : Conversion robuste avec gestion des cas edge

**Code corrigé** : `/app/backend/routes/melomanes.py`

**Impact Mobile** : 🔥 **Critique - Bug bloquant résolu**

---

### ✅ 5. Fix 500 - `PUT /api/melomanes/me`

**Problème** : Même erreur de sérialisation

**Solution** : Normalisation des champs obligatoires

**Code corrigé** : `/app/backend/routes/melomanes.py`

**Impact Mobile** : 🔥 **Critique - Bug bloquant résolu**

---

### ✅ 6. Fix 500 - `GET /api/planning/search`

**Problème** : Schéma Pydantic incomplet (`venue_city`, `venue_region`, etc. manquants)

**Solution** : Ajout de tous les champs dans `PlanningSlotResponse`

**Code corrigé** : `/app/backend/models/event.py`

**Schéma complet** :
```python
class PlanningSlotResponse(BaseModel):
    id: str
    venue_id: str
    venue_name: Optional[str] = None
    venue_city: Optional[str] = None
    venue_department: Optional[str] = None
    venue_region: Optional[str] = None
    venue_latitude: Optional[float] = None
    venue_longitude: Optional[float] = None
    event_type: str
    music_style: Optional[str] = None
    start_date: str
    end_date: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    description: Optional[str] = None
    status: str = "open"
    created_at: str
```

**Impact Mobile** : 🔥 **Critique - Bug bloquant résolu**

---

### ✅ 7. Fix 405 - `PUT /api/musicians/me` et `PUT /api/venues/me`

**Problème** : Routes non définies (l'API utilisait `/musicians` et `/venues` sans `/me`)

**Solution** : Ajout des routes alias

**Code corrigé** :
- `/app/backend/routes/musicians.py`
- `/app/backend/routes/venues.py`

**Nouveaux endpoints disponibles** :
```bash
PUT /api/musicians/me  # Alias vers PUT /api/musicians/{musician_id}
PUT /api/venues/me     # Alias vers PUT /api/venues/{venue_id}
```

**Impact Mobile** : 🔥 **Critique - Permet la mise à jour de profil**

---

### ✅ 8. Fix CORS - Domaines Emergent

**Problème** : CORS bloquait les requêtes depuis `preview.emergentagent.com`

**Solution** : Ajout de wildcards dans la config CORS

**Code corrigé** : `/app/backend/server.py`

**Domaines autorisés** :
```python
allowed_origins = [
    "https://jamconnexion.com",
    "https://www.jamconnexion.com",
    "https://*.preview.emergentagent.com",  # 🆕
    "https://preview.emergentagent.com",    # 🆕
]
```

**Impact Mobile** : ⚠️ **Utile pour tests depuis navigateur, pas nécessaire pour React Native**

---

## 📚 ANCIENNES MODIFICATIONS (Mars 2025)

### Phase 2 - Fonctionnalités Temps Réel

✅ **Socket.IO** : Chat en temps réel implémenté
✅ **Firebase Admin** : Push notifications backend configuré
✅ **Stripe Webhooks** : Gestion des événements de paiement

---

### Phase 1 - Corrections Majeures

✅ **Géocodage automatique** : Tous les établissements ont désormais latitude/longitude (via Nominatim)
✅ **Codes d'invitation groupes** : Génération automatique lors de la création
✅ **MongoDB Atlas** : Toutes les routes forcent l'utilisation de la DB de production
✅ **Page de vérification email** : `/verify-email` ajoutée côté frontend web

---

## 🚨 BREAKING CHANGES

Aucun breaking change récent. Tous les endpoints existants restent compatibles.

---

## 📝 Prochaines Évolutions Prévues

### En Attente
- ⏳ Seuils de modération configurables (P2)
- ⏳ Notifications WebSocket en temps réel (P2)

---

## 📞 Questions ?

Pour toute question sur un changement spécifique :
1. Consulter les README correspondants (voir `INDEX_MOBILE.md`)
2. Vérifier les logs backend : `/var/log/supervisor/backend.err.log`
3. Tester les endpoints avec `curl` ou Postman

---

<div align="center">

**Changelog à jour : ✅**

Dernière modification API : 31 Mars 2025 (Fix build frontend)

</div>
