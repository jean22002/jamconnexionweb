import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Switch } from "../../../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Save, X } from "lucide-react";
import { MUSIC_STYLES_LIST } from "../../../data/music-styles";
import ImageUploader from "../../../components/ui/ImageUploader";

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

/**
 * Dialog pour éditer le profil complet d'un établissement
 * Restauré selon README_PROFILE_VENUE.md
 */
export function EditProfileDialog({ open, onOpenChange, formData, setFormData, updateProfile, token }) {
  
  const handleClose = () => {
    onOpenChange(false);
  };

  const handleImageChange = (field, url) => {
    setFormData({ ...formData, [field]: url });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphism border-white/10 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            Éditer le profil de l'établissement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          
          {/* 📸 Section 0 : Photos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">📸 Photos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUploader
                currentImage={formData.profile_image}
                onImageChange={(url) => handleImageChange('profile_image', url)}
                endpoint="/api/upload/venue-photo"
                photoType="profile"
                label="Photo de profil"
                token={token}
                aspectRatio="square"
              />
              
              <ImageUploader
                currentImage={formData.cover_image}
                onImageChange={(url) => handleImageChange('cover_image', url)}
                endpoint="/api/upload/venue-photo"
                photoType="cover"
                label="Photo de couverture"
                token={token}
                aspectRatio="wide"
              />
            </div>
          </div>
          
          {/* 🏢 Section 1 : Informations Générales */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="font-semibold text-lg">🏢 Informations générales</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom de l'établissement *</Label>
                <Input 
                  value={formData.name || ""} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="Ex: Le Jazz Club"
                  className="bg-black/20 border-white/10"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Type d'établissement</Label>
                <Select
                  value={formData.venue_type || ""}
                  onValueChange={(value) => setFormData({ ...formData, venue_type: value })}
                >
                  <SelectTrigger className="bg-black/20 border-white/10">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-white/10">
                    <SelectItem value="Bar">Bar</SelectItem>
                    <SelectItem value="Café-concert">Café-concert</SelectItem>
                    <SelectItem value="Salle de concert">Salle de concert</SelectItem>
                    <SelectItem value="Club">Club / Discothèque</SelectItem>
                    <SelectItem value="Restaurant">Restaurant</SelectItem>
                    <SelectItem value="Salle polyvalente">Salle polyvalente</SelectItem>
                    <SelectItem value="Théâtre">Théâtre</SelectItem>
                    <SelectItem value="Festival">Festival</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={formData.description || ""} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                placeholder="Décrivez votre établissement, son ambiance, sa programmation..."
                className="bg-black/20 border-white/10" 
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">
                {(formData.description || "").length}/1000 caractères
              </p>
            </div>

            <div className="space-y-2">
              <Label>Capacité d'accueil</Label>
              <Input 
                type="number"
                value={formData.capacity || ""} 
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })} 
                placeholder="Ex: 150"
                className="bg-black/20 border-white/10"
                min={0}
              />
              <p className="text-xs text-muted-foreground">Nombre de personnes</p>
            </div>
          </div>

          {/* 📍 Section 2 : Localisation */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="font-semibold text-lg">📍 Localisation</h3>
            
            <div className="space-y-2">
              <Label>Adresse complète *</Label>
              <Input 
                value={formData.address || ""} 
                onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                placeholder="Ex: 42 rue de la République"
                className="bg-black/20 border-white/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input 
                  value={formData.city || ""} 
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })} 
                  placeholder="Ex: Lyon"
                  className="bg-black/20 border-white/10"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Code postal</Label>
                <Input 
                  value={formData.postal_code || ""} 
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} 
                  placeholder="Ex: 69001"
                  className="bg-black/20 border-white/10"
                />
              </div>
            </div>
          </div>

          {/* 📞 Section 3 : Contact */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="font-semibold text-lg">📞 Contact</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input 
                  type="tel"
                  value={formData.phone || ""} 
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                  placeholder="Ex: 06 12 34 56 78"
                  className="bg-black/20 border-white/10"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Email de contact</Label>
                <Input 
                  type="email"
                  value={formData.email || ""} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  placeholder="contact@etablissement.fr"
                  className="bg-black/20 border-white/10"
                />
                <p className="text-xs text-muted-foreground">
                  Email visible publiquement
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Site web</Label>
              <Input 
                type="url"
                value={formData.website || ""} 
                onChange={(e) => setFormData({ ...formData, website: e.target.value })} 
                placeholder="https://www.monsite.fr"
                className="bg-black/20 border-white/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Page Facebook</Label>
                <Input 
                  type="url"
                  value={formData.facebook || ""} 
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })} 
                  placeholder="https://facebook.com/monbar"
                  className="bg-black/20 border-white/10"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input 
                  type="url"
                  value={formData.instagram || ""} 
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} 
                  placeholder="https://instagram.com/monbar"
                  className="bg-black/20 border-white/10"
                />
              </div>
            </div>
          </div>

          {/* 🎵 Section 4 : Styles Musicaux */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="font-semibold text-lg">🎵 Styles musicaux proposés</h3>
            
            <Select onValueChange={(style) => {
              if (!formData.music_styles?.includes(style)) {
                setFormData({
                  ...formData,
                  music_styles: [...(formData.music_styles || []), style]
                });
              }
            }}>
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue placeholder="Ajouter un style musical" />
              </SelectTrigger>
              <SelectContent className="bg-background border-white/10 max-h-[300px] overflow-y-auto">
                {MUSIC_STYLES_LIST.map((style) => (
                  <SelectItem 
                    key={style} 
                    value={style}
                    disabled={formData.music_styles?.includes(style)}
                  >
                    {style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {formData.music_styles && formData.music_styles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.music_styles.map((style, i) => (
                  <span 
                    key={i} 
                    className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-1"
                  >
                    {style}
                    <button 
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          music_styles: formData.music_styles.filter(s => s !== style)
                        });
                      }}
                      className="hover:text-primary-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 🎤 Section 5 : Équipements - Scène */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="font-semibold text-lg">🎸 Scène & Sonorisation</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.has_stage || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_stage: checked })}
                />
                <Label>Scène disponible</Label>
              </div>

              {formData.has_stage && (
                <div className="ml-6 space-y-2">
                  <Label>Taille de la scène</Label>
                  <Select
                    value={formData.stage_size || ""}
                    onValueChange={(value) => setFormData({ ...formData, stage_size: value })}
                  >
                    <SelectTrigger className="bg-black/20 border-white/10">
                      <SelectValue placeholder="Sélectionner une taille" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-white/10">
                      <SelectItem value="5m²">Petite (5m²)</SelectItem>
                      <SelectItem value="10m²">Moyenne (10m²)</SelectItem>
                      <SelectItem value="15m²">Grande (15m²)</SelectItem>
                      <SelectItem value="20m²+">Très grande (20m²+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.has_pa_system || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_pa_system: checked })}
                />
                <Label>Système de sonorisation (PA)</Label>
              </div>

              {formData.has_pa_system && (
                <div className="ml-6 space-y-3">
                  <div className="space-y-2">
                    <Label>Table de mixage</Label>
                    <Input 
                      value={formData.pa_mixer_name || ""} 
                      onChange={(e) => setFormData({ ...formData, pa_mixer_name: e.target.value })} 
                      placeholder="Ex: Yamaha MG16XU"
                      className="bg-black/20 border-white/10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Enceintes</Label>
                    <Input 
                      value={formData.pa_speakers_name || ""} 
                      onChange={(e) => setFormData({ ...formData, pa_speakers_name: e.target.value })} 
                      placeholder="Ex: JBL PRX"
                      className="bg-black/20 border-white/10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Puissance</Label>
                    <Input 
                      value={formData.pa_power || ""} 
                      onChange={(e) => setFormData({ ...formData, pa_power: e.target.value })} 
                      placeholder="Ex: 2000W"
                      className="bg-black/20 border-white/10"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.has_sound_engineer || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_sound_engineer: checked })}
                />
                <Label>Ingénieur son disponible</Label>
              </div>
            </div>
          </div>

          {/* 💡 Section 6 : Lumières */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="font-semibold text-lg">💡 Éclairage</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.has_lights || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_lights: checked })}
                />
                <Label>Éclairage scénique</Label>
              </div>

              {formData.has_lights && (
                <div className="ml-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.has_auto_light || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, has_auto_light: checked })}
                    />
                    <Label>Jeu de lumière automatique</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.has_light_table || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, has_light_table: checked })}
                    />
                    <Label>Table lumière (contrôle manuel)</Label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 🎹 Section 7 : Équipements disponibles */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="font-semibold text-lg">🎹 Équipements disponibles pour les musiciens</h3>
            
            <Select onValueChange={(item) => {
              if (!formData.equipment?.includes(item)) {
                setFormData({
                  ...formData,
                  equipment: [...(formData.equipment || []), item]
                });
              }
            }}>
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue placeholder="Ajouter un équipement" />
              </SelectTrigger>
              <SelectContent className="bg-background border-white/10">
                {INSTRUMENTS_BASE.map((item) => (
                  <SelectItem 
                    key={item} 
                    value={item}
                    disabled={formData.equipment?.includes(item)}
                  >
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {formData.equipment && formData.equipment.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.equipment.map((item, i) => (
                  <span 
                    key={i} 
                    className="px-3 py-1 bg-secondary/20 rounded-full text-sm flex items-center gap-1"
                  >
                    {item}
                    <button 
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          equipment: formData.equipment.filter(e => e !== item)
                        });
                      }}
                      className="hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 🕐 Section 8 : Horaires */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="font-semibold text-lg">🕐 Horaires d'ouverture</h3>
            
            <div className="space-y-2">
              <Textarea 
                value={formData.opening_hours || ""} 
                onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })} 
                placeholder="Ex: Mardi-Samedi 18h-2h, Dimanche 17h-00h"
                className="bg-black/20 border-white/10" 
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Format libre - ces horaires seront visibles sur votre profil public
              </p>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-6 border-t border-white/10">
            <Button
              onClick={updateProfile}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
            
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-white/20"
            >
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
