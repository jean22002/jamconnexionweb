import { Wifi, WifiOff } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

/**
 * Indicateur de connexion WebSocket
 * Affiche un petit badge indiquant l'état de la connexion temps réel
 */
export default function WebSocketIndicator({ token }) {
  const { connected, connecting, error } = useWebSocket(token, {
    autoConnect: true,
    showToasts: false, // N'affiche pas les toasts pour éviter le spam
  });

  if (!token) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium
          backdrop-blur-sm border transition-all
          ${connected ? 'bg-green-500/20 border-green-500/30 text-green-400' :
            connecting ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
            'bg-red-500/20 border-red-500/30 text-red-400'}
        `}
        title={error || (connected ? 'Connecté' : connecting ? 'Connexion...' : 'Déconnecté')}
      >
        {connected ? (
          <>
            <Wifi className="w-3 h-3" />
            <span>Temps réel</span>
          </>
        ) : connecting ? (
          <>
            <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Connexion...</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            <span>Hors ligne</span>
          </>
        )}
      </div>
    </div>
  );
}
