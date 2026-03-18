# 🎸 MusicianDashboard - Architecture & Documentation

## 📊 **Vue d'ensemble**

Le `MusicianDashboard.jsx` est le composant principal du tableau de bord des musiciens. Il gère l'ensemble des fonctionnalités pour les musiciens (solo et groupes), incluant la carte interactive, la recherche de venues, la gestion de profil, les candidatures, et les participations.

**Fichier principal :** `/app/frontend/src/pages/MusicianDashboard.jsx`  
**Taille actuelle :** ~4144 lignes  
**Complexité :** Élevée (partiellement refactorisé)

---

## 🗂️ **Structure du Fichier**

### **1. Imports & Configuration** (Lignes 1-74)
- Imports React & hooks
- Imports Leaflet (carte interactive)
- Imports des composants UI (shadcn)
- Imports des composants custom
- Configuration API et constantes
- Listes des types de groupes, répertoires, durées de spectacle

### **2. Composants Helper pour la Carte** (Lignes 77-146)
- `MapEventHandler` - Détection des mouvements manuels de la carte
- `SetViewOnLocation` - Centre la carte sur une position
- `FollowUser` - Suit la position de l'utilisateur en temps réel

### **3. Composant Principal** (Lignes 148-4145)

#### **3.1 Contextes & Hooks** (Lignes 149-153)
- `useAuth()` - Authentification
- `useBadgeAutoCheck()` - Système de badges
- `useNotifications()` - Notifications push

#### **3.2 États (useState)** (Lignes 155-410)

**~61 états organisés par catégorie :**

##### **États Carte & Navigation**
- `venues` - Liste des venues sur la carte
- `musicians` - Liste des musiciens
- `mapCenter` - Centre de la carte
- `userHasMovedMap` - Détecte si l'utilisateur a bougé la carte
- `searchCity` - Ville recherchée
- `searchingCity` - Chargement recherche ville
- `searchRadius` - Rayon de recherche (km)
- `showRadiusCircle` - Affichage du cercle de rayon
- `nearbyVenues` - Venues à proximité

##### **États Profil**
- `profile` - Profil du musicien
- `editingProfile` - Mode édition actif
- `profileForm` - Formulaire profil complet avec :
  * Informations générales
  * Contact
  * Styles musicaux
  * Instruments
  * Liens sociaux

##### **États Solo Performance**
- `soloProfile` - Profil artiste solo
  * Nom de scène
  * Description
  * Type de répertoire
  * Durée du spectacle
  * Matériel disponible

##### **États Groupes**
- `bands` - Liste des groupes du musicien
- `bandsLoading` - Chargement groupes
- `bandFilters` - Filtres de recherche groupes
- `selectedBand` - Groupe sélectionné
- `showBandDialog` - Dialogue création/édition groupe
- `showBandDetailsDialog` - Dialogue détails groupe
- `currentBand` - Groupe en cours d'édition
- `editingBandIndex` - Index du groupe édité
- `bandSearchMode` - Mode recherche ("filters" ou "map")
- `bandSearchRadius` - Rayon recherche groupes

##### **États Notifications & Messages**
- `notifications` - Liste des notifications
- `unreadCount` - Nombre non lus
- `unreadMessagesCount` - Messages non lus

##### **États Amis & Réseau**
- `friends` - Liste des amis
- `friendRequests` - Demandes d'amis reçues
- `sentRequests` - Demandes d'amis envoyées
- `blockedUsers` - Utilisateurs bloqués
- `subscriptions` - Abonnements aux venues

##### **États Candidatures**
- `candidatures` - Liste des candidatures disponibles
- `loadingCandidatures` - Chargement candidatures
- `candidatureFilters` - Filtres de recherche
  * Date début/fin
  * Région
  * Département
  * Style musical

##### **États Applications (Mes Candidatures)**
- `myApplications` - Mes candidatures envoyées
- `loadingMyApplications` - Chargement

##### **États Participations**
- `participations` - Historique participations
- `currentParticipation` - Participation active

