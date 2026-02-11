# 🔧 Guide de Refactoring - Jam Connexion

## 📊 État Actuel

### Fichiers Volumineux
- `VenueDashboard.jsx` : **5,672 lignes** (68 états)
- `MusicianDashboard.jsx` : **4,446 lignes**
- **Total** : 10,118 lignes de code monolithique

### Problèmes Identifiés
- ❌ Difficulté de maintenance
- ❌ Tests complexes
- ❌ Risques de conflits Git
- ❌ Performance (re-render de tout le composant)
- ❌ Difficulté de compréhension pour nouveaux développeurs

---

## 🎯 Plan de Refactoring

### Phase 1: VenueDashboard (Priorité Haute)

#### Structure Proposée
```
/app/frontend/src/components/venue/
├── tabs/
│   ├── ProfileTab.jsx          (~487 lignes)
│   ├── JamsTab.jsx              (~215 lignes)
│   ├── ConcertsTab.jsx          (~493 lignes)
│   ├── KaraokeTab.jsx           (~165 lignes)
│   ├── SpectacleTab.jsx         (~156 lignes)
│   ├── PlanningTab.jsx          (~630 lignes)
│   ├── ApplicationsTab.jsx      (~86 lignes)
│   ├── JacksTab.jsx             (~55 lignes)
│   ├── NotificationsTab.jsx     (~208 lignes)
│   ├── ReviewsTab.jsx           (~128 lignes)
│   ├── BandsTab.jsx             (~271 lignes)
│   ├── GalleryTab.jsx           (~72 lignes)
│   └── HistoryTab.jsx           (~420 lignes)
├── forms/
│   ├── JamForm.jsx
│   ├── ConcertForm.jsx
│   ├── KaraokeForm.jsx
│   └── SpectacleForm.jsx
└── VenueDashboard.jsx           (~300 lignes après refactoring)
```

#### Exemple: ProfileTab.jsx

```jsx
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { VenueImageUpload } from "../ui/image-upload";
import { CityAutocomplete } from "../CityAutocomplete";
import { Edit, Save, Loader2, MapPin, Globe, Music } from "lucide-react";

export default function ProfileTab({
  profile,
  formData,
  setFormData,
  editing,
  setEditing,
  saving,
  handleSave,
  token
}) {
  return (
    <div className="glassmorphism rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-semibold text-xl">
          Profil de l'établissement
        </h2>
        {!editing ? (
          <Button
            variant="ghost"
            onClick={() => setEditing(true)}
            className="gap-2"
          >
            <Edit className="w-4 h-4" /> Modifier
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 rounded-full gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}{" "}
            Sauvegarder
          </Button>
        )}
      </div>

      {/* Rest of the profile form */}
      {/* ... */}
    </div>
  );
}
```

#### Utilisation dans VenueDashboard.jsx

```jsx
import ProfileTab from "@/components/venue/tabs/ProfileTab";
import JamsTab from "@/components/venue/tabs/JamsTab";
// ... autres imports

export default function VenueDashboard() {
  // ... états et logique

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>{/* ... */}</TabsList>

        <TabsContent value="profile">
          <ProfileTab
            profile={profile}
            formData={formData}
            setFormData={setFormData}
            editing={editing}
            setEditing={setEditing}
            saving={saving}
            handleSave={handleSave}
            token={token}
          />
        </TabsContent>

        <TabsContent value="jams">
          <JamsTab
            jams={jams}
            jamForm={jamForm}
            setJamForm={setJamForm}
            handleCreateJam={handleCreateJam}
            // ... autres props
          />
        </TabsContent>

        {/* ... autres onglets */}
      </Tabs>
    </>
  );
}
```

---

### Phase 2: MusicianDashboard (Priorité Moyenne)

#### Structure Proposée
```
/app/frontend/src/components/musician/
├── tabs/
│   ├── MapTab.jsx
│   ├── ApplicationsTab.jsx
│   ├── MyApplicationsTab.jsx
│   ├── ParticipationsTab.jsx
│   ├── MusiciansTab.jsx
│   ├── VenuesTab.jsx
│   ├── FriendsTab.jsx
│   ├── SubscriptionsTab.jsx
│   └── BandsTab.jsx
└── MusicianDashboard.jsx (~300 lignes après refactoring)
```

---

### Phase 3: Optimisations (Priorité Basse)

#### 3.1 Hooks Personnalisés

