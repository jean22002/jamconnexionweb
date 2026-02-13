import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function BadgeStats({ stats }) {
  if (!stats) return null;

  const tierOrder = ['legendary', 'platinum', 'gold', 'silver', 'bronze'];
  const tierEmoji = {
    legendary: '🏆',
    platinum: '💎',
    gold: '🥇',
    silver: '🥈',
    bronze: '🥉'
  };

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5 mb-6">
      {/* Level Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Niveau</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.level}</div>
          <div className="w-full bg-white/20 rounded-full h-2 mt-2">
            <div 
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.level_progress}%` }}
            />
          </div>
          <p className="text-xs text-white/80 mt-1">
            {Math.round(stats.level_progress)}% vers niveau {stats.level + 1}
          </p>
        </CardContent>
      </Card>

      {/* Points Card */}
      <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Points Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.total_points}</div>
          <p className="text-xs text-white/80 mt-1">
            {stats.next_level_points - stats.total_points} pts pour niveau {stats.level + 1}
          </p>
        </CardContent>
      </Card>

      {/* Badges Count Card */}
      <Card className="bg-gradient-to-br from-green-500 to-teal-500 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.badges_count}</div>
          <p className="text-xs text-white/80 mt-1">badges débloqués</p>
        </CardContent>
      </Card>

      {/* Badges by Tier */}
      {tierOrder.slice(0, 2).map(tier => (
        <Card key={tier} className="bg-gray-800 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium capitalize flex items-center gap-1">
              {tierEmoji[tier]} {tier}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.badges_by_tier[tier] || 0}</div>
            <p className="text-xs text-gray-400 mt-1">badges {tier}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}