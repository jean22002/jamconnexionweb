# 📱 Jam Connexion - Mobile App PRD (Product Requirements Document)

**Date** : 28 Mars 2026
**Version** : 1.0 - Mobile Native (React Native)
**Plateforme** : iOS + Android

---

## 🎯 VISION DU PROJET

**Jam Connexion** est un réseau social musical qui connecte :
- 🎸 **Musiciens** : Trouvent des opportunités de concerts
- 🎭 **Mélomanes** : Découvrent des événements musicaux
- 🏢 **Établissements** : Trouvent des artistes pour leurs soirées

**Objectif Mobile** : Permettre l'accès mobile complet aux fonctionnalités de mise en relation, avec géolocalisation et notifications push natives.

---

## 👥 PERSONAS

### Persona 1 : Le Musicien Pro
- **Nom** : Marc, 28 ans, guitariste
- **Besoins** : Trouver des concerts, gérer son groupe, candidater à des événements
- **Frustrations** : Difficulté à trouver des opportunités, pas de plateforme centralisée
- **Use cases** :
  - Chercher des établissements qui programment du jazz
  - Postuler à un créneau disponible
  - Gérer les membres de son groupe
  - Recevoir des notifications pour nouvelles opportunités

### Persona 2 : Le Mélomane
- **Nom** : Sophie, 35 ans, passionnée de musique live
- **Besoins** : Découvrir des concerts, suivre des établissements, planifier ses sorties
- **Frustrations** : Manque d'infos sur les événements locaux
- **Use cases** :
  - Trouver des bars avec concerts de rock près de chez elle
  - S'abonner à ses lieux favoris
  - Voir le calendrier des événements
  - Partager ses découvertes

### Persona 3 : L'Établissement
- **Nom** : Le Jazz Club (propriétaire : Pierre, 45 ans)
- **Besoins** : Trouver des musiciens de qualité, remplir son planning
- **Frustrations** : Recherche manuelle, pas de visibilité
- **Use cases** :
  - Publier des créneaux disponibles
  - Recevoir et gérer des candidatures
  - Communiquer avec les musiciens
  - Promouvoir les événements

---

## 🎨 FONCTIONNALITÉS PAR PROFIL

### 🎸 Musicien

#### 1. Authentification & Profil
- ✅ Inscription / Connexion
- ✅ Profil complet : pseudo, bio, ville, instruments, styles musicaux
- ✅ Photo de profil
- ✅ Statut PRO (abonnement payant)

#### 2. Dashboard
**Tabs** :
- 📊 **Accueil** : Vue d'ensemble, stats, activité récente
- 🏢 **Établissements** : Liste/grille avec filtres (région, département, styles)
- 🗺️ **Carte** : Carte interactive avec clustering, géolocalisation
- 🎤 **Candidatures** : Mes candidatures (statut: pending/accepted/rejected)
- 🎸 **Mon Groupe** : Gestion du groupe, membres, code d'invitation
- 📅 **Planning** : Mes concerts acceptés
- ⚙️ **Paramètres** : Édition profil, préférences

#### 3. Recherche d'Opportunités
- 📍 Carte avec clustering des établissements
- 🔍 Filtres : Région, département, styles musicaux
- 📅 Créneaux disponibles (calendrier)
- 💼 **PRO uniquement** : Filtres avancés (mes candidatures, offres par date/style)

#### 4. Candidatures
- 📝 Postuler à un créneau
- 💬 Message de motivation
- 📊 Suivi des candidatures (pending/accepted/rejected)
- 🔔 Notifications push : Réponse de l'établissement

#### 5. Groupe
- 👥 Créer/rejoindre un groupe
- 🎟️ Code d'invitation auto-généré
- 🎸 Ajouter/retirer des membres
- 🎵 Définir styles musicaux du groupe

---

### 🎭 Mélomane