##### **États Événements & Calendrier**
- `currentMonth` - Mois affiché
- `calendarEvents` - Événements du calendrier
- `eventsByDate` - Mapping date -> événements
- `selectedDate` - Date sélectionnée
- `showEventModal` - Modale événement
- `loadingCalendar` - Chargement calendrier
- `showVenueEventsModal` - Modale événements venue
- `selectedVenue` - Venue sélectionnée
- `venueEvents` - Événements de la venue (concerts, jams)
- `loadingVenueEvents` - Chargement

##### **États Géolocalisation**
- `geoEnabled` - Géolocalisation activée
- `followUser` - Suivre position utilisateur
- `position` (via useAutoGeolocation) - Position actuelle

##### **États Généraux**
- `loading` - Chargement général
- `loadingError` - Erreur de chargement
- `activeTab` - Onglet actif (persisté localStorage)
- `selectedRegion` - Région filtre
- `selectedDepartment` - Département filtre

##### **États Messagerie**
- `showMessageDialog` - Dialogue message
- `messageForm` - Formulaire message (subject, content)

##### **États Paramètres**
- `passwordForm` - Formulaire changement mot de passe
- `changingPassword` - Chargement changement

---

### **4. Fonctions Utilitaires & Handlers** (Lignes 163-318)

| Fonction | Description | Ligne |
|----------|-------------|-------|
| `handleSearchCity()` | Recherche ville et centre la carte | ~163 |
| `handlePositionChange()` | Gestion changement de position GPS | ~301 |

---

### **5. Fonctions de Récupération (Fetch)** (Lignes 320-1290)

| Fonction | Description | Ligne | Type |
|----------|-------------|-------|------|
| `fetchNearbyVenues()` | Récupère venues à proximité | ~320 | useCallback |
| `fetchData()` | Charge données initiales (venues, musiciens) | ~418 | useCallback |
| `fetchProfile()` | Récupère profil musicien | ~485 | useCallback |
| `fetchNotifications()` | Récupère notifications | ~535 | useCallback |
| `fetchUnreadMessages()` | Compte messages non lus | ~547 | useCallback |
| `fetchFriends()` | Récupère amis, demandes, abonnements | ~560 | useCallback |
| `fetchParticipations()` | Récupère participations | ~595 | useCallback |
| `fetchCurrentParticipation()` | Participation active | ~607 | useCallback |
| `fetchBands()` | Récupère groupes | ~681 | async |
| `fetchMyApplications()` | Récupère candidatures envoyées | ~991 | async |
| `fetchCalendarEvents()` | Récupère événements calendrier | ~1022 | async |
| `fetchVenueEvents()` | Récupère événements d'une venue | ~1165 | async |
| `fetchBlockedUsers()` | Récupère utilisateurs bloqués | ~1278 | async |

---

### **6. Hooks useEffect** (Lignes ~350-800)

| Hook | Déclencheur | Action |
|------|-------------|--------|
| useEffect #1 | `[token]` | Charge profil initial |
| useEffect #2 | `[token]` | Polling notifications (30s) |
| useEffect #3 | `[token]` | Polling messages (30s) |
| useEffect #4 | `[activeTab]` | Sauvegarde tab dans localStorage |
| useEffect #5 | `[position]` | Met à jour centre carte si géoloc active |
| useAutoGeolocation | Custom | Gestion automatique géolocalisation |

---

### **7. Rendu JSX** (Lignes 1300-4145)

#### **7.1 Header & Navigation** (Lignes ~1300-1430)
- Logo et nom de l'application
- Navigation desktop (notifications, trophées, badges, messages)
- Menu hamburger mobile
- Compteur d'abonnements

#### **7.2 Système d'Onglets** (Lignes 1430-4145)

Le dashboard utilise un système de **Tabs** avec 15+ onglets :

##### **Onglet: Map** (Intégré dans le layout)
- Carte interactive Leaflet
- Marqueurs venues et musiciens
- Recherche par ville
- Cercle de rayon de recherche
- Géolocalisation en temps réel

