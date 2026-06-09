/**
 * Helpers de formatage de date robustes (Build 95).
 *
 * Tous les helpers tolèrent : null / undefined / "" / "YYYY-MM-DD" / "YYYY-MM-DDTHH:MM:SS"
 * et toute autre chaîne. En cas d'invalidité, retournent `fallback` (par défaut "--").
 */

const isDateOnly = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

/**
 * Parse une date raw en Date JS robuste.
 * Retourne null si invalide.
 */
export function parseEventDate(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  try {
    const trimmed = String(raw).trim();
    if (!trimmed) return null;
    const d = isDateOnly(trimmed)
      ? new Date(`${trimmed}T00:00:00`)
      : new Date(trimmed);
    if (isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}

/**
 * Formate une date d'événement de manière robuste.
 *
 * @param {string|null|undefined} raw - "YYYY-MM-DD" ou "YYYY-MM-DDTHH:MM:SS"
 * @param {'full'|'short'|'day'|'month'|'year'|'iso'} format
 * @param {string} fallback - valeur retournée si invalide (défaut "--")
 */
export function formatEventDate(raw, format = 'full', fallback = '--') {
  const d = parseEventDate(raw);
  if (!d) return fallback;

  try {
    switch (format) {
      case 'iso':
        return d.toISOString().slice(0, 10);
      case 'day':
        return d.getDate().toString().padStart(2, '0');
      case 'month':
        return d.toLocaleDateString('fr-FR', { month: 'short' });
      case 'year':
        return d.getFullYear().toString();
      case 'short':
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      case 'full':
      default:
        return d.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
    }
  } catch {
    return fallback;
  }
}

/**
 * Tronque une date raw au format `YYYY-MM-DD` (utile pour indexer un calendrier).
 * Retourne null si invalide.
 */
export function toDateKey(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const s = String(raw).trim();
  if (isDateOnly(s)) return s;
  if (s.length >= 10) {
    const candidate = s.slice(0, 10);
    if (isDateOnly(candidate)) return candidate;
  }
  const d = parseEventDate(raw);
  if (!d) return null;
  try {
    return d.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}
