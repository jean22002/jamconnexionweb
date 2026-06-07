/**
 * Détection et compatibilité du type de formation pour un créneau (slot) de planning.
 * Logique alignée avec l'app mobile (Build 91).
 */

export const FORMATION_TYPES = [
  { key: 'any', label: 'Toute formation', emoji: '🎵', max: null },
  { key: 'solo', label: 'Solo', emoji: '🎤', max: 1 },
  { key: 'duo', label: 'Duo', emoji: '🎸', max: 2 },
  { key: 'trio', label: 'Trio', emoji: '🎶', max: 3 },
  { key: 'quatuor', label: 'Quatuor', emoji: '🎻', max: 4 },
  { key: 'quintet', label: 'Quintet', emoji: '🥁', max: 5 },
  { key: 'groupe', label: 'Groupe 6+', emoji: '🎷', max: 8 },
];

/**
 * Détecte le type de formation recherché par un slot.
 * Priorité : max_musicians > parsing description > "any"
 */
export function detectFormationType(slot) {
  if (!slot) return 'any';

  const mm = slot.max_musicians;
  if (typeof mm === 'number') {
    if (mm === 1) return 'solo';
    if (mm === 2) return 'duo';
    if (mm === 3) return 'trio';
    if (mm === 4) return 'quatuor';
    if (mm === 5) return 'quintet';
    if (mm >= 6) return 'groupe';
  }

  const desc = (slot.description || slot.title || '').toString();
  if (/\b(solo)\b/i.test(desc)) return 'solo';
  if (/\b(duo)\b/i.test(desc)) return 'duo';
  if (/\b(trio)\b/i.test(desc)) return 'trio';
  if (/\b(quatuor|quartet)\b/i.test(desc)) return 'quatuor';
  if (/\b(quintet|quintette)\b/i.test(desc)) return 'quintet';
  if (/\b(groupe|band|formation)\b/i.test(desc)) return 'groupe';

  return 'any';
}

/**
 * Vérifie qu'un projet (band) est compatible avec le type de formation recherché.
 * Retourne { compatible: bool, reason: string|null }
 */
export function isProjectCompatible(band, formationType, maxMusicians = null) {
  if (!band) return { compatible: false, reason: 'Projet introuvable' };

  const count = typeof band.members_count === 'number' ? band.members_count : 0;
  const isSolo = band.band_type === 'Solo' || count === 1;

  switch (formationType) {
    case 'any':
      return { compatible: true, reason: null };

    case 'solo':
      if (isSolo) return { compatible: true, reason: null };
      return { compatible: false, reason: 'Ce créneau recherche un Solo (1 musicien)' };

    case 'duo':
      if (count === 2 && !isSolo) return { compatible: true, reason: null };
      return { compatible: false, reason: 'Ce créneau recherche un Duo (2 musiciens)' };

    case 'trio':
      if (count === 3) return { compatible: true, reason: null };
      return { compatible: false, reason: 'Ce créneau recherche un Trio (3 musiciens)' };

    case 'quatuor':
      if (count === 4) return { compatible: true, reason: null };
      return { compatible: false, reason: 'Ce créneau recherche un Quatuor (4 musiciens)' };

    case 'quintet':
      if (count === 5) return { compatible: true, reason: null };
      return { compatible: false, reason: 'Ce créneau recherche un Quintet (5 musiciens)' };

    case 'groupe': {
      const max = maxMusicians || 8;
      if (count >= 2 && count <= max) return { compatible: true, reason: null };
      return { compatible: false, reason: `Ce créneau recherche un groupe de 2 à ${max} musiciens` };
    }

    default:
      return { compatible: true, reason: null };
  }
}

/**
 * Retourne le label affichable du type de formation
 */
export function formationLabel(formationType) {
  const ft = FORMATION_TYPES.find((f) => f.key === formationType);
  return ft ? `${ft.emoji} ${ft.label}` : '🎵 Toute formation';
}
