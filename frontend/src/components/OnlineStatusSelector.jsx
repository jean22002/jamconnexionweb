import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Loader2, Radio, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Composant pour gérer le statut "en ligne" de l'utilisateur
 * 3 modes disponibles:
 * - Auto: Détecté automatiquement selon l'activité
 * - Manuel: L'utilisateur contrôle son statut
 * - Désactivé: Le statut n'est jamais affiché
 */
export default function OnlineStatusSelector() {
  const { 
    mode, 
    isOnline, 
    manualStatus, 
    loading, 
    error, 
    updateMode, 
    toggleManualStatus 
  } = useOnlineStatus();

  const handleModeChange = async (newMode) => {
    try {
      await updateMode(newMode);
      toast.success(`Mode de statut mis à jour : ${getModeLabel(newMode)}`);
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du mode');
    }
  };

  const handleToggleManual = async () => {
    try {
      await toggleManualStatus();
      toast.success(`Statut mis à jour : ${!manualStatus ? 'En ligne' : 'Hors ligne'}`);
    } catch (err) {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const getModeLabel = (m) => {
    switch (m) {
      case 'auto': return 'Automatique';
      case 'manual': return 'Manuel';
      case 'disabled': return 'Désactivé';
      default: return m;
    }
  };

  if (loading && !mode) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 border border-white/10 rounded-xl bg-black/20">
      <div>
        <h3 className="font-heading font-semibold text-lg mb-1">Statut "En ligne"</h3>
        <p className="text-sm text-muted-foreground">
          Gérez votre visibilité en ligne pour les autres utilisateurs
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Status actuel */}
      <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2">
          {mode === 'disabled' ? (
            <EyeOff className="w-5 h-5 text-muted-foreground" />
          ) : isOnline ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">En ligne</span>
            </>
          ) : (
            <>
              <span className="h-3 w-3 rounded-full bg-gray-500"></span>
              <span className="text-sm font-medium text-muted-foreground">Hors ligne</span>
            </>
          )}
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          Mode : {getModeLabel(mode)}
        </div>
      </div>

      {/* Options de mode */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Mode de statut</Label>
        
        {/* Mode Automatique */}
        <button
          onClick={() => handleModeChange('auto')}
          disabled={loading}
          className={`w-full p-4 text-left border rounded-lg transition-all ${
            mode === 'auto'
              ? 'border-primary bg-primary/10'
              : 'border-white/10 hover:border-white/20 bg-black/20'
          }`}
        >
          <div className="flex items-start gap-3">
            <Radio className={`w-5 h-5 mt-0.5 ${mode === 'auto' ? 'text-primary' : 'text-muted-foreground'}`} />
            <div className="flex-1">
              <div className="font-medium">Automatique</div>
              <div className="text-sm text-muted-foreground mt-1">
                Votre statut est détecté automatiquement selon votre activité sur la plateforme
              </div>
            </div>
          </div>
        </button>

        {/* Mode Manuel */}
        <button
          onClick={() => handleModeChange('manual')}
          disabled={loading}
          className={`w-full p-4 text-left border rounded-lg transition-all ${
            mode === 'manual'
              ? 'border-primary bg-primary/10'
              : 'border-white/10 hover:border-white/20 bg-black/20'
          }`}
        >
          <div className="flex items-start gap-3">
            <Radio className={`w-5 h-5 mt-0.5 ${mode === 'manual' ? 'text-primary' : 'text-muted-foreground'}`} />
            <div className="flex-1">
              <div className="font-medium">Manuel</div>
              <div className="text-sm text-muted-foreground mt-1">
                Vous contrôlez vous-même quand vous apparaissez en ligne ou hors ligne
              </div>
            </div>
          </div>
        </button>

        {/* Mode Désactivé */}
        <button
          onClick={() => handleModeChange('disabled')}
          disabled={loading}
          className={`w-full p-4 text-left border rounded-lg transition-all ${
            mode === 'disabled'
              ? 'border-primary bg-primary/10'
              : 'border-white/10 hover:border-white/20 bg-black/20'
          }`}
        >
          <div className="flex items-start gap-3">
            <Radio className={`w-5 h-5 mt-0.5 ${mode === 'disabled' ? 'text-primary' : 'text-muted-foreground'}`} />
            <div className="flex-1">
              <div className="font-medium">Désactivé</div>
              <div className="text-sm text-muted-foreground mt-1">
                Votre statut en ligne ne sera jamais affiché aux autres utilisateurs
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Toggle manuel si en mode manuel */}
      {mode === 'manual' && (
        <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 space-y-3">
          <Label className="text-sm font-medium">Statut manuel</Label>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {manualStatus ? 'Vous apparaissez en ligne' : 'Vous apparaissez hors ligne'}
            </span>
            <Switch
              checked={manualStatus}
              onCheckedChange={handleToggleManual}
              disabled={loading}
            />
          </div>
        </div>
      )}

      {/* Informations supplémentaires */}
      <div className="text-xs text-muted-foreground space-y-1 p-3 bg-white/5 rounded-lg">
        <p>💡 <strong>Automatique</strong> : Vous apparaissez en ligne pendant 5 minutes après votre dernière activité</p>
        <p>💡 <strong>Manuel</strong> : Vous contrôlez totalement votre visibilité</p>
        <p>💡 <strong>Désactivé</strong> : Aucun statut ne sera affiché, même si vous êtes actif</p>
      </div>
    </div>
  );
}
