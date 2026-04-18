import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';

/**
 * Composant Badge de notification avec compteur
 * Affiche un badge rouge avec le nombre de notifications non-lues
 */
const NotificationBadge = ({ count = 0, onClick, className = '' }) => {
  const displayCount = count > 99 ? '99+' : count;
  const hasUnread = count > 0;

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`relative ${className}`}
      aria-label={`Notifications ${hasUnread ? `(${count} non lues)` : ''}`}
    >
      <Bell className={`w-5 h-5 ${hasUnread ? 'text-primary animate-pulse' : ''}`} />
      
      {hasUnread && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full animate-bounce">
          {displayCount}
        </span>
      )}
    </Button>
  );
};

export default NotificationBadge;
