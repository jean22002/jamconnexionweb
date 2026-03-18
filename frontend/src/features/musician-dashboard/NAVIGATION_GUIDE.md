# 🧭 Guide de Navigation - MusicianDashboard.jsx

## 📍 Navigation Rapide par Ligne

Utilisez `Ctrl+G` (VS Code) ou `:` (Vim) pour aller directement à une ligne.

---

## 🎯 **Sections Principales**

| Section | Lignes | Description |
|---------|--------|-------------|
| **Imports** | 1-48 | Tous les imports (React, Leaflet, UI, composants) |
| **Configuration** | 50-74 | API URL, constantes, types de groupes |
| **Composants Helper Carte** | 77-146 | MapEventHandler, SetViewOnLocation, FollowUser |
| **Début Composant** | 148-153 | Déclaration + contextes |
| **États** | 155-410 | Tous les useState (~61 états) |
| **Handlers** | 163-318 | Gestionnaires (recherche ville, position) |
| **Fetch Functions** | 320-1290 | Récupération données API (~13 fonctions) |
| **useEffect Hooks** | ~350-800 | Hooks d'effets (chargement, polling) |
| **Rendu JSX** | 1300-4145 | Retour du composant (UI complète) |

---

## 🔍 **Navigation par Fonctionnalité**

### **🗺️ Carte & Géolocalisation**

| Fonctionnalité | Lignes | Mots-clés |
|----------------|--------|-----------|
| Handle Search City | ~163-197 | `handleSearchCity`, Nominatim API |
| Handle Position Change | ~301-318 | `handlePositionChange`, GPS |
| Fetch Nearby Venues | ~320-416 | `fetchNearbyVenues`, rayon recherche |
| Map Center State | ~198 | `mapCenter`, `setMapCenter` |
| User Moved Map | ~199 | `userHasMovedMap` |
| Search Radius | ~270 | `searchRadius`, cercle |
| Follow User Mode | ~251 | `followUser` |

### **👤 Profil**

| Fonctionnalité | Lignes | Mots-clés |
|----------------|--------|-----------|
| Fetch Profile | ~485-533 | `fetchProfile`, `/musicians/by-user` |
| Save Profile | (dans JSX) | `handleSave`, PUT request |
| Profile Form State | ~361-370 | `profileForm`, infos générales |
| Solo Profile State | ~407-415 | `soloProfile`, artiste solo |
| Editing Mode | ~201 | `editingProfile` |

### **🎸 Groupes**

| Fonctionnalité | Lignes | Mots-clés |
|----------------|--------|-----------|
| Fetch Bands | ~681-989 | `fetchBands`, filtres |
| Current Band State | ~376-406 | `currentBand`, création/édition |
| Band Filters | ~256-263 | `bandFilters`, recherche |
| Band Dialog | ~375 | `showBandDialog` |
| Band Search Mode | ~267 | `bandSearchMode` |

### **📋 Candidatures & Applications**

| Fonctionnalité | Lignes | Mots-clés |
|----------------|--------|-----------|
| Candidatures State | ~227 | `candidatures` |
| Candidature Filters | ~229-235 | `candidatureFilters`, date/région |
| My Applications | ~238 | `myApplications` |
| Fetch My Applications | ~991-1020 | `fetchMyApplications` |

### **👥 Amis & Réseau**

| Fonctionnalité | Lignes | Mots-clés |
|----------------|--------|-----------|
| Fetch Friends | ~560-593 | `fetchFriends`, demandes, abonnements |
| Friends State | ~205 | `friends` |
| Friend Requests | ~206 | `friendRequests` |
| Sent Requests | ~207 | `sentRequests` |
| Blocked Users | ~208 | `blockedUsers` |
| Fetch Blocked Users | ~1278-1289 | `fetchBlockedUsers` |
| Subscriptions | ~209 | `subscriptions` (venues) |

### **📅 Calendrier & Événements**

| Fonctionnalité | Lignes | Mots-clés |
|----------------|--------|-----------|
| Fetch Calendar Events | ~1022-1163 | `fetchCalendarEvents` |
| Calendar State | ~283-288 | `currentMonth`, `calendarEvents` |
| Events By Date | ~285 | `eventsByDate` mapping |
| Selected Date | ~286 | `selectedDate` |
| Event Modal | ~287 | `showEventModal` |
| Venue Events Modal | ~277-280 | `showVenueEventsModal` |
| Fetch Venue Events | ~1165-1276 | `fetchVenueEvents` |

### **🔔 Notifications & Messages**

| Fonctionnalité | Lignes | Mots-clés |
|----------------|--------|-----------|
| Fetch Notifications | ~535-545 | `fetchNotifications` |
| Fetch Unread Messages | ~547-558 | `fetchUnreadMessages` |
| Notifications State | ~202-204 | `notifications`, `unreadCount` |
| Polling Notifications | (useEffect) | setInterval(30000) |

