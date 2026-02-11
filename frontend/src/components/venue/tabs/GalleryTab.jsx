import { Button } from "@/components/ui/button";
import { Music, Loader2, Plus, Trash2 } from "lucide-react";

/**
 * Galerie Photos Tab - Onglet de gestion de la galerie photos de l'établissement
 * 
 * @param {Array} gallery - Liste des URLs de photos dans la galerie
 * @param {Function} uploadGalleryPhoto - Fonction pour uploader une nouvelle photo
 * @param {Function} deleteGalleryPhoto - Fonction pour supprimer une photo
 * @param {boolean} uploadingPhoto - État de chargement durant l'upload
 */
export default function GalleryTab({
  gallery = [],
  uploadGalleryPhoto,
  deleteGalleryPhoto,
  uploadingPhoto = false
}) {
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && uploadGalleryPhoto) {
      uploadGalleryPhoto(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glassmorphism rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading font-semibold text-xl">📸 Galerie Photos</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {gallery.length}/20 photos
            </p>
          </div>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploadingPhoto || gallery.length >= 20}
            />
            <Button 
              disabled={uploadingPhoto || gallery.length >= 20}
              className="bg-primary hover:bg-primary/90 rounded-full gap-2"
            >
              {uploadingPhoto ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Upload...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Ajouter Photo
                </>
              )}
            </Button>
          </div>
        </div>

        {gallery.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-white/10 rounded-xl">
            <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune photo dans la galerie</p>
            <p className="text-sm mt-2">Ajoutez des photos de vos soirées !</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((photo, index) => (
              <div key={index} className="relative group">
                <img 
                  src={photo} 
                  alt={`Photo ${index + 1}`} 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Button
                    onClick={() => deleteGalleryPhoto && deleteGalleryPhoto(photo)}
                    variant="destructive"
                    size="sm"
                    className="rounded-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
