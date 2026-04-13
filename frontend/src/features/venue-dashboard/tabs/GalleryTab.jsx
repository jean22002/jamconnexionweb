import { Button } from "../../../components/ui/button";
import { Music, Loader2, Plus, Trash2, X, Check } from "lucide-react";
import { useState } from "react";

export default function GalleryTab({
  gallery,
  uploadingPhoto,
  uploadGalleryPhoto,
  deleteGalleryPhoto
}) {
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [viewingPhoto, setViewingPhoto] = useState(null);

  const togglePhotoSelection = (photo) => {
    if (selectedPhotos.includes(photo)) {
      setSelectedPhotos(selectedPhotos.filter(p => p !== photo));
    } else {
      setSelectedPhotos([...selectedPhotos, photo]);
    }
  };

  const deleteSelectedPhotos = async () => {
    if (selectedPhotos.length === 0) return;
    
    if (window.confirm(`Supprimer ${selectedPhotos.length} photo(s) ?`)) {
      for (const photo of selectedPhotos) {
        await deleteGalleryPhoto(photo);
      }
      setSelectedPhotos([]);
    }
  };

  return (
    <>
    <div className="space-y-6">
      <div className="glassmorphism rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading font-semibold text-xl">📸 Galerie Photos</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {gallery.length}/20 photos
              {selectedPhotos.length > 0 && (
                <span className="ml-2 text-primary">• {selectedPhotos.length} sélectionnée(s)</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {selectedPhotos.length > 0 && (
              <Button
                onClick={deleteSelectedPhotos}
                variant="destructive"
                size="sm"
                className="rounded-full gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer ({selectedPhotos.length})
              </Button>
            )}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files[0] && uploadGalleryPhoto(e.target.files[0])}
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
                    Ajouter
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {gallery.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-white/10 rounded-xl">
            <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune photo dans la galerie</p>
            <p className="text-sm mt-2">Ajoutez des photos de vos soirées !</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {gallery.map((photo, index) => {
              const isSelected = selectedPhotos.includes(photo);
              return (
                <div 
                  key={`venue-gallery-${photo}-${index}`} 
                  className={`relative group aspect-square overflow-hidden rounded-lg border-2 transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-primary ring-2 ring-primary/50' 
                      : 'border-white/10 hover:border-primary/30'
                  }`}
                >
                  <img 
                    src={photo} 
                    alt={`Photo ${index + 1}`} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onClick={() => setViewingPhoto(photo)}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23333" width="150" height="150"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="40"%3E❌%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  
                  {/* Checkbox de sélection */}
                  <div 
                    className="absolute top-2 right-2 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePhotoSelection(photo);
                    }}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'bg-primary' 
                        : 'bg-black/50 hover:bg-black/70 border border-white/30'
                    }`}>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal d'agrandissement */}
      {viewingPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setViewingPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <Button
              onClick={() => setViewingPhoto(null)}
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </Button>
            <img 
              src={viewingPhoto} 
              alt="Photo agrandie" 
              className="w-full h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
    </>
  );
}
