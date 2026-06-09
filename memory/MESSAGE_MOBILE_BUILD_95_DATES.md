# Message pour l'agent Mobile — Build 95 : Robustesse des dates (parité Web ↔ Mobile)

**Date :** 2026-02-07
**Statut backend :** ✅ Déployé — toutes les dates renvoyées par l'API sont désormais en `YYYY-MM-DD` strict
**Statut Web :** ✅ Sécurisé (helpers `formatEventDate` + `toDateKey` + `parseEventDate` en place)
**Statut Mobile :** ⚠️ À sécuriser — ~14 endroits encore vulnérables

---

## TL;DR (à lire en 30 secondes)

Le **backend a été assaini** (Build 95) : tout endpoint renvoyant des événements (jams, concerts, karaokés, spectacles, planning_slots, applications) passe désormais par `normalize_event_dates(...)` qui tronque toute valeur `"YYYY-MM-DDTHH:MM:SS..."` en `"YYYY-MM-DD"` strict, sur les champs `date` et `slot_date`.

➡️ **Sur Mobile, tu ne devrais donc plus jamais avoir de `T00:00:00` dans les réponses API.** MAIS la BDD prod a été nettoyée *à un instant T* : tout document futur mal-créé (ex: import iCal, anciennes scripts), ou tout cache local AsyncStorage pourrait encore contenir du legacy. Il faut donc **rendre le rendu UI tolérant**, exactement comme on l'a fait sur le Web.

---

## 1. Le problème exact

`new Date("2026-04-12")` parse en **UTC midnight** → sur certains fuseaux + iOS, l'affichage saute d'un jour OU crash silencieusement quand la chaîne est invalide (ex: `null`, `""`, `"2026-04-12T00:00:00.000Z"` mal interprété, etc).

Pire : `new Date("2026-04-12T00:00:00")` (sans Z) est parsé en **local time** → décalage selon device → événement affiché au mauvais jour dans le calendrier.

Et `new Date(undefined).toLocaleDateString()` → **crash UI** dans certains rendus React Native (en particulier sur Hermes engine + iOS 17).

---

## 2. Helpers à copier-coller (port direct du Web)

Crée un fichier `src/utils/dateFormatting.ts` (ou `.js`) côté Mobile, **identique au Web** :

```javascript
/**
 * Helpers de formatage de date robustes (Build 95).
 * Tolère : null / undefined / "" / "YYYY-MM-DD" / "YYYY-MM-DDTHH:MM:SS" / etc.
 * Retourne `fallback` (défaut "--") en cas d'invalidité.
 */

const isDateOnly = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export function parseEventDate(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  try {
    const trimmed = String(raw).trim();
    if (!trimmed) return null;
    // Date-only ("YYYY-MM-DD") → on ajoute T00:00:00 LOCAL (pas UTC) pour rester sur le bon jour
    const d = isDateOnly(trimmed)
      ? new Date(`${trimmed}T00:00:00`)
      : new Date(trimmed);
    if (isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}

export function formatEventDate(raw, format = 'full', fallback = '--') {
  const d = parseEventDate(raw);
  if (!d) return fallback;
  try {
    switch (format) {
      case 'iso':   return d.toISOString().slice(0, 10);
      case 'day':   return d.getDate().toString().padStart(2, '0');
      case 'month': return d.toLocaleDateString('fr-FR', { month: 'short' });
      case 'year':  return d.getFullYear().toString();
      case 'short': return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      case 'full':
      default:      return d.toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
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
```

> ⚠️ **Important RN** : si tu utilises `date-fns`, `dayjs` ou `moment`, **garde quand même** ces helpers pour le parsing initial — leur job est **uniquement** la tolérance aux entrées malformées. Tu peux ensuite passer le `Date` retourné par `parseEventDate` à ta lib de format si tu préfères.

---

## 3. Patterns dangereux à chercher et remplacer

Lance ces greps dans le repo mobile et corrige **chaque occurrence** :

### ❌ Pattern 1 : `new Date(...)` brut sur une date d'événement
```bash
grep -rn "new Date(" src/ --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js"
```
**Remplace** par `parseEventDate(...)` partout où la source est une `event.date`, `slot.date`, `concert.date`, `jam.date`, `application.slot_date`, etc.

```diff
- const d = new Date(event.date);
- const label = d.toLocaleDateString('fr-FR', {...});
+ const label = formatEventDate(event.date, 'full');
```

### ❌ Pattern 2 : `"T00:00:00"` ajouté en dur
```bash
grep -rn "T00:00:00" src/
```
**Tout ce qui ressemble à `new Date(date + 'T00:00:00')` doit disparaître.** Remplace par `parseEventDate(date)`.

