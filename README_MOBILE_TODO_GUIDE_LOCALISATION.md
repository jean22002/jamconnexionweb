# 📱 TODO MOBILE : Guide Utilisateur & Localisation Header

**Date de création** : 18 avril 2026  
**Priorité** : 🔴 HAUTE  
**Destinataires** : Équipe React Native  
**Objectif** : Synchroniser l'application mobile avec les nouvelles fonctionnalités Web

---

## 🎯 CONTEXTE

L'application Web a récemment intégré **deux nouvelles fonctionnalités clés** pour améliorer l'UX et atteindre la parité avec l'application mobile. Ces fonctionnalités doivent maintenant être implémentées sur l'app React Native :

1. **📖 Guide utilisateur interactif** (Modal step-by-step)
2. **📍 Bouton "Localisation" dans le Header** (Mode compact)

---

## 📖 FONCTIONNALITÉ 1 : GUIDE UTILISATEUR INTERACTIF

### Concept général

Un **guide interactif** qui s'affiche via un bouton `?` dans le header du dashboard. Il présente les fonctionnalités principales de la plateforme selon le profil de l'utilisateur (Musicien / Établissement / Mélomane).

### Déclenchement

- **Position** : Header du dashboard (à côté des icônes Trophées et Notifications)
- **Icône** : `HelpCircle` ou icône `?`
- **Action** : Ouvre une modale plein écran ou bottom sheet

### Structure technique (Web)

**Fichier de référence** : `/app/frontend/src/components/GuideModal.jsx`

#### Props du composant :
```javascript
<GuideModal 
  isOpen={boolean}       // État d'ouverture de la modale
  onClose={function}     // Fonction de fermeture
  userRole={string}      // "musician" | "venue" | "melomane"
/>
```

