import React, { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const API = process.env.REACT_APP_BACKEND_URL;

export default function UserBadges({ userId, token, limit = 5 }) {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserBadges();
  }, [userId, token]);

  const fetchUserBadges = async () => {
    try {
      // Si userId est fourni, récupérer les badges de cet utilisateur (endpoint public)
      // Sinon, récupérer les badges de l'utilisateur connecté
      const endpoint = userId 
        ? `${API}/api/badges/user/${userId}`
        : `${API}/api/badges/my-badges`;
      
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setBadges(data.slice(0, limit));
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Award className="w-4 h-4 animate-pulse" />
        <span>Chargement...</span>
      </div>
    );
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Award className="w-4 h-4 text-yellow-500" />
          Badges ({badges.length})
        </h3>
        {badges.length >= limit && (
          <Link to="/badges" className="text-xs text-blue-400 hover:text-blue-300">
            Voir tout
          </Link>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30"
            title={badge.description}
          >
            <span className="text-xl">{badge.icon}</span>
            <span className="text-xs font-medium text-gray-200">{badge.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
