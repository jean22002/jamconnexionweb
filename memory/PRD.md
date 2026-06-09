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
- [x] Fix console warning VenueDashboard : Suppression "No profile ID" (fetchEvents optimisé)
- [x] Fix WebSocket critique : Socket.IO monté avant middlewares (handshake 500 résolu)
- [x] Notifications temps réel opérationnelles via Socket.IO

### Phase 5 (Mai 2026 - Parité Web ↔ Mobile)
- [x] CRUD complet des groupes (POST/GET/PUT/DELETE + leave logic)
- [x] Comptabilité musicien (API + UI avec calcul GUSO)
- [x] Healthcheck monitor (15 endpoints, alertes email Resend)
- [x] AdSense interstitiel pour comptes free (3-5s avant envoi message)
- [x] Filtres profils étendus à 25 instruments + filtre par profil recherché
- [x] Logique Quitter/Supprimer pour les groupes (membre vs admin)
- [x] Enrichissement city-to-location pour filtrage par région
- [x] **API Chat enrichie** : `GET /chat/conversations` complète à la volée `name`/`role`/`avatar` des participants (jointure users + musicians/venues/melomanes)
- [x] **Fonction `resolve_display_name`** : fallback intelligent name → profile.stage_name/venue_name/username → email
- [x] **Alias `GET /api/online-status/users/{user_id}`** (pluriel) pour compatibilité mobile
- [x] **Heartbeat polling web** : déjà actif via `useOnlineStatus` (PWAPrompt monté globalement, ping toutes les 2 min + sur interactions)
- [x] Healthcheck monitor : 15/15 endpoints UP en production

## P0/P1/P2 Remaining

### P1
- [x] ~~Notifications temps réel (WebSockets)~~ → **RÉSOLU** (Socket.IO fonctionnel)
- [ ] Upload d'images (actuellement via URL)
- [ ] Notifications push/email
- [ ] Recherche avancée par style, équipement, date

### P2
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

## Changelog 2026-02-05 — Fix Flux Acceptation Candidature (Mobile sync)
- **`POST /api/applications/{id}/accept`** insère désormais dans `db.concerts` (source unique de vérité)
  - Champs : `id={app_id}_concert`, `band_id` (résolu), `band_type`, `musician_id`, `source="application_accepted"`, `application_id`
  - Idempotent (pas de doublon si rappelé)
  - Réponse JSON enrichie : `{ message, concert_id, band_id }`
- **Résolution band_id Solo** : si pas de `band_id`, le serveur cherche `db.bands{leader_id, band_type:"Solo"}` puis `musicians.bands[]`
- **`is_band_member`** (bands.py) corrigé : reconnaît maintenant les Solo bands stockés dans `db.bands` (auparavant ne regardait que `musicians.bands[]` embedded)
- **`GET /api/applications/my`** expose désormais `band_type` (toujours présent, "Solo" si pas de band)
- **Headers `Cache-Control: no-cache`** posés sur `/accept`, `/applications/my`, `/bands/{id}/events` → pas de purge Cloudflare nécessaire
- Document de réponse complète à l'agent mobile : `/app/memory/REPONSE_MOBILE_ACCEPT_APPLICATION.md`
- **🆕 `POST /api/musicians/me/ensure-solo-band`** : crée (idempotent) le Solo band du musicien connecté dans `db.bands`.
- **🆕 Auto-création du Solo band au register** : tout nouveau musicien reçoit automatiquement un Solo band dans `db.bands` lors de `POST /api/auth/register`.
- **🆕 Backfill rétroactif** : 82 musiciens existants migrés via `scripts/backfill_solo_bands.py` (idempotent).
- **🆕 Sync Solo band** : `PUT /api/musicians` synchronise désormais `name`, `leader_name`, `city`, `music_styles`, `members[0].name` du Solo band associé quand le musicien modifie son pseudo / styles / ville.
- **🆕 Formulaire web "Projet Solo" aligné mobile** (2026-02-07) :
  - Nouveau composant `frontend/src/features/musician-dashboard/profile/SoloProjectFormDialog.jsx` (accordion 7 sections : Base, Styles, Localisation, Détails, Structure & paiement, Recrutement, Réseaux).
  - Bouton "🎤 Ajouter un projet Solo" dans le BandTab (à côté de "Ajouter un groupe").
  - Édition d'un Solo band ouvre automatiquement ce nouveau dialog (détection via `band_type === "Solo"`).
  - `band_type` verrouillé à `"Solo"`, autocomplete ville via `api-adresse.data.gouv.fr`, payload identique à l'app mobile (avec alias `looking_for_profiles` pour compat ascendante).
  - Endpoints utilisés : `POST /api/bands`, `PUT /api/musicians/bands/{id}`, `DELETE /api/musicians/bands/{id}`.
  - Tests E2E (playwright + curl) : création/save/styles/sections accordion validés.
