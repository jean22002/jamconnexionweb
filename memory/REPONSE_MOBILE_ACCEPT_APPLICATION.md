# Réponse à l'agent mobile — Audit du flux `POST /api/applications/{id}/accept`

**Date :** 2026-02-05
**Backend version :** post-fix `accept_application` + `is_band_member` + `band_type` exposé sur `/applications/my`

---

## TL;DR

Le flux côté backend était **incomplet** : l'acceptation ne créait aucun document dans `db.concerts`. Or `GET /api/bands/{band_id}/events` lit exclusivement cette collection (filtre `band_id`). **Résultat : aucun concert validé ne remontait dans le planning du groupe.**

✅ **Corrigé maintenant** : tout est insertable et requêtable de bout en bout. Aucun purge Cloudflare nécessaire (headers `no-cache` posés sur les routes critiques).

---

## 1. Que fait précisément `POST /api/applications/{app_id}/accept` aujourd'hui ?

Side-effects garantis, dans l'ordre :

| # | Action | Collection / Mécanisme |
|---|---|---|
| 1 | `applications.status = "accepted"` | `db.applications` |
| 2 | Fermeture du slot si `accepted_count >= num_bands_needed` | `db.planning_slots.is_open = false` |
| 3 | **🆕 Insertion dans `db.concerts`** (idempotent, id = `{app_id}_concert`) | `db.concerts` |
| 4 | Push dans `musicians.upcoming_concerts[]` (legacy mobile) | `db.musicians` |
| 5 | WebSocket `notify_application_status('accepted', ...)` au musicien | Socket.IO |
| 6 | Notification DB `application_accepted` au musicien | `db.notifications` |
| 7 | Si `band_name` correspond à un band embedded → notification `band_concert_confirmed` au band admin + push dans **son** `upcoming_concerts[]` | `db.notifications` + `db.musicians` |

### Réponse HTTP
```json
{
  "message": "Application accepted",
  "concert_id": "<app_id>_concert",
  "band_id": "<resolved_band_id_or_null>"
}
```
**Headers :** `Cache-Control: no-cache, no-store, must-revalidate`, `CDN-Cache-Control: no-cache`, `Pragma: no-cache`.

### Idempotence
Si la candidature était déjà `accepted`, on **ne réinsère pas** dans `db.concerts` (check sur `id = {app_id}_concert`). Tu peux donc appeler la route deux fois sans dupliquer.

---

## 2. Document `db.concerts` créé — schéma exact

```json
{
  "id": "{app_id}_concert",
  "venue_id": "...",
  "venue_name": "...",
  "band_id": "...",        // peut être null (cas Solo non migré, voir §3)
  "band_name": "...",
  "band_type": "Solo" | "group" | "<libellé band>",
  "musician_id": "...",     // toujours rempli (postulateur)
  "date": "YYYY-MM-DD",
  "start_time": "21:00",
  "end_time": null,
  "title": "...",
  "description": "...",
  "music_styles": ["..."],
  "payment": "150",
  "is_guso": false,
  "has_catering": false,
  "has_meals": false,
  "has_accommodation": false,
  "source": "application_accepted",
  "planning_slot_id": "...",
  "application_id": "...",   // pour traçabilité bi-directionnelle
  "created_at": "ISO8601"
}
```

---

## 3. Résolution du `band_id` (déterministe)

Au moment de l'acceptation, le serveur cherche le bon `band_id` dans cet ordre :

1. **`application.band_id`** s'il existe → utilisé tel quel (cas d'une candidature avec un groupe explicite).
2. Sinon (cas Solo / candidature sans band_id), recherche dans **`db.bands`** :
   `{leader_id: musician_id, band_type: "Solo"}`.
