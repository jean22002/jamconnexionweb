# 📊 Diagramme de Flux - VenueDashboard

## 🔄 Flux de Chargement Initial

```
┌─────────────────────────────────────────────────────────────┐
│                    VenueDashboard Mount                     │
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
          │   GET /venues/by-user  │
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
                   │     ┌──────────────────────┐
                   │     │   fetchEvents()      │
                   │     │   (parallel fetch)   │
                   │     └──────────┬───────────┘
                   │                │
                   │                ▼
                   │     ┌──────────────────────────────┐
                   │     │  - setJams([...])           │
                   │     │  - setConcerts([...])       │
                   │     │  - setKaraokes([...])       │
                   │     │  - setSpectacles([...])     │
                   │     │  - setPlanningSlots([...])  │
                   │     │  - setBookedDates([...])    │
                   │     │  - setEventsByDate({...})   │
                   │     └─────────────────────────────┘
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

## 🎭 Flux de Création d'Événement (Concert)

```
┌──────────────────────────────────────────────────────────────┐
│         User clicks "Nouveau concert" button                 │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────┐
          │ setShowConcertDialog   │
          │      (true)            │
          └────────┬───────────────┘
                   │
                   ▼
          ┌────────────────────────┐
          │  Dialog opens with     │
          │  concertForm state     │
          └────────┬───────────────┘
                   │
                   │ User fills form
                   │ - date, time
                   │ - title, styles
                   │ - bands, catering
                   │ - accounting
                   │
                   ▼
          ┌────────────────────────┐
          │  User clicks "Créer"   │
          └────────┬───────────────┘
                   │
                   ▼
          ┌────────────────────────────┐
          │  createConcert()           │
          │  1. Validate form          │
          │  2. Check date available   │
          │     GET /events/check-date │
          └────────┬───────────────────┘
                   │
                   ├─── Date Occupied ───┐
                   │                      │
                   │                      ▼
                   │            ┌─────────────────────┐
                   │            │  toast.error()      │
                   │            │  "Date déjà prise"  │
                   │            └─────────────────────┘
                   │
                   └─── Date Available ──┐
                                         │
                                         ▼
                              ┌──────────────────────┐
                              │  POST /concerts      │
                              │  axios.post(...)     │
                              └──────────┬───────────┘
                                         │
                                         ├── Success ──┐
                                         │              │
                                         │              ▼
                                         │   ┌───────────────────────┐
                                         │   │  toast.success()      │
                                         │   │  Reset form           │
                                         │   │  Close dialog         │
                                         │   │  fetchEvents() reload │
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

## ✏️ Flux d'Édition d'Événement

```
┌──────────────────────────────────────────────────────────────┐
│       User clicks on an event card in any tab               │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────────────┐
          │  handleEditEvent(event, type)  │
          │  - setSelectedEvent(event)     │
          │  - setSelectedEventType(type)  │
          │  - setIsEditingEvent(false)    │
          │  - setShowEventDetailsModal... │
          └────────┬───────────────────────┘
                   │
                   ▼
          ┌────────────────────────┐
          │  Modal opens with      │
          │  event details         │
          │  (read-only mode)      │
          └────────┬───────────────┘
                   │
                   │ User clicks "Modifier"
                   │
                   ▼
          ┌────────────────────────┐
          │  setIsEditingEvent     │
          │      (true)            │
          └────────┬───────────────┘
                   │
                   │ User edits fields
                   │
                   ▼
          ┌────────────────────────────┐
          │  User clicks "Sauvegarder" │
          └────────┬───────────────────┘
                   │
                   ▼
          ┌────────────────────────────────┐
          │  handleEventUpdate()           │
          │  PUT /jams/{id}                │
          │  or /concerts/{id}             │
          │  or /karaoke/{id}              │
          │  or /spectacle/{id}            │
          └────────┬───────────────────────┘
                   │
                   ├── Success ──┐
                   │              │
                   │              ▼
                   │   ┌───────────────────────┐
                   │   │  toast.success()      │
                   │   │  Close modal          │
                   │   │  fetchEvents() reload │
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

## 🗑️ Flux de Suppression d'Événement

```
┌──────────────────────────────────────────────────────────────┐
│         User clicks "Supprimer" in event modal               │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────────────┐
          │  handleDeleteEvent()           │
          │  window.confirm("Confirmer?")  │
          └────────┬───────────────────────┘
                   │
                   ├── Cancel ───┐
                   │              │
                   │              ▼
                   │      ┌─────────────┐
                   │      │   Return    │
                   │      └─────────────┘
                   │
                   └── Confirm ──┐
                                 │
                                 ▼
                      ┌──────────────────────────┐
                      │  DELETE /events/{type}   │
                      │  axios.delete(...)       │
                      └──────────┬───────────────┘
                                 │
                                 ├── Success ──┐
                                 │              │
                                 │              ▼
                                 │   ┌───────────────────────┐
                                 │   │  toast.success()      │
                                 │   │  Close modal          │
                                 │   │  fetchEvents() reload │
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

