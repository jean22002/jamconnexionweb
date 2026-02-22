import React from 'react';
import { Activity, CircleDot, EyeOff, Loader2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Switch } from './ui/switch';
import { toast } from 'sonner';

export default function OnlineStatusSettings() {
  const {
    mode,
    isOnline,
    manualStatus,
    loading,
    updateMode,
    toggleManualStatus
  } = useOnlineStatus();

  const handleModeChange = async (newMode) => {
    try {
      await updateMode(newMode);
      
      let message = '';
      if (newMode === 'auto') {
        message = 'Statut automatique activé : votre présence sera détectée automatiquement';
      } else if (newMode === 'manual') {
        message = 'Statut manuel activé : contrôlez votre visibilité manuellement';
      } else {
        message = 'Statut désactivé : vous n\'apparaîtrez jamais en ligne';
      }
      
      toast.success(message);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors du changement de mode');
    }
  };

  const handleToggleManual = async () => {
    try {
      await toggleManualStatus();
      toast.success(
        !manualStatus
          ? 'Vous êtes maintenant en ligne'
          : 'Vous êtes maintenant hors ligne'
      );
    } catch (error) {
      toast.error('Erreur lors du changement de statut');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Statut "En ligne"
        </CardTitle>
        <CardDescription>
          Gérez votre visibilité et contrôlez quand les autres peuvent voir que vous êtes actif
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode Selection */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Mode de statut</Label>
          <RadioGroup value={mode} onValueChange={handleModeChange}>
            {/* Auto Mode */}
            <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="auto" id="mode-auto" className="mt-1" />
              <div className="flex-1">
                <Label
                  htmlFor="mode-auto"
                  className="cursor-pointer font-medium flex items-center gap-2"
                >
                  <CircleDot className="w-4 h-4 text-green-500" />
                  Automatique (recommandé)
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Votre statut "En ligne" est détecté automatiquement en fonction de votre activité.
                  Vous apparaissez en ligne pendant que vous utilisez l'application et jusqu'à 5 minutes après votre dernière action.
                </p>
              </div>
            </div>

            {/* Manual Mode */}
            <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="manual" id="mode-manual" className="mt-1" />
              <div className="flex-1">
                <Label
                  htmlFor="mode-manual"
                  className="cursor-pointer font-medium flex items-center gap-2"
                >
                  <Activity className="w-4 h-4 text-blue-500" />
                  Manuel
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Contrôlez manuellement votre statut "En ligne" avec un bouton.
                  Vous décidez quand apparaître en ligne ou hors ligne, indépendamment de votre activité.
                </p>
              </div>
            </div>

            {/* Disabled Mode */}
            <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="disabled" id="mode-disabled" className="mt-1" />
              <div className="flex-1">
                <Label
                  htmlFor="mode-disabled"
                  className="cursor-pointer font-medium flex items-center gap-2"
                >
                  <EyeOff className="w-4 h-4 text-gray-500" />
                  Désactivé
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Votre statut "En ligne" n'est jamais affiché.
                  Vous restez invisible pour les autres utilisateurs, quelle que soit votre activité.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Manual Toggle (shown only in manual mode) */}
        {mode === 'manual' && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-semibold">Statut actuel</Label>
                <p className="text-sm text-muted-foreground">
                  {manualStatus ? (
                    <span className="flex items-center gap-2 text-green-600">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      En ligne
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-gray-500">
                      <span className="h-3 w-3 rounded-full bg-gray-400"></span>
                      Hors ligne
                    </span>
                  )}
                </p>
              </div>
              <Switch
                checked={manualStatus}
                onCheckedChange={handleToggleManual}
              />
            </div>
          </div>
        )}

        {/* Current Status Display */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Visible par les autres :</span>
            <span className={`font-semibold ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
              {isOnline ? 'Oui (En ligne)' : 'Non (Hors ligne)'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