- **🎵 Synchronisation Web ↔ Mobile Builds 90→94** (2026-02-07) :
  - **Build 93 (P0 — Confidentialité GUSO)** : retrait du badge "💼 Concert avec contrat GUSO" sur la vue publique d'un établissement (`VenueDetail.jsx` slot list). Le badge reste visible côté venue propriétaire uniquement.
  - **Build 94 (P1 — Couleurs calendrier Planning)** : `Calendar.jsx` refactoré → slots ouverts sans acceptation = 📢 Candidature jaune ; slots acceptés = couleur du type (concert vert / bœuf violet / karaoké rose / spectacle cyan) ; slots fermés sans acceptation = Réservé rouge. Légende mise à jour dans `PlanningTab.jsx`. Compteurs onglets "Planning (N)" et "Candidatures (N)" alimentés en temps réel via nouveau fetch `fetchAllReceivedApplications`. Normalisation des dates `YYYY-MM-DD` lors du fetchEvents. Cache-buster `?_=${ts}` + headers `no-cache` sur tous les GET planning.
  - **Build 92 (P1 — Apparition instantanée)** : `fetchProfile` (MusicianDashboard) avec cache-buster + headers no-cache ; `handleSoloProjectSaved` fait l'optimistic update du `profileForm.bands` avant le re-fetch. Le nouveau Solo apparaît immédiatement après le save.
  - **Build 91 (P2 — Filtrage candidatures par formation)** : nouveau helper `utils/formationCompatibility.js` (`detectFormationType`, `isProjectCompatible`, `formationLabel`). Sélecteur "Formation recherchée" (7 chips Tout/Solo/Duo/Trio/Quatuor/Quintet/Groupe 6+) dans `PlanningTab.jsx` création de slot → auto-remplit `max_musicians` + préfixe description. Modèle backend `PlanningSlot` + `PlanningSlotResponse` étendus avec `formation_type` + `max_musicians`. Côté musicien (VenueDetail), select de candidature affiche les projets verrouillés (🔒) avec raison d'incompatibilité, et CTA "Créer un projet [X]" si aucun compatible.
  - **Build 90 (P2 — Cleanup Solo legacy)** : onglet "Solo" retiré du ProfileEditModal, "Groupe" renommé en "Projets". Envois de `solo_profile` dans `PUT /musicians/me` supprimés (3 occurrences MusicianDashboard + 1 dans `useProfile.js`). Backend continue d'ignorer `solo_profile` si jamais reçu (depuis Build fix data wipe).
  - **Fix bug pré-existant** : `setSaving is not defined` corrigé en exposant `setSaving` depuis le hook `useProfileManager`, et suppression d'un useEffect inutile `setGallery(profile.gallery)` (remplacé par une dérivation directe).
  - Tests E2E playwright validés : calendrier 8 catégories avec bonnes couleurs (Candidature jaune, Concert vert, Karaoké rose, Réservé rouge, etc.) ; tous les onglets fonctionnent.
