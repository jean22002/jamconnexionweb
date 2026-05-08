# 📋 RÉCAP COMPLET — Application Web Jam Connexion

**Date de dernière mise à jour** : 17 avril 2026  
**Version** : Production (commit: ef4e967)  
**Stack** : React + FastAPI + MongoDB Atlas

---

## 🔐 Authentification & Profils

- **Login / Inscription** multi-rôles (Musicien, Établissement, Mélomane)
- **Vérification email** avec page `/verify-email` dédiée
- **Profils complets** avec upload d'images, badges, GUSO, nom de projet solo
- **Statut "En ligne"** automatique avec gestion temps réel
- **Reset mot de passe** avec email de réinitialisation
- **Statut PRO** avec gestion d'abonnements Stripe
- 📁 `frontend/src/pages/Auth.jsx`, `frontend/src/pages/VerifyEmail.jsx`, `backend/routes/auth.py`

---

## 🏠 Dashboard (Accueil)

### Dashboard Musicien
- **Dashboard contextuel** avec onglets dynamiques (Profil, Solo, Groupe, Carte, Candidatures, etc.)
- **Header intelligent** avec icônes : 
  - Guide (`?`) → Modal guide interactif
  - Localisation (`📍`) → Mode en déplacement 24h
  - Trophées (`🏆`) → Leaderboard
  - Badges (`🏅`) → Collection de badges
  - Notifications (`🔔`) → Temps réel
  - Messages (`💬`) → Messagerie