### ❌ Pattern 3 : `date.split('T')[0]` pour normaliser
```bash
grep -rn "split('T')" src/
grep -rn 'split("T")' src/
```
**Remplace** par `toDateKey(date)` qui gère aussi `null`/`undefined`.

### ❌ Pattern 4 : `.toLocaleDateString()` directement après un `new Date`
```bash
grep -rn "toLocaleDateString" src/
```
Chaque appel doit être **précédé d'un check `parseEventDate`** ou remplacé par `formatEventDate(raw, 'full' | 'short')`.

### ❌ Pattern 5 : indexation d'un objet calendrier par `date.toISOString().slice(0,10)`
```bash
grep -rn "toISOString" src/
```
**Remplace** par `toDateKey(raw)` (qui ne crash pas si raw est `null`).

---

## 4. Les ~14 endroits prioritaires (par fréquence d'usage)

D'après la parité Web, voici les écrans/composants Mobile les plus susceptibles d'utiliser des dates. Vérifie-les **dans cet ordre** :

| # | Écran / Composant | Source typique | Action |
|---|---|---|---|
| 1 | `MusicianDashboard` — onglet "Mes concerts" | `concerts[].date` | Remplacer `new Date(c.date)` → `formatEventDate(c.date)` |
| 2 | `MusicianDashboard` — onglet "Candidatures" | `applications[].slot_date` | idem |
| 3 | `MusicianDashboard` — onglet "Comptabilité" | `concerts[].date` (filtrage par mois/année) | utiliser `toDateKey()` pour group-by |
| 4 | `VenueDashboard` — onglet "Planning" | `planning_slots[].date` | `formatEventDate(slot.date, 'short')` |
| 5 | `VenueDashboard` — onglet "Concerts à venir" | `concerts[].date` | idem |
| 6 | `VenueDashboard` — onglet "Historique" | `concerts[].date` (passés) | idem |
| 7 | `Calendar` (calendrier mensuel établissement) | `events[].date` mappés par jour | **clé d'index = `toDateKey(date)`** |
| 8 | `Calendar` (calendrier musicien) | concerts + applications | idem |
| 9 | `VenueDetail` — section "Prochains concerts" | `concerts[].date` | `formatEventDate(c.date, 'short')` |
| 10 | `VenueDetail` — section "Postuler à un créneau" (popup) | `selectedSlot.date` | `formatEventDate(slot.date, 'full')` |
| 11 | `JamScreen` / `KaraokeScreen` — détail événement | `event.date` | idem |
| 12 | `BandPlanning` (planning du groupe) | `events[].date` triés ASC | trier via `parseEventDate(a.date) - parseEventDate(b.date)` |
| 13 | `Notifications` — date d'événement liée | `notification.event_date` | `formatEventDate(...)` |
| 14 | `Stats` / `Analytics` (musicien) — group-by mois | `concerts[].date` | utiliser `parseEventDate(d).getMonth()` |

---

## 5. Tests à faire après le port

