import React, { useState, useEffect } from 'react';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { RefreshCw, Info } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Composant pour gérer les paramètres d'actualisation en arrière-plan
 * Permet à l'utilisateur d'activer/désactiver le Periodic Background Sync
 */
export default function BackgroundSyncSettings() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(true);
  const [intervalMinutes, setIntervalMinutes] = useState(15);

  // Vérifier le support et l'état actuel
  useEffect(() => {
    checkBackgroundSyncSupport();
  }, []);

  const checkBackgroundSyncSupport = async () => {
    try {
      if (!('serviceWorker' in navigator)) {
        setIsSupported(false);
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      if ('periodicSync' in registration) {
        setIsSupported(true);
        
        // Vérifier si déjà enregistré
        const tags = await registration.periodicSync.getTags();
        const enabled = tags.includes('update-notifications');
        setIsEnabled(enabled);
        
        // Récupérer l'intervalle depuis localStorage
        const savedInterval = localStorage.getItem('backgroundSyncInterval');
        if (savedInterval) {
          setIntervalMinutes(parseInt(savedInterval));
        }
      } else {
        setIsSupported(false);
      }
    } catch (error) {
      console.error('Erreur vérification background sync:', error);
      setIsSupported(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleBackgroundSync = async (enabled) => {
    try {
      const registration = await navigator.serviceWorker.ready;

      if (enabled) {
        // Activer le periodic sync
        await registration.periodicSync.register('update-notifications', {
          minInterval: intervalMinutes * 60 * 1000
        });
        
        localStorage.setItem('backgroundSyncEnabled', 'true');
        localStorage.setItem('backgroundSyncInterval', intervalMinutes.toString());
        
        setIsEnabled(true);
        toast.success(`Actualisation en arrière-plan activée (toutes les ${intervalMinutes} minutes)`);
      } else {
        // Désactiver le periodic sync
        await registration.periodicSync.unregister('update-notifications');
        
        localStorage.setItem('backgroundSyncEnabled', 'false');
        
        setIsEnabled(false);
        toast.success('Actualisation en arrière-plan désactivée');
      }
    } catch (error) {
      console.error('Erreur toggle background sync:', error);
      toast.error('Erreur lors de la modification des paramètres');
    }
  };

  const updateInterval = async (minutes) => {
    setIntervalMinutes(minutes);
    
    if (isEnabled) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Réenregistrer avec le nouvel intervalle
        await registration.periodicSync.unregister('update-notifications');
        await registration.periodicSync.register('update-notifications', {
          minInterval: minutes * 60 * 1000
        });
        
        localStorage.setItem('backgroundSyncInterval', minutes.toString());
        toast.success(`Intervalle mis à jour : toutes les ${minutes} minutes`);
      } catch (error) {
        console.error('Erreur mise à jour intervalle:', error);
        toast.error('Erreur lors de la mise à jour de l\'intervalle');
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6 border border-white/10 rounded-xl bg-black/20">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-primary animate-spin" />
          <h3 className="font-heading font-semibold text-lg">Chargement...</h3>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="space-y-4 p-6 border border-orange-500/20 rounded-xl bg-orange-500/5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-orange-500 mt-0.5" />
          <div>
            <h3 className="font-heading font-semibold text-lg mb-1">
              Actualisation en arrière-plan non disponible
            </h3>
            <p className="text-sm text-muted-foreground">
              Cette fonctionnalité nécessite un navigateur compatible (Chrome, Edge, Opera sur Android).
              Les notifications et la synchronisation de base restent fonctionnelles.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 border border-white/10 rounded-xl bg-black/20">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <RefreshCw className="w-5 h-5 text-primary" />
          <h3 className="font-heading font-semibold text-lg">Actualisation en arrière-plan</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Actualisez automatiquement vos notifications même quand l'application est fermée
        </p>
      </div>

      {/* Toggle principal */}
      <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex-1">
          <Label className="text-base font-medium cursor-pointer">
            Activer l'actualisation automatique
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            {isEnabled 
              ? `Actif - Vérifie les nouvelles notifications toutes les ${intervalMinutes} minutes`
              : 'Désactivé - Actualisation uniquement quand l\'app est ouverte'
            }
          </p>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={toggleBackgroundSync}
          className="ml-4"
        />
      </div>

      {/* Sélection de l'intervalle */}
      {isEnabled && (
        <div className="space-y-3 p-4 border border-white/10 rounded-lg bg-white/5">
          <Label className="text-sm font-medium">Fréquence d'actualisation</Label>
          <div className="grid grid-cols-3 gap-2">
            {[15, 30, 60].map((minutes) => (
              <button
                key={minutes}
                onClick={() => updateInterval(minutes)}
                className={`p-3 rounded-lg border transition-all ${
                  intervalMinutes === minutes
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-white/10 hover:border-white/20 bg-black/20'
                }`}
              >
                <div className="text-sm font-medium">
                  {minutes === 60 ? '1 heure' : `${minutes} min`}
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Un intervalle plus long économise la batterie de votre appareil
          </p>
        </div>
      )}

      {/* Informations supplémentaires */}
      <div className="text-xs text-muted-foreground space-y-1 p-3 bg-white/5 rounded-lg border border-white/10">
        <p className="flex items-start gap-2">
          <span>📱</span>
          <span><strong>Comment ça marche ?</strong> Votre appareil vérifie automatiquement les nouvelles notifications à intervalles réguliers, même si l'application est fermée.</span>
        </p>
        <p className="flex items-start gap-2">
          <span>🔋</span>
          <span><strong>Impact batterie :</strong> Minimal. Le système d'exploitation gère intelligemment les synchronisations pour préserver votre batterie.</span>
        </p>
        <p className="flex items-start gap-2">
          <span>🔒</span>
          <span><strong>Confidentialité :</strong> Les vérifications se font de manière sécurisée via votre connexion chiffrée. Aucune donnée n'est partagée avec des tiers.</span>
        </p>
      </div>

      {/* Informations de statut */}
      {isEnabled && (
        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span>Actualisation en arrière-plan active</span>
        </div>
      )}
    </div>
  );
}
