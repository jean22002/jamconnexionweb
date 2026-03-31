import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import io from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

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
      console.log('🔌 Connecting to Socket.IO:', BACKEND_URL);
      
      const socket = io(BACKEND_URL, {
        auth: { token },
        transports: ['websocket', 'polling'], // Essaie WebSocket puis fallback sur polling
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
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
        setError(`Erreur de connexion: ${err.message}`);
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

  // Map notification types to user-friendly messages
  const notificationMessages = {
    'new_invitation': `🎸 Nouvelle invitation : ${data.band_name || 'groupe'}`,
    'new_event': `🎤 Nouvel événement : ${data.event_type || 'événement'}`,
    'new_application': `📝 Nouvelle candidature pour ${data.event_name || 'événement'}`,
    'new_message': `💬 Nouveau message de ${data.from_name || 'utilisateur'}`,
    'event_reminder': `⏰ Rappel : ${data.event_name} dans ${data.hours_until}h`,
    'band_update': `👥 ${data.band_name} : ${data.message}`,
    'subscription_expiring': `⚠️ Votre abonnement expire dans ${data.days_remaining} jours`,
  };

  const message_text = notificationMessages[notification_type] || `🔔 ${notification_type}`;

  toast(message_text, {
    duration: 5000,
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
