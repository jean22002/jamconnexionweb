import React from 'react';
import { Crown, CheckCircle } from 'lucide-react';

/**
 * Badge PRO pour les musiciens avec abonnement PRO actif et numéro GUSO
 * @param {Object} props
 * @param {string} props.variant - 'default' | 'compact' | 'large'
 * @param {boolean} props.showText - Afficher le texte "PRO" ou "Vérifié GUSO"
 * @param {string} props.type - 'pro' | 'guso' | 'both'
 */
const ProBadge = ({ variant = 'default', showText = true, type = 'pro' }) => {
  const variants = {
    compact: {
      container: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
      icon: 'w-3 h-3',
      text: 'text-xs font-semibold'
    },
    default: {
      container: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm',
      icon: 'w-4 h-4',
      text: 'text-sm font-semibold'
    },
    large: {
      container: 'inline-flex items-center gap-2 px-4 py-2 rounded-full text-base',
      icon: 'w-5 h-5',
      text: 'text-base font-bold'
    }
  };

  const types = {
    pro: {
      bg: 'bg-gradient-to-r from-primary/20 to-cyan-500/20',
      border: 'border border-primary/50',
      text: 'text-primary',
      icon: Crown,
      label: 'PRO'
    },
    guso: {
      bg: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20',
      border: 'border border-green-500/50',
      text: 'text-green-400',
      icon: CheckCircle,
      label: 'GUSO'
    },
    both: {
      bg: 'bg-gradient-to-r from-primary/20 via-cyan-500/20 to-green-500/20',
      border: 'border border-primary/50',
      text: 'bg-gradient-to-r from-primary via-cyan-400 to-green-400 bg-clip-text text-transparent',
      icon: Crown,
      label: 'PRO GUSO'
    }
  };

  const style = variants[variant];
  const typeConfig = types[type];
  const Icon = typeConfig.icon;

  return (
    <span className={`${style.container} ${typeConfig.bg} ${typeConfig.border} backdrop-blur-sm`}>
      <Icon className={`${style.icon} ${typeConfig.text}`} />
      {showText && (
        <span className={`${style.text} ${typeConfig.text}`}>
          {typeConfig.label}
        </span>
      )}
    </span>
  );
};

/**
 * Vérifie si un musicien a le badge PRO
 * @param {Object} musician
 * @returns {boolean}
 */
export const hasProBadge = (musician) => {
  return musician?.subscription_tier === 'pro' && 
         musician?.guso_number && 
         musician?.subscription_status === 'active';
};

/**
 * Vérifie si un musicien est membre GUSO
 * @param {Object} musician
 * @returns {boolean}
 */
export const isGusoMember = (musician) => {
  return musician?.is_guso_member && musician?.guso_number;
};

/**
 * Retourne le type de badge à afficher
 * @param {Object} musician
 * @returns {'pro' | 'guso' | 'both' | null}
 */
export const getBadgeType = (musician) => {
  const isPro = hasProBadge(musician);
  const isGuso = isGusoMember(musician);
  
  if (isPro && isGuso) return 'both';
  if (isPro) return 'pro';
  if (isGuso) return 'guso';
  return null;
};

export default ProBadge;
