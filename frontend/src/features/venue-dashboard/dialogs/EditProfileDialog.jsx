import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";

/**
 * Dialog pour éditer le profil complet d'un établissement
 * @param {boolean} open - État d'ouverture du dialog
 * @param {function} onOpenChange - Callback de changement d'état
 * @param {object} formData - Données du formulaire
 * @param {function} setProfileForm - Setter du formulaire
 * @param {function} updateProfile - Fonction de sauvegarde
 */
export function EditProfileDialog({ open, onOpenChange, formData, setProfileForm, updateProfile }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphism border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le profil</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom de l'établissement *</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setProfileForm({ ...formData, name: e.target.value })} 
                className="bg-black/20 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Input 
                value={formData.venue_type} 
                onChange={(e) => setProfileForm({ ...formData, venue_type: e.target.value })} 
                placeholder="Bar, Club, Salle..."
                className="bg-black/20 border-white/10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={formData.description} 
              onChange={(e) => setProfileForm({ ...formData, description: e.target.value })} 
              className="bg-black/20 border-white/10" 
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input 
              value={formData.address} 
              onChange={(e) => setProfileForm({ ...formData, address: e.target.value })} 
              className="bg-black/20 border-white/10"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input 
                value={formData.city} 
                onChange={(e) => setProfileForm({ ...formData, city: e.target.value })} 
                className="bg-black/20 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Code postal</Label>
              <Input 
                value={formData.postal_code} 
                onChange={(e) => setProfileForm({ ...formData, postal_code: e.target.value })} 
                className="bg-black/20 border-white/10"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input 
                value={formData.phone} 
                onChange={(e) => setProfileForm({ ...formData, phone: e.target.value })} 
                className="bg-black/20 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Capacité</Label>
              <Input 
                type="number"
                value={formData.capacity} 
                onChange={(e) => setProfileForm({ ...formData, capacity: e.target.value })} 
                className="bg-black/20 border-white/10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Site web</Label>
            <Input 
              value={formData.website} 
              onChange={(e) => setProfileForm({ ...formData, website: e.target.value })} 
              placeholder="https://..."
              className="bg-black/20 border-white/10"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Facebook</Label>
              <Input 
                value={formData.facebook} 
                onChange={(e) => setProfileForm({ ...formData, facebook: e.target.value })} 
                placeholder="URL Facebook"
                className="bg-black/20 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input 
                value={formData.instagram} 
                onChange={(e) => setProfileForm({ ...formData, instagram: e.target.value })} 
                placeholder="URL Instagram"
                className="bg-black/20 border-white/10"
              />
            </div>
          </div>
          <Button 
            onClick={updateProfile} 
            className="w-full bg-primary hover:bg-primary/90 rounded-full"
          >
            Sauvegarder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
