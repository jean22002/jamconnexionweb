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
- **🍪 Monétisation + RGPD Web (Build 95.2)** (2026-02-09) :
  - **Google Consent Mode v2** : signaux publicitaires par défaut DENIED dans `public/index.html`. Update via `gtag('consent','update',...)` au choix utilisateur.
  - **Bandeau RGPD custom** (`components/AdConsentBanner.jsx`) sticky bottom — Accepter / Refuser + lien CGU. Monté globalement dans `App.js`. data-testid `ad-consent-banner` / `ad-consent-accept` / `ad-consent-refuse`.
  - **Hook `useAdConsent(token)`** (`hooks/useAdConsent.js`) : lit localStorage en priorité, sync depuis backend si user connecté (backend gagne), expose `consent`, `canShowAds`, `canShowNpa`, `acceptConsent`, `refuseConsent`. Sync vers `PATCH /api/auth/me/ad-consent` best-effort.
  - **Backend** : `UserResponse` étendu avec `ad_consent: bool | None` + `ad_consent_date: str | None`. Nouveau modèle `AdConsentUpdate`. Endpoint `PATCH /api/auth/me/ad-consent` (rate-limited 20/h). `GET /api/auth/me` expose désormais les deux champs.
  - **Banner publicitaire mélomane** (`components/AdBanner.jsx`) sticky bottom — affichée uniquement si `role === 'melomane'` ET `canShowAds === true` ET slot configuré. Skip silencieux si slot vide.
  - **Interstitiel "Postuler à un créneau"** (`pages/VenueDetail.jsx`) : musiciens free + consent === true → modal 5s avant ouverture du dialog application. PRO + consent === false skippent directement.
  - **MusicianDashboard "Contacter groupe"** : check `canShowAds` ajouté au déclenchement existant.
  - **Audit role venue** : confirmé qu'aucun composant Ad* n'est monté dans `VenueDashboard.jsx`. Les venues ne voient JAMAIS de pub.
  - **Variables ENV** : `REACT_APP_ADSENSE_SLOT_INTERSTITIAL_APPLY=` ajoutée dans `.env` (à remplir avec slot AdSense côté utilisateur).
  - Tests E2E playwright validés : bandeau apparaît au 1er visit, Accept/Refuse persistés en localStorage + sync backend confirmée via `GET /auth/me` qui retourne `ad_consent: true`, `ad_consent_date: ...`. Aucune erreur runtime sur login.
  - Briefing complet pour port mobile : `/app/memory/MESSAGE_MOBILE_BUILD_95.2_AD_CONSENT.md` (UMP SDK + sync logic).
- **🎚️ Préférences publicitaires user-settings (Build 95.3)** (2026-02-09) :
  - Nouveau composant `components/AdConsentPreferences.jsx` (statut courant + Accepter/Refuser à tout moment, conforme exigence CNIL "retrait aussi facile que consentement").
  - Intégré dans 3 emplacements : `SettingsTab` musicien (`features/musician-dashboard/profile/SettingsTab.jsx`), `SettingsTab` venue (`features/venue-dashboard/tabs/SettingsTab.jsx`), onglet Paramètres mélomane (`pages/MelomaneDashboard.jsx`).
  - data-testid : `ad-consent-preferences`, `ad-consent-status-accepted/refused/undefined`, `ad-consent-pref-accept/refuse`.
  - Test E2E playwright validé : modal Mon Profil → Paramètres → statut "Publicités personnalisées acceptées" affiché correctement avec le bouton Accepter pré-sélectionné. Synchronisé avec backend `ad_consent: true` confirmé.
  - Côté mobile, l'équivalent est `showPrivacyOptionsForm()` exposé via le UMP SDK (Build 109).
- **📜 Page publique Politique de cookies (Build 95.4)** (2026-02-09) :
  - Nouvelle page `/cookies` (`pages/Cookies.jsx`) accessible sans connexion.
  - Sections : Qu'est-ce qu'un cookie / Cookies essentiels (tableau jc_auth, jc_ad_consent_v1, *_activeTab) / Cookies publicitaires (AdSense web + AdMob mobile, publisher IDs) / Mesure d'audience / Comment gérer vos cookies / Droits RGPD / Modification / Liens utiles.
  - Lien "Cookies" ajouté au footer du Landing (`pages/Landing.jsx`).
  - Le bandeau de consentement (`components/AdConsentBanner.jsx`) pointe désormais "En savoir plus" vers `/cookies` au lieu de `/cgu`.
  - data-testid : `cookies-page`, `footer-cookies-link`.
