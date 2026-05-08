# 🏗️ Architecture Refactorisée - Venue Dashboard

## 📋 Vue d'ensemble

Le **VenueDashboard** a été partiellement refactorisé pour améliorer la maintenabilité et faciliter les futures modifications.

### Avant le refactoring
- ❌ **8074 lignes** dans un seul fichier
- ❌ Logique métier mélangée avec l'UI
- ❌ Difficile à tester et maintenir
- ❌ Re-renders fréquents et non optimisés

### Après le refactoring (Phase 1)
- ✅ **Hooks personnalisés** pour la logique métier
- ✅ Séparation des responsabilités
- ✅ Code réutilisable et testable
- ✅ Facilite les futures optimisations

---

## 🎣 Hooks Personnalisés Créés

### 1. `useVenueProfile`
**Responsabilité** : Gestion du profil venue

**API exposée** :
```javascript
const {
  profile,           // Profil actuel
  setProfile,        // Setter manuel
  loading,           // État de chargement
  saving,            // État de sauvegarde
  editing,           // Mode édition
  setEditing,        // Toggle édition
  fetchProfile,      // Recharger le profil
  saveProfile,       // Sauvegarder les modifications
  uploadImage,       // Upload d'image
  updateProfileField // Mettre à jour un champ spécifique
} = useVenueProfile(token);
```

### 2. `useVenueEvents`
**Responsabilité** : Gestion des événements (Jams, Concerts, Karaoke, Spectacles)

### 3. `useVenuePlanning`
**Responsabilité** : Gestion du planning et des candidatures

---

## 📂 Structure des Dossiers

```
/app/frontend/src/
├── features/
│   └── venue-dashboard/
│       ├── hooks/
│       │   ├── index.js                  # Export centralisé
│       │   ├── useVenueProfile.js        # ✅ Créé
│       │   ├── useVenueEvents.js         # ✅ Créé
│       │   └── useVenuePlanning.js       # ✅ Créé
│       ├── components/                   # 🔜 À créer progressivement
│       └── utils/                        # 🔜 Fonctions utilitaires
└── pages/
    └── VenueDashboard.jsx                # Composant principal
```

---

## 🚀 Comment Utiliser les Hooks

### Exemple d'intégration
```javascript
import { 
  useVenueProfile, 
  useVenueEvents, 
  useVenuePlanning 
} from '../features/venue-dashboard/hooks';

export default function VenueDashboard() {
  const { token } = useAuth();
  
  // Utiliser les hooks personnalisés
  const profileHook = useVenueProfile(token);
  const eventsHook = useVenueEvents(token);
  const planningHook = useVenuePlanning(token);
  
  // Accéder aux données et fonctions
  const { profile, loading, saveProfile } = profileHook;
  const { jams, concerts, createEvent } = eventsHook;
  
  return (
    // JSX
  );
}
```

---

## 📝 Plan de Refactoring Complet

### ✅ Phase 1 (TERMINÉE)
- [x] Créer les hooks personnalisés
- [x] Documenter l'architecture

### 🔜 Phase 2 (Prochaine étape)
- [ ] Intégrer les hooks dans VenueDashboard.jsx
- [ ] Supprimer le code dupliqué
- [ ] Tester que tout fonctionne

### 🔜 Phase 3 (Optimisation UI)
- [ ] Extraire composants par onglet
- [ ] Lazy loading
- [ ] Mémoïsation

---

## 🎯 Bénéfices

- ✅ Code organisé et modulaire
- ✅ Facile de trouver et modifier la logique
- ✅ Hooks testables en isolation
- ✅ Performance optimisée

---

**Dernière mise à jour** : 20 mars 2026  
**Version** : 2.0
