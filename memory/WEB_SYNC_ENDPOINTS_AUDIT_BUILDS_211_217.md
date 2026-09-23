# Sync Web → Mobile — Réponses audit endpoints Builds 211-217

**Statut** : ✅ Traité côté Web (Build 213). Fixes en Preview, déploiement requis pour la Prod.

---

## 🔴 P1 — 4 endpoints à valider

### 1. Confirmation de concert (Build 216) — ✅

**Réponses aux 3 questions :**

- **`POST /api/concerts` accepte-t-il `status` dans le payload ?**
  ✅ **OUI (Build 213)**. Le modèle `ConcertEvent` accepte désormais `status: Optional[str]` et un champ `artist_name: Optional[str]`.
  - Valeurs autorisées : `"pending"` | `"confirmed"` | `"cancelled"`.
  - Si `status` n'est **pas** envoyé, le serveur **auto-confirme** : `bands` non vide **OU** `artist_name` renseigné ⇒ `status = "confirmed"` ; sinon `"pending"`.
  - Recommandé côté mobile : **ne plus envoyer `status`** et laisser le serveur décider (source de vérité unique).

- **`PUT /concerts/{id}` supporte-t-il un update partiel ?**
  ❌ Non — le `PUT` reste un remplacement complet (validation Pydantic `ConcertEvent` obligatoire).
  ✅ **Nouveau endpoint** dédié : `PATCH /api/concerts/{concert_id}` accepte un `dict` partiel.
  - Champs autorisés (whitelist) : `status`, `title`, `description`, `artist_name`, `bands`, `price`, `music_styles`, `start_time`, `end_time`, payment_*, catering_*, accommodation_*, GUSO fields.
  - Retourne `ConcertEventResponse`.
  - Exemple mobile : `PATCH /api/concerts/{id}` body `{"status":"confirmed"}` ⇒ 200 OK.
  - Erreur 400 si `status` invalide (hors pending/confirmed/cancelled).

- **Auto-confirm côté serveur ?**
  ✅ **Fait** (voir plus haut). Le mobile peut supprimer sa logique de "forçage" côté client.

### 2. Reconsidérer une candidature (Build 217) — ✅

**Réponses :**

- **`PATCH /api/applications/{id}` avec `{status: "pending"}` supporté ?**
  ✅ **OUI (Build 213 — nouveau)**. Réponse 200 : `{"message":"Application reset to pending","status":"pending","previous_status":"accepted|rejected"}`.
  - Pour `accepted/rejected`, le PATCH renvoie 400 avec un message d'aide → utiliser `POST /accept` ou `POST /reject` (endpoints dédiés qui gèrent les side-effects).

- **Alias `POST /api/applications/{id}/reset`** :
  ✅ **Existe (Build 213)**. Comportement identique au PATCH `{status: "pending"}`.

- **Endpoint canonique côté Web** :
  Le Web n'avait pas encore ce flow, on aligne sur ces 2 endpoints (PATCH canonique + POST alias). Le composant `ApplicationsModal` va être équipé du bouton "Reconsidérer" dans un prochain build Web.

**⚠️ Logique métier tranchée (côté serveur) :**

1. **Reset d'une candidature `accepted` ⇒ concert associé supprimé automatiquement.**
   - Le serveur retrouve le concert via `id = "{app_id}_concert"` **OU** `application_id = app_id` (double filtre robuste).
   - Requête : `db.concerts.delete_many({$or: [...]})`.

2. **Reset ⇒ slot rouvert automatiquement si nécessaire.**
   - Après suppression du concert, on recompte les candidatures acceptées restantes ; si `< num_bands_needed` ⇒ `is_open = True`.

3. **Notification musicien ?** ❌ **NON** (choix produit).
   - Le musicien voit son statut repasser à "En attente" via `GET /applications/my` ou l'écran candidatures. Pas de notif push pour éviter le bruit ("désolé, on reconsidère").
   - Si l'équipe produit préfère notifier, dis-le, on l'ajoute (ex : notif WebSocket + push avec message générique).

4. **Audit log** ✅ écrit (`action="reset_application"`, resource_id, previous_status, slot_date).

---

## 🟡 P2 — Endpoints existants à croiser

### 3. Modification de bands (Build 214) — Réponse

- **`PUT /api/musicians/bands/{band_id}`** ✅ existe (`routes/bands.py:917`).
- **`PUT /api/musicians/me`** ✅ existe aussi (`routes/musicians.py:509`).
- **Endpoint canonique recommandé** : **`PUT /musicians/bands/{id}`** pour modifier UN band (source de vérité par band).
  - Le fallback vers `PUT /musicians/me` est OK pour rétrocompat mais peut réécrire tout le profil musicien inutilement. À supprimer côté mobile après un cycle si `/bands/{id}` couvre tous les cas.

### 4. Chat — Merge inbox/chat_api (Build 212) — Réponse

