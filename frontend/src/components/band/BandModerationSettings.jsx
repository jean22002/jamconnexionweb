import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Settings2, Save, RotateCcw, Clock, AlertCircle, Shield } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Composant de configuration des seuils de modération pour les groupes
 * Utilisable dans le dashboard Musicien pour les admins de groupes
 */
export default function BandModerationSettings({ bandId, bandName, token, isAdmin = false }) {
  const [settings, setSettings] = useState({
    auto_approve_delay: 24,
    auto_reject_delay: 72,
    review_required_delay: 12,
    require_manual_review: false,
    enabled: true,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bandId && isAdmin) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [bandId, isAdmin]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/moderation/settings/band/${bandId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(response.data);
    } catch (error) {
      console.error("Erreur chargement paramètres:", error);
      toast.error("Impossible de charger les paramètres");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await axios.put(
        `${API}/moderation/settings/band/${bandId}`,
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("✅ Paramètres sauvegardés");
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      toast.error("Échec de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (!window.confirm("Réinitialiser aux valeurs par défaut ?")) return;
    
    try {
      setSaving(true);
      await axios.post(
        `${API}/moderation/settings/band/${bandId}/reset`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Paramètres réinitialisés");
      await fetchSettings();
    } catch (error) {
      console.error("Erreur réinitialisation:", error);
      toast.error("Échec");
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <p className="text-sm text-yellow-400">
            Seul l'administrateur du groupe peut configurer la modération
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-primary" />
        <div>
          <h3 className="font-semibold text-lg">Modération du Groupe</h3>
          <p className="text-sm text-muted-foreground">
            Configuration pour {bandName}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Activation */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div>
            <Label className="font-medium">Modération automatique</Label>
            <p className="text-xs text-muted-foreground">
              Activer la modération des contenus du groupe
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
          />
        </div>

        {/* Délais */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Approb. auto (h)</Label>
            <Input
              type="number"
              min="0"
              value={settings.auto_approve_delay}
              onChange={(e) =>
                setSettings({ ...settings, auto_approve_delay: parseInt(e.target.value) || 0 })
              }
              className="bg-black/20 border-white/10 h-9 text-sm"
              disabled={!settings.enabled}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Revue (h)</Label>
            <Input
              type="number"
              min="0"
              value={settings.review_required_delay}
              onChange={(e) =>
                setSettings({ ...settings, review_required_delay: parseInt(e.target.value) || 0 })
              }
              className="bg-black/20 border-white/10 h-9 text-sm"
              disabled={!settings.enabled}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Rejet auto (h)</Label>
            <Input
              type="number"
              min="0"
              value={settings.auto_reject_delay}
              onChange={(e) =>
                setSettings({ ...settings, auto_reject_delay: parseInt(e.target.value) || 0 })
              }
              className="bg-black/20 border-white/10 h-9 text-sm"
              disabled={!settings.enabled}
            />
          </div>
        </div>

        {/* Revue manuelle */}
        <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Revue manuelle obligatoire</Label>
              <Switch
                checked={settings.require_manual_review}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, require_manual_review: checked })
                }
                disabled={!settings.enabled}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tous les contenus nécessiteront validation manuelle
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={saveSettings}
            disabled={saving || !settings.enabled}
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90 rounded-full"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-3 h-3 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
          <Button
            onClick={resetSettings}
            disabled={saving}
            size="sm"
            variant="outline"
            className="border-white/20 rounded-full"
          >
            <RotateCcw className="w-3 h-3 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
