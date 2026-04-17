# 📱 Récapitulatif des développements récents - Jam Connexion
**Destinataire** : Équipe développement application mobile  
**Date de dernière mise à jour** : 17 avril 2026  
**Version Backend/Frontend** : Dernière version en production

---

## 🆕 Nouveautés du 17 avril 2026

### 📖 Guide Utilisateur Interactif (NOUVEAU ✨)
- **Nouveau composant** : `GuideModal.jsx`
- Guide adapté à chaque profil utilisateur :
  - 🎸 **Musiciens** : 6 étapes (Bienvenue, Carte, Localisation, Groupes, Badges, Notifications)
  - 🎤 **Établissements** : 5 étapes (Bienvenue, Visibilité, Événements, Candidatures, Notifications)
  - 🎵 **Mélomanes** : 5 étapes (Bienvenue, Carte, Suivre, Participer, Notifications)
- **Bouton dédié** (icône `?`) dans le header à côté des trophées
- Navigation par étapes avec indicateurs de progression
- Explications détaillées avec icônes et exemples pratiques

### 📍 Bouton Localisation déplacé dans Header (NOUVEAU ✨)
- **Ancienne position** : Floating widget en bas à droite
- **Nouvelle position** : Header à côté des trophées (desktop + mobile)
- Mode compact : Bouton icône avec indicateur d'état (point vert si actif)
- Modal identique qui s'ouvre au clic
- Amélioration UX : Plus accessible et cohérent visuellement

### 🎸 Offre Promotionnelle Musiciens
- **200 premiers musiciens** : 2 mois PRO gratuits
- Compteur temps réel avec endpoint dédié
- Badge "🎁 OFFRE LIMITÉE" cyan/bleu distinctif

### 🎭 Masquage Bannière Promotionnelle
- La bannière d'offre de lancement ne s'affiche plus pour les utilisateurs ayant déjà un statut PRO
- Logique : Musiciens `tier === "pro"` et Établissements `subscription_status === "active"`

### 🔔 Section Notifications sur page Tarifs
- Liste complète des notifications par rôle (Musiciens, Établissements, Mélomanes)
- Design glassmorphism avec icônes
- Mise en avant des notifications PRO exclusives

### ⏰ Système de Rappels corrigé
- Horaire modifié : 12h30 → **13h00** (heure de Paris)
- Fréquence corrigée : 1 seule fois par jour au lieu de plusieurs
- WebSocket ajouté pour notifications temps réel

---

## 🎯 Vue d'ensemble

Ce document récapitule toutes les fonctionnalités développées et mises en production récemment sur Jam Connexion. Ces fonctionnalités doivent être prises en compte pour l'alignement de l'application mobile.

---

## 1️⃣ Système de Notifications Temps Réel (WebSocket)

### 📄 Documentation complète
**Fichier** : `/app/MOBILE_WEBSOCKET_NOTIFICATIONS.md`

### Résumé
- **Protocole** : Socket.IO (WebSocket)
- **URL** : `wss://jamconnexion.com/api/socket.io`
- **Authentification** : JWT Token dans l'objet `auth`

### Types de notifications implémentées (9 types)

| Type | Déclencheur | Destinataire |
|------|-------------|--------------|
| `new_message` | Nouveau message | Conversant |
| `new_application` | Candidature reçue | Établissement |
| `application_status` | Accepté/Refusé | Musicien |
| `new_subscriber` | Nouvel abonné | Établissement |
| `badge_unlocked` | Badge débloqué | Utilisateur |
| `new_slot_available` | Nouvelle offre | Musiciens PRO abonnés |
| `new_event_created` (jam) | Jam créé | Tous (broadcast) |
| `new_event_created` (concert) | Concert créé | Tous (broadcast) |

### Endpoints REST complémentaires
```
GET  /api/notifications              - Historique
GET  /api/notifications/unread/count - Compteur
PUT  /api/notifications/{id}/read    - Marquer lu
PUT  /api/notifications/read-all     - Tout marquer lu
```

### Exemple de payload
```json
{
  "notification_type": "new_application",
  "data": {
    "musician_name": "Les Rockeurs",
    "event_name": "Créneau du 2026-05-15",
    "application_id": "app_789",
    "action_url": "/venue-dashboard"
  }
}
```

**Action requise pour l'app mobile** :
- Implémenter client Socket.IO
- Afficher les notifications en temps réel
- Gérer la reconnexion automatique

---

## 2️⃣ Offre Promotionnelle Établissements

