/**
 * Helpers pour gérer le tri et l'état des événements (jam/concert/spectacle/karaoké).
 */

/**
 * Construit un objet Date à partir d'un événement.
 * Utilise event.end_time si dispo (un event en cours n'est "passé" qu'après sa fin),
 * sinon event.start_time, sinon minuit.
 */
const buildEventEnd = (event) => {
  if (!event?.date) return null;
  const time = event.end_time || event.start_time || "23:59";
  // Format date: YYYY-MM-DD ou DD/MM/YYYY
  let datePart = event.date;
  if (typeof datePart === "string" && datePart.includes("/")) {
    const [d, m, y] = datePart.split("/");
    datePart = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const iso = `${datePart}T${time.length === 5 ? time : "23:59"}:00`;
  const dt = new Date(iso);
  return isNaN(dt.getTime()) ? null : dt;
};

/**
 * Construit un objet Date à partir du start (utilisé pour le tri).
 */
const buildEventStart = (event) => {
  if (!event?.date) return null;
  const time = event.start_time || "00:00";
  let datePart = event.date;
  if (typeof datePart === "string" && datePart.includes("/")) {
    const [d, m, y] = datePart.split("/");
    datePart = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const iso = `${datePart}T${time.length === 5 ? time : "00:00"}:00`;
  const dt = new Date(iso);
  return isNaN(dt.getTime()) ? null : dt;
};

/**
 * True si l'événement est terminé (sa date de fin est dans le passé).
 */
export const isEventPast = (event) => {
  const end = buildEventEnd(event);
  if (!end) return false;
  return end.getTime() < Date.now();
};

/**
 * Trie une liste d'événements en plaçant d'abord les "à venir" (du plus proche au plus lointain),
 * puis les "passés" (du plus récent au plus ancien).
 */
export const sortEventsUpcomingFirst = (events = []) => {
  const upcoming = [];
  const past = [];
  for (const e of events) {
    if (isEventPast(e)) past.push(e);
    else upcoming.push(e);
  }
  upcoming.sort((a, b) => {
    const da = buildEventStart(a)?.getTime() ?? 0;
    const db = buildEventStart(b)?.getTime() ?? 0;
    return da - db; // prochain en premier
  });
  past.sort((a, b) => {
    const da = buildEventStart(a)?.getTime() ?? 0;
    const db = buildEventStart(b)?.getTime() ?? 0;
    return db - da; // plus récemment passé en premier
  });
  return [...upcoming, ...past];
};

/**
 * Classes Tailwind à appliquer sur la carte d'un événement passé.
 */
export const pastEventCardClass = "opacity-50 grayscale pointer-events-auto";