- **🆕 Publisher ID AdSense unifié** (2026-02-09) :
  - Migration de `ca-pub-4254207195182110` vers `ca-pub-9998561845977424` (même publisher que AdMob mobile pour rapports unifiés).
  - 3 endroits mis à jour : `public/index.html`, `frontend/.env` (`REACT_APP_ADSENSE_CLIENT`), `pages/Cookies.jsx`.
- **📝 Auth form name attributes** (2026-02-09) :
  - Ajout `name="email"` et `name="password"` sur les inputs login (`pages/Auth.jsx`) pour permettre la validation Google AdSense via crawler.
- **📚 Blog public + génération LLM (Build 95.5)** (2026-02-09) :
  - **Backend** : `models/blog.py` (BlogArticle, BlogArticleListItem), `routes/blog.py` (GET /api/blog, GET /api/blog/{slug} avec compteur vues). Collection MongoDB `blog_articles`. Enregistré dans `server.py`.
  - **Frontend** : `pages/Blog.jsx` (liste articles avec cards glassmorphism), `pages/BlogPost.jsx` (article individuel avec markdown renderer custom — h1/h2/h3, gras, italique, listes, liens, blockquotes). Routes `/blog` et `/blog/:slug` lazy-loaded dans App.js.
  - **Styles** : classe `.prose-blog` ajoutée dans `index.css` (titres, paragraphes, listes, liens stylisés).
  - **Génération automatique** : script `backend/scripts/generate_blog_articles.py` qui appelle Claude Sonnet 4.6 via Emergent LLM Key pour générer 7 articles SEO français (organisation jam, recrutement musiciens, intermittent du spectacle, GUSO, cachet vs facture, premier concert payant, erreurs démarchage). Chaque article = 6800-8900 chars (~1100-1500 mots), structuré avec sous-titres et listes.
  - **Articles publiés** : 7 articles en base, vues comptabilisées, dates échelonnées pour effet "blog vivant".
  - **SEO** : `<title>` et `<meta description>` dynamiques par article. Footer landing inclut lien "Blog".
  - **Objectif** : qualifier AdSense (refus initial "contenu à faible valeur informative" → ces articles fournissent le contenu original substantiel exigé par Google).
  - data-testid : `blog-page`, `blog-card-{slug}`, `blog-post`, `blog-post-title`, `footer-blog-link`.
- **📚 Blog x17 articles + sitemap.xml SEO (Build 95.5b)** (2026-02-09) :
  - 10 articles supplémentaires générés (5 guides locaux Paris/Lyon/Marseille/Bordeaux/Toulouse + 5 guides pratiques : dossier de presse, matériel scène, réseaux sociaux, tournée, fidéliser son public).
  - Total : **17 articles publiés en base** (~125 000 caractères de contenu original français).
  - Script `backend/scripts/generate_sitemap.py` génère `frontend/public/sitemap.xml` (26 URLs) + `frontend/public/robots.txt` à partir des articles publiés.
  - À relancer après chaque ajout/suppression d'article.
- **🛡️ Code review fixes (Build 95.6)** (2026-02-09) :
  - **XSS hardening** : `pages/BlogPost.jsx` utilise désormais `DOMPurify.sanitize()` avec allowlist stricte (`h1/h2/h3/p/ul/ol/li/strong/em/a/blockquote/br`, attributs `href/target/rel` uniquement). Empêche toute injection JS via contenu d'article.
  - **Dynamic import nettoyé** : `app/utils/auto_moderation.py` remplace `__import__("uuid").uuid4()` par `import uuid` statique en haut de fichier.
  - **Bare excepts corrigés** dans 3 routes prod : `routes/account.py:112`, `routes/online_status.py:181`, `routes/venues.py:673` → typés `(ValueError, TypeError, AttributeError)`.
  - **Unused variable** : `amount` retiré de `utils/payment_validation.py:29`.
  - **Console strip prod** : `craco.config.js` config Terser ajoutée — `drop_console: true` + `pure_funcs: [console.log/info/debug/trace]` en build production. console.error et console.warn conservés pour Sentry/monitoring. Couvre les 330 occurrences signalées sans toucher au code.
  - **Faux positifs reviewer identifiés** : "eval()" était un substring dans `test_concert_catering_accommodation_retrieval`. Les "66 is comparisons" sont tous des `is None`/`is not None` (PEP 8 correct).
  - **Array index key** corrigé dans `VenueDetail.jsx:1486` (music_styles). 11 autres dans VenueDashboard/MusicianDashboard non touchés (handoff précédent flag les hooks deps comme dangereux à toucher sans refactor global).
  - **Cache babel stale** : ancien `// eslint-disable-next-line react-hooks/immutability` toujours en cache → `rm -rf node_modules/.cache` + restart frontend = compilation clean.
  - **Skipped (explicitement risqué)** : hook deps mass fix (212 instances), refactor Calendar/MapTab/EventDetailsDialog, migration localStorage→sessionStorage, type hints Python.
  - Test E2E playwright validé : `/blog` affiche 17 cards, aucune erreur runtime ou compile, DOMPurify rend bien le markdown HTML (8 h2, 22 p, 10 ul sur article test).