- **Un message posté via `/messages/*` est-il répliqué dans `/chat/*` ?**
  ⚠️ **Partiellement.** Historiquement :
  - `/messages/inbox` (legacy) : ancienne collection `messages`, orientée liste "inbox/sent".
  - `/chat/conversations/{id}/messages` (nouveau) : collection `messages` **unifiée** avec `conversation_id`, `read_by[]` (Build 152.19+).
  - Les nouveaux messages envoyés via `POST /api/chat/messages` **sont** visibles dans les 2 vues (via une projection basée sur `sender_id` / `recipient_id` conservés).
  - Les messages **anciens** (avant Build 152.19) postés via l'ancien endpoint `POST /messages/*` peuvent manquer de `conversation_id` → invisibles dans `/chat/conversations/{id}/messages`.

- **Faut-il migrer entièrement vers `/chat/*` ?**
  ✅ Oui à terme. Le Web utilise déjà `/chat/*` en canonique. Le merge côté client mobile est une bonne mitigation temporaire.
  - Migration DB envisageable : script one-shot qui backfille `conversation_id` sur les vieux docs `messages` en le déduisant du couple `(sender_id, recipient_id)`. À planifier si nécessaire.

- **Le Web fait-il aussi ce merge ?**
  ❌ Non. Le Web consomme uniquement `/chat/*` et masque `/messages/*` (legacy).

---

## 📝 Récap des 11 endpoints — Status Prod (après déploiement Build 213)

| # | Endpoint | Méthode | Status |
|---|---|---|---|
| 1 | `/concerts` (body `status`) | POST | ✅ Confirmé + auto-confirm serveur |
| 2 | `/concerts/{id}` (partial `status`) | **PATCH** (nouveau) | ✅ Whitelist champs |
| 3 | `/applications/{id}` (`status: pending`) | **PATCH** (nouveau) | ✅ Reset + cleanup concert + réouverture slot |
| 4 | `/applications/{id}/reset` | **POST** (nouveau alias) | ✅ Identique au PATCH pending |
| 5 | `/musicians/bands/{id}` | PUT | ✅ Canonique |
| 6 | `/musicians/me` | PUT | ✅ Legacy (rétrocompat) |
| 7 | `/musicians/me/cancel-subscription` | POST | ✅ Musicien uniquement |
| 8 | `/chat/conversations/{id}` | GET | ✅ |
| 9 | `/chat/conversations/{id}/messages` | GET | ✅ Canonique |
| 10 | `/messages/inbox` | GET | ✅ Legacy |
| 11 | `/messages/sent` | GET | ✅ Legacy |

---

## Valeurs autorisées (à référencer dans mobile & Web)

### `concerts.status`
- `"pending"` : concert créé sans artiste assigné.
- `"confirmed"` : artiste assigné (auto ou explicite).
- `"cancelled"` : concert annulé.

### `applications.status`
- `"pending"` : en attente de décision (état par défaut à la création).
- `"accepted"` : acceptée par le venue → crée un concert + peut fermer le slot.
- `"rejected"` : rejetée par le venue.
- Transitions autorisées via API :
  - `POST /applications/{id}/accept` → `accepted`
  - `POST /applications/{id}/reject` → `rejected`
  - `PATCH /applications/{id}` `{status: "pending"}` (ou `POST /reset`) → **reconsidérer** (undo).

---

## Build 214 — Notification preferences Musicien & Mélomane

### Musicien — Whitelist 7 clés
- Route : `GET/PUT /api/musicians/me/notification-preferences`
- Auth : rôle `musician` obligatoire (403 sinon)
- Clés : `new_messages`, `friend_requests`, `badges_unlocked`, `upcoming_events`, `application_response`, `new_event_match`, `subscription_expiring`
- Defaults : tous à `true` si jamais sauvegardés
- Comportement PUT : whitelist stricte, remplacement complet (clés absentes = supprimées)

### Mélomane — Whitelist 4 clés
- Route : `GET/PUT /api/melomanes/me/notification-preferences`
- Auth : rôle `melomane` obligatoire (403 sinon)
- Clés : `new_messages`, `friend_requests`, `upcoming_events`, `new_event_match`
- Defaults : tous à `true`
- Comportement PUT : idem musicien

### Backend filtering
`utils/notification_preferences.should_send_notification(user_id, type, user_role)` a été étendu pour lire les prefs Musicien et Mélomane. Le backend arrête d'envoyer les push filtrées à la source (économie SuprSend + sync multi-device automatique).

---

## Build 214 — PATCH partial pour jams / karaoke / spectacle

Résout le bug mobile Build 222 : PUT complet Pydantic rejetait silencieusement quand des champs manquaient → toast "Succès" mais update ignoré.

### PATCH /api/jams/{id} — Whitelist
Contenu : `title`, `description`, `date`, `start_time`, `end_time`, `music_styles`, `expected_musicians`, `max_participants`, `has_pa_system`, `instruments_available`, `additional_info`
Restauration : `has_catering`, `catering_drinks`, `catering_meals`
Compta : `payment_method`, `payment_mode`, `amount`, `payment_status`, `invoice_file`

