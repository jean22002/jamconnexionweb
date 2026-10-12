# 📱 RÉPONSE WEB → MOBILE — Candidatures acceptées sans concert (Build 239)

Merci pour le signalement ! ⚠️ Info importante : la preview Web et la prod **partagent la même base MongoDB**. La migration a donc **déjà tourné sur les données de prod**. Les correctifs de code, eux, seront actifs après le prochain Deploy Web.

## 🔎 Cause (sur vos 10 cas)
1. **7 candidatures** (BassPlayer, Bordeaux Acoustic, Les Rockers Parisiens, Au final, Jazz Masters, Test Band No GPS, toto) : **données de test** générées le 2026-09-20 à 14:18, toutes à la même minute. Elles ont été insérées directement en base avec `status: "accepted"`, **sans passer par la route d'acceptation** : aucun concert n'a donc été créé. Leurs `musician_id` ne correspondent d'ailleurs à **aucun profil musicien réel** (pas de planning possible).
2. **3 candidatures Marc Acoustique** (05, 07 et 09/07) : bien acceptées via `POST /applications/{id}/accept` (audit OK, copie `upcoming_concerts` présente), mais le concert **a été supprimé ensuite**, très probablement par `DELETE /concerts/{id}`. La candidature, elle, est restée `accepted`.
3. **Vrai bug** : ré-accepter une candidature déjà `accepted` ne recréait jamais le concert (garde d'idempotence trop large).

## ✅ Corrections
### Acceptation = concert garanti
`POST /applications/{id}/accept` appelle maintenant `ensure_application_concert`, qui est **idempotent** et tourne **même si la candidature était déjà acceptée**. Il :
- recrée `<application_id>_concert` s'il manque. Il cherche d'abord par `id`, puis par `application_id`, et ne crée jamais de doublon ;
- copie du créneau : `date`, `start_time`, `end_time`, `title`, `description`, `music_styles`, `payment`, `payment_type`, `is_guso`, `has_catering`, `catering_drinks`, `catering_respect`, `catering_tbd`, `has_meals`, `meals_count`, `has_accommodation`, `accommodation_capacity`, `accommodation_tbd` ;
- renseigne `bands: [{name, id: band_id résolu, musician_id, members_count: 1}]`, `status: "confirmed"`, `application_id`, `planning_slot_id` et `source: "application_accepted"` ;
- ajoute le concert dans `musician.concerts[]`, avec `source: "application_accepted"`. Il **reste dans le planning même si le créneau est supprimé** et apparaît dans `/musician/calendar-events` ;
- groupe : le concert garde `band_id`, il apparaît donc dans `GET /bands/{band_id}/events`, donc dans le planning du groupe ;
- plateau : `bands` = `[{name: titre du plateau, id: null, plateau_id, members_count}]`, plus les plannings des membres (Build 237).

`PATCH /applications/{id} {"status":"accepted"}` renvoie toujours **400**, il n'existe donc **qu'une seule route d'acceptation**.

### `POST /api/concerts` accepte `application_id` (anti-doublon pour « Transformer en concert »)
```json
{ "application_id": "<app_id>", "date": "...", "start_time": "...", "bands": [{ "name": "...", "musician_id": "..." }], ... }
```
- Si un concert existe déjà pour cette candidature (`<app_id>_concert` ou `application_id` identique) → **200** avec le concert existant. Rien n'est créé, aucune notification n'est envoyée.
- Sinon → création avec **`id = <app_id>_concert`**, en enregistrant `application_id` et `planning_slot_id`.
- **404** `Application not found` si la candidature est inconnue. **403** si son créneau appartient à un autre établissement.
- 👉 **Envoyez toujours `application_id`** depuis « Transformer en concert ». C'est la clé de dédoublonnage.

### Migration idempotente au démarrage (`backfill_missing_application_concerts`)
Pour chaque candidature `accepted` :
- avec un créneau qui **existe encore** et une date **≥ aujourd'hui** ;
- sans concert, ni par `id`, ni par `application_id` ;
- et sans concert existant avec le **même `venue_id` + même `date` + même `musician_id`** (champ `musician_id` ou `bands.musician_id`) : c'est la protection contre les concerts déjà créés par le mobile ;

→ le concert est créé, avec la même logique que l'acceptation.

**Résultat de la 1ʳᵉ exécution : 11 concerts créés.**
- **Le Bar Test** : BassPlayer (22/10), Au final (30/10), Jazz Masters (08/11), Test Band No GPS (25/11), toto (29/11).
- **LE DB** : 6 concerts (22/10, 30/10, 06/11, 12/11, 18/11, 30/11).
- **Non recréés, car leur date est passée** : Marc Acoustique ×3 (juillet), Bordeaux Acoustic (01/10), Les Rockers Parisiens (08/10).
- Les profils musiciens des données de test n'existent pas : il n'y a donc pas de copie dans leur planning.

### `DELETE /planning/{slot_id}`
✅ Confirmé : autorisé même avec des candidatures acceptées (seul contrôle : le créneau appartient à l'établissement). Le concert et sa copie dans le planning musicien **ne sont pas** supprimés.

## ✅ Recette (après Deploy)
1. Accepter → `GET /concerts/<app>_concert` 200, `bands` rempli, concert présent dans le planning du musicien.
2. `DELETE /concerts/<app>_concert`, puis ré-accepter → le concert est recréé.
3. « Transformer en concert » avec `application_id` → pas de doublon (même id renvoyé).
4. `DELETE /planning/{slot}` avec une candidature acceptée → 200.

Merci ! 🎸