### Nouvelle politique tarifaire

**Les 100 premiers établissements** :
- 🎁 **6 mois gratuits**
- Puis 12,99€/mois

**Après les 100 premiers** :
- 📅 **3 mois gratuits**
- Puis 12,99€/mois

### Compteur temps réel

**Endpoint** :
```
GET /api/stats/promo
```

**Réponse** :
```json
{
  "total_venues": 53,
  "promo_limit": 100,
  "remaining_slots": 47,
  "is_promo_available": true,
  "current_offer_months": 6
}
```

### UI Web
- Bannière promo en haut de la landing page
- Compteur "X/100 places restantes" avec couleurs dynamiques
- Badge "🎁 OFFRE LIMITÉE" sur les cards

**Action requise pour l'app mobile** :
- Afficher l'offre lors de l'inscription établissement
- Intégrer le compteur de places restantes
- Adapter le tunnel d'inscription

---

## 2️⃣ bis - Offre Promotionnelle Musiciens (NOUVEAU ✨)

### Nouvelle offre de lancement

**Les 200 premiers musiciens** :
- 🎁 **2 mois PRO gratuits**
- Accès à toutes les fonctionnalités PRO

**Après les 200 premiers** :
- Reste gratuit (Free tier standard)

### Compteur temps réel

**Endpoint** :
```
GET /api/stats/promo-musicians
```

**Réponse** :
```json
{
  "total_musicians": 125,
  "promo_limit": 200,
  "remaining_slots": 75,
  "is_promo_available": true,
  "free_months": 2,
  "description": "2 mois PRO gratuits"
}
```

### UI Web
- Badge "🎁 OFFRE LIMITÉE" cyan/bleu sur la card Musicien
- Compteur dynamique avec urgence visuelle
- Affiché sur Landing page et page Pricing

### État actuel
- ~125 musiciens inscrits
- **75 places restantes** pour l'offre 2 mois PRO

**Action requise pour l'app mobile** :
- Afficher l'offre lors de l'inscription musicien
- Badge distinctif (cyan/bleu, différent des établissements)
- Compteur de places restantes
- Activation automatique des 2 mois PRO à l'inscription

---

## 3️⃣ Filtre GUSO (Établissements au contrat GUSO)

### Fonctionnalité
- Badge "💼 GUSO" sur les établissements éligibles
- Filtre dédié sur la carte interactive
- **Réservé aux musiciens PRO uniquement**

### Backend
**Nouveaux champs dans les établissements** :
```json
{
  "is_guso": true,  // Boolean
  "registration_number": 54,  // Rang d'inscription
  "early_bird_offer": true   // Badge offre 6 mois
}
```

**Endpoint** :
```
GET /api/venues?is_guso=true  - Filtrer les établissements GUSO
```

### UI
- Badge visible sur les cards d'établissements
- Filtre "Badge GUSO visible" dans les fonctionnalités PRO
- 9 établissements GUSO de test disponibles

**Action requise pour l'app mobile** :
- Afficher le badge GUSO sur les établissements
- Implémenter le filtre (PRO uniquement)
- Gestion des permissions PRO

---

## 4️⃣ Projet Solo pour Musiciens

### Nouveau champ
**Modèle** : `musicians.solo_profile`

```json
{
  "has_solo": true,
  "solo_name": "Jean Martin",
  "solo_project_name": "The Acoustic Journey",  // NOUVEAU
  "solo_description": "..."
}
```

### Fonctionnalités associées

1. **Badge "🎸 Solo"** sur les profils musiciens
2. **Affichage du nom du projet** en violet sous le pseudo
3. **Recherche par nom de projet solo** dans l'onglet Musiciens

### Exemple visuel
```
Jean Martin 🎸 Solo 💎 PRO
"The Acoustic Journey"
📍 Lyon (69)
```

**Action requise pour l'app mobile** :
- Ajouter le champ dans le formulaire profil solo
- Afficher le badge et le nom du projet
- Implémenter la recherche par projet solo

---

## 5️⃣ Planning de Groupe (Bug Fix)

### Problème résolu
- Erreur 403 sur `/api/bands/{band_id}/events`
- Endpoint manquant créé

### Nouveaux endpoints

**GET** `/api/bands/{band_id}/events?month=4&year=2026`
- Récupère les événements d'un groupe
- Vérification d'appartenance au groupe (sécurité)
- Filtre par mois/année

**GET** `/api/bands/{band_id}/calendar.ics`
- Export calendrier iCalendar
- Compatible Google Calendar, Outlook, Apple Calendar

