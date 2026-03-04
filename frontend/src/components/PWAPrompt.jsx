import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download, X, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function PWAPrompt() {
  const { user } = useAuth(); // Récupérer l'utilisateur connecté
  const { isOnline: userOnlineStatus } = useOnlineStatus(); // Statut en ligne contrôlé par l'utilisateur
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine); // Connexion internet
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  useEffect(() => {
    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Vérifier si l'utilisateur n'a pas déjà refusé
      const installDismissed = localStorage.getItem('pwa-install-dismissed');
      const installDismissedDate = localStorage.getItem('pwa-install-dismissed-date');
      
      // Réafficher après 7 jours
      if (installDismissed && installDismissedDate) {
        const daysSince = (Date.now() - parseInt(installDismissedDate)) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) {
          return;
        }
      }
      
      // Afficher après 30 secondes pour ne pas être intrusif
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 30000);
    };

    // Gérer le statut en ligne/hors ligne
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBanner(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Vérifier si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Afficher le prompt d'installation natif
    deferredPrompt.prompt();
    
    // Attendre que l'utilisateur réponde
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);
    
    if (outcome === 'dismissed') {
      localStorage.setItem('pwa-install-dismissed', 'true');
      localStorage.setItem('pwa-install-dismissed-date', Date.now().toString());
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    localStorage.setItem('pwa-install-dismissed-date', Date.now().toString());
  };

  const handleDismissOffline = () => {
    setShowOfflineBanner(false);
  };

  return (
    <>
      {/* Banner d'installation PWA */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
          <div className="glassmorphism rounded-2xl p-4 border border-white/10 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-primary" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">Installer Jam Connexion</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Accès rapide, notifications en temps réel et mode hors ligne
                </p>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleInstallClick}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 rounded-full text-xs"
                  >
                    Installer
                  </Button>
                  <Button
                    onClick={handleDismissInstall}
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                  >
                    Plus tard
                  </Button>
                </div>
              </div>
              
              <button
                onClick={handleDismissInstall}
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner hors ligne */}
      {showOfflineBanner && (
        <div className="fixed top-16 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-down">
          <div className="bg-orange-500/90 backdrop-blur-sm rounded-2xl p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <WifiOff className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
              
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-white mb-1">Mode hors ligne</h3>
                <p className="text-xs text-white/90">
                  Certaines fonctionnalités sont limitées. Les données en cache restent accessibles.
                </p>
              </div>
              
              <button
                onClick={handleDismissOffline}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indicateur en ligne (petit, discret) - UNIQUEMENT pour utilisateurs connectés */}
      {user && userOnlineStatus && showOfflineBanner === false && (
        <div className="fixed bottom-20 right-4 z-40">
          <div className="bg-green-500/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2 animate-fade-in">
            <Wifi className="w-3 h-3 text-white" />
            <span className="text-xs text-white font-medium">En ligne</span>
          </div>
        </div>
      )}
    </>
  );
}