#### Navigation :
- **État local** : `currentStep` (index de l'étape actuelle)
- **Boutons** :
  - "Précédent" (désactivé sur étape 0)
  - "Suivant" (étapes 0 à N-1)
  - "Terminer" (dernière étape → ferme le guide)
- **Indicateurs** : Dots de progression (étape active = dot large avec couleur primaire)
- **Compteur** : "X / Y" affiché au centre

---

### Contenu par profil

#### 🎸 MUSICIENS (6 étapes)

**Étape 1 : Bienvenue**
- **Titre** : "🎸 Bienvenue Musicien !"
- **Icône** : Music
- **Contenu** :
  - Présentation de Jam Connexion
  - Encadré : "🎁 Votre compte est 100% gratuit !"
  - Message : Accès à toutes les fonctionnalités sans limite

**Étape 2 : La Carte Interactive**
- **Titre** : "🗺️ La Carte Interactive"
- **Icône** : MapPin (cyan)
- **Contenu** :
  - Découvrir les établissements recherchant des musiciens
  - Filtres avancés (style musical, distance, type)
  - Recherche géographique

**Étape 3 : Mode En Déplacement** ⚠️ **LIEN AVEC FONCTIONNALITÉ 2**
- **Titre** : "📍 Mode En Déplacement"
- **Icône** : Locate (orange)
- **Contenu** :
  - Explication du bouton "Localisation" (géolocalisation temporaire 24h)
  - Cas d'usage : vacances, déplacement professionnel
  - Options : GPS automatique ou saisie manuelle

**Étape 4 : Groupes Musicaux**
- **Titre** : "👥 Groupes Musicaux"
- **Icône** : Users (purple)
- **Contenu** :
  - Créer ou rejoindre des groupes
  - Code d'invitation unique généré automatiquement

**Étape 5 : Badges & Trophées**
- **Titre** : "🏆 Badges & Trophées"
- **Icône** : Award (yellow)
- **Contenu** :
  - Gagner des badges en accomplissant des actions
  - Classement général

**Étape 6 : Notifications**
- **Titre** : "📱 Notifications"
- **Icône** : Bell (green)
- **Contenu** :
  - Liste des notifications reçues :
    - Candidatures acceptées
    - Nouveaux événements d'établissements suivis
    - Rappels d'événements (J-3 et Jour J à 13h)
    - Nouveaux badges
    - Messages reçus

---

#### 🎤 ÉTABLISSEMENTS (5 étapes)

**Étape 1 : Bienvenue**
- **Titre** : "🎤 Bienvenue Établissement !"
- **Icône** : Building2
- **Contenu** :
  - Présentation de Jam Connexion
  - Encadré : "🎁 Offre de lancement : 6 mois gratuits pour les 100 premiers !"

**Étape 2 : Votre Visibilité**
- **Titre** : "🗺️ Votre Visibilité"
- **Icône** : MapPin (cyan)
- **Contenu** :
  - Établissement visible sur la carte interactive
  - Recherche géographique et filtres par style

**Étape 3 : Créer des Événements**
- **Titre** : "📅 Créer des Événements"
- **Icône** : Calendar (orange)
- **Contenu** :
  - Publier des événements pour recevoir des candidatures
  - Fonctionnalités : date/heure, type, styles, rémunération

**Étape 4 : Candidatures**
- **Titre** : "👥 Candidatures"
- **Icône** : Users (purple)
- **Contenu** :
  - Gérer les candidatures reçues
  - Accepter/refuser avec notifications temps réel
  - Messagerie directe

**Étape 5 : Notifications**
- **Titre** : "📱 Notifications"
- **Icône** : Bell (green)
- **Contenu** :
  - Nouvelles candidatures
  - Nouveaux abonnés
  - Rappels d'événements (J-3 et Jour J à 13h)
  - Messages reçus

---

#### 🎵 MÉLOMANES (5 étapes)

**Étape 1 : Bienvenue**
- **Titre** : "🎵 Bienvenue Mélomane !"
- **Icône** : Music2
- **Contenu** :
  - Découvrir tous les concerts à proximité
  - "🎁 100% Gratuit pour toujours"

**Étape 2 : Carte des Événements**
- **Titre** : "🗺️ Carte des Événements"
- **Icône** : MapPin (cyan)
- **Contenu** :
  - Explorer la carte
  - Filtres par style
  - Calendrier des concerts

**Étape 3 : Suivre des Établissements**
- **Titre** : "❤️ Suivre des Établissements"
- **Icône** : Heart (pink)
- **Contenu** :
  - S'abonner à ses bars/salles préférés
  - Notifications pour nouveaux événements

**Étape 4 : Participer aux Événements**
- **Titre** : "📅 Participer aux Événements"
- **Icône** : Calendar (orange)
- **Contenu** :
  - Marquer sa participation
  - Rappels automatiques (J-3 et Jour J)
  - Voir les participants

**Étape 5 : Notifications**
- **Titre** : "📱 Notifications"
- **Icône** : Bell (green)
- **Contenu** :
  - Nouveaux concerts des établissements suivis
  - Rappels d'événements
  - Messages reçus

---

### Design recommandé (React Native)

#### Modal
- **Type** : `Modal` plein écran ou `BottomSheet` selon préférence UX mobile
- **Background** : Gradient sombre (`from-gray-900 to-black`)
- **Border** : `border-white/10`
- **Shadow** : Forte ombre pour détacher du contenu

#### Header Modal
- **Icône centrale** : `HelpCircle` dans un cercle coloré
- **Titre** : "Guide d'utilisation"
- **Bouton close** : Icône `X` en haut à droite

#### Content Area
- **Icône de l'étape** : Centrée, taille `w-12 h-12`
- **Titre de l'étape** : `text-2xl font-bold`
- **Description** : Paragraphes avec espacement généreux
- **Encadrés colorés** : Utiliser `bg-primary/10` avec `border-primary/30`

#### Navigation
- **Boutons** : `Précédent` (outline) / `Suivant` (filled)
- **Position** : Bottom de la modal
- **Disable state** : Gérer l'opacité pour bouton désactivé
- **Dernière étape** : Remplacer "Suivant" par "Terminer"

#### Progress Indicators
- **Position** : Centré au-dessus des boutons
- **Style** : Dots horizontaux
  - Dot actif : Large (`w-8`), couleur primaire
  - Dot inactif : Petit (`w-2`), couleur `muted`

---

## 📍 FONCTIONNALITÉ 2 : LOCALISATION DANS LE HEADER

### Concept général

Le bouton **"Mode En Déplacement"** (géolocalisation temporaire 24h) a été **déplacé du floating button (bas à droite)** vers le **header du dashboard** pour une meilleure accessibilité.

### Changement UX

#### ❌ Ancienne version (à retirer)
- Position : Floating button fixe en bas à droite
- Style : Bouton avec texte visible "Localisation" / "En déplacement"
- Encombrement : Prend de la place sur l'écran

#### ✅ Nouvelle version (à implémenter)
- Position : **Header, à côté des icônes Trophées / Notifications**
- Style : **Mode compact** (icône seule, pas de texte)
- Icône : `MapPin`
- **État inactif** : Icône grise
- **État actif** : 
  - Background gradient `from-primary to-cyan-500`
  - Icône avec animation `pulse`
  - **Point vert** (`w-3 h-3 bg-green-500`) en position absolue (coin supérieur droit)

---

### Fichier de référence Web

**Fichier** : `/app/frontend/src/components/LocationWidget.jsx`

#### Props du composant :
```javascript
<LocationWidget 
  token={string}         // Token d'authentification
  compact={true}         // Mode compact pour header (icône seule)
/>
```

⚠️ **Important** : La prop `compact={true}` active le mode header.

---

### Fonctionnement technique

#### Endpoint Backend
```
GET  /api/musicians/me/temporary-location    → Récupérer statut actuel
POST /api/musicians/me/temporary-location    → Activer (24h)
DELETE /api/musicians/me/temporary-location  → Désactiver
```

#### Réponse API (GET)
```json
{
  "enabled": false,
  "city": null,
  "expires": null,
  "profile_city": "Paris"
}
```

ou si actif :
```json
{
  "enabled": true,
  "city": "Lyon",
  "expires": "2026-04-19T14:30:00Z",
  "profile_city": "Paris"
}
```

#### Payload Activation (POST)
**Option 1 : GPS automatique**
```json
{
  "method": "gps",
  "latitude": 48.8566,
  "longitude": 2.3522
}
```

**Option 2 : Saisie manuelle**
```json
{
  "method": "manual",
  "city": "Lyon",
  "postal_code": "69001"  // Optionnel
}
```

---

### UI/UX du bouton Header (Mode compact)

#### Rendu visuel

**État inactif** :
```
┌──────────┐
│  📍 MapPin │ ← Icône grise, pas de background spécial
└──────────┘
```

**État actif** :
```
┌─────────────┐
│ 📍 MapPin  ● │ ← Background gradient + Point vert pulsant
└─────────────┘
```

#### Code CSS (exemple Tailwind)
```javascript
<TouchableOpacity
  style={{
    position: 'relative',
    padding: 8,
    borderRadius: 8,
    backgroundColor: locationStatus.enabled 
      ? 'linear-gradient(to right, primary, cyan)' 
      : 'transparent'
  }}
>
  <MapPin 
    size={20} 
    color={locationStatus.enabled ? 'white' : 'gray'}
    className={locationStatus.enabled ? 'animate-pulse' : ''}
  />
  {locationStatus.enabled && (
    <View style={{
      position: 'absolute',
      top: -4,
      right: -4,
      width: 12,
      height: 12,
      backgroundColor: 'green',
      borderRadius: 6,
      borderWidth: 2,
      borderColor: 'background'
    }} />
  )}
</TouchableOpacity>
```

---

### Modal d'activation (Bottom Sheet)

Lorsque l'utilisateur clique sur le bouton header, ouvrir une **modale ou bottom sheet** avec :

#### Header Modal
- **Icône** : `MapPin` dans un cercle coloré
- **Titre** : "Mode En déplacement"
- **Sous-titre** : "Système hybride de géolocalisation"
- **Bouton close** : `X`

#### Content (Si localisation désactivée)

**Section 1 : Choix de la méthode**
- **Tabs** : 
  - "📍 Saisie manuelle" (par défaut)
  - "🛰️ GPS automatique"

**Section 2 : Formulaire**

**Si "Saisie manuelle"** :
- Input : Ville (requis)
- Input : Code postal (optionnel)

**Si "GPS automatique"** :
- Message info : "Votre navigateur/app va demander l'autorisation d'accéder à votre position."

**Section 3 : Info**
- Encadré : "⏱️ La localisation temporaire sera active pendant **24 heures**."

**Bouton principal** : 
- "Activer pour 24h" (gradient `primary → cyan`)
- Désactivé si saisie manuelle ET champ vide

---

#### Content (Si localisation activée)

**Section 1 : Statut actif**
- Encadré vert avec icône `Check`
- Texte : "Localisation active"
- Info : "Vous êtes visible à : **Lyon**"
- Temps restant : "⏰ Expire dans 18h 42min"

**Section 2 : Info supplémentaire**
- "Ville d'origine : **Paris**" (lecture seule)

**Bouton principal** :
- "Désactiver le mode en déplacement" (rouge)

---

### Calcul du temps restant

#### Logique :
- Récupérer `expires` (ISO 8601 timestamp)
- Calculer différence avec `Date.now()`
- Afficher au format `Xh Ymin`
- **Refresh** : Toutes les secondes tant que la modale est ouverte

#### Exemple (React Native) :
```javascript
const calculateTimeRemaining = () => {
  const now = new Date();
  const expires = new Date(locationStatus.expires);
  const diff = expires - now;

  if (diff <= 0) {
    return "Expiré";
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}min`;
};
```

---

## 🎨 DESIGN SYSTEM (Recommandations)

### Couleurs

| Élément | Couleur Web | Équivalent RN |
|---------|-------------|---------------|
| Primaire | `primary` | `#7C3AED` (violet) |
| Cyan | `cyan-500` | `#06B6D4` |
| Orange | `orange-500` | `#F97316` |
| Green | `green-500` | `#22C55E` |
| Yellow | `yellow-500` | `#EAB308` |
| Purple | `purple-500` | `#A855F7` |
| Pink | `pink-500` | `#EC4899` |
| Muted | `muted-foreground` | `#71717A` |