### **🎭 Participations**

| Fonctionnalité | Lignes | Mots-clés |
|----------------|--------|-----------|
| Fetch Participations | ~595-605 | `fetchParticipations` |
| Current Participation | ~607-679 | `fetchCurrentParticipation` |
| Participations State | ~210 | `participations` |
| Current Participation State | ~222 | `currentParticipation` |

---

## 🎨 **Navigation par Onglet (JSX)**

### **Onglets Intégrés dans MusicianDashboard.jsx**

| Onglet | Valeur | Lignes Approx. | Contenu Principal |
|--------|--------|----------------|-------------------|
| **Map** | `"map"` | Layout principal | Carte interactive Leaflet |
| **Profile > Info** | `"info"` | 1438-1636 | Infos personnelles, contact, localisation |
| **Profile > Styles** | `"styles"` | 1639-1711 | Styles musicaux, niveau |
| **Profile > Solo** | `"solo"` | 1714-2018 | Profil artiste solo, répertoire |
| **Profile > Band** | `"band"` | 2021-2116 | Groupes du musicien |
| **Profile > Concerts** | `"concerts"` | 2118-2168 | Historique concerts |
| **Profile > Settings** | `"settings"` | 2171-2300+ | Paramètres, mot de passe |

### **Onglets Extraits (Composants Séparés)**

| Onglet | Composant | Fichier | Description |
|--------|-----------|---------|-------------|
| **Candidatures** | `<CandidaturesTab />` | `/components/candidatures/` | Événements disponibles |
| **Venues** | `<VenuesTab />` | `/components/venues/` | Recherche venues |
| **Groupes** | `<BandsTab />` | `/components/bands/` | Recherche groupes |
| **Applications** | `<MyApplicationsTab />` | `/components/applications/` | Mes candidatures |
| **Participations** | `<ParticipationsTab />` | `/components/participations/` | Historique |
| **Musiciens** | `<MusiciansTab />` | `/components/musicians/` | Recherche musiciens |
| **Amis** | `<FriendsTab />` | `/components/friends/` | Gestion amis |

---

## 🏗️ **Structure du Rendu JSX**

```
MusicianDashboard Component (ligne 148)
│
├── DashboardNotification (ligne ~1305)
│
├── Header (~1310-1430)
│   ├── Logo & Nom (Mobile + Desktop)
│   ├── Navigation Desktop (1320-1400)
│   │   ├── Notifications (1325-1380)
│   │   ├── Icônes (Trophées, Badges, Messages)
│   │   └── Logout
│   │
│   └── Navigation Mobile (1402-1428)
│       └── Hamburger Menu
│
├── Main Layout avec Carte (1432-4145)
│   │
│   ├── Carte Leaflet (Colonne Gauche)
│   │   ├── MapContainer (TileLayer)
│   │   ├── SetViewOnLocation (centre carte)
│   │   ├── MapEventHandler (détecte mouvements)
│   │   ├── FollowUser (mode suivi)
│   │   ├── Circle (rayon recherche)
│   │   ├── Markers Venues (avec Popup)
│   │   └── Markers Musiciens
│   │
│   └── Tabs Container (Colonne Droite) (1435-4145)
│       ├── TabsList (sélecteur onglets)
│       │
│       └── TabsContent (chaque onglet)
│           ├── Profile (Sous-tabs)
│           │   ├── Info Tab (1438-1636)
│           │   ├── Styles Tab (1639-1711)
│           │   ├── Solo Tab (1714-2018)
│           │   ├── Band Tab (2021-2116)
│           │   ├── Concerts Tab (2118-2168)
│           │   └── Settings Tab (2171-2300+)
│           │
│           ├── <CandidaturesTab /> (Composant)
│           ├── <VenuesTab /> (Composant)
│           ├── <BandsTab /> (Composant)
│           ├── <MyApplicationsTab /> (Composant)
│           ├── <ParticipationsTab /> (Composant)
│           ├── <MusiciansTab /> (Composant)
│           └── <FriendsTab /> (Composant)
```

---

## 🔎 **Recherche Rapide par Mot-Clé**

### **Mots-clés Utiles**

| Chercher | Pour trouver |
|----------|--------------|
| `const [` | Tous les états |
| `useEffect` | Tous les hooks d'effet |
| `useCallback` | Fonctions mémoïsées |
| `const fetch` | Toutes les fonctions fetch |
| `async` | Fonctions asynchrones |
| `TabsContent value=` | Début de chaque onglet |
| `axios.post` | Requêtes POST |
| `axios.put` | Requêtes PUT |
| `axios.get` | Requêtes GET |
| `toast.` | Notifications toast |
| `Dialog open=` | Toutes les modales |
| `MapContainer` | Carte Leaflet |
| `Marker` | Marqueurs sur carte |
| `useMap` | Hooks Leaflet |

