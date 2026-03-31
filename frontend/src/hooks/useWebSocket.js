import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

const WS_URL = process.env.REACT_APP_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://') || 'ws://localhost:8001';

/**
 * Hook personnalisé pour la connexion WebSocket temps réel
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
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 secondes

  // Keepalive ping every 30 seconds
  const pingIntervalRef = useRef(null);

  const connect = useCallback(() => {
    if (!token || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const wsUrl = `${WS_URL}/api/ws/notifications?token=${token}`;
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setConnected(true);
        setConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Start keepalive ping
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        if (showToasts) {
          toast.success('🔔 Notifications temps réel activées');
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 WebSocket message:', message);

          // Handle different message types
          switch (message.type) {
            case 'notification':
              handleNotification(message);
              if (onNotification) {
                onNotification(message);
              }
              break;

            case 'event':
              handleEvent(message);
              if (onEvent) {
                onEvent(message);
              }
              break;

            case 'connection_established':
              console.log('✅ Connection established:', message);
              break;

            case 'pong':
              // Keepalive response
              break;

            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('❌ WebSocket error:', event);
        setError('Erreur de connexion WebSocket');
      };

      ws.onclose = (event) => {
        console.log('❌ WebSocket closed:', event.code, event.reason);
        setConnected(false);
        setConnecting(false);

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt reconnection if not a normal closure
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(`🔄 Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Impossible de se reconnecter. Rechargez la page.');
          if (showToasts) {
            toast.error('Notifications temps réel déconnectées');
          }
        }
      };

    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError(err.message);
      setConnecting(false);
    }
  }, [token, onNotification, onEvent, showToasts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('WebSocket not connected, cannot send message');
    return false;
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
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
