import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { Settings, RotateCcw, Save, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ModerationSettingsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [settings, setSettings] = useState({
    auto_ban_report_threshold: 5,
    temp_ban_duration_days: 7,
    pioneer_badge_threshold: 100,
    social_butterfly_participation_threshold: 10,
    jam_master_participation_threshold: 25,
    notification_radius_default_km: 50,
    nearby_musician_radius_km: 70,
    auto_review_threshold: 3
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API}/admin/moderation-settings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/admin/moderation-settings`,
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Paramètres enregistrés avec succès !');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de l\'enregistrement des paramètres');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres aux valeurs par défaut ?')) {
      return;
    }

    setResetting(true);
    try {
      await axios.post(
        `${API}/admin/moderation-settings/reset`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Paramètres réinitialisés aux valeurs par défaut');
      fetchSettings();
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Erreur lors de la réinitialisation');
    } finally {
      setResetting(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: parseInt(value) || 0
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="font-heading font-bold text-3xl">Paramètres de modération</h1>
          </div>
          <p className="text-muted-foreground">
            Configurez les seuils de modération, badges et notifications pour la plateforme
          </p>
        </div>

        {/* Moderation Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Modération et signalements</CardTitle>
            <CardDescription>
              Configurez les seuils de signalement et de bannissement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="auto_ban">Seuil de bannissement automatique</Label>
              <Input
                id="auto_ban"
                type="number"
                min="1"
                value={settings.auto_ban_report_threshold}
                onChange={(e) => handleChange('auto_ban_report_threshold', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nombre de signalements avant bannissement automatique
              </p>
            </div>

            <div>
              <Label htmlFor="auto_review">Seuil de révision automatique</Label>
              <Input
                id="auto_review"
                type="number"
                min="1"
                value={settings.auto_review_threshold}
                onChange={(e) => handleChange('auto_review_threshold', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nombre de signalements avant révision manuelle requise
              </p>
            </div>

            <div>
              <Label htmlFor="temp_ban">Durée du bannissement temporaire (jours)</Label>
              <Input
                id="temp_ban"
                type="number"
                min="1"
                value={settings.temp_ban_duration_days}
                onChange={(e) => handleChange('temp_ban_duration_days', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Durée en jours d'un bannissement temporaire
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* Gamification Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Badges et gamification</CardTitle>
            <CardDescription>
              Configurez les seuils pour débloquer les badges
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pioneer">Badge Pionnier</Label>
              <Input
                id="pioneer"
                type="number"
                min="1"
                value={settings.pioneer_badge_threshold}
                onChange={(e) => handleChange('pioneer_badge_threshold', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nombre max d'utilisateurs pouvant obtenir le badge Pionnier
              </p>
            </div>

            <div>
              <Label htmlFor="social">Badge Social Butterfly</Label>
              <Input
                id="social"
                type="number"
                min="1"
                value={settings.social_butterfly_participation_threshold}
                onChange={(e) => handleChange('social_butterfly_participation_threshold', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nombre d'événements à participer pour obtenir le badge
              </p>
            </div>

            <div>
              <Label htmlFor="jam_master">Badge Jam Master</Label>
              <Input
                id="jam_master"
                type="number"
                min="1"
                value={settings.jam_master_participation_threshold}
                onChange={(e) => handleChange('jam_master_participation_threshold', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nombre de bœufs à participer pour obtenir le badge
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* Notification Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notifications géolocalisées</CardTitle>
            <CardDescription>
              Configurez les rayons de notification par défaut
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="melomane_radius">Rayon par défaut (Mélomanes)</Label>
              <Input
                id="melomane_radius"
                type="number"
                min="1"
                value={settings.notification_radius_default_km}
                onChange={(e) => handleChange('notification_radius_default_km', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Rayon de notification par défaut pour les mélomanes (km)
              </p>
            </div>

            <div>
              <Label htmlFor="musician_radius">Rayon de notification (Musiciens)</Label>
              <Input
                id="musician_radius"
                type="number"
                min="1"
                value={settings.nearby_musician_radius_km}
                onChange={(e) => handleChange('nearby_musician_radius_km', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Rayon pour notifier les musiciens des événements à proximité (km)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            disabled={resetting || saving}
          >
            {resetting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-2" />
            )}
            Réinitialiser
          </Button>
          <Button
            onClick={saveSettings}
            disabled={saving || resetting}
            className="bg-primary hover:bg-primary/90"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </div>

        {settings.updated_at && (
          <p className="text-xs text-muted-foreground mt-4 text-right">
            Dernière mise à jour : {new Date(settings.updated_at).toLocaleString('fr-FR')}
          </p>
        )}
      </div>
    </div>
  );
}
