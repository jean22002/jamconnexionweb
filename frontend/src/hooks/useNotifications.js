import { useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Son de notification (data URL pour éviter les dépendances externes)
const NOTIFICATION_SOUND = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZUQ0MUqzn77BdGAg+m93z0H0pBSh+zPPaizsIGGS57OihUQ0LTKXh8bllHAU2jdXzzn0qBSh+zPPaizsIGGS57OihUQ0LTKXh8bllHAU2jdXzzn0qBSh+zPPaizsIGGS57OihUQ0LTKXh8bllHAU2jdXzzn0qBSh+zPPaizsIGGS57OihUQ0LTKXh8bllHAU2jdXzzn0qBSh+zPPaizsIGGS57OihUQ0LTKXh8bllHAU2jdXzzn0qBSh+zPPaizsIGGS57OihUQ0LTKXh8bllHAU2jdXzzn0qBSh+zPPaizsIGGS57OihUQ0LTKXh8bllHAU2jdXzzn0qBSh+zPPaizsIGGS57OihUQ0LTKXh8bllHAU2jdXzzn0qBSh+zPPaizsIGGS57OihUQ0LTKXh8bllHAU2jdXzzn0qBSh+zPPaizsIGGS57OihUQ0LTKXh8bllHAU2jdXzzn0qBSh+zPPaizsIGGS57OihUQ0LTKXh8bllHAU2jdXzzn0qBSh+zPPaizsIGGS57OihUQ0LTKXh8bllHAU2jdXzzn0qBSh+zPPaizsIGGS57OihUQ0LTKXh8bllHAU2jdXzzn0qBSh+zPPaizsIGGS57OihUQ0LTKXh8bllHAU2jdXzzn0qBSh+zPPaizsIGGS57OihUQ0LTKXh8bllHAU2jdXzzn0qBSh+zPPaizsIGGS57OihUQ0LTKXh8bllHAU2jdXzzn0qBSh+zPPaizsIGGS57OihUQ0LTKXh8bllHAU2jdXzzn0qBSh+zPPaizsIGGS57OihUQ0LTKXh8bllHAU2jdXzzn0qBSh+zPPaizsIGGS57OihUQ0LTKXh8bllHAU2jdXzzn0qBSh+zPPaizsIGGS57OihUQ==');

export const useNotifications = (token, user) => {
  const lastNotificationIdRef = useRef(null);
  const intervalRef = useRef(null);
  const serviceWorkerRef = useRef(null);

  // Demander la permission de notifications
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Ce navigateur ne supporte pas les notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  // Enregistrer le Service Worker
  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        serviceWorkerRef.current = registration;
        console.log('[App] Service Worker enregistré avec succès');
        
        // Enregistrer le background sync si disponible
        if ('sync' in registration) {
          console.log('[App] Background Sync disponible');
        }
        
        // Enregistrer le periodic sync si disponible (pour futures apps smartphone)
        if ('periodicSync' in registration) {
          console.log('[App] Periodic Background Sync disponible');
          try {
            await registration.periodicSync.register('update-notifications', {
              minInterval: 15 * 60 * 1000 // 15 minutes
            });
            console.log('[App] Periodic sync enregistré');
          } catch (err) {
            console.log('[App] Periodic sync non supporté:', err.message);
          }
        }
        
        // Écouter les messages du service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'SYNC_NOTIFICATIONS') {
            console.log('[App] Demande de sync des notifications depuis SW');
            // Rafraîchir les notifications
            window.dispatchEvent(new CustomEvent('refresh-notifications'));
          }
        });
        
        return registration;
      } catch (error) {
        console.error('[App] Erreur lors de l\'enregistrement du Service Worker:', error);
        return null;
      }
    }
    return null;
  }, []);

  // Afficher une notification avec son
  const showNotification = useCallback(async (title, options = {}) => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    // Jouer le son
    try {
      NOTIFICATION_SOUND.currentTime = 0;
      await NOTIFICATION_SOUND.play();
    } catch (error) {
      console.warn('Impossible de jouer le son de notification:', error);
    }

    // Afficher la notification
    if (serviceWorkerRef.current) {
      // Utiliser le Service Worker si disponible
      serviceWorkerRef.current.showNotification(title, {
        icon: '/logo192.png',
        badge: '/logo192.png',
        vibrate: [200, 100, 200],
        ...options
      });
    } else {
      // Fallback: notification directe
      new Notification(title, {
        icon: '/logo192.png',
        ...options
      });
    }
  }, [requestPermission]);

  // Vérifier les nouvelles notifications
  const checkNewNotifications = useCallback(async () => {
    if (!token) return;

    try {
      const response = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const notifications = response.data || [];
      if (notifications.length === 0) return;

      // Vérifier s'il y a de nouvelles notifications non lues
      const latestNotification = notifications.find(n => !n.read);
      
      if (latestNotification && latestNotification.id !== lastNotificationIdRef.current) {
        lastNotificationIdRef.current = latestNotification.id;
        
        // Afficher la notification avec son
        await showNotification(latestNotification.title, {
          body: latestNotification.message,
          tag: latestNotification.id,
          data: {
            url: latestNotification.link || '/'
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des notifications:', error);
    }
  }, [token, showNotification]);

  // Initialisation
  useEffect(() => {
    if (!token || !user) return;

    const init = async () => {
      // Demander la permission
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        console.warn('Permission de notifications refusée');
        return;
      }

      // Enregistrer le Service Worker
      await registerServiceWorker();

      // Vérifier les notifications immédiatement
      await checkNewNotifications();

      // Polling toutes les 30 secondes pour vérifier les nouvelles notifications
      intervalRef.current = setInterval(checkNewNotifications, 30000);
    };

    init();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [token, user, requestPermission, registerServiceWorker, checkNewNotifications]);

  return {
    showNotification,
    requestPermission
  };
};
