import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Bell, BellOff, Smartphone, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function NotificationSettingsPage() {
  const { token } = useAuth();
  const { 
    isSupported, 
    permission, 
    isSubscribed, 
    loading: pushLoading,
    subscribe, 
    unsubscribe,
    sendTestNotification 
  } = usePushNotifications();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotificationStatus();
  }, [isSubscribed]);

  const fetchNotificationStatus = async () => {
    try {
      const response = await fetch(`${API}/api/notifications/push/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePush = async (enabled) => {
    try {
      if (enabled) {
        await subscribe();
        toast.success('Notifications activées !', {
          description: 'Vous recevrez maintenant des notifications push.'
        });
        sendTestNotification();
      } else {
        await unsubscribe();
        toast.success('Notifications désactivées', {
          description: 'Vous ne recevrez plus de notifications push.'
        });
      }
      await fetchNotificationStatus();
    } catch (error) {
      toast.error('Erreur', {
        description: 'Impossible de modifier les paramètres de notification.'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <Bell className="w-10 h-10 text-primary" />
            Notifications
          </h1>
          <p className="text-gray-400">Gérez vos préférences de notifications</p>
        </div>

        {/* Push Notifications Card */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  Notifications Push
                </CardTitle>
                <CardDescription className="mt-1">
                  Recevez des notifications même quand l'application est fermée
                </CardDescription>
              </div>
              {isSupported && permission === 'granted' && (
                <Switch
                  checked={isSubscribed}
                  onCheckedChange={handleTogglePush}
                  disabled={pushLoading}
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2 text-sm">
              {isSupported ? (
                permission === 'granted' ? (
                  isSubscribed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-green-500">Activé</span>
                    </>
                  ) : (
                    <>
                      <BellOff className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">Désactivé</span>
                    </>
                  )
                ) : permission === 'denied' ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-500">Permission refusée</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-500">Permission requise</span>
                  </>
                )
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-500">Non supporté par ce navigateur</span>
                </>
              )}
            </div>

            {/* Device Info */}
            {status && status.subscribed && (
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Appareils connectés</p>
                <div className="space-y-2">
                  {status.subscriptions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-300">{sub.platform || 'Appareil'}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(sub.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {isSupported && (
              <div className="flex gap-2 pt-2">
                {permission === 'default' && (
                  <Button
                    onClick={() => handleTogglePush(true)}
                    disabled={pushLoading}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {pushLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Bell className="w-4 h-4 mr-2" />
                    )}
                    Activer les notifications
                  </Button>
                )}
                {permission === 'denied' && (
                  <div className="text-sm text-gray-400">
                    <p className="mb-2">Vous avez refusé les notifications.</p>
                    <p>Pour les activer, modifiez les paramètres de votre navigateur.</p>
                  </div>
                )}
                {permission === 'granted' && isSubscribed && (
                  <Button
                    onClick={sendTestNotification}
                    variant="outline"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Envoyer une notification de test
                  </Button>
                )}
              </div>
            )}

            {!isSupported && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-sm text-red-400">
                  Votre navigateur ne supporte pas les notifications push. 
                  Essayez avec Chrome, Firefox, ou Edge.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Types Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Types de notifications</CardTitle>
            <CardDescription>
              Recevez des notifications pour ces événements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="msg-notif" className="flex flex-col gap-1 cursor-pointer">
                <span className="font-medium">Nouveaux messages</span>
                <span className="text-sm text-gray-400">Quand vous recevez un message</span>
              </Label>
              <Switch id="msg-notif" defaultChecked disabled={!isSubscribed} />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="friend-notif" className="flex flex-col gap-1 cursor-pointer">
                <span className="font-medium">Demandes d'amis</span>
                <span className="text-sm text-gray-400">Quand quelqu'un vous envoie une demande</span>
              </Label>
              <Switch id="friend-notif" defaultChecked disabled={!isSubscribed} />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="badge-notif" className="flex flex-col gap-1 cursor-pointer">
                <span className="font-medium">Badges débloqués</span>
                <span className="text-sm text-gray-400">Quand vous débloquez un nouveau badge</span>
              </Label>
              <Switch id="badge-notif" defaultChecked disabled={!isSubscribed} />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="event-notif" className="flex flex-col gap-1 cursor-pointer">
                <span className="font-medium">Événements à venir</span>
                <span className="text-sm text-gray-400">Rappels pour vos événements</span>
              </Label>
              <Switch id="event-notif" defaultChecked disabled={!isSubscribed} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