- **🛡️ Anti-spam Google compliance (Build 95.7)** (2026-02-09) :
  - Audit complet des 16 règles "spam" Google Search → respectées.
  - **Risque "Doorway abuse"** sur 5 city guides similaires → 2 désindexés (`noindex: true` en DB sur Bordeaux + Toulouse, `<meta robots="noindex, follow">` injecté dynamiquement par `BlogPost.jsx` selon le flag).
  - **Sitemap mis à jour** : exclut automatiquement les articles `noindex` (script `generate_sitemap.py`).
  - **Page publique `/a-propos`** (`pages/About.jsx`) : 5 sections (Histoire, Mission, Valeurs, Approche éditoriale transparente, Contact). Signal E-E-A-T fort pour Google.
  - **Script `scripts/mark_noindex.py`** idempotent pour gérer le flag noindex.
  - data-testid : `about-page`, `about-cta-signup`, `footer-about-link`.
- **💰 Toggle Mensuel/Annuel + uniformisation Pricing (Build 95.8/95.9)** (2026-02-09) :
  - **`Tarifs.jsx`** : ajout carte Musicien PRO (4,99€/mois) entre Musicien Gratuit et Établissement, grid passée à 3 colonnes. 8 features PRO différenciantes (0 pub, contact instantané, priorité candidature, badge PRO, stats, notifs prio, support).
  - **Toggle Mensuel/Annuel** (Build 95.9) ajouté sur `/tarifs` ET `/pricing` (pill-style avec badge vert "−2 mois"). En mode annuel : Musicien PRO 49,90€/an (au lieu de 59,88€ barré), Établissement 99,90€/an (au lieu de 119,88€ barré). Économie = 2 mois offerts si engagement annuel.
  - Message vert "🎉 Économisez l'équivalent de 2 mois en payant à l'année" affiché dynamiquement.
  - `Pricing.jsx` uniformisé avec le même toggle et les mêmes calculs de prix. Le plan Mélomane reste gratuit (pas de toggle appliqué).
  - data-testid : `billing-toggle`, `billing-monthly-btn`, `billing-yearly-btn`, `billing-yearly-savings`, `musician-pro-price`, `venue-price`, `tarifs-musician-pro-card`, `tarifs-musician-pro-btn`.
  - ⚠️ **Note** : les liens Stripe existants (`STRIPE_PAYMENT_LINK_MUSICIAN`, `STRIPE_PAYMENT_LINK_VENUE`) ne connaissent pas encore les prix annuels. Il faudra créer 2 nouveaux Payment Links Stripe pour l'annuel côté user + les brancher via une variante conditionnelle sur `billingCycle`.
- **🧹 Nettoyage stack publicité (Build 95.11)** (2026-02-10) :
  - **Ezoic** refusé (seuil 250k users/mois trop élevé). Ezoic composants supprimés (`EzoicAdPlaceholder.jsx`, `EzoicScriptLoader.jsx`), imports retirés de Blog.jsx / BlogPost.jsx / App.js, variable `REACT_APP_EZOIC_PUBLISHER_ID` retirée du `.env`.
  - **Bandeau RGPD (`AdConsentBanner.jsx`)** auto-masqué tant qu'aucune variable pub ENV n'est renseignée. Se réactivera automatiquement quand `REACT_APP_ADSENSE_SLOT_BANNER` ou `REACT_APP_ADSENSE_SLOT_INTERSTITIAL_APPLY` sera défini.
  - **Hook `useAdConsent` + composant `AdConsentPreferences`** conservés (utiles pour sync mobile via backend et pour ré-activation future).
  - **AdSense config** conservée dans `index.html` (publisher `ca-pub-9998561845977424` + Consent Mode v2) — sera re-tenté dans 2-3 mois quand le site aura mûri.
  - **Stratégie de monétisation** : AdMob mobile actif (Build 109) + Stripe PRO web (Musicien 4,99€ / Établissement 9,99€ avec toggle annuel). Pas de pubs web pour l'instant.
