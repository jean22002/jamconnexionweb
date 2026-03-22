import React, { useState } from 'react';
import { Edit, X, Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EditConcertGusoModal = ({ concert, token, onUpdate, onClose }) => {
  const [formData, setFormData] = useState({
    cachetType: concert.cachet_type || '',
    customHours: concert.guso_hours || 0,
    cachet: concert.cachet || 0,
    gusoContractType: concert.guso_contract_type || '',
    notes: concert.notes || ''
  });
  const [saving, setSaving] = useState(false);
  const [useCustomHours, setUseCustomHours] = useState(!concert.cachet_type);

  // Calculer les heures selon le type de cachet
  const calculatedHours = formData.cachetType === 'isolé' ? 12 : 
                          formData.cachetType === 'groupé' ? 8 : 
                          formData.customHours;

  const handleSave = async () => {
    setSaving(true);
    try {
      // Préparer les données à envoyer
      const updateData = {
        cachet_type: useCustomHours ? null : formData.cachetType,
        cachet: parseFloat(formData.cachet),
        guso_contract_type: formData.gusoContractType,
        notes: formData.notes
      };

      // Si heures personnalisées, les inclure
      if (useCustomHours) {
        updateData.guso_hours = parseFloat(formData.customHours);
      }

      // Appel API pour mettre à jour le concert
      await axios.patch(
        `${API}/musicians/me/concerts/${concert.id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Concert mis à jour avec succès');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating concert:', error);
      toast.error(error.response?.data?.detail || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-primary" />
            Modifier le concert GUSO
          </DialogTitle>
          <DialogDescription>
            <div className="text-left mt-2">
              <p className="font-semibold">{concert.venue_name}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(concert.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              <p className="text-sm text-muted-foreground">📍 {concert.city}</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Choix: Type de cachet officiel ou heures personnalisées */}
          <div className="space-y-2">
            <Label>Méthode de calcul des heures</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={!useCustomHours ? "default" : "outline"}
                className="flex-1"
                onClick={() => setUseCustomHours(false)}
              >
                📋 Logique officielle
              </Button>
              <Button
                type="button"
                variant={useCustomHours ? "default" : "outline"}
                className="flex-1"
                onClick={() => setUseCustomHours(true)}
              >
                ✏️ Heures personnalisées
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {!useCustomHours 
                ? "Utilise la logique officielle France Travail (12h isolé / 8h groupé)"
                : "Permet de saisir un nombre d'heures personnalisé"}
            </p>
          </div>

          {/* Type de cachet (si logique officielle) */}
          {!useCustomHours && (
            <div className="space-y-2">
              <Label htmlFor="cachetType">Type de cachet *</Label>
              <Select value={formData.cachetType} onValueChange={(val) => setFormData({ ...formData, cachetType: val })}>
                <SelectTrigger id="cachetType">
                  <SelectValue placeholder="Sélectionner le type de cachet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="isolé">
                    <div className="flex items-center gap-2">
                      <span>🎵</span>
                      <div>
                        <div className="font-semibold">Cachet isolé</div>
                        <div className="text-xs text-muted-foreground">12 heures retenues (France Travail)</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="groupé">
                    <div className="flex items-center gap-2">
                      <span>🎸</span>
                      <div>
                        <div className="font-semibold">Cachet groupé</div>
                        <div className="text-xs text-muted-foreground">8 heures retenues (France Travail)</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {/* Afficher les heures calculées */}
              {formData.cachetType && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-sm font-semibold text-blue-400">
                    ⏱️ Heures retenues : {calculatedHours}h
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selon la logique officielle d'intermittence
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Heures personnalisées (si mode personnalisé) */}
          {useCustomHours && (
            <div className="space-y-2">
              <Label htmlFor="customHours">Nombre d'heures</Label>
              <Input
                id="customHours"
                type="number"
                step="0.5"
                min="0"
                value={formData.customHours}
                onChange={(e) => setFormData({ ...formData, customHours: e.target.value })}
                placeholder="Ex: 8"
              />
              <p className="text-xs text-muted-foreground">
                ⚠️ Attention : Les heures personnalisées ne suivent pas la logique officielle
              </p>
            </div>
          )}

          {/* Montant du cachet */}
          <div className="space-y-2">
            <Label htmlFor="cachet">Cachet (€) *</Label>
            <Input
              id="cachet"
              type="number"
              step="0.01"
              min="0"
              value={formData.cachet}
              onChange={(e) => setFormData({ ...formData, cachet: e.target.value })}
              placeholder="Ex: 150.00"
            />
          </div>

          {/* Type de contrat */}
          <div className="space-y-2">
            <Label htmlFor="contractType">Type de contrat</Label>
            <Select 
              value={formData.gusoContractType} 
              onValueChange={(val) => setFormData({ ...formData, gusoContractType: val })}
            >
              <SelectTrigger id="contractType">
                <SelectValue placeholder="Sélectionner le type de contrat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CDDU">CDDU (Contrat à Durée Déterminée d'Usage)</SelectItem>
                <SelectItem value="CDD">CDD (Contrat à Durée Déterminée)</SelectItem>
                <SelectItem value="CDI">CDI (Contrat à Durée Indéterminée)</SelectItem>
                <SelectItem value="Cachet">Cachet isolé</SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes privées sur ce concert"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || (!useCustomHours && !formData.cachetType)}
            className="bg-primary hover:bg-primary/90"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditConcertGusoModal;
