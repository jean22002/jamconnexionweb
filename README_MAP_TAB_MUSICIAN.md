# 🗺️ Onglet Carte (Map) - Dashboard Musicien

<div align="center">

**Spécifications Complètes pour Reproduction Exacte dans l'App Mobile**

Guide détaillé pour recréer l'onglet carte interactive avec toutes ses fonctionnalités

</div>

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Architecture Générale](#-architecture-générale)
- [Fonctionnalités Principales](#-fonctionnalités-principales)
- [Interface Utilisateur](#-interface-utilisateur)
- [Géolocalisation](#-géolocalisation)
- [Filtres](#-filtres)
- [Carte Interactive](#-carte-interactive)
- [Liste des Établissements](#-liste-des-établissements)
- [API & Données](#-api--données)
- [État & Persistance](#-état--persistance)
- [Mobile-Specific Considerations](#-mobile-specific-considerations)

---

## 🎯 Vue d'ensemble

L'onglet **Carte** est l'onglet principal du dashboard musicien. Il permet de :
- 📍 Visualiser tous les établissements sur une carte interactive
- 🔍 Filtrer par styles musicaux
- 📡 Utiliser la géolocalisation GPS
- 🎯 Rechercher des établissements à proximité
- 🏆 **[PRO ONLY]** Filtrer les établissements par candidatures
- 📅 **[PRO ONLY]** Filtrer par offres disponibles

### Priorité des Fonctionnalités

| Fonctionnalité | Priorité | Complexité |
|----------------|----------|------------|
| Affichage carte basique | ⭐⭐⭐⭐⭐ Critique | Moyenne |
| Géolocalisation GPS | ⭐⭐⭐⭐⭐ Critique | Moyenne |
| Filtres styles musicaux | ⭐⭐⭐⭐⭐ Critique | Facile |
| Liste établissements | ⭐⭐⭐⭐⭐ Critique | Facile |
| Recherche par ville | ⭐⭐⭐⭐ Important | Facile |
| Clustering marqueurs | ⭐⭐⭐ Recommandé | Moyenne |
| Carte rétractable | ⭐⭐⭐ Recommandé | Facile |
| Filtres PRO | ⭐⭐ Optionnel (Phase 2) | Moyenne |

---

## 🏗️ Architecture Générale

### Structure du Composant

```
MapTab
├── Header (rétractable)
│   ├── Titre + Compteur
│   └── Bouton Réduire/Agrandir
│
├── Contrôles Géolocalisation
│   ├── Toggle GPS (Actif/Inactif)
│   ├── Bouton Centrer
│   ├── Slider Rayon (5-100km)
│   └── Recherche par ville
│
├── Filtre Styles Musicaux (chips)
│   ├── Liste tous les styles
│   ├── Sélection multiple
│   └── Compteur résultats
│
├── [PRO] Filtre Candidatures
│   ├── Toggle activation
│   ├── Filtre par date
│   └── Filtre par style
│
├── [PRO] Filtre Offres Disponibles
│   ├── Toggle activation
│   ├── Filtre par date
│   └── Filtre par style
│
├── Grid 2 colonnes (1 col sur mobile)
│   ├── Carte Interactive (gauche)
│   │   ├── Marqueurs établissements
│   │   ├── Marqueur utilisateur (pulse)
│   │   ├── Cercle rayon recherche
│   │   ├── Clustering automatique
│   │   └── Contrôles overlay
│   │
│   └── Liste Établissements (droite)
│       ├── Titre + Compteur
│       ├── Cards établissements
│       └── Scroll vertical
```

---

## 🔥 Fonctionnalités Principales

### 1. Carte Rétractable (Collapsible)

**Comportement :**
- Header toujours visible avec compteur d'établissements
- Bouton chevron pour réduire/agrandir
- État sauvegardé dans `localStorage`
- Par défaut : **Agrandi** (`isMapExpanded: true`)

**États :**
```javascript
// État initial (localStorage ou défaut)
const [isMapExpanded, setIsMapExpanded] = useState(() => {
  const saved = localStorage.getItem('mapExpanded');
  return saved !== null ? JSON.parse(saved) : true;
});

// Toggle
const toggleMapExpanded = () => {
  setIsMapExpanded(prev => {
    const newValue = !prev;
    localStorage.setItem('mapExpanded', JSON.stringify(newValue));
    return newValue;
  });
};
```

**UI :**
```
┌─────────────────────────────────────────┐
│ 🗺️ Carte des établissements            │
│    125 établissements disponibles    🔽 │ ← Cliquer pour réduire
└─────────────────────────────────────────┘

Quand réduit :
┌─────────────────────────────────────────┐
│ 🗺️ Carte des établissements            │
│    125 établissements disponibles    🔼 │ ← Cliquer pour agrandir
└─────────────────────────────────────────┘
```

---

### 2. Géolocalisation GPS

**Comportement :**
- Toggle GPS Actif/Inactif
- Demande permission au premier clic
- Suivi temps réel optionnel
- Précision affichée (±Xm)
- Erreurs gérées (permission refusée, timeout, etc.)

**États :**
```javascript
{
  geoEnabled: false,          // GPS activé ou non
  geoLoading: false,          // En cours de récupération position
  geoError: null,             // Message d'erreur si échec
  geoPosition: {              // Position actuelle
    latitude: 48.8566,
    longitude: 2.3522,
    accuracy: 15              // Précision en mètres
  },
  isTracking: false,          // Suivi temps réel actif
  followUser: false,          // Carte suit automatiquement l'utilisateur
  lastSearchTime: Date        // Heure dernière recherche
}
```

**Flux Activation GPS :**

```
1. Utilisateur clique "GPS Inactif"
   ↓
2. Demande permission système
   ↓
3a. Permission accordée
    → Récupération position
    → État: geoEnabled=true, geoPosition={...}
    → Recherche établissements à proximité
    → Centrage carte sur position

3b. Permission refusée
    → État: geoError="Géolocalisation refusée"
    → Affichage message erreur
```

**API Géolocalisation Mobile :**

```javascript
// React Native
import Geolocation from '@react-native-community/geolocation';

// Demander permission
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const requestLocationPermission = async () => {
  const result = await request(
    Platform.OS === 'ios' 
      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE 
      : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
  );
  return result === RESULTS.GRANTED;
};

// Récupérer position
Geolocation.getCurrentPosition(
  (position) => {
    setGeoPosition({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    });
  },
  (error) => {
    setGeoError(error.message);
  },
  { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
);

// Suivi temps réel
const watchId = Geolocation.watchPosition(
  (position) => {
    setGeoPosition({ ... });
  },
  (error) => { ... },
  { enableHighAccuracy: true, distanceFilter: 10 }
);

// Cleanup
Geolocation.clearWatch(watchId);
```

---

### 3. Slider Rayon de Recherche

**Comportement :**
- Plage : 5km - 100km
- Pas : 5km
- Valeur par défaut : 50km
- Affichage en temps réel : "Rayon: 50km"
- Recherche automatique quand relâché

**UI Mobile :**
```
Rayon: 50km
[━━━━━●━━━━━━] 5km ←→ 100km
```

**Composant Recommandé :**
- React Native : `@react-native-community/slider`

**État :**
```javascript
const [searchRadius, setSearchRadius] = useState(50); // km

const handleRadiusChange = (value) => {
  setSearchRadius(value);
  // Déclencher recherche après 500ms sans changement
  debounce(() => searchNearbyVenues(value), 500);
};
```

---

### 4. Recherche par Ville

**Comportement :**
- Input texte avec icône 🔍
- Recherche au clic sur bouton ou touche Entrée
- Loading spinner pendant recherche
- Geocoding via API Nominatim (OpenStreetMap)
- Centre la carte sur la ville trouvée

**Flux :**
```
1. Utilisateur tape "Paris"
   ↓
2. Clique sur bouton Rechercher
   ↓
3. Appel API Nominatim
   → https://nominatim.openstreetmap.org/search?q=Paris&format=json&limit=1
   ↓
4. Récupération coordonnées (lat, lon)
   ↓
5. Centrage carte + recherche établissements autour
```

**API Call :**
```javascript
const searchCity = async (cityName) => {
  setSearchingCity(true);
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`
    );
    const data = await response.json();
    
    if (data.length > 0) {
      const { lat, lon } = data[0];
      setMapCenter([parseFloat(lat), parseFloat(lon)]);
      // Rechercher établissements autour de cette position
      searchNearbyVenues({ latitude: lat, longitude: lon });
    } else {
      alert('Ville non trouvée');
    }
  } catch (error) {
    console.error('Erreur recherche ville:', error);
  } finally {
    setSearchingCity(false);
  }
};
```

---

### 5. Filtres Styles Musicaux

**Comportement :**
- Liste de tous les styles uniques des établissements
- Sélection multiple (chips cliquables)
- Bouton "Tous" pour réinitialiser
- Compteur de résultats en temps réel
- Styles normalisés (première lettre majuscule)

**États :**
```javascript
const [selectedStyles, setSelectedStyles] = useState([]);

// Extraire styles uniques
const allStyles = useMemo(() => {
  const styles = new Set();
  (venues || []).forEach(v => {
    (v.music_styles || []).forEach(s => {
      const normalized = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      styles.add(normalized);
    });
  });
  return [...styles].sort((a, b) => a.localeCompare(b, 'fr'));
}, [venues]);

// Toggle style
const toggleStyle = (style) => {
  setSelectedStyles(prev => 
    prev.includes(style) 
      ? prev.filter(s => s !== style) 
      : [...prev, style]
  );
};

// Filtrer établissements
const filteredVenues = useMemo(() => {
  if (selectedStyles.length === 0) return venues;
  
  return venues.filter(v => 
    (v.music_styles || []).some(s => {
      const normalized = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      return selectedStyles.includes(normalized);
    })
  );
}, [venues, selectedStyles]);
```

**UI :**
```
🎵 Styles :  [Tous]  [Rock]  [Jazz]  [Blues]  [Pop]  [Métal]
            ↑ actif    ↑ inactif

Quand sélection :
🎵 Styles :  [Tous]  [Rock]  [Jazz]  [Blues]  [Pop]  → 45 résultats
                     ↑ sélectionné (fond violet)
```

**Composant Mobile Recommandé :**
- Horizontal `ScrollView` avec chips
- Ou `FlatList` horizontal

---

### 6. Filtres PRO (Réservés Musiciens PRO)

#### 6.1 Filtre par Candidatures

**Comportement :**
- Visible uniquement si `musicianProfile.tier === 'pro'`
- Badge "Réservé Musicien PRO" 🏆
- Toggle Actif/Désactivé
- Filtre par date de candidature
- Filtre par style musical de candidature
- Affiche uniquement les établissements où le musicien a postulé

**États :**
```javascript
const [showApplicationFilter, setShowApplicationFilter] = useState(false);
const [selectedApplicationDate, setSelectedApplicationDate] = useState('all');
const [selectedApplicationStyle, setSelectedApplicationStyle] = useState('all');

// Extraire dates uniques des candidatures
const applicationDates = useMemo(() => {
  const dates = new Set();
  (myApplications || []).forEach(app => {
    if (app.slot_date) dates.add(app.slot_date);
  });
  return ['all', ...Array.from(dates).sort()];
}, [myApplications]);

// Extraire styles uniques
const applicationStyles = useMemo(() => {
  const styles = new Set();
  (myApplications || []).forEach(app => {
    if (app.music_styles) {
      app.music_styles.forEach(style => styles.add(style));
    }
  });
  return ['all', ...Array.from(styles).sort()];
}, [myApplications]);

// Filtrer établissements
const filteredVenues = useMemo(() => {
  if (!showApplicationFilter) return venues;
  
  const filtered = myApplications.filter(app => {
    if (selectedApplicationDate !== 'all' && app.slot_date !== selectedApplicationDate) {
      return false;
    }
    if (selectedApplicationStyle !== 'all' && !app.music_styles.includes(selectedApplicationStyle)) {
      return false;
    }
    return true;
  });
  
  const venueNames = new Set(filtered.map(app => app.slot_venue_name));
  return venues.filter(v => venueNames.has(v.name));
}, [venues, myApplications, showApplicationFilter, selectedApplicationDate, selectedApplicationStyle]);
```

**UI :**
```
┌────────────────────────────────────────┐
│ 🏆 Filtre Candidatures                │
│    Réservé Musicien PRO                │
│                            [Désactivé] │
└────────────────────────────────────────┘

Quand actif :
┌────────────────────────────────────────┐
│ 🏆 Filtre Candidatures                │
│    Réservé Musicien PRO                │
│                               [Actif]  │
├────────────────────────────────────────┤
│ Filtrer par date de candidature       │
│ [Toutes les dates ▼]                  │
│                                        │
│ Filtrer par style musical             │
│ [Tous les styles ▼]                   │
│                                        │
│ 23 établissements trouvés [Réinit.]  │
└────────────────────────────────────────┘
```

#### 6.2 Filtre par Offres Disponibles

**Comportement :**
- Similaire au filtre candidatures
- Badge "Réservé Musicien PRO" 📅
- Filtre par date d'offre (slots disponibles)
- Filtre par style musical recherché
- Affiche établissements avec slots disponibles correspondants

**Source de données :**
```javascript
// Récupéré depuis API
const availableSlots = [
  {
    id: "slot_123",
    venue_name: "Le Blue Note",
    venue_id: "venue_456",
    date: "2024-04-15",
    time: "20:00-23:00",
    music_styles: ["Jazz", "Blues"],
    slots_available: 3
  },
  // ...
];
```

---

## 🗺️ Carte Interactive

### Bibliothèque Recommandée

**React Native Maps** (recommandé)
```bash
npm install react-native-maps
```

Alternative : **MapBox** (plus puissant mais payant au-delà de 50k vues/mois)

### Configuration Carte

```javascript
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';

<MapView
  provider={PROVIDER_GOOGLE} // ou PROVIDER_DEFAULT
  style={{ flex: 1 }}
  initialRegion={{
    latitude: geoPosition?.latitude || 48.8566,
    longitude: geoPosition?.longitude || 2.3522,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  }}
  showsUserLocation={geoEnabled}
  followsUserLocation={followUser}
  showsMyLocationButton={false}
  customMapStyle={darkMapStyle} // Optionnel : style sombre
>
  {/* Marqueurs */}
</MapView>
```

### Style Carte Sombre (optionnel)

```javascript
const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{"color": "#1e1e2e"}]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#b8b8b8"}]
  },
  // ... voir fichier complet dans le code web
];
```

### Marqueurs Établissements

**Icon Personnalisé (Guitare 🎸) :**

```javascript
import { Image } from 'react-native';

const VenueMarker = ({ venue, onPress }) => (
  <Marker
    coordinate={{
      latitude: venue.latitude,
      longitude: venue.longitude,
    }}
    onPress={onPress}
    title={venue.name}
    description={venue.city}
  >
    {/* Marqueur personnalisé */}
    <View style={{
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#a855f7',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'white',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    }}>
      <Text style={{ fontSize: 18 }}>🎸</Text>
    </View>
  </Marker>
);

// Utilisation
{venues.map(venue => (
  <VenueMarker 
    key={venue.id} 
    venue={venue}
    onPress={() => navigation.navigate('VenueDetails', { venueId: venue.id })}
  />
))}
```

### Marqueur Utilisateur (Pulse Animation)

```javascript
const UserMarker = ({ position }) => (
  <Marker
    coordinate={{
      latitude: position.latitude,
      longitude: position.longitude,
    }}
    anchor={{ x: 0.5, y: 0.5 }}
  >
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {/* Pulse animé */}
      <Animated.View style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#3b82f6',
        opacity: pulseAnim, // Animated.Value 0 -> 1
        transform: [{ scale: pulseAnim }]
      }} />
      {/* Point central */}
      <View style={{
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#3b82f6',
        borderWidth: 2,
        borderColor: 'white',
      }} />
    </View>
  </Marker>
);

// Animation pulse
const pulseAnim = useRef(new Animated.Value(1)).current;

useEffect(() => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.5,
        duration: 1000,
        useNativeDriver: true
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true
      })
    ])
  ).start();
}, []);
```

### Cercle Rayon de Recherche

```javascript
{geoPosition && showRadiusCircle && (
  <Circle
    center={{
      latitude: geoPosition.latitude,
      longitude: geoPosition.longitude,
    }}
    radius={searchRadius * 1000} // km -> mètres
    strokeColor="rgba(168, 85, 247, 0.5)"
    fillColor="rgba(168, 85, 247, 0.1)"
    strokeWidth={2}
  />
)}
```

### Clustering (Regroupement Marqueurs)

**Problème :** Quand 100+ établissements, la carte devient illisible.

**Solution :** Clustering automatique

**Bibliothèque Recommandée :**
```bash
npm install react-native-maps-super-cluster
```

**Usage :**
```javascript
import ClusteredMapView from 'react-native-maps-super-cluster';