- **🎁 Webhook Stripe bonus 1 mois anti-triche (Build 95.13)** (2026-02-11) :
  - **Nouvel événement géré** : `invoice.payment_succeeded` dans `routes/webhooks.py`
  - **Logique** : au 1er paiement (`billing_reason == "subscription_create"`), extension `+30 jours` du `trial_end` de la subscription via `stripe.Subscription.modify(..., trial_end=...)`. Bonus flaggé en DB (`user.bonus_applied: true`) pour anti-triche (bloque toute nouvelle application).
  - **Activation PRO** : `subscription_tier="pro"`, `plan_type` lu depuis `subscription.metadata.plan_type`, `subscription_status="active"`, `subscription_end_date` recalculé.
  - **Alias URL** : router alias `router_plural` avec prefix `/webhooks` (pluriel) monté en plus du historique `/webhook` (singulier). Les 2 URLs répondent : `POST /api/webhook/stripe` ET `POST /api/webhooks/stripe`.
  - **Variables `.env` déjà en place** : `STRIPE_SECRET_KEY`, `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET` (whsec_ipa4aCdZBHq5ZbQNmvioWp3GYnxf9uJ1).
  - **Testé** : les 2 endpoints répondent HTTP 400 sur signature invalide (attendu — la vérification de signature Stripe fonctionne). Lint Python clean.
  - **Action user** : dans Stripe Dashboard → Developers → Webhooks, ajouter `invoice.payment_succeeded` à la liste des événements écoutés (`checkout.session.completed` et `customer.subscription.deleted` déjà en place).
