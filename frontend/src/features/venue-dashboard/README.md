# 🎵 VenueDashboard - Architecture & Documentation

## 📊 **Vue d'ensemble**

Le `VenueDashboard.jsx` est le composant principal du tableau de bord des établissements. Il gère l'ensemble des fonctionnalités pour les venues (bars, salles de concert, etc.).

**Fichier principal :** `/app/frontend/src/pages/VenueDashboard.jsx`  
**Taille actuelle :** ~7926 lignes  
**Complexité :** Très élevée (monolithe)

---

## 🗂️ **Structure du Fichier**

### **1. Imports & Configuration** (Lignes 1-67)
- Imports React & hooks
- Imports des composants UI (shadcn)
- Imports des composants custom
- Configuration API et constantes
- Liste des instruments de base

### **2. États (useState)** (Lignes 69-308)
**~50 états différents organisés par catégorie :**

#### **États Généraux**
- `profile` - Profil de l'établissement
- `loading` - État de chargement général
- `saving` - Sauvegarde en cours
- `editing` - Mode édition actif
- `activeTab` - Onglet actif (persisté dans localStorage)

#### **États Abonnement**
- `subscriptionStatus` - Statut de l'abonnement
- `trialDaysLeft` - Jours restants de la période d'essai

#### **États Événements**
- `jams` - Liste des bœufs
- `concerts` - Liste des concerts
- `karaokes` - Liste des karaokés
- `spectacles` - Liste des spectacles
- `planningSlots` - Créneaux de planning
- `applications` - Candidatures par événement
- `loadingEvents` - Chargement des événements

#### **États Dialogues/Modales**
- `showJamDialog` - Affichage dialogue création bœuf
- `showConcertDialog` - Affichage dialogue création concert
- `showKaraokeDialog` - Affichage dialogue création karaoké
- `showSpectacleDialog` - Affichage dialogue création spectacle
- `showPlanningDialog` - Affichage dialogue planning
- `showEventDetailsModal` - Affichage détails événement

#### **États Notifications & Broadcast**
- `broadcastMessage` - Message de diffusion
- `broadcastHistory` - Historique des broadcasts
- `nearbyMusiciansCount` - Nombre de musiciens à proximité
- `subscribers` - Liste des abonnés (Jacks)
- `notifications` - Liste des notifications
- `unreadCount` - Nombre de notifications non lues
- `unreadMessagesCount` - Messages non lus

#### **États Calendrier**
- `currentMonth` - Mois actuel affiché
- `selectedDate` - Date sélectionnée
- `bookedDates` - Tableau des dates réservées
- `eventsByDate` - Mapping date -> type d'événement

#### **États Formulaires**
- `jamForm` - Formulaire création bœuf
- `concertForm` - Formulaire création concert (avec music_styles, bands, catering, accommodation, comptabilité)
- `karaokeForm` - Formulaire création karaoké
- `spectacleForm` - Formulaire création spectacle
- `planningForm` - Formulaire création créneau planning
- `formData` - Données du profil

#### **États Avis & Galerie**
- `reviews` - Liste des avis clients
- `averageRating` - Note moyenne
- `totalReviews` - Nombre total d'avis
- `showReviews` - Visibilité des avis
- `gallery` - Photos de la galerie

#### **États Groupes**
- `bands` - Liste des groupes
- `bandSuggestions` - Suggestions de groupes
- `showBandSuggestions` - Affichage suggestions
- `newBand` - Nouveau groupe à ajouter
- `manualBandEntry` - Mode saisie manuelle groupe

#### **États Historique & Comptabilité**
- `pastEvents` - Événements passés
- `profitabilityStats` - Statistiques de rentabilité
- `historyFilters` - Filtres pour l'historique
- `accountingFilters` - Filtres pour la comptabilité

---

### **3. Fonctions Utilitaires** (Lignes 242-308)
- `isProfileComplete()` - Vérifie si le profil est complet
- `getDaysUntilRenewal()` - Calcule les jours avant renouvellement
- `canAccessTab(tabValue)` - Vérifie l'accès aux onglets selon abonnement

---

### **4. Fonctions de Récupération (Fetch)** (Lignes 310-936)

| Fonction | Description | Ligne |
|----------|-------------|-------|
| `fetchProfile()` | Récupère le profil venue | ~310 |
| `fetchEvents()` | Récupère tous les événements (jams, concerts, etc.) | ~388 |
| `fetchMusicians()` | Récupère la liste des musiciens | ~486 |
| `fetchNotifications()` | Récupère les notifications | ~495 |
| `fetchUnreadMessages()` | Compte les messages non lus | ~509 |
| `fetchNearbyMusiciansCount()` | Compte les musiciens à proximité | ~807 |
| `fetchBroadcastHistory()` | Historique des broadcasts | ~818 |
| `fetchSubscribers()` | Liste des abonnés (Jacks) | ~829 |
| `fetchMyReviews()` | Récupère les avis clients | ~898 |

