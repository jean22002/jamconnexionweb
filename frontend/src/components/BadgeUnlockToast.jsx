import React, { useEffect, useState } from 'react';
import { X, Award, Sparkles } from 'lucide-react';

/**
 * Toast discret pour afficher le déverrouillage d'un badge
 * Apparaît en haut à droite avec une animation
 */
export default function BadgeUnlockToast({ badge, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    setTimeout(() => setIsVisible(true), 100);

    // Auto-close après 5 secondes
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
      style={{ maxWidth: '400px' }}
    >
      <div className="glassmorphism rounded-2xl p-4 shadow-2xl border-2 border-primary/50 neon-border relative overflow-hidden">
        {/* Sparkle background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 animate-pulse" />
        
        <div className="relative flex items-start gap-4">
          {/* Badge Icon */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 flex items-center justify-center text-3xl shadow-lg animate-bounce">
              {badge.icon}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold text-sm">Badge Débloqué !</h3>
              </div>
              <button
                onClick={handleClose}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="font-bold text-foreground mb-1">{badge.name}</p>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {badge.description}
            </p>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-primary">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">+{badge.points} pts</span>
              </div>
              
              <button
                onClick={handleClose}
                className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Voir mes badges →
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar animation */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent animate-progress"
            style={{
              animation: 'progress 5s linear forwards'
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
