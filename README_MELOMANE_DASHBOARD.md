# 🎵 Dashboard Mélomane - Guide Complet des 5 Onglets

<div align="center">

![Melomane Dashboard](https://img.shields.io/badge/Mélomane-Dashboard-F97316?style=for-the-badge&logo=music&logoColor=white)

**Documentation exhaustive de tous les onglets du tableau de bord Mélomane**

</div>

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [1. Carte](#1--carte)
- [2. Mes Participations](#2--mes-participations)
- [3. Établissements](#3--établissements)
- [4. Connexions](#4--connexions)
- [5. Paramètres](#5--paramètres)

---

## 🎯 Vue d'ensemble

Le **Dashboard Mélomane** est le plus **simple** des 3 dashboards. Il contient **5 onglets** pour découvrir et suivre les événements musicaux.

```
┌─────────────────────────────────────────────────────────┐
│  ☰  Jam Connexion          🔔(3)  💬(1)  ⚙️             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  👤 Marie Martin                          🟢 En ligne   │
│  🎵 Mélomane • Lyon                                     │
│                                                          │
│  [Carte] [Mes Participations] [Établissements]         │
│  [Connexions] [Paramètres]                              │
│                                                          │
│  ═══════════════════════════════════════════════════    │
│  │                                                  │    │
│  │   Contenu de l'onglet actif                     │    │
│  │                                                  │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Rôle du Mélomane

Un **mélomane** est un **amateur de musique live** qui peut :
- 🗺️ **Découvrir** des établissements musicaux
- 📅 **S'inscrire** aux événements publics (Jams, Karaokés)
- ⭐ **Suivre** ses établissements favoris
- 📝 **Laisser des avis** après les événements

**Différences avec Musicien :**
- ❌ **Pas de profil musical** (pas d'instruments, styles)
- ❌ **Pas de candidatures** (ne joue pas)
- ❌ **Pas de groupes**
- ✅ **Participation aux événements publics** (spectateur/participant karaoké)

---

## 1. 🗺️ Carte

### Description
Carte interactive pour découvrir les établissements musicaux.

### UI/Wireframe

```
┌─────────────────────────────────────────────────────────┐
│  🔍 Rechercher ville...                    [📍 Ma position]
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                          │
│  🎵 Filtrer par styles : ☑️ Jazz ☑️ Blues ☐ Rock        │
│  📏 Rayon : [━━━●━━━] 50 km                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │                                                  │    │
│  │        🎸    🎸                                  │    │
│  │                                                  │    │
│  │   🎸       📍 (Vous)                             │    │
│  │                                                  │    │
│  │             🎸    🎸                             │    │
│  │                                                  │    │
│  │   ⭕ (Rayon 50km)                                │    │
│  │                                                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ═════════════════════════════════════════════════════  │
│  📍 Établissements à proximité (12)                     │
│  ═════════════════════════════════════════════════════  │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🏢 Le Blue Note                  📍 3.2 km      │    │
│  │ 📍 Paris 11ème                                   │    │
│  │ 🎵 Jazz • Blues • Soul                           │    │
│  │ ⭐⭐⭐⭐⭐ (4.8)                                  │    │
│  │                                                   │    │
│  │ 🎤 Prochains événements :                        │    │
│  │ • Jam Session — Demain 20h (Places : 3/5)       │    │
│  │ • Karaoké 80's — Sam. 21h (Ouvert)              │    │
│  │                                                   │    │
│  │ [👁️ Voir profil] [❤️ Suivre] [🎤 S'inscrire]    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🏢 Jazz Club                     📍 5.8 km      │    │
│  │ 📍 Paris 5ème                                    │    │
│  │ 🎵 Jazz • Soul • Funk                            │    │
│  │ ⭐⭐⭐⭐ (4.2)                                    │    │
│  │                                                   │    │
│  │ 🎤 Concert live — 15 Mars 20h                    │    │
│  │                                                   │    │
│  │ [👁️ Voir profil] [❤️ Suivre]                    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Fonctionnalités

1. **Carte Interactive**
   - ✅ Marqueurs établissements (🎸)
   - ✅ Position utilisateur (📍)
   - ✅ Cercle de rayon (50km par défaut)
   - ✅ Clustering de marqueurs
   - ✅ Popup avec détails + événements à venir

2. **Recherche & Filtres**
   - 🔍 **Recherche par ville** : Centrer la carte
   - 📍 **Ma position** : Géolocalisation
   - 🎵 **Filtres styles** : Jazz, Rock, Blues, etc.
   - 📏 **Rayon** : Slider 10-100km

3. **Liste Établissements à Proximité**
   - Triés par distance
   - Affichage des prochains événements
   - Actions : Voir profil, Suivre, S'inscrire

### État Local

```javascript
const [venues, setVenues] = useState([]);
const [nearbyVenues, setNearbyVenues] = useState([]);
const [geoPosition, setGeoPosition] = useState(null);
const [searchRadius, setSearchRadius] = useState(50);
const [selectedStyles, setSelectedStyles] = useState([]);
const [mapCenter, setMapCenter] = useState([46.603354, 1.888334]);
```

### Calcul de Distance

```javascript
// Formule Haversine pour calculer distance entre 2 points GPS
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance; // en km
};
```

### API Endpoints

```http
GET /api/venues
GET /api/venues/nearby?lat=48.8566&lng=2.3522&radius=50
```

### Code React Native

```javascript
import MapView, { Marker, Circle, Callout } from 'react-native-maps';
import MapViewClustering from 'react-native-map-clustering';
import Geolocation from '@react-native-community/geolocation';

const MapTab = () => {
  const [venues, setVenues] = useState([]);
  const [nearbyVenues, setNearbyVenues] = useState([]);
  const [geoPosition, setGeoPosition] = useState(null);
  const [searchRadius, setSearchRadius] = useState(50);
  const [region, setRegion] = useState({
    latitude: 46.603354,
    longitude: 1.888334,
    latitudeDelta: 5,
    longitudeDelta: 5
  });
  
  // Géolocalisation
  const getUserLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGeoPosition({ latitude, longitude });
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5
        });
        
        // Calculer établissements à proximité
        const nearby = venues
          .filter(v => v.latitude && v.longitude)
          .map(v => {
            const distance = calculateDistance(
              latitude, longitude,
              v.latitude, v.longitude
            );
            return { ...v, distance_km: distance.toFixed(1) };
          })
          .filter(v => parseFloat(v.distance_km) <= searchRadius)
          .sort((a, b) => parseFloat(a.distance_km) - parseFloat(b.distance_km));
        
        setNearbyVenues(nearby);
      },
      (error) => {
        Alert.alert('Erreur', 'Impossible de récupérer votre position');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Rechercher une ville..."
          style={styles.searchInput}
        />
        <Button 
          title="Ma position" 
          onPress={getUserLocation}
          icon="location"
        />
      </View>
      
      {/* Filters */}
      <ScrollView horizontal style={styles.filters}>
        {MUSIC_STYLES.map(style => (
          <Chip
            key={style}
            label={style}
            selected={selectedStyles.includes(style)}
            onPress={() => toggleStyle(style)}
          />
        ))}
      </ScrollView>
      
      {/* Radius Slider */}
      <View style={styles.radiusControl}>
        <Text>Rayon : {searchRadius} km</Text>
        <Slider
          minimumValue={10}
          maximumValue={100}
          step={10}
          value={searchRadius}
          onValueChange={setSearchRadius}
        />
      </View>
      
      {/* Map */}
      <MapViewClustering
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        clusterColor="#F97316"
      >
        {/* User position */}
        {geoPosition && (
          <Marker coordinate={geoPosition} title="Vous êtes ici">
            <View style={styles.userMarker}>
              <Icon name="navigation" size={24} color="#F97316" />
            </View>
          </Marker>
        )}
        
        {/* Radius circle */}
        {geoPosition && (
          <Circle
            center={geoPosition}
            radius={searchRadius * 1000}
            strokeColor="rgba(249, 115, 22, 0.5)"
            fillColor="rgba(249, 115, 22, 0.1)"
          />
        )}
        
        {/* Venues */}
        {venues.map(venue => (
          <Marker
            key={venue.id}
            coordinate={{
              latitude: venue.latitude,
              longitude: venue.longitude
            }}
          >
            <View style={styles.venueMarker}>
              <Text>🎸</Text>
            </View>
            
            <Callout onPress={() => navigateToVenue(venue.id)}>
              <View style={styles.callout}>
                <Text style={styles.venueName}>{venue.name}</Text>
                <Text style={styles.venueStyles}>
                  {venue.music_styles.join(' • ')}
                </Text>
                <Button title="Voir profil" />
              </View>
            </Callout>
          </Marker>
        ))}
      </MapViewClustering>
      
      {/* Nearby Venues List */}
      <View style={styles.nearbySection}>
        <Text style={styles.sectionTitle}>
          📍 Établissements à proximité ({nearbyVenues.length})
        </Text>
        
        <FlatList
          data={nearbyVenues}
          renderItem={({ item }) => (
            <View style={styles.venueCard}>
              <View style={styles.venueHeader}>
                <Text style={styles.venueName}>🏢 {item.name}</Text>
                <Text style={styles.distance}>📍 {item.distance_km} km</Text>
              </View>
              
              <Text style={styles.venueCity}>{item.city}</Text>
              <Text style={styles.venueStyles}>
                🎵 {item.music_styles.join(' • ')}
              </Text>
              
              {/* Prochains événements */}
              {item.upcoming_events?.length > 0 && (
                <View style={styles.events}>
                  <Text style={styles.eventsTitle}>🎤 Prochains événements :</Text>
                  {item.upcoming_events.map(event => (
                    <Text key={event.id} style={styles.eventItem}>
                      • {event.title} — {formatDate(event.date)}
                    </Text>
                  ))}
                </View>
              )}
              
              <View style={styles.actions}>
                <Button 
                  title="Voir profil" 
                  onPress={() => navigateToVenue(item.id)}
                  variant="outline"
                />
                <Button 
                  title="Suivre" 
                  onPress={() => followVenue(item.id)}
                  icon="heart"
                  variant="primary"
                />
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      </View>
    </View>
  );
};
```

---

## 2. 🎤 Mes Participations

### Description
Événements auxquels le mélomane participe (Jams, Karaokés, Concerts publics).

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Mes Participations - 3 événements                      │
│  [Filtrer ▼] [Trier par date ▼]                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  À venir (2)                                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🎸 Jam Session Jazz                              │    │
│  │ 🏢 Le Blue Note • Paris 11ème                    │    │
│  │ 📅 15 Mars 2024 • ⏰ 20h-23h                     │    │
│  │ Badge : ✅ Inscrit (3/5 participants)            │    │
│  │                                                   │    │
│  │ [👁️ Détails] [💬 Contacter] [❌ Annuler]        │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🎤 Karaoké 80's Night                            │    │
│  │ 🏢 Rock Café • Paris 10ème                       │    │
│  │ 📅 20 Mars 2024 • ⏰ 21h-02h                     │    │
│  │ Badge : ✅ Inscrit                               │    │
│  │                                                   │    │
│  │ [👁️ Détails] [💬 Contacter] [❌ Annuler]        │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Passées (1)                                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🎤 Concert Jazz Live                             │    │
│  │ 🏢 Jazz Club • Paris 5ème                        │    │
│  │ 📅 08 Mars 2024 • ⏰ 20h-22h                     │    │
│  │ Badge : ✓ Terminé                                │    │
│  │                                                   │    │
│  │ [⭐ Laisser un avis]                             │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │        Aucune participation prévue               │    │
│  │     Découvrez des événements sur la carte !      │    │
│  │                                                   │    │
│  │          [🗺️ Voir la carte]                      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Types d'Événements

Le mélomane peut participer à :
- 🎸 **Jam Sessions** (ouvertes au public)
- 🎤 **Karaokés** (participation active)
- 🎵 **Concerts publics** (gratuits)

### Actions

- 👁️ **Voir détails** : Page de l'événement
- 💬 **Contacter l'établissement** : Messagerie
- ❌ **Annuler participation** : Se désinscrire
- ⭐ **Laisser un avis** : Après événement terminé

### Données

| Champ | Type | Exemple |
|-------|------|---------|
| `event_id` | String | "evt_123" |
| `event_type` | String | "jam", "karaoke", "concert" |
| `event_title` | String | "Jam Session Jazz" |
| `venue_id` | String | "venue_456" |
| `venue_name` | String | "Le Blue Note" |
| `date` | Date | "2024-03-15" |
| `start_time` | Time | "20:00" |
| `status` | Enum | "confirmed", "cancelled" |
| `participants_count` | Number | 3 |
| `max_participants` | Number | 5 |

### API Endpoints

```http
GET /api/melomanes/me/participations
POST /api/events/{id}/join
DELETE /api/events/{id}/leave
POST /api/reviews
```

### Code React Native

```javascript
const ParticipationsTab = () => {
  const [participations, setParticipations] = useState([]);
  
  const upcomingEvents = participations.filter(p => 
    new Date(p.date) >= new Date()
  );
  
  const pastEvents = participations.filter(p => 
    new Date(p.date) < new Date()
  );
  
  const handleCancel = async (eventId) => {
    Alert.alert(
      'Annuler participation',
      'Êtes-vous sûr de vouloir annuler ?',
      [
        { text: 'Non', style: 'cancel' },
        { 
          text: 'Oui', 
          onPress: async () => {
            await api.delete(`/events/${eventId}/leave`);
            Toast.show({ text: 'Participation annulée' });
            fetchParticipations();
          }
        }
      ]
    );
  };
  
  if (participations.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Icon name="music" size={64} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>Aucune participation</Text>
        <Text style={styles.emptyText}>
          Découvrez des événements sur la carte !
        </Text>
        <Button 
          title="Voir la carte" 
          onPress={() => navigation.navigate('Map')}
        />
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      {/* À venir */}
      {upcomingEvents.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>À venir ({upcomingEvents.length})</Text>
          {upcomingEvents.map(event => (
            <ParticipationCard
              key={event.id}
              event={event}
              onCancel={handleCancel}
            />
          ))}
        </>
      )}
      
      {/* Passées */}
      {pastEvents.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Passées ({pastEvents.length})</Text>
          {pastEvents.map(event => (
            <ParticipationCard
              key={event.id}
              event={event}
              isPast
              onReview={() => openReviewModal(event)}
            />
          ))}
        </>
      )}
    </ScrollView>
  );
};
```

---

## 3. 🏢 Établissements

### Description
Liste complète des établissements avec recherche et filtres.

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Établissements musicaux                                │
│  [🔍 Rechercher..._______________] [Filtres ▼]         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🏢 Le Blue Note              ❤️ Suivi           │    │
│  │ 📍 Paris 11ème                                   │    │
│  │ 🎵 Jazz • Blues • Soul                           │    │
│  │ ⭐⭐⭐⭐⭐ (4.8) - 156 avis                       │    │
│  │                                                   │    │
│  │ 🎤 3 événements à venir                          │    │
│  │                                                   │    │
│  │ [👁️ Voir profil] [🔕 Ne plus suivre]            │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🏢 Rock Café                 [❤️ Suivre]        │    │
│  │ 📍 Paris 10ème                                   │    │
│  │ 🎵 Rock • Metal • Punk                           │    │
│  │ ⭐⭐⭐⭐ (4.2) - 89 avis                          │    │
│  │                                                   │    │
│  │ 🎤 Concert live — Samedi 21h                     │    │
│  │                                                   │    │
│  │ [👁️ Voir profil] [❤️ Suivre]                    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Filtres

- 🔍 **Recherche** : Nom, ville
- 🎵 **Styles musicaux** : Multi-select
- 📍 **Ville** : Autocomplete
- 🎤 **Type d'événements** : Jams, Concerts, Karaokés
- ⭐ **Note minimum** : 3★, 4★, 5★

### API Endpoints

```http
GET /api/venues?search=...&styles=...&city=...
POST /api/venues/{id}/subscribe
DELETE /api/venues/{id}/unsubscribe
```

---

## 4. 🔗 Connexions

### Description
Établissements suivis par le mélomane.

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Mes connexions - 5 établissements                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🏢 Le Blue Note                                  │    │
│  │ 📍 Paris 11ème • Jazz, Blues, Soul               │    │
│  │ 🔔 2 nouveaux événements                         │    │
│  │                                                   │    │
│  │ • Jam Session — Demain 20h                       │    │
│  │ • Karaoké — Samedi 21h                           │    │
│  │                                                   │    │
│  │ [👁️ Voir profil] [🔕 Se désabonner]             │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🏢 Jazz Club                                     │    │
│  │ 📍 Paris 5ème • Jazz, Soul                       │    │
│  │ 🔔 Concert live — 15 Mars 20h                    │    │
│  │                                                   │    │
│  │ [👁️ Voir profil] [🔕 Se désabonner]             │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │     Aucune connexion pour le moment              │    │
│  │   Suivez des établissements pour rester          │    │
│  │          informé de leurs événements !           │    │
│  │                                                   │    │
│  │       [🏢 Découvrir des établissements]          │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Fonctionnalités

- 🔔 **Notifications** : Alertes pour nouveaux événements
- 📅 **Événements à venir** : Affichage direct
- 🔕 **Se désabonner** : Retirer de la liste

### API Endpoints

```http
GET /api/melomanes/me/subscriptions
DELETE /api/venues/{id}/unsubscribe
```

---

## 5. ⚙️ Paramètres

### Description
Configuration du compte mélomane.

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Paramètres du compte                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  👤 Profil                                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Pseudo : [Marie Martin_______________]          │    │
│  │ Ville : [Lyon_________________________]          │    │
│  │ Bio :                                            │    │
│  │ ┌──────────────────────────────────────┐         │    │
│  │ │ Passionnée de jazz live...           │         │    │
│  │ └──────────────────────────────────────┘         │    │
│  │                                                   │    │
│  │ 🎵 Styles préférés :                             │    │
│  │ ☑️ Jazz  ☑️ Blues  ☐ Rock                       │    │
│  │                                                   │    │
│  │ [💾 Enregistrer]                                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  🔔 Notifications                                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ☑️ Notifications push                            │    │
│  │ ☑️ Emails                                        │    │
│  │ ☑️ Nouveaux événements des établissements suivis │    │
│  │                                                   │    │
│  │ 📏 Rayon de notification : [━━━●━━━] 50 km      │    │
│  │                                                   │    │
│  │ [💾 Enregistrer]                                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  🔐 Sécurité                                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │ [🔑 Changer mot de passe]                        │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  🗑️ Zone dangereuse                                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │ [❌ Supprimer mon compte]                        │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Données du Profil

| Champ | Type | Exemple |
|-------|------|---------|
| `pseudo` | String | "Marie Martin" |
| `bio` | Text | "Passionnée de jazz..." |
| `city` | String | "Lyon" |
| `region` | String | "Auvergne-Rhône-Alpes" |
| `postal_code` | String | "69001" |
| `favorite_styles` | Array | ["Jazz", "Blues"] |
| `profile_picture` | URL | "https://..." |
| `notifications_enabled` | Boolean | true |
| `notification_radius_km` | Number | 50 |

### API Endpoints

```http
GET /api/melomanes/me
PUT /api/melomanes/me
PUT /api/melomanes/me/password
DELETE /api/melomanes/me
POST /api/upload/melomane-photo
```

### Code React Native

```javascript
const SettingsTab = () => {
  const [profile, setProfile] = useState({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationRadius, setNotificationRadius] = useState(50);
  
  const handleSaveProfile = async () => {
    try {
      await api.put('/melomanes/me', profile);
      Toast.show({ text: 'Profil mis à jour !' });
    } catch (error) {
      Toast.show({ text: 'Erreur', type: 'error' });
    }
  };
  
  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };
  
  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Êtes-vous sûr ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            await api.delete('/melomanes/me');
            logout();
          }
        }
      ]
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      {/* Section Profil */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Profil</Text>
        
        <View style={styles.field}>
          <Label>Pseudo</Label>
          <TextInput
            value={profile.pseudo}
            onChangeText={(text) => setProfile({...profile, pseudo: text})}
          />
        </View>
        
        <View style={styles.field}>
          <Label>Ville</Label>
          <TextInput
            value={profile.city}
            onChangeText={(text) => setProfile({...profile, city: text})}
          />
        </View>
        
        <View style={styles.field}>
          <Label>Bio</Label>
          <TextInput
            multiline
            numberOfLines={4}
            value={profile.bio}
            onChangeText={(text) => setProfile({...profile, bio: text})}
          />
        </View>
        
        <View style={styles.field}>
          <Label>🎵 Styles préférés</Label>
          <MultiSelect
            items={MUSIC_STYLES}
            selectedItems={profile.favorite_styles}
            onSelectedItemsChange={(styles) => 
              setProfile({...profile, favorite_styles: styles})
            }
          />
        </View>
        
        <Button title="Enregistrer" onPress={handleSaveProfile} />
      </View>
      
      {/* Section Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Notifications</Text>
        
        <View style={styles.toggle}>
          <Text>Notifications push</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </View>
        
        <View style={styles.field}>
          <Label>📏 Rayon de notification : {notificationRadius} km</Label>
          <Slider
            minimumValue={10}
            maximumValue={100}
            step={10}
            value={notificationRadius}
            onValueChange={setNotificationRadius}
          />
        </View>
      </View>
      
      {/* Section Sécurité */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 Sécurité</Text>
        <Button 
          title="Changer mot de passe" 
          onPress={handleChangePassword}
          variant="outline"
        />
      </View>
      
      {/* Zone dangereuse */}
      <View style={styles.dangerZone}>
        <Text style={styles.sectionTitle}>🗑️ Zone dangereuse</Text>
        <Button 
          title="Supprimer mon compte" 
          onPress={handleDeleteAccount}
          variant="destructive"
        />
      </View>
    </ScrollView>
  );
};
```

---

## 🎯 Résumé pour l'Agent Mobile

### Checklist d'Implémentation

```
✅ Tab 1 : Carte
 ☐ MapView avec clustering
 ☐ Géolocalisation
 ☐ Cercle de rayon
 ☐ Filtres styles
 ☐ Liste établissements à proximité
 ☐ Calcul de distance

✅ Tab 2 : Mes Participations
 ☐ Liste événements
 ☐ Section "À venir" / "Passées"
 ☐ Annuler participation
 ☐ Laisser un avis (événements passés)
 ☐ État vide avec CTA

✅ Tab 3 : Établissements
 ☐ Liste avec recherche
 ☐ Filtres (styles, ville, note)
 ☐ Suivre/Ne plus suivre
 ☐ Navigation vers profil

✅ Tab 4 : Connexions
 ☐ Liste abonnements
 ☐ Événements à venir affichés
 ☐ Se désabonner
 ☐ État vide avec CTA

✅ Tab 5 : Paramètres
 ☐ Formulaire profil
 ☐ Upload photo
 ☐ Notifications toggle
 ☐ Rayon notification (slider)
 ☐ Changement mot de passe
 ☐ Suppression compte
```

### Différences Clés avec Musicien

| Fonctionnalité | Musicien | Mélomane |
|----------------|----------|----------|
| **Profil musical** | ✅ Instruments, styles | ❌ Seulement styles préférés |
| **Candidatures** | ✅ Envoyer/Recevoir | ❌ Non |
| **Groupes** | ✅ Créer/Rejoindre | ❌ Non |
| **Participations** | ✅ Concerts où il joue | ✅ Événements spectateur |
| **Comptabilité** | ✅ (PRO) | ❌ Non |
| **Analytics** | ✅ (PRO) | ❌ Non |
| **Amis** | ✅ Réseau musiciens | ❌ Non (uniquement connexions établissements) |

---

<div align="center">

**Guide complet des 5 onglets du Dashboard Mélomane** ✅

</div>
