# 📱 MESSAGE À COPIER-COLLER À L'AGENT DE L'APP MOBILE

---

Bonjour,

Le **site Web** (Builds 211 → 220) a reçu plusieurs évolutions **backend + UI** qu'il faut maintenant reproduire **à l'identique** dans l'application mobile (React Native / Expo). Le **backend est partagé** (même API FastAPI, même base MongoDB) : **aucun nouvel endpoint n'est à créer côté serveur**, tout existe déjà. Ton travail = **consommer ces endpoints** et **reproduire les écrans/comportements**.

Ce README est la **source de vérité**. Respecte exactement : les noms de champs, les valeurs de statut, les codes HTTP, les règles métier. Ne renomme rien.

**Règles générales**
- Toutes les routes sont préfixées par `/api` (ex : `https://<BASE_URL>/api/plateaus`).
- Auth : header `Authorization: Bearer <token>` (JWT existant, inchangé).
- Toutes les dates sont des strings ISO 8601 UTC (`created_at`, `updated_at`, `invited_at`…). Les dates de créneaux restent `YYYY-MM-DD`.
- Les routes **PATCH** ignorent **silencieusement** les clés hors whitelist (pas d'erreur 400 pour une clé inconnue). Elles renvoient **400** seulement si le body est vide ou ne contient **aucune** clé autorisée.
- Erreurs : le champ `detail` est soit une **string** (message FR prêt à afficher dans un toast), soit un **objet** `{message, code, ...}` (cas 409 candidature). Gère les deux : `typeof detail === 'string' ? detail : detail?.message`.

Sommaire :
1. Plateaux — concept, modèles, statuts, règles — **nouveau, prioritaire**
2. Plateaux — endpoints
3. Candidature d'un plateau à un créneau
4. Chat de groupe automatique du plateau
5. Notifications plateau + deep links
6. Côté Venue : badge « 🎸 Plateau » + filtre « Uniquement les plateaux »
7. PATCH partiels (concerts, jams, karaoké, spectacle, planning, profils)
8. Préférences de notifications (musicien / mélomane / venue)
9. Candidatures : reconsidérer (reset) + auto-confirm concert
10. Structure d'écrans + code React Native
11. Checklist de recette

---

## 1. 🎸 PLATEAUX — Concept

Un **plateau** = une soirée multi-artistes auto-organisée par des musiciens. Un musicien (l'**admin**) crée le plateau, invite d'autres **projets** (un projet = un musicien en **solo** OU un de ses **groupes**). Chaque invité accepte ou refuse. Quand le plateau est complet, l'admin peut le **proposer comme UNE SEULE candidature** à un créneau d'un établissement.

### 1.1 Modèle `Plateau` (réponse API)

```json
{
  "id": "uuid",
  "admin_user_id": "user_id de l'admin",
  "admin_musician_id": "musician.id de l'admin",
  "admin_name": "Pseudo admin",
  "title": "Soirée Rock du Sud",
  "description": "texte libre",
  "max_members": 4,
  "status": "pending | incomplete | active | cancelled",
  "members": [ PlateauMember, ... ],
  "country": "France", "region": "Occitanie", "department": "34", "city": "Montpellier",
  "created_at": "2026-06-10T12:00:00+00:00",
  "updated_at": "2026-06-10T12:00:00+00:00",
  "vacant_slots": 2
}
```
> `vacant_slots` est calculé par le serveur et présent uniquement sur `GET /plateaus/open` et `GET /plateaus/{id}`. Ailleurs, calcule-le : `max_members - nb membres status="accepted"`.
> `country/region/department/city` sont copiés du profil de l'admin à la création (servent aux filtres).

### 1.2 Modèle `PlateauMember`

```json
{
  "user_id": "user_id du propriétaire du projet",
  "musician_id": "musician.id",
  "project_kind": "solo | band",
  "band_id": "id du groupe inline (musician.bands[].id) ou null si solo",
  "project_name": "Nom du groupe OU pseudo si solo",
  "music_styles": ["Rock", "Blues"],
  "photo": "url ou null",
  "status": "pending | accepted | rejected",
  "invited_at": "ISO",
  "responded_at": "ISO ou null"
}
```
> L'admin est **automatiquement** le 1er membre avec `status="accepted"` et `project_kind="solo"`.

### 1.3 Statuts du plateau (calculés par le serveur — ne jamais les forcer côté client)

| `status` | Signification | UI |
|---|---|---|
| `pending` | Au moins 1 invité n'a pas encore répondu | Badge gris « En attente de réponses » |
| `incomplete` | Personne en attente MAIS des places libres (`accepted < max_members`) → **visible dans « Intégrer un plateau »** | Badge ambre « X place(s) libre(s) » |
| `active` | `accepted == max_members` → complet, peut candidater | Badge vert « ✓ Complet » |
| `cancelled` | Réservé (non utilisé pour l'instant) | — |

Les membres `rejected` sont ignorés dans le calcul.

### 1.4 Règles métier (validées par le serveur)
- Seul un utilisateur `role="musician"` peut créer / demander à rejoindre (sinon 403 « Réservé aux musiciens »).
- `max_members` : entre **2 et 6** (défaut 4). **L'admin compte comme 1 membre.**
- Création : **au moins 1 invité** et **nb invités < max_members** (sinon 400).
- Pas de doublon `(musician_id, band_id)` dans les invités (400 « Doublon dans les projets invités »).
- Seul l'admin peut modifier / supprimer / inviter / traiter les demandes (403 sinon).
- Demande d'intégration possible uniquement si `status == "incomplete"` et si tu n'es pas déjà membre.
- Le projet proposé dans une demande d'intégration doit t'appartenir (403 « Ce projet ne vous appartient pas »).

---

## 2. 🔌 PLATEAUX — Endpoints

Base : `/api/plateaus` — tous nécessitent le Bearer token.

### 2.1 `POST /api/plateaus` — Créer
```json
// Body
{
  "title": "Soirée Rock du Sud",
  "description": "3 groupes rock, 45 min chacun",
  "max_members": 4,
  "invited_members": [
    { "musician_id": "m-123", "project_kind": "band", "band_id": "b-456" },
    { "musician_id": "m-789", "project_kind": "solo", "band_id": null }
  ]
}
```
- 200 → objet `Plateau` complet (status = `pending`).
- Chaque invité reçoit une notification `plateau_invitation`.
- Erreurs : 400 (règles §1.4), 403 (pas musicien), 404 (`Musicien X introuvable` / `Groupe X introuvable sur le musicien`).

**Comment lister les projets invitables** (identique au Web) :
`GET /api/musicians?limit=100&page=N` (⚠️ **limit max = 100**, au-delà → HTTP 422 ; boucler sur `page` tant que la page renvoie 100 éléments, max 5 pages). Pour chaque musicien (en excluant soi-même `m.user_id !== me.user_id`) :
- 1 projet **solo** : `{musician_id: m.id, project_kind: "solo", band_id: null, label: m.pseudo}`
- 1 projet **par groupe** de `m.bands[]` ayant un id (`b.id || b.band_id`) : `{musician_id: m.id, project_kind: "band", band_id: bid, label: b.name}`
- Recherche locale sur `label` + styles + ville. Bloquer la sélection quand `selected.length + 1 >= max_members` (toast « Max N invités (vous comptez comme 1) »).

### 2.2 `GET /api/plateaus/my` — Mes plateaux
Plateaux où je suis admin **ou** membre (y compris invitations en attente). Tri `created_at` desc. Retourne `Plateau[]`.
> Pour détecter une **invitation en attente** : `plateau.members.some(m => m.user_id === me.user_id && m.status === "pending")` → afficher la modale Accepter/Refuser.

### 2.3 `GET /api/plateaus/open` — Plateaux avec places libres
Query params optionnels : `country`, `region`, `department`, `music_style` (match sur `members.music_styles`).
Retourne `Plateau[]` (status=`incomplete`) avec `vacant_slots`.

### 2.4 `GET /api/plateaus/{id}` — Détail
Retourne `Plateau` + `vacant_slots`. 404 « Plateau introuvable ».

### 2.5 `PATCH /api/plateaus/{id}` — Modifier (admin)
Body partiel : `{ "title"?, "description"?, "max_members"? (2–6) }`. 400 si vide. Retourne le `Plateau` mis à jour. Notifie les membres acceptés (`plateau_updated`).

### 2.6 `DELETE /api/plateaus/{id}` — Supprimer (admin)
200 `{"message": "Plateau supprimé"}`. Notifie tous les membres (`plateau_deleted`). Confirmer avec une alerte native avant l'appel.

### 2.7 `POST /api/plateaus/{id}/invite` — Inviter d'autres projets (admin)
```json
{ "members": [ { "musician_id": "m-1", "project_kind": "solo", "band_id": null } ] }
```
- Places libres = `max_members - accepted - pending`. 400 « Aucune place disponible » / « Trop d'invités : N place(s) libre(s) » / « Tous les invités sont déjà dans le plateau ».
- Doublons ignorés silencieusement. Retourne le `Plateau` mis à jour.

### 2.8 `POST /api/plateaus/{id}/respond` — Répondre à une invitation (invité)
```json
{ "accept": true, "musician_id": "m-123" }
```
- `musician_id` = celui du membre pending me concernant (`members.find(m => m.user_id === me.user_id && m.status === "pending").musician_id`).
- 200 `{"message": "Réponse enregistrée", "plateau_status": "pending|incomplete|active"}`.
- 404 « Aucune invitation en attente pour vous ».
- Si le plateau passe `active` → création auto du **chat de groupe** (§4). L'admin reçoit `plateau_response`.

### 2.9 `POST /api/plateaus/{id}/request-join` — Proposer mon projet (extérieur)
```json
{ "musician_id": "<mon musician.id>", "project_kind": "band", "band_id": "<id de MON groupe>" }
```
- Sélecteur « Mon projet » = `[{solo: profile.pseudo + " (solo)"}, ...profile.bands]` (même construction que §2.1 mais sur MON profil).
- 200 `{"message": "Demande envoyée à l'admin", "join_request_id": "uuid"}`.
- 400 « Ce plateau n'a plus de places vacantes » / « Vous êtes déjà membre de ce plateau ». 403 si projet pas à moi.
- L'admin reçoit `plateau_join_request`.

### 2.10 `GET /api/plateaus/{id}/join-requests` — Demandes en attente (admin)
Retourne :
```json
[{
  "id": "join_request_id", "plateau_id": "...", "status": "pending", "created_at": "ISO",
  "user_id": "...", "musician_id": "...", "project_kind": "band", "band_id": "...",
  "project_name": "...", "music_styles": [], "photo": null
}]
```

### 2.11 `POST /api/plateaus/{id}/respond-join-request?join_request_id=<id>` — Traiter une demande (admin)
⚠️ `join_request_id` est un **query param**, pas dans le body.
```json
{ "accept": true }
```
- 200 `{"message": "Réponse enregistrée"}`. Si accepté → ajouté comme membre `accepted` ; si le plateau devient `active` → chat de groupe auto.
- 400 « Demande déjà traitée » / « Plateau déjà complet ». 404 « Demande introuvable ».
- Le demandeur reçoit `plateau_join_response`.

> 💡 Sur le Web, l'écran admin des demandes d'intégration (§2.10/2.11) n'a pas encore d'UI dédiée (les demandes arrivent en notification). **Sur mobile, implémente-le dans le détail du plateau (admin uniquement)** : section « Demandes d'intégration » avec boutons Accepter / Refuser. Le Web s'alignera ensuite.

---

## 3. 📨 Candidature d'un plateau à un créneau

Endpoint existant **inchangé**, avec un nouveau champ : `POST /api/applications`

```json
{ "planning_slot_id": "<slot_id>", "plateau_id": "<plateau_id>" }
```
Conditions serveur :
- L'utilisateur doit être **admin** du plateau (403 « Seul l'admin du plateau peut le proposer à un créneau »).
- Le plateau doit être `active` (400 « Le plateau doit être complet et validé pour candidater »).
- Créneau ouvert (404 « Planning slot not found or closed »).
- Anti-doublon par `(planning_slot_id, plateau_id)` → **409** `detail = {message, code: "APPLICATION_ALREADY_EXISTS", existing_application_id}`.
- Une candidature plateau **n'empêche pas** l'admin de candidater aussi en solo/groupe sur le même créneau (dédoublonnage séparé).

Réponse `ConcertApplicationResponse` enrichie :
```json
{
  "id": "...", "planning_slot_id": "...", "status": "pending",
  "musician_id": "<admin musician id>", "musician_name": "<pseudo admin>",
  "band_name": "<titre du plateau>",
  "band_type": "plateau",
  "plateau_id": "...", "plateau_title": "Soirée Rock du Sud",
  "plateau_members": [
    { "musician_id": "...", "project_name": "...", "music_styles": [], "band_id": null, "project_kind": "solo" }
  ]
}
```
La venue reçoit la notif `application_received`, titre « Nouvelle candidature (Plateau) », message `🎸 Plateau "X" (N artistes) a postulé pour le YYYY-MM-DD`.

**UI mobile (détail plateau)** : bouton « Proposer à un créneau » visible **uniquement si** `plateau.admin_user_id === me.user_id && plateau.status === "active"`. Il ouvre un sélecteur des créneaux ouverts : `GET /api/planning` (filtrer `is_open === true`), affiche `venue_name — date`. Puis `POST /api/applications`. Toast succès « Plateau proposé au créneau 🎸 ».

---

## 4. 💬 Chat de groupe automatique

Quand un plateau passe **`active`** (tous acceptés et complet), le serveur crée **une seule fois** une conversation :
```json
{
  "id": "conv_plateau_<12 premiers caractères du plateau_id>",
  "type": "plateau_group",
  "plateau_id": "...",
  "name": "<titre du plateau>",
  "participants": [{ "user_id", "role": "musician", "name", "avatar", "last_read_at" }],
  "unread_count": { "<user_id>": 0 }
}
```
- Elle apparaît dans `GET /api/chat/conversations` (endpoints chat **existants** : `GET /chat/conversations/{id}/messages`, `POST /chat/messages` `{conversation_id, content, type}`, `PUT /chat/conversations/{id}/read`).
- ℹ️ Le Web n'affiche pas encore les conversations `/chat/*` (il utilise l'ancienne messagerie `/messages/*`). **Le mobile est donc la référence** pour l'affichage du chat de groupe plateau.
- **À adapter côté mobile** : si `conv.type === "plateau_group"` → afficher `conv.name` comme titre (pas « l'autre participant »), une icône groupe 🎸, et dans les bulles afficher le **nom de l'expéditeur** (plusieurs participants).
- Chaque membre reçoit une notif `plateau_group_chat_created` avec `data.conversation_id`.

---

## 5. 🔔 Notifications plateau + deep links

Les notifications plateau sont stockées dans la collection existante → `GET /api/notifications` (ancien endpoint, inchangé). Champs : `type`, `title`, `message`, `link`, `data`, `read`.

| `type` | Destinataire | `data` | `link` (Web) | Route mobile à ouvrir |
|---|---|---|---|---|
| `plateau_invitation` | invité | `plateau_id`, `musician_id` | `/musician?tab=plateaus&plateau_id=X` | Écran Plateaux → détail X → modale Accepter/Refuser |
| `plateau_response` | admin | `plateau_id`, `member` | idem | Détail plateau X |
| `plateau_join_request` | admin | `plateau_id`, `join_request_id`, `requester` | idem | Détail plateau X → section demandes |
| `plateau_join_response` | demandeur | `plateau_id`, `join_request_id`, `accepted` | idem si accepté, sinon `null` | Détail X si accepté |
| `plateau_updated` | membres acceptés | `plateau_id` | idem | Détail X |
| `plateau_deleted` | membres | `plateau_id`, `plateau_title` | `null` | Aucune navigation |
| `plateau_group_chat_created` | membres | `plateau_id`, `conversation_id` | `/musician?tab=plateaus&plateau_id=X` | **Chat → conversation `data.conversation_id`** |

**Règle de routage mobile** : ne parse pas le `link` web ; utilise `type` + `data.plateau_id` / `data.conversation_id`. Exemple :
```ts
export function routeFromNotification(n: Notif, router) {
  const d = n.data || {};
  if (n.type === 'plateau_group_chat_created' && d.conversation_id)
    return router.push(`/messages/${d.conversation_id}`);
  if (n.type?.startsWith('plateau_') && d.plateau_id && n.type !== 'plateau_deleted')
    return router.push({ pathname: '/plateaus/[id]', params: { id: d.plateau_id } });
}
```
> ⚠️ Ces événements plateau sont **in-app uniquement** (pas encore de push SuprSend). Rafraîchis la liste de notifications au focus de l'écran / pull-to-refresh. Si vous voulez du push, demandez-le au Web : on l'ajoutera côté serveur avec `deeplink: "jamconnexion:///plateaus/<id>"`.

---

## 6. 🏠 Côté VENUE — Badge & filtre Plateaux

### 6.1 Compteur par créneau
`GET /api/planning?venue_id=<venue.id>` (et `is_open`, `include_past` existants) renvoie désormais sur chaque créneau :
```json
{ "id": "...", "date": "2026-10-12", "applications_count": 5, "accepted_bands_count": 1, "plateau_count": 2 }
```
`plateau_count` = nb de candidatures plateau sur ce créneau (défaut `0`, toujours présent). ⚠️ Présent **uniquement** sur `GET /api/planning` (pas sur `/planning/search` ni `/venues/{id}/planning`).

### 6.2 Écran « Candidatures » (liste des créneaux)
- **Switch** en haut : « 🎸 Afficher uniquement les plateaux (N créneau(x)) » où N = nb de créneaux avec `plateau_count > 0`. Filtre **côté client** : `slots.filter(s => (s.plateau_count ?? 0) > 0)`.
- État vide quand le filtre est actif : « Aucun créneau n'a reçu de candidature plateau pour le moment ».
- Sur chaque carte créneau avec `plateau_count > 0` : badge ambre « 🎸 N plateau(x) » + bordure ambre légère.

### 6.3 Écran « Candidatures d'un créneau » (`GET /api/planning/{slot_id}/applications`)
Détection : `const isPlateau = app.band_type === "plateau" || !!app.plateau_id;`
Si plateau :
- Badge **« 🎸 Plateau »** (ambre) devant le nom.
- Nom affiché : `app.plateau_title || app.band_name || app.musician_name`.
- Bloc « N artistes dans ce plateau » listant `app.plateau_members[]` : `project_name` + `music_styles` (2 max).
- Ligne « Admin du plateau : **{app.musician_name}** ».
- Bouton accepter libellé **« ✓ Accepter le plateau »** (au lieu de « Accepter seul »).
- Fond/bordure ambre pour distinguer de la candidature classique.
Accept / Reject / Reset : **mêmes endpoints** que les candidatures classiques (`POST /applications/{id}/accept`, `/reject`, `PATCH /applications/{id}`).

---

## 7. ✏️ PATCH partiels (update partiel — à utiliser à la place des PUT complets)

Corrige le bug mobile « toast Succès mais rien n'est sauvegardé » (PUT Pydantic complet qui rejetait les payloads partiels). Envoie **uniquement les champs modifiés**. Les PUT restent disponibles (rétrocompat) mais **PATCH = canonique**.

| Endpoint | Rôle | Whitelist |
|---|---|---|
| `PATCH /api/concerts/{id}` | venue | `status` (pending/confirmed/cancelled, sinon 400), `title`, `description`, `artist_name`, `bands`, `price`, `music_styles`, `start_time`, `end_time`, `payment_method`, `payment_mode`, `amount`, `payment_status`, `invoice_file`, `has_catering`, `catering_drinks`, `catering_respect`, `catering_tbd`, `has_accommodation`, `accommodation_capacity`, `accommodation_tbd`, `is_guso`, `cachet_type`, `guso_contract_type` |
| `PATCH /api/jams/{id}` | venue | `title`, `description`, `date`, `start_time`, `end_time`, `music_styles`, `expected_musicians`, `max_participants`, `has_pa_system`, `instruments_available`, `additional_info`, `has_catering`, `catering_drinks`, `catering_meals`, `payment_method`, `payment_mode`, `amount`, `payment_status`, `invoice_file` |
| `PATCH /api/karaoke/{id}` | venue | `title`, `description`, `date`, `start_time`, `end_time`, `music_styles`, `host_name`, `has_catering`, `catering_drinks`, `catering_meals`, `payment_method`, `payment_mode`, `amount`, `payment_status`, `invoice_file` |
| `PATCH /api/spectacle/{id}` | venue | `title`, `description`, `date`, `start_time`, `end_time`, `type`, `artist_name`, `price` (string), `ticket_price` (float), `is_free`, `music_styles`, `has_catering`, `has_accommodation`, `payment_method`, `payment_mode`, `amount`, `payment_status`, `invoice_file` |
| `PATCH /api/planning/{slot_id}` | venue | `type`, `date`, `time`, `start_time`, `end_time`, `title`, `description`, `music_styles`, `expected_band_style`, `max_participants`, `expected_attendance`, `artist_categories`, `num_bands_needed`, `application_type`, `is_guso`, `formation_type`, `max_musicians`, `payment`, `payment_type`, `has_catering`, `catering_drinks`, `catering_respect`, `catering_tbd`, `has_meals`, `meals_count`, `meals_tbd`, `has_accommodation`, `accommodation_capacity`, `accommodation_tbd`, `is_open` |
| `PATCH /api/musicians/me` | musician | `pseudo`, `bio`, `age`, `city`, `postal_code`, `department`, `region`, `latitude`, `longitude`, `phone`, `guso_number`, `is_guso_member`, `instruments`, `music_styles`, `profile_image`, `banner_image`, `facebook`, `instagram`, `youtube`, `website`, `bandcamp`, `bands` (tableau complet) |
| `PATCH /api/venues/me` | venue | `name`, `description`, `city`, `postal_code`, `department`, `region`, `address`, `latitude`, `longitude`, `phone`, `website`, `music_styles`, `facebook`, `instagram`, `profile_image`, `banner_image`, `cover_image`, `gallery`, `capacity`, `amenities`, `equipment`, `has_stage`, `has_sound_engineer`, `has_pa_system`, `has_lights`, `stage_size`, `pa_mixer_name`, `pa_speakers_name`, `pa_power`, `has_auto_light`, `has_light_table`, `opening_hours`, `show_reviews`, `allow_messages_from`, `is_guso` |
| `PATCH /api/melomanes/me` | melomane | `pseudo`, `bio`, `city`, `postal_code`, `department`, `region`, `country`, `latitude`, `longitude`, `phone`, `favorite_styles`, `favorite_venues`, `notification_radius_km`, `notifications_enabled`, `profile_picture`, `cover_photo`, `facebook`, `instagram`, `twitter` — **alias acceptés** : `profile_image`→`profile_picture`, `banner_image`/`cover_image`→`cover_photo`, `notification_radius`→`notification_radius_km`, `music_styles`→`favorite_styles` |

Règles : 403 si mauvais rôle, 404 si ressource pas à toi, 400 si aucune clé valide. Réponse = l'objet complet mis à jour (même modèle que le GET). `notification_preferences` et `is_verified` sont **exclus** (endpoints dédiés / admin).

---

## 8. 🔕 Préférences de notifications (filtrage côté serveur)

Le serveur **n'envoie plus** les notifs désactivées (économie push + sync multi-device). Le mobile n'a plus à filtrer localement.

| Rôle | Endpoints | Clés (toutes `true` par défaut) |
|---|---|---|
| musician | `GET` / `PUT /api/musicians/me/notification-preferences` | `new_messages`, `friend_requests`, `badges_unlocked`, `upcoming_events`, `application_response`, `new_event_match`, `subscription_expiring` |
| melomane | `GET` / `PUT /api/melomanes/me/notification-preferences` | `new_messages`, `friend_requests`, `upcoming_events`, `new_event_match` |
| venue | `GET` / `PUT /api/venues/me/notification-preferences` | `new_participants`, `new_applications`, `application_cancellation`, `new_messages`, `new_followers` |

- Body PUT = objet plat `{ "new_messages": true, "friend_requests": false, ... }`. **Envoie toujours toutes les clés** (PUT = remplacement ; clés hors whitelist ignorées). 403 si mauvais rôle.
- UI : un écran « Notifications » dans Paramètres avec 1 switch par clé, sauvegarde à chaque toggle (optimistic update + rollback en cas d'erreur).

---

## 9. 📋 Candidatures & concerts — règles serveur à respecter

- **Reconsidérer une candidature** (venue) : `PATCH /api/applications/{id}` body `{"status": "pending"}` (alias `POST /api/applications/{id}/reset`).
  Réponse : `{"message": "Application reset to pending", "status": "pending", "previous_status": "accepted|rejected"}`.
  Si elle était `accepted` : le concert auto-créé est supprimé et le créneau rouvert si besoin. **Pas** de notif au musicien.
  Pour `accepted`/`rejected` → utiliser `POST /applications/{id}/accept` ou `/reject` (le PATCH renvoie 400).
- **Auto-confirm concert** : `POST /api/concerts` sans `status` → le serveur met `confirmed` si `bands` non vide ou `artist_name` renseigné, sinon `pending`. **Supprime la logique de forçage côté mobile** et n'envoie plus `status`.
- Modifier un groupe : canonique `PUT /api/musicians/bands/{band_id}`.

---

## 10. 🗂️ Structure d'écrans suggérée (Expo Router)

```
app/
├── (tabs)/plateaus/index.tsx      ← Segmented control : Mes plateaux | Créer | Intégrer
├── plateaus/[id].tsx              ← Détail : membres + statuts, actions admin, demandes, "Proposer à un créneau"
├── plateaus/create.tsx            ← Formulaire (titre, description, stepper max 2–6, recherche projets multi-select)
└── venue/candidatures.tsx         ← + Switch "Uniquement les plateaux" + badge par créneau
components/plateau/
├── PlateauCard.tsx                ← titre, admin_name, badge statut/places, membres acceptés (+2 styles)
├── PlateauInviteModal.tsx         ← Accepter / Refuser (§2.8)
├── JoinPlateauSheet.tsx           ← choix "Mon projet" + envoi (§2.9)
├── JoinRequestsList.tsx           ← admin (§2.10/2.11)
└── ApplyPlateauSheet.tsx          ← choix créneau ouvert (§3)
```
Libellés identiques au Web : « 📋 Mes plateaux », « ➕ Créer un plateau », « 🔗 Intégrer un plateau », « Proposer mon projet », « ✓ Complet », « X place(s) libre(s) », « Admin : {admin_name} ».

### Service API (exemple)
```ts
// services/plateaus.ts
import { api } from './api'; // axios instance avec baseURL `${BASE_URL}/api` + Bearer

export const PlateausAPI = {
  my:      () => api.get('/plateaus/my').then(r => r.data),
  open:    (f: {country?: string; region?: string; department?: string; music_style?: string} = {}) =>
             api.get('/plateaus/open', { params: f }).then(r => r.data),
  get:     (id: string) => api.get(`/plateaus/${id}`).then(r => r.data),
  create:  (body: { title: string; description?: string; max_members: number;
                    invited_members: { musician_id: string; project_kind: 'solo'|'band'; band_id: string|null }[] }) =>
             api.post('/plateaus', body).then(r => r.data),
  update:  (id: string, body: { title?: string; description?: string; max_members?: number }) =>
             api.patch(`/plateaus/${id}`, body).then(r => r.data),
  remove:  (id: string) => api.delete(`/plateaus/${id}`).then(r => r.data),
  invite:  (id: string, members: any[]) => api.post(`/plateaus/${id}/invite`, { members }).then(r => r.data),
  respond: (id: string, accept: boolean, musician_id?: string) =>
             api.post(`/plateaus/${id}/respond`, { accept, musician_id }).then(r => r.data),
  requestJoin: (id: string, p: { musician_id: string; project_kind: 'solo'|'band'; band_id: string|null }) =>
             api.post(`/plateaus/${id}/request-join`, p).then(r => r.data),
  joinRequests: (id: string) => api.get(`/plateaus/${id}/join-requests`).then(r => r.data),
  respondJoin: (id: string, joinRequestId: string, accept: boolean) =>
             api.post(`/plateaus/${id}/respond-join-request`, { accept },
                      { params: { join_request_id: joinRequestId } }).then(r => r.data),
  applyToSlot: (plateauId: string, slotId: string) =>
             api.post('/applications', { planning_slot_id: slotId, plateau_id: plateauId }).then(r => r.data),
};

export const errMsg = (e: any, fallback = 'Erreur') => {
  const d = e?.response?.data?.detail;
  return typeof d === 'string' ? d : d?.message || fallback;
};
```

### Helpers UI
```ts
export const acceptedMembers = (p) => (p.members || []).filter(m => m.status === 'accepted');
export const vacantSlots = (p) => p.vacant_slots ?? Math.max(p.max_members - acceptedMembers(p).length, 0);
export const isAdmin = (p, me) => p.admin_user_id === me.user_id;
export const myPendingInvite = (p, me) => p.members?.find(m => m.user_id === me.user_id && m.status === 'pending');
export const canApply = (p, me) => isAdmin(p, me) && p.status === 'active';
export const isPlateauApp = (a) => a.band_type === 'plateau' || !!a.plateau_id;

export function buildMyProjects(profile) {
  return [
    { key: `solo-${profile.id}`, label: `${profile.pseudo || 'Moi'} (solo)`, musician_id: profile.id, project_kind: 'solo', band_id: null },
    ...(profile.bands || []).filter(b => b.id || b.band_id).map(b => ({
      key: `band-${b.id || b.band_id}`, label: b.name, musician_id: profile.id, project_kind: 'band', band_id: b.id || b.band_id,
    })),
  ];
}
```

---

## 11. ✅ Checklist de recette (comptes de test)

Comptes : Musicien A `test@gmail.com` / `test` — Venue `bar@gmail.com` / `test` — un 2e compte musicien B pour les invitations.

1. A crée un plateau `max_members=2` en invitant B → status `pending`, B a une notif `plateau_invitation`.
2. B ouvre la notif → arrive sur le détail → Accepte → status `active`, conversation `plateau_group` visible chez A et B.
3. A et B échangent des messages dans le chat de groupe (titre = titre du plateau).
4. A (admin) « Proposer à un créneau » → candidature créée ; 2e envoi → 409 géré (toast « Candidature déjà envoyée sur ce créneau »).
5. B (non admin) ne voit pas le bouton « Proposer à un créneau ».
6. Venue : écran Candidatures → badge « 🎸 1 plateau » sur le créneau ; Switch filtre → seuls les créneaux plateau restent.
7. Venue : détail candidatures → badge « 🎸 Plateau », liste des 2 artistes, « Admin du plateau : A », bouton « ✓ Accepter le plateau ».
8. Plateau `max_members=4` avec 1 invité qui accepte → status `incomplete` → visible dans « Intégrer un plateau » ; un musicien C « Propose son projet » → A voit la demande → Accepte → C est membre.
9. A supprime le plateau → membres notifiés `plateau_deleted`.
10. PATCH : modifier uniquement le titre d'une jam / d'un créneau → la valeur est bien persistée (re-GET).
11. Préférences : couper `new_messages` côté musicien → plus de notif message reçue.

**Important** : toutes ces routes sont en ligne en **Preview Web**. Le propriétaire doit cliquer **« Deploy »** côté Web pour qu'elles soient disponibles en **Production** avant de tester l'app mobile sur la prod.

Merci ! 🎸
