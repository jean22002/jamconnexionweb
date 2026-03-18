# 📊 Diagrammes de Flux - MusicianDashboard

## 🔄 Flux de Chargement Initial

```
┌─────────────────────────────────────────────────────────────┐
│                 MusicianDashboard Mount                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────┐
          │   useAuth Context      │
          │   - user               │
          │   - token              │
          └────────┬───────────────┘
                   │
                   ▼
          ┌────────────────────────┐
          │   fetchProfile()       │
          │   GET /musicians/...   │
          └────────┬───────────────┘
                   │
                   ├─── Success ───┐
                   │                │
                   │                ▼
                   │     ┌──────────────────────┐
                   │     │  setProfile(data)    │
                   │     │  triggerBadgeCheck() │
                   │     └──────────┬───────────┘
                   │                │
                   │                ▼
                   │     ┌────────────────────────────┐
                   │     │   Fetch en parallèle:      │
                   │     │   - fetchFriends()         │
                   │     │   - fetchNotifications()   │
                   │     │   - fetchParticipations()  │
                   │     └────────────────────────────┘
                   │
                   └─── Error ─────┐
                                   │
                                   ▼
                         ┌─────────────────┐
                         │  toast.error()  │
                         │  setLoading...  │
                         └─────────────────┘
```

---

## 🗺️ Flux de Géolocalisation & Carte

```
┌──────────────────────────────────────────────────────────────┐
│              useAutoGeolocation Hook                         │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────┐
          │  navigator.geolocation │
          │  .watchPosition()      │
          └────────┬───────────────┘
                   │
                   ├─── Permission Granted ───┐
                   │                           │
                   │                           ▼
                   │                ┌──────────────────────┐
                   │                │  setPosition(coords) │
                   │                └──────────┬───────────┘
                   │                           │
                   │                           ▼
                   │                ┌──────────────────────────┐
                   │                │  handlePositionChange()  │
                   │                │  - Update mapCenter      │
                   │                │  - Reverse geocode       │
                   │                │  - fetchNearbyVenues()   │
                   │                └──────────────────────────┘
                   │
                   └─── Permission Denied ────┐
                                              │
                                              ▼
                                     ┌────────────────┐
                                     │  Default pos   │
                                     │  (France)      │
                                     └────────────────┘
```

---

## 🔍 Flux de Recherche de Venues à Proximité

```
┌──────────────────────────────────────────────────────────────┐
│         User changes search radius OR position               │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────────────┐
          │  fetchNearbyVenues(lat, lng)   │
          │  POST /musicians/search/nearby │
          │  { lat, lng, radius }          │
          └────────┬───────────────────────┘
                   │
                   ├── Success ──┐
                   │              │
                   │              ▼
                   │   ┌───────────────────────────┐
                   │   │  setNearbyVenues([...])   │
                   │   │  Update map markers       │
                   │   │  toast.success()          │
                   │   └───────────────────────────┘
                   │
                   └── Error ────┐
                                 │
                                 ▼
                        ┌────────────────┐
                        │  toast.error() │
                        └────────────────┘
```

---

## 🎸 Flux de Création de Groupe

```
┌──────────────────────────────────────────────────────────────┐
│         User clicks "Ajouter un groupe" button               │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────────┐
          │  setShowBandDialog(true)   │
          │  Open dialog               │
          └────────┬───────────────────┘
                   │
                   │ User fills form
                   │ - name, type
                   │ - music styles
                   │ - members
                   │ - links
                   │
                   ▼
          ┌────────────────────────┐
          │  User clicks "Créer"   │
          └────────┬───────────────┘
                   │
                   ▼
          ┌────────────────────────────────┐
          │  POST /musicians/{id}/bands    │
          │  { name, type, members, ... }  │
          └────────┬───────────────────────┘
                   │
                   ├── Success ──┐
                   │              │
                   │              ▼
                   │   ┌───────────────────────┐
                   │   │  toast.success()      │
                   │   │  Close dialog         │
                   │   │  Add to bands array   │
                   │   └───────────────────────┘
                   │
                   └── Error ────┐
                                 │
                                 ▼
                        ┌────────────────┐
                        │  toast.error() │
                        └────────────────┘
```

---

## 📋 Flux de Candidature à un Événement

```
┌──────────────────────────────────────────────────────────────┐
│       User navigates to "Candidatures" tab                   │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────────────┐
          │  <CandidaturesTab />           │
          │  Component loads               │
          └────────┬───────────────────────┘
                   │
                   │ Displays list of events
                   │ User clicks "Postuler"
                   │
                   ▼
          ┌────────────────────────────────┐
          │  POST /applications            │
          │  { event_id, musician_id, ... }│
          └────────┬───────────────────────┘
                   │
                   ├── Success ──┐
                   │              │
                   │              ▼
                   │   ┌───────────────────────┐
                   │   │  toast.success()      │
                   │   │  "Candidature envoyée"│
                   │   │  Update UI            │
                   │   └───────────────────────┘
                   │
                   └── Error ────┐
                                 │
                                 ▼
                        ┌────────────────┐
                        │  toast.error() │
                        └────────────────┘
```