<ClusteredMapView
  data={venues.map(v => ({
    location: { latitude: v.latitude, longitude: v.longitude },
    ...v
  }))}
  initialRegion={initialRegion}
  renderMarker={(data) => <VenueMarker venue={data} />}
  renderCluster={(cluster) => (
    <Marker coordinate={cluster.coordinate}>
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#a855f7',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white'
      }}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {cluster.pointCount}
        </Text>
      </View>
    </Marker>
  )}
/>
```

---

## 📋 Liste des Établissements

### Comportement

**Colonne droite (Web) / Sous la carte (Mobile) :**
- Scroll vertical
- Cards cliquables
- Badge "À proximité" si dans le rayon GPS
- Distance affichée (X km)
- Tags : "Scène", "Ingé son"
- Photo, nom, ville
- Navigation vers détails établissement

### Layout Mobile

```
┌─────────────────────────────────────┐
│ 45 établissements répertoriés      │
│ Dans un rayon de 50km              │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │ ← Card
│ │ [Photo] Le Blue Note            │ │
│ │         Paris           À prox. │ │
│ │         📍 • 2.5 km            │ │
│ │         [Scène] [Ingé son]     │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [Photo] Jazz Café               │ │
│ │         Lyon                    │ │
│ │         📍 • 5.2 km            │ │
│ └─────────────────────────────────┘ │
│ ...                                 │
└─────────────────────────────────────┘
```

### Composant Card

```javascript
const VenueCard = ({ venue, isNearby, onPress }) => (
  <TouchableOpacity 
    style={styles.card}
    onPress={onPress}
  >
    <View style={styles.cardContent}>
      {/* Photo */}
      {venue.profile_image && (
        <Image 
          source={{ uri: venue.profile_image }}
          style={styles.venueImage}
        />
      )}
      
      <View style={styles.venueInfo}>
        {/* Nom + Badge */}
        <View style={styles.venueHeader}>
          <Text style={styles.venueName}>{venue.name}</Text>
          {isNearby && (
            <View style={styles.nearbyBadge}>
              <Text style={styles.nearbyText}>À proximité</Text>
            </View>
          )}
        </View>
        
        {/* Ville + Distance */}
        <View style={styles.venueLocation}>
          <MapPin size={16} color="#888" />
          <Text style={styles.cityText}>{venue.city}</Text>
          {isNearby && venue.distance_km && (
            <Text style={styles.distanceText}>• {venue.distance_km} km</Text>
          )}
        </View>
      </View>
      
      {/* Tags */}
      <View style={styles.tags}>
        {venue.has_stage && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>Scène</Text>
          </View>
        )}
        {venue.has_sound_engineer && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>Ingé son</Text>
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
);
```

---

## 🔌 API & Données

### Endpoints Utilisés

#### 1. GET `/api/venues` - Liste tous les établissements

**Requête :**
```bash
GET https://jamconnexion.com/api/venues
Authorization: Bearer {jwt_token}
```

**Réponse :**
```json
[
  {
    "id": "venue_123",
    "name": "Le Blue Note",
    "city": "Paris",
    "postal_code": "75011",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "music_styles": ["Jazz", "Blues", "Soul"],
    "profile_image": "https://jamconnexion.com/uploads/venues/abc123.jpg",
    "has_stage": true,
    "has_sound_engineer": true,
    "subscription_status": "active"
  },
  // ... 125 établissements
]
```

#### 2. Recherche Établissements à Proximité

**Option A : Filtrage Côté Client**

```javascript
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance en km
};

