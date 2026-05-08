import React, { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export default function PushNotificationPrompt() {
  const { user, token } = useAuth();
  const { isSupported, permission, isSubscribed, subscribe, sendTestNotification } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Ne montrer le prompt que si l'utilisateur est connecté
    if (!user || !token) {
      return;
    }

    // Vérifier si l'utilisateur a déjà vu le prompt
    const hasSeenPrompt = localStorage.getItem('push_notification_prompt_seen');
    
    // Afficher le prompt seulement si :
    // 1. L'utilisateur est connecté
    // 2. Les notifications sont supportées
    // 3. L'utilisateur n'a pas encore donné de permission
    // 4. L'utilisateur n'a pas déjà vu le prompt
    if (isSupported && permission === 'default' && !hasSeenPrompt && !isSubscribed) {
      // Attendre 5 secondes avant d'afficher le prompt
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isSupported, permission, isSubscribed, user, token]);

  const handleSubscribe = async () => {
    try {
      await subscribe();
      toast.success('Notifications activées ! 🔔', {
        description: 'Vous recevrez désormais des notifications pour vos messages, amis et badges.'
      });
      
      // Envoyer une notification de test
      setTimeout(() => {
        sendTestNotification();
      }, 1000);
      
      localStorage.setItem('push_notification_prompt_seen', 'true');
      setShowPrompt(false);
    } catch (error) {
      toast.error('Erreur', {
        description: 'Impossible d\'activer les notifications. Vérifiez les permissions de votre navigateur.'
      });
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push_notification_prompt_seen', 'true');
    setShowPrompt(false);
    setDismissed(true);
  };

  if (!showPrompt || dismissed || !isSupported || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <Card className="border-2 border-primary/20 shadow-2xl shadow-primary/10 bg-gray-900">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Activer les notifications</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Restez informé en temps réel
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-300">
            Recevez des notifications pour :
          </p>
          <ul className="text-sm text-gray-400 space-y-1.5">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Nouveaux messages
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Demandes d'amis
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Badges débloqués
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Événements à venir
            </li>
          </ul>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSubscribe}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Activer
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="flex-1"
            >
              Plus tard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}