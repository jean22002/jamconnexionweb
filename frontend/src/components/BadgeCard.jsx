import React from 'react';
import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';

const TIER_COLORS = {
  bronze: 'from-amber-700 to-amber-900',
  silver: 'from-gray-400 to-gray-600',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-purple-400 to-purple-600',
  legendary: 'from-orange-400 via-red-500 to-pink-600'
};

const TIER_GLOW = {
  bronze: 'shadow-amber-500/50',
  silver: 'shadow-gray-400/50',
  gold: 'shadow-yellow-400/50',
  platinum: 'shadow-purple-500/50',
  legendary: 'shadow-pink-500/50'
};

export default function BadgeCard({ badge, showProgress = false }) {
  const isUnlocked = badge.unlocked;

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:scale-105",
        isUnlocked 
          ? `bg-gradient-to-br ${TIER_COLORS[badge.tier]} shadow-lg ${TIER_GLOW[badge.tier]}`
          : "bg-gray-800 opacity-60"
      )}
    >
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center space-y-2">
          {/* Badge Icon */}
          <div className={cn(
            "text-5xl mb-2 transition-all",
            isUnlocked ? "filter-none" : "grayscale opacity-40"
          )}>
            {badge.icon}
          </div>

          {/* Badge Name */}
          <h3 className={cn(
            "font-bold text-lg",
            isUnlocked ? "text-white" : "text-gray-400"
          )}>
            {badge.is_secret && !isUnlocked ? "???" : badge.name}
          </h3>

          {/* Badge Description */}
          <p className={cn(
            "text-sm",
            isUnlocked ? "text-gray-100" : "text-gray-500"
          )}>
            {badge.is_secret && !isUnlocked ? "Badge secret" : badge.description}
          </p>

          {/* Tier Badge */}
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold uppercase",
            isUnlocked ? "bg-white/20 text-white" : "bg-gray-700 text-gray-400"
          )}>
            {badge.tier}
          </span>

          {/* Points */}
          {isUnlocked && (
            <div className="flex items-center space-x-1 text-yellow-300">
              <span className="text-lg">⭐</span>
              <span className="font-bold">{badge.points} pts</span>
            </div>
          )}

          {/* Progress Bar */}
          {showProgress && !isUnlocked && badge.progress !== undefined && (
            <div className="w-full mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progression</span>
                <span>{badge.progress}/{badge.requirement_value}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500"
                  style={{ width: `${badge.progress_percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Unlock Date */}
          {isUnlocked && badge.unlocked_at && (
            <p className="text-xs text-gray-300 mt-2">
              Débloqué le {new Date(badge.unlocked_at).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}