### PATCH /api/karaoke/{id} — Whitelist
Contenu : `title`, `description`, `date`, `start_time`, `end_time`, `music_styles`, `host_name`
Restauration : `has_catering`, `catering_drinks`, `catering_meals`
Compta : `payment_method`, `payment_mode`, `amount`, `payment_status`, `invoice_file`

### PATCH /api/spectacle/{id} — Whitelist
Contenu : `title`, `description`, `date`, `start_time`, `end_time`, `type`, `artist_name`, `price` (string legacy), `ticket_price` (float), `is_free`, `music_styles`
Restauration : `has_catering`, `has_accommodation`
Compta : `payment_method`, `payment_mode`, `amount`, `payment_status`, `invoice_file`

### Règles communes
- Auth : rôle `venue` obligatoire → 403 sinon
- Clés hors whitelist : silencieusement ignorées (compat forward)
- 400 si body vide ou aucune clé whitelistée
- Retour : `*EventResponse` avec `participants_count`
- PUT complet **conservé** pour rétrocompat (clients avant Build 222 mobile)

### Response models étendus (Build 214)
- `JamEventResponse` : + `max_participants`, `has_catering`, `catering_drinks`, `catering_meals`
- `KaraokeEventResponse` : + `has_catering`, `catering_drinks`, `catering_meals`
- `SpectacleEventResponse` : + `music_styles`, `is_free`, `has_catering`, `has_accommodation`

---

## Build 215 — PATCH partial profils & planning

### PATCH /api/musicians/me (26 champs whitelistés)
Identité : `pseudo`, `bio`, `age`
Localisation : `city`, `postal_code`, `department`, `region`, `latitude`, `longitude`
Contact : `phone`
GUSO : `guso_number`, `is_guso_member`
Musical : `instruments`, `music_styles`
Photos : `profile_image`, `banner_image`
Réseaux : `facebook`, `instagram`, `youtube`, `website`, `bandcamp`
Groupes : `bands` (array complet)

Note : `notification_preferences` **exclu** (endpoint dédié).

### PATCH /api/venues/me (whitelist étendue)
Identité : `name`, `description`
Localisation : `city`, `postal_code`, `department`, `region`, `address`, `latitude`, `longitude`
Contact : `phone`, `website`
Musical : `music_styles`
Réseaux : `facebook`, `instagram`
Photos : `profile_image`, `banner_image`, `cover_image`, `gallery`
Équipements : `capacity`, `amenities`, `equipment`, `has_stage`, `has_sound_engineer`, `has_pa_system`, `has_lights`, `stage_size`, `pa_mixer_name`, `pa_speakers_name`, `pa_power`, `has_auto_light`, `has_light_table`
Autres : `opening_hours`, `show_reviews`, `allow_messages_from`, `is_guso`

Note : `is_verified` **exclu** (admin only). `notification_preferences` **exclu** (endpoint dédié).

### PATCH /api/melomanes/me (13 champs + alias mobile)
Alias mobile → canoniques DB :
- `profile_image` → `profile_picture`
- `banner_image` / `cover_image` → `cover_photo`
- `notification_radius` → `notification_radius_km`
- `music_styles` → `favorite_styles`

Whitelist canonique : `pseudo`, `bio`, `city`, `postal_code`, `department`, `region`, `country`, `latitude`, `longitude`, `phone`, `favorite_styles`, `favorite_venues`, `notification_radius_km`, `notifications_enabled`, `profile_picture`, `cover_photo`, `facebook`, `instagram`, `twitter`

Note : `notification_preferences` **exclu** (endpoint dédié).

### PATCH /api/planning/{slot_id} (whitelist complète)
Temporel : `type`, `date`, `time`, `start_time`, `end_time`
Contenu : `title`, `description`
Musical : `music_styles`, `expected_band_style`
Config : `max_participants`, `expected_attendance`, `artist_categories`, `num_bands_needed`, `application_type`, `is_guso`, `formation_type`, `max_musicians`
Paiement : `payment`, `payment_type`
Catering : `has_catering`, `catering_drinks`, `catering_respect`, `catering_tbd`, `has_meals`, `meals_count`, `meals_tbd`
Hébergement : `has_accommodation`, `accommodation_capacity`, `accommodation_tbd`
Statut : `is_open` (toggle manuel côté venue supporté)

### Règles communes (identiques aux PATCH précédents)
- Auth stricte : rôle correspondant obligatoire (403 sinon)
- Clés hors whitelist silencieusement ignorées
- 400 si body vide ou aucune clé valide
- Retour : `*Response` complet du doc mis à jour
- PUT existant conservé pour rétrocompat

### Response models étendus
- `MusicianProfileResponse` : + `banner_image`
- `VenueProfileResponse` : + `capacity`, `amenities`, `banner_image`
- `MelomaneResponse` : + `phone`, `department`, `music_styles`, `profile_image`, `banner_image`, `notification_radius` (alias sortie)
- `PlanningSlotResponse` : + `start_time`, `end_time`, `max_participants`, `payment_type`, `type`
