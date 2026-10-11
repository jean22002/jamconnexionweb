# 📱 RÉPONSE WEB → MOBILE — Retours Plateaux (Build 226 mobile → Build 227 backend)

Bonjour, merci pour les retours ! Les 7 points sont traités côté backend (et Web). **Effectif en prod après le prochain Deploy Web.**

---

## 1. 🔴 Chat de groupe absent pour les plateaux déjà complets — ✅ CORRIGÉ (double sécurité)
- **Migration idempotente au démarrage du serveur** : pour chaque plateau `status="active"` sans conversation, création de `conv_plateau_<12 premiers caractères du plateau_id>` (`type="plateau_group"`) + notif `plateau_group_chat_created` (+ push). Rejouable sans doublon.
- **Création à la volée** : tout accès à une conversation `conv_plateau_*` absente (GET conv, GET messages, POST message, PUT read, socket `join_conversation` / `send_message`) la crée si l'utilisateur est **membre accepté** d'un plateau `active`.
- **Synchro des participants** : si un membre accepté manque dans `participants`, il est ajouté automatiquement (avec `unread_count` à 0).
- **Nouveau** : `GET /api/plateaus/{id}` renvoie `conversation_id` (string si `active`, sinon `null`) → utilisez-le pour le bouton « Discussion du groupe ».

## 2. 🟠 `GET /api/chat/conversations/{id}` — ✅ AJOUTÉ
Réponse (même forme que chaque élément de `GET /chat/conversations`) :
```json
{
  "id": "conv_plateau_ad9f5a51-ff6",
  "type": "plateau_group",            // ou "direct"
  "name": "Plateau Démo Preview",      // null pour "direct"
  "plateau_id": "ad9f5a51-...",        // null pour "direct"
  "participants": [{ "user_id", "name", "avatar", "role", "last_read_at" }],
  "unread_count": { "<user_id>": 0, "<user_id>": 2 },   // dict par participant
  "my_unread_count": 0,                                  // raccourci pour l'utilisateur courant
  "last_message": { "content", "sender_id", "created_at" } | null,
  "created_at": "ISO", "updated_at": "ISO"
}
```
- 404 `{"detail": "Conversation introuvable"}` si inconnue / pas participant.
- « Vu à HH:MM » en direct : `participants.find(p => p.user_id !== me).last_read_at`.
- ⚠️ `unread_count` reste un **dict** (rétrocompat liste) ; pour un entier utilisez `my_unread_count`.

## 3. 🟠 `PUT /api/chat/conversations/{id}/read` — ✅ CORRIGÉ
- Fonctionne sur `plateau_group` (et crée la conv à la volée si absente, cf. §1).
- Ne renvoie plus 404 sur un 2ᵉ appel consécutif (on teste désormais `matched_count`). Réponse : `{"success": true}`.
- L'événement socket `messages_read` `{conversation_id, reader_id, read_at, message_ids}` est maintenant émis à **tous les participants** (room de la conv + room perso de chacun).

## 4. 🟠 Messages de groupe — ✅ CORRIGÉ
- `GET /chat/conversations/{id}/messages` : chaque message contient **toujours** `sender_name` et `read_by` (complétés pour les anciens messages : nom depuis `participants`, `read_by=[sender_id]`).
- `POST /chat/messages` (REST) émet maintenant aussi `new_message` en socket (avant : rien).
- Socket `new_message` / `message_sent` : payload complet `{id, conversation_id, sender_id, sender_name, sender_avatar, content, type, attachment, is_read, read_by, created_at (ISO string), updated_at}`.
- `sender_name` = vrai nom d'affichage (pseudo musicien / nom établissement), plus le préfixe email.
- **Diffusion à tous les participants** : chaque socket connecté rejoint automatiquement une room perso `user_<user_id>` à la connexion. `new_message`, `user_typing` et `messages_read` sont émis à `[room conv] + [user_<id> de chaque participant]` (dédoublonné). → Un membre du groupe reçoit le message **même s'il n'a pas fait `join_conversation`**, et sur **tous ses appareils**. Filtrez côté client par `conversation_id`.
- Typing : l'événement émis reste **`user_typing`** `{user_id, user_name, conversation_id}` (envoyé à tous les participants sauf l'auteur). On envoie toujours `typing` du client → serveur.

## 5. 🟡 `GET /api/planning` : `venue_name` / `venue_city` — ✅ CORRIGÉ
Remplis sur `GET /api/planning` (avec ou sans `?venue_id=`), plus `venue_region` et `venue_department`. Vous pouvez supprimer les appels `/venues/{id}` par établissement. Affichage conseillé : `"{venue_name} ({venue_city}) — {date}"`.

## 6. 🟢 Demandes d'intégration — ✅ Web aligné
Le détail plateau Web (admin, plateau non complet) affiche la section « Demandes d'intégration (N) » avec Accepter / Refuser (mêmes endpoints §2.10/2.11). Rien à faire côté mobile.

## 7. 🟢 Push plateau — ✅ AJOUTÉ (SuprSend)
Les 7 types `plateau_*` déclenchent maintenant un push en plus de la notif in-app. Payload `data` :
```json
{
  "title": "...", "message": "...", "type": "plateau_invitation",
  "plateau_id": "...", "conversation_id": "...", "join_request_id": "...",   // si pertinents
  "deeplink": "jamconnexion:///plateaus/<plateau_id>",
  "action_url": "/plateaus/<plateau_id>"
}
```
| type | deeplink |
|---|---|
| `plateau_invitation`, `plateau_response`, `plateau_join_request`, `plateau_join_response`, `plateau_updated` | `jamconnexion:///plateaus/<plateau_id>` |
| `plateau_group_chat_created` | `jamconnexion:///messages/<conversation_id>` |
| `plateau_deleted` | *(aucun deeplink — pas de navigation)* |

Idempotency key : `plateau-<notification_id>`.

**Préférences (NOUVELLE CLÉ)** — `GET/PUT /api/musicians/me/notification-preferences` contient désormais **8 clés** :
`new_messages, friend_requests, badges_unlocked, upcoming_events, application_response, new_event_match, subscription_expiring, plateaus`
- `plateaus` (défaut `true`) coupe les push des 6 types plateau (hors chat).
- `plateau_group_chat_created` est rattaché à `new_messages`.
- 👉 Ajoutez un switch « Plateaux (invitations, réponses, demandes) » dans l'écran Préférences, et **envoyez bien les 8 clés** dans le PUT.
- La notif in-app (`GET /api/notifications`) est toujours créée, quelles que soient les préférences.

---

## ✅ Recette rapide (prod, après Deploy)
1. Ouvrir `conv_plateau_ad9f5a51-ff6` en admin → 200 (plus de 403), messages vides ou existants.
2. `GET /api/chat/conversations/conv_plateau_ad9f5a51-ff6` → 200 avec `type="plateau_group"`, `name`, `plateau_id`.
3. `PUT .../read` deux fois de suite → 200 / 200.
4. Membre B **sans** `join_conversation` reçoit `new_message` quand A écrit ; `sender_name` = pseudo de A.
5. `GET /api/planning` → `venue_name` / `venue_city` non null.
6. Invitation plateau → push reçu, tap → détail du plateau.
7. `plateaus=false` dans les préférences → plus de push invitation (notif in-app toujours là).

Merci ! 🎸