### Gradients

**Localisation active** :
```css
background: linear-gradient(to right, #7C3AED, #06B6D4);
```

**Background modales** :
```css
background: linear-gradient(to bottom right, #1F2937, #000000);
```

### Icônes (lucide-react-native)

Utiliser `lucide-react-native` pour cohérence avec le Web :
```
MapPin, HelpCircle, Music, Building2, Calendar, Users, 
Bell, Trophy, Award, Heart, Check, Clock, X, ChevronLeft, 
ChevronRight, Loader, Filter, Search, Share2, Star, UserPlus, Music2
```

---

## 📦 FICHIERS DE RÉFÉRENCE WEB

Pour consulter l'implémentation complète côté Web :

| Fonctionnalité | Fichier Web | Lignes importantes |
|----------------|-------------|-------------------|
| Guide Modal | `/app/frontend/src/components/GuideModal.jsx` | Tout le fichier (515 lignes) |
| LocationWidget | `/app/frontend/src/components/LocationWidget.jsx` | Lignes 146-327 (mode compact) |
| MusicianDashboard (Header) | `/app/frontend/src/pages/MusicianDashboard.jsx` | ~lignes 2380+ (intégration header) |
| VenueDashboard (Header) | `/app/frontend/src/pages/VenueDashboard.jsx` | ~lignes 1850+ (intégration header) |

