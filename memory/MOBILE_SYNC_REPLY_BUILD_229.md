# 📱 RÉPONSE WEB → MOBILE — Plateaux côté établissement (mobile Build 229)

Bonjour ! Les 2 besoins + `admin_project` sont en place côté backend (et Web). **Effectif en prod après le prochain Deploy Web.**

---

## 1. ✅ `GET /api/plateaus/browse` (rôles `venue` + `musician`)
Déclarée **avant** `/plateaus/{id}` → plus de 404 « Plateau introuvable ».

| Query param | Défaut | Effet |
|---|---|---|
| `status` | `active` | `pending` / `incomplete` / `active` / `cancelled`, ou `all` (aucun filtre) |
| `q` | — | Insensible à la casse, sur `title` **ou** `members.project_name` |
| `music_style` | — | Correspondance exacte insensible à la casse sur `members.music_styles` |
| `region` / `department` | — | Champs du plateau (copiés du profil admin) |

- Retour : `Plateau[]`, mêmes champs que `GET /plateaus/{id}`, y compris `vacant_slots` et `conversation_id` (string si `active`, sinon `null`).
- Tri : `updated_at` décroissant, **50 maximum**.
- 403 `Réservé aux établissements et musiciens` pour les autres rôles.

## 2. ✅ Concert rattaché à un plateau — `POST /api/concerts` et `PATCH /api/concerts/{id}`
Body accepté tel que vous l'envoyez :
```json
{ "plateau_id": "<id>", "bands": [{ "name": "<titre du plateau>", "id": null, "plateau_id": "<id>", "members_count": 2 }] }
```
- `ConcertBand` accepte maintenant `id` et `plateau_id` ; ils sont conservés et renvoyés.
- Le plateau doit exister (sinon **404** `Plateau introuvable`) et être `active` (sinon **400** `Le plateau doit être complet (active) pour être programmé`).
- Le concert enregistre `plateau_id` et `plateau_title`, renvoyés dans **tous** les GET concerts et dans la réponse POST/PATCH.
- **PATCH** : `plateau_id` est dans la whitelist.
  - Nouvel id → rattachement (+ effets ci-dessous).
  - `"plateau_id": null` → détachement (`plateau_id` et `plateau_title` remis à `null`).
  - Même id que l'actuel → aucun effet.
- **Effets à la programmation** (idempotents : **une seule fois par couple concert ↔ plateau**, même après détachement puis rattachement) :
  1. **Planning** :
     - membre **solo** → ajout dans `musician.concerts[]`, avec `plateau_id`, `plateau_title`, `band_name`, `start_time`, `source: "plateau_concert"`. Visible dans `GET /api/musician/calendar-events`, dont les événements exposent aussi `plateau_id`, `plateau_title`, `band_name` et `time` (fallback `start_time`) ;
     - membre **groupe** → le `band_id` est ajouté à `concert.band_ids[]`. `GET /api/bands/{band_id}/events` matche désormais `band_id` **ou** `band_ids`.
  2. **Notification + push** `plateau_concert_booked` à chaque membre accepté. `data = {plateau_id, concert_id}`, deeplink `jamconnexion:///plateaus/<id>`, préférence musicien `plateaus`.
  3. **Message système** dans le chat de groupe :
     - `sender_id: "system"`, `sender_name: "Jam Connexion"`, `type: "system"`, contenu `📅 Concert confirmé : <Établissement> — YYYY-MM-DD HH:MM` ;
     - émis en socket `new_message` à tous les participants. 👉 Affichez `type === "system"` comme une bulle centrée, sans avatar.
- Le concert reste auto-`confirmed`, puisque `bands` n'est pas vide.

## 3. ✅ `admin_project` sur `POST /api/plateaus`
```json
{ "title": "...", "max_members": 3,
  "admin_project": { "project_kind": "band", "band_id": "<id d'un de MES groupes>" },
  "invited_members": [ ... ] }
```
- Absent, ou `{"project_kind": "solo"}` → l'admin entre en solo (comportement actuel).
- `project_kind: "band"` :
  - le groupe doit être dans `musician.bands[]` de l'admin, sinon **403** `Ce groupe ne vous appartient pas` ;
  - sans `band_id` → **400**.
- Le 1er membre (admin, `accepted`) prend alors `project_kind: "band"`, `band_id`, plus le `project_name`, les `music_styles` et la `photo` du groupe.
- Doublon : on ne peut pas inviter son propre projet admin (400 `Doublon dans les projets invités`).

## Côté Web (aligné)
- Formulaire « Créer un plateau » : sélecteur « Je participe avec » (solo ou un de mes groupes).
- Badge « 🎸 Plateau · <titre> » sur les concerts : onglet Concerts de l'établissement, planning du musicien et calendrier.

## ✅ Recette (prod, après Deploy)
1. Établissement : `GET /plateaus/browse?q=<mot>` → 200 avec une liste.
2. `POST /concerts` avec un plateau non complet → 400. Avec un plateau `active` → 200, `plateau_title` rempli.
3. Membres : notif et push `plateau_concert_booked`, concert visible dans le planning, message système dans le chat de groupe.
4. `PATCH /concerts/{id}` `{"plateau_id": null}`, puis de nouveau l'id → pas de 2ᵉ notification.
5. `POST /plateaus` avec `admin_project` sur un groupe à moi → `members[0].project_kind == "band"`. Sur un groupe qui n'est pas à moi → 403.

Merci ! 🎸
