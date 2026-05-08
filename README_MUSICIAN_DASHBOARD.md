# 🎸 Dashboard Musicien - Guide Complet des 12 Onglets

<div align="center">

![Musician Dashboard](https://img.shields.io/badge/Musician-Dashboard-17D9D9?style=for-the-badge&logo=guitar&logoColor=white)

**Documentation exhaustive de tous les onglets du tableau de bord Musicien**

</div>

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [1. Carte](#1--carte)
- [2. Planning](#2--planning)
- [3. Comptabilité (PRO)](#3--comptabilité-pro)
- [4. Analytics (PRO)](#4--analytics-pro)
- [5. Candidatures](#5--candidatures)
- [6. Mes Candidatures](#6--mes-candidatures)
- [7. Mes Participations](#7--mes-participations)
- [8. Musiciens](#8--musiciens)
- [9. Établissements](#9--établissements)
- [10. Amis](#10--amis)
- [11. Connexions](#11--connexions)
- [12. Groupes](#12--groupes)

---

## 🎯 Vue d'ensemble

Le **Dashboard Musicien** contient **12 onglets** organisés ainsi :

```
┌─────────────────────────────────────────────────────────┐
│  ☰  Jam Connexion          🔔(8)  💬(3)  ⚙️             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  👤 John Doe                              🟢 En ligne   │
│  🎸 Guitariste • Paris                    [💼 PRO]      │
│                                                          │
│  [Carte] [Planning] [💼 Compta] [📊 Analytics]          │
│  [Candidatures] [Mes Candidatures] [Participations]    │
│  [Musiciens] [Établissements] [Amis] [Connexions]      │
│  [Groupes]                                              │
│                                                          │
│  ═══════════════════════════════════════════════════    │
│  │                                                  │    │
│  │   Contenu de l'onglet actif                     │    │
│  │                                                  │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Badge PRO

Les onglets **Comptabilité** et **Analytics** sont **réservés aux musiciens PRO** (abonnement payant).

```javascript
{user.is_pro ? (
  <>
    <TabsTrigger value="accounting">💼 Comptabilité</TabsTrigger>
    <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
  </>
) : null}
```

---

## 1. 🗺️ Carte

### Description
Carte interactive pour trouver des établissements musicaux à proximité.

### UI/Wireframe

```
┌─────────────────────────────────────────────────────────┐
│  🔍 Rechercher ville...                    [📍 Ma position]
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                          │
│  🎵 Filtrer par styles : ☑️ Rock ☑️ Jazz ☐ Blues        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                          │
│  [− Réduire la carte]                                   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │                                                  │    │
│  │        🎸    🎸                                  │    │
│  │                                                  │    │
│  │   🎸       📍 (Vous)                             │    │
│  │                                                  │    │
│  │             🎸    🎸                             │    │
│  │                                                  │    │
│  │        🎸              🎸                        │    │
│  │                                                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ═════════════════════════════════════════════════════  │
│  🏢 Le Blue Note                     📍 3.2 km          │
│  📍 Paris 11ème                                         │
│  🎵 Jazz • Blues • Soul                                 │
│  ⭐⭐⭐⭐⭐ (4.8)                                        │
│                                                          │
│  🎤 Jam Session — Demain 20h                            │
│  Places : 3/5                                           │
│                                                          │
│  [👁️ Voir profil]           [✅ Participer]             │
│  ════════════════════════════════════════════════════   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Fonctionnalités

1. **Carte Interactive**
   - ✅ Marqueurs établissements (🎸)
   - ✅ Position utilisateur (📍)
   - ✅ Clustering de marqueurs
   - ✅ Popup avec détails

2. **Recherche & Filtres**
   - 🔍 **Recherche par ville** : Centrer la carte
   - 📍 **Ma position** : Géolocalisation temps réel
   - 🎵 **Filtres styles** : Jazz, Rock, Blues, etc.
   - 📏 **Rayon** : 10km, 50km, 100km

3. **Carte Rétractable**
   - ⬆️ **Agrandir** : Vue plein écran
   - ⬇️ **Réduire** : Libérer de l'espace

### État Local

```javascript
const [mapCenter, setMapCenter] = useState([48.8566, 2.3522]);
const [venues, setVenues] = useState([]);
const [filteredVenues, setFilteredVenues] = useState([]);
const [selectedStyles, setSelectedStyles] = useState([]);
const [searchRadius, setSearchRadius] = useState(50);
const [geoPosition, setGeoPosition] = useState(null);
const [isMapExpanded, setIsMapExpanded] = useState(true);
```

### API Endpoints

```http
GET /api/venues?styles=Rock,Jazz
GET /api/venues/nearby?lat=48.8566&lng=2.3522&radius=50
```

### Code React Native

```javascript
import MapView, { Marker, Circle, Callout } from 'react-native-maps';
import MapViewClustering from 'react-native-map-clustering';

const MapTab = () => {
  const [venues, setVenues] = useState([]);
  const [region, setRegion] = useState({
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5
  });
  const [isExpanded, setIsExpanded] = useState(true);
  
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Rechercher une ville..."
          value={searchCity}
          onChangeText={setSearchCity}
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
      
      {/* Toggle Button */}
      <TouchableOpacity 
        onPress={() => setIsExpanded(!isExpanded)}
        style={styles.toggleButton}
      >
        <Icon name={isExpanded ? "chevron-up" : "chevron-down"} />
        <Text>{isExpanded ? "Réduire" : "Agrandir"} la carte</Text>
      </TouchableOpacity>
      
      {/* Map */}
      {isExpanded && (
        <MapViewClustering
          ref={mapRef}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          clusterColor="#17D9D9"
        >
          {/* User position */}
          {geoPosition && (
            <Marker
              coordinate={geoPosition}
              title="Vous êtes ici"
            >
              <View style={styles.userMarker}>
                <Icon name="navigation" size={24} color="#17D9D9" />
              </View>
            </Marker>
          )}
          
          {/* Search radius circle */}
          {geoPosition && (
            <Circle
              center={geoPosition}
              radius={searchRadius * 1000}
              strokeColor="rgba(23, 217, 217, 0.5)"
              fillColor="rgba(23, 217, 217, 0.1)"
            />
          )}
          
          {/* Venues markers */}
          {filteredVenues.map(venue => (
            <Marker
              key={venue.id}
              coordinate={{
                latitude: venue.latitude,
                longitude: venue.longitude
              }}
            >
              <View style={styles.venueMarker}>
                <Text style={styles.markerEmoji}>🎸</Text>
              </View>
              
              <Callout onPress={() => navigateToVenue(venue.id)}>
                <View style={styles.callout}>
                  <Text style={styles.venueName}>{venue.name}</Text>
                  <Text style={styles.venueCity}>{venue.city}</Text>
                  <Text style={styles.venueStyles}>
                    {venue.music_styles.join(' • ')}
                  </Text>
                  <Button 
                    title="Voir profil" 
                    onPress={() => navigateToVenue(venue.id)}
                  />
                </View>
              </Callout>
            </Marker>
          ))}
        </MapViewClustering>
      )}
      
      {/* Venues List Below Map */}
      <FlatList
        data={filteredVenues}
        renderItem={({ item }) => <VenueCard venue={item} />}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};
```

---

## 2. 📅 Planning

### Description
Calendrier personnel avec disponibilités et événements confirmés.

**Voir README_PLANNING_SYSTEM.md pour les détails complets**

### UI

```
┌─────────────────────────────────────────────────────────┐
│                    Mars 2024                    [<] [>] │
├─────────────────────────────────────────────────────────┤
│  Lun   Mar   Mer   Jeu   Ven   Sam   Dim               │
├─────────────────────────────────────────────────────────┤
│   4     │  5   │  6   │  7   │  8    │  9    │ 10      │
│         │      │      │      │       │ 🎸    │         │
├─────────┼──────┼──────┼──────┼───────┼───────┼─────────┤
│  11     │ 12   │ 13   │ 14   │ 15    │ 16    │ 17      │
│         │      │      │      │ 🎤    │       │         │
│         │      │      │      │ ✅    │       │         │
└─────────────────────────────────────────────────────────┘

Légende :
🎤 = Concert confirmé (je joue)
🎸 = Jam Session (inscrit)
✅ = Participation confirmée
📢 = Créneau disponible (établissement cherche musicien)
```

### Événements Affichés

- ✅ **Participations confirmées** : Concerts/Jams où je suis accepté
- 📢 **Créneaux disponibles** : Offres d'établissements
- 🗓️ **Disponibilités personnelles** : Mes créneaux libres

---

## 3. 💼 Comptabilité (PRO)

### Description
Suivi des revenus et prestations (réservé PRO).

### UI

```
┌─────────────────────────────────────────────────────────┐
│  💼 Comptabilité                    [📥 Exporter PDF]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📊 Résumé                                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Total gagné ce mois : 1 850 €                    │    │
│  │ Nombre de prestations : 12                       │    │
│  │ Moyenne par prestation : 154 €                   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  📋 Prestations                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 15 Mars • Le Blue Note                           │    │
│  │ Concert Rock                                     │    │
│  │ Montant : 150 €                                  │    │
│  │ Statut : ✅ Payé                                 │    │
│  │ [📄 Facture]                                     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 22 Mars • Rock Café                              │    │
│  │ Jam Session                                      │    │
│  │ Montant : 80 €                                   │    │
│  │ Statut : ⏳ En attente                           │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Données

| Champ | Type | Exemple |
|-------|------|---------|
| `date` | Date | "2024-03-15" |
| `venue_name` | String | "Le Blue Note" |
| `event_type` | String | "Concert", "Jam" |
| `amount` | Number | 150 (€) |
| `status` | Enum | "paid", "pending", "cancelled" |
| `invoice_url` | URL | "https://..." (PDF) |

### API Endpoints

```http
GET /api/musicians/me/accounting
GET /api/musicians/me/accounting/export?format=pdf
```

---

## 4. 📊 Analytics (PRO)

### Description
Statistiques de visibilité (réservé PRO).

### UI

```
┌─────────────────────────────────────────────────────────┐
│  📊 Analytics                       [📅 Ce mois]        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🎯 KPIs                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Vues     │ │Candidatures││Taux conv. ││ Nouveaux │   │
│  │ 1,234    │ │    45     ││   12%     ││  abonnés │   │
│  │ +15% ↑   │ │   +8% ↑   ││   -2% ↓   ││    8     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│  📈 Évolution des vues                                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │     ╱╲                                           │    │
│  │    ╱  ╲      ╱╲                                  │    │
│  │   ╱    ╲    ╱  ╲    ╱╲                          │    │
│  │  ╱      ╲  ╱    ╲  ╱  ╲                         │    │
│  │ ╱        ╲╱      ╲╱    ╲                        │    │
│  └─────────────────────────────────────────────────┘    │
│    Lun  Mar  Mer  Jeu  Ven  Sam  Dim                    │
│                                                          │
│  🎵 Styles musicaux (% de vues)                         │
│  Rock     ████████████████████ 40%                      │
│  Jazz     ████████████ 24%                              │
│  Blues    ████████ 16%                                  │
│  Autres   ████████ 20%                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### API Endpoints

```http
GET /api/musicians/me/analytics
```

---

## 5. 📬 Candidatures

### Description
Candidatures/invitations **reçues** des établissements.

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Candidatures reçues - 8 nouvelles                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🏢 Le Blue Note                                  │    │
│  │ 🎤 Concert Rock • 15 Mars 21h-23h                │    │
│  │ 💰 150 € proposés                                │    │
│  │                                                   │    │
│  │ 💬 "Nous aimerions vous inviter pour une soirée  │    │
│  │     Rock avec reprises 70's-80's..."             │    │
│  │                                                   │    │
│  │ [✅ Accepter] [❌ Refuser] [👁️ Voir établissement]│    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🏢 Rock Café                                     │    │
│  │ 🎸 Jam Session • 20 Mars 20h-23h                 │    │
│  │ 💰 Gratuit (participation libre)                 │    │
│  │                                                   │    │
│  │ 💬 "Jam Session ouverte tous styles..."         │    │
│  │                                                   │    │
│  │ [✅ Accepter] [❌ Refuser] [👁️ Voir établissement]│    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Données

| Champ | Type | Exemple |
|-------|------|---------|
| `id` | String | "app_123" |
| `venue_id` | String | "venue_456" |
| `venue_name` | String | "Le Blue Note" |
| `event_type` | String | "concert", "jam" |
| `date` | Date | "2024-03-15" |
| `start_time` | Time | "21:00" |
| `end_time` | Time | "23:00" |
| `proposed_amount` | Number | 150 (€) |
| `message` | Text | "Nous aimerions..." |
| `status` | Enum | "pending", "accepted", "refused" |

### Actions

- ✅ **Accepter** : Confirmer participation
- ❌ **Refuser** : Décliner l'offre
- 👁️ **Voir établissement** : Navigation vers profil

### API Endpoints

```http
GET /api/applications/received
PUT /api/applications/{id}
  Body: { status: "accepted" }
```

### Code React Native

```javascript
const CandidaturesTab = () => {
  const [applications, setApplications] = useState([]);
  
  const handleAccept = async (appId) => {
    try {
      await api.put(`/applications/${appId}`, { status: 'accepted' });
      Toast.show({ text: 'Candidature acceptée !' });
      fetchApplications();
    } catch (error) {
      Toast.show({ text: 'Erreur', type: 'error' });
    }
  };
  
  return (
    <FlatList
      data={applications}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.venueName}>🏢 {item.venue_name}</Text>
          <Text style={styles.eventType}>
            {item.event_type} • {formatDate(item.date)}
          </Text>
          {item.proposed_amount > 0 && (
            <Text style={styles.amount}>💰 {item.proposed_amount} €</Text>
          )}
          <Text style={styles.message}>{item.message}</Text>
          
          <View style={styles.actions}>
            <Button 
              title="Accepter" 
              onPress={() => handleAccept(item.id)}
              variant="primary"
            />
            <Button 
              title="Refuser" 
              onPress={() => handleRefuse(item.id)}
              variant="outline"
            />
          </View>
        </View>
      )}
      keyExtractor={(item) => item.id}
    />
  );
};
```

---

## 6. 📤 Mes Candidatures

### Description
Candidatures **envoyées** par le musicien aux établissements.

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Mes candidatures envoyées                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🏢 Jazz Club                                     │    │
│  │ 🎤 Concert Jazz • 25 Mars 20h                    │    │
│  │ 📅 Envoyée le 10 Mars                            │    │
│  │ Statut : ⏳ En attente                           │    │
│  │ [❌ Annuler]                                     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🏢 Le Blue Note                                  │    │
│  │ 🎸 Jam Session • 30 Mars 21h                     │    │
│  │ 📅 Envoyée le 12 Mars                            │    │
│  │ Statut : ✅ Acceptée                             │    │
│  │ [👁️ Voir détails]                                │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🏢 Rock Café                                     │    │
│  │ 🎤 Concert Rock • 18 Mars 22h                    │    │
│  │ 📅 Envoyée le 05 Mars                            │    │
│  │ Statut : ❌ Refusée                              │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Statuts

- ⏳ **En attente** : Pas encore de réponse
- ✅ **Acceptée** : Participation confirmée
- ❌ **Refusée** : Candidature déclinée

### API Endpoints

```http
GET /api/applications/sent
DELETE /api/applications/{id}
```

---

## 7. 🎤 Mes Participations

### Description
Événements confirmés où le musicien joue.

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Mes Participations - 5 événements                      │
│  [Filtrer ▼] [Trier ▼]                                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  À venir (3)                                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🎤 Concert Rock                                  │    │
│  │ 🏢 Le Blue Note • Paris 11ème                    │    │
│  │ 📅 15 Mars 2024 • ⏰ 21h-23h                     │    │
│  │ 💰 150 €                                         │    │
│  │ Badge : ✅ Confirmé                              │    │
│  │                                                   │    │
│  │ [👁️ Détails] [💬 Contacter] [❌ Annuler]        │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🎸 Jam Session Blues                             │    │
│  │ 🏢 Rock Café • Paris 10ème                       │    │
│  │ 📅 20 Mars 2024 • ⏰ 20h-23h                     │    │
│  │ 💰 Gratuit                                       │    │
│  │ Badge : ✅ Confirmé                              │    │
│  │                                                   │    │
│  │ [👁️ Détails] [💬 Contacter] [❌ Annuler]        │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Passées (2)                                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🎤 Concert Jazz                                  │    │
│  │ 🏢 Jazz Club • Paris 5ème                        │    │
│  │ 📅 08 Mars 2024 • ⏰ 20h-22h                     │    │
│  │ Badge : ✓ Terminé                                │    │
│  │                                                   │    │
│  │ [⭐ Laisser un avis]                             │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### API Endpoints

```http
GET /api/musicians/me/participations
DELETE /api/events/{id}/leave
POST /api/reviews
```

---

## 8. 👥 Musiciens

### Description
Réseau de musiciens (recherche, profils, amis).

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Réseau de musiciens                                    │
│  [🔍 Rechercher..._______________] [Filtres ▼]         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 👤 Jane Smith                  [➕ Ajouter ami] │    │
│  │ 🎹 Pianiste • Lyon                               │    │
│  │ 🎵 Jazz, Soul, Funk                              │    │
│  │ ⭐⭐⭐⭐⭐ (4.9)                                  │    │
│  │ 🟢 En ligne                                      │    │
│  │ [👁️ Voir profil] [💬 Message]                   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### API Endpoints

```http
GET /api/musicians?search=...&styles=...
POST /api/friends/request
```

---

## 9. 🏢 Établissements

### Description
Liste des établissements (bars, salles de concert).

### UI (similaire à Tab 8)

### API Endpoints

```http
GET /api/venues
POST /api/venues/{id}/subscribe
```

---

## 10. 👫 Amis

### Description
Gestion des amis musiciens.

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Mes amis - 12 personnes                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 👤 John Doe                    🟢 En ligne      │    │
│  │ 🎸 Guitariste • Paris                            │    │
│  │ Dernière activité : Il y a 5 min                 │    │
│  │ [👁️ Profil] [💬 Message] [❌ Retirer]           │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### API Endpoints

```http
GET /api/friends
DELETE /api/friends/{id}
```

---

## 11. 🔗 Connexions

### Description
Établissements suivis (abonnements).

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Mes connexions - 8 établissements                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🏢 Le Blue Note                                  │    │
│  │ 📍 Paris 11ème • Jazz, Blues                     │    │
│  │ 🔔 3 nouvelles annonces                          │    │
│  │ [👁️ Profil] [🔕 Se désabonner]                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### API Endpoints

```http
GET /api/musicians/me/subscriptions
DELETE /api/venues/{id}/unsubscribe
```

---

## 12. 🎸 Groupes

### Description
Gestion des groupes musicaux.

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Mes Groupes                                            │
│  [➕ Créer un groupe]  [🔗 Rejoindre avec code]         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🎸 The Rockers                                   │    │
│  │ Type : Groupe de reprise                         │    │
│  │ Membres : 👤👤👤 (3)                              │    │
│  │ Code invitation : ABC123 [📋 Copier]             │    │
│  │                                                   │    │
│  │ [📅 Planning] [👥 Gérer] [🚪 Quitter]            │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Modal Création

```
┌─────────────────────────────────────────────────────────┐
│  ✕              Créer un groupe                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Nom du groupe *                                        │
│  [The Rockers_____________________________]             │
│                                                          │
│  Type de groupe *                                       │
│  [Groupe de reprise ▼]                                  │
│                                                          │
│  Répertoire *                                           │
│  ◉ Reprises  ○ Compos  ○ Mix                           │
│                                                          │
│  🎵 Styles musicaux *                                   │
│  ☑️ Rock  ☑️ Blues  ☐ Jazz                             │
│                                                          │
│  Durée du spectacle                                     │
│  [1h30 ▼]                                               │
│                                                          │
│  Description                                            │
│  ┌──────────────────────────────────────┐               │
│  │ Groupe de reprises Rock/Blues...     │               │
│  └──────────────────────────────────────┘               │
│                                                          │
│  [Annuler]                        [✅ Créer]            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Code d'Invitation

Chaque groupe a un **code unique auto-généré** (ex: `ABC123`) pour inviter des membres.

### API Endpoints

```http
POST /api/bands
POST /api/bands/join
  Body: { code: "ABC123" }
GET /api/bands/my
```

---

## 🎯 Résumé pour l'Agent Mobile

### Checklist d'Implémentation

```
✅ Tab 1 : Carte
 ☐ MapView avec clustering
 ☐ Géolocalisation
 ☐ Filtres styles
 ☐ Recherche ville
 ☐ Toggle réduire/agrandir

✅ Tab 2 : Planning
 ☐ Calendrier
 ☐ Voir README_PLANNING_SYSTEM.md

✅ Tab 3-4 : PRO uniquement
 ☐ Vérifier is_pro
 ☐ Comptabilité
 ☐ Analytics (graphs)

✅ Tab 5-7 : Candidatures & Participations
 ☐ Liste avec actions
 ☐ Accepter/Refuser
 ☐ Annuler

✅ Tab 8-11 : Réseau social
 ☐ Recherche
 ☐ Filtres
 ☐ Actions (ami, message, suivre)

✅ Tab 12 : Groupes
 ☐ Création groupe
 ☐ Code invitation
 ☐ Gestion membres
```

---

<div align="center">

**Guide complet des 12 onglets du Dashboard Musicien** ✅

</div>
