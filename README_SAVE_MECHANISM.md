# 💾 Mécanisme de Sauvegarde - Jam Connexion

<div align="center">

**Guide Complet du Système de Sauvegarde**

Comment fonctionne la sauvegarde des données de l'inscription au profil

</div>

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Architecture du Flow de Sauvegarde](#-architecture-du-flow-de-sauvegarde)
- [Étapes Détaillées](#-étapes-détaillées)
- [Exemples par Type d'Entité](#-exemples-par-type-dentité)
- [Gestion des Erreurs](#-gestion-des-erreurs)
- [Validations](#-validations)
- [Normalisation des Données](#-normalisation-des-données)
- [Implémentation Mobile](#-implémentation-mobile)

---

## 🎯 Vue d'ensemble

### Principe Général

Lorsqu'un utilisateur clique sur un bouton "Sauvegarder", voici ce qui se passe :

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Frontend   │ ───▶ │  Validation │ ───▶ │   Backend   │ ───▶ │   MongoDB   │
│  (Formulaire)│      │   Locale    │      │    (API)    │      │   Atlas     │
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
      │                                            │                     │
      │                                            │                     │
      ▼                                            ▼                     ▼
┌─────────────┐                            ┌─────────────┐      ┌─────────────┐
│   Toast     │                            │  Validation │      │   Stockage  │
│  Feedback   │                            │   Backend   │      │  Permanent  │
└─────────────┘                            └─────────────┘      └─────────────┘
```

### Types de Sauvegarde

| Type | Méthode HTTP | Quand ? |
|------|--------------|---------|
| **Création** | `POST` | Nouveau profil/événement |
| **Modification** | `PUT` | Profil/événement existant |
| **Suppression** | `DELETE` | Supprimer une donnée |

---

## 🏗️ Architecture du Flow de Sauvegarde

### Schéma Complet

```
1️⃣ UTILISATEUR clique sur "Sauvegarder"
    ↓
2️⃣ FRONTEND collecte les données du formulaire
    ↓
3️⃣ VALIDATION LOCALE (JavaScript)
    ├─ ✅ Champs obligatoires remplis ?
    ├─ ✅ Format email valide ?
    ├─ ✅ Longueur min/max respectée ?
    └─ ❌ Si erreur → Toast rouge + arrêt
    ↓
4️⃣ NORMALISATION des données
    ├─ Nettoyer les URLs d'images
    ├─ Formater les dates
    └─ Supprimer les espaces inutiles
    ↓
5️⃣ APPEL API (Axios)
    ├─ POST /api/entity (création)
    └─ PUT /api/entity/id (modification)
    ↓
6️⃣ BACKEND reçoit la requête
    ├─ Vérification du token JWT
    ├─ Validation Pydantic (schéma)
    └─ Vérification des permissions
    ↓
7️⃣ MONGODB Atlas
    ├─ Insertion (insert_one)
    └─ Mise à jour (update_one)
    ↓
8️⃣ RÉPONSE au Frontend
    ├─ ✅ 200/201 : Succès
    └─ ❌ 400/500 : Erreur
    ↓
9️⃣ FEEDBACK UTILISATEUR
    ├─ ✅ Toast vert "Profil mis à jour !"
    └─ ❌ Toast rouge "Erreur..."
    ↓
🔟 MISE À JOUR de l'interface
    ├─ Fermeture de la modale
    ├─ Rafraîchissement des données
    └─ Mise à jour du state React
```

---

## 📖 Étapes Détaillées

### Étape 1 : Collecte des Données du Formulaire

**État React (State) :**

```javascript
const [formData, setFormData] = useState({
  name: "",
  email: "",
  city: "",
  // ... autres champs
});

// Mise à jour du state à chaque changement
const handleChange = (field, value) => {
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));
};
```

**Exemple d'Input lié au state :**

```jsx
<Input
  value={formData.name}
  onChange={(e) => handleChange('name', e.target.value)}
  placeholder="Nom"
/>
```

---

### Étape 2 : Validation Locale (Frontend)

**Fonction de validation :**

```javascript
const validateForm = () => {
  const errors = [];
  
  // Validation : Nom obligatoire
  if (!formData.name || formData.name.trim() === "") {
    errors.push("Le nom est obligatoire");
  }
  
  // Validation : Email format
  if (formData.email && !isValidEmail(formData.email)) {
    errors.push("Format email invalide");
  }
  
  // Validation : Longueur minimum
  if (formData.name && formData.name.length < 2) {
    errors.push("Le nom doit contenir au moins 2 caractères");
  }
  
  return errors;
};

// Fonction helper pour valider un email
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};
```

---

### Étape 3 : Normalisation des Données

**Objectif :** Nettoyer et formater les données avant envoi au backend.

```javascript
const normalizeData = (data) => {
  const normalized = { ...data };
  
  // 1. Nettoyer les URLs d'images
  if (normalized.profile_image) {
    // Retirer le domaine si présent
    normalized.profile_image = normalized.profile_image
      .replace(process.env.REACT_APP_BACKEND_URL, '')
      .replace(/\/api\/api\//, '/api/');
    
    // S'assurer que le chemin commence par /api/uploads
    if (!normalized.profile_image.startsWith('/api/uploads')) {
      normalized.profile_image = normalized.profile_image.replace(
        /^\/?uploads\//, 
        '/api/uploads/'
      );
    }
  }
  
  // 2. Supprimer les espaces inutiles
  if (normalized.name) {
    normalized.name = normalized.name.trim();
  }
  
  // 3. Formater les dates (si nécessaire)
  if (normalized.date) {
    // Convertir au format ISO
    normalized.date = new Date(normalized.date).toISOString();
  }
  
  return normalized;
};
```

---

### Étape 4 : Appel API

**Fonction de sauvegarde complète :**

```javascript
const handleSave = async () => {
  // 1. Validation locale
  const errors = validateForm();
  if (errors.length > 0) {
    errors.forEach(error => toast.error(error));
    return;
  }
  
  // 2. Activer le loader
  setSaving(true);
  
  try {
    // 3. Normaliser les données
    const normalizedData = normalizeData(formData);
    
    // 4. Déterminer la méthode HTTP
    const method = isEditing ? 'put' : 'post';
    const endpoint = isEditing 
      ? `${API}/venues/me` 
      : `${API}/venues/`;
    
    // 5. Appel API avec Axios
    const response = await axios[method](
      endpoint,
      normalizedData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // 6. Mise à jour du state avec les données retournées
    setProfile(response.data);
    
    // 7. Feedback utilisateur
    toast.success("✅ Profil mis à jour avec succès !");
    
    // 8. Fermer la modale
    setEditing(false);
    
    // 9. Rafraîchir les données (optionnel)
    fetchProfile();
    
  } catch (error) {
    // Gestion des erreurs (voir section dédiée)
    console.error('Save error:', error);
    
    const errorMsg = error.response?.data?.detail 
      || error.message 
      || "Erreur lors de la sauvegarde";
    
    toast.error(`❌ ${errorMsg}`);
  } finally {
    // 10. Désactiver le loader
    setSaving(false);
  }
};
```

---

### Étape 5 : Backend (FastAPI)

**Route de sauvegarde (exemple Profil Établissement) :**

```python
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional, List
import os

router = APIRouter()

# Schéma de validation Pydantic
class VenueUpdate(BaseModel):
    name: str
    description: Optional[str] = None
    city: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    phone: Optional[str] = None
    email: Optional[str] = None
    music_styles: List[str] = []
    has_stage: bool = False
    # ... autres champs

# Route PUT - Mise à jour du profil
@router.put("/venues/me")
async def update_venue_profile(
    venue_data: VenueUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    # 1. Vérifier que l'utilisateur est un établissement
    if current_user.get("account_type") != "venue":
        raise HTTPException(status_code=403, detail="Not a venue account")
    
    # 2. Validation backend
    if not venue_data.name or len(venue_data.name) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
    
    if not venue_data.address and not venue_data.city:
        raise HTTPException(status_code=400, detail="Address or city is required")
    
    # 3. Préparer les données pour MongoDB
    venue_dict = venue_data.dict(exclude_unset=True)
    venue_dict["updated_at"] = datetime.now(timezone.utc)
    
    # 4. Mise à jour dans MongoDB
    result = await db.venues.update_one(
        {"user_id": current_user["id"]},
        {"$set": venue_dict}
    )
    
    # 5. Vérifier que la mise à jour a réussi
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # 6. Récupérer le profil mis à jour
    updated_venue = await db.venues.find_one(
        {"user_id": current_user["id"]},
        {"_id": 0}  # Exclure le champ _id de MongoDB
    )
    
    # 7. Retourner le profil complet
    return updated_venue
```

---

### Étape 6 : MongoDB Atlas

**Opération de mise à jour :**

```javascript
// MongoDB Query (simplifié)
db.venues.update_one(
  { user_id: "user_abc123" },  // Filtre : trouver le document
  {
    $set: {                     // Mise à jour des champs
      name: "Le Jazz Club",
      city: "Lyon",
      latitude: 45.767,
      longitude: 4.834,
      updated_at: ISODate("2024-03-27T10:30:00Z")
    }
  }
)
```

**Résultat :**
```json
{
  "matched_count": 1,
  "modified_count": 1,
  "upserted_id": null
}
```

---

## 📚 Exemples par Type d'Entité

### 1. Profil Musicien

**Frontend - Fonction de sauvegarde :**

```javascript
const handleSaveMusician = async () => {
  // Validation
  if (!profileForm.pseudo || profileForm.pseudo.trim() === "") {
    toast.error("Le pseudo est obligatoire");
    return;
  }
  
  setSaving(true);
  
  try {
    const method = profile ? 'put' : 'post';
    const endpoint = profile 
      ? `${API}/musicians/me` 
      : `${API}/musicians/`;
    
    // Normalisation
    const musicianData = { ...profileForm };
    
    if (musicianData.profile_image) {
      musicianData.profile_image = musicianData.profile_image
        .replace(process.env.REACT_APP_BACKEND_URL, '');
    }
    
    // Appel API
    const response = await axios[method](
      endpoint,
      musicianData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    setProfile(response.data);
    toast.success("Profil sauvegardé !");
    setEditing(false);
    
  } catch (error) {
    toast.error(error.response?.data?.detail || "Erreur");
  } finally {
    setSaving(false);
  }
};
```

**Backend - Route :**

```python
@router.put("/musicians/me")
async def update_musician(
    data: MusicianUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    if current_user.get("account_type") != "musician":
        raise HTTPException(status_code=403, detail="Not a musician")
    
    # Validation
    if not data.pseudo or len(data.pseudo) < 2:
        raise HTTPException(status_code=400, detail="Pseudo required")
    
    # Mise à jour
    musician_dict = data.dict(exclude_unset=True)
    musician_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.musicians.update_one(
        {"user_id": current_user["id"]},
        {"$set": musician_dict}
    )
    
    # Retour
    updated = await db.musicians.find_one(
        {"user_id": current_user["id"]},
        {"_id": 0}
    )
    
    return updated
```

---

### 2. Profil Mélomane

**Frontend - Fonction de sauvegarde :**

```javascript
const handleSaveMelomane = async () => {
  // Validation
  if (!profileForm.pseudo || profileForm.pseudo.trim() === "") {
    toast.error("Le pseudo est obligatoire");
    return;
  }
  
  try {
    const method = profile ? "put" : "post";
    const endpoint = profile 
      ? `${API}/melomanes/me` 
      : `${API}/melomanes/`;
    
    // Normalisation
    const melomaneData = { ...profileForm };
    
    if (melomaneData.profile_picture) {
      let normalizedUrl = melomaneData.profile_picture;
      if (normalizedUrl.includes(process.env.REACT_APP_BACKEND_URL)) {
        normalizedUrl = normalizedUrl.replace(
          process.env.REACT_APP_BACKEND_URL, 
          ''
        );
      }
      normalizedUrl = normalizedUrl.replace(/\/api\/api\//, '/api/');
      if (!normalizedUrl.startsWith('/api/uploads')) {
        normalizedUrl = normalizedUrl.replace(
          /^\/?uploads\//, 
          '/api/uploads/'
        );
      }
      melomaneData.profile_picture = normalizedUrl;
    }
    
    const response = await axios[method](
      endpoint,
      melomaneData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    setProfile(response.data);
    
    // Mettre à jour le formulaire avec l'URL complète retournée
    setProfileForm(prev => ({
      ...prev,
      profile_picture: buildImageUrl(response.data.profile_picture)
    }));
    
    toast.success("Profil mis à jour!");
    setEditingProfile(false);
    
  } catch (error) {
    console.error('Save error:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.detail 
      || error.message 
      || "Erreur lors de la sauvegarde";
    toast.error(errorMsg);
  }
};
```

---

### 3. Événement (Concert)

**Frontend - Création d'un concert :**

```javascript
const handleCreateConcert = async () => {
  // Validation
  if (!concertForm.date || !concertForm.start_time) {
    toast.error("Date et heure de début obligatoires");
    return;
  }
  
  if (concertForm.bands.length === 0) {
    toast.error("Ajoutez au moins un groupe");
    return;
  }
  
  try {
    const response = await axios.post(
      `${API}/concerts`,
      concertForm,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Ajouter le concert à la liste locale
    setConcerts(prev => [...prev, response.data]);
    
    toast.success("Concert créé !");
    setShowConcertDialog(false);
    
    // Réinitialiser le formulaire
    setConcertForm({
      date: "",
      start_time: "",
      end_time: "",
      title: "",
      description: "",
      bands: [],
      price: "",
      music_styles: []
    });
    
  } catch (error) {
    toast.error("Erreur lors de la création");
  }
};
```

**Backend - Route création concert :**

```python
@router.post("/concerts")
async def create_concert(
    concert: ConcertCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    # Vérifier que l'utilisateur est un établissement
    if current_user.get("account_type") != "venue":
        raise HTTPException(status_code=403, detail="Only venues can create concerts")
    
    # Validation
    if not concert.date or not concert.start_time:
        raise HTTPException(status_code=400, detail="Date and time required")
    
    # Créer le document
    concert_dict = concert.dict()
    concert_dict["id"] = str(uuid4())
    concert_dict["venue_id"] = current_user["id"]
    concert_dict["created_at"] = datetime.now(timezone.utc)
    concert_dict["updated_at"] = datetime.now(timezone.utc)
    
    # Insérer dans MongoDB
    await db.concerts.insert_one(concert_dict)
    
    # Retourner sans le _id de MongoDB
    concert_dict.pop("_id", None)
    
    return concert_dict
```

---

### 4. Groupe Musical (Band)

**Frontend - Création d'un groupe :**

```javascript
const handleCreateBand = async () => {
  // Validation
  if (!bandForm.name || bandForm.name.trim() === "") {
    toast.error("Le nom du groupe est obligatoire");
    return;
  }
  
  try {
    const response = await axios.post(
      `${API}/bands`,
      {
        name: bandForm.name,
        members_count: bandForm.members_count,
        music_styles: bandForm.music_styles,
        description: bandForm.description,
        city: bandForm.city,
        region: bandForm.region
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Ajouter à la liste locale
    setBands(prev => [...prev, response.data]);
    
    toast.success("Groupe créé !");
    setShowBandDialog(false);
    
    // Réinitialiser
    setBandForm({
      name: "",
      members_count: 0,
      music_styles: [],
      description: ""
    });
    
  } catch (error) {
    toast.error(error.response?.data?.detail || "Erreur");
  }
};
```

---

## ⚠️ Gestion des Erreurs

### Types d'Erreurs

| Code | Type | Signification | Action Frontend |
|------|------|---------------|-----------------|
| **400** | Bad Request | Validation échouée | Toast rouge avec détail |
| **401** | Unauthorized | Token invalide/expiré | Redirection vers login |
| **403** | Forbidden | Pas les permissions | Toast "Accès refusé" |
| **404** | Not Found | Ressource inexistante | Toast "Non trouvé" |
| **500** | Server Error | Erreur serveur | Toast "Erreur serveur" |

### Gestion Frontend

```javascript
try {
  const response = await axios.put(
    `${API}/venues/me`,
    data,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  toast.success("✅ Sauvegarde réussie");
  
} catch (error) {
  console.error('Save error:', error);
  
  // Erreur 401 : Token expiré
  if (error.response?.status === 401) {
    toast.error("Session expirée. Reconnexion...");
    logout();
    return;
  }
  
  // Erreur 403 : Pas les permissions
  if (error.response?.status === 403) {
    toast.error("Vous n'avez pas les permissions");
    return;
  }
  
  // Erreur 400 : Validation backend
  if (error.response?.status === 400) {
    const detail = error.response?.data?.detail;
    toast.error(`❌ ${detail}`);
    return;
  }
  
  // Erreur réseau
  if (!error.response) {
    toast.error("❌ Erreur de connexion. Vérifiez votre réseau.");
    return;
  }
  
  // Erreur générique
  toast.error("❌ Une erreur est survenue");
}
```

### Gestion Backend

```python
from fastapi import HTTPException

try:
    # Opération de sauvegarde
    result = await db.collection.update_one(...)
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=404, 
            detail="Resource not found"
        )
    
except Exception as e:
    # Logger l'erreur
    logger.error(f"Save error: {str(e)}")
    
    # Retourner une erreur 500
    raise HTTPException(
        status_code=500,
        detail="Internal server error"
    )
```

---

## ✅ Validations

### Frontend (JavaScript)

**Validations courantes :**

```javascript
// 1. Champ obligatoire
if (!formData.name || formData.name.trim() === "") {
  errors.push("Le nom est obligatoire");
}

// 2. Longueur minimum
if (formData.name && formData.name.length < 2) {
  errors.push("Le nom doit contenir au moins 2 caractères");
}

// 3. Longueur maximum
if (formData.description && formData.description.length > 1000) {
  errors.push("La description ne peut pas dépasser 1000 caractères");
}

// 4. Format email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (formData.email && !emailRegex.test(formData.email)) {
  errors.push("Format email invalide");
}

// 5. Format URL
const urlRegex = /^https?:\/\/.+/;
if (formData.website && !urlRegex.test(formData.website)) {
  errors.push("Format URL invalide (doit commencer par http:// ou https://)");
}

// 6. Nombre positif
if (formData.capacity && formData.capacity < 0) {
  errors.push("La capacité ne peut pas être négative");
}

// 7. Date future
if (formData.date && new Date(formData.date) < new Date()) {
  errors.push("La date doit être dans le futur");
}

// 8. Tableau non vide
if (formData.music_styles.length === 0) {
  errors.push("Sélectionnez au moins un style musical");
}
```

### Backend (Python/Pydantic)

**Schéma de validation Pydantic :**

```python
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

class VenueUpdate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    city: str = Field(..., min_length=2)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    capacity: Optional[int] = Field(None, ge=0)
    music_styles: List[str] = []
    
    @validator('name')
    def name_not_empty(cls, v):
        if not v or v.strip() == "":
            raise ValueError('Name cannot be empty')
        return v.strip()
    
    @validator('latitude', 'longitude')
    def coordinates_valid(cls, v, field):
        if v == 0:
            raise ValueError(f'{field.name} cannot be zero')
        return v
    
    @validator('music_styles')
    def styles_valid(cls, v):
        valid_styles = ["Rock", "Jazz", "Blues", "Pop", ...]
        for style in v:
            if style not in valid_styles:
                raise ValueError(f'Invalid music style: {style}')
        return v
```

---

## 🔄 Normalisation des Données

### Problème : URLs d'Images

**Contexte :**
- Les images uploadées retournent une URL relative : `/api/uploads/venues/abc.jpg`
- Le frontend construit l'URL complète : `https://jamconnexion.com/api/uploads/venues/abc.jpg`
- Avant de sauvegarder, il faut **retirer le domaine** pour ne garder que le chemin relatif

**Solution - Fonction de normalisation :**

```javascript
const normalizeImageUrl = (url) => {
  if (!url) return url;
  
  // 1. Retirer le domaine du backend
  let normalized = url.replace(process.env.REACT_APP_BACKEND_URL, '');
  
  // 2. Corriger les doubles /api/api/
  normalized = normalized.replace(/\/api\/api\//, '/api/');
  
  // 3. S'assurer que le chemin commence par /api/uploads
  if (!normalized.startsWith('/api/uploads')) {
    normalized = normalized.replace(/^\/?uploads\//, '/api/uploads/');
  }
  
  return normalized;
};

// Utilisation
const profileData = {
  ...formData,
  profile_image: normalizeImageUrl(formData.profile_image),
  cover_image: normalizeImageUrl(formData.cover_image)
};
```

### Problème : Dates et Heures

**Contexte :**
- Les inputs `<input type="date">` retournent `"2024-03-27"`
- MongoDB attend un format ISO : `"2024-03-27T10:30:00Z"`

**Solution :**

```javascript
const normalizeDatetime = (date, time) => {
  if (!date) return null;
  
  // Combiner date + heure
  const dateTime = time 
    ? `${date}T${time}:00` 
    : `${date}T00:00:00`;
  
  // Convertir en ISO
  return new Date(dateTime).toISOString();
};

// Utilisation
const eventData = {
  ...formData,
  datetime: normalizeDatetime(formData.date, formData.start_time)
};
```

### Problème : Espaces Inutiles

```javascript
const trimFields = (data) => {
  const trimmed = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      trimmed[key] = value.trim();
    } else {
      trimmed[key] = value;
    }
  }
  
  return trimmed;
};
```

---

## 🎨 Feedback Utilisateur (Toasts)

### Bibliothèque : Sonner

```javascript
import { toast } from "sonner";

// Succès
toast.success("✅ Profil sauvegardé avec succès !");

// Erreur
toast.error("❌ Erreur lors de la sauvegarde");

// Info
toast.info("ℹ️ Sauvegarde en cours...");

// Avertissement
toast.warning("⚠️ Certains champs sont incomplets");

// Toast personnalisé
toast("💾 Sauvegarde automatique", {
  description: "Vos modifications ont été sauvegardées",
  duration: 3000
});
```

### Bonnes Pratiques

```javascript
// ✅ BON : Message clair et actionnable
toast.error("Le nom de l'établissement est obligatoire");

// ❌ MAUVAIS : Message vague
toast.error("Erreur");

// ✅ BON : Toast avec détail technique si besoin
toast.error(`Erreur: ${error.response?.data?.detail || 'Inconnue'}`);
```

---

## 📱 Implémentation Mobile (React Native)

### Sauvegarde avec Axios

```javascript
import axios from 'axios';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://jamconnexion.com/api';

const saveProfile = async (formData) => {
  try {
    // 1. Récupérer le token
    const token = await AsyncStorage.getItem('auth_token');
    
    if (!token) {
      Alert.alert('Erreur', 'Session expirée');
      return false;
    }
    
    // 2. Validation locale
    if (!formData.name || formData.name.trim() === '') {
      Alert.alert('Erreur', 'Le nom est obligatoire');
      return false;
    }
    
    // 3. Normalisation
    const normalizedData = {
      ...formData,
      name: formData.name.trim()
    };
    
    // 4. Appel API
    const response = await axios.put(
      `${API_URL}/venues/me`,
      normalizedData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // 5. Succès
    Alert.alert('Succès', 'Profil sauvegardé !');
    return response.data;
    
  } catch (error) {
    console.error('Save error:', error);
    
    // 6. Gestion des erreurs
    if (error.response?.status === 401) {
      Alert.alert('Session expirée', 'Veuillez vous reconnecter');
      // Navigation vers login
      return false;
    }
    
    const errorMsg = error.response?.data?.detail 
      || 'Erreur lors de la sauvegarde';
    
    Alert.alert('Erreur', errorMsg);
    return false;
  }
};

// Utilisation dans un composant
const ProfileScreen = () => {
  const [formData, setFormData] = useState({...});
  const [saving, setSaving] = useState(false);
  
  const handleSave = async () => {
    setSaving(true);
    const result = await saveProfile(formData);
    setSaving(false);
    
    if (result) {
      // Retour à l'écran précédent
      navigation.goBack();
    }
  };
  
  return (
    <View>
      {/* ... formulaire ... */}
      <Button
        title={saving ? "Sauvegarde..." : "Sauvegarder"}
        onPress={handleSave}
        disabled={saving}
      />
    </View>
  );
};
```

---

## 🔒 Sécurité

### Token JWT

**Stockage Frontend :**

```javascript
// Web : localStorage
localStorage.setItem('token', token);
const token = localStorage.getItem('token');

// Mobile : AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.setItem('auth_token', token);
const token = await AsyncStorage.getItem('auth_token');
```

**Utilisation dans les requêtes :**

```javascript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

await axios.put(endpoint, data, { headers });
```

### Vérification Backend

```python
from fastapi import Depends, HTTPException
from jose import jwt, JWTError

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        # Décoder le token JWT
        payload = jwt.decode(
            token, 
            SECRET_KEY, 
            algorithms=[ALGORITHM]
        )
        
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401)
        
        # Récupérer l'utilisateur
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401)
        
        return user
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

---

## 📊 Résumé - Checklist de Sauvegarde

### Frontend

- [ ] Collecter les données du formulaire (state React)
- [ ] Valider les champs obligatoires
- [ ] Valider les formats (email, URL, etc.)
- [ ] Normaliser les données (URLs, dates, espaces)
- [ ] Activer un loader (state `saving`)
- [ ] Appeler l'API avec Axios (POST ou PUT)
- [ ] Gérer les erreurs (try/catch)
- [ ] Afficher un toast de feedback
- [ ] Mettre à jour le state local
- [ ] Fermer la modale/formulaire
- [ ] Désactiver le loader

### Backend

- [ ] Vérifier le token JWT (authentication)
- [ ] Vérifier les permissions (authorization)
- [ ] Valider le schéma Pydantic
- [ ] Effectuer des validations métier supplémentaires
- [ ] Préparer les données pour MongoDB
- [ ] Ajouter `updated_at` (timestamp)
- [ ] Exécuter la requête MongoDB (insert_one/update_one)
- [ ] Vérifier le résultat de l'opération
- [ ] Retourner le document complet (sans `_id`)
- [ ] Logger les erreurs si besoin

---

## 🎯 Exemple Complet : Sauvegarde d'un Profil Établissement

### Fichier Frontend : `/app/frontend/src/pages/VenueDashboard.jsx`

```javascript
const handleSaveProfile = async () => {
  // ✅ ÉTAPE 1 : Validation locale
  if (!formData.name || formData.name.trim() === "") {
    toast.error("Le nom de l'établissement est obligatoire");
    return;
  }
  
  if (!formData.address && !formData.city) {
    toast.error("Veuillez renseigner au moins une adresse ou une ville");
    return;
  }
  
  // ✅ ÉTAPE 2 : Activer le loader
  setSaving(true);
  
  try {
    // ✅ ÉTAPE 3 : Normaliser les données
    const profileData = { ...formData };
    
    // Normaliser les URLs d'images
    if (profileData.profile_image) {
      profileData.profile_image = profileData.profile_image
        .replace(process.env.REACT_APP_BACKEND_URL, '');
    }
    if (profileData.cover_image) {
      profileData.cover_image = profileData.cover_image
        .replace(process.env.REACT_APP_BACKEND_URL, '');
    }
    
    // ✅ ÉTAPE 4 : Appel API
    const response = await axios.put(
      `${API}/venues/me`,
      profileData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // ✅ ÉTAPE 5 : Mise à jour du state
    setProfile(response.data);
    
    // ✅ ÉTAPE 6 : Feedback utilisateur
    toast.success("✅ Profil mis à jour avec succès !");
    
    // ✅ ÉTAPE 7 : Fermer la modale
    setEditing(false);
    
  } catch (error) {
    // ❌ GESTION DES ERREURS
    console.error('Save error:', error.response?.data || error.message);
    toast.error(error.response?.data?.detail || "Erreur lors de la sauvegarde");
  } finally {
    // ✅ ÉTAPE 8 : Désactiver le loader
    setSaving(false);
  }
};
```

### Fichier Backend : `/app/backend/routes/venues.py`

```python
@router.put("/venues/me")
async def update_venue_profile(
    venue_data: VenueUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    # ✅ ÉTAPE 1 : Vérifier les permissions
    if current_user.get("account_type") != "venue":
        raise HTTPException(status_code=403, detail="Not a venue account")
    
    # ✅ ÉTAPE 2 : Validation backend
    if not venue_data.name or len(venue_data.name) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
    
    if not venue_data.address and not venue_data.city:
        raise HTTPException(status_code=400, detail="Address or city is required")
    
    # ✅ ÉTAPE 3 : Préparer les données
    venue_dict = venue_data.dict(exclude_unset=True)
    venue_dict["updated_at"] = datetime.now(timezone.utc)
    
    # ✅ ÉTAPE 4 : Mise à jour MongoDB
    result = await db.venues.update_one(
        {"user_id": current_user["id"]},
        {"$set": venue_dict}
    )
    
    # ✅ ÉTAPE 5 : Vérifier le résultat
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    # ✅ ÉTAPE 6 : Récupérer le profil mis à jour
    updated_venue = await db.venues.find_one(
        {"user_id": current_user["id"]},
        {"_id": 0}  # Exclure le champ _id
    )
    
    # ✅ ÉTAPE 7 : Retourner la réponse
    return updated_venue
```

---

## 📞 Support

Pour toute question sur le mécanisme de sauvegarde, référez-vous également aux documents suivants :

- `README_PROFILE_MUSICIAN.md` (Sauvegarde profil musicien)
- `README_PROFILE_VENUE.md` (Sauvegarde profil établissement)
- `README_PROFILE_MELOMANE.md` (Sauvegarde profil mélomane)
- `README_UPLOADS.md` (Upload et sauvegarde d'images)
- `INDEX_MOBILE.md` (Architecture globale)

---

**Dernière mise à jour :** 2026-03-27  
**Version :** 1.0  
**Contact :** Équipe Backend Jam Connexion