**Réponse JSON** :
```json
[
  {
    "id": "concert_123",
    "band_id": "band_456",
    "venue_name": "Le Refuge Solidaire",
    "venue_city": "Paris",
    "date": "2026-04-20",
    "start_time": "20:00",
    "status": "confirmed"
  }
]
```

**Action requise pour l'app mobile** :
- Implémenter l'affichage du planning de groupe
- Gérer les permissions (membres uniquement)
- Possibilité d'exporter en .ics

---

## 7️⃣ Guide Utilisateur Interactif ✨ NOUVEAU

### Fonctionnalité
Guide interactif step-by-step adapté au rôle de l'utilisateur pour onboarder et expliquer les fonctionnalités principales de l'application.

### Composants Web
- **Fichier** : `/app/frontend/src/components/GuideModal.jsx`
- **Intégration** : `MusicianDashboard.jsx`, `VenueDashboard.jsx`

### Bouton d'accès
- **Position** : Header, à côté des trophées (icône `?`)
- **Desktop** : Visible dans la barre de navigation
- **Mobile** : Dans le menu hamburger

### Contenu du Guide

#### 🎸 Pour les Musiciens (6 étapes)
1. **Bienvenue** : Présentation de la plateforme
2. **Carte Interactive** : Filtres, recherche géographique
3. **Mode En Déplacement** : Explication complète de la fonction Localisation
4. **Groupes Musicaux** : Création, invitation, codes
5. **Badges & Trophées** : Gamification
6. **Notifications** : Types de notifications reçues

#### 🎤 Pour les Établissements (5 étapes)
1. **Bienvenue** : Offre de lancement
2. **Visibilité** : Carte, recherche, filtres
3. **Créer des Événements** : Types, rémunération
4. **Candidatures** : Accepter/refuser, messagerie
5. **Notifications** : Types de notifications reçues

#### 🎵 Pour les Mélomanes (5 étapes)
1. **Bienvenue** : Découverte gratuite
2. **Carte des Événements** : Filtres, calendrier
3. **Suivre des Établissements** : Notifications, favoris
4. **Participer aux Événements** : Rappels J-3 et Jour J
5. **Notifications** : Types de notifications reçues

### Structure technique
```javascript
// Appel du modal
<GuideModal 
  isOpen={showGuideModal} 
  onClose={() => setShowGuideModal(false)} 
  userRole="musician" // ou "venue" ou "melomane"
/>
```

### Navigation
- Boutons "Précédent" / "Suivant"
- Indicateurs de progression (dots)
- Compteur "X / Y"
- Bouton "Terminer" sur la dernière étape

**Action requise pour l'app mobile** :
- Créer un composant Guide similaire adapté au mobile
- 3 versions de contenu selon le rôle (musician/venue/melomane)
- Bouton d'accès dans le header ou menu principal
- Possibilité de relancer le guide depuis les paramètres

---

## 8️⃣ Bouton Localisation dans Header ✨ NOUVEAU

### Modification UX
Le bouton "Localisation" (mode en déplacement) a été **déplacé** pour améliorer l'accessibilité.

### Ancienne version
- **Position** : Floating widget en bas à droite de l'écran
- **Style** : Bouton flottant avec texte "Localisation" / "En déplacement"

### Nouvelle version
- **Position** : Header, à côté du bouton Guide et des Trophées
- **Mode** : Compact (icône uniquement)
- **Indicateur** : Point vert si localisation active
- **Modal** : Identique à l'ancienne version (s'ouvre au clic)

### Composant Web
- **Fichier** : `/app/frontend/src/components/LocationWidget.jsx`
- **Prop** : `compact={true}` pour le mode header

```javascript
// Mode header (nouveau)
<LocationWidget token={token} compact={true} />

// Mode floating (ancien, désactivé)
<LocationWidget token={token} />
```

### États visuels
- **Inactif** : Icône `MapPin` grise
- **Actif** : Icône `MapPin` avec gradient primary + point vert pulsant
- **Modal ouvert** : Overlay fond noir avec blur

### Fonctionnalité (inchangée)
- Activer/désactiver la localisation temporaire (24h)
- Deux méthodes : GPS automatique ou saisie manuelle
- Affichage du temps restant
- Ville d'origine vs ville temporaire

**Action requise pour l'app mobile** :
- Déplacer le bouton Localisation dans le header
- Mode compact : Icône uniquement avec badge si actif
- Garder la même fonctionnalité (modal/bottom sheet identique)
- S'assurer de la cohérence avec le bouton Guide