---

## 🐛 **Débogage Rapide**

### **Console Logs Existants**

| Message Console | Localisation | Usage |
|-----------------|--------------|-------|
| `"Calling fetchNearbyVenues..."` | ~329 | Recherche venues |
| `"Error fetching nearby venues:"` | ~397 | Erreur venues |
| `"Error searching city:"` | ~192 | Erreur recherche ville |
| `"Position changed:"` | ~305 | Changement position GPS |

### **Points de Breakpoint Recommandés**

- **Ligne ~320** : Début fetchNearbyVenues
- **Ligne ~485** : Début fetchProfile
- **Ligne ~560** : Début fetchFriends
- **Ligne ~681** : Début fetchBands
- **Ligne ~1022** : Début fetchCalendarEvents
- **Ligne ~163** : Début handleSearchCity

---

## 📚 **Références Rapides**

### **APIs Utilisées**

| Route | Méthode | Fonction | Ligne |
|-------|---------|----------|-------|
| `/musicians/by-user/${userId}` | GET | fetchProfile | ~485 |
| `/musicians/search/nearby` | POST | fetchNearbyVenues | ~320 |
| `/musicians` | GET | fetchData (musicians) | ~418 |
| `/venues` | GET | fetchData (venues) | ~418 |
| `/notifications` | GET | fetchNotifications | ~535 |
| `/messages/unread/count` | GET | fetchUnreadMessages | ~547 |
| `/friends` | GET | fetchFriends | ~560 |
| `/musicians/${id}/participations` | GET | fetchParticipations | ~595 |
| `/musicians/${id}/bands` | GET | fetchBands | ~681 |
| `/musicians/${id}/applications` | GET | fetchMyApplications | ~991 |
| `/calendar/events/musician` | GET | fetchCalendarEvents | ~1022 |
| `/venues/${id}/events` | GET | fetchVenueEvents | ~1165 |
| `/blocked-users` | GET | fetchBlockedUsers | ~1278 |

### **APIs Externes**

- **Nominatim (OpenStreetMap)** : Geocoding (ligne ~169)
  * URL : `https://nominatim.openstreetmap.org/search`
  * Usage : Recherche de ville par nom

---

### **Constantes Importantes**

- **API** : `${process.env.REACT_APP_BACKEND_URL}/api`
- **BAND_TYPES** : Lignes 51-62 (types de groupes)
- **REPERTOIRE_TYPES** : Ligne 64 (Compos/Reprises)
- **SHOW_DURATIONS** : Lignes 66-72 (durées spectacles)
- **MUSIC_STYLES_LIST** : Importé depuis data
- **DEPARTEMENTS_FRANCE** : Importé depuis data
- **REGIONS_FRANCE** : Importé depuis data

---

## 💡 **Astuces de Navigation**

1. **Plier les sections** : Utilisez la fonction "fold" pour cacher les grandes sections
2. **Minimap** : Activez la minimap (VS Code) pour voir la structure globale
3. **Outline** : Utilisez le panneau "Outline" pour voir tous les symboles
4. **Breadcrumbs** : Activez les breadcrumbs pour voir où vous êtes
5. **Go to Definition** : `F12` sur n'importe quelle fonction
6. **Find All References** : `Shift+F12` pour trouver toutes les utilisations

---

## 🌍 **Spécificités Leaflet**

### **Hooks Leaflet Personnalisés**

| Hook | Fichier | Description |
|------|---------|-------------|
| `useMap()` | Composant SetViewOnLocation | Accès à l'instance map |
| `useMapEvents()` | Composant MapEventHandler | Écoute événements carte |

### **Icônes Leaflet**

Les icônes par défaut de Leaflet sont configurées :
```javascript
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({...});
```

### **Position Marker**

Le marqueur de position de l'utilisateur utilise une icône personnalisée (lignes ~1700+).

---

## 📊 **États par Catégorie - Référence Rapide**

| Catégorie | Nombre | Lignes |
|-----------|--------|--------|
| Carte & Navigation | 9 | 155-272 |
| Profil | 3 | 200-201, 361-415 |
| Notifications | 3 | 202-204 |
| Amis & Réseau | 5 | 205-209 |
| Candidatures | 3 | 227-239 |
| Géolocalisation | 2 | 250-251 |
| Groupes | 9 | 254-269 |
| Événements | 7 | 277-288 |
| Messagerie | 2 | 264-269 |
| Paramètres | 2 | 242-247 |
| Général | 5 | 157-158, 211-224 |
| **TOTAL** | **~61** | |

---

**📌 Dernier Update :** Mars 2026  
**📖 Documentation Complète :** [README.md](./README.md)