#### 1. Dashboard
**Tabs** :
- 🏢 **Établissements** : Liste avec filtres (région, département, styles)
- 🗺️ **Carte** : Carte interactive avec clustering
- 🔗 **Connexions** : Établissements suivis
- 📅 **Événements** : Prochains événements des établissements suivis
- ⚙️ **Paramètres** : Édition profil

#### 2. Découverte
- 📍 Carte des établissements
- 🏷️ Filtres par styles musicaux préférés
- 🔍 Recherche par ville/région
- ⭐ Établissements recommandés

#### 3. Connexions
- ➕ Se connecter à un établissement
- 🔔 Notifications : Nouveaux événements des établissements suivis
- 📱 Partage sur réseaux sociaux

---

### 🏢 Établissement

#### 1. Dashboard
**Tabs** :
- 📊 **Vue d'ensemble** : Stats, prochains événements
- 📅 **Planning** : Calendrier des créneaux
- 🎤 **Candidatures** : Liste des candidatures reçues
- 🎸 **Musiciens** : Recherche de musiciens
- ⚙️ **Paramètres** : Édition profil

#### 2. Gestion Planning
- ➕ Créer un créneau
- 📝 Définir : date, heure, styles recherchés, description
- 👀 Voir les candidatures pour chaque créneau
- ✅ Accepter/❌ Refuser une candidature
- 📊 Historique des événements

#### 3. Communication
- 💬 Messagerie avec les musiciens
- 🔔 Notifications : Nouvelle candidature

---

## 🎨 DESIGN & UX

### Thème
- 🌙 **Dark mode** par défaut (musique/nuit)
- 🎨 **Palette** :
  - Primary : Purple `#9333ea`
  - Secondary : Pink `#ec4899`
  - Accent : Cyan `#06b6d4`
  - Background : Dark `#0a0a0a`
  - Surface : `#1a1a1a`
  - Text : White `#ffffff`
  - Muted : Gray `#9ca3af`

### Composants UI
- 🎴 **Cards** : Glassmorphism (fond semi-transparent avec blur)
- 🔘 **Buttons** : Arrondis, gradients primary-to-secondary
- 📝 **Forms** : Inputs sombres avec borders subtils
- 🗺️ **Map** : Leaflet ou React Native Maps
- 🏷️ **Chips** : Filtres avec sélection multiple
- 📊 **Stats** : Cards avec icônes et chiffres

### Navigation
- 📱 **Bottom Tab Navigator** : 4-5 tabs selon le profil
- 🔙 **Stack Navigator** : Pour les détails (profil établissement, candidature, etc.)
- 🍔 **Drawer** : Menu latéral pour paramètres/déconnexion

---

## 🚀 MVP - Phase 1 (Priorité Haute)

### Must-Have Features

#### Authentification ✅
- Inscription (email + password)
- Connexion
- Récupération mot de passe
- Persistance session (AsyncStorage)

#### Profils ✅
- Profil musicien complet
- Profil mélomane complet
- Profil établissement complet
- Upload photo de profil

#### Carte & Géolocalisation ✅
- Carte interactive (React Native Maps)
- Clustering des établissements
- Géolocalisation utilisateur
- Filtres par styles musicaux
- Navigation vers établissement

#### Établissements ✅
- Liste avec filtres (région, département)
- Détails établissement
- Photos (profil + cover)

#### Connexions ✅
- Se connecter/déconnecter d'un établissement (mélomane)
- Liste de mes connexions

#### Musiciens - Basique ✅
- Voir les créneaux disponibles
- Postuler à un créneau
- Voir mes candidatures

#### Établissements - Basique ✅
- Créer un créneau
- Voir les candidatures
- Accepter/refuser

---

## 🔄 Phase 2 (Priorité Moyenne)

### Nice-to-Have Features

#### Notifications Push 🔔
- Firebase Cloud Messaging (FCM)
- Notifications :
  - Nouvelle candidature (établissement)
  - Réponse à candidature (musicien)
  - Nouvel événement (mélomane)