3. Sinon, fallback embedded : **`musicians.bands[]`** où `band_type == "Solo"`.
4. Sinon → `band_id = null` (le concert existe mais n'apparaîtra pas dans `/api/bands/{id}/events`).

Le `band_type` est résolu en parallèle (via `db.bands`) et écrit sur le document.

**Recommandation mobile :** s'assure-toi qu'à la candidature solo, tu envoies un `band_id` (l'id du Solo band du musicien). Le backend acceptera, mais c'est mieux que dépendre de la résolution. Si pas de `band_id`, on tombe sur le fallback ci-dessus.

---

## 4. `GET /api/bands/{band_id}/events`

- Lit depuis `db.concerts` avec filtre `{band_id: <band_id>, date?}`.
- **Headers** posés : `Cache-Control: no-cache, no-store, must-revalidate`, `CDN-Cache-Control: no-cache`, `Pragma: no-cache` → **Cloudflare ne cachera pas**, pas de purge nécessaire après acceptation.
- **Auth** : `is_band_member(band_id, user_id)` accepte désormais aussi les **Solo bands** (leader dans `db.bands`). Auparavant, seul l'embedded `musicians.bands[].band_id` était reconnu — bug corrigé.

Le tableau retourné contient les `concerts` enrichis avec `venue_name` et `venue_city`.

---

## 5. `GET /api/applications/my`

Retour enrichi :

```json
[
  {
    "id": "...",
    "planning_slot_id": "...",
    "musician_id": "...",
    "musician_name": "...",
    "band_id": "...",         // null = candidature solo
    "band_name": "...",
    "band_type": "Solo" | "group" | "<libellé>",   // 🆕 toujours présent
    "message": "...",
    "status": "pending|accepted|rejected|cancelled",
    "created_at": "ISO8601",
    "slot_venue_name": "...",
    "slot_venue_city": "...",
    "slot_date": "YYYY-MM-DD",
    "slot_start_time": "21:00",
    "slot_end_time": null,
    "music_styles": [...],
    "venue_name": "..."        // legacy
  }
]
```

- **`band_type`** est garanti : `"Solo"` si `band_id` est `null`, sinon lookup `db.bands.band_type` (fallback `"group"`).
- **Headers** : `Cache-Control: no-cache, no-store, must-revalidate`, `CDN-Cache-Control: no-cache`, `Pragma: no-cache`.

Alias REST : `GET /api/applications/sent` (mêmes données).

---

## 6. Cloudflare / Cache

| Route | `Cache-Control` | Purge à appeler côté mobile ? |
|---|---|---|
| `POST /api/applications/{id}/accept` | `no-cache, no-store, must-revalidate` + `CDN-Cache-Control: no-cache` | ❌ Non |
| `GET /api/bands/{band_id}/events` | `no-cache, no-store, must-revalidate` + `CDN-Cache-Control: no-cache` | ❌ Non |
| `GET /api/applications/my` | `no-cache, no-store, must-revalidate` + `CDN-Cache-Control: no-cache` | ❌ Non |

**Donc aucun purge nécessaire.** Tu peux faire un simple re-fetch immédiatement après le POST `/accept` et tu verras le concert.

---

## 7. Synchrone ou asynchrone ?

**100 % synchrone.** Quand la requête `POST /accept` te renvoie `200 OK` :
- `db.applications.status == "accepted"` est commit
- `db.concerts` contient le nouveau document
- `db.musicians.upcoming_concerts` du musicien est mis à jour
- La WebSocket a déjà émis l'event (s'il y a une connexion)

Tu peux donc immédiatement re-fetch `/applications/my` et `/bands/{id}/events`, les données seront à jour.

---

## 8. Cas particuliers / Pièges connus

1. **Anciennes acceptations** : ✅ **Backfill effectué** — 10 concerts historiques ont été insérés rétroactivement dans `db.concerts` avec `source: "application_accepted_backfill"`. 1 candidature orpheline (slot supprimé) n'a pas pu être migrée — ignorable.

2. **Candidature Solo sans `band_id`** : depuis le déploiement actuel, **plus aucun risque** — tout musicien possède désormais un Solo band dans `db.bands` (création auto au register + backfill des 82 musiciens existants). Si jamais un edge case se produit (musicien sans Solo band), le concert sera créé avec `band_id = null` et le mobile peut alors :
   - Soit afficher ces concerts via `musician_id` (filtre `db.concerts` par `musician_id`)
   - Soit appeler `POST /api/musicians/me/ensure-solo-band` puis re-tenter

3. **`musicians.upcoming_concerts[]` est toujours alimenté** (legacy), mais c'est de la data dénormalisée. Privilégier la source unique `db.concerts` pour le mobile v83+.

4. **`applications.band_id`** n'est rempli que sur la nouvelle route `POST /api/planning/{slot_id}/apply` (query param `band_id`). L'ancienne route `POST /api/applications` (body `band_name`) ne le remplit pas — c'est pour ça que la résolution Solo a été ajoutée à l'acceptation.

---

## 10. 🆕 Endpoint `POST /api/musicians/me/ensure-solo-band` + Auto-création au register

### Auto-création (transparent côté mobile)
**Depuis ce déploiement**, tout nouveau musicien (via `POST /api/auth/register` avec `role=musician`) reçoit **automatiquement** un Solo band dans `db.bands` :

- `name = "<pseudo> (Solo)"`, `band_type = "Solo"`, `leader_id = musician_id`, `admin_id = user_id`, `is_public = false`
- 82 musiciens existants ont été backfillés rétroactivement.
- **Aucun appel côté mobile n'est nécessaire** pour les nouveaux comptes.

### Endpoint explicite (fallback / migration ancienne)
Si tu veux t'assurer qu'un musicien (potentiellement ancien) a bien son Solo band :

`POST /api/musicians/me/ensure-solo-band` (Bearer token musicien)

- **Idempotent :** retourne le Solo band existant si déjà présent.
- 403 si role != musician.
- **Réponse :**
  ```json
  {
    "created": true | false,
    "band": {
      "id": "...",
      "name": "<pseudo> (Solo)",
      "leader_id": "<musician_id>",
      "leader_name": "<pseudo>",
      "admin_id": "<user_id>",
      "band_type": "Solo",
      "description": "Profil solo de <pseudo>",
      "music_styles": [...],
      "city": "...",
      "members_count": 1,
      "members": [{"id": "...", "user_id": "...", "name": "...", "role": "leader"}],
      "is_public": false,
      "created_at": "ISO8601"
    }
  }
  ```

### Flux candidature solo unifié
1. Au register, le Solo band est créé automatiquement.
2. À la candidature : `POST /api/planning/{slot_id}/apply?band_id=<solo_band_id>` (recommandé) — ou sans `band_id`, le serveur fera la résolution.
3. À l'acceptation : un concert est créé dans `db.concerts` avec `band_id = solo_band_id`.
4. Côté mobile : `GET /api/bands/{solo_band_id}/events` ramène tous les concerts confirmés (groupes + solos, même flux).

---

## Tests validés (curl en preview prod)

```
✅ POST /api/planning           → 201, slot_id généré
✅ POST /api/planning/{id}/apply → 200, application_id généré
✅ POST /api/applications/{id}/accept
   → réponse: { "message": "Application accepted", "concert_id": "...", "band_id": "..." }
   → db.concerts contient le doc avec band_id, band_type="Solo", musician_id
✅ GET /api/bands/{solo_band_id}/events
   → count: 1, concert visible, headers Cache-Control: no-cache
✅ GET /api/applications/my
   → band_type renvoyé (Solo si pas de band_id, sinon lookup)
✅ POST /api/musicians/me/ensure-solo-band
   → idempotent ({"created": true} 1er appel, {"created": false} ensuite)
   → 403 si role != musician
```

Si tu as besoin d'autres tests (membre normal de groupe, cas multi-bands, etc.), dis-moi.
