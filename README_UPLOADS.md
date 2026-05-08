# 📤 Upload de Fichiers - Architecture Stockage

<div align="center">

![Upload](https://img.shields.io/badge/Upload-File_Storage-4285F4?style=for-the-badge&logo=googledrive&logoColor=white)

**Documentation Système d'Upload pour Jam Connexion Mobile**

</div>

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Architecture](#-architecture)
- [Endpoints Existants](#-endpoints-existants)
- [Côté Backend (FastAPI)](#-côté-backend-fastapi)
- [Côté Mobile (React Native)](#-côté-mobile-react-native)
- [Types de Fichiers](#-types-de-fichiers)
- [Exemples Code](#-exemples-code)

---

## 🎯 Vue d'ensemble

### État Actuel

✅ **Le système d'upload de fichiers EXISTE DÉJÀ dans le backend**

| Composant | État | Localisation |
|-----------|------|-------------|
| Endpoints Backend | ✅ Opérationnels | `/app/backend/routes/uploads.py` |
| Stockage | ✅ Local `/uploads` | `/app/uploads/` (production à adapter) |
| Types supportés | ✅ Images | Photos profil, bannières, événements |
| Mobile | ❌ Pas implémenté | À créer dans l'app React Native |

### Cas d'Usage

| Qui | Upload Quoi | Où |
|-----|-------------|----|
| 🎸 **Musicien** | Photo de profil, photos de groupe | Profil, Groupe |
| 🏢 **Établissement** | Logo, bannière, photos événements | Profil, Événements |
| 🎵 **Mélomane** | Photo de profil | Profil |
| 💬 **Chat** (Phase 2) | Images, audio, vidéos | Messages |

### Technologies Utilisées

| Composant | Technologie | Pourquoi |
|-----------|-------------|----------|
| **Backend** | FastAPI `UploadFile` | Natif, gestion multipart/form-data |
| **Stockage Production** | Système de fichiers local | Simple, déjà fonctionnel |
| **Stockage Alternatif** | AWS S3 / Cloudflare R2 | Scalabilité, CDN |
| **Mobile** | `react-native-image-picker` | Accès caméra + galerie |
| **Mobile** | `react-native-document-picker` | Documents (PDF, etc.) |

---

## 🏗️ Architecture

### Architecture Actuelle (Web + Mobile)

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  📱 APP MOBILE (React Native)                               │
│                                                              │
│  1. Utilisateur sélectionne image/fichier                   │
│  2. Prévisualisation (optionnel)                            │
│  3. Upload via FormData (multipart/form-data)               │
│                                                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ POST /api/upload/musician-photo
                 │ Content-Type: multipart/form-data
                 │ Body: { file: [binary data] }
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  🌐 BACKEND FASTAPI                                         │
│     https://jamconnexion.com/api                            │
│                                                              │
│  1. Reçoit fichier (UploadFile)                             │
│  2. Valide (type, taille, format)                           │
│  3. Génère nom unique (UUID + extension)                    │
│  4. Sauvegarde dans /uploads/                               │
│  5. Retourne URL publique                                   │
│                                                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ Écriture fichier
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  📁 SYSTÈME DE FICHIERS (Local ou Cloud)                   │
│     /app/uploads/                                           │
│                                                              │
│  Structure :                                                 │
│  ├── musicians/                                             │
│  │   ├── abc123.jpg                                         │
│  │   └── def456.png                                         │
│  ├── venues/                                                │
│  │   ├── ghi789.jpg                                         │
│  │   └── jkl012.png                                         │
│  └── events/                                                │
│      ├── mno345.jpg                                         │
│      └── pqr678.png                                         │
│                                                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ URL retournée : https://jamconnexion.com/uploads/musicians/abc123.jpg
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  🗄️ MONGODB ATLAS                                          │
│                                                              │
│  Stocke uniquement l'URL (pas le fichier) :                │
│  {                                                           │
│    "id": "mus_123",                                         │
│    "profile_picture": "https://jamconnexion.com/uploads/... │
│  }                                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🖥️ Endpoints Existants

### Fichier : `/app/backend/routes/uploads.py`

**Endpoints Disponibles :**

| Endpoint | Méthode | Description | Type Fichier |
|----------|---------|-------------|-------------|
| `/upload/musician-photo` | POST | Upload photo profil musicien | Image (JPG, PNG, WEBP) |
| `/upload/venue-photo` | POST | Upload photo profil établissement | Image |
| `/upload/venue-banner` | POST | Upload bannière établissement | Image |
| `/upload/event-photo` | POST | Upload photo événement | Image |
| `/upload/band-photo` | POST | Upload photo de groupe | Image |

### Exemple Endpoint (Code Existant)

```python
# /app/backend/routes/uploads.py

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from utils.auth import get_current_user
import os
import uuid
from pathlib import Path

router = APIRouter(prefix="/api/upload", tags=["uploads"])

# Configuration
UPLOAD_DIR = Path("/app/uploads")
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

# Créer dossiers si nécessaires
for subdir in ["musicians", "venues", "events", "bands"]:
    (UPLOAD_DIR / subdir).mkdir(parents=True, exist_ok=True)

@router.post("/musician-photo")
async def upload_musician_photo(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """
    Upload photo de profil musicien
    """
    # Valider extension
    ext = file.filename.split(".")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Extension non supportée. Utilisez : {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Valider taille
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Fichier trop volumineux. Max : {MAX_FILE_SIZE / 1024 / 1024} MB"
        )
    
    # Générer nom unique
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = UPLOAD_DIR / "musicians" / unique_filename
    
    # Sauvegarder
    with open(file_path, "wb") as f:
        f.write(content)
    
    # URL publique
    file_url = f"https://jamconnexion.com/uploads/musicians/{unique_filename}"
    
    # Mettre à jour profil dans MongoDB
    from database import get_db
    db = get_db()
    await db.musicians.update_one(
        {"user_id": user["id"]},
        {"$set": {"profile_picture": file_url}}
    )
    
    return {
        "success": True,
        "url": file_url,
        "filename": unique_filename
    }

@router.post("/venue-photo")
async def upload_venue_photo(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """
    Upload logo établissement
    """
    # Même logique que musician-photo
    # ...
    pass

@router.post("/event-photo")
async def upload_event_photo(
    file: UploadFile = File(...),
    event_id: str = Query(...),
    user: dict = Depends(get_current_user)
):
    """
    Upload photo événement
    """
    # Valider que l'utilisateur est propriétaire de l'événement
    # ...
    pass
```

---

## 📱 Côté Mobile (React Native)

### Installation

```bash
npm install react-native-image-picker
npm install react-native-document-picker
npm install rn-fetch-blob  # Pour uploads volumineux

# iOS uniquement
cd ios && pod install && cd ..
```

### Configuration iOS (Permissions)

**Fichier : `ios/JamConnexion/Info.plist`**
```xml
<key>NSCameraUsageDescription</key>
<string>Jam Connexion a besoin d'accéder à votre caméra pour prendre des photos de profil</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Jam Connexion a besoin d'accéder à vos photos pour choisir une image de profil</string>
```

### Configuration Android (Permissions)

**Fichier : `android/app/src/main/AndroidManifest.xml`**
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### Service Upload

**Fichier : `src/services/uploadService.js`**

```javascript
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import api from './api';

class UploadService {
  
  // Ouvrir caméra
  async takePhoto() {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1080,
        maxHeight: 1080,
        includeBase64: false
      });

      if (result.didCancel) return null;
      if (result.errorCode) throw new Error(result.errorMessage);

      return result.assets[0];
    } catch (error) {
      console.error('Erreur caméra:', error);
      throw error;
    }
  }

  // Ouvrir galerie
  async pickImage() {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1080,
        maxHeight: 1080,
        selectionLimit: 1
      });

      if (result.didCancel) return null;
      if (result.errorCode) throw new Error(result.errorMessage);

      return result.assets[0];
    } catch (error) {
      console.error('Erreur galerie:', error);
      throw error;
    }
  }

  // Choisir document
  async pickDocument() {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'cachesDirectory'
      });

      return result[0];
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        return null;
      }
      throw error;
    }
  }

  // Upload fichier
  async uploadFile(file, endpoint) {
    try {
      const formData = new FormData();
      
      formData.append('file', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.fileName || 'photo.jpg'
      });

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60 secondes
      });

      return response.data;
    } catch (error) {
      console.error('Erreur upload:', error);
      throw error;
    }
  }

  // Upload avec progression
  async uploadWithProgress(file, endpoint, onProgress) {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.fileName || 'photo.jpg'
      });

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erreur upload:', error);
      throw error;
    }
  }

  // Upload photo profil musicien
  async uploadMusicianPhoto(photo) {
    return this.uploadFile(photo, '/upload/musician-photo');
  }

  // Upload photo profil établissement
  async uploadVenuePhoto(photo) {
    return this.uploadFile(photo, '/upload/venue-photo');
  }

  // Upload bannière établissement
  async uploadVenueBanner(photo) {
    return this.uploadFile(photo, '/upload/venue-banner');
  }

  // Upload photo événement
  async uploadEventPhoto(photo, eventId) {
    return this.uploadFile(photo, `/upload/event-photo?event_id=${eventId}`);
  }
}

export default new UploadService();
```

### Composant Upload Photo

**Fichier : `src/components/PhotoUploadButton.js`**

```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import uploadService from '../services/uploadService';

const PhotoUploadButton = ({ currentPhoto, onUploadComplete, uploadType = 'musician' }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (source) => {
    try {
      let photo;
      
      if (source === 'camera') {
        photo = await uploadService.takePhoto();
      } else {
        photo = await uploadService.pickImage();
      }

      if (!photo) return;

      setUploading(true);
      
      // Upload avec progression
      let result;
      if (uploadType === 'musician') {
        result = await uploadService.uploadWithProgress(
          photo,
          '/upload/musician-photo',
          setProgress
        );
      } else if (uploadType === 'venue') {
        result = await uploadService.uploadWithProgress(
          photo,
          '/upload/venue-photo',
          setProgress
        );
      }

      Alert.alert('Succès', 'Photo mise à jour !');
      onUploadComplete(result.url);

    } catch (error) {
      Alert.alert('Erreur', 'Impossible de télécharger la photo');
      console.error(error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const showOptions = () => {
    Alert.alert(
      'Choisir une photo',
      '',
      [
        { text: 'Prendre une photo', onPress: () => handleUpload('camera') },
        { text: 'Galerie', onPress: () => handleUpload('gallery') },
        { text: 'Annuler', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={showOptions} disabled={uploading}>
        <View style={styles.photoContainer}>
          {currentPhoto ? (
            <Image source={{ uri: currentPhoto }} style={styles.photo} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>+</Text>
            </View>
          )}
          {uploading && (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.progressText}>{progress}%</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <Text style={styles.hint}>Appuyez pour modifier</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  photoContainer: { position: 'relative' },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0'
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderText: { fontSize: 48, color: '#999' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center'
  },
  progressText: { color: '#fff', marginTop: 8, fontSize: 16 },
  hint: { marginTop: 8, color: '#666', fontSize: 12 }
});

export default PhotoUploadButton;
```

### Utilisation dans un Écran

```javascript
// src/screens/MusicianProfileEditScreen.js

import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import PhotoUploadButton from '../components/PhotoUploadButton';

const MusicianProfileEditScreen = () => {
  const [profilePicture, setProfilePicture] = useState('https://...');

  return (
    <ScrollView>
      <PhotoUploadButton
        currentPhoto={profilePicture}
        onUploadComplete={(url) => setProfilePicture(url)}
        uploadType="musician"
      />
      {/* Autres champs... */}
    </ScrollView>
  );
};

export default MusicianProfileEditScreen;
```

---

## 📦 Types de Fichiers Supportés

### Images

| Extension | Type MIME | Taille Max | Usage |
|-----------|-----------|------------|-------|
| `.jpg`, `.jpeg` | `image/jpeg` | 5 MB | Photos profil, événements |
| `.png` | `image/png` | 5 MB | Logos, icônes |
| `.webp` | `image/webp` | 5 MB | Photos optimisées |
| `.gif` | `image/gif` | 2 MB | Animations |

### Documents (Phase 2)

| Extension | Type MIME | Taille Max | Usage |
|-----------|-----------|------------|-------|
| `.pdf` | `application/pdf` | 10 MB | Contrats, partitions |
| `.mp3` | `audio/mpeg` | 15 MB | Samples audio |
| `.mp4` | `video/mp4` | 50 MB | Vidéos démos |

---

## ⚙️ Configuration Cloudflare (Production)

### Servir les Fichiers via Cloudflare

**Problème** : Les fichiers uploadés dans `/app/uploads` ne sont pas accessibles publiquement.

**Solution 1 : Servir via FastAPI**

```python
# /app/backend/server.py

from fastapi.staticfiles import StaticFiles

app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")
```

**Solution 2 : Cloudflare R2 (Recommandé pour production)**

```python
# Installation
pip install boto3

# Configuration
import boto3
from botocore.config import Config

s3_client = boto3.client(
    's3',
    endpoint_url='https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com',
    aws_access_key_id='YOUR_ACCESS_KEY',
    aws_secret_access_key='YOUR_SECRET_KEY',
    config=Config(signature_version='s3v4')
)

# Upload
s3_client.upload_fileobj(
    file,
    'jamconnexion-uploads',
    f'musicians/{unique_filename}',
    ExtraArgs={'ContentType': 'image/jpeg'}
)

file_url = f'https://uploads.jamconnexion.com/musicians/{unique_filename}'
```

---

## 🧪 Tests

### Test 1 : Upload Photo Profil (Postman)

```bash
POST https://jamconnexion.com/api/upload/musician-photo
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

Body (form-data):
file: [Sélectionner un fichier image]
```

### Test 2 : Upload depuis Mobile (Dev)

```javascript
// Tester avec une image de test
const testUpload = async () => {
  const photo = {
    uri: 'file:///path/to/test.jpg',
    type: 'image/jpeg',
    fileName: 'test.jpg'
  };
  
  const result = await uploadService.uploadMusicianPhoto(photo);
  console.log('URL:', result.url);
};
```

---

## ⚠️ Points d'Attention

### 1. Compression Images Mobile

Toujours compresser avant upload pour économiser bande passante :

```javascript
import ImageResizer from 'react-native-image-resizer';

const compressImage = async (imageUri) => {
  const resized = await ImageResizer.createResizedImage(
    imageUri,
    1080, // maxWidth
    1080, // maxHeight
    'JPEG',
    80 // quality
  );
  return resized;
};
```

### 2. Gestion des Échecs

- Implémenter retry automatique (3 tentatives)
- Afficher message clair à l'utilisateur
- Logger erreurs côté backend

### 3. Nettoyage Fichiers Anciens

```python
# Script nettoyage (à exécuter périodiquement)
import os
from datetime import datetime, timedelta

def cleanup_old_files():
    threshold = datetime.now() - timedelta(days=90)
    for root, dirs, files in os.walk('/app/uploads'):
        for file in files:
            path = os.path.join(root, file)
            if datetime.fromtimestamp(os.path.getmtime(path)) < threshold:
                os.remove(path)
```

### 4. Sécurité

- ✅ Valider type MIME côté backend (ne pas faire confiance extension)
- ✅ Limiter taille fichiers
- ✅ Scanner virus (optionnel, via ClamAV)
- ✅ Générer noms uniques (UUID) pour éviter écrasements

---

## 🎯 Résumé pour l'Agent Mobile

### ✅ Backend DÉJÀ PRÊT

Les endpoints d'upload existent déjà dans `/app/backend/routes/uploads.py` :
- `/api/upload/musician-photo`
- `/api/upload/venue-photo`
- `/api/upload/event-photo`

### ✅ Mobile À FAIRE

1. Installer `react-native-image-picker`
2. Configurer permissions iOS/Android
3. Créer `uploadService.js`
4. Créer composant `PhotoUploadButton`
5. Intégrer dans écrans de profil
6. Tester upload + affichage

### ⚡ Optimisations Futures

- Compression automatique avant upload
- Cache local des images
- Migration vers Cloudflare R2 (CDN)
- Support upload multiple (galerie)

---

<div align="center">

**Upload = Simple avec FormData** 📤  
**Backend = Déjà prêt à recevoir** ✅  
**Mobile = Intégration directe** 📱

</div>