#### Groupe 🎸
- Créer/rejoindre un groupe
- Code d'invitation
- Gestion des membres
- Candidatures en tant que groupe

#### Recherche Avancée 🔍
- Recherche par nom
- Filtres multiples
- Tri (distance, date, pertinence)

#### Chat 💬
- Messagerie 1-to-1
- Conversation musicien ↔ établissement
- Historique des messages

---

## 📅 Phase 3 (Future)

### Advanced Features

#### Paiements 💳
- Stripe integration
- Abonnement PRO (in-app purchase)
- Gestion abonnement

#### Social 📱
- Partage sur réseaux sociaux
- Inviter des amis
- Reviews/avis sur établissements

#### Analytics 📊
- Statistiques détaillées (musiciens)
- Dashboard analytics (établissements)
- Suivi de performance

#### Media 📸
- Photos d'événements
- Vidéos de performances
- Galerie établissement

---

## 🗺️ USER FLOWS

### Flow 1 : Inscription Musicien
```
1. Landing → "S'inscrire"
2. Choix du profil → "Musicien"
3. Formulaire : Email, Password, Nom
4. Validation email (optionnel)
5. Profil : Pseudo, Bio, Ville, Instruments, Styles
6. Upload photo (optionnel)
7. → Dashboard musicien
```

### Flow 2 : Postuler à un Concert (Musicien)
```
1. Dashboard → Tab "Carte"
2. Voir les établissements (clustering)
3. Cliquer sur un marqueur
4. Voir détails établissement
5. → "Créneaux disponibles"
6. Sélectionner un créneau
7. Formulaire candidature :
   - Sélection groupe (si multiple)
   - Message de motivation
8. → Envoyer
9. Toast : "Candidature envoyée"
10. → Tab "Candidatures" (voir statut)
```

### Flow 3 : Gérer Candidatures (Établissement)
```
1. Dashboard → Tab "Candidatures"
2. Liste des candidatures par créneau
3. Cliquer sur une candidature
4. Voir profil musicien/groupe
5. → "Accepter" OU "Refuser"
6. (Optionnel) Message au musicien
7. Toast : "Candidature acceptée"
8. Notification push → Musicien
```

### Flow 4 : Découvrir Établissements (Mélomane)
```
1. Dashboard → Tab "Carte"
2. Activer géolocalisation (optionnel)
3. Voir établissements à proximité
4. Filtrer par styles musicaux
5. Cliquer sur un établissement
6. Voir profil + prochains événements
7. → "Se connecter"
8. Toast : "Connecté à [Nom]"
9. Tab "Connexions" → Voir établissement
```

---

## 📐 ARCHITECTURE TECHNIQUE

### Frontend (React Native)
```
/app
  /src
    /navigation
      - RootNavigator.tsx (Stack principal)
      - AuthNavigator.tsx (Login/Register)
      - MusicianTabNavigator.tsx
      - MelomaneTabNavigator.tsx
      - VenueTabNavigator.tsx
    /screens
      /auth
        - LoginScreen.tsx
        - RegisterScreen.tsx
      /musician
        - MusicianDashboard.tsx
        - OpportunitiesScreen.tsx
        - ApplicationsScreen.tsx
        - BandScreen.tsx
        - MapScreen.tsx
      /melomane
        - MelomaneDashboard.tsx
        - VenuesListScreen.tsx
        - MapScreen.tsx
        - ConnectionsScreen.tsx
      /venue
        - VenueDashboard.tsx
        - PlanningScreen.tsx
        - ApplicationsScreen.tsx
      /shared
        - VenueDetailScreen.tsx
        - ProfileEditScreen.tsx
        - SettingsScreen.tsx
    /components
      - VenueCard.tsx
      - ApplicationCard.tsx
      - FilterChip.tsx
      - MapMarker.tsx
    /services
      - api.ts (Axios client)
      - auth.ts (Auth logic)
      - storage.ts (AsyncStorage)
      - notifications.ts (FCM)
    /utils
      - constants.ts
      - theme.ts
      - helpers.ts
    /hooks
      - useAuth.ts
      - useVenues.ts
      - useApplications.ts
```