---

## ✅ CHECKLIST D'IMPLÉMENTATION

### Phase 1 : Guide Utilisateur (Priorité Haute)

- [ ] Créer composant `GuideModal.tsx` (ou `.jsx`)
- [ ] Props : `isOpen`, `onClose`, `userRole`
- [ ] État local : `currentStep` (navigation)
- [ ] Implémenter contenu Musiciens (6 étapes)
- [ ] Implémenter contenu Établissements (5 étapes)
- [ ] Implémenter contenu Mélomanes (5 étapes)
- [ ] Navigation : Boutons "Précédent" / "Suivant" / "Terminer"
- [ ] Indicateurs de progression (dots)
- [ ] Compteur "X / Y"
- [ ] Ajouter bouton `?` dans header des dashboards
- [ ] Tester sur profil Musicien
- [ ] Tester sur profil Établissement
- [ ] Tester sur profil Mélomane

---

### Phase 2 : Localisation Header (Priorité Haute)

- [ ] Créer composant `LocationWidget.tsx` (mode compact)
- [ ] Bouton icône dans header (MapPin)
- [ ] État visuel inactif (gris)
- [ ] État visuel actif (gradient + pulse + point vert)
- [ ] Fetch statut API : `GET /api/musicians/me/temporary-location`
- [ ] Refresh automatique toutes les 60 secondes
- [ ] Modal/BottomSheet d'activation
- [ ] Tabs : "Saisie manuelle" / "GPS automatique"
- [ ] Formulaire saisie manuelle (ville + code postal)
- [ ] Demande de permission GPS (si méthode GPS)
- [ ] POST activation avec payload correct
- [ ] Affichage statut actif (ville, temps restant)
- [ ] Calcul temps restant (live update chaque seconde)
- [ ] DELETE désactivation
- [ ] Tester activation manuelle
- [ ] Tester activation GPS
- [ ] Tester désactivation

