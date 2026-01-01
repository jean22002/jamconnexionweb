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

## Core Requirements
- Authentification JWT (email/password)
- Système d'abonnement Stripe (10€/mois, 2 mois gratuits)
- Profils établissements détaillés (équipement, styles, jours de jam)
- Profils musiciens (instruments, styles, expérience)
- Carte géolocalisée avec recherche par proximité
- Interface sombre/neon thème musical

## Architecture
- **Backend**: FastAPI + MongoDB + Stripe (emergentintegrations)
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Leaflet maps
- **Database Collections**: users, venues, musicians, friends, venue_subscriptions, jams, concerts, planning_slots, applications, notifications, payment_transactions

## What's Been Implemented (Jan 2026)

### Phase 1 (Initial MVP)
- [x] Landing page avec hero section
- [x] Authentification (register/login) avec rôle musicien/venue
- [x] Dashboard musicien avec carte interactive
- [x] Dashboard établissement avec gestion profil
- [x] Géolocalisation et recherche par proximité
- [x] Page détail établissement
- [x] Page tarifs
- [x] Intégration Stripe (checkout, paiement, statut)
- [x] Période d'essai 2 mois pour établissements

### Phase 2 (Fonctionnalités avancées - Jan 2026)
- [x] **Profil musicien enrichi**: pseudo, âge, photo, bio, instruments, styles
- [x] **Profil groupe**: nom, photo, liens (FB, Instagram, YouTube, site web, Bandcamp)
- [x] **Concerts musicien**: liste des dates avec lieux (depuis DB ou manuel)
- [x] **Système d'amis**: demande d'ami, acceptation/refus, liste d'amis
- [x] **Profil établissement enrichi**: photo de profil, photo couverture
- [x] **Calendrier Boeufs musicaux**: date, heure, styles, règlement, matériel dispo, sono
- [x] **Calendrier Concerts**: date, groupes (avec liens), prix
- [x] **Mode Planning**: dates ouvertes aux candidatures avec styles recherchés
- [x] **Système de candidatures**: musiciens postulent pour les dates ouvertes
- [x] **Abonnement aux établissements**: musiciens s'abonnent pour recevoir notifications
- [x] **Système de notifications**: alertes pour boeufs, concerts, demandes d'amis, candidatures
- [x] **Page profil musicien public**: consultable par tous

## P0/P1/P2 Features Remaining

### P0 (Critical)
- Toutes les fonctionnalités P0 implémentées

### P1 (Important)
- [ ] Notifications push/email (actuellement in-app seulement)
- [ ] Rappels automatiques 1 semaine et 2 jours avant les événements
- [ ] Upload d'images (actuellement via URL)
- [ ] Recherche avancée par style, équipement, date

### P2 (Nice to have)
- [ ] Système d'avis/notation
- [ ] Chat/messagerie privée entre utilisateurs
- [ ] Application mobile
- [ ] Partage sur réseaux sociaux
- [ ] Statistiques pour établissements (vues, abonnés)

## Next Action Items
1. Implémenter l'upload d'images (photos profil, groupe, établissement)
2. Ajouter les rappels automatiques par email avant les événements
3. Améliorer la recherche avec filtres avancés
4. Intégrer notifications push
