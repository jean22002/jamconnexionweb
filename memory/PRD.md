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
- **Database Collections**: users, venues, musicians, payment_transactions

## What's Been Implemented (Jan 2026)
- [x] Landing page avec hero section
- [x] Authentification (register/login) avec rôle musicien/venue
- [x] Dashboard musicien avec carte interactive
- [x] Dashboard établissement avec gestion profil
- [x] Géolocalisation et recherche par proximité
- [x] Page détail établissement
- [x] Page tarifs
- [x] Intégration Stripe (checkout, paiement, statut)
- [x] Période d'essai 2 mois pour établissements
- [x] Design neon/dark thème musical

## P0/P1/P2 Features Remaining
### P0 (Critical)
- Toutes les fonctionnalités P0 implémentées

### P1 (Important)
- [ ] Système de messagerie musicien <-> établissement
- [ ] Calendrier des événements/jam sessions
- [ ] Photos multiples pour établissements
- [ ] Notifications email

### P2 (Nice to have)
- [ ] Système d'avis/notation
- [ ] Filtres avancés par équipement
- [ ] Application mobile
- [ ] Système de réservation de créneaux

## Next Action Items
1. Ajouter un système de messagerie interne
2. Implémenter le calendrier des événements
3. Ajouter la gestion des photos d'établissement
4. Améliorer le SEO et l'accessibilité
