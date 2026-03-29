# 📱 Jam Connexion Mobile

<div align="center">

![Jam Connexion](https://img.shields.io/badge/Jam-Connexion-D946EF?style=for-the-badge&logo=music&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Status](https://img.shields.io/badge/Status-En_Développement-orange?style=for-the-badge)

**Plateforme de mise en relation entre musiciens et établissements**

[Site Web](https://jamconnexion.com) • [Documentation API](#api-endpoints) • [Design System](#design-system)

</div>

---

## 📋 Table des Matières

- [À Propos](#-à-propos)
- [Fonctionnalités](#-fonctionnalités)
- [Stack Technique](#-stack-technique)
- [Design System](#-design-system)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Architecture](#-architecture)
- [API Endpoints](#-api-endpoints)
- [Exemples de Code](#-exemples-de-code)
- [Roadmap](#-roadmap)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 À Propos

**Jam Connexion** est une plateforme mobile qui connecte les musiciens avec les établissements (bars, cafés, salles de concert) pour faciliter l'organisation de concerts, jam sessions, karaokés et spectacles.

### Objectifs du Projet

- 🎸 Permettre aux **musiciens** de trouver des lieux pour jouer
- 🎤 Permettre aux **établissements** d'organiser des événements musicaux
- 🎵 Permettre aux **mélomanes** de découvrir des concerts locaux
- 🗺️ Géolocaliser les opportunités musicales sur une carte interactive

### Rôles Utilisateurs

| Rôle | Description | Fonctionnalités Principales |
|------|-------------|------------------------------|
| 🎸 **Musicien** | Artiste solo ou groupe | Carte, Planning, Candidatures, Groupes |
| 🎤 **Établissement** | Bar, café, salle de concert | Gestion événements, Candidatures, Planning |
| 🎵 **Mélomane** | Amateur de musique live | Découverte, Participations, Favoris |

---

## ✨ Fonctionnalités

### 🎸 Pour les Musiciens

- ✅ **Carte Interactive** : Trouver des établissements près de chez soi
- ✅ **Filtres Avancés** : Recherche par styles musicaux, ville, rayon
- ✅ **Planning Personnel** : Gérer ses disponibilités et événements
- ✅ **Candidatures** : Postuler aux événements des établissements
- ✅ **Gestion de Groupes** : Créer/rejoindre des groupes avec code d'invitation
- ✅ **Profil Complet** : Styles, instruments, photos, réseaux sociaux
- 🔜 **Comptabilité** : Suivi des revenus (PRO)
- 🔜 **Analytics** : Statistiques de visibilité (PRO)

### 🎤 Pour les Établissements

- ✅ **Création d'Événements** : Jams, Concerts, Karaokés, Spectacles
- ✅ **Gestion du Planning** : Calendrier centralisé
- ✅ **Invitations** : Envoyer des candidatures aux musiciens
- ✅ **Suivi des Abonnés** : Gérer sa communauté (Jacks)
- ✅ **Galerie Photos** : Présenter son établissement
- 🔜 **Avis & Reviews** : Recevoir des évaluations
- 🔜 **Comptabilité GUSO** : Gestion administrative

### 🎵 Pour les Mélomanes

- ✅ **Découverte** : Explorer les établissements sur une carte
- ✅ **Participations** : S'inscrire aux événements publics
- ✅ **Favoris** : Suivre ses établissements préférés
- 🔜 **Notifications** : Être alerté des nouveaux événements

---

## 🛠️ Stack Technique

### Frontend Mobile

```javascript
{
  "framework": "React Native (0.72+)",
  "navigation": "@react-navigation 6.x",
  "state": "Context API + React Hooks",
  "http": "Axios",
  "maps": "react-native-maps",
  "ui": "React Native Elements + Custom Components",
  "animations": "react-native-reanimated",
  "storage": "@react-native-async-storage"
}
```

### Backend (Existant)

```python
{
  "framework": "FastAPI (Python)",
  "database": "MongoDB Atlas",
  "auth": "JWT Bearer Token",
  "email": "Resend",
  "payments": "Stripe",
  "cdn": "Cloudflare"
}
```

### Services Tiers

- **API Backend** : `https://jamconnexion.com/api`
- **Géolocalisation** : Google Maps API / Apple Maps
- **Notifications** : Firebase Cloud Messaging
- **Stockage Images** : Backend upload + CDN

---

## 🎨 Design System

### Palette de Couleurs

```javascript
export const COLORS = {
  // Fond & Texte
  background: '#0A0A12',      // Noir bleuté
  foreground: '#F8FAFC',      // Blanc cassé
  
  // Couleurs Principales
  primary: '#D946EF',         // Magenta (Logo, Boutons CTA)
  secondary: '#17D9D9',       // Cyan (Accents)
  
  // UI Elements
  card: '#13131A',            // Fond des cartes
  muted: '#1F1F29',           // Désactivé
  mutedForeground: '#9CA3AF', // Texte secondaire
  border: '#2A2A38',          // Bordures
  
  // Feedback
  destructive: '#F25555',     // Erreurs
  success: '#10B981',         // Succès
  warning: '#F59E0B',         // Alertes
  
  // Gradients
  gradientPurple: ['#D946EF', '#EC4899'],  // Magenta → Rose
  gradientCyan: ['#06B6D4', '#14B8A6'],    // Cyan → Teal
  gradientOrange: ['#F97316', '#F59E0B'],  // Orange → Ambre
};
```

### Typographie

**Polices** : [Google Fonts](https://fonts.google.com/)

```javascript
export const FONTS = {
  heading: 'Unbounded',  // Titres, Logo, Boutons
  body: 'Manrope',       // Texte courant
  mono: 'JetBrains Mono' // Code, données techniques
};

export const FONT_SIZES = {
  xs: 12, sm: 14, base: 16, lg: 18, xl: 20,
  '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48
};
```

### Effets Visuels

**Glassmorphism** : Effet de verre translucide

```jsx
import { BlurView } from 'expo-blur';

<BlurView 
  intensity={80} 
  tint="dark"
  style={styles.glassCard}
/>
```

**Text Gradient** : Dégradés de texte

```jsx
<MaskedView maskElement={<Text>Jam Connexion</Text>}>
  <LinearGradient colors={['#D946EF', '#17D9D9']}>
    <Text style={{ opacity: 0 }}>Jam Connexion</Text>
  </LinearGradient>
</MaskedView>
```

**Neon Glow** : Ombres lumineuses

```javascript
shadowColor: '#D946EF',
shadowOffset: { width: 0, height: 0 },
shadowOpacity: 0.5,
shadowRadius: 20,
elevation: 10
```

---

## 📦 Installation

### Prérequis

- Node.js 18+
- npm ou yarn
- React Native CLI ou Expo CLI
- Xcode (iOS) / Android Studio (Android)
- CocoaPods (iOS)

### Étapes d'Installation

```bash
# 1. Cloner le repository
git clone https://github.com/votre-repo/jam-connexion-mobile.git
cd jam-connexion-mobile

# 2. Installer les dépendances
npm install
# ou
yarn install

# 3. Installer les pods iOS (macOS uniquement)
cd ios && pod install && cd ..

# 4. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# 5. Lancer l'application
# iOS
npm run ios
# ou
yarn ios

# Android
npm run android
# ou
yarn android
```

### Dépendances Principales

```bash
# Navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs @react-navigation/material-top-tabs

# UI & Design
npm install react-native-elements react-native-vector-icons
npm install expo-blur expo-linear-gradient
npm install @expo-google-fonts/unbounded @expo-google-fonts/manrope

# Maps & Géolocalisation
npm install react-native-maps react-native-map-clustering
npm install @react-native-community/geolocation

# Formulaires & Date
npm install react-native-calendars
npm install @react-native-community/datetimepicker
npm install react-native-multiple-select

# Images
npm install react-native-image-crop-picker
npm install react-native-fast-image

# API & Storage
npm install axios
npm install @react-native-async-storage/async-storage

# Notifications & Feedback
npm install react-native-toast-message
npm install @react-native-firebase/app @react-native-firebase/messaging
```

---

## ⚙️ Configuration

### Fichier `.env`

```env
# API Backend
API_BASE_URL=https://jamconnexion.com/api
WEB_URL=https://jamconnexion.com

# App Info
APP_NAME=Jam Connexion
APP_VERSION=1.0.0

# Maps (optionnel si API key nécessaire)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Firebase (Phase 2)
FIREBASE_PROJECT_ID=your_firebase_project_id
```

### Configuration API (`config.js`)

```javascript
export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'https://jamconnexion.com/api',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'JamConnexionMobile/1.0'
  },
  WITH_CREDENTIALS: true
};

export const APP_CONFIG = {
  APP_NAME: 'Jam Connexion',
  WEB_URL: 'https://jamconnexion.com',
  DEFAULT_LOCATION: {
    latitude: 46.603354,
    longitude: 1.888334,
    latitudeDelta: 5,
    longitudeDelta: 5
  }
};
```

### Client Axios (`services/api.js`)

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
  withCredentials: API_CONFIG.WITH_CREDENTIALS
});

// Intercepteur Request : Ajouter JWT
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur Response : Gérer erreurs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    
    // Token expiré
    if (status === 401) {
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('user');
      // Rediriger vers Auth
    }
    
    // Rate Limiting (Cloudflare)
    if (status === 429) {
      console.warn('Rate limit atteint. Attendre...');
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🏗️ Architecture

### Structure des Dossiers

```
/JamConnexionMobile
├── src/
│   ├── navigation/
│   │   ├── AuthNavigator.js
│   │   ├── MusicianNavigator.js
│   │   ├── VenueNavigator.js
│   │   └── MelomaneNavigator.js
│   │
│   ├── screens/
│   │   ├── Auth/
│   │   │   ├── LoginScreen.js
│   │   │   └── RegisterScreen.js
│   │   ├── Musician/
│   │   │   ├── MapTabScreen.js
│   │   │   ├── PlanningTabScreen.js
│   │   │   ├── CandidaturesTabScreen.js
│   │   │   └── ProfileEditScreen.js
│   │   ├── Venue/
│   │   │   ├── ProfileTabScreen.js
│   │   │   ├── JamsTabScreen.js
│   │   │   └── ConcertsTabScreen.js
│   │   └── Melomane/
│   │       └── MapTabScreen.js
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── GlassCard.js
│   │   │   ├── GradientButton.js
│   │   │   ├── GradientText.js
│   │   │   ├── Avatar.js
│   │   │   └── Badge.js
│   │   ├── Map/
│   │   │   ├── VenueMap.js
│   │   │   └── CustomMarker.js
│   │   └── Forms/
│   │       ├── EventForm.js
│   │       └── ProfileForm.js
│   │
│   ├── context/
│   │   ├── AuthContext.js
│   │   └── BadgeContext.js
│   │
│   ├── hooks/
│   │   ├── useNotifications.js
│   │   ├── useGeolocation.js
│   │   └── useBadges.js
│   │
│   ├── services/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── venues.js
│   │   ├── events.js
│   │   └── storage.js
│   │
│   ├── utils/
│   │   ├── colors.js
│   │   ├── fonts.js
│   │   ├── styles.js
│   │   └── validators.js
│   │
│   └── assets/
│       ├── images/
│       └── icons/
│
├── App.js
├── config.js
├── .env
├── package.json
└── README.md
```

### Navigation

```
Landing → Auth → Dashboard (selon rôle)
                    │
        ├───────────┼───────────┐
        ↓           ↓           ↓
   Musicien     Établissement  Mélomane
   (12 tabs)    (15 tabs)      (5 tabs)
```

---

## 🔌 API Endpoints

### Authentification

| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| POST | `/api/auth/login` | Connexion | `{email, password}` |
| POST | `/api/auth/register` | Inscription | `{email, password, name, role}` |
| POST | `/api/auth/verify-email` | Vérifier email | `{token}` |

### Profils

| Méthode | Endpoint | Description | Headers |
|---------|----------|-------------|---------|
| GET | `/api/musicians/me` | Profil musicien | Bearer Token |
| PUT | `/api/musicians/me` | Modifier profil musicien | Bearer Token |
| GET | `/api/venues/me` | Profil établissement | Bearer Token |
| PUT | `/api/venues/me` | Modifier profil établissement | Bearer Token |
| GET | `/api/musician/:id` | Détail musicien public | - |
| GET | `/api/venue/:id` | Détail établissement public | - |

### Établissements & Carte

| Méthode | Endpoint | Description | Query Params |
|---------|----------|-------------|--------------|
| GET | `/api/venues` | Liste établissements | `?city=...&styles=...` |
| GET | `/api/venues/nearby` | Établissements à proximité | `?lat=...&lng=...&radius=...` |

### Événements

| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| GET | `/api/planning/search` | Événements disponibles | Query params |
| POST | `/api/events` | Créer événement (venue) | `{type, date, ...}` |
| PUT | `/api/events/:id` | Modifier événement | `{...}` |
| DELETE | `/api/events/:id` | Supprimer événement | - |
| POST | `/api/events/:id/join` | Rejoindre événement | - |
| DELETE | `/api/events/:id/leave` | Annuler participation | - |

### Candidatures

| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| POST | `/api/applications` | Envoyer candidature | `{venue_id, message, ...}` |
| GET | `/api/applications/sent` | Mes candidatures envoyées | - |
| GET | `/api/applications/received` | Candidatures reçues | - |
| PUT | `/api/applications/:id` | Accepter/Refuser | `{status: "accepted"}` |

### Groupes

| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| POST | `/api/bands` | Créer groupe | `{name, type, styles, ...}` |
| POST | `/api/bands/join` | Rejoindre avec code | `{code: "ABC123"}` |
| GET | `/api/bands/my` | Mes groupes | - |
| GET | `/api/bands/:id` | Détail groupe | - |

### Upload

| Méthode | Endpoint | Description | Content-Type |
|---------|----------|-------------|--------------|
| POST | `/api/upload/musician-photo` | Upload avatar musicien | multipart/form-data |
| POST | `/api/upload/venue-photo` | Upload avatar établissement | multipart/form-data |

### Statistiques

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/stats/counts` | Stats globales (musiciens, établissements) |

---

## 💻 Exemples de Code

### Authentification

```javascript
// services/auth.js
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { token, user } = response.data;
  
  await AsyncStorage.setItem('jwt_token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
  
  return user;
};

export const register = async (email, password, name, role) => {
  const response = await api.post('/auth/register', {
    email, password, name, role
  });
  const { token, user } = response.data;
  
  await AsyncStorage.setItem('jwt_token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
  
  return user;
};

export const logout = async () => {
  await AsyncStorage.removeItem('jwt_token');
  await AsyncStorage.removeItem('user');
};
```

### Carte Interactive

```javascript
// screens/Musician/MapTabScreen.js
import MapView, { Marker } from 'react-native-maps';
import MapViewClustering from 'react-native-map-clustering';

const MapTabScreen = () => {
  const [venues, setVenues] = useState([]);
  const [userPosition, setUserPosition] = useState(null);
  
  useEffect(() => {
    fetchVenues();
    getCurrentPosition();
  }, []);
  
  const fetchVenues = async () => {
    const response = await api.get('/venues');
    setVenues(response.data);
  };
  
  return (
    <MapViewClustering
      initialRegion={{
        latitude: 48.8566,
        longitude: 2.3522,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5
      }}
      clusterColor="#D946EF"
    >
      {venues.map(venue => (
        <Marker
          key={venue.id}
          coordinate={{
            latitude: venue.latitude,
            longitude: venue.longitude
          }}
          onPress={() => navigation.navigate('VenueDetail', { id: venue.id })}
        >
          <View style={styles.marker}>
            <Text>🎸</Text>
          </View>
        </Marker>
      ))}
    </MapViewClustering>
  );
};
```

### Upload d'Image

```javascript
// services/upload.js
import ImagePicker from 'react-native-image-crop-picker';
import api from './api';

export const uploadMusicianPhoto = async () => {
  const image = await ImagePicker.openPicker({
    width: 400,
    height: 400,
    cropping: true,
    cropperCircleOverlay: true,
    compressImageQuality: 0.8
  });
  
  const formData = new FormData();
  formData.append('file', {
    uri: image.path,
    type: image.mime,
    name: `photo_${Date.now()}.jpg`
  });
  
  const response = await api.post('/upload/musician-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  return response.data.url;
};
```

---

## 🗺️ Roadmap

### Phase 1 : MVP (En cours)
- [x] Authentification (Login/Register)
- [x] Dashboard Musicien (tabs principaux)
- [x] Dashboard Établissement (tabs principaux)
- [x] Dashboard Mélomane
- [x] Carte interactive avec filtres
- [x] Gestion de profil
- [ ] Système de candidatures
- [ ] Création/gestion d'événements
- [ ] Gestion de groupes

### Phase 2 : Fonctionnalités Avancées
- [ ] Notifications Push (Firebase)
- [ ] Messagerie temps réel
- [ ] Système de badges & gamification
- [ ] Leaderboard
- [ ] Comptabilité (musiciens PRO)
- [ ] Analytics (établissements)
- [ ] Galerie photos

### Phase 3 : Optimisations
- [ ] Mode hors-ligne (cache)
- [ ] Deep Linking (partage de profils)
- [ ] Onboarding amélioré
- [ ] Performance optimisations
- [ ] Tests E2E (Detox)
- [ ] CI/CD (GitHub Actions)

---

## 🐛 Troubleshooting

### Problèmes Courants

#### 1. Erreur 401 (Unauthorized)

**Cause** : Token JWT expiré ou invalide

**Solution** :
```javascript
// Vérifier si le token existe
const token = await AsyncStorage.getItem('jwt_token');
if (!token) {
  navigation.navigate('Auth');
}

// Si erreur 401, forcer logout
if (error.response?.status === 401) {
  await logout();
  navigation.navigate('Auth');
}
```

#### 2. Erreur 429 (Too Many Requests)

**Cause** : Rate limiting Cloudflare (>100 req/min)

**Solution** :
```javascript
// Implémenter debounce
import { debounce } from 'lodash';

const searchVenues = debounce(async (query) => {
  const response = await api.get(`/venues?search=${query}`);
  setVenues(response.data);
}, 300);

// Ajouter retry avec délai
if (error.response?.status === 429) {
  setTimeout(() => retry(), 5000);
}
```

#### 3. Carte ne s'affiche pas

**Cause** : Permissions géolocalisation manquantes

**Solution iOS (`Info.plist`)** :
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Nous avons besoin de votre position pour afficher les établissements à proximité</string>
```

**Solution Android (`AndroidManifest.xml`)** :
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

#### 4. Images ne chargent pas

**Cause** : CORS ou URL invalide

**Solution** :
```javascript
// Vérifier l'URL
console.log('Image URL:', imageUrl);

// Ajouter timestamp pour éviter cache
const url = `${imageUrl}?t=${Date.now()}`;

<Image source={{ uri: url }} />
```

### Logs de Debug

```bash
# iOS
npx react-native log-ios

# Android
npx react-native log-android
```

---

## 📊 Performance

### Optimisations Recommandées

1. **FlatList** : Utiliser `getItemLayout` pour listes longues
2. **Images** : Utiliser `react-native-fast-image` avec cache
3. **Navigation** : Lazy loading des screens
4. **API** : Pagination + debounce sur recherches
5. **State** : Éviter re-renders inutiles avec `useMemo`, `useCallback`

---

## 🔐 Sécurité

### Best Practices

- ✅ **HTTPS uniquement** : Jamais de requêtes HTTP
- ✅ **JWT stocké dans AsyncStorage** (pas de localStorage web)
- ✅ **Validation côté client** : Formulaires
- ✅ **Rate Limiting** : Debounce sur requêtes
- ✅ **Pas de secrets dans le code** : Utiliser `.env`
- ✅ **SSL Pinning** : Vérifier certificats (production)

---

## 📄 License

MIT License

---

## 👥 Contact & Support

- **Site Web** : [jamconnexion.com](https://jamconnexion.com)
- **Email** : noreply@jamconnexion.com
- **Documentation API** : [jamconnexion.com/api/docs](https://jamconnexion.com/api/docs)

---

<div align="center">

**Fait avec ❤️ par l'équipe Jam Connexion**

🎸 🎤 🎵

</div>