---

## 🛠️ NOTES TECHNIQUES

### Refresh automatique

**Location Status** :
- Fetch initial au montage du composant
- Refresh toutes les **60 secondes** (interval)
- Cleanup de l'interval au démontage

**Temps restant** :
- Calculé **chaque seconde** si localisation active
- Cleanup de l'interval quand localisation désactivée ou modale fermée

### Gestion des permissions GPS

Sur React Native, utiliser `react-native-geolocation-service` ou `expo-location` :

```javascript
import Geolocation from 'react-native-geolocation-service';

Geolocation.getCurrentPosition(
  (position) => {
    // Envoyer latitude/longitude à l'API
  },
  (error) => {
    // Afficher erreur
  },
  { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
);
```

### Toasts/Notifications

Utiliser `react-native-toast-message` ou équivalent pour afficher :
- "📍 Localisation GPS activée pour 24h !"
- "📍 Localisation 'Lyon' activée pour 24h !"
- "Localisation temporaire désactivée"
- Erreurs API

---

## 🎯 OBJECTIFS FINAUX

Une fois ces deux fonctionnalités implémentées, l'application mobile aura :

✅ **Parité fonctionnelle totale** avec l'application Web  
✅ **Meilleure UX** : Guide d'onboarding interactif pour nouveaux utilisateurs  
✅ **Accessibilité améliorée** : Localisation dans header au lieu de floating button  
✅ **Cohérence visuelle** : Design aligné entre Web et Mobile

---

## 📞 QUESTIONS & SUPPORT

Pour toute question technique sur ces implémentations :

- **Référence complète** : `/app/RECAP_EQUIPE_MOBILE_17_AVRIL_2026.md`
- **Commits GitHub** : 
  - Guide + Localisation : `513efb4`
  - Parité Web/Mobile : `ef4e967`

---

**Créé le** : 18 avril 2026  
**Mis à jour le** : 18 avril 2026  
**Version** : 1.0