const nearbyVenues = venues
  .map(venue => ({
    ...venue,
    distance_km: calculateDistance(
      geoPosition.latitude,
      geoPosition.longitude,
      venue.latitude,
      venue.longitude
    ).toFixed(1)
  }))
  .filter(v => v.distance_km <= searchRadius)
  .sort((a, b) => a.distance_km - b.distance_km);
```

**Option B : API Backend (recommandé pour optimisation)**

```bash
GET /api/venues/nearby?lat=48.8566&lon=2.3522&radius=50
```

#### 3. GET `/api/musicians/me/applications` - Candidatures

**Utilisé pour le filtre PRO "Candidatures"**

```json
[
  {
    "id": "app_123",
    "slot_venue_name": "Le Blue Note",
    "slot_date": "2024-04-15",
    "music_styles": ["Jazz", "Blues"],
    "status": "pending"
  }
]
```

#### 4. GET `/api/planning/available-slots` - Offres Disponibles

**Utilisé pour le filtre PRO "Offres"**

```json
[
  {
    "id": "slot_456",
    "venue_name": "Jazz Café",
    "venue_id": "venue_789",
    "date": "2024-04-20",
    "time": "21:00-00:00",
    "music_styles": ["Jazz", "Funk"],
    "slots_available": 2
  }
]
```

---

## 💾 État & Persistance

### État Global (useState)

```javascript
// Géolocalisation
const [geoEnabled, setGeoEnabled] = useState(false);
const [geoLoading, setGeoLoading] = useState(false);
const [geoError, setGeoError] = useState(null);
const [geoPosition, setGeoPosition] = useState(null);
const [isTracking, setIsTracking] = useState(false);

