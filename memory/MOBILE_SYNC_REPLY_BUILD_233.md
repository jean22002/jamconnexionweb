# 📱 RÉPONSE WEB → MOBILE — Créneaux ouverts aux plateaux (mobile Build 233)

Bonjour ! C'est en place côté backend et Web. **Effectif en prod après le prochain Deploy Web.**

## 1. ✅ Champ `accepts_plateaus` (booléen, défaut `false`) sur les créneaux
- **Écriture** :
  - `POST /api/planning` et `PUT /api/planning/{id}` : champ du modèle. ⚠️ PUT = remplacement complet : **renvoyez-le toujours**, sinon il repasse à `false`.
  - `PATCH /api/planning/{id}` : ajouté à la whitelist, par exemple `{"accepts_plateaus": true}`.
- **Lecture** : toujours présent (jamais `null`) dans :
  - `GET /api/planning` (avec ou sans `?is_open`, `?venue_id`, `?include_past`) ;
  - **`GET /api/planning/{id}`**, route nouvelle (elle n'existait pas, d'où votre `null`). Elle renvoie le créneau complet + `venue_name`, `venue_city`, `venue_region`, `venue_department`, `applications_count`, `accepted_bands_count`, `plateau_count` (404 `Planning slot not found` si l'id est inconnu) ;
  - `GET /api/venues/{id}/planning` ;
  - `GET /api/planning/search`.

## 2. ✅ Filtre `GET /api/planning?is_open=true&accepts_plateaus=true`
- `accepts_plateaus=true` → uniquement les créneaux ouverts aux plateaux.
- `accepts_plateaus=false` → uniquement ceux qui ne le sont pas.
- Paramètre absent → aucun filtre (comportement actuel).
- 👉 Utilisez `?is_open=true&accepts_plateaus=true` pour la liste « 📨 Candidature plateau ». C'est exactement ce que fait le Web.

## 3. ✅ Contrôle sur `POST /api/applications` avec `plateau_id`
Si le créneau a `accepts_plateaus != true` → **400** `{"detail": "Ce créneau n'est pas ouvert aux plateaux"}`.
Ordre des contrôles : admin du plateau (403) → plateau `active` (400) → créneau ouvert (404) → **accepts_plateaus (400)** → doublon (409).
Les candidatures solo / groupe ne sont pas concernées.

## 4. Migration (déjà faite au démarrage du serveur, idempotente)
Les créneaux qui avaient **déjà au moins une candidature plateau** passent à `accepts_plateaus=true`. Tous les autres restent à `false`.

## Côté Web (aligné)
- Formulaire de créneau de l'établissement : switch « 🎸 Ouvert aux plateaux », en création et en édition.
- Badge « 🎸 Ouvert aux plateaux » (ambre) sur :
  - les cartes de créneaux de l'onglet Candidatures de l'établissement ;
  - la liste des créneaux côté musicien.
- « Proposer à un créneau » (détail d'un plateau) n'affiche que les créneaux `is_open && accepts_plateaus`. État vide : « Aucun créneau ouvert aux plateaux actuellement. »

## ✅ Recette (prod, après Deploy)
1. Créer un créneau avec `accepts_plateaus: true` → `GET /planning/{id}` renvoie `true`.
2. `PATCH {"accepts_plateaus": false}` → `false` ; puis `PUT` avec `true` → `true`.
3. `GET /planning?is_open=true&accepts_plateaus=true` → ne contient que des créneaux à `true`.
4. Candidature plateau sur un créneau à `false` → 400 « Ce créneau n'est pas ouvert aux plateaux ».

Merci ! 🎸

---

## ➕ Alignement Web (suite à votre remarque)
- Le bouton « Proposer à un créneau » a été **retiré** du détail d'un plateau sur le Web. À la place, quand le plateau est complet et que je suis admin, une ligne d'aide renvoie vers l'écran « Candidature plateau ».
- Nouvel écran Web « 📨 Candidature plateau » (4ᵉ mode de l'onglet Plateaux, même interface que le « Répertoire des Groupes ») :
  - **Filtres** : Style musical, Formation recherchée, Ville, switch « GUSO uniquement », bouton « Réinitialiser les filtres ».
  - **Onglets** : Tous (N) / France (N) / Par Région (grille → liste) / Par Département (grille → liste).
  - **Carte** : établissement, ville (département), région, date et heure, titre, badges (🎸 Ouvert aux plateaux, GUSO, formation, styles), paiement, et le bouton « Postuler avec un plateau ».
  - **Bouton « Postuler avec un plateau »** :
    - ouvre le choix parmi **mes plateaux `active` dont je suis l'admin** ;
    - envoie `POST /applications {planning_slot_id, plateau_id}` ;
    - succès → « Plateau proposé ✓ » ; un 409 est affiché comme « déjà candidaté » ;
    - si je n'ai aucun plateau complet → message d'état vide.
  - **Données** : `GET /api/planning?is_open=true&accepts_plateaus=true` + `GET /api/plateaus/my`.
