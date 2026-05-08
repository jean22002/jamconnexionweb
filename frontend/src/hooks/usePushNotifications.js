import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_BACKEND_URL;

// Clé VAPID publique - générée avec py_vapid
const VAPID_PUBLIC_KEY = 'BEeRFe_n_8rtLRIiR8fO6CtMfF8w88Vs2Xsb95WHuWUCilhoaKjO4DYMHjprm1rbOrHbrq66xBw5MT4r8U2ncw4';

export function usePushNotifications() {
  const { token, user } = useAuth();
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si les notifications push sont supportées
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      // Vérifier la permission actuelle
      setPermission(Notification.permission);
      
      // Vérifier si l'utilisateur est déjà abonné
      checkExistingSubscription();
    } else {
      setLoading(false);
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setSubscription(existingSubscription);
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return 'denied';
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = async () => {
    try {
      setLoading(true);

      // Demander la permission si nécessaire
      let perm = permission;
      if (perm === 'default') {
        perm = await requestPermission();
      }

      if (perm !== 'granted') {
        throw new Error('Permission denied');
      }

      // Enregistrer le service worker
      const registration = await navigator.serviceWorker.ready;

      // S'abonner aux notifications push
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      setSubscription(sub);
      setIsSubscribed(true);

      // Envoyer l'abonnement au serveur
      if (token) {
        await savePushSubscription(sub);
      }

      return sub;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    try {
      setLoading(true);

      if (!subscription) {
        return;
      }

      // Se désabonner
      await subscription.unsubscribe();
      
      // Supprimer du serveur
      if (token) {
        await removePushSubscription(subscription);
      }

      setSubscription(null);
      setIsSubscribed(false);
    } catch (error) {
      console.error('Error unsubscribing:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const savePushSubscription = async (sub) => {
    try {
      const response = await fetch(`${API}/api/notifications/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          user_agent: navigator.userAgent,
          platform: navigator.platform
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
      throw error;
    }
  };

  const removePushSubscription = async (sub) => {
    try {
      await fetch(`${API}/api/notifications/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: sub.endpoint
        })
      });
    } catch (error) {
      console.error('Error removing subscription:', error);
    }
  };

  const sendTestNotification = () => {
    if (permission === 'granted' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification('Test Notification', {
          body: 'Ceci est une notification de test',
          icon: '/logo192.png',
          badge: '/logo192.png',
          vibrate: [200, 100, 200]
        });
      });
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    requestPermission,
    sendTestNotification
  };
}