// Carte
const [mapCenter, setMapCenter] = useState([48.8566, 2.3522]); // Paris par défaut
const [userHasMovedMap, setUserHasMovedMap] = useState(false);
const [followUser, setFollowUser] = useState(false);
const [showRadiusCircle, setShowRadiusCircle] = useState(true);

// Recherche
const [searchRadius, setSearchRadius] = useState(50);
const [searchCity, setSearchCity] = useState('');
const [searchingCity, setSearchingCity] = useState(false);
const [lastSearchTime, setLastSearchTime] = useState(null);

// Filtres
const [selectedStyles, setSelectedStyles] = useState([]);
const [showApplicationFilter, setShowApplicationFilter] = useState(false);
const [showOffersFilter, setShowOffersFilter] = useState(false);

// Données
const [venues, setVenues] = useState([]);
const [nearbyVenues, setNearbyVenues] = useState([]);
const [loading, setLoading] = useState(true);

// UI
const [isMapExpanded, setIsMapExpanded] = useState(true);
```

### Persistance LocalStorage (AsyncStorage sur mobile)

**États à persister :**

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sauvegarder
await AsyncStorage.setItem('mapExpanded', JSON.stringify(isMapExpanded));
await AsyncStorage.setItem('searchRadius', searchRadius.toString());
await AsyncStorage.setItem('selectedStyles', JSON.stringify(selectedStyles));

// Charger au démarrage
const loadPreferences = async () => {
  const mapExpanded = await AsyncStorage.getItem('mapExpanded');
  if (mapExpanded !== null) {
    setIsMapExpanded(JSON.parse(mapExpanded));
  }
  
  const radius = await AsyncStorage.getItem('searchRadius');
  if (radius) {
    setSearchRadius(parseInt(radius));
  }
  
  const styles = await AsyncStorage.getItem('selectedStyles');
  if (styles) {
    setSelectedStyles(JSON.parse(styles));
  }
};

useEffect(() => {
  loadPreferences();
}, []);
```

