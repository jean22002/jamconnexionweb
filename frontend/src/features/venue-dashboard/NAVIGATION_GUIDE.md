# 🧭 Guide de Navigation - VenueDashboard.jsx

## 📍 Navigation Rapide par Ligne

Utilisez `Ctrl+G` (VS Code) ou `:` (Vim) pour aller directement à une ligne.

---

## 🎯 **Sections Principales**

| Section | Lignes | Description |
|---------|--------|-------------|
| **Imports** | 1-51 | Tous les imports (React, UI, composants custom) |
| **Configuration** | 52-67 | API URL, constantes, liste instruments |
| **Début Composant** | 69-88 | Déclaration du composant + contextes |
| **États** | 89-308 | Tous les useState (~50 états) |
| **Utilitaires** | 242-308 | Fonctions helper (isProfileComplete, etc.) |
| **Fetch Functions** | 310-936 | Récupération données API |
| **Handlers** | 606-1924 | Gestionnaires d'événements |
| **useEffect Hooks** | ~520-1020 | Hooks d'effets (chargement, polling) |
| **Rendu JSX** | 2153-7928 | Retour du composant (UI complète) |

---

## 🔍 **Navigation par Fonctionnalité**

### **🎭 Événements**

| Fonctionnalité | Lignes | Mots-clés |
|----------------|--------|-----------|
| Fetch Events | ~388-485 | `fetchEvents`, `Promise.allSettled` |
| Create Jam | ~1054-1113 | `createJam`, `/jams` |
| Create Concert | ~1115-1186 | `createConcert`, `/concerts` |
| Create Karaoke | ~1188-1241 | `createKaraoke`, `/karaoke` |
| Create Spectacle | ~1243-1296 | `createSpectacle`, `/spectacle` |
| Edit Event | ~1383-1478 | `handleEditEvent`, `setSelectedEvent` |
| Delete Event | ~1298-1353 | `handleDeleteEvent`, `axios.delete` |
| Update Event | ~1480-1653 | `handleEventUpdate`, événements PUT |

### **👤 Profil**

| Fonctionnalité | Lignes | Mots-clés |
|----------------|--------|-----------|
| Fetch Profile | ~310-387 | `fetchProfile`, `/venues/by-user` |
| Save Profile | ~606-757 | `handleSave`, `axios.put` |
| Upload Photo Gallery | ~2031-2091 | `handlePhotoUpload`, `FormData` |
| Delete Photo | ~2093-2115 | `handleDeletePhoto` |

### **💳 Abonnement**

| Fonctionnalité | Lignes | Mots-clés |
|----------------|--------|-----------|
| Subscribe | ~759-763 | `handleSubscribe`, `STRIPE_PAYMENT_LINK` |
| Cancel Renewal | ~765-786 | `handleCancelRenewal` |
| Reactivate | ~788-805 | `handleReactivateRenewal` |

### **📢 Notifications & Broadcast**

| Fonctionnalité | Lignes | Mots-clés |
|----------------|--------|-----------|
| Fetch Notifications | ~495-507 | `fetchNotifications` |
| Fetch Unread Messages | ~509-544 | `fetchUnreadMessages` |
| Send Broadcast | ~846-896 | `sendBroadcastNotification` |
| Fetch Broadcast History | ~818-827 | `fetchBroadcastHistory` |
| Fetch Subscribers | ~829-844 | `fetchSubscribers` |

### **⭐ Avis**

| Fonctionnalité | Lignes | Mots-clés |
|----------------|--------|-----------|
| Fetch Reviews | ~898-915 | `fetchMyReviews` |
| Toggle Visibility | ~917-934 | `toggleReviewsVisibility` |
| Respond to Review | ~1655-1695 | `handleReviewResponse` |

### **🎸 Groupes**

| Fonctionnalité | Lignes | Mots-clés |
|----------------|--------|-----------|
| Fetch Bands | ~1798-1862 | `fetchBands`, filtres |
| Message Band | ~1922-1999 | `handleMessageBand` |

### **📅 Calendrier & Planning**

| Fonctionnalité | Lignes | Mots-clés |
|----------------|--------|-----------|
| Date Click | ~1355-1381 | `handleDateClick` |
| Create Planning Slot | ~1697-1764 | `createPlanningSlot` |
| Month Navigation | Intégré dans Calendar | `currentMonth`, `setCurrentMonth` |

---

## 🎨 **Navigation par Onglet (JSX)**

### **Ordre des Onglets dans le JSX**

| Onglet | Valeur | Lignes Approx. | Contenu Principal |
|--------|--------|----------------|-------------------|
| **Profile** | `"profile"` | 2766-3282 | Informations, localisation, liens, équipements |
| **Jams** | `"jams"` | 3285-3556 | Liste bœufs, formulaire création, instruments |
| **Concerts** | `"concerts"` | 3559-4108 | Liste concerts, groupes, catering, comptabilité |
| **Karaoké** | `"karaoke"` | 4111-4304 | Soirées karaoké, comptabilité |
| **Spectacle** | `"spectacle"` | 4307-4520 | Spectacles, descriptions |
| **Planning** | `"planning"` | 4523-5172 | Calendrier visuel, vue mensuelle |
| **Candidatures** | `"applications"` | 5174-5263 | Liste événements avec candidatures |
| **Historique** | `"history"` | 5265-5322 | Événements passés, stats |
| **Comptabilité** | `"accounting"` | 5324-5530 | Vue financière, rentabilité |
| **Notifications** | `"notifications"` | 5532-5662 | Broadcast, historique |
| **Avis** | `"reviews"` | 5664-5918 | Avis clients, réponses |
| **Galerie** | `"gallery"` | 5920-6013 | Upload photos, galerie |
| **Groupes** | `"groups"` | 6015-7928 | Recherche groupes, filtres |

