# 🚀 Jam Connexion Mobile - Quick Start Guide pour Mobile Agent

**Date** : 28 Mars 2026
**Préparé par** : E1 (Web Agent)

---

## 📦 FICHIERS FOURNIS

Tous les documents sont dans `/app/memory/` :

1. **API_DOCUMENTATION.md** 📡
   - Liste complète de tous les endpoints
   - Exemples de requêtes/réponses
   - Codes d'erreur

2. **MOBILE_PRD.md** 📖
   - Product Requirements Document complet
   - User flows détaillés
   - Features par profil (musicien, mélomane, établissement)
   - MVP vs Future features

3. **DESIGN_SYSTEM.md** 🎨
   - Palette de couleurs
   - Typographie
   - Composants UI
   - Theme complet React Native

4. **DATA_MODELS.md** 📊
   - Schémas MongoDB
   - Relations entre entités
   - Exemples de données

5. **test_credentials.md** 🔑
   - Credentials de test pour tous les profils

---

## 🎯 RÉSUMÉ ULTRA-RAPIDE

### C'est quoi Jam Connexion ?
**Un réseau social musical** qui connecte :
- 🎸 **Musiciens** → Cherchent des concerts
- 🎭 **Mélomanes** → Découvrent des événements
- 🏢 **Établissements** → Trouvent des artistes

### Stack Technique
- **Frontend Mobile** : React Native (Expo) - **À CRÉER**
- **Backend** : FastAPI (Python) - **DÉJÀ FAIT** ✅
- **Database** : MongoDB Atlas - **DÉJÀ FAIT** ✅
- **Maps** : React Native Maps
- **Notifications** : Firebase Cloud Messaging

### URLs
- **API Production** : `https://jamconnexion.com/api`
- **API Preview** : `https://collapsible-map.preview.emergentagent.com/api`

---

## 🚀 MVP - PHASE 1 (Priorité Absolue)

### Features Must-Have

#### 1. Authentification ✅
- Inscription (email + password)
- Connexion
- Choix du profil (musicien/mélomane/établissement)
- Persistance session

#### 2. Profils ✅
- Profil musicien : pseudo, bio, ville, instruments, styles
- Profil mélomane : pseudo, bio, ville, styles favoris
- Profil établissement : nom, adresse, GPS, styles, photos
- Upload photo de profil

#### 3. Carte Interactive ✅
- React Native Maps
- Markers des établissements
- Clustering (grouper les marqueurs proches)
- Géolocalisation utilisateur
- Clic sur marker → Détails établissement

#### 4. Établissements ✅
- Liste/grille avec filtres
- Filtres : Région, Département
- Détails établissement
- Photos

#### 5. Musicien - Candidatures ✅
- Voir créneaux disponibles
- Postuler à un créneau
- Liste de mes candidatures (statut)

#### 6. Établissement - Planning ✅
- Créer un créneau
- Voir les candidatures
- Accepter/refuser

#### 7. Mélomane - Connexions ✅
- Se connecter à un établissement
- Liste de mes connexions

---

## 📱 DASHBOARDS PAR PROFIL

### Musicien : 5 Tabs
1. **Accueil** : Overview
2. **Établissements** : Liste + filtres
3. **Carte** : Map interactive
4. **Candidatures** : Mes candidatures
5. **Paramètres** : Profil

### Mélomane : 4 Tabs
1. **Établissements** : Liste + filtres
2. **Carte** : Map interactive
3. **Connexions** : Mes établissements suivis
4. **Paramètres** : Profil

### Établissement : 4 Tabs
1. **Vue d'ensemble** : Stats
2. **Planning** : Créneaux
3. **Candidatures** : Liste des candidatures
4. **Paramètres** : Profil

---

## 🎨 DESIGN QUICK REF

### Couleurs Principales
```javascript
primary: '#9333ea',      // Purple
secondary: '#ec4899',    // Pink
accent: '#06b6d4',       // Cyan
background: '#0a0a0a',   // Dark
surface: '#1a1a1a',      // Card background
```

### Gradients
```javascript
['#9333ea', '#ec4899']   // Primary gradient (purple to pink)
```

### Fonts
- Headings : **Poppins Bold**
- Body : **Inter Regular**

---

## 🔌 API ENDPOINTS ESSENTIELS

### Auth
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur

### Profils
- `GET /api/musicians/me` - Profil musicien
- `PUT /api/musicians/me` - MAJ profil musicien
- `GET /api/melomanes/me` - Profil mélomane
- `GET /api/venues/my` - Profil établissement

### Établissements
- `GET /api/venues` - Liste établissements
- `GET /api/venues/{id}` - Détails établissement

### Candidatures
- `GET /api/planning/available` - Créneaux disponibles
- `POST /api/applications` - Postuler
- `GET /api/applications/my` - Mes candidatures

### Connexions
- `POST /api/subscribe/{venue_id}` - Se connecter
- `DELETE /api/unsubscribe/{venue_id}` - Se déconnecter
- `GET /api/my-subscriptions` - Mes connexions

**Tous les détails** → `/app/memory/API_DOCUMENTATION.md`

---