### Backend (Existant - FastAPI)
- **URL** : https://collapsible-map.preview.emergentagent.com/api
- **Réutilisation** : 100% du backend actuel
- **MongoDB Atlas** : Base de données partagée

### State Management
- **Option 1** : Context API + useReducer (simple)
- **Option 2** : Redux Toolkit (si complexe)
- **Recommandation** : Context API (suffisant pour MVP)

### Maps
- **React Native Maps** (recommandé)
- Alternative : WebView avec Leaflet (moins performant)

### Notifications
- **Firebase Cloud Messaging (FCM)**
- Serveur d'envoi : Backend FastAPI

---

## 🎯 MÉTRIQUES DE SUCCÈS

### Objectifs MVP
- ✅ 100% des features MVP implémentées
- ✅ 0 crash sur iOS/Android
- ✅ Temps de chargement < 3s
- ✅ Géolocalisation fonctionnelle
- ✅ Upload photos < 5s

### KPIs Business
- 📊 100+ téléchargements dans le 1er mois
- 🎯 50% taux de conversion inscription → profil complet
- 🔄 30% taux de rétention J+7
- 🎸 10+ candidatures envoyées par semaine

---

## ⚠️ CONTRAINTES & CONSIDÉRATIONS

### Techniques
- **iOS** : Nécessite Apple Developer Account (99€/an)
- **Android** : Google Play (25€ one-time)
- **Permissions** :
  - Location (géolocalisation)
  - Camera (photo de profil)
  - Notifications (push)
- **Taille app** : < 50MB pour le téléchargement

### Légales
- RGPD : Consentement géolocalisation
- CGU/CGV : Mentions légales
- Privacy Policy : Données utilisateur

### Performance
- Optimisation images (compression)
- Lazy loading des listes
- Cache local (AsyncStorage)
- Offline mode (nice-to-have)

---

## 📦 LIVRABLES ATTENDUS

### Phase 1 - MVP (2-4 semaines)
- [ ] App iOS fonctionnelle
- [ ] App Android fonctionnelle
- [ ] Authentification complète
- [ ] 3 dashboards (musicien, mélomane, établissement)
- [ ] Carte avec géolocalisation
- [ ] Système de candidatures basique
- [ ] Connexions (mélomane ↔ établissement)

### Phase 2 - Améliorations (2-3 semaines)
- [ ] Notifications push
- [ ] Gestion groupes
- [ ] Chat/messagerie
- [ ] Recherche avancée

### Phase 3 - Advanced (timing TBD)
- [ ] Paiements in-app
- [ ] Analytics
- [ ] Social sharing
- [ ] Media gallery

---

## 📚 RESSOURCES

### Design
- Figma (si disponible) : [URL]
- Palette de couleurs : Voir section Design
- Assets : Logo, icônes (à fournir)

### API
- Documentation complète : `/app/memory/API_DOCUMENTATION.md`
- Base URL : `https://collapsible-map.preview.emergentagent.com/api`
- Credentials de test : `/app/memory/test_credentials.md`

### Backend
- Repository : [Git URL si disponible]
- Database : MongoDB Atlas (production)
- Environnement de test : Preview URL

---

**Prêt pour le Mobile Agent !** 🚀

Ce document doit permettre au Mobile Agent de comprendre :
- ✅ La vision complète du projet
- ✅ Toutes les fonctionnalités par profil
- ✅ Les user flows détaillés
- ✅ L'architecture technique
- ✅ Les priorités (MVP vs Future)

**Next Step** : Créer une tâche Mobile Agent avec ce PRD + API Documentation