## 📢 Flux de Broadcast

```
┌──────────────────────────────────────────────────────────────┐
│          User goes to "Notifications" tab                    │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────────────┐
          │  1. Select target:             │
          │     - subscribers (Jacks)      │
          │     - nearby musicians         │
          │  2. Type message               │
          │  3. Click "Envoyer"            │
          └────────┬───────────────────────┘
                   │
                   ▼
          ┌────────────────────────────────┐
          │  sendBroadcastNotification()   │
          │  - Validate message not empty  │
          │  - setSendingBroadcast(true)   │
          └────────┬───────────────────────┘
                   │
                   ▼
          ┌─────────────────────────────────────┐
          │  POST /broadcast/send               │
          │  {                                  │
          │    message,                         │
          │    target: "subscribers"/"nearby",  │
          │    venue_id,                        │
          │    venue_name                       │
          │  }                                  │
          └────────┬────────────────────────────┘
                   │
                   ├── Success ──┐
                   │              │
                   │              ▼
                   │   ┌────────────────────────────┐
                   │   │  toast.success()           │
                   │   │  Clear message input       │
                   │   │  fetchBroadcastHistory()   │
                   │   │  setSendingBroadcast...    │
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
          │  handleSave()              │
          │  - Validate required fields│
          │  - setSaving(true)         │
          └────────┬───────────────────┘
                   │
                   ▼
          ┌─────────────────────────────┐
          │  PUT /venues/${profile.id}  │
          │  axios.put(formData)        │
          └────────┬────────────────────┘
                   │
                   ├── Success ──┐
                   │              │
                   │              ▼
                   │   ┌────────────────────────────┐
                   │   │  toast.success()           │
                   │   │  setProfile(updated)       │
                   │   │  setEditing(false)         │
                   │   │  setSaving(false)          │
                   │   │  triggerBadgeCheck()       │
                   │   │  refreshUser()             │
                   │   └────────────────────────────┘
                   │
                   └── Error ────┐
                                 │
                                 ▼
                        ┌──────────────────────┐
                        │  toast.error()       │
                        │  setSaving(false)    │
                        └──────────────────────┘
```

---

## 📅 Flux de Clic sur Date du Calendrier

```
┌──────────────────────────────────────────────────────────────┐
│           User clicks a date in Planning tab                 │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────────────┐
          │  handleDateClick(date)         │
          │  - Check if date has events    │
          │    in eventsByDate             │
          └────────┬───────────────────────┘
                   │
                   ├─── No Event ───┐
                   │                 │
                   │                 ▼
                   │      ┌─────────────────────────┐
                   │      │  setSelectedDate(date)  │
                   │      │  setShowPlanningModal   │
                   │      │  (for creating slot)    │
                   │      └─────────────────────────┘
                   │
                   └─── Has Event(s) ──┐
                                        │
                                        ▼
                             ┌──────────────────────────┐
                             │  Fetch event details     │
                             │  based on event type     │
                             │  - jams / concerts etc.  │
                             └──────────┬───────────────┘
                                        │
                                        ▼
                             ┌──────────────────────────┐
                             │  setSelectedEvent(...)   │
                             │  setShowEventDetails...  │
                             │  (open modal)            │
                             └──────────────────────────┘
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

## 🎯 Flux de Contrôle d'Accès aux Onglets

```
┌──────────────────────────────────────────────────────────────┐
│              User tries to access a tab                      │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────────────┐
          │  canAccessTab(tabValue)        │
          │  - Check subscription_status   │
          │  - Check if expired            │
          └────────┬───────────────────────┘
                   │
                   ├─── Is Expired ───┐
                   │                   │
                   │                   ▼
                   │      ┌─────────────────────────┐
                   │      │  Allowed tabs:          │
                   │      │  - profile              │
                   │      │  - notifications        │
                   │      │  Return FALSE for rest  │
                   │      └─────────────────────────┘
                   │
                   └─── Not Expired ──┐
                                       │
                                       ▼
                              ┌────────────────┐
                              │  Return TRUE   │
                              │  (access OK)   │
                              └────────────────┘
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
