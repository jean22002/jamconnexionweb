# Jam Connexion - PRD

## Original Problem Statement
Application de mise en relation entre cafés-concerts et musiciens.
- Abonnement 12,99€/mois pour les établissements avec 2 mois d'essai gratuit
- Gratuit pour les musiciens
- Géolocalisation pour localiser les établissements à proximité
- URL production : https://jamconnexion.com

## Architecture
- **Backend**: FastAPI + MongoDB Atlas (production) + Stripe + Resend
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Leaflet maps
- **DB**: MongoDB Atlas (ENVIRONMENT=production → MONGO_URL_PRODUCTION)
- **Tous les fichiers routes utilisent Atlas** (server.py, auth.py, venues.py, payments.py, musicians.py, account.py, online_status.py, uploads.py, webhooks.py)

## What's Been Implemented

### Phase 1 (MVP)
- [x] Landing page, Auth (register/login), Dashboards musicien/venue/mélomane
- [x] Carte interactive géolocalisée (Leaflet)
- [x] Intégration Stripe (checkout, paiement)
- [x] Période d'essai 2 mois établissements

### Phase 2 (Fonctionnalités avancées)
- [x] Profils enrichis (musicien, venue, groupe)
- [x] Système d'amis, messagerie, notifications
- [x] Calendrier boeufs/concerts/planning + candidatures
- [x] Gamification (badges, leaderboard)

### Phase 3 (Mars 2026)
- [x] Vérification email via Resend + page /verify-email frontend
- [x] Codes d'invitation groupes (6 chars, unique, auto-généré)
- [x] Bouton Partager + Copier code sur carte groupe (admin)
- [x] Auto-save à la création de groupe
- [x] Message pionnier (Landing + Dashboard, dégradé coloré)
- [x] Modal "Contacter ce groupe" + endpoint backend email
- [x] Options cachet "Fixe" / "À définir avec l'établissement"
- [x] Fix VenueDashboard (venue→profile, handlers manquants, states manquants)
- [x] Géocodage automatique villes (Nominatim) + migration 42 venues Atlas
- [x] 42 venues réparties sur 40 villes / 12 régions françaises
- [x] Fix projection API venues (region, latitude, longitude)
- [x] Unification MongoDB Atlas sur toutes les routes backend
- [x] Fix layout mobile "Mes Participations"
- [x] Endpoint GET /api/stats/counts
- [x] Archive ZIP + PDF descriptif INPI e-Soleau
- [x] Suppression "Aucune carte bancaire requise" Landing
- [x] Filtre par style musical sur la carte (chips interactifs)
- [x] Carte rétractable/collapsible (toggle expand/collapse avec localStorage)
- [x] Offre PRO rétractable/collapsible (ProSubscriptionCard + ProSubscriptionManager)
- [x] Fix doublon "Rock" dans filtres styles musicaux (normalisation casse)
- [x] Amélioration lisibilité carte : tooltips au survol uniquement (non permanents)
- [x] Clustering des marqueurs carte (react-leaflet-cluster, gradient purple-pink, 3 tailles)
- [x] Filtre candidatures PRO sur carte (par date et style musical, réservé abonnés PRO)
- [x] Filtre offres disponibles PRO sur carte (par date et style, réservé abonnés PRO)
- [x] Dashboard Mélomane : Clustering carte (sans filtres styles/région/département)
- [x] Dashboard Mélomane : Onglet Établissements avec filtres par région et département

### Phase 4 (Avril 2026 - Corrections critiques + Export factures)
- [x] Fix connexion MongoDB : Standardisation variable `MONGO_URL` (suppression `MONGO_URL_PRODUCTION`)
- [x] Fix modèle Pydantic VenueProfile : Champs address/city/postal_code en Optional
- [x] Vérification 100% conformité profils vs README (Établissement, Musicien, Mélomane)
- [x] Fix popup carte Leaflet : Contraste texte amélioré (fond blanc opaque)
- [x] Fix cache PWA : Incrémentation CACHE_VERSION (résolution ChunkLoadError)
- [x] Export factures ZIP pour Musiciens PRO (endpoint + UI avec filtres période/type/statut)
- [x] Export factures ZIP pour Établissements (endpoint + UI avec filtres période/type/statut)

## P0/P1/P2 Remaining

### P1
- [ ] Upload d'images (actuellement via URL)
- [ ] Notifications push/email
- [ ] Recherche avancée par style, équipement, date

### P2
- [ ] Notifications temps réel (WebSockets)
- [ ] Système d'avis/notation
- [ ] Chat/messagerie privée amélioré
- [ ] Désactivation statut PRO auto (quand décidé par l'utilisateur)
- [ ] Seuils de modération configurables

## Key API Endpoints
- `POST /api/auth/register` — Inscription (email_verified=false, PRO auto)
- `POST /api/auth/login` — Connexion (bloqué si email non vérifié)
- `GET /api/auth/verify-email?token=xxx` — Vérification email
- `POST /api/auth/resend-verification?email=xxx` — Renvoi lien (3/jour)
- `GET /api/stats/counts` — Compteurs landing page
- `GET /api/venues` — Liste venues avec region/GPS
- `POST /api/musicians/contact-band/{band_id}` — Contacter admin groupe
- `GET /api/musicians/me/accounting/invoices/download` — Export ZIP factures (Musiciens PRO uniquement)
- `GET /api/venues/me/accounting/invoices/download` — Export ZIP factures (Établissements, inclus abonnement)

## Notes Production
- `REACT_APP_BACKEND_URL` doit être vide en déploiement (URLs relatives)
- Cloudflare redirect www → non-www configuré
- `ENVIRONMENT='production'` active MongoDB Atlas
