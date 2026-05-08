import { useEffect, useState } from 'react';
import axios from 'axios';
import { Flame, TrendingDown, Zap } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PromoCounter({ variant = 'banner', type = 'venue' }) {
  const [promoData, setPromoData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromoStats = async () => {
      try {
        const endpoint = type === 'musician' ? '/stats/promo-musicians' : '/stats/promo';
        const response = await axios.get(`${API}${endpoint}`);
        setPromoData(response.data);
      } catch (error) {
        console.error('Error fetching promo stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPromoStats();
    
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchPromoStats, 30000);
    return () => clearInterval(interval);
  }, [type]);

  if (loading) {
    return variant === 'banner' ? (
      <span className="inline-block w-24 h-4 bg-white/20 rounded animate-pulse"></span>
    ) : (
      <div className="w-full h-12 bg-white/10 rounded animate-pulse"></div>
    );
  }

  if (!promoData || !promoData.is_promo_available) {
    // Offre expirée
    if (type === 'musician') {
      return variant === 'banner' ? null : (
        <div className="text-center text-xs text-muted-foreground">
          Offre 2 mois PRO terminée
        </div>
      );
    }
    return variant === 'banner' ? null : (
      <div className="text-center text-xs text-muted-foreground">
        Offre 6 mois terminée • 3 mois gratuits disponibles
      </div>
    );
  }

  const { remaining_slots } = promoData;
  const limit = type === 'musician' ? 200 : 100;
  
  // Couleur selon l'urgence
  const getUrgencyColor = () => {
    if (remaining_slots > 50) return 'text-green-400';
    if (remaining_slots > 20) return 'text-yellow-400';
    if (remaining_slots > 10) return 'text-orange-400';
    return 'text-red-400 animate-pulse';
  };

  const getUrgencyBg = () => {
    if (remaining_slots > 50) return 'bg-green-500/20 border-green-500/30';
    if (remaining_slots > 20) return 'bg-yellow-500/20 border-yellow-500/30';
    if (remaining_slots > 10) return 'bg-orange-500/20 border-orange-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const getIcon = () => {
    if (remaining_slots > 50) return <Zap className="w-4 h-4" />;
    if (remaining_slots > 10) return <TrendingDown className="w-4 h-4" />;
    return <Flame className="w-4 h-4" />;
  };

  // Variant Banner (compact pour la bannière en haut)
  if (variant === 'banner') {
    const bannerText = type === 'musician' 
      ? `${remaining_slots}/${limit} places` 
      : `${remaining_slots}/${limit} places`;
    
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold ${getUrgencyColor()}`}>
        {getIcon()}
        <span className="hidden sm:inline">Plus que</span> {bannerText}
      </span>
    );
  }

  // Variant Card (pour les cards de pricing)
  if (variant === 'card') {
    const cardTitle = type === 'musician' 
      ? `${remaining_slots} places restantes` 
      : `${remaining_slots} places restantes`;
    const cardSubtitle = type === 'musician'
      ? `sur les ${limit} de l'offre 2 mois PRO gratuits`
      : `sur les ${limit} de l'offre 6 mois gratuits`;
    
    return (
      <div className={`rounded-xl px-4 py-3 border ${getUrgencyBg()} backdrop-blur-sm`}>
        <div className="flex items-center justify-center gap-2 mb-1">
          {getIcon()}
          <span className={`font-bold text-lg ${getUrgencyColor()}`}>
            {cardTitle}
          </span>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          {cardSubtitle}
        </p>
      </div>
    );
  }

  // Variant Badge (petit badge compact)
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getUrgencyBg()}`}>
        {getIcon()}
        <span className={getUrgencyColor()}>
          {remaining_slots}/{limit}
        </span>
      </div>
    );
  }

  return null;
}
