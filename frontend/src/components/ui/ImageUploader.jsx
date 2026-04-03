import { useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * ImageUploader Component
 * 
 * Composant réutilisable pour l'upload d'images avec prévisualisation
 * 
 * @param {string} currentImage - URL de l'image actuelle (optionnel)
 * @param {function} onImageChange - Callback appelé quand l'image change (reçoit la nouvelle URL)
 * @param {string} endpoint - Endpoint API à utiliser ('/upload/musician-photo', '/upload/venue-photo', etc.)
 * @param {string} photoType - Type de photo ('profile', 'cover', etc.)
 * @param {string} label - Label à afficher
 * @param {string} token - JWT token pour l'authentification
 * @param {boolean} aspectRatio - Ratio d'aspect ('square' pour profil, 'wide' pour cover)
 */
export default function ImageUploader({
  currentImage,
  onImageChange,
  endpoint,
  photoType = 'profile',
  label = 'Photo',
  token,
  aspectRatio = 'square' // 'square' or 'wide'
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5 MB');
      return;
    }

    // Preview immédiat
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (photoType) {
        formData.append('photo_type', photoType);
      }

      const response = await axios.post(endpoint, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const imageUrl = response.data.url;
      setPreview(imageUrl);
      onImageChange(imageUrl);
      
      toast.success('Image uploadée avec succès ! 🎉');
    } catch (error) {
      console.error('Upload error:', error);
      setPreview(currentImage);
      
      if (error.response?.status === 400) {
        toast.error(error.response.data.detail || 'Fichier invalide');
      } else if (error.response?.status === 413) {
        toast.error('Image trop volumineuse (max 5 MB)');
      } else {
        toast.error('Erreur lors de l\'upload');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onImageChange(null);
    toast.info('Image supprimée');
  };

  const aspectClass = aspectRatio === 'wide' 
    ? 'aspect-[16/9] md:aspect-[4/1]' 
    : 'aspect-square';

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      
      <div className={`relative ${aspectClass} w-full max-w-md border-2 border-dashed border-white/20 rounded-xl overflow-hidden bg-black/20 hover:border-primary/50 transition-colors group`}>
        {preview ? (
          <>
            <img
              src={preview}
              alt={label}
              className="w-full h-full object-cover"
            />
            
            {/* Overlay avec boutons */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full gap-2"
                  disabled={uploading}
                  onClick={(e) => e.preventDefault()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Changer
                    </>
                  )}
                </Button>
              </label>
              
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="rounded-full gap-2"
                onClick={handleRemove}
                disabled={uploading}
              >
                <X className="w-4 h-4" />
                Supprimer
              </Button>
            </div>
          </>
        ) : (
          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            
            {uploading ? (
              <>
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">Upload en cours...</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">Cliquez pour uploader</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, WebP (max 5 MB)</p>
              </>
            )}
          </label>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        {aspectRatio === 'wide' 
          ? 'Format recommandé : 1920x400 px' 
          : 'Format recommandé : 800x800 px (carré)'}
      </p>
    </div>
  );
}
