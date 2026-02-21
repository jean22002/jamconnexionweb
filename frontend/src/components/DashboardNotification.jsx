import { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';

export default function DashboardNotification() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleNewNotification = (event) => {
      const notification = event.detail.notification;
      
      // Ajouter la notification à la liste
      const notifWithId = {
        ...notification,
        displayId: Date.now() + Math.random(), // ID unique pour la gestion de l'affichage
        createdAt: Date.now()
      };
      
      setNotifications(prev => [...prev, notifWithId]);
      
      // Auto-dismiss après 5 secondes
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.displayId !== notifWithId.displayId));
      }, 5000);
    };

    window.addEventListener('new-notification-received', handleNewNotification);

    return () => {
      window.removeEventListener('new-notification-received', handleNewNotification);
    };
  }, []);

  const handleDismiss = (displayId) => {
    setNotifications(prev => prev.filter(n => n.displayId !== displayId));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
      {notifications.map((notif) => (
        <div
          key={notif.displayId}
          className="glassmorphism border-2 border-primary/30 rounded-xl p-4 shadow-2xl animate-in slide-in-from-top-5 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-foreground mb-1 line-clamp-1">
                {notif.title}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {notif.message}
              </p>
            </div>

            <button
              onClick={() => handleDismiss(notif.displayId)}
              className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              aria-label="Fermer la notification"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