### Sur device (iOS et Android)
1. Ouvrir le dashboard musicien sur le compte `test@gmail.com / test` (20 concerts factices avec GUSO + factures injectés).
2. Vérifier l'onglet **Comptabilité** : les 20 concerts doivent s'afficher avec dates correctes, pas de "Invalid Date" ni de crash.
3. Ouvrir le calendrier venue d'un établissement avec planning : les jours doivent matcher exactement avec ceux du Web.
4. Forcer une date legacy en BDD (insertion manuelle d'un doc avec `date: "2026-08-15T00:00:00.000Z"`) → l'UI doit afficher **15 août 2026** (pas le 14 ni le 16).

### En unit test
```javascript
expect(formatEventDate("2026-04-12")).toBe("dimanche 12 avril 2026");
expect(formatEventDate("2026-04-12T00:00:00")).toBe("dimanche 12 avril 2026");
expect(formatEventDate("2026-04-12T00:00:00.000Z")).toBe("dimanche 12 avril 2026");
expect(formatEventDate(null)).toBe("--");
expect(formatEventDate(undefined)).toBe("--");
expect(formatEventDate("")).toBe("--");
expect(formatEventDate("garbage")).toBe("--");
expect(toDateKey("2026-04-12T15:30:00")).toBe("2026-04-12");
expect(toDateKey(null)).toBe(null);
```

---

## 6. Côté Backend (déjà fait, juste pour info)

Le helper backend `backend/utils/date_normalization.py` est appliqué à tous les endpoints qui renvoient des événements :

```python
def normalize_date_str(val: Any) -> Any:
    if not isinstance(val, str) or len(val) < 10:
        return val
    return val[:10] if 'T' in val else val
```

Endpoints couverts (`normalize_event_dates(docs, ['date', 'slot_date'])` appliqué) :
- `GET /api/venues/{id}/planning`
- `GET /api/venues/{id}/concerts`
- `GET /api/venues/{id}/jams`
- `GET /api/venues/{id}/karaokes`
- `GET /api/venues/{id}/spectacles`
- `GET /api/musicians/me/applications`
- `GET /api/musicians/me/concerts`
- `GET /api/bands/{id}/events`

**Tu peux donc faire confiance aux réponses API.** Les helpers Mobile sont juste une **ceinture de sécurité** pour le cache local et le legacy data.

---

## 7. Synchronisation des autres Builds (rappel)

| Build | Sujet | Statut Web | Statut Mobile |
|-------|-------|-----------|---------------|
| 90 | Formulaire "Projet Solo" accordéon 7 sections | ✅ | ✅ (Référence) |
| 91 | Filtrage candidatures par `formation_type` / `max_musicians` | ✅ | ✅ |
| 92 | Optimistic UI création projet | ✅ | ✅ |
| 93 | Badge GUSO masqué vues publiques | ✅ | ✅ |
| 94 | Couleurs calendrier dynamiques par event type | ✅ | ✅ |
| 95 | **Robustesse parsing dates** | ✅ | ⚠️ **À faire** |

---

## 8. Question(s) en suspens pour l'utilisateur

- Confirmer que tous les écrans de la table §4 existent bien dans la base Mobile (les noms peuvent différer légèrement).
- Si la lib utilisée est `date-fns`, on peut remplacer le bloc `switch` dans `formatEventDate` par `format(d, 'EEEE d MMMM yyyy', { locale: fr })`. Same idea.

---

**Fin du message.** Une fois les 14 endroits sécurisés et le test sur `test@gmail.com` validé, tu peux passer au Build 96 (sujet à définir avec l'utilisateur — pistes ouvertes : Light Mode via `useTheme()`, refactoring `VenueDashboard`, intégration Facebook Events).

---

## 9. 🆕 BONUS Build 95.1 — Décharge légale Comptabilité (à ajouter en même temps)

Pour des raisons légales, **Jam Connexion n'est PAS un logiciel de comptabilité ni de facturation officiel** — juste un outil d'aide au suivi. Il faut afficher une décharge discrète **en bas de l'onglet Comptabilité** (côté musicien ET côté venue).

### Côté Web (✅ déjà fait)
Petit paragraphe centré, gris translucide, italique 11px, juste avant la fermeture du composant `AccountingTab`.

### À porter côté Mobile

Ajoute en **bas de l'écran Comptabilité musicien** ET en **bas de l'écran Comptabilité établissement** (après la liste des concerts, avant la fin du ScrollView) :

```jsx
<Text
  testID="accounting-disclaimer-musician"  // ou "accounting-disclaimer-venue"
  style={{
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.45)',  // ou theme.colors.mutedForeground avec opacité
    fontStyle: 'italic',
    textAlign: 'center',
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
  }}
>
  ℹ️ Jam Connexion est un outil d'aide au suivi de votre activité musicale. Ce n'est ni un logiciel de comptabilité, ni un logiciel de facturation officiel. Les données affichées sont indicatives : vérifiez et conservez vos propres justificatifs. Jam Connexion ne peut être tenu responsable d'une éventuelle perte de données ou d'une erreur de saisie.
</Text>
```

**Texte musicien** (mot pour mot, exactement comme côté web) :
> ℹ️ Jam Connexion est un outil d'aide au suivi de votre activité musicale. Ce n'est ni un logiciel de comptabilité, ni un logiciel de facturation officiel. Les données affichées sont indicatives : vérifiez et conservez vos propres justificatifs. Jam Connexion ne peut être tenu responsable d'une éventuelle perte de données ou d'une erreur de saisie.

**Texte venue** (différence : "activité" au lieu de "activité musicale") :
> ℹ️ Jam Connexion est un outil d'aide au suivi de votre activité. Ce n'est ni un logiciel de comptabilité, ni un logiciel de facturation officiel. Les données affichées sont indicatives : vérifiez et conservez vos propres justificatifs. Jam Connexion ne peut être tenu responsable d'une éventuelle perte de données ou d'une erreur de saisie.

Important : **texte identique au web**, mot pour mot, pour cohérence légale.