Créer des hooks pour la logique réutilisable :

```
/app/frontend/src/hooks/
├── useVenueProfile.js      (logique de profil établissement)
├── useMusicianProfile.js   (logique de profil musicien)
├── useEvents.js            (logique des événements)
├── useApplications.js      (logique des candidatures)
└── useGeolocation.js       (logique de géolocalisation)
```

#### 3.2 Nettoyer les Dépendances

```bash
# Analyser les dépendances inutilisées
yarn depcheck

# Supprimer les packages inutilisés
yarn remove <package-name>
```

#### 3.3 Optimisations Backend

```
/app/backend/
├── routes/
│   ├── auth.py           ✅ (déjà fait)
│   ├── venues.py         ✅ (déjà fait)
│   ├── musicians.py      ✅ (déjà fait)
│   ├── events.py         ✅ (déjà fait)
│   └── planning.py       ✅ (déjà fait)
└── server.py             (réduire à ~500 lignes)
```

---

## 📝 Étapes d'Exécution

### Méthode Recommandée : Incrémentale

1. **Créer un onglet à la fois**
   - Extraire le code
   - Tester l'onglet isolément
   - Intégrer dans le dashboard
   - Tester l'intégration
   - Commit Git

2. **Ordre Suggéré (du plus simple au plus complexe)**
   1. GalleryTab (72 lignes) ✅ Simple
   2. JacksTab (55 lignes) ✅ Simple
   3. ApplicationsTab (86 lignes) ✅ Simple
   4. NotificationsTab (208 lignes) ⚠️ Moyen
   5. ReviewsTab (128 lignes) ⚠️ Moyen
   6. KaraokeTab (165 lignes) ⚠️ Moyen
   7. SpectacleTab (156 lignes) ⚠️ Moyen
   8. JamsTab (215 lignes) ⚠️ Moyen
   9. BandsTab (271 lignes) ⚠️ Moyen
   10. HistoryTab (420 lignes) 🔴 Complexe
   11. ProfileTab (487 lignes) 🔴 Complexe
   12. ConcertsTab (493 lignes) 🔴 Complexe
   13. PlanningTab (630 lignes) 🔴 Très complexe

---

## ⚠️ Points d'Attention

### 1. Gestion des États

Les composants extraits peuvent nécessiter beaucoup de props. Considérer :
- **Context API** pour les états partagés
- **React Query** pour la gestion du cache API

### 2. Tests

Après chaque extraction, tester :
- ✅ Affichage de l'onglet
- ✅ Formulaires fonctionnels
- ✅ Appels API
- ✅ Notifications/Toasts
- ✅ Navigation entre onglets

### 3. Performance

Bénéfices attendus :
- ✅ Re-render uniquement de l'onglet actif
- ✅ Code-splitting automatique
- ✅ Temps de chargement initial réduit

---

## 📊 Métriques de Succès

### Avant Refactoring
- VenueDashboard: 5,672 lignes
- Temps de compilation: ~X secondes
- Bundle size: Y KB

### Après Refactoring (Objectif)
- VenueDashboard: ~300 lignes
- 13 composants de 50-630 lignes chacun
- Temps de compilation: -30%
- Bundle size: -20% (avec code-splitting)
- Maintenabilité: +80%

---

## 🚀 Commencer le Refactoring

### Commande pour créer la structure

```bash
mkdir -p /app/frontend/src/components/venue/tabs
mkdir -p /app/frontend/src/components/venue/forms
mkdir -p /app/frontend/src/components/musician/tabs
```

### Template de Composant d'Onglet

```jsx
// Template générique pour un onglet
import { Button } from "@/components/ui/button";

export default function [TabName]Tab({
  // Props nécessaires
  data,
  onAction,
  loading
}) {
  return (
    <div className="glassmorphism rounded-2xl p-6">
      <h2 className="font-heading font-semibold text-xl mb-6">
        [Titre de l'onglet]
      </h2>
      
      {/* Contenu de l'onglet */}
      
    </div>
  );
}
```

---

## 📚 Ressources

- [React Component Patterns](https://reactpatterns.com/)
- [Code Splitting](https://react.dev/learn/scaling-up-with-reducer-and-context)
- [React Performance](https://react.dev/learn/render-and-commit)

---

**Date de création**: 11 février 2026
**Statut**: 🟡 En attente d'exécution
**Priorité**: Moyenne (après correction des bugs critiques ✅)