##### **Onglet: Profile**
- **Sous-onglet: Info** (Lignes 1438-1636)
  * Nom, prénom, téléphone
  * Date de naissance
  * Bio/description
  * Localisation (ville, région, département)
  * Liens sociaux (Instagram, Facebook, YouTube)
  * Disponibilité

- **Sous-onglet: Styles** (Lignes 1639-1711)
  * Sélection styles musicaux
  * Niveau de pratique
  * Styles favoris

- **Sous-onglet: Solo** (Lignes 1714-2018)
  * Profil artiste solo
  * Nom de scène
  * Description performance
  * Type de répertoire (Compos/Reprises)
  * Durée du spectacle
  * Matériel disponible (sono, lumière, etc.)

- **Sous-onglet: Band** (Lignes 2021-2116)
  * Liste des groupes du musicien
  * Création/édition de groupe
  * Type de groupe (duo, trio, quartet, etc.)
  * Membres du groupe
  * Styles musicaux
  * Liens et photos

- **Sous-onglet: Concerts** (Lignes 2118-2168)
  * Historique des concerts passés
  * Ajout de concerts passés
  * Détails (date, lieu, description)

- **Sous-onglet: Settings** (Lignes 2171-2300+)
  * Changement de mot de passe
  * Gestion du compte
  * Paramètres de géolocalisation
  * Background sync

##### **Onglets Extraits (Composants Séparés)**

Ces onglets ont déjà été refactorisés en composants :

| Onglet | Composant | Description |
|--------|-----------|-------------|
| **Candidatures** | `<CandidaturesTab />` | Liste événements disponibles pour candidater |
| **Venues** | `<VenuesTab />` | Recherche et exploration des venues |
| **Groupes** | `<BandsTab />` | Recherche de groupes et artistes |
| **Applications** | `<MyApplicationsTab />` | Mes candidatures envoyées |
| **Participations** | `<ParticipationsTab />` | Historique des participations |
| **Musiciens** | `<MusiciansTab />` | Recherche d'autres musiciens |
| **Amis** | `<FriendsTab />` | Gestion des amis et demandes |

---

## 🔗 **Dépendances Principales**

### **Contextes**
- `AuthContext` - Gestion authentification et utilisateur
- `BadgeContext` - Système de badges

### **Hooks Personnalisés**
- `useBadgeAutoCheck` - Vérification automatique badges
- `useAutoGeolocation` - Géolocalisation automatique
- `useNotifications` - Notifications push

### **Bibliothèques Externes**
- **Leaflet** - Carte interactive
  * MapContainer, TileLayer, Marker, Popup
  * Circle (rayon de recherche)
  * Custom hooks (useMap, useMapEvents)
- **Axios** - Requêtes API
- **React Router** - Navigation

### **Composants UI (shadcn)**
- Button, Input, Label, Textarea, Switch
- Tabs, Dialog, Sheet, Select, Slider
- Calendar

### **Composants Custom**
- `LazyImage` - Images lazy loaded
- `TimeSelect` - Sélecteur d'heure
- `MusicianImageUpload` - Upload d'images
- `OnlineStatusSelector` - Sélecteur statut en ligne
- `BackgroundSyncSettings` - Paramètres sync background
- `JoinEventButton` - Bouton rejoindre événement
- `SocialLinks` - Liens sociaux
- `DashboardNotification` - Notifications dashboard

---

## 🚧 **Points de Complexité**

### **Carte Interactive**
La carte Leaflet nécessite une gestion complexe :
- Synchronisation position GPS ↔ centre carte
- Détection des mouvements manuels (drag/zoom)
- Mode "suivre l'utilisateur" vs navigation libre
- Cercle de rayon dynamique
- Marqueurs multiples (venues, musiciens)

### **État Partagé Complexe**
Les états sont fortement couplés :
- La position GPS affecte `mapCenter`, `nearbyVenues`, `searchRadius`
- Le profil affecte les candidatures disponibles
- Les filtres affectent venues, groupes, candidatures

