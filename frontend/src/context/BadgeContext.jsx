import React, { createContext, useContext, useState, useCallback } from 'react';
import BadgeUnlockToast from '../components/BadgeUnlockToast';

const BadgeContext = createContext();

export const useBadge = () => {
  const context = useContext(BadgeContext);
  if (!context) {
    throw new Error('useBadge must be used within a BadgeProvider');
  }
  return context;
};

export const BadgeProvider = ({ children }) => {
  const [toastBadges, setToastBadges] = useState([]);

  const showBadgeToast = useCallback((badge) => {
    const badgeWithId = {
      ...badge,
      toastId: Date.now() + Math.random() // ID unique pour chaque toast
    };
    setToastBadges(prev => [...prev, badgeWithId]);
  }, []);

  const removeBadgeToast = useCallback((toastId) => {
    setToastBadges(prev => prev.filter(b => b.toastId !== toastId));
  }, []);

  const showMultipleBadges = useCallback((badges) => {
    if (!badges || badges.length === 0) return;
    
    // Afficher les badges un par un avec un délai
    badges.forEach((badge, index) => {
      setTimeout(() => {
        showBadgeToast(badge);
      }, index * 1000); // 1 seconde entre chaque toast
    });
  }, [showBadgeToast]);

  return (
    <BadgeContext.Provider value={{ showBadgeToast, showMultipleBadges }}>
      {children}
      {/* Render all active toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-4">
        {toastBadges.map((badge, index) => (
          <div 
            key={badge.toastId}
            style={{ 
              marginTop: `${index * 120}px` // Stack toasts vertically
            }}
          >
            <BadgeUnlockToast
              badge={badge}
              onClose={() => removeBadgeToast(badge.toastId)}
            />
          </div>
        ))}
      </div>
    </BadgeContext.Provider>
  );
};
