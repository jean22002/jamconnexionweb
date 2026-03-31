# 🎧 Onglet Profil - Dashboard Mélomane

<div align="center">

**Spécifications Complètes pour l'App Mobile**

Guide détaillé du menu Profil pour les mélomanes (fans de musique)

</div>

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Architecture Générale](#-architecture-générale)
- [Section 1 : Informations de profil](#-section-1--informations-de-profil)
- [Section 2 : Préférences musicales](#-section-2--préférences-musicales)
- [Section 3 : Notifications](#-section-3--notifications)
- [Section 4 : Gestion du compte](#-section-4--gestion-du-compte)
- [API Endpoints](#-api-endpoints)
- [Logique Frontend](#-logique-frontend)
- [Implémentation Mobile](#-implémentation-mobile)
- [Différences avec autres profils](#-différences-avec-autres-profils)

---

## 🎯 Vue d'ensemble

Le **profil Mélomane** est le profil le plus **simple** des 3 types d'utilisateurs. Il s'ouvre via un bouton dans le header et affiche une **modale avec un formulaire unique** (pas de sous-onglets).

### Rôle du Mélomane

Le mélomane est un **spectateur/fan de musique** qui :
- Découvre les événements musicaux sur la carte
- S'abonne à ses établissements favoris ("Connexions")
- Participe aux événements (concerts, bœufs)
- Reçoit des notifications d'événements proches de chez lui

### Positionnement dans le Dashboard

Le dashboard Mélomane contient **5 onglets** :

```
[Carte] [Mes Participations] [Établissements] [Connexions] [Paramètres]
  ↑ actif par défaut
```

**Accès au profil :** Bouton dans le **header** (pas un onglet du dashboard)

```
┌────────────────────────────────────────┐
│ [🎸] Jam Connexion                     │
│                                        │
│        [🏆] [🏅] [🔔] [👤 Mon Profil]  │ ← Clic ouvre modale
└────────────────────────────────────────┘
```

### Caractéristiques Importantes

⚠️ **SPÉCIFICITÉS** :
- **PAS d'abonnement payant** (totalement gratuit)
- **Profil minimaliste** : seulement 7 champs
- **Gestion du compte** : Suspendre (60 jours) ou Supprimer (définitif)
- **Notifications géolocalisées** basées sur un rayon en km

---

## 🏗️ Architecture Générale

### Structure Modale

```
┌────────────────────────────────────────────┐
│ Mon Profil Mélomane                  [X]   │
├────────────────────────────────────────────┤
│                                            │
│  📸 Photo de profil                        │
│  👤 Informations personnelles              │
│  🎵 Styles musicaux préférés               │
│  🔔 Notifications (rayon en km)            │
│  🚨 Gestion du compte                      │
│     - Suspendre (60 jours)                 │
│     - Supprimer (définitif)                │
│                                            │
│  [Sauvegarder]                             │
└────────────────────────────────────────────┘
```

### État du Formulaire

```javascript
const [profileForm, setProfileForm] = useState({
  // Identification
  pseudo: "",                      // String - Pseudo public
  bio: "",                         // String - Biographie courte
  profile_picture: "",             // String - URL image profil
  
  // Localisation
  city: "",                        // String - Ville
  postal_code: "",                 // String - Code postal
  region: "",                      // String - Région
  
  // Préférences
  favorite_styles: [],             // Array<string> - Styles musicaux préférés
  notifications_enabled: true,     // Boolean - Activer notifications
  notification_radius_km: 50       // Number - Rayon de notification (km)
});
```

---

## 📖 Section 1 : Informations de profil

### 📸 Champ 1 : Photo de profil

**Composant :** `MelomaneImageUpload`

```jsx
<Label>Photo de profil</Label>
<MelomaneImageUpload
  value={profileForm.profile_picture}
  onChange={(url) => setProfileForm({ ...profileForm, profile_picture: url })}
  token={token}
/>
```

**Comportement :**
- Upload vers `/api/upload/image` avec `folder: "melomanes"`
- Formats : PNG, JPG, WEBP
- Taille max : 5MB
- Preview circulaire après upload

---

### 👤 Champ 2 : Pseudo

```jsx
<Label>Pseudo</Label>
<Input
  value={profileForm.pseudo}
  onChange={(e) => setProfileForm({ ...profileForm, pseudo: e.target.value })}
  placeholder="Votre pseudo"
  required
/>
```

**Validation :**
- ✅ **Obligatoire**
- Longueur min : 2 caractères
- Longueur max : 50 caractères
- Visible publiquement dans les participations aux événements

---

### ✍️ Champ 3 : Bio

```jsx
<Label>Bio</Label>
<Textarea
  value={profileForm.bio}
  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
  placeholder="Parlez de vous, de vos goûts musicaux..."
  rows={3}
  maxLength={500}
/>
<p className="text-xs text-muted-foreground">
  {profileForm.bio.length}/500 caractères
</p>
```

**Validation :**
- Optionnel
- Max 500 caractères

---

### 📍 Champ 4 : Ville

**Composant :** `CityAutocomplete`

```jsx
<CityAutocomplete
  value={profileForm.city}
  onSelect={(cityData) => {
    setProfileForm({
      ...profileForm,
      city: cityData.city,
      postal_code: cityData.postalCode,
      region: cityData.region
    });
  }}
  label="Ville"
  placeholder="Ex: Paris"
/>
```

**Fonctionnement :**
- Autocomplétion via API Nominatim (OpenStreetMap)
- Renseigne automatiquement : `city`, `postal_code`, `region`
- Utilisé pour calculer les événements à proximité

**Retour API :**
```json
{
  "city": "Paris",
  "postalCode": "75001",
  "region": "Île-de-France"
}
```

---

### 🌍 Bouton : Géolocalisation automatique

```jsx
<Button
  onClick={async () => {
    if (!navigator.geolocation) {
      toast.error("Géolocalisation non supportée");
      return;
    }
    
    toast.info("Localisation en cours...");
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const cityData = await reverseGeocode(
          position.coords.latitude,
          position.coords.longitude
        );
        
        if (cityData) {
          setProfileForm({
            ...profileForm,
            city: cityData.city,
            postal_code: cityData.postalCode,
            region: cityData.region
          });
          toast.success(`📍 Localisé à ${cityData.city} !`);
        }
      },
      () => toast.error("Erreur de localisation")
    );
  }}
  variant="outline"
>
  📍 Ma position
</Button>
```

**Fonction `reverseGeocode` :**
```javascript
// Importer depuis CityAutocomplete
import { reverseGeocode } from "../components/CityAutocomplete";

// Utilisation
const cityData = await reverseGeocode(latitude, longitude);
// Retourne : { city, postalCode, region }
```

---

## 🎵 Section 2 : Préférences musicales

### Champ 5 : Styles musicaux préférés

**Liste complète :** Importée depuis `/app/frontend/src/data/music-styles.js`

```jsx
<Label>Styles musicaux préférés</Label>
<Select onValueChange={addToFavoriteStyles}>
  <SelectTrigger>
    <SelectValue placeholder="Sélectionnez un style" />
  </SelectTrigger>
  <SelectContent className="max-h-[300px]">
    {MUSIC_STYLES_LIST.map((style) => (
      <SelectItem key={style} value={style}>{style}</SelectItem>
    ))}
  </SelectContent>
</Select>

{/* Liste des styles sélectionnés */}
<div className="flex flex-wrap gap-2">
  {profileForm.favorite_styles.map((style, i) => (
    <span key={i} className="px-3 py-1 bg-primary/20 rounded-full text-sm flex items-center gap-1">
      {style}
      <button onClick={() => removeFromFavoriteStyles(style)}>
        <Trash2 className="w-3 h-3" />
      </button>
    </span>
  ))}
</div>
```

**Fonctions helpers :**

```javascript
const addToFavoriteStyles = (style) => {
  if (style && !profileForm.favorite_styles.includes(style)) {
    setProfileForm({
      ...profileForm,
      favorite_styles: [...profileForm.favorite_styles, style]
    });
  }
};

const removeFromFavoriteStyles = (style) => {
  setProfileForm({
    ...profileForm,
    favorite_styles: profileForm.favorite_styles.filter(s => s !== style)
  });
};
```

**Styles musicaux disponibles :** (Liste complète)
- Rock, Blues, Jazz, Funk, Soul, Reggae, Hip Hop, Électro, Pop, Folk, Metal, Punk, Country, Classique, World Music, etc.

---

## 🔔 Section 3 : Notifications

### Champ 6 : Rayon de notification

```jsx
<Label>Rayon de notification (km)</Label>
<Input
  type="number"
  value={profileForm.notification_radius_km}
  onChange={(e) => setProfileForm({
    ...profileForm,
    notification_radius_km: parseFloat(e.target.value)
  })}
  placeholder="50"
  min={1}
  max={200}
/>
<p className="text-xs text-muted-foreground">
  Vous serez notifié des événements dans un rayon de {profileForm.notification_radius_km} km autour de votre ville
</p>
```

**Validation :**
- Min : 1 km
- Max : 200 km
- Par défaut : 50 km

**Utilisation :**
- Le backend calcule la distance entre la ville du mélomane et les établissements
- Envoie une notification push si un événement correspondant aux styles préférés est créé dans le rayon

---

## 🚨 Section 4 : Gestion du compte

### Vue d'ensemble

```jsx
<div className="space-y-4 p-4 border-2 border-red-500/20 rounded-xl">
  <h4 className="font-medium text-red-400">Gestion du compte</h4>
  
  {/* Suspendre le compte */}
  <SuspendAccountDialog />
  
  {/* Supprimer le compte */}
  <DeleteAccountDialog />
</div>
```

---

### 🟠 Option 1 : Suspendre le compte (60 jours)

**Affichage :**

```jsx
<div className="flex items-start justify-between gap-4 p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
  <div>
    <p className="font-medium mb-1">Suspendre mon compte</p>
    <p className="text-xs text-muted-foreground">
      Suspendre temporairement pour 60 jours. Réactivation possible à tout moment.
    </p>
  </div>
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" size="sm" className="rounded-full border-orange-500/50 hover:bg-orange-500/20">
        <Clock className="w-4 h-4 mr-2" />
        Suspendre
      </Button>
    </DialogTrigger>
    <DialogContent>
      {/* Voir ci-dessous */}
    </DialogContent>
  </Dialog>
</div>
```

**Modale de confirmation :**

```jsx
<DialogContent className="glassmorphism border-white/10">
  <DialogHeader>
    <DialogTitle className="text-orange-400">Suspendre mon compte</DialogTitle>
  </DialogHeader>
  
  <div className="space-y-4">
    <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
      <h4 className="font-semibold mb-2">⚠️ Attention</h4>
      <ul className="text-sm space-y-2 text-muted-foreground">
        <li>• Compte suspendu pour 60 jours maximum</li>
        <li>• Profil non visible pendant cette période</li>
        <li>• Réactivation possible à tout moment</li>
      </ul>
    </div>
    
    <div className="flex gap-2 justify-end">
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full">Annuler</Button>
      </DialogTrigger>
      <Button
        className="bg-orange-500 hover:bg-orange-600 rounded-full"
        onClick={async () => {
          try {
            await axios.post(
              `${API}/account/suspend`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Compte suspendu pour 60 jours");
            setTimeout(() => logout(), 2000);
          } catch (error) {
            toast.error("Erreur lors de la suspension");
          }
        }}
      >
        Confirmer
      </Button>
    </div>
  </div>
</DialogContent>
```

**Comportement :**
- Endpoint : `POST /api/account/suspend`
- Le compte est désactivé pendant 60 jours
- L'utilisateur peut se reconnecter à tout moment pour réactiver le compte
- Toutes les données sont conservées

---

### 🔴 Option 2 : Supprimer le compte (définitif)

**Affichage :**

```jsx
<div className="flex items-start justify-between gap-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
  <div>
    <p className="font-medium mb-1">Supprimer mon compte</p>
    <p className="text-xs text-muted-foreground">
      Suppression définitive et irréversible de toutes vos données.
    </p>
  </div>
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" size="sm" className="rounded-full border-red-500/50 hover:bg-red-500/20">
        <Trash2 className="w-4 h-4 mr-2" />
        Supprimer
      </Button>
    </DialogTrigger>
    <DialogContent>
      {/* Voir ci-dessous */}
    </DialogContent>
  </Dialog>
</div>
```

**Modale de confirmation :**

```jsx
<DialogContent className="glassmorphism border-white/10">
  <DialogHeader>
    <DialogTitle className="text-red-400">Supprimer mon compte</DialogTitle>
  </DialogHeader>
  
  <div className="space-y-4">
    <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
      <h4 className="font-semibold mb-2">🚨 Action irréversible</h4>
      <ul className="text-sm space-y-2 text-muted-foreground">
        <li>• Toutes vos données seront supprimées</li>
        <li>• Vos participations seront perdues</li>
        <li>• Vos connexions seront effacées</li>
        <li>• Cette action ne peut pas être annulée</li>
      </ul>
    </div>
    
    <div className="flex gap-2 justify-end">
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full">Annuler</Button>
      </DialogTrigger>
      <Button
        className="bg-red-500 hover:bg-red-600 rounded-full"
        onClick={async () => {
          try {
            await axios.delete(
              `${API}/account/delete`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Compte supprimé définitivement");
            setTimeout(() => logout(), 2000);
          } catch (error) {
            toast.error("Erreur lors de la suppression");
          }
        }}
      >
        Confirmer la suppression
      </Button>
    </div>
  </div>
</DialogContent>
```

**Comportement :**
- Endpoint : `DELETE /api/account/delete`
- **Suppression immédiate et définitive** de toutes les données :
  - Profil mélomane
  - Participations aux événements
  - Connexions aux établissements
  - Notifications
- **Aucune récupération possible**
- Déconnexion automatique après 2 secondes

---

## 💾 Section 5 : Sauvegarde

### Bouton de sauvegarde

```jsx
<Button
  onClick={handleSaveProfile}
  className="w-full bg-primary hover:bg-primary/90 rounded-full"
  disabled={saving}
>
  {saving ? <Loader2 className="animate-spin" /> : "Sauvegarder"}
</Button>
```

### Fonction de sauvegarde

```javascript
const handleSaveProfile = async () => {
  // Validation
  if (!profileForm.pseudo || profileForm.pseudo.trim() === "") {
    toast.error("Le pseudo est obligatoire");
    return;
  }
  
  try {
    const method = profile ? "put" : "post";
    const endpoint = profile ? `${API}/melomanes/me` : `${API}/melomanes/`;
    
    // Normaliser l'URL de l'image
    const profileData = { ...profileForm };
    if (profileData.profile_picture) {
      let normalizedUrl = profileData.profile_picture;
      if (normalizedUrl.includes(process.env.REACT_APP_BACKEND_URL)) {
        normalizedUrl = normalizedUrl.replace(process.env.REACT_APP_BACKEND_URL, '');
      }
      normalizedUrl = normalizedUrl.replace(/\/api\/api\//, '/api/');
      if (!normalizedUrl.startsWith('/api/uploads')) {
        normalizedUrl = normalizedUrl.replace(/^\/?uploads\//, '/api/uploads/');
      }
      profileData.profile_picture = normalizedUrl;
    }
    
    const response = await axios[method](
      endpoint,
      profileData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    setProfile(response.data);
    
    // Mettre à jour le formulaire avec l'URL complète
    setProfileForm(prev => ({
      ...prev,
      profile_picture: buildImageUrl(response.data.profile_picture)
    }));
    
    toast.success("Profil mis à jour!");
    setEditingProfile(false);
    
  } catch (error) {
    console.error('Save error:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.detail || error.message || "Erreur lors de la sauvegarde";
    toast.error(errorMsg);
  }
};
```

---

## 🔗 API Endpoints

### 1. Récupérer le profil

**Endpoint :** `GET /api/melomanes/me`

**Headers :**
```
Authorization: Bearer {token}
```

**Réponse Success (200) :**
```json
{
  "id": "melomane_abc123",
  "user_id": "user_xyz789",
  "pseudo": "MusicLover42",
  "bio": "Passionné de jazz et de musiques du monde. Toujours à la recherche de nouveaux concerts !",
  "profile_picture": "/api/uploads/melomanes/profile_abc.jpg",
  "city": "Lyon",
  "postal_code": "69001",
  "region": "Auvergne-Rhône-Alpes",
  "favorite_styles": ["Jazz", "Blues", "World Music"],
  "notifications_enabled": true,
  "notification_radius_km": 50,
  "created_at": "2024-02-10T12:00:00Z",
  "updated_at": "2024-03-20T15:30:00Z"
}
```

**Erreur 404 :**
```json
{
  "detail": "Melomane profile not found"
}
```

---

### 2. Créer le profil

**Endpoint :** `POST /api/melomanes/`

**Headers :**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body :**
```json
{
  "pseudo": "MusicLover42",
  "bio": "Passionné de jazz...",
  "profile_picture": "/api/uploads/melomanes/profile_abc.jpg",
  "city": "Lyon",
  "postal_code": "69001",
  "region": "Auvergne-Rhône-Alpes",
  "favorite_styles": ["Jazz", "Blues"],
  "notifications_enabled": true,
  "notification_radius_km": 50
}
```

**Réponse Success (201) :**
```json
{
  "id": "melomane_abc123",
  "pseudo": "MusicLover42",
  // ... (même structure que GET)
}
```

---

### 3. Mettre à jour le profil

**Endpoint :** `PUT /api/melomanes/me`

**Headers :**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body :** (Même structure que POST)

**Réponse Success (200) :** (Même structure que GET)

---

### 4. Suspendre le compte

**Endpoint :** `POST /api/account/suspend`

**Headers :**
```
Authorization: Bearer {token}
```

**Body :** (vide)

**Réponse Success (200) :**
```json
{
  "message": "Account suspended for 60 days",
  "suspended_until": "2024-05-20T12:00:00Z"
}
```

---

### 5. Supprimer le compte

**Endpoint :** `DELETE /api/account/delete`

**Headers :**
```
Authorization: Bearer {token}
```

**Réponse Success (200) :**
```json
{
  "message": "Account deleted permanently"
}
```

---

### 6. Upload d'image

**Endpoint :** `POST /api/upload/image`

**Headers :**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (FormData) :**
```
file: <binary>
folder: "melomanes"
```

**Réponse Success (200) :**
```json
{
  "url": "/api/uploads/melomanes/abc123_timestamp.jpg",
  "filename": "abc123_timestamp.jpg"
}
```

---

## 🧠 Logique Frontend

### État Global

```javascript
const [profile, setProfile] = useState(null);          // Données profil
const [editingProfile, setEditingProfile] = useState(false);  // Modal ouverte/fermée
const [profileForm, setProfileForm] = useState({...}); // État formulaire
```

### Cycle de Vie

**1. Chargement Initial :**
```javascript
useEffect(() => {
  fetchProfile();
}, []);

const fetchProfile = async () => {
  try {
    const response = await axios.get(`${API}/melomanes/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setProfile(response.data);
    
    // Pré-remplir le formulaire
    setProfileForm({
      pseudo: response.data.pseudo || "",
      bio: response.data.bio || "",
      city: response.data.city || "",
      postal_code: response.data.postal_code || "",
      region: response.data.region || "",
      favorite_styles: response.data.favorite_styles || [],
      profile_picture: buildImageUrl(response.data.profile_picture),
      notifications_enabled: response.data.notifications_enabled ?? true,
      notification_radius_km: response.data.notification_radius_km || 50
    });
  } catch (error) {
    if (error.response?.status === 404) {
      // Nouveau mélomane : ouvrir le formulaire directement
      setEditingProfile(true);
    }
  }
};
```

**2. Ouverture Modale :**
```javascript
// Via le bouton dans le header
<Button onClick={() => setEditingProfile(true)}>
  <User /> Mon Profil
</Button>
```

**3. Modification Formulaire :**
```javascript
const handleFieldChange = (field, value) => {
  setProfileForm(prev => ({
    ...prev,
    [field]: value
  }));
};
```

**4. Sauvegarde :**
```javascript
// Voir Section 5 ci-dessus
```

---

## 📱 Implémentation Mobile

### Architecture React Native

**Composants suggérés :**

```
/screens
  /MelomaneDashboard
    MelomaneDashboardScreen.js   // Dashboard principal
    /modals
      ProfileModal.js             // Modal profil (formulaire complet)
```

### Modal Profil (ProfileModal.js)

```jsx
import { Modal, ScrollView, View, SafeAreaView } from 'react-native';
import { Input, Button, Switch, CheckBox, Avatar } from '@rneui/themed';
import { Picker } from '@react-native-picker/picker';

const ProfileModal = ({ visible, onClose, profile, onSave }) => {
  const [formData, setFormData] = useState({...profile});
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text h4>Mon Profil Mélomane</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="x" type="feather" />
          </TouchableOpacity>
        </View>
        
        {/* Form */}
        <ScrollView style={styles.form}>
          {/* Photo de profil */}
          <View style={styles.avatarContainer}>
            <Avatar
              size="xlarge"
              rounded
              source={{ uri: formData.profile_picture }}
              onPress={handleSelectImage}
            />
            <Button
              title="Changer la photo"
              type="clear"
              onPress={handleSelectImage}
            />
          </View>
          
          {/* Pseudo */}
          <Input
            label="Pseudo *"
            value={formData.pseudo}
            onChangeText={(text) => setFormData({...formData, pseudo: text})}
            placeholder="Votre pseudo"
          />
          
          {/* Bio */}
          <Input
            label="Bio"
            value={formData.bio}
            onChangeText={(text) => setFormData({...formData, bio: text})}
            placeholder="Parlez de vous..."
            multiline
            numberOfLines={3}
          />
          
          {/* Ville */}
          <CityAutocompleteField
            value={formData.city}
            onSelect={(cityData) => {
              setFormData({
                ...formData,
                city: cityData.city,
                postal_code: cityData.postalCode,
                region: cityData.region
              });
            }}
          />
          
          {/* Styles musicaux préférés */}
          <Text style={styles.label}>Styles musicaux préférés</Text>
          <Picker
            selectedValue={""}
            onValueChange={(style) => addFavoriteStyle(style)}
          >
            <Picker.Item label="Sélectionnez un style" value="" />
            {MUSIC_STYLES_LIST.map(style => (
              <Picker.Item key={style} label={style} value={style} />
            ))}
          </Picker>
          
          {/* Liste des styles sélectionnés */}
          <View style={styles.chipContainer}>
            {formData.favorite_styles.map((style, i) => (
              <Chip
                key={i}
                title={style}
                onPress={() => removeFavoriteStyle(style)}
                icon={{ name: 'close', type: 'material' }}
              />
            ))}
          </View>
          
          {/* Rayon de notification */}
          <Input
            label="Rayon de notification (km)"
            value={String(formData.notification_radius_km)}
            onChangeText={(text) => setFormData({...formData, notification_radius_km: parseFloat(text)})}
            keyboardType="numeric"
          />
          
          {/* Gestion du compte */}
          <View style={styles.dangerZone}>
            <Text h5 style={styles.dangerTitle}>Gestion du compte</Text>
            
            {/* Suspendre */}
            <Button
              title="Suspendre le compte (60 jours)"
              type="outline"
              buttonStyle={styles.suspendButton}
              onPress={handleSuspend}
            />
            
            {/* Supprimer */}
            <Button
              title="Supprimer le compte (définitif)"
              type="outline"
              buttonStyle={styles.deleteButton}
              onPress={handleDelete}
            />
          </View>
          
          {/* Bouton Sauvegarder */}
          <Button
            title="Sauvegarder"
            onPress={() => onSave(formData)}
            containerStyle={styles.saveButton}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
```

---

## ⚠️ Différences avec autres profils

### Vs. Profil Musicien

| Caractéristique | Mélomane | Musicien |
|-----------------|----------|----------|
| **Structure** | Modale simple | Modale avec 6 sous-onglets |
| **Complexité** | Minimale (7 champs) | Élevée (~30 champs) |
| **Images** | 1 (profil) | 1 (profil) |
| **Localisation** | Ville uniquement | Ville + département + région |
| **Groupes** | Non applicable | Gestion groupes |
| **Instruments** | Non applicable | Liste instruments joués |
| **Concerts** | Non applicable | Concerts passés/futurs |
| **Gestion compte** | ✅ Suspendre/Supprimer | Non |

### Vs. Profil Établissement

| Caractéristique | Mélomane | Établissement |
|-----------------|----------|---------------|
| **Champs** | 7 champs | ~25 champs |
| **Complexité** | Minimale | Élevée |
| **Images** | 1 (profil) | 2 (profil + couverture) |
| **Localisation** | Ville uniquement | Adresse complète + GPS |
| **Coordonnées GPS** | Non | Oui (obligatoire) |
| **Équipements** | Non applicable | Scène, sono, lumières |
| **Abonnement** | Gratuit | Payant (12,99€/mois) |
| **Gestion compte** | ✅ Suspendre/Supprimer | Non |

---

## 🚨 Points d'Attention pour l'App Mobile

### 1. Simplicité

Le profil mélomane doit rester **ultra-simple** :
- Pas de fonctionnalités avancées
- Formulaire court (scrollable en une page)
- Validation minimale (seul le pseudo est obligatoire)

### 2. Géolocalisation

Contrairement à l'établissement, le mélomane **n'a pas besoin de coordonnées GPS** :
- Seule la **ville** est utilisée
- Le backend calcule la distance entre la ville du mélomane et les établissements
- Utiliser `CityAutocomplete` + bouton "Ma position" pour faciliter la saisie

### 3. Notifications

Le rayon de notification (`notification_radius_km`) est crucial :
- Utilisé par le backend pour envoyer des **notifications push géolocalisées**
- Afficher une prévisualisation sur une carte (optionnel)
- Valeurs recommandées : 20 km (ville), 50 km (région), 100 km (large)

### 4. Gestion du compte

**Suspendre vs Supprimer** :

| Action | Durée | Réversible | Données |
|--------|-------|------------|----------|
| **Suspendre** | 60 jours max | ✅ Oui | Conservées |
| **Supprimer** | Définitif | ❌ Non | Effacées |

**Implémentation React Native :**
```javascript
import { Alert } from 'react-native';

const handleSuspend = () => {
  Alert.alert(
    "Suspendre mon compte",
    "Votre compte sera suspendu pour 60 jours. Vous pourrez le réactiver à tout moment en vous reconnectant.",
    [
      { text: "Annuler", style: "cancel" },
      {
        text: "Suspendre",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.post(
              `${API_URL}/api/account/suspend`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.show("Compte suspendu");
            logout();
          } catch (error) {
            toast.show("Erreur");
          }
        }
      }
    ]
  );
};

const handleDelete = () => {
  Alert.alert(
    "Supprimer mon compte",
    "⚠️ Cette action est IRRÉVERSIBLE. Toutes vos données seront supprimées définitivement.",
    [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer définitivement",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(
              `${API_URL}/api/account/delete`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.show("Compte supprimé");
            logout();
          } catch (error) {
            toast.show("Erreur");
          }
        }
      }
    ]
  );
};
```

### 5. Upload d'Image

**Implémentation React Native :**
```javascript
import * as ImagePicker from 'expo-image-picker';

const handleSelectImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (status !== 'granted') {
    Alert.alert('Permission requise', 'Autorisation d\'accès aux photos nécessaire');
    return;
  }
  
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8
  });
  
  if (!result.canceled) {
    const imageUrl = await uploadImage(result.assets[0].uri);
    setFormData({ ...formData, profile_picture: imageUrl });
  }
};

const uploadImage = async (imageUri) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'melomane_profile.jpg'
  });
  formData.append('folder', 'melomanes');
  
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
  
  return response.data.url;
};
```

---

## ✅ Checklist d'Implémentation

### Phase 1 : Modal Profil
- [ ] Créer `ProfileModal.js`
- [ ] Intégrer upload d'image (profil)
- [ ] Ajouter les 7 champs du formulaire
- [ ] Implémenter `CityAutocomplete` avec bouton géolocalisation
- [ ] Gérer la liste des styles musicaux préférés

### Phase 2 : Gestion du Compte
- [ ] Implémenter le dialogue "Suspendre le compte"
- [ ] Implémenter le dialogue "Supprimer le compte"
- [ ] Ajouter les confirmations avec Alert natif
- [ ] Gérer la déconnexion après suspension/suppression

### Phase 3 : Backend
- [ ] Endpoint `GET /api/melomanes/me`
- [ ] Endpoint `POST /api/melomanes/`
- [ ] Endpoint `PUT /api/melomanes/me`
- [ ] Endpoint `POST /api/account/suspend`
- [ ] Endpoint `DELETE /api/account/delete`
- [ ] Endpoint `POST /api/upload/image`

### Phase 4 : Tests
- [ ] Tester création d'un nouveau profil
- [ ] Tester modification d'un profil existant
- [ ] Tester upload d'image
- [ ] Tester géolocalisation automatique
- [ ] Tester ajout/suppression de styles musicaux
- [ ] Tester suspension du compte
- [ ] Tester suppression définitive du compte

---

## 📞 Support

Pour toute question sur l'implémentation de ce profil Mélomane dans l'app mobile, référez-vous également aux documents suivants :

- `README_PROFILE_MUSICIAN.md` (structure similaire)
- `README_PROFILE_VENUE.md` (comparaison)
- `README_UPLOADS.md` (système d'upload d'images)
- `INDEX_MOBILE.md` (architecture globale)

---

**Dernière mise à jour :** 2026-03-27
**Version :** 1.0
**Contact :** Équipe Backend Jam Connexion