---

## 📱 Mobile-Specific Considerations

### 1. Permissions

**iOS - Info.plist :**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Jam Connexion a besoin de votre localisation pour trouver des établissements à proximité</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Jam Connexion peut suivre votre position en temps réel pour mettre à jour les établissements proches</string>
```

**Android - AndroidManifest.xml :**
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### 2. Performance

**Optimisations :**
- Limiter nombre de marqueurs affichés (clustering obligatoire)
- Lazy loading des images venues
- Debounce recherche ville (500ms)
- Mémoïsation des calculs filtres (`useMemo`)
- `FlatList` avec `windowSize` pour la liste

**Exemple :**
```javascript
<FlatList
  data={filteredVenues}
  renderItem={({ item }) => <VenueCard venue={item} />}
  keyExtractor={item => item.id}
  windowSize={5}
  maxToRenderPerBatch={10}
  initialNumToRender={10}
  removeClippedSubviews={true}
/>
```

### 3. Layout Responsive

**Mobile : 1 colonne**
```
┌─────────────────┐
│     Carte       │
│   (hauteur fixe)│
└─────────────────┘
┌─────────────────┐
│  Liste Venues   │
│   (scroll)      │
└─────────────────┘
```

**Tablette : 2 colonnes (comme web)**

```javascript
const isTablet = useWindowDimensions().width > 768;

