import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import io from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
// CRITICAL: Socket.IO path must match backend mount point (/api/socket.io)
const SOCKET_IO_PATH = '/api/socket.io';

/**
 * Hook personnalisé pour les notifications temps réel via Socket.IO
 * 
 * @param {string} token - JWT token pour l'authentification
 * @param {Object} options - Options de configuration
 * @param {Function} options.onNotification - Callback pour les notifications
 * @param {Function} options.onEvent - Callback pour les événements
 * @param {boolean} options.autoConnect - Se connecter automatiquement (défaut: true)
 * @param {boolean} options.showToasts - Afficher les toasts automatiquement (défaut: true)
 * 
 * @returns {Object} { connected, connecting, error, sendMessage, reconnect, disconnect }
 */
export function useWebSocket(token, options = {}) {
  const {
    onNotification,
    onEvent,
    autoConnect = true,
    showToasts = true,
  } = options;

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  
  const socketRef = useRef(null);

  const connect = useCallback(() => {
    if (!token || socketRef.current?.connected) {
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      console.log('🔌 Connecting to Socket.IO:', BACKEND_URL + SOCKET_IO_PATH);
      
      const socket = io(BACKEND_URL, {
        path: SOCKET_IO_PATH,  // CRITICAL: Must match backend mount point
        auth: { token },
        transports: ['websocket', 'polling'], // WebSocket + polling fallback
        reconnection: true,
        reconnectionAttempts: Infinity,  // Toujours essayer de reconnecter
        reconnectionDelay: 1000,         // Retry rapide (1s)
        reconnectionDelayMax: 5000,      // Max 5s entre tentatives
        timeout: 20000,
        upgrade: true,                   // Permettre upgrade HTTP → WS
        rememberUpgrade: true,           // Se souvenir que WS fonctionne
      });
      
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Socket.IO connected');
        setConnected(true);
        setConnecting(false);
        setError(null);

        if (showToasts) {
          toast.success('🔔 Notifications temps réel activées');
        }
      });

      socket.on('notification', (message) => {
        console.log('📨 Notification reçue:', message);
        handleNotification(message);
        if (onNotification) {
          onNotification(message);
        }
      });

      socket.on('event', (message) => {
        console.log('📢 Événement reçu:', message);
        handleEvent(message);
        if (onEvent) {
          onEvent(message);
        }
      });

      socket.on('connect_error', (err) => {
        console.error('❌ Socket.IO connection error:', err.message);
        
        // Gestion des erreurs d'authentification
        if (err.message.includes('token') || err.message.includes('401') || err.message.includes('authentication')) {
          console.warn('⚠️ Token invalide ou expiré, déconnexion Socket.IO');
          setError('Session expirée - Veuillez vous reconnecter');
          
          // Option : Rafraîchir automatiquement le token (à implémenter)
          // refreshAuthToken().then(newToken => { ... });
        } else {
          setError(`Erreur de connexion: ${err.message}`);
        }
        
        setConnecting(false);
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Socket.IO disconnected:', reason);
        setConnected(false);
        setConnecting(false);

        if (reason === 'io server disconnect') {
          // Le serveur a forcé la déconnexion, il faut se reconnecter manuellement
          socket.connect();
        }
      });

    } catch (err) {
      console.error('Error creating Socket.IO connection:', err);
      setError(err.message);
      setConnecting(false);
    }
  }, [token, onNotification, onEvent, showToasts]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnected(false);
  }, []);

  const sendMessage = useCallback((eventName, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(eventName, data);
      return true;
    }
    console.warn('Socket.IO not connected, cannot send message');
    return false;
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => connect(), 500);
  }, [connect, disconnect]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, autoConnect]); // Only reconnect if token changes

  return {
    connected,
    connecting,
    error,
    sendMessage,
    reconnect,
    disconnect,
  };
}

// Helper function to handle notifications
function handleNotification(message) {
  const { notification_type, data } = message;

  // Map notification types to user-friendly messages with emojis
  const notificationMessages = {
    'new_invitation': {
      message: `🎸 ${data.band_name || 'Un groupe'} vous invite à rejoindre leur groupe`,
      duration: 6000
    },
    'new_event': {
      message: `🎤 Nouvel événement : ${data.event_type || 'événement'}`,
      duration: 5000
    },
    'new_application': {
      message: `📝 ${data.musician_name} a postulé pour ${data.event_name}`,
      duration: 6000
    },
    'application_status': {
      message: data.status === 'accepted' 
        ? `✅ Candidature acceptée pour ${data.event_name} chez ${data.venue_name}` 
        : `❌ Candidature non retenue pour ${data.event_name}`,
      duration: 7000
    },
    'new_message': {
      message: `💬 Nouveau message de ${data.from_name || 'un utilisateur'}`,
      duration: 5000
    },
    'new_subscriber': {
      message: `🔔 ${data.subscriber_name} s'est abonné à votre établissement`,
      duration: 5000
    },
    'new_slot_available': {
      message: `📅 Nouvelle offre chez ${data.venue_name} le ${data.slot_date}`,
      duration: 6000
    },
    'badge_unlocked': {
      message: `🏆 Badge débloqué : ${data.badge_name}`,
      duration: 8000
    },
    'event_reminder': {
      message: `⏰ Rappel : ${data.event_name} dans ${data.hours_until}h`,
      duration: 6000
    },
    'band_update': {
      message: `👥 ${data.band_name} : ${data.message}`,
      duration: 5000
    },
    'subscription_expiring': {
      message: `⚠️ Votre abonnement expire dans ${data.days_remaining} jours`,
      duration: 7000
    },
  };

  const config = notificationMessages[notification_type] || {
    message: `🔔 ${notification_type}`,
    duration: 5000
  };

  toast(config.message, {
    duration: config.duration,
    action: data.action_url ? {
      label: 'Voir',
      onClick: () => window.location.href = data.action_url,
    } : undefined,
  });
}

// Helper function to handle events
function handleEvent(message) {
  const { event_type, data } = message;
  console.log(`📢 Event: ${event_type}`, data);

  // Events are typically for real-time updates without explicit user notification
  // They can be used to refresh data, update UI, etc.
}

export default useWebSocket;
