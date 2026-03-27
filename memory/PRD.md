# Jam Connexion - PRD

## Original Problem Statement
Application de mise en relation entre cafés-concerts (où se font des jams/boeufs musicaux) et les musiciens.
- Abonnement 10€/mois pour les établissements avec 2 mois d'essai gratuit
- Gratuit pour les musiciens
- Établissements: adresse, FB, Instagram, site web, matériel, scène, ingé son
- Géolocalisation pour localiser les établissements à proximité

## User Personas
1. **Musicien**: Cherche des lieux pour jouer en jam session, veut voir le matériel disponible et contacter les établissements
2. **Établissement (Café-concert)**: Veut attirer des musiciens, présenter son lieu et ses équipements
3. **Mélomane**: Amateur de musique qui suit les événements et musiciens

## Core Requirements
- Authentification JWT (email/password) avec vérification d'email (Resend)
- Système d'abonnement Stripe (10€/mois, 2 mois gratuits pour établissements)
- Profils établissements détaillés (équipement, styles, jours de jam)
- Profils musiciens (instruments, styles, expérience) - inscription gratuite, tier "free"
- Carte géolocalisée avec recherche par proximité
- Interface sombre/neon thème musical
- Système de codes d'invitation pour rejoindre des groupes

## Architecture
- **Backend**: FastAPI + MongoDB Atlas + Stripe + Resend
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Leaflet maps
- **Database Collections**: users, venues, musicians, melomanes, friends, venue_subscriptions, jams, concerts, planning_slots, applications, notifications, payment_transactions, band_invite_codes

## What's Been Implemented

### Phase 1 (Initial MVP)
- [x] Landing page avec hero section
- [x] Authentification (register/login) avec rôle musicien/venue/melomane
- [x] Dashboard musicien avec carte interactive
- [x] Dashboard établissement avec gestion profil
- [x] Géolocalisation et recherche par proximité
- [x] Page détail établissement
- [x] Page tarifs
- [x] Intégration Stripe (checkout, paiement, statut)
- [x] Période d'essai 2 mois pour établissements

### Phase 2 (Fonctionnalités avancées)
- [x] Profil musicien enrichi: pseudo, âge, photo, bio, instruments, styles
- [x] Profil groupe: nom, photo, liens (FB, Instagram, YouTube, site web, Bandcamp)
- [x] Concerts musicien: liste des dates avec lieux
- [x] Système d'amis: demande, acceptation, refus, liste
- [x] Profil établissement enrichi: photo de profil, photo couverture
- [x] Calendrier Boeufs musicaux: date, heure, styles, règlement, matériel
- [x] Calendrier Concerts: date, groupes, prix
- [x] Mode Planning: dates ouvertes aux candidatures
- [x] Système de candidatures
- [x] Abonnement aux établissements
- [x] Système de notifications in-app
- [x] Page profil musicien public

### Phase 3 (Récentes - Mars 2026)
- [x] Vérification d'email via Resend (backend + frontend page `/verify-email`)
- [x] Email de bienvenue à l'inscription
- [x] Codes d'invitation pour rejoindre des groupes (6 caractères, 7 jours)
- [x] Modal "Contacter ce groupe" avec envoi d'email à l'admin
- [x] Options de cachet "Fixe" et "À définir avec l'établissement" (VenueDashboard)
- [x] Message pionnier dans le header du MusicianDashboard
- [x] Désactivation du statut PRO automatique (tier "free" par défaut)
- [x] Migration données profil jean → test@gmail.com

## P0/P1/P2 Features Remaining

### P0 (Critical)
- Toutes les fonctionnalités P0 implémentées ✓

### P1 (Important)
- [ ] Notifications push/email (actuellement in-app seulement)
- [ ] Rappels automatiques avant les événements
- [ ] Upload d'images (actuellement via URL)
- [ ] Recherche avancée par style, équipement, date

### P2 (Nice to have)
- [ ] Rendre les seuils de modération configurables
- [ ] Notifications en temps réel avec WebSockets
- [ ] Système d'avis/notation
- [ ] Chat/messagerie privée entre utilisateurs
- [ ] Application mobile
- [ ] Partage sur réseaux sociaux
- [ ] Statistiques avancées pour établissements

## Key API Endpoints
- `POST /api/auth/register` - Inscription (email_verified=false, tier=free)
- `POST /api/auth/login` - Connexion (bloqué si email non vérifié)
- `GET /api/auth/verify-email?token=xxx` - Vérification d'email
- `POST /api/auth/resend-verification?email=xxx` - Renvoi du lien (3/jour max)
- `POST /api/musicians/me/bands/{band_id}/invite` - Rejoindre via code
- `POST /api/musicians/contact-band/{band_id}` - Contacter l'admin du groupe

## Next Action Items
1. Notifications push/email
2. Upload d'images
3. Recherche avancée avec filtres
4. WebSockets pour notifications temps réel