---

## 6️⃣ Intégration Facebook Events (EN COURS)

### Statut
⚠️ **Partiellement implémenté** - En attente de finalisation Facebook App

### Objectif
Permettre aux établissements d'importer automatiquement leurs événements Facebook dans Jam Connexion.

### Documentation créée
- `/app/FACEBOOK_APP_SETUP_GUIDE.md` - Guide création Facebook App
- Playbook d'intégration complet disponible

### Architecture prévue

**Synchronisation** : Facebook → Jam Connexion (unidirectionnel)

**Workflow** :
1. Établissement connecte sa Page Facebook
2. Événements Facebook importés automatiquement
3. Mise à jour automatique si modification

**Endpoints prévus** :
```
POST /api/auth/facebook/login          - OAuth Facebook
GET  /api/auth/facebook/callback       - Callback OAuth
POST /api/pages/sync                   - Synchroniser pages
GET  /api/events/{page_id}             - Événements d'une page
```

### Champs synchronisés
```json
{
  "facebook_event_id": "event_123",
  "title": "Concert Rock",
  "description": "...",
  "start_time": "2026-05-20T19:00:00",
  "end_time": "2026-05-20T23:00:00",
  "location": "Amphitheater",
  "facebook_updated_time": "2026-04-15T14:30:00"
}
```

**Action requise pour l'app mobile** :
- Prévoir l'intégration future
- Badge "Synchronisé avec Facebook" sur les événements
- Bouton "Connecter Facebook" dans les paramètres

---

## 📊 Résumé des nouveaux endpoints

### Fichiers Web modifiés (17 avril 2026)
```
Frontend:
- /app/frontend/src/components/GuideModal.jsx (CRÉÉ)
- /app/frontend/src/components/LocationWidget.jsx (MODIFIÉ - mode compact)
- /app/frontend/src/pages/MusicianDashboard.jsx (MODIFIÉ - boutons Guide + Localisation)
- /app/frontend/src/pages/VenueDashboard.jsx (MODIFIÉ - bouton Guide)
- /app/frontend/src/pages/Landing.jsx (MODIFIÉ - masquage bannière PRO)
```

### Stats & Promo
```
GET /api/stats/promo                    - Offre établissements (100 premiers)
GET /api/stats/promo-musicians          - Offre musiciens (200 premiers) ✨ NOUVEAU
GET /api/stats/counts                   - Compteurs généraux
```

### Planning de groupe
```
GET /api/bands/{band_id}/events         - Événements du groupe
GET /api/bands/{band_id}/calendar.ics   - Export calendrier
```

### Notifications
```
GET  /api/notifications                 - Historique
GET  /api/notifications/unread/count    - Compteur non lues
PUT  /api/notifications/{id}/read       - Marquer comme lu
PUT  /api/notifications/read-all        - Tout marquer lu
WebSocket: wss://jamconnexion.com/api/socket.io
```

**Types de notifications WebSocket** :
- `new_message`
- `new_application`
- `application_status` (accepted/rejected)
- `new_subscriber`
- `badge_unlocked`
- `new_slot_available` (PRO)
- `new_event_created` (jam/concert)
- `event_reminder` ✨ NOUVEAU (J-3 et Jour J à 13h)

### Établissements GUSO
```
GET /api/venues?is_guso=true            - Filtrer GUSO
```

---

## 🔑 Credentials de test

**Fichier complet** : `/app/memory/test_credentials.md`

### Comptes principaux
```
Musicien    : test@gmail.com / test
Établissement: bar@gmail.com / test
```

### Établissements GUSO (9 comptes)
```
Mot de passe universel : guso2026

Emails :
- guso.lerefugesolidaire@jamconnexion.fr
- guso.laccordeonsocial@jamconnexion.fr
- guso.lasceneequitable@jamconnexion.fr
... (voir fichier complet)
```

---

## ⚠️ Points d'attention pour l'app mobile

### 1. Authentification
- JWT tokens standards
- Refresh token géré côté backend
- Socket.IO nécessite le token dans `auth: { token }`

### 2. Permissions PRO
- Filtre GUSO réservé aux PRO
- Nouvelles offres (slots) notifiées aux PRO uniquement
- Badge "Projet Solo" visible à tous mais filtre PRO

### 3. Synchronisation
- WebSocket pour notifications temps réel
- Polling fallback si WebSocket échoue
- Reconnexion automatique recommandée