- **🛡️ FIX CRITIQUE bug data wipe `PUT /api/musicians[/me]`** (2026-02-06) :
  - **Cause** : `update_data = data.model_dump()` produisait toujours `bands=[]` par défaut Pydantic. Ancien build mobile (78/80) qui envoyait `solo_profile` sans `bands` → `$set: {bands: []}` → WIPE de tous les bands en BDD.
  - **Fix** : on construit `update_data` UNIQUEMENT avec les clés effectivement présentes dans le body JSON brut (`request.json()`).
  - `solo_profile` est désormais **ignoré côté write** (logged warning), lecture seule comme demandé par l'agent mobile.
  - Testé E2E : POST /api/bands {name:"Moo"} → PUT /musicians/me avec solo_profile sans bands → bands[] préservé ✅
- **🆕 Backfill rétroactif des acceptations** : `scripts/backfill_accepted_to_concerts.py` exécuté → **10 concerts historiques** créés dans `db.concerts` à partir des candidatures acceptées (1 échec sur app orpheline avec slot supprimé). Idempotent.
- **Fix bug pré-existant** : suppression de la définition dupliquée de la route `/api/auth/logout` (le second `logout` shadowait le premier).
- ✅ Tests E2E curl validés en preview prod (register → musician → solo band auto-créé → slot → apply → accept → /bands/{id}/events → concert visible)
- **🛡️ Build 95 — Robustesse parsing des dates (Web + Backend)** (2026-02-07) :
  - **Backend** : nouveau `backend/utils/date_normalization.py` (`normalize_date_str`, `normalize_event_dates`). Appliqué sur tous les endpoints planning / concerts / jams / karaokés / spectacles / applications / bands events. Garantit `YYYY-MM-DD` strict sur les champs `date` et `slot_date`.
  - **Web** : nouveau `frontend/src/utils/dateFormatting.js` (`parseEventDate`, `formatEventDate`, `toDateKey`). Tolère null/undefined/""/legacy ISO. Sécurisation `VenueDashboard.jsx`, `VenueDetail.jsx`, `MusicianDashboard.jsx` (suppression des `new Date(date + 'T00:00:00')` dangereux).
  - **Mobile** : briefing complet préparé dans `/app/memory/MESSAGE_MOBILE_BUILD_95_DATES.md` (helper à copier + 14 endroits à sécuriser + patterns dangereux à grepper). En attente de port côté agent mobile.
- **🐛 Fix bug critique Comptabilité musicien** (2026-02-09) :
  - **Bug** : `ReferenceError: entriesByEventId is not defined` crash l'onglet Comptabilité musicien dès l'ouverture (production + preview).
  - **Cause** : le composant `GeneralAccountingContent` recevait `editingConcert`, `setEditingConcert`, `entriesByEventId`, `setEntriesByEventId` en props (passés par le parent) mais ne les listait PAS dans sa destructuration. Erreur déjà signalée par ESLint (no-undef) mais ignorée.
  - **Fix** : ajout des 4 props dans la destructuration de `GeneralAccountingContent` (`components/accounting/AccountingTab.jsx`). Lint clean. E2E validé sur `test@gmail.com` : onglet Comptabilité charge les 20 concerts factices sans crash.
- **⚖️ Décharge légale Comptabilité (Build 95.1)** (2026-02-09) :
  - Petit paragraphe italique discret ajouté en bas de l'onglet Comptabilité côté musicien (`components/accounting/AccountingTab.jsx`) ET côté venue (`features/venue-dashboard/tabs/AccountingTab.jsx`).
  - Texte : « Jam Connexion est un outil d'aide au suivi… ni un logiciel de comptabilité, ni un logiciel de facturation officiel… ne peut être tenu responsable d'une éventuelle perte de données ou d'une erreur de saisie. »
  - data-testid : `accounting-disclaimer-musician` / `accounting-disclaimer-venue`.
  - Briefing pour port mobile inclus dans `MESSAGE_MOBILE_BUILD_95_DATES.md` (§9).
