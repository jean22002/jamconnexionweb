import { Button } from "../../../components/ui/button";
import { Music, Loader2, Plus, Trash2 } from "lucide-react";

export default function GalleryTab({
  gallery,
  uploadingPhoto,
  uploadGalleryPhoto,
  deleteGalleryPhoto
}) {
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
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {gallery.map((photo, index) => (
              <div key={index} className="relative group aspect-square overflow-hidden rounded-lg border border-white/10 hover:border-primary/50 transition-all">
                <img 
                  src={photo} 
                  alt={`Photo ${index + 1}`} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23333" width="150" height="150"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="40"%3E❌%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                  <Button
                    onClick={() => deleteGalleryPhoto(photo)}
                    variant="destructive"
                    size="sm"
                    className="rounded-full gap-1 text-xs h-8 px-3"
                  >
                    <Trash2 className="w-3 h-3" />
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