## 🔑 CREDENTIALS DE TEST

**Disponibles dans** : `/app/memory/test_credentials.md`

Quick access :
- **Musicien** : test@gmail.com / test
- **Mélomane** : melomane@test.com / test
- **Établissement** : bar@gmail.com / (mot de passe requis en prod)

---

## 📂 STRUCTURE SUGGÉRÉE

```
/JamConnexionMobile
  /src
    /navigation
      - RootNavigator.tsx
      - AuthNavigator.tsx
      - MusicianTabNavigator.tsx
      - MelomaneTabNavigator.tsx
      - VenueTabNavigator.tsx
    /screens
      /auth
        - LoginScreen.tsx
        - RegisterScreen.tsx
      /musician
        - DashboardScreen.tsx
        - VenuesScreen.tsx
        - MapScreen.tsx
        - ApplicationsScreen.tsx
      /melomane
        - DashboardScreen.tsx
        - MapScreen.tsx
        - ConnectionsScreen.tsx
      /venue
        - DashboardScreen.tsx
        - PlanningScreen.tsx
        - ApplicationsScreen.tsx
    /components
      - VenueCard.tsx
      - MapMarker.tsx
      - FilterChip.tsx
    /services
      - api.ts (Axios client)
      - auth.ts
      - storage.ts (AsyncStorage)
    /utils
      - theme.ts (Design System)
      - constants.ts
    /hooks
      - useAuth.ts
      - useVenues.ts
```

---

## ⚡ QUICK WINS

### 1. Theme Setup (5 min)
Copier le Design System dans `src/utils/theme.ts`

### 2. API Client (10 min)
```typescript
import axios from 'axios';

const API_URL = 'https://collapsible-map.preview.emergentagent.com/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 3. Auth Context (15 min)
State global pour gérer l'authentification

### 4. Map Integration (20 min)
React Native Maps avec markers custom

---

## 🎯 WORKFLOW RECOMMANDÉ

### Week 1 : Setup & Auth
- [ ] Expo init
- [ ] Navigation setup
- [ ] Theme setup
- [ ] Auth screens (Login, Register)
- [ ] API client + Auth logic

### Week 2 : Profils & Dashboards
- [ ] Dashboard screens (musicien, mélomane, établissement)
- [ ] Profil screens
- [ ] Bottom tab navigation

### Week 3 : Features Core
- [ ] Carte interactive
- [ ] Liste établissements + filtres
- [ ] Détails établissement

### Week 4 : Candidatures & Polish
- [ ] Système de candidatures (musicien)
- [ ] Planning (établissement)
- [ ] Connexions (mélomane)
- [ ] Bug fixes + polish

---

## ⚠️ POINTS D'ATTENTION

### iOS
- Permissions : Location, Camera
- Apple Developer Account requis (99€/an)
- Build avec Xcode

### Android
- Permissions : Location, Camera
- Google Play Developer Account (25€ one-time)
- Build avec Android Studio

### Performance
- Optimiser images (compression)
- Lazy loading des listes
- Cache avec AsyncStorage

---

## 🆘 SUPPORT

### Documentation Complète
- **PRD** : `/app/memory/MOBILE_PRD.md` (40+ pages)
- **API** : `/app/memory/API_DOCUMENTATION.md`
- **Design** : `/app/memory/DESIGN_SYSTEM.md`
- **Data** : `/app/memory/DATA_MODELS.md`

### Backend Contact
Si besoin de modifier le backend, contacter **E1 (Web Agent)** via Emergent

### Questions Fréquentes

**Q: Le backend est prêt ?**
A: Oui ! 100% fonctionnel. API complète disponible.

**Q: La base de données est prête ?**
A: Oui ! MongoDB Atlas en production avec données de test.

**Q: Dois-je tout recoder le frontend ?**
A: Oui, le mobile est une nouvelle app React Native. Mais la logique backend est réutilisée.

**Q: Combien de temps pour le MVP ?**
A: 2-4 semaines pour un développeur React Native expérimenté.

---

## ✅ CHECKLIST AVANT DE COMMENCER

- [ ] Lu le PRD complet (`MOBILE_PRD.md`)
- [ ] Parcouru la doc API (`API_DOCUMENTATION.md`)
- [ ] Compris le Design System (`DESIGN_SYSTEM.md`)
- [ ] Testé l'API avec les credentials de test
- [ ] Installé Expo CLI
- [ ] Compte Apple Developer (pour iOS)
- [ ] Compte Google Play Developer (pour Android)
- [ ] Firebase projet créé (pour notifications)

---

## 🚀 PRÊT À DÉMARRER !

**Commande pour créer le projet** :
```bash
npx create-expo-app JamConnexionMobile --template blank-typescript
cd JamConnexionMobile
```

**Installer les dépendances essentielles** :
```bash
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install react-native-maps axios @react-native-async-storage/async-storage
npm install react-native-vector-icons
```

---

**Bon développement !** 🎉

**Contact E1 (Web Agent)** si questions sur le backend ou l'API.

---

**Préparé le** : 28 Mars 2026
**Par** : E1 Agent (Emergent)
**Pour** : Mobile Agent