<View style={{ flexDirection: isTablet ? 'row' : 'column' }}>
  <View style={{ flex: isTablet ? 1 : 0, height: isTablet ? '100%' : 400 }}>
    <MapView />
  </View>
  <View style={{ flex: 1 }}>
    <FlatList />
  </View>
</View>
```

### 4. Gestes Utilisateur

**Carte :**
- Pinch to zoom (natif)
- Pan pour déplacer (natif)
- Tap marqueur → Callout → Navigation détails

**Liste :**
- Scroll vertical
- Pull-to-refresh pour recharger données

```javascript
<FlatList
  refreshControl={
    <RefreshControl
      refreshing={loading}
      onRefresh={fetchVenues}
    />
  }
/>
```

---

## 🎨 Design Tokens

### Couleurs

```javascript
const colors = {
  primary: '#a855f7',       // Violet
  secondary: '#ec4899',     // Rose
  success: '#10b981',       // Vert
  background: '#1e1e2e',    // Fond sombre
  card: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.1)',
  text: '#ffffff',
  textMuted: '#888888',
};
```

### Espacement

```javascript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

### Typographie

```javascript
const typography = {
  heading: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  small: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
};
```

---

## ✅ Checklist Implémentation

### Phase 1 : MVP (Fonctionnalités Critiques)