---

### **5. Gestionnaires d'Événements (Handlers)** (Lignes 606-1924)

#### **Handlers Profil & Abonnement**
- `handleSave()` - Sauvegarde du profil
- `handleSubscribe()` - Redirection vers Stripe
- `handleCancelRenewal()` - Annulation renouvellement
- `handleReactivateRenewal()` - Réactivation renouvellement

#### **Handlers Événements (CRUD)**
- `createJam()` - Création bœuf
- `createConcert()` - Création concert
- `createKaraoke()` - Création karaoké
- `createSpectacle()` - Création spectacle
- `handleEditEvent()` - Édition événement
- `handleDeleteEvent()` - Suppression événement
- `handleEventUpdate()` - Mise à jour événement

#### **Handlers Planning**
- `createPlanningSlot()` - Création créneau planning
- `handleDateClick()` - Clic sur date calendrier

#### **Handlers Broadcast & Notifications**
- `sendBroadcastNotification()` - Envoi notification broadcast
- `toggleReviewsVisibility()` - Afficher/masquer avis
- `toggleEquipment()` - Toggle équipement (PA, lights, etc.)

#### **Handlers Avis**
- `handleReviewResponse()` - Répondre à un avis

#### **Handlers Galerie**
- `handlePhotoUpload()` - Upload photo galerie
- `handleDeletePhoto()` - Suppression photo

#### **Handlers Groupes**
- `handleAddBand()` - Ajouter un groupe
- `handleMessageBand()` - Envoyer message à un groupe

---

### **6. Hooks useEffect** (Lignes ~520-1020)

| Hook | Déclencheur | Action |
|------|-------------|--------|
| useEffect #1 | `[profile?.id]` | Charge les événements |
| useEffect #2 | `[profile?.id]` | Charge musiciens, notifications, messages |
| useEffect #3 | `[token]` | Polling notifications (30s) |
| useEffect #4 | `[token]` | Polling messages non lus (30s) |
| useEffect #5 | `[profile?.show_reviews]` | Charge les avis si activés |
| useEffect #6 | `[newBand.name]` | Recherche suggestions groupes |

---

### **7. Rendu JSX** (Lignes 2153-7927)

#### **7.1 Header & Navigation** (Lignes 2155-2487)
- Logo et nom de l'application
- Navigation desktop (notifications, trophées, badges, messages)
- Badge de statut en ligne/hors ligne
- Menu hamburger mobile
- Compteur d'abonnés

#### **7.2 Bannières d'Alerte** (Lignes 2488-2651)
- **Profile Completion Alert** - Si profil incomplet
- **Subscription Card** - Si pas d'abonnement actif
- **Trial Banner** - Pendant période d'essai
- **Renewal Reminder** - 5 jours avant expiration
- **Cancelled Subscription Banner** - Si annulation prévue
- **Expired Subscription Alert** - Si abonnement expiré

#### **7.3 Système d'Onglets** (Lignes 2652-7927)

##### **Onglet: Profile** (Lignes 2766-3282)
- Informations générales (nom, téléphone, description)
- Localisation
- Liens sociaux (Instagram, Facebook, YouTube)
- Équipements (PA, lights, stage)
- Galerie photos
- Gestion compte

##### **Onglet: Jams** (Lignes 3285-3556)
- Liste des bœufs
- Formulaire création bœuf (date, heure, styles, instruments, comptabilité)
- Affichage candidatures
- Détails bœuf (styles, prix, instruments fournis)

##### **Onglet: Concerts** (Lignes 3559-4108)
- Liste des concerts
- Formulaire création concert (date, titre, styles musicaux, groupes)
- Gestion groupes/artistes (suggestions ou saisie manuelle)
- Catering (type, coût, nombre de personnes)
- Hébergement (type, coût, capacité)
- Comptabilité (méthode paiement, montant)
- Affichage concerts avec détails complets

##### **Onglet: Karaoké** (Lignes 4111-4304)
- Liste des soirées karaoké
- Formulaire création (date, heure, prix, équipement)
- Comptabilité karaoké

##### **Onglet: Spectacle** (Lignes 4307-4520)
- Liste des spectacles
- Formulaire création (date, titre, description, prix)
- Comptabilité spectacle

##### **Onglet: Planning** (Lignes 4523-5172)
- Calendrier visuel interactif
- Vue mensuelle avec dates réservées
- Modal détails événement au clic
- Création/édition créneaux
- Légende des types d'événements

##### **Onglet: Candidatures** (Lignes 5174-5263)
- Liste des événements avec candidatures
- Nombre de candidatures par événement
- Redirection vers détails

##### **Onglet: Historique** (Lignes 5265-5322)
- Événements passés
- Filtres (type, date)
- Statistiques