### 4. Offre promotionnelle
- Afficher le compteur lors de l'inscription établissement
- Texte dynamique selon le nombre de places restantes
- Couleurs d'urgence (vert → jaune → orange → rouge)

### 5. Modèle de données
- Nouveaux champs : `is_guso`, `solo_project_name`, `registration_number`
- Format dates : ISO 8601 (ex: "2026-04-20T19:00:00+00:00")
- Tous les IDs : UUID v4 (strings)

---

## 📞 Contact & Support

**Backend API** : `https://jamconnexion.com/api`  
**Documentation API** : `/app/API_DOCUMENTATION.md`  
**Guide WebSocket** : `/app/MOBILE_WEBSOCKET_NOTIFICATIONS.md`

---

## ✅ Checklist d'implémentation mobile

### Phase 1 : Notifications (Prioritaire)
- [ ] Intégrer Socket.IO client
- [ ] Implémenter les 9 types de notifications (incluant `event_reminder`)
- [ ] Afficher les toasts/notifications push
- [ ] Badge compteur sur icônes
- [ ] Gérer les rappels J-3 et Jour J

### Phase 2 : Offres promotionnelles
- [ ] Afficher le compteur établissements (100 premiers)
- [ ] **Afficher le compteur musiciens (200 premiers)** ✨ NOUVEAU
- [ ] Adapter le tunnel d'inscription établissement
- [ ] Adapter le tunnel d'inscription musicien
- [ ] Texte dynamique selon l'offre (6 mois / 3 mois / 2 mois PRO)
- [ ] Activation automatique 2 mois PRO pour musiciens

### Phase 3 : GUSO
- [ ] Badge GUSO sur établissements
- [ ] Filtre GUSO (PRO uniquement)
- [ ] Gestion permissions PRO

### Phase 4 : Projet Solo
- [ ] Champ "nom du projet solo" dans profil
- [ ] Badge "🎸 Solo" sur profils
- [ ] Recherche par projet solo

### Phase 5 : Planning Groupe
- [ ] Afficher planning du groupe
- [ ] Export calendrier .ics
- [ ] Vérification appartenance groupe

### Phase 6 : Section Notifications
- [ ] **Page "Notifications" dans paramètres** ✨ NOUVEAU
- [ ] Liste exhaustive par rôle (Musiciens, Établissements, Mélomanes)
- [ ] Distinction notifications PRO (cyan)

### Phase 7 : Guide Utilisateur ✨ NOUVEAU
- [ ] Créer composant Guide interactif
- [ ] Version Musiciens (6 étapes)
- [ ] Version Établissements (5 étapes)
- [ ] Version Mélomanes (5 étapes)
- [ ] Bouton d'accès dans header (icône `?`)
- [ ] Navigation avec indicateurs de progression
- [ ] Possibilité de relancer depuis paramètres

### Phase 8 : Bouton Localisation Header ✨ NOUVEAU
- [ ] Déplacer bouton Localisation dans header
- [ ] Mode compact (icône uniquement)
- [ ] Indicateur d'état (point vert si actif)
- [ ] Modal/bottom sheet au clic (fonctionnalité inchangée)

### Phase 9 : Facebook Events (Future)
- [ ] Prévoir UI "Connecter Facebook"
- [ ] Badge "Synchronisé avec Facebook"
- [ ] À implémenter quand backend finalisé

---

**Dernière mise à jour** : 17 avril 2026  
**Version** : 2.5.0

🎸 **Bon développement !**

---

## 📝 Changelog

**17 avril 2026** :
- ✨ **Guide utilisateur interactif** adapté à chaque profil (Musiciens, Établissements, Mélomanes)
- ✨ **Déplacement bouton Localisation** dans le header (mode compact)
- ✨ Masquage bannière promotionnelle pour utilisateurs PRO
- ✨ Ajout offre promotionnelle musiciens (2 mois PRO / 200 premiers)
- ✨ Section notifications complète sur page Tarifs
- 🔧 Correction système rappels : 12h30 → 13h, 1x/jour uniquement
- ⚡ WebSocket ajouté aux rappels J-3 et Jour J
- 📊 Nouvel endpoint `/api/stats/promo-musicians`

**15 avril 2026** :
- ✨ Système notifications temps réel (9 types)
- ✨ Offre promotionnelle établissements (6 mois / 100 premiers)
- ✨ Filtre GUSO
- ✨ Projet solo pour musiciens
- 🐛 Fix planning de groupe (erreur 403)
- 📄 Documentation complète WebSocket