- [ ] Afficher carte avec marqueurs établissements
- [ ] Géolocalisation GPS avec permission
- [ ] Slider rayon de recherche (5-100km)
- [ ] Recherche par ville (Nominatim)
- [ ] Filtre styles musicaux (chips)
- [ ] Liste établissements avec scroll
- [ ] Navigation vers détails établissement
- [ ] Carte rétractable (collapsible)
- [ ] Persistance préférences (AsyncStorage)

### Phase 2 : Améliorations

- [ ] Clustering marqueurs (react-native-maps-super-cluster)
- [ ] Cercle rayon recherche
- [ ] Suivi temps réel GPS
- [ ] Badge "À proximité" + distance
- [ ] Animation pulse marqueur utilisateur
- [ ] Pull-to-refresh liste
- [ ] Loading states & error handling

### Phase 3 : Fonctionnalités PRO

- [ ] Filtre candidatures (date + style)
- [ ] Filtre offres disponibles (date + style)
- [ ] Vérification statut PRO (`tier === 'pro'`)
- [ ] Badge "Réservé Musicien PRO"

---

## 🐛 Gestion des Erreurs

### Scénarios d'Erreur

| Erreur | Cause | Affichage | Action |
|--------|-------|-----------|--------|
| Permission GPS refusée | Utilisateur refuse | Message explicite | Bouton "Paramètres" |
| Timeout GPS | Pas de signal | "Impossible de localiser" | Bouton "Réessayer" |
| API venues échoue | Réseau, backend down | "Erreur chargement" | Bouton "Réessayer" |
| Ville non trouvée | Nominatim aucun résultat | Alert "Ville non trouvée" | - |
| Aucun établissement | Filtres trop restrictifs | "Aucun résultat" | Bouton "Réinitialiser filtres" |

### Exemple Error Boundary

```javascript
const ErrorView = ({ error, onRetry }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorIcon}>❌</Text>
    <Text style={styles.errorTitle}>Erreur de chargement</Text>
    <Text style={styles.errorMessage}>{error}</Text>
    <Button title="Réessayer" onPress={onRetry} />
  </View>
);
```

---

## 📚 Bibliothèques Recommandées

```json
{
  "dependencies": {
    "react-native-maps": "^1.10.0",
    "react-native-maps-super-cluster": "^1.9.0",
    "@react-native-community/geolocation": "^3.1.0",
    "react-native-permissions": "^4.0.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "@react-native-community/slider": "^4.5.0"
  }
}
```

---

## 🎯 Résumé Technique

**Complexité :** Moyenne-Élevée

**Temps estimé :** 3-5 jours de développement

**Points clés :**
- Géolocalisation native avec permissions
- Carte interactive avec clustering
- Filtres multiples (styles, PRO)
- Calculs distance temps réel
- Persistance préférences utilisateur
- Performance optimisée (mémoïsation, FlatList)

**Dépendances externes :**
- API Backend : `/api/venues`, `/api/musicians/me/applications`
- API Nominatim : Geocoding villes
- Google Maps (ou équivalent)

---

<div align="center">

**Documentation Complète de l'Onglet Carte** ✅

Toutes les spécifications pour reproduire à l'identique sur mobile

Bonne implémentation ! 🚀

</div>