### **Formulaires Multiples Imbriqués**
- Profil avec 6 sous-sections (info, styles, solo, band, concerts, settings)
- Formulaires de groupe avec membres multiples
- Candidatures avec filtres avancés

### **Géolocalisation**
- Hook personnalisé `useAutoGeolocation`
- Gestion permissions navigateur
- Fallback si désactivé
- Mode "suivre" vs manuel

---

## 📝 **Refactoring Déjà Effectué**

### **✅ Composants Extraits**
7 onglets majeurs ont déjà été extraits :
1. CandidaturesTab
2. VenuesTab
3. BandsTab
4. MyApplicationsTab
5. ParticipationsTab
6. MusiciansTab
7. FriendsTab

### **Avantages**
- ✅ Réduction significative de la complexité
- ✅ Composants réutilisables
- ✅ Meilleure séparation des responsabilités
- ✅ Maintenance facilitée

---

## 📚 **Recommandations pour Refactoring Futur**

### **Phase 1 : Tests**
Avant tout refactoring additionnel, créer des tests E2E pour :
- ✅ Navigation carte et géolocalisation
- ✅ Création/édition profil (info, solo, band)
- ✅ Système de candidatures
- ✅ Gestion des amis
- ✅ Calendrier et événements

### **Phase 2 : Extraction Progressive** (Optionnel)
Si nécessaire, extraire les onglets restants :
1. Extraire ProfileInfoTab (info personnelles)
2. Extraire ProfileStylesTab (styles musicaux)
3. Extraire SoloProfileTab (artiste solo)
4. Extraire BandProfileTab (groupes)
5. Extraire ConcertsHistoryTab (concerts passés)
6. Extraire SettingsTab (paramètres)

### **Phase 3 : Hooks Personnalisés**
Créer des hooks pour la logique métier :
- `useMusicianProfile()` - Gestion profil
- `useMusicianBands()` - Gestion groupes
- `useMusicianApplications()` - Candidatures
- `useMapNavigation()` - Logique carte

### **Phase 4 : Optimisation**
- Mémoïsation avec `useMemo` et `useCallback`
- Lazy loading des onglets
- Optimisation de la carte (clustering)
- Pagination des listes longues

---

## 🐛 **Bugs Connus & Points d'Attention**

1. **Géolocalisation** : Si l'utilisateur refuse les permissions, la carte reste centrée sur la France. Amélioration possible : mémoriser la dernière position connue.

2. **Carte - Mode Suivre** : Le toggle "Suivre ma position" peut entrer en conflit avec la navigation manuelle. Le système détecte les mouvements manuels pour désactiver le suivi auto.

3. **Polling** : Les notifications et messages sont pollés toutes les 30s. Migration vers WebSockets recommandée pour le temps réel.

---

## 📚 **Resources & Liens**

- **API Backend** : `${REACT_APP_BACKEND_URL}/api`
- **Leaflet Docs** : https://leafletjs.com/
- **Styles musicaux** : `/app/frontend/src/data/music-styles.js`
- **Départements FR** : `/app/frontend/src/data/france-locations.js`
- **Nominatim API** : https://nominatim.openstreetmap.org/ (geocoding)

---

## 👥 **Contributeurs & Historique**

- **Version initiale** : Monolithe complet
- **Refactoring partiel** : Extraction de 7 composants d'onglets
- **Refactoring documentaire** : Mars 2026

---

## 🎯 **Métriques**

| Métrique | Valeur |
|----------|--------|
| Lignes de code | ~4144 |
| États (useState) | ~61 |
| Fonctions fetch | ~13 |
| Hooks useEffect | ~6 |
| Onglets | 15+ |
| Composants extraits | 7 ✅ |
| Composants importés | ~25 |

---

**📌 Note :** Ce document est un guide vivant. Mettez-le à jour lors de modifications importantes du MusicianDashboard.
