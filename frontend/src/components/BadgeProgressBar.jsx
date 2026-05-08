import React from 'react';
import { TrendingUp, Lock } from 'lucide-react';

/**
 * Barre de progression vers le prochain badge
 * Affiche la progression actuelle et le badge à débloquer
 */
export default function BadgeProgressBar({ badge, currentProgress, showDetails = true }) {
  const percentage = Math.min(
    ((currentProgress || 0) / (badge.requirement_value || 1)) * 100,
    100
  );

  const isUnlocked = badge.unlocked || percentage >= 100;

  return (
    <div className={`glassmorphism rounded-xl p-4 ${isUnlocked ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        {/* Badge Icon */}
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
            isUnlocked
              ? 'bg-gradient-to-br from-yellow-400/20 via-orange-400/20 to-red-400/20'
              : 'bg-gradient-to-br from-gray-400/20 to-gray-600/20'
          }`}
        >
          {isUnlocked ? badge.icon : <Lock className="w-5 h-5 text-muted-foreground" />}
        </div>

        {/* Badge Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm truncate">{badge.name}</h4>
            {!isUnlocked && (
              <span className="text-xs text-muted-foreground">
                +{badge.points} pts
              </span>
            )}
          </div>
          
          {showDetails && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {badge.description}
            </p>
          )}
        </div>

        {/* Status */}
        {isUnlocked ? (
          <div className="flex-shrink-0 text-xs font-semibold text-green-500">
            Débloqué ✓
          </div>
        ) : (
          <div className="flex-shrink-0 text-xs font-semibold text-primary">
            {Math.round(percentage)}%
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {!isUnlocked && (
        <>
          <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>

          {/* Progress Text */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <span>
                {currentProgress || 0} / {badge.requirement_value}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              Encore {Math.max(0, badge.requirement_value - (currentProgress || 0))} à faire
            </span>
          </div>
        </>
      )}
    </div>
  );
}
