import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Switch } from "../../../components/ui/switch";
import { Settings2, Save, RotateCcw, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Composant de configuration des seuils de modération automatique
 * Permet aux établissements de configurer les délais de modération
 */
export default function ModerationSettingsCard({ venueId, token }) {
  const [settings, setSettings] = useState({
    auto_approve_delay: 24,
    auto_reject_delay: 72,
    review_required_delay: 12,
    require_manual_review: false,
    enabled: true,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Charger les paramètres existants
  useEffect(() => {
    fetchSettings();
  }, [venueId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/moderation/settings/venue/${venueId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres:", error);
      toast.error("Impossible de charger les paramètres de modération");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await axios.put(
        `${API}/moderation/settings/venue/${venueId}`,
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("✅ Paramètres de modération sauvegardés");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Échec de la sauvegarde des paramètres");
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (!window.confirm("Réinitialiser les paramètres aux valeurs par défaut ?")) return;
    
    try {
      setSaving(true);
      await axios.post(
        `${API}/moderation/settings/venue/${venueId}/reset`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Paramètres réinitialisés");
      await fetchSettings();
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error);
      toast.error("Échec de la réinitialisation");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glassmorphism rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glassmorphism rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings2 className="w-6 h-6 text-primary" />
        <div>
          <h2 className="font-heading font-semibold text-xl">Modération Automatique</h2>
          <p className="text-sm text-muted-foreground">
            Configurez les délais de modération pour votre établissement
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Activation globale */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="flex-1">
            <Label className="text-base font-semibold">Modération automatique</Label>
            <p className="text-sm text-muted-foreground">
              Activer la modération automatique des contenus selon les délais configurés
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
          />
        </div>

        {/* Délais de modération */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Délais de modération (en heures)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="auto-approve">
                Approbation auto
                <span className="text-xs text-muted-foreground block">
                  Approuver automatiquement après
                </span>
              </Label>
              <Input
                id="auto-approve"
                type="number"
                min="0"
                value={settings.auto_approve_delay}
                onChange={(e) =>
                  setSettings({ ...settings, auto_approve_delay: parseInt(e.target.value) || 0 })
                }
                className="bg-black/20 border-white/10"
                disabled={!settings.enabled}
              />
              <p className="text-xs text-muted-foreground">heures</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-required">
                Revue requise
                <span className="text-xs text-muted-foreground block">
                  Marquer pour revue après
                </span>
              </Label>
              <Input
                id="review-required"
                type="number"
                min="0"
                value={settings.review_required_delay}
                onChange={(e) =>
                  setSettings({ ...settings, review_required_delay: parseInt(e.target.value) || 0 })
                }
                className="bg-black/20 border-white/10"
                disabled={!settings.enabled}
              />
              <p className="text-xs text-muted-foreground">heures</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto-reject">
                Rejet auto
                <span className="text-xs text-muted-foreground block">
                  Rejeter automatiquement après
                </span>
              </Label>
              <Input
                id="auto-reject"
                type="number"
                min="0"
                value={settings.auto_reject_delay}
                onChange={(e) =>
                  setSettings({ ...settings, auto_reject_delay: parseInt(e.target.value) || 0 })
                }
                className="bg-black/20 border-white/10"
                disabled={!settings.enabled}
              />
              <p className="text-xs text-muted-foreground">heures</p>
            </div>
          </div>
        </div>

        {/* Revue manuelle obligatoire */}
        <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-semibold">Revue manuelle obligatoire</Label>
              <Switch
                checked={settings.require_manual_review}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, require_manual_review: checked })
                }
                disabled={!settings.enabled}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Tous les contenus nécessiteront une validation manuelle avant publication
            </p>
          </div>
        </div>

        {/* Informations */}
        <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
          <p className="text-sm">
            💡 <strong>Comment ça fonctionne ?</strong>
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
            <li>• Les contenus soumis sont vérifiés automatiquement selon ces délais</li>
            <li>• Si revue manuelle activée, tous les contenus nécessitent validation</li>
            <li>• Les délais s'appliquent aux candidatures, commentaires et contenus soumis</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <Button
            onClick={saveSettings}
            disabled={saving || !settings.enabled}
            className="flex-1 bg-primary hover:bg-primary/90 rounded-full"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
          <Button
            onClick={resetSettings}
            variant="outline"
            disabled={saving}
            className="border-white/20 rounded-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </div>
    </div>
  );
}