---

## 👥 Flux d'Ajout d'Ami

```
┌──────────────────────────────────────────────────────────────┐
│         User searches musician and clicks "Add friend"       │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────────────┐
          │  POST /friends/request         │
          │  { friend_id }                 │
          └────────┬───────────────────────┘
                   │
                   ├── Success ──┐
                   │              │
                   │              ▼
                   │   ┌────────────────────────────┐
                   │   │  toast.success()           │
                   │   │  "Demande envoyée"         │
                   │   │  Add to sentRequests       │
                   │   │  Notification sent to user │
                   │   └────────────────────────────┘
                   │
                   └── Error ────┐
                                 │
                                 ▼
                        ┌────────────────┐
                        │  toast.error() │
                        └────────────────┘
```

---

## 💾 Flux de Sauvegarde du Profil

```
┌──────────────────────────────────────────────────────────────┐
│        User edits profile and clicks "Sauvegarder"           │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────────┐
          │  Validate form             │
          │  - Required fields         │
          └────────┬───────────────────┘
                   │
                   ▼
          ┌─────────────────────────────────┐
          │  PUT /musicians/${profile.id}   │
          │  { name, styles, city, ... }    │
          └────────┬────────────────────────┘
                   │
                   ├── Success ──┐
                   │              │
                   │              ▼
                   │   ┌────────────────────────────┐
                   │   │  toast.success()           │
                   │   │  setProfile(updated)       │
                   │   │  setEditingProfile(false)  │
                   │   │  triggerBadgeCheck()       │
                   │   └────────────────────────────┘
                   │
                   └── Error ────┐
                                 │
                                 ▼
                        ┌──────────────────────┐
                        │  toast.error()       │
                        └──────────────────────┘
```

---

## 🔄 Flux de Polling (Notifications & Messages)

```
┌──────────────────────────────────────────────────────────────┐
│                  Component is Mounted                        │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────────────┐
          │  useEffect with token dep      │
          │  setInterval(30000)            │
          └────────┬───────────────────────┘
                   │
                   ├─────────────┐
                   │             │
                   ▼             ▼
      ┌──────────────────┐  ┌──────────────────┐
      │ Every 30 seconds │  │ Every 30 seconds │
      │ fetchNotifications│  │ fetchUnread...   │
      └──────────┬─────────  └──────────┬───────┘
                 │                      │
                 ▼                      ▼
      ┌──────────────────┐  ┌──────────────────┐
      │ setNotifications │  │ setUnreadMessages│
      │ setUnreadCount   │  │ Count            │
      └──────────────────┘  └──────────────────┘
                   │
                   │ On Unmount
                   │
                   ▼
          ┌────────────────────────┐
          │  clearInterval(...)    │
          └────────────────────────┘
```

---

## 🗺️ Flux d'Interaction Carte

```
┌──────────────────────────────────────────────────────────────┐
│              User interacts with map                         │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ├── Drag/Zoom (Manual) ──┐
                       │                         │
                       │                         ▼
                       │              ┌──────────────────────┐
                       │              │ MapEventHandler      │
                       │              │ - setUserHasMovedMap │
                       │              │ - Disable auto center│
                       │              └──────────────────────┘
                       │
                       ├── Search City ──────────┐
                       │                         │
                       │                         ▼
                       │              ┌──────────────────────┐
                       │              │ handleSearchCity()   │
                       │              │ - Nominatim API      │
                       │              │ - setMapCenter       │
                       │              └──────────────────────┘
                       │
                       ├── Toggle Follow Mode ───┐
                       │                         │
                       │                         ▼
                       │              ┌──────────────────────┐
                       │              │ setFollowUser(!...)  │
                       │              │ <FollowUser />       │
                       │              │ Auto-center on GPS   │
                       │              └──────────────────────┘
                       │
                       └── Click Marker ─────────┐
                                                 │
                                                 ▼
                                      ┌──────────────────────┐
                                      │ Show Popup           │
                                      │ Venue/Musician info  │
                                      └──────────────────────┘
```

---

## 📝 **Légende**

- `┌─┐` : Bloc d'action ou état
- `│` : Flux descendant
- `├─` : Branchement conditionnel
- `▼` : Direction du flux
- `───┐` : Début de condition
- `→` : Transition

---

**💡 Conseil :** Imprimez ces diagrammes ou gardez-les ouverts en référence lors du développement/debug.

**📖 Documentation Complète :** [README.md](./README.md)  
**🧭 Guide de Navigation :** [NAVIGATION_GUIDE.md](./NAVIGATION_GUIDE.md)