---

## 🏗️ **Structure du Rendu JSX**

```
VenueDashboard Component (ligne 2153)
│
├── DashboardNotification (2155)
│
├── Header (2158-2487)
│   ├── Logo & Nom (2162-2167)
│   ├── Navigation Desktop (2170-2339)
│   │   ├── Badge Abonnés (2179-2193)
│   │   ├── Bouton En ligne/Hors ligne (2196-2234)
│   │   ├── Notifications (2237-2328)
│   │   ├── Icônes (Trophées, Badges, Messages) (2330-2365)
│   │   └── Logout (2367-2371)
│   │
│   └── Navigation Mobile (2377-2487)
│       ├── Notifications Mobile (2343-2415)
│       └── Hamburger Menu (2418-2485)
│
├── Bannières (2488-2651)
│   ├── Profile Completion Alert (2488-2512)
│   ├── Subscription Card (2514-2532)
│   ├── Trial Banner (2534-2563)
│   ├── Renewal Reminder (2565-2593)
│   ├── Cancelled Banner (2595-2624)
│   └── Expired Alert (2626-2650)
│
└── Tabs Container (2652-7928)
    ├── TabsList (2653-2679)
    │   └── 13 TabsTrigger (avec contrôle d'accès)
    │
    └── TabsContent (chaque onglet)
        ├── Profile Tab
        ├── Jams Tab
        ├── Concerts Tab
        ├── Karaoke Tab
        ├── Spectacle Tab
        ├── Planning Tab
        ├── Applications Tab
        ├── History Tab
        ├── Accounting Tab
        ├── Notifications Tab
        ├── Reviews Tab
        ├── Gallery Tab
        └── Groups Tab
```

---

## 🔎 **Recherche Rapide par Mot-Clé**

### **Dans VS Code**
- `Ctrl+F` : Recherche dans le fichier
- `Ctrl+Shift+F` : Recherche dans tout le projet
- `Ctrl+P` puis `@` : Liste des symboles (fonctions, états)

### **Mots-clés Utiles**

| Chercher | Pour trouver |
|----------|--------------|
| `const [` | Tous les états |
| `useEffect` | Tous les hooks d'effet |
| `const fetch` | Toutes les fonctions fetch |
| `const handle` | Tous les handlers |
| `const create` | Fonctions de création |
| `TabsContent value=` | Début de chaque onglet |
| `axios.post` | Requêtes POST |
| `axios.put` | Requêtes PUT |
| `axios.get` | Requêtes GET |
| `axios.delete` | Requêtes DELETE |
| `toast.` | Notifications toast |
| `Dialog open=` | Toutes les modales |

---

## 🐛 **Débogage Rapide**

### **Console Logs Existants**

| Message Console | Localisation | Usage |
|-----------------|--------------|-------|
| `🔄 fetchEvents:` | ~394 | Chargement événements |
| `✅ Events loaded` | ~439 | Événements chargés avec succès |
| `❌ Error loading` | ~426-430 | Erreurs de chargement |
| `⚠️ fetchEvents: No profile ID` | ~390 | Guard clause profil |

### **Points de Breakpoint Recommandés**

- **Ligne ~388** : Début fetchEvents
- **Ligne ~606** : Début handleSave
- **Ligne ~1054** : Début createJam
- **Ligne ~1115** : Début createConcert
- **Ligne ~1383** : Début handleEditEvent

---

## 📚 **Références Rapides**

### **APIs Utilisées**

| Route | Méthode | Fonction | Ligne |
|-------|---------|----------|-------|
| `/venues/by-user/${userId}` | GET | fetchProfile | ~310 |
| `/venues/${id}/jams` | GET/POST | fetchEvents / createJam | ~388, ~1054 |
| `/venues/${id}/concerts` | GET/POST | fetchEvents / createConcert | ~388, ~1115 |
| `/venues/${id}/karaoke` | GET/POST | fetchEvents / createKaraoke | ~388, ~1188 |
| `/venues/${id}/spectacle` | GET/POST | fetchEvents / createSpectacle | ~388, ~1243 |
| `/venues/${id}/planning` | GET/POST | fetchEvents / createPlanningSlot | ~388, ~1697 |
| `/notifications` | GET | fetchNotifications | ~495 |
| `/bands/search` | GET | Suggestions groupes | (dans ConcertForm) |
| `/broadcast/send` | POST | sendBroadcastNotification | ~846 |
| `/venues/${id}/reviews` | GET | fetchMyReviews | ~898 |

### **Constantes Importantes**

- **API** : `${process.env.REACT_APP_BACKEND_URL}/api`
- **STRIPE_PAYMENT_LINK** : Ligne 53
- **INSTRUMENTS_BASE** : Lignes 56-66
- **MUSIC_STYLES_LIST** : Importé depuis data
- **DEPARTEMENTS_FRANCE** : Importé depuis data
- **REGIONS_FRANCE** : Importé depuis data

---

## 💡 **Astuces de Navigation**

1. **Plier les sections** : Utilisez la fonction "fold" de votre éditeur pour cacher les grandes sections
2. **Minimap** : Activez la minimap (VS Code) pour voir la structure globale
3. **Outline** : Utilisez le panneau "Outline" pour voir tous les symboles
4. **Breadcrumbs** : Activez les breadcrumbs pour voir où vous êtes
5. **Go to Definition** : `F12` sur n'importe quelle fonction pour voir sa définition

---

**📌 Dernier Update :** Mars 2026
**📖 Documentation Complète :** [README.md](./README.md)
