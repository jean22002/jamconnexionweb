# 📱 RÉPONSE WEB → MOBILE — Plateaux (mobile Build 237)

Bonjour ! Tout est en place côté backend et Web. **Effectif en prod après le prochain Deploy Web.**

## 1. ✅ `GET /api/plateaus/{id}/applications`
- **Accès** : membres `accepted` du plateau, admin inclus. Sinon **403** `Réservé aux membres du plateau` (404 si plateau inconnu).
- **Tri** : `created_at` décroissant, 200 maximum.
```json
[{ "id": "...", "status": "pending|accepted|rejected", "created_at": "ISO", "planning_slot_id": "...",
   "slot": { "date": "YYYY-MM-DD", "time": "21:00", "start_time": null, "title": "...",
             "venue_id": "...", "venue_name": "...", "venue_city": "..." } }]
```
`slot` vaut `null` si le créneau a été supprimé.

## 2. ✅ `GET /api/plateaus/{id}/concerts?upcoming=true`
- **Accès** :
  - membres `accepted` du plateau ;
  - **établissement** : uniquement s'il a au moins un concert avec ce plateau, et il ne voit **que ses** concerts (sinon 403 `Accès refusé`).
- `upcoming=true` → `date >= aujourd'hui (UTC)`. Défaut `false` = tous les concerts.
- **Tri** : `date` croissante.
```json
[{ "id": "...", "date": "YYYY-MM-DD", "start_time": "21:00", "end_time": "23:00", "title": "...",
   "venue_id": "...", "venue_name": "...", "venue_city": "...", "status": "confirmed" }]
```
- **Nouveau** : quand un établissement **accepte une candidature plateau**, le concert auto-créé (`<application_id>_concert`) est désormais **rattaché au plateau**. Il a alors `plateau_id`, `plateau_title`, `band_name` = titre du plateau, `band_id` = `null`, `band_type` = `"plateau"`, et les `band_ids` des membres groupe. Il est aussi ajouté au planning de chaque membre solo. Il apparaît donc dans cette route et dans `/musician/calendar-events`. Pas de notif `plateau_concert_booked` dans ce cas (voir §5).

## 3. 🐛 ✅ Suppression d'un concert plateau
- `DELETE /api/concerts/{id}` retire maintenant les copies dans `musician.concerts[]` **et** `musician.upcoming_concerts[]` de tous les musiciens. Les `band_ids` sont stockés sur le concert lui-même, ils partent donc avec lui.
- Même nettoyage quand une candidature acceptée est remise en attente (`PATCH /applications/{id} {"status":"pending"}`).
- **Migration au démarrage** (idempotente) : purge des copies `source: "plateau_concert"` dont le concert n'existe plus. Le concert `555d7213-…` disparaîtra du planning de Marc Acoustique après le Deploy.
- Bonus : `PUT /api/concerts/{id}` ne détache plus le plateau si `plateau_id` est absent du body. Pour détacher : `PATCH {"plateau_id": null}`.

## 4. ✅ `GET /api/concerts/{id}`
Renvoie le même modèle que la liste (`ConcertEventResponse`, avec `plateau_id`, `plateau_title`, `participants_count`…). Route publique, comme `GET /concerts`. **404** `Concert not found` si l'id est inconnu.

## 5. ✅ Notification à l'admin du plateau (accept / reject)
Quand l'établissement accepte ou refuse une candidature **plateau**, seul **l'admin** du plateau est notifié (les autres membres non, choix produit) :
```json
{ "type": "application_response",
  "title": "🎉 Plateau accepté !" | "Candidature plateau non retenue",
  "data": { "plateau_id": "...", "application_id": "...", "status": "accepted|rejected",
            "planning_slot_id": "...", "venue_id": "..." },
  "link": "/musician?tab=plateaus&plateau_id=..." }
```
- Push SuprSend avec `deeplink: "jamconnexion:///plateaus/<plateau_id>"`, en respectant la préférence musicien `application_response`. La notif in-app est toujours créée.
- Pour une candidature plateau, cette notif **remplace** les anciennes notifs `application_accepted` / `application_rejected` et le push `jamconnexion:///(tabs)/applications`. L'événement socket `application_status` reste émis.

## Côté Web (aligné)
Détail d'un plateau (visible par les membres acceptés) : sections « 📨 Candidatures (N) » (établissement, ville, date, heure, statut) et « 📅 Concerts à venir (N) ».

## ✅ Recette (prod, après Deploy)
1. Admin : `GET /plateaus/{id}/applications` → 200 avec `slot` rempli ; établissement → 403.
2. Établissement accepte → l'admin reçoit `application_response` (`status: "accepted"`, `plateau_id`) ; le concert apparaît dans `/plateaus/{id}/concerts?upcoming=true` et dans le planning.
3. `DELETE /concerts/{id}` → disparaît de `/musician/calendar-events` pour tous les membres.
4. `GET /concerts/{id}` → 200 ; id inconnu → 404.
5. Refus → l'admin reçoit `application_response` (`status: "rejected"`).

Merci ! 🎸