- **Bannière promo** : "2 mois PRO gratuits" pour les 200 premiers (masquée si déjà PRO)
- **Carte d'offre PRO** : 6,99€/mois avec bouton Stripe direct
- **Onglets disponibles** :
  - 👤 Profil (bio, instruments, styles, réseaux sociaux)
  - 🎤 Solo (projet solo, audio/vidéo, disponibilités)
  - 👥 Groupe (création, invitation, membres, planning)
  - 🗺️ Carte (établissements, filtres GUSO PRO, localisation)
  - 📋 Candidatures (en attente, acceptées, refusées)
  - 📅 Participations (événements passés/futurs)
  - 📊 Statistiques (vues profil, candidatures, taux d'acceptation)
- 📁 `frontend/src/pages/MusicianDashboard.jsx`, `frontend/src/features/musician-dashboard/`

### Dashboard Établissement
- **Dashboard complet** avec gestion événements, candidatures, planning
- **Header** avec boutons Guide, Trophées, Notifications, Messages, Statistiques abonnés
- **Bannière promo** : "6 mois gratuits" pour les 100 premiers (masquée si abonné)
- **Gestion PRO** : 12,99€/mois avec bouton Stripe
- **Onglets disponibles** :
  - 🎤 Profil (infos établissement, photos, équipement, jours de jam)
  - 📅 Événements (création, édition, gestion des slots)
  - 📋 Candidatures (tri, acceptation, refus)
  - 📊 Planning (vue calendrier des événements)
  - 💬 Messages (discussions avec musiciens)
  - 📈 Statistiques (vues, abonnés, engagement)
- **Géocodage automatique** : Latitude/longitude via Nominatim si non renseignées
- 📁 `frontend/src/pages/VenueDashboard.jsx`

### Dashboard Mélomane
- **Découverte événements** avec carte interactive
- **Abonnements établissements** favoris
- **Participations** événements avec rappels J-3 et Jour J (13h)
- **100% gratuit** (pas d'abonnement)
- 📁 `frontend/src/pages/MeloomaneDashboard.jsx` (si existe)

---

## 💳 Stripe — Paiements & Abonnements

### Configuration Stripe
- **Musicien PRO** : 6,99€/mois après 2 mois gratuits
  - Lien : `https://buy.stripe.com/5kQfZgfFjfVK0te4CZafS04`
  - Trial : 60 jours (2 mois)
  - Compteur : `/api/stats/promo-musicians` (200 places)

- **Établissement PRO** : 12,99€/mois après 6 ou 3 mois gratuits
  - Lien : `https://buy.stripe.com/3cI8wOfFj5h68ZKd9vafS03`
  - Trial : 180 jours (6 mois) pour les 100 premiers, puis 90 jours (3 mois)
  - Compteur : `/api/stats/promo` (100 places)

### Pages & Composants
- **Page Tarifs** (`/pricing`) avec liens Stripe contextuels selon rôle
- **Success Page** (`/payment/success`) → Redirection vers dashboard
- **Cancel Page** (`/payment/cancel`) → Réessayer le paiement avec bon lien selon rôle
- **Composant ProSubscriptionCard** : Affichage statut PRO + bouton upgrade
- **Transparence totale** :
  - "Aucun prélèvement pendant l'essai"
  - "L'abonnement débute à la fin de l'essai"
  - "Annulable à tout moment sans frais"
- 📁 `frontend/src/pages/Pricing.jsx`, `frontend/src/pages/PaymentSuccess.jsx`, `frontend/src/pages/PaymentCancel.jsx`, `frontend/src/components/ProSubscriptionCard.jsx`

---

## ⭐ Système d'Avis Multi-Critères

- **Modal d'avis** avec notation sur 5 critères (qualité musicale, ponctualité, professionnalisme, etc.)
- **Onglet Avis** dans les dashboards avec liste des avis reçus/donnés
- **Système de modération** automatique (seuils configurables)
- **Affichage public** sur les profils avec moyenne générale
- 📁 `frontend/src/components/ReviewModal.jsx`, `backend/routes/reviews.py`

---

## 📖 Guide Utilisateur Interactif ✨ NOUVEAU (17/04/2026)

### Fonctionnalité
- **Modal step-by-step** adapté à chaque rôle
- **3 versions complètes** :
  - 🎸 **Musiciens** : 6 étapes (Bienvenue, Carte, Localisation, Groupes, Badges, Notifications)
  - 🎤 **Établissements** : 5 étapes (Bienvenue, Visibilité, Événements, Candidatures, Notifications)
  - 🎵 **Mélomanes** : 5 étapes (Bienvenue, Carte, Suivre, Participer, Notifications)

### UI/UX
- **Bouton d'accès** : Icône `?` dans le header (à côté des trophées)
- **Navigation** : Boutons "Précédent" / "Suivant"
- **Indicateurs** : Dots de progression + compteur "X / Y"
- **Design** : Glassmorphism, icônes colorées, exemples pratiques
- **Responsive** : Desktop et mobile

### Contenu clé
- Explication détaillée du **bouton Localisation** (mode en déplacement 24h)
- Tutoriel **création de groupe** avec code d'invitation
- Guide **filtre GUSO** (exclusif PRO)
- Explications **notifications temps réel**

📁 `frontend/src/components/GuideModal.jsx`

---

## 🔔 Notifications Temps Réel (Socket.IO)

### Configuration WebSocket
- **URL WebSocket** : Via backend FastAPI sur port 8001
- **Connexion auto** : À la connexion utilisateur (avec token JWT)
- **Reconnexion auto** : En cas de déconnexion

### Événements écoutés (15 types)
1. `new_message` → Nouveau message reçu
2. `friend_request` → Demande d'ami
3. `friend_accepted` → Ami accepté
4. `badge_unlocked` → Badge débloqué
5. `application_accepted` → Candidature acceptée
6. `application_rejected` → Candidature refusée
7. `new_application` → Nouvelle candidature (pour venues)
8. `new_subscriber` → Nouvel abonné (pour venues)
9. `new_slot_available` → Nouveau créneau dispo
10. `new_event_created` → Événement créé par un établissement suivi
11. `event_reminder` → Rappel J-3 ou Jour J (13h précises)
12. `subscription` → Changement d'abonnement
13. `online_status` → Statut en ligne
14. `typing` → Utilisateur en train d'écrire
15. `message_read` → Message lu

### UI Notifications
- **Badge compteur** en temps réel dans le header
- **Toast notifications** pour événements importants
- **Page dédiée** `/notifications` avec :
  - Liste complète avec pagination
  - Filtre non-lues
  - Actions : Marquer tout lu, Tout supprimer
  - Auto-refresh toutes les 30 secondes (fallback)
  - Marquer comme lu au clic

### Daemon de rappels
- **Script background** : `backend/daemons/notifications_daemon.py`
- **Horaire fixe** : 13h00 (heure de Paris)
- **Rappels J-3** : 3 jours avant l'événement
- **Rappels Jour J** : Le jour même
- **Fréquence** : 1 seule fois par jour (corrigé)

📁 `backend/server.py` (Socket.IO), `backend/daemons/notifications_daemon.py`, `frontend/src/components/NotificationsDialog.jsx`

---

## 🗺️ Carte & Établissements

### Carte Interactive
- **Carte Leaflet** avec marqueurs des établissements
- **Géolocalisation automatique** : Tous les établissements ont lat/lng (géocodés via Nominatim)
- **Infobulles riches** : Nom, ville, département, région, styles musicaux
- **Popup détaillée** : Lien vers profil, bouton "Postuler"

### Filtres Avancés
- **Par région** : Dropdown toutes les régions françaises
- **Par style musical** : Sélection multiple (Rock, Jazz, Blues, etc.)
- **Par distance** : Si géolocalisation activée
- **Filtre GUSO** ✨ (Exclusif PRO) : Affiche uniquement les établissements labellisés GUSO
- **Recherche textuelle** : Nom établissement ou ville

### Badge GUSO
- **Visible** sur les cartes établissement
- **Indication** dans les listes
- **Filtre dédié** pour les musiciens PRO

📁 `frontend/src/features/musician-dashboard/tabs/MapTab.jsx`, `backend/routes/venues.py`

---

## 📍 Système de Localisation Temporaire ✨ MAJ (17/04/2026)

### Fonctionnalité "Mode En Déplacement"
- **Durée** : 24 heures
- **Deux méthodes** :
  1. GPS automatique (géolocalisation navigateur)
  2. Saisie manuelle (ville + code postal optionnel)

### Position UI
- **Ancienne** : Floating widget en bas à droite
- **Nouvelle** ✨ : Header, à côté des trophées
- **Mode compact** : Icône `MapPin` uniquement
- **Indicateur d'état** : Point vert pulsant si actif
- **Modal** : Identique, s'ouvre au clic

### Utilité
- Musicien en déplacement peut être visible dans une autre ville
- Apparaît dans les recherches des établissements locaux
- Parfait pour tournées, vacances, week-ends

📁 `frontend/src/components/LocationWidget.jsx`, `backend/routes/musicians.py`

---

## 📨 Candidatures & Slots

### Système de candidatures
- **Musicien → Établissement** : Candidature sur un slot ou événement
- **Statuts** : En attente, Acceptée, Refusée
- **Notifications temps réel** : WebSocket pour acceptation/refus
- **Groupes** : Possibilité de candidater en groupe (sélection du groupe lors de la candidature)

### Gestion des slots (Établissements)
- **Création slots** : Date, heure, durée, nombre de musiciens, rémunération
- **Gestion candidatures** : Tri, filtres, acceptation/refus en masse
- **Planning visuel** : Calendrier avec slots remplis/disponibles

### Onglet Participations (Musiciens)
- **Événements futurs** : Liste avec compte à rebours
- **Événements passés** : Historique avec possibilité de laisser un avis
- **Rappels** : J-3 et Jour J à 13h via WebSocket

📁 `backend/routes/musicians.py`, `backend/routes/venues.py`, `frontend/src/features/musician-dashboard/tabs/CandidaturesTab.jsx`

---

## 👥 Groupes Musicaux

### Création & Gestion
- **Création groupe** : Nom, style, répertoire, durée spectacle
- **Code d'invitation automatique** : Généré à la création (ex: `ABC123`)
- **Invitation membres** : Partage du code ou envoi par email
- **Rôles** : Admin (créateur) et Membres
- **Planning groupe** : Événements communs, répétitions

### Onglet Groupe (Dashboard Musicien)
- **Infos groupe** : Nom, membres, style, durée
- **Code d'invitation** : Affiché et copiable
- **Liste membres** : Avec possibilité de retirer (admin uniquement)
- **Événements** : Liste des candidatures et événements du groupe
- **Quitter le groupe** : Action disponible pour les membres

### Bug fix (corrigé)
- ✅ Code d'invitation stocké directement dans le document `bands`
- ✅ Génération automatique lors de la création
- ✅ Plus besoin d'appeler `/api/bands/{band_id}/invite-code`

📁 `frontend/src/features/musician-dashboard/profile/BandTab.jsx`, `backend/routes/musicians.py`

---

## 🏆 Gamification

### Système de Badges
- **Badges automatiques** : Déblocage selon actions (premier concert, 10 candidatures, etc.)
- **Badges manuels** : Attribués par admins
- **Badge GUSO** : Labellisation établissement
- **Badge PRO** : Statut abonnement
- **Affichage** : Collection dans `/badges`, sur profils publics

### Leaderboard (Classement)
- **Classement général** : Par points, vues, engagement
- **Filtres** : Par région, style, rôle
- **Page dédiée** : `/leaderboard`

📁 `frontend/src/pages/Badges.jsx`, `frontend/src/pages/Leaderboard.jsx`, `backend/routes/badges.py`

---

## 💬 Messagerie

### Fonctionnalités
- **Conversations 1-to-1** : Musiciens ↔ Établissements
- **Temps réel** : Via WebSocket
- **Indicateurs** : "En train d'écrire...", "Vu à X"
- **Pièces jointes** : Images, audio, vidéo
- **Notifications** : Badge compteur + toast

### UI
- **Page dédiée** : `/messages-improved`
- **Liste conversations** : Derniers messages, timestamp
- **Vue conversation** : Chat style moderne avec bulles
- **Responsive** : Desktop (sidebar) et mobile (liste puis conversation)

📁 `frontend/src/pages/MessagesImproved.jsx`, `backend/routes/messages.py`

---

## 📊 Statistiques & Analytics

### Dashboard Musicien
- **Vues profil** : Nombre de vues (incrémenté automatiquement)
- **Candidatures** : Total, en attente, acceptées, refusées
- **Taux d'acceptation** : Pourcentage
- **Événements** : Participations totales, à venir, passées

### Dashboard Établissement
- **Abonnés** : Nombre total (affiché dans header)
- **Vues profil** : Statistiques de visite
- **Événements** : Total créés, à venir, passés
- **Candidatures** : Reçues, acceptées, refusées
- **Taux de remplissage** : Slots remplis / slots totaux

### Endpoints dédiés
- `GET /api/stats/counts` : Compteurs globaux (musiciens, venues, events)
- `GET /api/stats/promo` : Compteur établissements dans l'offre 6 mois
- `GET /api/stats/promo-musicians` : Compteur musiciens dans l'offre 2 mois

📁 `backend/routes/stats.py`, `frontend/src/components/dashboard/AnalyticsTab.jsx`

---

## 📄 Landing Page & Marketing

### Sections
- **Hero** : CTA principal avec animation
- **Bannière promo** : Offres de lancement (masquée si utilisateur PRO)
- **Features** : 3 colonnes (Musiciens, Établissements, Mélomanes)
- **Pricing** : Cartes avec prix transparents
- **Testimonials** : Avis utilisateurs
- **FAQ** : Questions fréquentes avec tarifs détaillés
- **Footer** : Liens, CGU, RGPD, réseaux sociaux

### Optimisations
- **SEO** : Meta tags, Open Graph
- **Performance** : Lazy loading images
- **Responsive** : Mobile-first
- **Animations** : Scroll reveal, hover effects

📁 `frontend/src/pages/Landing.jsx`

---

## 🔧 Intégrations Tierces

### Nominatim (Géocodage)
- **API publique** OpenStreetMap
- **Usage** : Attribution automatique lat/lng aux établissements
- **Migration** : Script de géocodage de tous les établissements existants (125 établissements migrés)

### Resend (Emails)
- **Vérification email** : Envoi code 6 chiffres
- **Reset password** : Lien de réinitialisation
- **Notifications** : Emails de rappel (optionnel)
- **Configuration** : API Key utilisateur dans `.env`

### Cloudflare (DNS)
- **Domaine** : `jamconnexion.com`
- **HTTPS** : Certificat SSL automatique
- **Proxy** : Protection DDoS

📁 `backend/routes/auth.py`, `backend/utils/geocoding.py`

---

## 🏗️ Architecture Technique

### Frontend
| Technologie | Usage |
|---|---|
| **React 18** | Framework UI |
| **React Router** | Navigation SPA |
| **Tailwind CSS** | Styling + Glassmorphism |
| **Shadcn/UI** | Composants UI (`/app/frontend/src/components/ui/`) |
| **Leaflet** | Carte interactive |
| **Socket.IO Client** | WebSocket temps réel |
| **Axios** | Requêtes HTTP |
| **React Query** | Cache et état serveur (si utilisé) |

### Backend
| Technologie | Usage |
|---|---|
| **FastAPI** | Framework API REST |
| **Motor** | MongoDB async driver |
| **MongoDB Atlas** | Base de données production |
| **Socket.IO** | WebSocket serveur |
| **Pydantic** | Validation données |
| **Python-Jose** | JWT tokens |
| **BCrypt** | Hashing mots de passe |
| **Uvicorn** | Serveur ASGI |
| **Supervisor** | Gestion processus (backend, frontend, daemon) |

### Infrastructure
| Service | Configuration |
|---|---|
| **Hébergement** | Kubernetes (Emergent) |
| **Backend** | `0.0.0.0:8001` (interne) |
| **Frontend** | Port `3000` (interne) |
| **MongoDB** | Atlas (cluster production) |
| **Stripe** | Checkout + Webhooks |
| **Domaine** | `jamconnexion.com` (production) |
| **Preview** | `jamconnexion.preview.emergentagent.com` |

### Variables d'environnement
```bash
# Backend (.env)
MONGO_URL_PRODUCTION=mongodb+srv://...
DB_NAME=jamconnexion
JWT_SECRET_KEY=...
RESEND_API_KEY=...
STRIPE_WEBHOOK_SECRET=...
ENVIRONMENT=production

# Frontend (.env)
REACT_APP_BACKEND_URL=https://jamconnexion.com/api  # Production
# REACT_APP_BACKEND_URL=  # Preview (vide = relatif)
```

### Déploiement
- **Hot Reload** : Frontend et backend (pas besoin de redémarrer)
- **Restart requis** : Si changement `.env` ou `package.json` / `requirements.txt`
- **Commande** : `sudo supervisorctl restart frontend/backend`

---

## 📁 Fichiers Clés pour l'Agent Mobile

### Frontend - Pages principales
```
frontend/src/pages/
├── Landing.jsx                  → Landing page
├── Auth.jsx                     → Login/Inscription
├── VerifyEmail.jsx              → Vérification email
├── MusicianDashboard.jsx        → Dashboard musicien (3000+ lignes)
├── VenueDashboard.jsx           → Dashboard établissement (4300+ lignes)
├── Pricing.jsx                  → Page tarifs Stripe
├── PaymentSuccess.jsx           → Retour Stripe succès
├── PaymentCancel.jsx            → Retour Stripe annulation
├── Leaderboard.jsx              → Classement
├── Badges.jsx                   → Collection badges
└── MessagesImproved.jsx         → Messagerie
```

### Frontend - Composants clés
```
frontend/src/components/
├── ui/
│   ├── GuideModal.jsx           → Guide interactif ✨ NOUVEAU
│   ├── ProSubscriptionCard.jsx → Carte abonnement PRO
│   └── [shadcn components]      → Button, Dialog, Card, etc.
├── LocationWidget.jsx           → Widget localisation ✨ MAJ
├── NotificationsDialog.jsx      → Dialog notifications
└── dashboard/
    ├── DashboardHeader.jsx      → Header avec icônes
    ├── ProOfferCard.jsx         → Offre PRO dépliable
    └── [autres tabs]
```

### Frontend - Features (Organisation modulaire)
```
frontend/src/features/musician-dashboard/
├── tabs/
│   ├── MapTab.jsx               → Carte avec filtres ✨ Filtre GUSO PRO
│   ├── CandidaturesTab.jsx      → Gestion candidatures
│   └── ParticipationsTab.jsx    → Événements passés/futurs
└── profile/
    ├── BandTab.jsx              → Gestion groupe
    └── SoloTab.jsx              → Profil solo
```

### Backend - Routes principales
```
backend/routes/
├── auth.py                      → Login, inscription, vérification email
├── musicians.py                 → CRUD musiciens, candidatures, localisation
├── venues.py                    → CRUD établissements, événements, slots
├── bands.py                     → Groupes musicaux
├── messages.py                  → Messagerie
├── notifications.py             → Notifications
├── badges.py                    → Système de badges
├── reviews.py                   → Système d'avis
├── stats.py                     → Statistiques & compteurs
├── account.py                   → Gestion compte (MongoDB Atlas forcé)
├── online_status.py             → Statut en ligne (MongoDB Atlas forcé)
├── uploads.py                   → Upload fichiers (MongoDB Atlas forcé)
└── webhooks.py                  → Stripe webhooks (MongoDB Atlas forcé)
```

### Backend - Services & Utils
```
backend/
├── server.py                    → Point d'entrée FastAPI + Socket.IO
├── utils/
│   ├── auth.py                  → JWT, vérification token
│   └── geocoding.py             → Nominatim géocodage
└── daemons/
    └── notifications_daemon.py  → Rappels 13h (J-3, Jour J)
```

### Configuration
```
backend/
├── requirements.txt             → Dépendances Python
└── .env                         → Variables d'environnement

frontend/
├── package.json                 → Dépendances Node.js
├── .env                         → Variables d'environnement
└── tailwind.config.js           → Configuration Tailwind
```

---

## 🐛 Bugs Corrigés Récemment

### 17 avril 2026
- ✅ **Crash VenueDashboard** : Erreur sur variable `venue` renommée en `profile` + hooks manquants
- ✅ **Endpoint manquant** : `GET /api/stats/counts` créé pour landing page
- ✅ **Code d'invitation groupes** : Stockage direct dans document `bands` avec génération auto
- ✅ **Erreur 403 planning groupes** : Endpoints `/api/bands/{band_id}/events` créés
- ✅ **Daemon notifications** : Horaire fixe 13h + fréquence 1x/jour (au lieu de plusieurs)
- ✅ **Carte vide** : Géocodage automatique via Nominatim + migration 125 établissements
- ✅ **MongoDB local/Atlas** : Toutes les routes forcées sur `MONGO_URL_PRODUCTION`
- ✅ **UI débordante mobile** : Fix padding "Mes Participations"

### Sessions précédentes
- ✅ **WebSocket déconnexions** : Reconnexion auto implémentée
- ✅ **Filtre GUSO non fonctionnel** : Ajout projection `is_guso` dans `GET /api/venues`
- ✅ **Bannière promo PRO** : Masquage pour utilisateurs déjà abonnés

---

## ⚠️ Points d'Attention pour l'Équipe Mobile

### 1. Différences URLs
- **Web Production** : `https://www.jamconnexion.com/api`
- **Web Preview** : `https://jamconnexion.preview.emergentagent.com/api`
- **Mobile** : Proxy via backend mobile (`http://localhost:8001/api`)

### 2. WebSocket
- **Web** : Connexion directe à FastAPI backend
- **Mobile** : Via proxy backend mobile (configuré différemment)

### 3. Stripe
- **Web** : Redirect vers Stripe Checkout externe
- **Mobile** : Peut utiliser Stripe SDK natif ou redirect web

### 4. Notifications
- **Web** : WebSocket + fallback polling
- **Mobile** : WebSocket + push notifications natives (Firebase)

### 5. Géolocalisation
- **Web** : Navigateur API + saisie manuelle
- **Mobile** : GPS natif + saisie manuelle

---

## 📊 Métriques & KPIs

### Compteurs temps réel
- **Musiciens inscrits** : Via `GET /api/stats/counts`
- **Établissements inscrits** : Via `GET /api/stats/counts`
- **Événements totaux** : Via `GET /api/stats/counts`
- **Musiciens PRO (offre 2 mois)** : Via `GET /api/stats/promo-musicians` (max 200)
- **Établissements PRO (offre 6 mois)** : Via `GET /api/stats/promo` (max 100)

### Base de données actuelle (Production Atlas)
- **Établissements** : 125 géolocalisés
- **Musiciens** : ~X (à vérifier via API)
- **Événements** : ~Y (à vérifier via API)

---

## 🚀 Roadmap & Fonctionnalités en Pause

### En pause (décision utilisateur)
- **Intégration Facebook Events** : Synchronisation auto événements pages FB
  - Guide créé : `/app/FACEBOOK_APP_SETUP_GUIDE.md`
  - Statut : En attente App ID + App Secret Facebook

### À venir (backlog)
- **Refactoring composants volumineux** : `MusicianDashboard.jsx` (3000+ lignes), `VenueDashboard.jsx` (4300+ lignes)
- **Seuils modération configurables** : Actuellement hardcodés dans le code
- **WebSocket notifications** : Extension pour plus d'événements métier
- **Système de recommandations** : ML pour suggérer établissements/musiciens

---

## 📞 Contacts & Ressources

### Documentation
- **GitHub** : https://github.com/jean22002/jamconnexionweb
- **Commits récents** :
  - `ef4e967` - 💰 Update: Prix Musicien PRO 6,99€, Liens Stripe, Clarifications
  - `513efb4` - ✨ Update: Guide, Localisation, Bannière PRO
  - `7276c6f` - Add yarn.lock files - Jam Connexion production ready

### Guides créés
- `/app/MOBILE_APP_UPDATE_SUMMARY.md` - Documentation mobile complète
- `/app/RECAP_EQUIPE_MOBILE_17_AVRIL_2026.md` - Récap urgent du 17/04/2026
- `/app/MOBILE_WEBSOCKET_NOTIFICATIONS.md` - Guide WebSocket mobile
- `/app/FACEBOOK_APP_SETUP_GUIDE.md` - Guide intégration Facebook (en pause)
- `/app/memory/test_credentials.md` - Credentials de test
- `/app/memory/PRD.md` - Product Requirements Document

### Credentials de test
- **Musicien** : `test@gmail.com` / `test`
- **Établissement** : `bar@gmail.com` / (mot de passe requis en prod)

---

**Date de génération** : 17 avril 2026  
**Prochaine mise à jour** : À définir selon évolutions