##### **Onglet: Comptabilité** (Lignes 5324-5530)
- Vue comptable de tous les événements
- Filtres (type, statut paiement, dates)
- Calculs de rentabilité
- Édition montants

##### **Onglet: Notifications** (Lignes 5532-5662)
- Envoi de notifications broadcast
- Ciblage (abonnés ou musiciens à proximité)
- Historique des broadcasts

##### **Onglet: Avis** (Lignes 5664-5918)
- Liste des avis clients
- Note moyenne et étoiles
- Réponses aux avis
- Toggle visibilité publique

##### **Onglet: Galerie** (Lignes 5920-6013)
- Upload photos
- Affichage galerie
- Suppression photos

##### **Onglet: Groupes** (Lignes 6015-7927)
- Recherche de groupes/artistes
- Filtres (styles, région, département, type)
- Liste avec pagination
- Envoi de messages aux groupes
- Détails groupes (membres, styles, liens)

---

## 🔗 **Dépendances Principales**

### **Contextes**
- `AuthContext` - Gestion authentification et utilisateur
- `BadgeContext` - Système de badges

### **Hooks Personnalisés**
- `useBadgeAutoCheck` - Vérification automatique badges
- `useOnlineStatus` - Gestion statut en ligne/hors ligne
- `useNotifications` - Notifications push

### **Composants UI (shadcn)**
- Button, Input, Label, Textarea, Switch
- Tabs, Dialog, Sheet, DropdownMenu
- Select, Calendar

### **Composants Custom**
- `Calendar` - Calendrier interactif
- `CityAutocomplete` - Autocomplétion ville
- `TimeSelect` - Sélecteur d'heure
- `VenueImageUpload` - Upload d'images
- `OnlineStatusSelector` - Sélecteur statut en ligne
- `StarRating` - Affichage étoiles
- `DashboardNotification` - Notifications dashboard

---

## 🚧 **Points de Complexité**

### **État Partagé Complexe**
Les états sont fortement couplés, notamment :
- Les événements affectent `bookedDates` et `eventsByDate`
- Le profil affecte l'accès aux onglets
- L'abonnement contrôle de nombreuses fonctionnalités

### **Formulaires Imbriqués**
Les formulaires de création d'événements contiennent plusieurs niveaux :
- Concert : styles musicaux + groupes + catering + accommodation + comptabilité
- Chaque section peut avoir des sous-formulaires conditionnels

### **Logique de Permissions**
- Vérifications d'abonnement multiples
- Contrôle d'accès par onglet
- Alertes conditionnelles selon statut

---

## 📝 **Recommandations pour Refactoring Futur**

### **Phase 1 : Tests**
Avant tout refactoring, créer des tests E2E pour :
- ✅ Création de chaque type d'événement
- ✅ Édition du profil
- ✅ Système de candidatures
- ✅ Notifications
- ✅ Comptabilité

### **Phase 2 : Extraction Progressive**
Une fois les tests en place :
1. Extraire les hooks : `useVenueEvents`, `useVenueProfile`, `useVenueNotifications`
2. Extraire les composants de bannières
3. Extraire chaque onglet en composant séparé
4. Créer des contextes locaux si nécessaire

### **Phase 3 : Optimisation**
- Mémoïsation avec `useMemo` et `useCallback`
- Lazy loading des onglets
- Pagination des listes longues

---

## 🐛 **Bugs Connus & Points d'Attention**

1. **Événements multiples même jour** : Actuellement, le système interdit plusieurs événements le même jour. Amélioration prévue pour afficher une modale de sélection.

2. **Synchronisation états** : Les états des événements doivent être synchronisés avec `bookedDates` et `eventsByDate`. Toute modification nécessite une mise à jour des trois.

3. **Suggestions de groupes** : Le système de suggestions peut afficher des résultats obsolètes si le typing est rapide. Un debounce de 300ms est en place.

---

## 📚 **Resources & Liens**

- **API Backend** : `${REACT_APP_BACKEND_URL}/api`
- **Stripe Payment Link** : Configuré dans les constantes
- **Styles musicaux** : `/app/frontend/src/data/music-styles.js`
- **Départements FR** : `/app/frontend/src/data/france-locations.js`

---

## 👥 **Contributeurs & Historique**

- **Version initiale** : Monolithe complet
- **Dernière modification** : Suppression badge "✓ Actif" (Mars 2026)
- **Refactoring documentaire** : Mars 2026

---

## 🎯 **Métriques**

| Métrique | Valeur |
|----------|--------|
| Lignes de code | ~7926 |
| États (useState) | ~50 |
| Fonctions fetch | ~9 |
| Handlers | ~25 |
| Onglets | 13 |
| Composants importés | ~30 |

---

**📌 Note :** Ce document est un guide vivant. Mettez-le à jour lors de modifications importantes du VenueDashboard.
