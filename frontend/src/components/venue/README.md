# 📦 Composants Venue - Documentation

Ce dossier contient les composants extraits du `VenueDashboard` monolithique.

## 📂 Structure

```
/components/venue/
├── tabs/                    # Onglets du dashboard
│   └── GalleryTab.jsx      ✅ Créé (Exemple)
└── README.md               # Ce fichier
```

## ✅ Composants Créés

### GalleryTab.jsx

**Responsabilité**: Gestion de la galerie photos de l'établissement

**Props**:
- `gallery` (Array): Liste des URLs de photos
- `uploadGalleryPhoto` (Function): Upload d'une photo
- `deleteGalleryPhoto` (Function): Suppression d'une photo
- `uploadingPhoto` (Boolean): État de chargement

**Utilisation**:
```jsx
import GalleryTab from "@/components/venue/tabs/GalleryTab";

<TabsContent value="gallery">
  <GalleryTab
    gallery={gallery}
    uploadGalleryPhoto={uploadGalleryPhoto}
    deleteGalleryPhoto={deleteGalleryPhoto}
    uploadingPhoto={uploadingPhoto}
  />
</TabsContent>
```

**Taille**: 72 lignes (vs 72 lignes dans VenueDashboard)
**Gain**: Code isolé, testable indépendamment

---

## 🚀 Composants À Créer (TODO)

Voir `/app/REFACTORING_GUIDE.md` pour la liste complète et le plan d'exécution.

### Ordre Recommandé
1. ✅ GalleryTab (72 lignes) - **FAIT**
2. ⬜ JacksTab (55 lignes)
3. ⬜ ApplicationsTab (86 lignes)
4. ⬜ ReviewsTab (128 lignes)
5. ⬜ NotificationsTab (208 lignes)
6. ... (voir guide complet)

---

## 📝 Convention de Nommage

- **Fichiers**: `[Name]Tab.jsx` (PascalCase)
- **Exports**: Default export
- **Props**: Destructuring avec valeurs par défaut
- **Documentation**: JSDoc au-dessus du composant

---

## 🧪 Tests

Chaque composant extrait devrait avoir :
- ✅ Tests unitaires (comportement)
- ✅ Tests d'intégration (avec VenueDashboard)
- ✅ Tests visuels (Storybook recommandé)

---

**Dernière mise à jour**: 11 février 2026
