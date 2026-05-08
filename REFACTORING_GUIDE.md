# 📚 Guide de Refactoring - Utilisation des nouveaux utilitaires

## ✅ Ce qui a été créé

### 1. Utilitaires (`/app/frontend/src/utils/`)

#### `urlBuilder.js`
- `buildImageUrl(path)` - Construit une URL complète à partir d'un chemin
- `normalizeImageUrl(url)` - Normalise une URL pour l'envoi au backend
- `normalizeImageUrls(data, fields)` - Normalise plusieurs URLs dans un objet
- `buildImageUrls(data, fields)` - Construit plusieurs URLs dans un objet

**Exemple d'utilisation :**
```javascript
import { buildImageUrl, normalizeImageUrl } from '../utils/urlBuilder';

// Construire une URL complète
const fullUrl = buildImageUrl('/api/uploads/venues/file.jpg');
// → 'https://...com/api/uploads/venues/file.jpg'

// Normaliser avant d'envoyer au backend
const normalized = normalizeImageUrl('https://...com/api/uploads/venues/file.jpg');
// → '/api/uploads/venues/file.jpg'
```

#### `imageUtils.js`
- `validateImageFile(file)` - Valide un fichier image
- `prepareImageDataForSave(formData, fields)` - Prépare les données pour la sauvegarde
- `processImageDataFromBackend(data, fields)` - Traite les données du backend

#### `apiHelpers.js`
- `createAuthHeaders(token)` - Crée les headers d'authentification
- `saveProfile(endpoint, data, token, isNew, imageFields)` - Sauvegarde générique
- `fetchProfile(endpoint, token)` - Récupération générique
- `uploadFile(endpoint, file, token, params)` - Upload générique
- `handleApiError(error, defaultMessage)` - Gestion d'erreurs

---

### 2. Hooks personnalisés (`/app/frontend/src/hooks/`)

#### `useImageUpload.js`
Hook pour gérer l'upload d'images avec validation

#### `useProfileManager.js`
Hook complet pour gérer un profil (fetch, save, state)

---

### 3. Composants réutilisables (`/app/frontend/src/components/dashboard/`)

#### `ProfileHeader.jsx`
Header avec boutons Edit/Save/Cancel

#### `ProfileImageSection.jsx`
Section pour les images de profil et couverture

#### `FormField.jsx`
Champ de formulaire réutilisable

---

## 📊 Résultat attendu

### Avant refactoring
- VenueDashboard.jsx : 5834 lignes
- MusicianDashboard.jsx : 4520 lignes
- MelomaneDashboard.jsx : 1270 lignes
- **Total : 11,624 lignes**

### Structure actuelle
- ✅ Utilitaires créés : urlBuilder.js, imageUtils.js, apiHelpers.js
- ✅ Hooks créés : useImageUpload.js, useProfileManager.js
- ✅ Composants créés : ProfileHeader, ProfileImageSection, FormField
- ✅ Code réutilisable : ~800 lignes
- ⏳ Migration des dashboards : À faire

---

## 🚀 Prochaines étapes recommandées

Pour une migration progressive et sûre :

1. **Phase 1 (Déjà fait) :** Création de l'infrastructure réutilisable ✅
2. **Phase 2 :** Migrer un dashboard à la fois en commençant par le plus petit
3. **Phase 3 :** Tester chaque migration avant de passer à la suivante
4. **Phase 4 :** Nettoyer le code dupliqué restant

---

## ✅ Avantages du refactoring

1. **Moins de duplication** - Les utilitaires sont partagés
2. **Plus maintenable** - Les bugs se corrigent en un seul endroit
3. **Plus testable** - Les hooks et utilitaires peuvent être testés unitairement
4. **Plus lisible** - Le code des dashboards est plus clair
5. **Plus évolutif** - Ajout de nouvelles fonctionnalités plus facile
6. **Fix du bug /api/api/ centralisé** - La correction est maintenant dans urlBuilder.js

---

## 📝 Documentation complète

Voir le fichier pour des exemples détaillés d'utilisation de chaque utilitaire, hook et composant.