- **🔗 Câblage Stripe Payment Links Annuels (Build 95.13 suite)** (2026-02-11) :
  - Constantes `STRIPE_PAYMENT_LINK_MUSICIAN_YEARLY` (`https://buy.stripe.com/cNieVcfFj10Q8ZKfhDafS0a`) et `STRIPE_PAYMENT_LINK_VENUE_YEARLY` (`https://buy.stripe.com/3cI9ASbp3eRG4JuglHafS09`) ajoutées dans `Pricing.jsx`.
  - `handleSubscribeMusician` et `handleSubscribeVenue` routent maintenant vers le lien correspondant au `billingCycle` sélectionné.
  - Deep-link supporté : `/pricing?cycle=yearly` pré-sélectionne le cycle annuel (utile pour préserver le choix depuis `/tarifs`).
  - `Tarifs.jsx` : le bouton `tarifs-musician-pro-btn` propage désormais `?cycle=${billingCycle}` vers `/pricing`.
  - Briefing agent mobile rédigé : `/app/memory/MESSAGE_MOBILE_BUILD_95.13_STRIPE_YEARLY.md` (à copier-coller pour l'agent mobile).
- **🛠️ Correctif Build 95.14 — Stripe Yearly Links inversés + Prix Étab. + Wording 200 premiers** (2026-02-11) :
  - **Liens Stripe corrigés** (validés dashboard Stripe) : Musicien Mensuel `6oU9AS3WB...`, Musicien Annuel `3cI9ASbp3...`, Étab. Mensuel `aFaaEWakZ...`, Étab. Annuel `cNieVcfFj...`
  - **Prix Étab. Annuel** : 99,90€ → **99,99€/an** (au lieu de 119,88€)
  - **Wording essais** aligné mobile Build 126 : Étab. Mensuel = "6 mois gratuits pour les 200 premiers", Étab. Annuel = "🎁 7 mois d'essai gratuits (6 mois + 1 mois bonus annuel) — 200 premiers"
  - **Message toggle annuel** : "🎉 Économisez jusqu'à 19,89€ + 1 mois d'essai bonus sur les plans annuels"
  - **Backend aligné 100 → 200 premiers établissements** :
    - `routes/auth.py` : seuil venue passé de 100 → 200 pour l'offre 6 mois (180 jours)
    - `routes/payments.py` : seuil `venue_pro_count < 100` → `< 200`
- **🐛 Bug fix : PUT /api/musicians/me dropait postal_code/latitude/longitude (Build 95.15)** (2026-02-11) :
  - **Root cause** : Le schéma Pydantic `MusicianProfile` (utilisé par `PUT /musicians` et `PUT /musicians/me`) n'exposait pas les champs `postal_code`, `latitude`, `longitude`. Pydantic les droppait silencieusement du `data.model_dump()` → `update_data` → non persistés.
  - **Fix** : ajout de `postal_code: Optional[str]`, `latitude: Optional[float]`, `longitude: Optional[float]` dans `MusicianProfile` **et** `MusicianProfileResponse` (`/app/backend/models/musician.py`).
  - **Auto-géocodage** : déjà en place (`routes/musicians.py` L379-394) via `utils/geocoding.py` — se déclenche si `city` est fourni sans lat/lng.
  - `MelomaneUpdate` était déjà correct (les 3 champs y étaient déjà présents).
  - **Vérifié** avec curl sur `test@gmail.com` :
    - `PUT {city:"Lyon",postal_code:"69001",latitude:45.767,longitude:4.8357}` → `GET` retourne bien les 3 valeurs
    - `PUT {city:"Marseille",postal_code:"13001"}` sans lat/lng → auto-géocodage retourne `(43.2803, 5.3806)` ✅
  - **Impact** : feature "Musiciens à proximité" à nouveau opérationnelle pour les musiciens qui se géolocalisent depuis mobile Build 129+.

    - `server.py` GET `/api/stats/promo` : `promo_limit: 200` (vérifié : `remaining_slots: 147` pour 53 venues actuelles)
  - **PromoCounter.jsx** : limite venue passée de 100 → 200 côté display
  - Nouveau briefing agent mobile : `/app/memory/MESSAGE_MOBILE_BUILD_95.14_STRIPE_YEARLY_CORRIGE.md`
- **✅ Sync Mobile Build 130 — Stripe 100% VALIDÉ** (2026-02-13) :
  - Config finale Stripe (LIVE) validée via API dashboard :
    - `musician_monthly` : 4,99€/mois • 60j trial • **plan_type=musician_monthly** ✅
    - `musician_yearly` : 49,90€/an • 60j trial • +30j webhook = 90j = 3 mois ✅
    - `venue_monthly` : 9,99€/mois • 180j trial • = 6 mois ✅
    - `venue_yearly` : 99,99€/an • 180j trial • +30j webhook = 210j = 7 mois ✅
  - **2 bugs Stripe corrigés côté dashboard (aucun code touché)** :
    - #1 musician_yearly n'avait 0 trial → fixé à 60j
    - #2 venue_yearly avait 210j trial → réduit à 180j (pour que 180 + 30 bonus = 210j = 7 mois)
  - Wording 100% cohérent Stripe ↔ Backend ↔ Mobile Build 130 ↔ Web Build 95.16.
  - Mobile Build 130 prêt pour Publish TestFlight + Play Store.
  - Aucune action code côté web requise pour cette validation.



- **🎫 Sync Mobile Build 152 — Champ `guso_number` musicien PRO** (2026-08-10) :
  - Backend `models/musician.py` :
    - `guso_number: Optional[str] = None` déjà présent dans `MusicianProfile` (utilisé par PUT).
    - Ajout du même champ à `MusicianProfileResponse` (utilisé par GET) — **corrige** le fait que le mobile ne pouvait pas lire la valeur après sauvegarde.
    - Ajout d'un `@field_validator("guso_number", mode="before")` : autorise `None`/vide OU exactement 12 chiffres (espaces/tirets/points automatiquement nettoyés).
    - Ajout de `is_guso_member: bool = False` dans la réponse GET.
  - Frontend web : ajout du champ dans `features/musician-dashboard/profile/InfoTab.jsx` (visible uniquement si `profile.subscription_tier === "pro"`, badge PRO gradient cyan→bleu, sanitisation client `.replace(/[^\d]/g,"").slice(0,12)`, `maxLength={12}`, `inputMode="numeric"`).
  - `profileForm` initial state + `fetchProfile` mis à jour dans `MusicianDashboard.jsx` pour propager `guso_number`.
  - **Tests curl validés** :
    - PUT 12 chiffres → OK ✅
    - PUT `"1234-5678 9012"` → cleaned to `123456789012` ✅
    - PUT `"123"` → HTTP 422 "Le numéro GUSO doit contenir exactement 12 chiffres" ✅
    - PUT `""` → stocké `null` ✅
    - GET renvoie bien `guso_number` + `is_guso_member` ✅

- **🎫 Badge "GUSO déclaré ✓" visible aux venues (Build 152.1)** (2026-08-10) :
  - Ajouté dans `pages/MusicianDetail.jsx` (grand badge à côté du nom) et `components/musicians/MusiciansTab.jsx` (badge compact `🎫 GUSO ✓` dans la carte de liste).
  - Style : gradient emerald→teal (distinct des badges PRO/Solo violet), tooltip "Musicien PRO avec numéro GUSO déclaré".
  - Backend `routes/musicians.py` L646-666 : projection MongoDB étendue avec `subscription_tier`, `subscription_status`, `guso_number`, `is_guso_member` (indispensable pour que le badge apparaisse dans la liste et pas seulement sur la fiche détaillée — les badges `hasProBadge`/`isGusoMember` existants du composant `ProBadge` fonctionnent maintenant aussi côté liste).
  - Vérifié via screenshot : Marc Acoustique affiche bien "🎫 GUSO déclaré ✓" en vert émeraude sur `/musician/{id}`.

## Next Tasks (Priorisé)
- **🎫 Filtre "Musiciens GUSO uniquement" sur MusiciansTab (Build 152.2)** (2026-08-10) :
  - Nouveau state `gusoOnly` + toggle stylé (bouton pill emerald→teal avec badge count `X` et icône `Check` quand actif) dans `components/musicians/MusiciansTab.jsx`.
  - Le filtre cascade correctement à travers `searchMusicians` → `franceMusicians` → `countryMusicians` (compatible avec les tabs par région/département/pays existants).
  - Hint italique "Idéal pour préparer une déclaration GUSO en un clic" affiché quand le filtre est actif.
  - `data-testid="filter-guso-only-toggle"` pour testabilité.
  - Compteur temps réel : `gusoCount` calculé via `useMemo` sur `otherMusicians` (avant filtres) pour un feedback immédiat.
  - Testé UI : bouton change bien de style (gris → emerald+shadow), compteur mis à jour, filtrage effectif (49 → 0 musiciens dans la démo car seul Marc Acoustique a un guso_number et il est auto-exclu de sa propre liste).

- **P1** — Publier Mobile Build 130 (TestFlight + Play Store) — sync Stripe 100% validé.
- **🎫 Section "Musiciens GUSO déclarés" en haut du VenueDashboard/Candidatures (Build 152.3)** (2026-08-10) :
  - Nouveau composant standalone `components/venue/GusoMusiciansSection.jsx` injecté en haut de la tab `Candidatures` du VenueDashboard.
  - Design accordéon (repliable par défaut) avec bandeau emerald→teal, badge count temps réel, hint "préparez vos déclarations en 1 clic".
  - Fetch `GET /api/musicians` puis filtre client-side `guso_number != null`.
  - Search par pseudo / ville / instrument (input `data-testid="venue-guso-search"`).
  - Chaque carte musicien : photo profil, pseudo, ville + département, **numéro GUSO en font mono**, bouton **Copy** (copie n° dans presse-papier avec toast confirmation) + bouton **Voir la fiche** (lien vers `/musician/{id}`).
  - Vide state : "Aucun musicien n'a encore déclaré son numéro GUSO" + explication du badge 🎫.
  - Cleanup auto sur unmount via `cancelled` flag.
  - `data-testid` : `venue-guso-musicians-section`, `venue-guso-toggle`, `venue-guso-search`, `venue-guso-musician-card`, `venue-guso-copy-btn`.
  - Testé UI : Le Bar Test → tab Candidatures → section repliée avec count "1" → clic → dépliée avec la carte Marc Acoustique (n° GUSO 987654321012 visible + boutons Copy/Voir).

- **P2** — Refactoring des gros composants (`VenueDashboard.jsx` 4400+ lignes, `MusicianDashboard.jsx` 3200+ lignes, `Calendar.jsx`, `MapTab.jsx`) pour lever les warnings ESLint `react-hooks/exhaustive-deps` et retirer `CI=false` du build.
- **P2** — Reprise intégration Facebook Events (attente credentials FB Developer).
- **P3** — Exposer `bonus_available: bool` dans le payload `/api/auth/me` pour affichage dynamique de l'offre bonus (utile côté mobile).
- **⚙️ Endpoint dédié `GET /api/venues/me/gusotools/musicians` (Build 152.4)** (2026-08-10) :
  - Nouveau endpoint dans `routes/venues.py` :
    - **Auth** : venue role obligatoire (403 pour musician/mélomane) — testé ✅
    - **Query params** : `page`, `limit` (default 20, max 100), `search` (regex insensible sur pseudo/city/instruments), `max_radius_km` (filtre optionnel)
    - **Tri** : par `distance_km` ascendante (calculée via `haversine_distance`), fallback pseudo alpha si venue sans GPS
    - **Response** : `{ musicians: [...], pagination: { page, limit, total, total_pages, has_next, has_prev }, venue_location: { latitude, longitude, has_geo } }`
    - Filtre serveur `guso_number: {$nin: [null, ""]}` → aucun fetch inutile côté client.
  - Frontend `GusoMusiciansSection.jsx` refactorisé :
    - Utilise `useAuth()` pour envoyer le token
    - Fetch avec `page` + `search` en query params
    - Affiche un **badge distance `📍 X km`** à côté du pseudo quand disponible
    - Warning "⚠️ Votre établissement n'a pas de coordonnées GPS" affiché si `venue_location.has_geo === false`
    - Contrôles de pagination `← Précédent` / `Suivant →` en bas, désactivés selon `has_prev`/`has_next`
    - Search débounce implicite (déclenche re-fetch + reset à page 1)
  - **Tests curl validés** :
    - Default page : 1 résultat (Marc Acoustique, distance_km=1.2) ✅
    - Search=Marc : 1 résultat ✅
    - Musician role → HTTP 403 ✅
  - **UI validée** : screenshot montre bien le badge "📍 1.2 km" dans la carte Marc Acoustique.



- **📍 Filtre "Rayon max" dans la section GUSO Venue (Build 152.5)** (2026-08-10) :
  - 6 pills sélectionnables : `10 km / 25 km / 50 km / 100 km / 200 km / Illimité` (défaut : Illimité).
  - Envoie `max_radius_km` au nouvel endpoint qui filtre côté serveur via `haversine_distance`.
  - Auto-hidden si la venue n'a pas de coordonnées GPS (`venue_location.has_geo === false`).
  - Empty state contextuel : "Aucun musicien GUSO dans un rayon de X km" + bouton "Élargir la recherche" qui remet le rayon à `null`.
  - `data-testid="venue-guso-radius-filter"` + individuel `venue-guso-radius-{10|25|50|100|200|none}`.
  - **Tests curl** : `max_radius_km=1` → 0 résultats (Marc à 1.2km exclu) ✅ / `max_radius_km=2` → 1 résultat (Marc inclus) ✅.
  - **UI validée** : screenshot montre les 6 pills bien alignés, pill actif en emerald, filtrage effectif.

- **🔔 Flow d'annulation avec validation par l'établissement (Build 152.6)** (2026-08-13) :
  - 3 endpoints ajoutés dans `/app/backend/routes/planning.py` (~ligne 1069-1326) :
    - `POST /api/applications/{id}/cancel` (musician) — pending → suppression / accepted → cancellation_status='requested' + notif venue / autre → 400
    - `POST /api/applications/{id}/cancellation/validate` (venue, body `{approve: bool, message?: str≤500}`) — approve → status='cancelled' + ré-ouverture slot si besoin + notif musicien / refuse → cancellation_status='refused' + status reste 'accepted' + notif musicien
    - `GET /api/applications/received/cancellation-requests` (venue) — liste enrichie (slot_date/pseudo/photo) des demandes en attente
  - Nouveaux champs stockés en DB sur les applications : `cancellation_status ∈ {None,'requested','approved','refused'}`, `cancellation_requested_at`, `cancellation_resolved_at`, `cancellation_reason`, `cancellation_message` (max 500 chars).
  - Notifications DB créées avec types : `cancellation_requested`, `cancellation_approved`, `cancellation_refused`, `application_cancelled` (compat existant).
  - Idempotence : 2ᵉ appel POST /cancel sur candidature déjà en `cancellation_requested` → HTTP 400.
  - RBAC strict : musicien peut annuler UNIQUEMENT ses candidatures / venue peut valider UNIQUEMENT ses candidatures.
  - **testing_agent (iteration_7.json)** : 14/14 tests passent au premier run ✅, test file persistant à `/app/backend/tests/test_cancellation_flow.py`.
