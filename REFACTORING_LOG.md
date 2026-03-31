# 📋 Journal de Refactoring - Jam Connexion

**Date de début** : 31 mars 2026  
**Objectif** : Réduire la taille des fichiers VenueDashboard.jsx (4979 lignes) et MusicianDashboard.jsx (2984 lignes) pour améliorer la maintenabilité

---

## ✅ Phase 1 - VenueDashboard.jsx (Complété)

### Travail effectué

#### 1. Extraction de EditProfileDialog
- **Fichier créé** : `/app/frontend/src/features/venue-dashboard/dialogs/EditProfileDialog.jsx`
- **Lignes extraites** : ~120 lignes
- **Impact** : VenueDashboard.jsx **4979 → 4871 lignes** (-108 lignes)
- **Tests** : ✅ Validé fonctionnel en production

#### 2. Structure créée
```
/app/frontend/src/features/venue-dashboard/
├── dialogs/
│   ├── EditProfileDialog.jsx  ✅ FAIT
│   └── index.js               ✅ FAIT (barrel export)
├── tabs/                      ✅ EXISTANT (déjà refactorisé)
│   ├── AccountingTab.jsx
│   ├── JamsTab.jsx
│   ├── KaraokeTab.jsx
│   ├── etc...
├── components/
└── hooks/
```

### Composants identifiés pour refactoring futur (priorité basse)

- **EventDetailsDialog** (~820 lignes, lignes 3986-4807) - COMPLEXE, nécessite beaucoup de props
- **CreateSpectacleDialog** (~200 lignes, inline dans le code)
- **ProfitabilityDialog** (~120 lignes)

**Note** : Ces extractions sont optionnelles. Le gain de maintenabilité est limité comparé au risque de régression. À faire uniquement si nécessaire.

---

## 🔄 Phase 2 - MusicianDashboard.jsx (EN COURS)

**État actuel** : 2984 lignes  
**Objectif** : < 2500 lignes

### Analyse préliminaire
- ✅ Déjà bien structuré avec tabs refactorisés
- ✅ Hooks personnalisés déjà en place
- Composants candidats : ProSubscriptionCard, dialogs de profil

### Actions prévues
1. Extraction de dialogs mineurs (si nécessaire)
2. Optimisation des hooks existants
3. Séparation des composants de gestion de groupes

---

## 📈 Métriques de Progrès

| Fichier                  | Avant | Après | Réduction |
|--------------------------|-------|-------|-----------|
| VenueDashboard.jsx       | 4979  | 4871  | -108      |
| MusicianDashboard.jsx    | 2984  | TBD   | TBD       |
| **Total**                | 7963  | TBD   | TBD       |

---

## 🎯 Principes Appliqués

1. **Pas de sur-engineering** : Extraction uniquement des composants réutilisables et simples
2. **Tests progressifs** : Validation après chaque extraction majeure
3. **Préservation des fonctionnalités** : Aucune modification de la logique métier
4. **Isolation des responsabilités** : Un composant = une responsabilité

---

## 🚨 Risques Identifiés

- **EventDetailsDialog** : Trop de dépendances pour une extraction sûre (~ 30+ props nécessaires)
- **State management** : Les composants partagent beaucoup d'état, nécessite prudence

---

## ✅ Validation

**Critères de succès** :
- [x] Code compilé sans erreurs
- [x] Linter JavaScript sans warnings
- [x] Dashboard Établissement fonctionnel en production
- [x] Dialog "Éditer le profil" opérationnel
- [ ] Dashboard Musicien testé (en attente Phase 2)

---

**Prochaine étape** : Phase 2 - Optimisation MusicianDashboard.jsx
