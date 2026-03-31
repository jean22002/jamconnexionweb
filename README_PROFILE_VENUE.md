# 🏛️ Onglet Profil - Dashboard Établissement

<div align="center">

**Spécifications Complètes pour l'App Mobile**

Guide détaillé du menu Profil pour les établissements (bars, salles de concert, etc.)

</div>

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Architecture Générale](#-architecture-générale)
- [Section 1 : Vue Profil (Lecture seule)](#-section-1--vue-profil-lecture-seule)
- [Section 2 : Modal d'édition du profil](#-section-2--modal-dédition-du-profil)
- [API Endpoints](#-api-endpoints)
- [Logique Frontend](#-logique-frontend)
- [Implémentation Mobile](#-implémentation-mobile)
- [Différences avec autres profils](#-différences-avec-autres-profils)

---

## 🎯 Vue d'ensemble

L'onglet **Profil** dans le dashboard Établissement est le premier onglet visible. Il permet au gérant de l'établissement de :
- **Consulter** les informations de son établissement (en lecture seule)
- **Éditer** son profil via un bouton "Éditer le profil" qui ouvre une modale

### Positionnement dans le Dashboard

L'onglet Profil est le **premier onglet** de la liste des 14 onglets du dashboard Établissement :

```
[Profil] [Bœufs] [Concerts] [Karaoké] [Spectacle] [Planning] [Candidatures] [Jacks] [Notifications] [Historique] [Comptabilité] [Avis] [Groupes] [Galerie] [Paramètres]
  ↑ actif par défaut
```

### Déclenchement de l'édition

**Bouton "Éditer le profil" :**
```
┌──────────────────────────────────┐
│ [✏️] Éditer le profil            │ ← Clic ouvre modale
└──────────────────────────────────┘
```

### Caractéristiques Importantes

⚠️ **CRITIQUES** :
- Contrairement au musicien, **PAS de sous-onglets** dans le profil Établissement
- La modale d'édition contient **TOUS les champs en une seule page scrollable**
- Deux images : **Image de profil** (logo/photo) + **Image de couverture** (bannière)
- Géolocalisation automatique via **CityAutocomplete** (Nominatim)
- Système d'**abonnement payant** avec période d'essai (trial)

---

## 🏗️ Architecture Générale

### Structure Vue Profil (Lecture seule)

```
┌────────────────────────────────────────────┐
│  [Nom de l'établissement]                  │
│  Type : Bar / Salle de concert             │
│                                            │
│  ┌──────────────┐ ┌──────────────┐        │
│  │ 📞 Contact    │ │ ℹ️ Informations│        │
│  │ - Adresse    │ │ - Description  │        │
│  │ - Téléphone  │ │ - Capacité     │        │
│  │ - Email      │ │ - Réseaux      │        │
│  └──────────────┘ └──────────────┘        │
│                                            │
│  [Éditer le profil]                        │ ← Bouton
└────────────────────────────────────────────┘
```

### Structure Modale d'Édition

```
┌────────────────────────────────────────────┐
│ Éditer le profil de l'établissement  [X]   │
├────────────────────────────────────────────┤
│                                            │
│  📸 Images (Profil + Couverture)           │
│  🏢 Informations générales                 │
│  📍 Localisation                           │
│  📞 Contact                                │
│  🎵 Styles musicaux                        │
│  🎤 Équipements disponibles                │
│  🎸 Détails Scène & Sono                   │
│  💡 Lumières                               │
│  🕐 Horaires d'ouverture                   │
│  📬 Préférences de messagerie              │
│                                            │
│  [Sauvegarder]  [Annuler]                  │
└────────────────────────────────────────────┘
```

---

## 📖 Section 1 : Vue Profil (Lecture seule)

### Composant : `ProfileTab.jsx`

**Fichier :** `/app/frontend/src/features/venue-dashboard/tabs/ProfileTab.jsx`

### Props

```javascript
{
  venue: Object,              // Données complètes du profil établissement
  handleOpenProfileDialog: Function  // Ouvre la modale d'édition
}
```

### Affichage

#### Header

```jsx
<div className="flex items-start justify-between mb-6">
  <div>
    <h2>{venue.name}</h2>           {/* Ex: "Le Jazz Club" */}
    <p>{venue.venue_type || 'Établissement'}</p>  {/* Type d'établissement */}
  </div>
  <Button onClick={handleOpenProfileDialog}>
    <Edit /> Éditer le profil
  </Button>
</div>
```

#### Section 1 : Contact (Colonne Gauche)

**Champs affichés :**

| Icône | Label | Champ | Format |
|-------|-------|-------|--------|
| 📍 | Adresse | `venue.address` | String |
| | | `venue.postal_code` `venue.city` | "75001 Paris" |
| 📞 | Téléphone | `venue.phone` | String |
| 📧 | Email | `venue.email` | String |

**Exemple :**
```
📞 Contact
  📍 Adresse
     42 rue de la Musique
     75011 Paris
  
  📞 Téléphone
     01 23 45 67 89
  
  📧 Email
     contact@lejazzclub.fr
```

#### Section 2 : Informations (Colonne Droite)

**Champs affichés :**

| Icône | Label | Champ | Format |
|-------|-------|-------|--------|
| ℹ️ | Description | `venue.description` | Texte multilignes |
| 👥 | Capacité | `venue.capacity` | "250 personnes" |
| 🌐 | Site web | `venue.website` | Lien cliquable |
| 📘 | Facebook | `venue.facebook` | Icône cliquable |
| 📷 | Instagram | `venue.instagram` | Icône cliquable |

**Exemple :**
```
ℹ️ Informations
  Description
    "Bar associatif dédié au jazz et aux musiques improvisées.
    Scène ouverte tous les jeudis soirs."
  
  👥 Capacité
     150 personnes
  
  Réseaux sociaux :
  🌐 🔗 📘 📷
```

### Comportement

- **État initial :** Lecture seule, toutes les données affichées
- **Aucune interaction** sauf le bouton "Éditer le profil"
- **Responsive :** 2 colonnes sur desktop, 1 colonne empilée sur mobile

---

## ✏️ Section 2 : Modal d'édition du profil

### Déclenchement

```javascript
const [editing, setEditing] = useState(false);

// Ouvrir la modale
setEditing(true);
```

### Structure de la Modale

**État du formulaire complet :**

```javascript
const [formData, setFormData] = useState({
  // Général
  name: "",
  description: "",
  venue_type: "",        // "Bar", "Salle de concert", "Café-concert", etc.
  
  // Images
  profile_image: "",     // URL image de profil (logo)
  cover_image: "",       // URL image de couverture (bannière)
  
  // Localisation
  address: "",
  city: "",
  department: "",        // Ex: "Isère"
  region: "",            // Ex: "Auvergne-Rhône-Alpes"
  postal_code: "",
  latitude: 0,           // Float - obligatoire pour carte
  longitude: 0,          // Float - obligatoire pour carte
  
  // Contact
  phone: "",
  email: "",             // Email établissement (différent du compte)
  website: "",
  facebook: "",
  instagram: "",
  
  // Équipements Scène
  has_stage: false,               // Boolean
  stage_size: "",                 // "5m²", "10m²", "15m²", "20m²+"
  
  // Sono
  has_pa_system: false,           // Boolean - Système de sonorisation
  pa_mixer_name: "",              // Nom de la table de mixage
  pa_speakers_name: "",           // Nom des enceintes
  pa_power: "",                   // Puissance (ex: "2000W")
  has_sound_engineer: false,      // Boolean - Ingénieur son disponible
  
  // Lumières
  has_lights: false,              // Boolean
  has_auto_light: false,          // Boolean - Jeu de lumière automatique
  has_light_table: false,         // Boolean - Table lumière
  
  // Musique
  music_styles: [],               // Array<string> - Styles musicaux proposés
  equipment: [],                  // Array<string> - Équipements disponibles
  
  // Infos pratiques
  capacity: 0,                    // Int - Nombre de personnes
  opening_hours: "",              // String - Ex: "Mar-Sam 18h-2h"
  
  // Préférences
  allow_messages_from: "everyone" // "everyone" | "connected_only"
});
```

---

### 📸 Section 1 : Images

**Composant :** `VenueImageUpload`

#### Champ 1 : Image de profil

```jsx
<Label>Image de profil (logo)</Label>
<VenueImageUpload
  value={formData.profile_image}
  onChange={(url) => setFormData({ ...formData, profile_image: url })}
  token={token}
  type="profile"  // Spécifie le type d'upload
/>
```

**Comportement :**
- Upload d'image vers `/api/upload/image`
- Formats acceptés : PNG, JPG, WEBP
- Taille max : 5MB
- Affichage preview immédiat après upload

#### Champ 2 : Image de couverture

```jsx
<Label>Image de couverture (bannière)</Label>
<VenueImageUpload
  value={formData.cover_image}
  onChange={(url) => setFormData({ ...formData, cover_image: url })}
  token={token}
  type="cover"   // Spécifie le type d'upload
/>
```

**Différence avec image de profil :**
- Format recommandé : 16:9 (paysage)
- Affichée en pleine largeur sur la page profil public

---

### 🏢 Section 2 : Informations Générales

#### Champ 1 : Nom de l'établissement

```jsx
<Label>Nom de l'établissement *</Label>
<Input
  value={formData.name}
  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
  placeholder="Ex: Le Jazz Club"
  required
/>
```

**Validation :**
- ✅ **Obligatoire**
- Longueur min : 2 caractères
- Longueur max : 100 caractères

#### Champ 2 : Type d'établissement

```jsx
<Label>Type d'établissement</Label>
<Select
  value={formData.venue_type}
  onValueChange={(value) => setFormData({ ...formData, venue_type: value })}
>
  <SelectItem value="Bar">Bar</SelectItem>
  <SelectItem value="Café-concert">Café-concert</SelectItem>
  <SelectItem value="Salle de concert">Salle de concert</SelectItem>
  <SelectItem value="Club">Club / Discothèque</SelectItem>
  <SelectItem value="Restaurant">Restaurant</SelectItem>
  <SelectItem value="Salle polyvalente">Salle polyvalente</SelectItem>
  <SelectItem value="Théâtre">Théâtre</SelectItem>
  <SelectItem value="Festival">Festival</SelectItem>
  <SelectItem value="Autre">Autre</SelectItem>
</Select>
```

#### Champ 3 : Description

```jsx
<Label>Description</Label>
<Textarea
  value={formData.description}
  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
  placeholder="Décrivez votre établissement, son ambiance, sa programmation..."
  rows={4}
  maxLength={1000}
/>
<p className="text-xs text-muted-foreground">
  {formData.description.length}/1000 caractères
</p>
```

#### Champ 4 : Capacité

```jsx
<Label>Capacité d'accueil</Label>
<Input
  type="number"
  value={formData.capacity}
  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
  placeholder="Ex: 150"
  min={0}
/>
<p className="text-xs text-muted-foreground">Nombre de personnes</p>
```

---

### 📍 Section 3 : Localisation

#### Composant : `CityAutocomplete`

**Fonctionnement :**
- Autocomplétion via API Nominatim (OpenStreetMap)
- Renseigne automatiquement : `city`, `postal_code`, `region`, `latitude`, `longitude`

```jsx
<Label>Ville *</Label>
<CityAutocomplete
  value={formData.city}
  onSelect={(cityData) => {
    setFormData({
      ...formData,
      city: cityData.city,
      postal_code: cityData.postalCode,
      region: cityData.region,
      department: cityData.department,
      latitude: cityData.latitude,
      longitude: cityData.longitude
    });
  }}
  label="Ville"
  placeholder="Ex: Lyon"
/>
```

**Retour API :**
```json
{
  "city": "Lyon",
  "postalCode": "69001",
  "region": "Auvergne-Rhône-Alpes",
  "department": "Rhône",
  "latitude": 45.767,
  "longitude": 4.834
}
```

#### Champ 2 : Adresse complète

```jsx
<Label>Adresse *</Label>
<Input
  value={formData.address}
  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
  placeholder="Ex: 42 rue de la République"
  required
/>
```

**Validation :**
- ✅ **Obligatoire** (sauf si ville renseignée)
- Au moins **une des deux** (adresse OU ville) doit être remplie

#### Champ 3 : Code postal

```jsx
<Label>Code postal</Label>
<Input
  value={formData.postal_code}
  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
  placeholder="Ex: 69001"
  disabled={true}  // Rempli automatiquement par CityAutocomplete
/>
```

---

### 📞 Section 4 : Contact

#### Champ 1 : Téléphone

```jsx
<Label>Téléphone</Label>
<Input
  type="tel"
  value={formData.phone}
  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
  placeholder="Ex: 06 12 34 56 78"
/>
```

#### Champ 2 : Email

```jsx
<Label>Email de contact</Label>
<Input
  type="email"
  value={formData.email}
  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
  placeholder="contact@etablissement.fr"
/>
<p className="text-xs text-muted-foreground">
  Email visible publiquement (différent de votre email de connexion)
</p>
```

#### Champ 3 : Site web

```jsx
<Label>Site web</Label>
<Input
  type="url"
  value={formData.website}
  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
  placeholder="https://www.monsite.fr"
/>
```

#### Champ 4 : Facebook

```jsx
<Label>Page Facebook</Label>
<Input
  type="url"
  value={formData.facebook}
  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
  placeholder="https://facebook.com/monbar"
/>
```

#### Champ 5 : Instagram

```jsx
<Label>Instagram</Label>
<Input
  type="url"
  value={formData.instagram}
  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
  placeholder="https://instagram.com/monbar"
/>
```

---

### 🎵 Section 5 : Styles Musicaux

**Liste complète :** Importée depuis `/app/frontend/src/data/music-styles.js`

```jsx
<Label>Styles musicaux proposés</Label>
<Select onValueChange={(style) => {
  if (!formData.music_styles.includes(style)) {
    setFormData({
      ...formData,
      music_styles: [...formData.music_styles, style]
    });
  }
}}>
  <SelectTrigger>
    <SelectValue placeholder="Ajouter un style" />
  </SelectTrigger>
  <SelectContent className="max-h-[300px]">
    {MUSIC_STYLES_LIST.map((style) => (
      <SelectItem key={style} value={style}>{style}</SelectItem>
    ))}
  </SelectContent>
</Select>

{/* Liste des styles sélectionnés */}
<div className="flex flex-wrap gap-2 mt-2">
  {formData.music_styles.map((style, i) => (
    <span key={i} className="px-3 py-1 bg-primary/20 rounded-full text-sm flex items-center gap-1">
      {style}
      <button onClick={() => {
        setFormData({
          ...formData,
          music_styles: formData.music_styles.filter(s => s !== style)
        });
      }}>
        <X className="w-3 h-3" />
      </button>
    </span>
  ))}
</div>
```

**Styles disponibles :** (Liste complète)
- Rock, Blues, Jazz, Funk, Soul, Reggae, Hip Hop, Électro, Pop, Folk, Metal, Punk, Country, Classique, World Music, etc.

---

### 🎤 Section 6 : Équipements Disponibles

#### Sous-section A : Scène

```jsx
<div className="flex items-center gap-2">
  <Switch
    checked={formData.has_stage}
    onCheckedChange={(checked) => setFormData({ ...formData, has_stage: checked })}
  />
  <Label>Scène disponible</Label>
</div>

{formData.has_stage && (
  <Select
    value={formData.stage_size}
    onValueChange={(value) => setFormData({ ...formData, stage_size: value })}
  >
    <SelectItem value="5m²">Petite (5m²)</SelectItem>
    <SelectItem value="10m²">Moyenne (10m²)</SelectItem>
    <SelectItem value="15m²">Grande (15m²)</SelectItem>
    <SelectItem value="20m²+">Très grande (20m²+)</SelectItem>
  </Select>
)}
```

#### Sous-section B : Sonorisation (PA System)

```jsx
<div className="flex items-center gap-2">
  <Switch
    checked={formData.has_pa_system}
    onCheckedChange={(checked) => setFormData({ ...formData, has_pa_system: checked })}
  />
  <Label>Système de sonorisation (PA)</Label>
</div>

{formData.has_pa_system && (
  <>
    <Input
      placeholder="Nom de la table de mixage"
      value={formData.pa_mixer_name}
      onChange={(e) => setFormData({ ...formData, pa_mixer_name: e.target.value })}
    />
    <Input
      placeholder="Nom des enceintes"
      value={formData.pa_speakers_name}
      onChange={(e) => setFormData({ ...formData, pa_speakers_name: e.target.value })}
    />
    <Input
      placeholder="Puissance (ex: 2000W)"
      value={formData.pa_power}
      onChange={(e) => setFormData({ ...formData, pa_power: e.target.value })}
    />
  </>
)}

<div className="flex items-center gap-2">
  <Switch
    checked={formData.has_sound_engineer}
    onCheckedChange={(checked) => setFormData({ ...formData, has_sound_engineer: checked })}
  />
  <Label>Ingénieur son disponible</Label>
</div>
```

#### Sous-section C : Lumières

```jsx
<div className="flex items-center gap-2">
  <Switch
    checked={formData.has_lights}
    onCheckedChange={(checked) => setFormData({ ...formData, has_lights: checked })}
  />
  <Label>Éclairage scénique</Label>
</div>

{formData.has_lights && (
  <>
    <div className="flex items-center gap-2">
      <Switch
        checked={formData.has_auto_light}
        onCheckedChange={(checked) => setFormData({ ...formData, has_auto_light: checked })}
      />
      <Label>Jeu de lumière automatique</Label>
    </div>
    
    <div className="flex items-center gap-2">
      <Switch
        checked={formData.has_light_table}
        onCheckedChange={(checked) => setFormData({ ...formData, has_light_table: checked })}
      />
      <Label>Table lumière (contrôle manuel)</Label>
    </div>
  </>
)}
```

#### Sous-section D : Autres équipements

**Liste d'équipements prédéfinis :**

```javascript
const INSTRUMENTS_BASE = [
  "Batterie",
  "Basse",
  "Guitare électrique",
  "Guitare acoustique",
  "Piano",
  "Clavier/Synthé",
  "Micro",
  "Ampli guitare",
  "Ampli basse"
];
```

```jsx
<Label>Équipements disponibles pour les musiciens</Label>
<Select onValueChange={(item) => {
  if (!formData.equipment.includes(item)) {
    setFormData({
      ...formData,
      equipment: [...formData.equipment, item]
    });
  }
}}>
  <SelectTrigger>
    <SelectValue placeholder="Ajouter un équipement" />
  </SelectTrigger>
  <SelectContent>
    {INSTRUMENTS_BASE.map((item) => (
      <SelectItem key={item} value={item}>{item}</SelectItem>
    ))}
  </SelectContent>
</Select>

{/* Liste des équipements sélectionnés */}
<div className="flex flex-wrap gap-2 mt-2">
  {formData.equipment.map((item, i) => (
    <span key={i} className="px-3 py-1 bg-secondary/20 rounded-full text-sm flex items-center gap-1">
      {item}
      <button onClick={() => {
        setFormData({
          ...formData,
          equipment: formData.equipment.filter(e => e !== item)
        });
      }}>
        <X className="w-3 h-3" />
      </button>
    </span>
  ))}
</div>
```

---

### 🕐 Section 7 : Horaires d'Ouverture

```jsx
<Label>Horaires d'ouverture</Label>
<Textarea
  value={formData.opening_hours}
  onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
  placeholder="Ex: Mardi-Samedi 18h-2h, Dimanche 17h-00h"
  rows={2}
/>
<p className="text-xs text-muted-foreground">
  Format libre - ces horaires seront visibles sur votre profil public
</p>
```

---

### 📬 Section 8 : Préférences de Messagerie

```jsx
<Label>Qui peut vous envoyer des messages ?</Label>
<Select
  value={formData.allow_messages_from}
  onValueChange={(value) => setFormData({ ...formData, allow_messages_from: value })}
>
  <SelectItem value="everyone">Tout le monde</SelectItem>
  <SelectItem value="connected_only">Uniquement mes Jacks (abonnés)</SelectItem>
</Select>
<p className="text-xs text-muted-foreground">
  Les musiciens pourront vous contacter via la messagerie interne
</p>
```

**Logique :**
- `"everyone"` : Tous les musiciens peuvent envoyer des messages
- `"connected_only"` : Seuls les musiciens "Jacks" (abonnés à l'établissement) peuvent envoyer des messages

---

### 💾 Section 9 : Sauvegarde

#### Boutons d'action

```jsx
<div className="flex gap-3 pt-6">
  <Button
    onClick={handleSaveProfile}
    className="flex-1 bg-primary hover:bg-primary/90 rounded-full"
    disabled={saving}
  >
    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
    {saving ? "Sauvegarde..." : "Sauvegarder"}
  </Button>
  
  <Button
    onClick={() => setEditing(false)}
    variant="outline"
    className="flex-1 rounded-full border-white/20"
  >
    Annuler
  </Button>
</div>
```

#### Fonction de sauvegarde

```javascript
const handleSaveProfile = async () => {
  // Validation
  if (!formData.name || formData.name.trim() === "") {
    toast.error("Le nom de l'établissement est obligatoire");
    return;
  }
  
  if (!formData.address && !formData.city) {
    toast.error("Veuillez renseigner au moins une adresse ou une ville");
    return;
  }
  
  setSaving(true);
  
  try {
    // Normaliser les URLs d'images
    const profileData = { ...formData };
    
    // Retirer le domaine des URLs si présent
    if (profileData.profile_image) {
      profileData.profile_image = profileData.profile_image.replace(
        process.env.REACT_APP_BACKEND_URL, 
        ''
      );
    }
    if (profileData.cover_image) {
      profileData.cover_image = profileData.cover_image.replace(
        process.env.REACT_APP_BACKEND_URL, 
        ''
      );
    }
    
    const response = await axios.put(
      `${API}/venues/me`,
      profileData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    setProfile(response.data);
    setEditing(false);
    toast.success("Profil mis à jour avec succès !");
    
  } catch (error) {
    console.error('Save error:', error.response?.data || error.message);
    toast.error(error.response?.data?.detail || "Erreur lors de la sauvegarde");
  } finally {
    setSaving(false);
  }
};
```

---

## 🔗 API Endpoints

### 1. Récupérer le profil

**Endpoint :** `GET /api/venues/me`

**Headers :**
```
Authorization: Bearer {token}
```

**Réponse Success (200) :**
```json
{
  "id": "venue_abc123",
  "user_id": "user_xyz789",
  "name": "Le Jazz Club",
  "venue_type": "Bar",
  "description": "Bar associatif dédié au jazz",
  "profile_image": "/api/uploads/venues/profile_abc.jpg",
  "cover_image": "/api/uploads/venues/cover_abc.jpg",
  "address": "42 rue de la Musique",
  "city": "Lyon",
  "department": "Rhône",
  "region": "Auvergne-Rhône-Alpes",
  "postal_code": "69001",
  "latitude": 45.767,
  "longitude": 4.834,
  "phone": "0612345678",
  "email": "contact@lejazzclub.fr",
  "website": "https://www.lejazzclub.fr",
  "facebook": "https://facebook.com/lejazzclub",
  "instagram": "https://instagram.com/lejazzclub",
  "has_stage": true,
  "stage_size": "10m²",
  "has_pa_system": true,
  "pa_mixer_name": "Yamaha MG16XU",
  "pa_speakers_name": "JBL PRX",
  "pa_power": "2000W",
  "has_sound_engineer": false,
  "has_lights": true,
  "has_auto_light": true,
  "has_light_table": false,
  "music_styles": ["Jazz", "Blues", "Soul"],
  "equipment": ["Batterie", "Basse", "Piano", "Micro"],
  "capacity": 150,
  "opening_hours": "Mar-Sam 18h-2h",
  "allow_messages_from": "everyone",
  "subscription_status": "active",
  "trial_days_left": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-03-20T14:22:00Z"
}
```

**Erreur 404 :**
```json
{
  "detail": "Venue profile not found"
}
```

---

### 2. Mettre à jour le profil

**Endpoint :** `PUT /api/venues/me`

**Headers :**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body :**
```json
{
  "name": "Le Jazz Club",
  "venue_type": "Bar",
  "description": "Bar associatif...",
  "profile_image": "/api/uploads/venues/profile_abc.jpg",
  "cover_image": "/api/uploads/venues/cover_abc.jpg",
  "address": "42 rue de la Musique",
  "city": "Lyon",
  "postal_code": "69001",
  "department": "Rhône",
  "region": "Auvergne-Rhône-Alpes",
  "latitude": 45.767,
  "longitude": 4.834,
  "phone": "0612345678",
  "email": "contact@lejazzclub.fr",
  "website": "https://www.lejazzclub.fr",
  "facebook": "",
  "instagram": "",
  "has_stage": true,
  "stage_size": "10m²",
  "has_pa_system": true,
  "pa_mixer_name": "Yamaha MG16XU",
  "pa_speakers_name": "JBL PRX",
  "pa_power": "2000W",
  "has_sound_engineer": false,
  "has_lights": true,
  "has_auto_light": true,
  "has_light_table": false,
  "music_styles": ["Jazz", "Blues", "Soul"],
  "equipment": ["Batterie", "Basse", "Piano"],
  "capacity": 150,
  "opening_hours": "Mar-Sam 18h-2h",
  "allow_messages_from": "everyone"
}
```

**Réponse Success (200) :**
```json
{
  "id": "venue_abc123",
  "name": "Le Jazz Club",
  // ... (même structure que GET)
}
```

**Erreur 400 (Validation) :**
```json
{
  "detail": "Name is required"
}
```

---

### 3. Upload d'image

**Endpoint :** `POST /api/upload/image`

**Headers :**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (FormData) :**
```
file: <binary>
folder: "venues"
```

**Réponse Success (200) :**
```json
{
  "url": "/api/uploads/venues/abc123_timestamp.jpg",
  "filename": "abc123_timestamp.jpg"
}
```

---

## 🧠 Logique Frontend

### État Global

```javascript
const [profile, setProfile] = useState(null);     // Données profil
const [loading, setLoading] = useState(true);     // Chargement initial
const [editing, setEditing] = useState(false);    // Modal ouverte/fermée
const [saving, setSaving] = useState(false);      // Sauvegarde en cours
const [formData, setFormData] = useState({...});  // État formulaire
```

### Cycle de Vie

**1. Chargement Initial :**
```javascript
useEffect(() => {
  fetchProfile();
}, []);

const fetchProfile = async () => {
  setLoading(true);
  try {
    const response = await axios.get(`${API}/venues/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setProfile(response.data);
    
    // Pré-remplir le formulaire avec les données existantes
    setFormData({
      name: response.data.name || "",
      description: response.data.description || "",
      venue_type: response.data.venue_type || "",
      profile_image: buildImageUrl(response.data.profile_image),
      cover_image: buildImageUrl(response.data.cover_image),
      // ... tous les autres champs
    });
  } catch (error) {
    if (error.response?.status === 404) {
      setEditing(true); // Ouvrir directement le formulaire si nouveau
    }
  } finally {
    setLoading(false);
  }
};
```

**2. Ouverture Modale :**
```javascript
const handleOpenProfileDialog = () => {
  setEditing(true);
};
```

**3. Modification Formulaire :**
```javascript
const handleFieldChange = (field, value) => {
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));
};
```

**4. Sauvegarde :**
```javascript
// Voir Section 9 ci-dessus
```

**5. Annulation :**
```javascript
const handleCancel = () => {
  // Réinitialiser le formulaire avec les données du profil actuel
  setFormData({
    name: profile.name || "",
    // ... tous les champs
  });
  setEditing(false);
};
```

---

## 📱 Implémentation Mobile

### Architecture React Native

**Composants suggérés :**

```
/screens
  /VenueDashboard
    VenueDashboardScreen.js      // Dashboard principal
    /tabs
      ProfileTab.js               // Vue profil (lecture seule)
    /modals
      EditProfileModal.js         // Modal d'édition complète
```

### Vue Profil (ProfileTab.js)

```jsx
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Card, Button, Icon } from '@rneui/themed';

const ProfileTab = ({ venue, onEditPress }) => {
  return (
    <ScrollView>
      <Card>
        <View style={styles.header}>
          <View>
            <Text h3>{venue.name}</Text>
            <Text style={styles.venueType}>
              {venue.venue_type || 'Établissement'}
            </Text>
          </View>
          <Button
            icon={<Icon name="edit" type="feather" color="white" />}
            title="Éditer"
            onPress={onEditPress}
          />
        </View>
        
        {/* Section Contact */}
        <View style={styles.section}>
          <Text h4>📞 Contact</Text>
          {venue.address && (
            <View style={styles.contactItem}>
              <Icon name="map-pin" type="feather" />
              <View>
                <Text style={styles.label}>Adresse</Text>
                <Text>{venue.address}</Text>
                <Text>{venue.postal_code} {venue.city}</Text>
              </View>
            </View>
          )}
          {/* ... autres champs */}
        </View>
        
        {/* Section Informations */}
        <View style={styles.section}>
          <Text h4>ℹ️ Informations</Text>
          {/* ... */}
        </View>
      </Card>
    </ScrollView>
  );
};
```

### Modal d'Édition (EditProfileModal.js)

**Recommandation :** Utiliser une **ScrollView** avec sections collapsibles pour améliorer l'UX mobile.

```jsx
import { Modal, ScrollView, View } from 'react-native';
import { Input, Button, Switch, CheckBox } from '@rneui/themed';

const EditProfileModal = ({ visible, onClose, profile, onSave }) => {
  const [formData, setFormData] = useState({...profile});
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text h4>Éditer le profil</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="x" type="feather" />
          </TouchableOpacity>
        </View>
        
        {/* Form */}
        <ScrollView style={styles.form}>
          {/* Section Images */}
          <Text h5>📸 Images</Text>
          <ImageUploadField
            label="Image de profil"
            value={formData.profile_image}
            onChange={(url) => setFormData({...formData, profile_image: url})}
          />
          
          {/* Section Informations */}
          <Text h5>🏢 Informations générales</Text>
          <Input
            label="Nom de l'établissement *"
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
          />
          
          {/* ... tous les autres champs */}
          
          {/* Boutons */}
          <View style={styles.buttons}>
            <Button
              title="Sauvegarder"
              onPress={() => onSave(formData)}
            />
            <Button
              title="Annuler"
              type="outline"
              onPress={onClose}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
```

---

## ⚠️ Différences avec autres profils

### Vs. Profil Musicien

| Caractéristique | Établissement | Musicien |
|-----------------|---------------|----------|
| **Structure** | Modale simple | Modale avec 6 sous-onglets |
| **Images** | 2 (profil + couverture) | 1 (profil uniquement) |
| **Localisation** | Obligatoire (adresse OU ville) | Optionnelle |
| **Coordonnées GPS** | Obligatoires (carte) | Non |
| **Équipements** | Équipements fournis | Instruments joués |
| **Groupes** | Non applicable | Gestion groupes |
| **Concerts** | Non applicable | Concerts passés/futurs |
| **Abonnement** | Payant (12,99€/mois) | Gratuit |

### Vs. Profil Mélomane

| Caractéristique | Établissement | Mélomane |
|-----------------|---------------|----------|
| **Champs** | ~25 champs | 7 champs |
| **Complexité** | Élevée (équipements, sono, etc.) | Minimale |
| **Visibilité** | Publique (carte, recherche) | Semi-publique |
| **Rôle** | Créateur d'événements | Spectateur |

---

## 🚨 Points d'Attention pour l'App Mobile

### 1. Géolocalisation

⚠️ **CRITIQUE** : Les coordonnées GPS (`latitude`, `longitude`) sont **obligatoires** pour :
- Affichage sur la carte des établissements
- Calcul de proximité pour les mélomanes
- Notifications géolocalisées

**Solution :** Utiliser `CityAutocomplete` + API Nominatim (intégrée dans le backend).

### 2. Upload d'Images

**Backend Endpoint :** `POST /api/upload/image`

**Implémentation React Native :**
```javascript
import * as ImagePicker from 'expo-image-picker';

const uploadImage = async (imageUri) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'venue_image.jpg'
  });
  formData.append('folder', 'venues');
  
  const response = await axios.post(
    `${API_URL}/api/upload/image`,
    formData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  
  return response.data.url; // "/api/uploads/venues/abc.jpg"
};
```

### 3. Abonnement

Le profil établissement nécessite un **abonnement actif** (12,99€/mois) après la période d'essai.

**Contrôle d'accès :**
- Si `subscription_status === "expired"` → Bloquer tous les onglets sauf "Profil"
- Afficher un bandeau "Réabonnez-vous pour continuer"

### 4. Validation

**Champs obligatoires :**
- `name` (non vide)
- `address` **OU** `city` (au moins un des deux)

**Validations frontend :**
```javascript
const validateProfile = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim() === "") {
    errors.push("Le nom de l'établissement est obligatoire");
  }
  
  if (!data.address && !data.city) {
    errors.push("Veuillez renseigner au moins une adresse ou une ville");
  }
  
  if (data.email && !isValidEmail(data.email)) {
    errors.push("Format email invalide");
  }
  
  return errors;
};
```

### 5. UX Mobile

**Recommandations :**
- Utiliser des **sections collapsibles** (accordéon) pour réduire le scroll
- Afficher un **indicateur de progression** ("Section 3/8")
- Sauvegarder automatiquement en **brouillon local** (AsyncStorage)
- Ajouter un bouton "Aperçu" pour voir le rendu public du profil

---

## ✅ Checklist d'Implémentation

### Phase 1 : Vue Profil (Lecture seule)
- [ ] Créer `ProfileTab.js`
- [ ] Afficher les 2 sections (Contact + Informations)
- [ ] Gérer les champs optionnels (ne pas afficher si vide)
- [ ] Ajouter le bouton "Éditer le profil"
- [ ] Responsive 2 colonnes → 1 colonne mobile

### Phase 2 : Modal d'Édition
- [ ] Créer `EditProfileModal.js`
- [ ] Intégrer upload d'images (profil + couverture)
- [ ] Implémenter `CityAutocomplete` avec API Nominatim
- [ ] Ajouter tous les champs du formulaire
- [ ] Gérer les Switch pour équipements (scène, sono, lumières)
- [ ] Gérer les listes (styles musicaux, équipements)

### Phase 3 : Logique Backend
- [ ] Endpoint `GET /api/venues/me`
- [ ] Endpoint `PUT /api/venues/me`
- [ ] Endpoint `POST /api/upload/image`
- [ ] Validation des champs obligatoires
- [ ] Normalisation des URLs d'images

### Phase 4 : Tests
- [ ] Tester création d'un nouveau profil (404 → ouverture modal)
- [ ] Tester modification d'un profil existant
- [ ] Tester upload d'images
- [ ] Tester validation des champs
- [ ] Tester la sauvegarde et rechargement
- [ ] Tester le comportement si abonnement expiré

---

## 📞 Support

Pour toute question sur l'implémentation de ce profil Établissement dans l'app mobile, référez-vous également aux documents suivants :

- `README_PROFILE_MUSICIAN.md` (structure similaire)
- `README_MAP_TAB_MUSICIAN.md` (utilisation des coordonnées GPS)
- `README_UPLOADS.md` (système d'upload d'images)
- `INDEX_MOBILE.md` (architecture globale)

---

**Dernière mise à jour :** 2026-03-27
**Version :** 1.0
**Contact :** Équipe Backend Jam Connexion
