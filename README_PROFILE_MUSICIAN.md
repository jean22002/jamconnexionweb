# 👤 Onglet Profil/Paramètres - Dashboard Musicien

<div align="center">

**Spécifications Complètes pour l'App Mobile**

Guide détaillé de TOUS les sous-onglets du profil musicien

</div>

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Architecture Générale](#-architecture-générale)
- [Onglet 1 : Infos](#-onglet-1--infos)
- [Onglet 2 : Styles](#-onglet-2--styles)
- [Onglet 3 : Solo](#-onglet-3--solo)
- [Onglet 4 : Groupe](#-onglet-4--groupe)
- [Onglet 5 : Concerts](#-onglet-5--concerts)
- [Onglet 6 : Paramètres](#-onglet-6--paramètres)
- [API & Sauvegarde](#-api--sauvegarde)
- [Implémentation Mobile](#-implémentation-mobile)

---

## 🎯 Vue d'ensemble

L'onglet **Profil** est accessible via un bouton dans le header du dashboard. Il ouvre une **modale plein écran** avec **6 sous-onglets** permettant au musicien de gérer :
- Informations personnelles
- Styles musicaux
- Profil solo (optionnel)
- Groupe(s) (optionnel)
- Concerts passés/à venir
- Paramètres compte

### Déclenchement

**Bouton Header :**
```
┌──────────────────────────────────┐
│ [🎸] Mon Profil                  │ ← Clic ouvre modale
└──────────────────────────────────┘
```

### Navigation

**Tabs Horizontales (scroll sur mobile) :**
```
[Infos] [Styles] [Solo] [Groupe] [Concerts] [Paramètres]
  ↑ actif
```

### Sauvegarde Globale

⚠️ **IMPORTANT** : Un seul bouton "Sauvegarder" en bas de la modale sauvegarde **TOUS** les changements de tous les onglets.

---

## 🏗️ Architecture Générale

### Structure Modale

```
┌────────────────────────────────────────────┐
│ Mon Profil Musicien                 [X]    │
├────────────────────────────────────────────┤
│ [Infos] [Styles] [Solo] [Groupe] [...] →  │ ← Tabs scroll horizontal
├────────────────────────────────────────────┤
│                                            │
│  Contenu de l'onglet actif                │
│  (formulaires, listes, etc.)               │
│                                            │
│                                            │
├────────────────────────────────────────────┤
│         [Sauvegarder le profil]            │ ← Bouton unique
└────────────────────────────────────────────┘
```

### États Globaux

```javascript
const [profileForm, setProfileForm] = useState({
  // Infos
  profile_image: "",
  pseudo: "",
  age: null,
  bio: "",
  instruments: [],
  email: "",
  phone: "",
  city: "",
  postal_code: "",
  department: "",
  region: "",
  
  // Styles
  music_styles: [],
  
  // Groupe
  bands: [],
  
  // Concerts (deprecated - voir onglet Concerts)
});

const [soloProfile, setSoloProfile] = useState({
  repertoire_type: "",
  show_duration: "",
  is_available: false,
  availability: "",
  description: "",
  equipment: [],
  videos: [],
  photos: []
});

const [passwordForm, setPasswordForm] = useState({
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
});
```

---

## 📝 Onglet 1 : Infos

### Objectif
Modifier les informations personnelles de base du musicien.

### Champs

#### 1. Photo de Profil

**Type :** Upload image

**UI :**
```
┌─────────────────┐
│                 │
│   [Photo 📷]    │ ← Clic pour uploader
│                 │
└─────────────────┘
ou
┌─────────────────┐
│  [Image actuelle│ ← Clic pour changer
│   du musicien]  │
└─────────────────┘
```

**Comportement :**
- Clic ouvre sélecteur photo (galerie ou caméra)
- Upload via `POST /api/upload/musician-photo`
- Compression automatique (max 1MB)
- Format : JPG, PNG, WEBP
- Affichage aperçu immédiat
- URL stockée dans `profileForm.profile_image`

**Code Mobile :**
```javascript
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

const handleUploadPhoto = async () => {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: 0.8,
    maxWidth: 1080,
    maxHeight: 1080
  });
  
  if (result.assets && result.assets[0]) {
    const photo = result.assets[0];
    
    // Upload
    const formData = new FormData();
    formData.append('file', {
      uri: photo.uri,
      type: photo.type,
      name: photo.fileName
    });
    
    const response = await api.post('/upload/musician-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    // Mettre à jour state
    setProfileForm(prev => ({
      ...prev,
      profile_image: response.data.url
    }));
  }
};
```

---

#### 2. Pseudo

**Type :** Input texte

**Validation :**
- Requis
- Min 2 caractères
- Max 50 caractères
- Caractères autorisés : lettres, chiffres, espaces, tirets

**UI :**
```
Pseudo
┌─────────────────────────────┐
│ John Doe                    │
└─────────────────────────────┘
```

---

#### 3. Âge

**Type :** Select (dropdown)

**Options :** 10 ans → 100 ans

**UI :**
```
Âge
┌─────────────────────────────┐
│ 25 ans                    ▼ │
└─────────────────────────────┘
```

**Code Mobile :**
```javascript
<Picker
  selectedValue={profileForm.age}
  onValueChange={(value) => setProfileForm(prev => ({ ...prev, age: value }))}
>
  {Array.from({ length: 91 }, (_, i) => i + 10).map(age => (
    <Picker.Item key={age} label={`${age} ans`} value={age} />
  ))}
</Picker>
```

---

#### 4. Bio

**Type :** Textarea multilignes

**Validation :**
- Max 500 caractères
- Optionnel

**UI :**
```
Bio
┌─────────────────────────────┐
│ Guitariste passionné...     │
│                             │
│                             │
└─────────────────────────────┘
```

---

#### 5. Instruments

**Type :** Tags dynamiques (ajout/suppression)

**Comportement :**
- Input texte avec message "Appuyez Entrée pour ajouter"
- Touche Entrée → Ajoute tag
- Max 10 instruments
- Affichage chips avec bouton X

**UI :**
```
Instruments
┌─────────────────────────────┐
│ Appuyez Entrée pour ajouter │
└─────────────────────────────┘

[Guitare X] [Piano X] [Batterie X]
```

**Code Mobile :**
```javascript
const [instrumentInput, setInstrumentInput] = useState('');

const addInstrument = () => {
  if (instrumentInput.trim() && profileForm.instruments.length < 10) {
    setProfileForm(prev => ({
      ...prev,
      instruments: [...prev.instruments, instrumentInput.trim()]
    }));
    setInstrumentInput('');
  }
};

// UI
<TextInput
  value={instrumentInput}
  onChangeText={setInstrumentInput}
  onSubmitEditing={addInstrument}
  placeholder="Ex: Guitare, Piano..."
/>

<View style={styles.tagsContainer}>
  {profileForm.instruments.map((inst, i) => (
    <View key={i} style={styles.tag}>
      <Text>{inst}</Text>
      <TouchableOpacity onPress={() => removeInstrument(i)}>
        <Icon name="x" />
      </TouchableOpacity>
    </View>
  ))}
</View>
```

---

#### 6. Email

**Type :** Input email

**Validation :**
- Format email valide
- Unique (vérifié backend)
- Requis

**UI :**
```
Email
┌─────────────────────────────┐
│ john@example.com            │
└─────────────────────────────┘
```

---

#### 7. Téléphone

**Type :** Input tel

**Validation :**
- Format : +33 6 12 34 56 78
- Optionnel
- Formatage automatique recommandé

**UI :**
```
Téléphone
┌─────────────────────────────┐
│ +33 6 12 34 56 78           │
└─────────────────────────────┘
```

---

#### 8. Ville

**Type :** Autocomplete

**Comportement :**
- API OpenStreetMap Nominatim
- Recherche au fil de la frappe (debounce 300ms)
- Sélection → Remplit automatiquement :
  - `city`
  - `postal_code`
  - `department`
  - `region`
  - `latitude`, `longitude` (non affichés)

**UI :**
```
Ville
┌─────────────────────────────┐
│ Paris                       │ ← Recherche
└─────────────────────────────┘

Suggestions :
┌─────────────────────────────┐
│ Paris (75)                  │
│ Paris 15 (75015)            │
│ Paris 16 (75016)            │
└─────────────────────────────┘
```

**API Call :**
```javascript
const searchCity = async (query) => {
  if (query.length < 2) return;
  
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(query)}&` +
    `format=json&` +
    `addressdetails=1&` +
    `limit=5&` +
    `countrycodes=fr`
  );
  
  const data = await response.json();
  return data.map(item => ({
    city: item.address.city || item.address.town || item.address.village,
    postal_code: item.address.postcode,
    department: item.address.county,
    region: item.address.state,
    latitude: item.lat,
    longitude: item.lon
  }));
};
```

---

## 🎨 Onglet 2 : Styles

### Objectif
Définir les styles musicaux pratiqués par le musicien.

### Champs

#### Styles Musicaux (Tags)

**Type :** Tags dynamiques

**Comportement :**
- Input avec "Appuyez Entrée pour ajouter"
- Suggestions prédéfinies (optionnel)
- Max 10 styles
- Normalisation (première lettre majuscule)

**Styles Suggérés :**
```javascript
const SUGGESTED_STYLES = [
  "Rock", "Jazz", "Blues", "Pop", "Métal",
  "Funk", "Soul", "Reggae", "Electro", "Rap",
  "Hip-Hop", "R&B", "Country", "Folk", "Classique",
  "Variété", "Chanson française", "Musique du monde",
  "Latino", "Afro", "Ska", "Punk", "Hard Rock",
  "Progressive", "Fusion", "Gospel", "Indie"
];
```

**UI :**
```
Styles Musicaux
┌─────────────────────────────┐
│ Tapez ou sélectionnez...    │
└─────────────────────────────┘

Suggestions :
[Rock] [Jazz] [Blues] [Pop] [Métal] ...

Vos styles :
[Rock X] [Jazz X] [Funk X]
```

**Code Mobile :**
```javascript
const addStyle = (style) => {
  // Normaliser
  const normalized = style.charAt(0).toUpperCase() + style.slice(1).toLowerCase();
  
  // Éviter doublons
  if (!profileForm.music_styles.includes(normalized)) {
    setProfileForm(prev => ({
      ...prev,
      music_styles: [...prev.music_styles, normalized]
    }));
  }
};

// UI avec suggestions
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  {SUGGESTED_STYLES.map(style => (
    <TouchableOpacity
      key={style}
      onPress={() => addStyle(style)}
      style={[
        styles.suggestionChip,
        profileForm.music_styles.includes(style) && styles.selectedChip
      ]}
    >
      <Text>{style}</Text>
    </TouchableOpacity>
  ))}
</ScrollView>
```

---

## 🎤 Onglet 3 : Solo

### Objectif
Configurer le profil solo (artiste solo, DJ, etc.) - **OPTIONNEL**

### Activation

**Toggle :** "Je propose des prestations en solo"

**Si désactivé :**
```
┌─────────────────────────────┐
│ Je propose des prestations  │
│ en solo              [OFF]  │ ← Toute la section grisée
└─────────────────────────────┘
```

**Si activé :**
```
┌─────────────────────────────┐
│ Je propose des prestations  │
│ en solo               [ON]  │
├─────────────────────────────┤
│  [Tous les champs actifs]   │
└─────────────────────────────┘
```

---

### Champs (Quand Activé)

#### 1. Type de Répertoire

**Type :** Select

**Options :**
- "Compos"
- "Reprises"
- "Compos + Reprises"

**UI :**
```
Type de répertoire
┌─────────────────────────────┐
│ Compos + Reprises         ▼ │
└─────────────────────────────┘
```

---

#### 2. Durée du Spectacle

**Type :** Select

**Options :** 30mn → 6h (par tranches de 15mn)

**Liste :**
```javascript
const SHOW_DURATIONS = [
  "30mn", "45mn", "1h", "1h15", "1h30", "1h45",
  "2h", "2h15", "2h30", "2h45",
  "3h", "3h15", "3h30", "3h45",
  "4h", "4h15", "4h30", "4h45",
  "5h", "5h15", "5h30", "5h45", "6h"
];
```

**UI :**
```
Durée du spectacle
┌─────────────────────────────┐
│ 1h30                      ▼ │
└─────────────────────────────┘
```

---

#### 3. Disponibilité

**Type :** Textarea

**Placeholder :** "Ex: Disponible tous les vendredis et samedis soir"

**UI :**
```
Disponibilité
┌─────────────────────────────┐
│ Disponible tous les vendredis│
│ et samedis soir.            │
└─────────────────────────────┘
```

---

#### 4. Description du Spectacle

**Type :** Textarea

**Max :** 1000 caractères

**Placeholder :** "Décrivez votre prestation solo..."

**UI :**
```
Description
┌─────────────────────────────┐
│ Guitariste-chanteur spécia- │
│ lisé dans les reprises...   │
│                             │
│                             │
└─────────────────────────────┘
```

---

#### 5. Équipement

**Type :** Tags dynamiques

**Exemples :**
- "Matériel de sonorisation"
- "Éclairage"
- "Smoke machine"
- "Autonome"

**UI :**
```
Équipement
┌─────────────────────────────┐
│ Appuyez Entrée pour ajouter │
└─────────────────────────────┘

[Sono complète X] [Éclairage X] [Autonome X]
```

---

#### 6. Vidéos (URLs)

**Type :** Tags URLs

**Comportement :**
- Input URL
- Validation format URL
- Extraction ID si YouTube/Vimeo
- Affichage miniatures (optionnel)

**UI :**
```
Vidéos
┌─────────────────────────────┐
│ https://youtube.com/watch?v=│
└─────────────────────────────┘

[🎥 YouTube X] [🎥 Vimeo X]
```

---

#### 7. Photos

**Type :** Upload multiple images

**Max :** 5 photos

**Comportement :**
- Upload via `POST /api/upload/musician-photo`
- Galerie d'aperçus
- Réordonnancement (drag & drop optionnel)
- Suppression individuelle

**UI :**
```
Photos
┌───────┐ ┌───────┐ ┌───────┐
│ [📷]  │ │ [📷]  │ │  [+]  │
│ Photo1│ │ Photo2│ │ Ajouter
└───────┘ └───────┘ └───────┘
```

---

## 👥 Onglet 4 : Groupe

### Objectif
Gérer les groupes du musicien (création, rejoindre, quitter, détails).

### Vue d'Ensemble

**Affichage Liste :**
```
Mes Groupes (2)

┌─────────────────────────────┐
│ [Photo]  Les Jazzmen        │
│          Admin: Vous        │
│                             │
│ [Voir détails] [Planning]   │
└─────────────────────────────┘

┌─────────────────────────────┐
│ [Photo]  The Rockers        │
│          Admin: John Doe    │
│                             │
│ [Voir détails] [Planning]   │
└─────────────────────────────┘

[+ Créer un groupe]  [Rejoindre un groupe]
```

---

### Actions

#### 1. Créer un Groupe

**Bouton :** "+ Créer un groupe"

**Ouvre :** Modal création avec formulaire complet

**Champs :**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| **Nom** | Input | ✅ Oui | Nom du groupe |
| **Photo** | Upload | ❌ Non | Logo/photo groupe |
| **Type** | Select | ✅ Oui | "Duo acoustique", "Trio", "Groupe compos", etc. |
| **Styles** | Tags | ✅ Oui | Styles musicaux |
| **Ville** | Autocomplete | ✅ Oui | Ville du groupe |
| **Description** | Textarea | ❌ Non | Présentation groupe |
| **Répertoire** | Select | ❌ Non | Compos/Reprises/Mixte |
| **Durée spectacle** | Select | ❌ Non | 30mn → 6h |
| **Équipement** | Tags | ❌ Non | Sono, éclairage, etc. |
| **Association** | Checkbox + Input | ❌ Non | Nom association si oui |
| **Label** | Checkbox + Input | ❌ Non | Nom label si oui |
| **Cherche concerts** | Checkbox | ❌ Non | Disponible pour concerts |
| **Cherche membres** | Checkbox | ❌ Non | Recrute musiciens |
| **Profils recherchés** | Tags | ❌ Non | "Batteur", "Bassiste", etc. |
| **Ingé son** | Checkbox | ❌ Non | Ingénieur son dans groupe |
| **Réseaux sociaux** | Inputs | ❌ Non | Facebook, Instagram, YouTube, Site, Bandcamp |

**API :**
```http
POST /api/musicians/bands
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Les Jazzmen",
  "band_photo": "https://...",
  "band_type": "Trio acoustique",
  "music_styles": ["Jazz", "Blues"],
  "city": "Paris",
  "postal_code": "75001",
  "department": "75",
  "region": "Île-de-France",
  "description": "Trio de jazz...",
  "repertoire_type": "Compos + Reprises",
  "show_duration": "1h30",
  "equipment": ["Sono complète"],
  "is_association": false,
  "has_label": false,
  "looking_for_concerts": true,
  "looking_for_members": false,
  "has_sound_engineer": false,
  "facebook": "",
  "instagram": "",
  "youtube": "",
  "website": "",
  "bandcamp": ""
}
```

---

#### 2. Rejoindre un Groupe (via Code Invitation)

**Bouton :** "Rejoindre un groupe"

**Ouvre :** Modal avec input code

**UI :**
```
┌─────────────────────────────┐
│ Rejoindre un Groupe         │
├─────────────────────────────┤
│ Entrez le code d'invitation │
│ partagé par l'admin         │
│                             │
│ Code d'invitation           │
│ ┌─────────────────────────┐ │
│ │ ABC123                  │ │
│ └─────────────────────────┘ │
│                             │
│    [Annuler]  [Rejoindre]   │
└─────────────────────────────┘
```

**Comportement :**
1. User saisit code (6 caractères)
2. Clic "Rejoindre"
3. API vérifie code + ajoute membre
4. Success → Groupe apparaît dans liste
5. Error → Message "Code invalide"

**API :**
```http
POST /api/musicians/bands/join
Authorization: Bearer {token}
Content-Type: application/json

{
  "invite_code": "ABC123"
}
```

---

#### 3. Partager Code Invitation (Admin uniquement)

**Contexte :** Card groupe → Bouton "Partager"

**Ouvre :** Modal avec code + QR code

**UI :**
```
┌─────────────────────────────┐
│ Inviter des Membres         │
├─────────────────────────────┤
│ Partagez ce code :          │
│                             │
│  ┌──────────────────────┐   │
│  │                      │   │
│  │    [QR CODE]         │   │
│  │                      │   │
│  └──────────────────────┘   │
│                             │
│      Code : ABC123          │
│      [Copier]               │
│                             │
│ Ou partagez le lien :       │
│ jamconnexion.com/join/ABC123│
│      [Copier le lien]       │
└─────────────────────────────┘
```

**Fonctionnalités :**
- Copier code dans presse-papier
- Copier lien dans presse-papier
- Partager via Share API système
- QR code généré côté client

**Code Mobile :**
```javascript
import { Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const shareInviteCode = async (code) => {
  try {
    await Share.share({
      message: `Rejoins mon groupe sur Jam Connexion ! Code: ${code}\nhttps://jamconnexion.com/join/${code}`,
      title: 'Invitation Groupe'
    });
  } catch (error) {
    console.error(error);
  }
};

// QR Code
<QRCode
  value={`https://jamconnexion.com/join/${band.invite_code}`}
  size={200}
/>
```

---

#### 4. Voir Détails Groupe

**Ouvre :** Modal détails complets

**Sections :**
- Photo + Nom + Ville
- Admin (nom + email)
- Description
- Association (si applicable)
- Label (si applicable)
- Styles musicaux
- Réseaux sociaux
- Badges (Cherche concerts, Cherche membres, Ingé son)
- Profils recherchés
- **Membres** (liste avec rôles)
- Bouton "Contacter" (ouvre modal message)

**UI Membres :**
```
Membres (4)
┌─────────────────────────────┐
│ [Photo] John Doe            │
│         Admin               │
└─────────────────────────────┘
┌─────────────────────────────┐
│ [Photo] Jane Smith          │
│         Membre              │
│         [Retirer] (si admin)│
└─────────────────────────────┘
```

---

#### 5. Planning Groupe

**Bouton :** "Planning" sur card groupe

**Ouvre :** Modal calendrier avec événements du groupe

**Fonctionnalités :**
- Calendrier mensuel
- Événements colorés par type
- Clic date → Détails événement
- Liste chronologique dessous

---

#### 6. Quitter Groupe

**Contexte :** Détails groupe → Bouton "Quitter le groupe"

**Confirmation :**
```
┌─────────────────────────────┐
│ Quitter le Groupe ?         │
├─────────────────────────────┤
│ Êtes-vous sûr de vouloir    │
│ quitter "Les Jazzmen" ?     │
│                             │
│ Cette action est            │
│ irréversible.               │
│                             │
│  [Annuler]  [Quitter]       │
└─────────────────────────────┘
```

**API :**
```http
DELETE /api/musicians/bands/{band_id}/leave
Authorization: Bearer {token}
```

---

#### 7. Supprimer Groupe (Admin uniquement)

**Contexte :** Détails groupe → Bouton "Supprimer le groupe"

**Confirmation Renforcée :**
```
┌─────────────────────────────┐
│ ⚠️ ATTENTION                │
├─────────────────────────────┤
│ Supprimer définitivement    │
│ "Les Jazzmen" ?             │
│                             │
│ • Tous les membres seront   │
│   retirés                   │
│ • Toutes les données seront │
│   perdues                   │
│                             │
│ Tapez le nom du groupe pour │
│ confirmer :                 │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│  [Annuler]  [Supprimer]     │
└─────────────────────────────┘
```

**API :**
```http
DELETE /api/musicians/bands/{band_id}
Authorization: Bearer {token}
```

---

## 🎵 Onglet 5 : Concerts

### Objectif
Gérer la liste des concerts passés et à venir du musicien (manuel).

### Vue d'Ensemble

**Liste Chronologique :**
```
Mes Concerts (5)

À venir (2)
┌─────────────────────────────┐
│ 🎤 Le Blue Note             │
│    15 mars 2024 • 20h00     │
│    Paris (75)               │
│    [Modifier] [Supprimer]   │
└─────────────────────────────┘

Passés (3)
┌─────────────────────────────┐
│ 🎤 Jazz Café                │
│    10 février 2024 • 21h00  │
│    Lyon (69)                │
│    [Modifier] [Supprimer]   │
└─────────────────────────────┘

[+ Ajouter un concert]
```

---

### Ajouter un Concert

**Bouton :** "+ Ajouter un concert"

**Ouvre :** Modal formulaire

**Champs :**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| **Nom Établissement** | Input | ✅ Oui | Lieu du concert |
| **Date** | DatePicker | ✅ Oui | Date concert |
| **Heure** | TimePicker | ❌ Non | Heure début |
| **Ville** | Autocomplete | ✅ Oui | Ville |
| **Description** | Textarea | ❌ Non | Détails concert |

**API :**
```http
POST /api/musicians/concerts
Authorization: Bearer {token}
Content-Type: application/json

{
  "venue_name": "Le Blue Note",
  "date": "2024-03-15",
  "time": "20:00",
  "city": "Paris",
  "postal_code": "75001",
  "department": "75",
  "region": "Île-de-France",
  "description": "Concert jazz soul"
}
```

---

### Modifier un Concert

**Pré-remplit formulaire avec données existantes**

**API :**
```http
PUT /api/musicians/concerts/{concert_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "venue_name": "Le Blue Note",
  "date": "2024-03-16",  // Modifié
  // ...
}
```

---

### Supprimer un Concert

**Confirmation :**
```
┌─────────────────────────────┐
│ Supprimer ce concert ?      │
├─────────────────────────────┤
│ Le Blue Note                │
│ 15 mars 2024                │
│                             │
│  [Annuler]  [Supprimer]     │
└─────────────────────────────┘
```

**API :**
```http
DELETE /api/musicians/concerts/{concert_id}
Authorization: Bearer {token}
```

---

### Tri & Filtres

**Tri Automatique :**
- À venir : Date croissante (plus proche en premier)
- Passés : Date décroissante (plus récent en premier)

**Badge Visuel :**
```
À venir :
┌─────────────────────────────┐
│ 🔵 Concert à venir          │ ← Badge bleu
└─────────────────────────────┘

Passé :
┌─────────────────────────────┐
│ ⚫ Concert passé             │ ← Badge gris
└─────────────────────────────┘
```

---

## ⚙️ Onglet 6 : Paramètres

### Objectif
Gérer les paramètres du compte (mot de passe, notifications, déconnexion).

### Sections

#### 1. Changer le Mot de Passe

**Champs :**

| Champ | Type | Validation |
|-------|------|------------|
| **Ancien mot de passe** | Input password | Requis |
| **Nouveau mot de passe** | Input password | Min 8 caractères, 1 majuscule, 1 chiffre |
| **Confirmer nouveau** | Input password | Doit correspondre |

**UI :**
```
Changer le Mot de Passe

Ancien mot de passe
┌─────────────────────────────┐
│ ••••••••                    │
└─────────────────────────────┘

Nouveau mot de passe
┌─────────────────────────────┐
│ ••••••••••                  │
└─────────────────────────────┘

Confirmer nouveau mot de passe
┌─────────────────────────────┐
│ ••••••••••                  │
└─────────────────────────────┘

[Changer le mot de passe]
```

**Validation Temps Réel :**
```
Exigences :
✅ Au moins 8 caractères
✅ Une lettre majuscule
✅ Un chiffre
❌ Un caractère spécial
```

**API :**
```http
POST /api/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "old_password": "ancien123",
  "new_password": "Nouveau123!"
}
```

---

#### 2. Préférences Notifications (Web uniquement)

**Note :** Géré différemment sur mobile (voir Firebase Push)

**Section :**
```
Notifications
┌─────────────────────────────┐
│ [x] Candidatures acceptées  │
│ [x] Nouveaux messages       │
│ [ ] Invitations groupes     │
│ [x] Rappels événements      │
└─────────────────────────────┘
```

---

#### 3. Abonnement PRO

**Affichage Statut :**
```
Abonnement
┌─────────────────────────────┐
│ Statut : PRO ✅              │
│ Renouvellement : 15/04/2024 │
│                             │
│ [Gérer l'abonnement]        │
└─────────────────────────────┘

ou

┌─────────────────────────────┐
│ Statut : Gratuit            │
│                             │
│ [Passer PRO - 12,99€/mois]  │
└─────────────────────────────┘
```

**Navigation :**
- Clic "Passer PRO" → Voir `/app/STRIPE_MOBILE_RESPONSE.md`
- Clic "Gérer" → Annuler/réactiver renouvellement

---

#### 4. Déconnexion

**Bouton Rouge :**
```
┌─────────────────────────────┐
│  [Déconnexion]              │ ← Bouton rouge
└─────────────────────────────┘
```

**Comportement :**
1. Confirmation (optionnel)
2. Supprime token JWT local
3. Redirige vers écran Login

**Code Mobile :**
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const handleLogout = async () => {
  await AsyncStorage.removeItem('jwt_token');
  await AsyncStorage.removeItem('user');
  navigation.reset({
    index: 0,
    routes: [{ name: 'Login' }]
  });
};
```

---

#### 5. Supprimer le Compte (optionnel)

**Bouton Danger :**
```
Zone Danger
┌─────────────────────────────┐
│ ⚠️ Supprimer mon compte     │
└─────────────────────────────┘
```

**Confirmation Stricte :**
```
┌─────────────────────────────┐
│ ⚠️ ATTENTION                │
├─────────────────────────────┤
│ Cette action est            │
│ IRRÉVERSIBLE !              │
│                             │
│ Tapez "SUPPRIMER" pour      │
│ confirmer :                 │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│  [Annuler]  [Supprimer]     │
└─────────────────────────────┘
```

**API :**
```http
DELETE /api/account
Authorization: Bearer {token}
```

---

## 💾 API & Sauvegarde

### Endpoint Principal

**Sauvegarder TOUT le Profil :**
```http
PUT /api/musicians/me
Authorization: Bearer {token}
Content-Type: application/json

{
  // Onglet Infos
  "pseudo": "John Doe",
  "age": 25,
  "bio": "...",
  "instruments": ["Guitare", "Piano"],
  "email": "john@example.com",
  "phone": "+33612345678",
  "city": "Paris",
  "postal_code": "75001",
  "department": "75",
  "region": "Île-de-France",
  
  // Onglet Styles
  "music_styles": ["Rock", "Jazz"],
  
  // Onglet Solo
  "solo_profile": {
    "is_available": true,
    "repertoire_type": "Compos + Reprises",
    "show_duration": "1h30",
    "availability": "...",
    "description": "...",
    "equipment": ["Sono"],
    "videos": ["https://youtube.com/..."],
    "photos": ["https://..."]
  },
  
  // Onglet Groupe (géré séparément)
  // Onglet Concerts (géré séparément)
}
```

**Response :**
```json
{
  "id": "mus_123",
  "user_id": "usr_456",
  "pseudo": "John Doe",
  // ... toutes les données mises à jour
}
```

---

### Gestion Erreurs

**Codes HTTP :**
- `200` : Succès
- `400` : Validation échouée (champs requis manquants)
- `401` : Token invalide/expiré
- `409` : Email/pseudo déjà utilisé
- `500` : Erreur serveur

**Affichage Erreurs :**
```javascript
try {
  const response = await api.put('/musicians/me', profileData);
  Alert.alert('Succès', 'Profil mis à jour !');
  navigation.goBack();
} catch (error) {
  if (error.response?.status === 400) {
    Alert.alert('Erreur', error.response.data.detail || 'Données invalides');
  } else if (error.response?.status === 409) {
    Alert.alert('Erreur', 'Ce pseudo/email est déjà utilisé');
  } else {
    Alert.alert('Erreur', 'Impossible de sauvegarder le profil');
  }
}
```

---

## 📱 Implémentation Mobile

### Structure Composants

```
ProfileModal
├── Tabs Horizontal (ScrollView)
│   ├── InfoTab
│   ├── StylesTab
│   ├── SoloTab
│   ├── BandTab
│   ├── ConcertsTab
│   └── SettingsTab
│
└── Bouton Sauvegarder (Fixed bottom)
```

### Code Exemple (React Native)

```javascript
import { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  Modal, 
  TouchableOpacity, 
  Text 
} from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';

const ProfileModal = ({ visible, onClose, token }) => {
  const [profileForm, setProfileForm] = useState({...});
  const [soloProfile, setSoloProfile] = useState({...});
  const [passwordForm, setPasswordForm] = useState({...});
  const [loading, setLoading] = useState(false);
  
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'info', title: 'Infos' },
    { key: 'styles', title: 'Styles' },
    { key: 'solo', title: 'Solo' },
    { key: 'band', title: 'Groupe' },
    { key: 'concerts', title: 'Concerts' },
    { key: 'settings', title: 'Paramètres' }
  ]);

  useEffect(() => {
    if (visible) {
      fetchProfile();
    }
  }, [visible]);

  const fetchProfile = async () => {
    const response = await api.get('/musicians/me');
    setProfileForm(response.data);
    setSoloProfile(response.data.solo_profile || {});
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/musicians/me', {
        ...profileForm,
        solo_profile: soloProfile
      });
      Alert.alert('Succès', 'Profil sauvegardé !');
      onClose();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder');
    } finally {
      setLoading(false);
    }
  };

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'info':
        return <InfoTab profileForm={profileForm} setProfileForm={setProfileForm} />;
      case 'styles':
        return <StylesTab profileForm={profileForm} setProfileForm={setProfileForm} />;
      case 'solo':
        return <SoloTab soloProfile={soloProfile} setSoloProfile={setSoloProfile} />;
      case 'band':
        return <BandTab profileForm={profileForm} />;
      case 'concerts':
        return <ConcertsTab profileForm={profileForm} />;
      case 'settings':
        return <SettingsTab passwordForm={passwordForm} setPasswordForm={setPasswordForm} />;
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mon Profil Musicien</Text>
          <TouchableOpacity onPress={onClose}>
            <Text>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          renderTabBar={(props) => (
            <TabBar
              {...props}
              scrollEnabled
              style={styles.tabBar}
              indicatorStyle={styles.indicator}
              labelStyle={styles.label}
            />
          )}
        />

        {/* Bouton Sauvegarder */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Sauvegarde...' : 'Sauvegarder le profil'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
```

---

## ✅ Checklist Implémentation

### Phase 1 : MVP

**Onglet Infos :**
- [ ] Upload photo profil
- [ ] Champs texte (pseudo, bio, email, phone)
- [ ] Select âge
- [ ] Tags instruments
- [ ] Autocomplete ville

**Onglet Styles :**
- [ ] Tags styles musicaux
- [ ] Suggestions prédéfinies

**Onglet Solo :**
- [ ] Toggle activation
- [ ] Formulaire complet (7 champs)

**Onglet Groupe :**
- [ ] Liste groupes
- [ ] Créer groupe (formulaire)
- [ ] Rejoindre via code
- [ ] Partager code (QR + Share)
- [ ] Détails groupe

**Onglet Concerts :**
- [ ] Liste concerts
- [ ] Ajouter concert
- [ ] Modifier/supprimer

**Onglet Paramètres :**
- [ ] Changer mot de passe
- [ ] Statut abonnement
- [ ] Déconnexion

**Sauvegarde :**
- [ ] Bouton unique global
- [ ] API call consolidé
- [ ] Gestion erreurs

---

## 🎨 Design Tokens

```javascript
const colors = {
  primary: '#a855f7',
  secondary: '#ec4899',
  success: '#10b981',
  danger: '#ef4444',
  background: '#1e1e2e',
  card: 'rgba(255,255,255,0.05)',
  input: 'rgba(0,0,0,0.2)',
  text: '#ffffff',
  textMuted: '#888888',
  border: 'rgba(255,255,255,0.1)',
};

const typography = {
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
  },
  heading: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    textTransform: 'uppercase',
  },
};
```

---

## 📚 Bibliothèques Recommandées

```json
{
  "dependencies": {
    "react-native-tab-view": "^3.5.1",
    "react-native-image-picker": "^7.0.0",
    "@react-native-community/datetimepicker": "^7.6.0",
    "@react-native-picker/picker": "^2.6.0",
    "react-native-qrcode-svg": "^6.2.0",
    "@react-native-async-storage/async-storage": "^1.21.0"
  }
}
```

---

<div align="center">

**Profil Musicien : 6 Onglets Complets** 👤

Infos • Styles • Solo • Groupe • Concerts • Paramètres

Documentation exhaustive pour reproduction exacte sur mobile

</div>
