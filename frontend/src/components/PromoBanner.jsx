import React, { useState, useEffect } from 'react';
import { X, Sparkles, Users, Building2 } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const PromoBanner = ({ userRole, onClose }) => {
  const [promoStats, setPromoStats] = useState({ count: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  // Fetch promo stats
  const fetchPromoStats = async () => {
    try {
      const endpoint = userRole === 'musician' 
        ? `${API}/api/stats/promo-musicians`
        : `${API}/api/stats/promo`;
      
      const response = await axios.get(endpoint);
      
      if (userRole === 'musician') {
        setPromoStats({
          count: response.data.count || 0,
          total: 200
        });
      } else {
        setPromoStats({
          count: response.data.count || 0,
          total: 100
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching promo stats:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPromoStats, 30000);
    return () => clearInterval(interval);
  }, [userRole]);

  const placesRestantes = promoStats.total - promoStats.count;
  const isMusicien = userRole === 'musician';

  return (
    <div className={`relative overflow-hidden ${
      isMusicien 
        ? 'bg-gradient-to-r from-cyan-600/90 via-blue-600/90 to-purple-600/90' 
        : 'bg-gradient-to-r from-orange-600/90 via-pink-600/90 to-purple-600/90'
    }`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-white/20 rounded-full backdrop-blur-sm">
              {isMusicien ? (
                <Sparkles className="w-5 h-5 text-white" />
              ) : (
                <Building2 className="w-5 h-5 text-white" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-white font-bold text-sm sm:text-base">
                  🎁 OFFRE DE LANCEMENT
                </span>
                <span className="hidden sm:inline text-white/90 text-sm">•</span>
                <span className="text-white text-sm sm:text-base">
                  {isMusicien 
                    ? `Les ${promoStats.total} premiers musiciens : 2 mois PRO gratuits`
                    : `Les ${promoStats.total} premiers établissements : 6 mois gratuits`
                  }
                </span>
              </div>
              
              {!loading && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/20 rounded-full backdrop-blur-sm">
                    <Users className="w-3 h-3 text-white" />
                    <span className="text-white font-bold text-xs">
                      {promoStats.count}/{promoStats.total}
                    </span>
                  </div>
                  <span className="text-white/90 text-xs font-medium">
                    {placesRestantes > 0 
                      ? `Plus que ${placesRestantes} ${placesRestantes === 1 ? 'place' : 'places'} !`
                      : 'Offre terminée'
                    }
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            aria-label="Fermer la bannière"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" 
           style={{ backgroundSize: '200% 100%' }} />
    </div>
  );
};

export default PromoBanner;
