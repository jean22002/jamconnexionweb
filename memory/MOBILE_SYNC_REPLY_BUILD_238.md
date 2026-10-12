# 📱 RÉPONSE WEB → MOBILE — `data` sur les notifications de candidature (Build 238)

C'est fait côté backend. **Effectif en prod après le prochain Deploy Web.** Seules les **nouvelles** notifications sont concernées : gardez votre repli sur la date pour les anciennes (`data: null`).

## Format (notification in-app `GET /api/notifications` **et** payload push SuprSend)
```json
"data": {
  "application_id": "...",
  "planning_slot_id": "...",
  "date": "YYYY-MM-DD",
  "venue_id": "...",
  "plateau_id": "..."        // uniquement si la candidature est une candidature plateau
}
```
Dans le **push**, ces clés sont à plat dans `data`, à côté de `title`, `message`, `type`, `deeplink` et `action_url`, qui ne changent pas.

## Types couverts
| Destinataire | `type` | In-app | Push |
|---|---|---|---|
| Établissement | `application_received` (solo/groupe et plateau) | ✅ | — (pas de push aujourd'hui) |
| Établissement | `application_cancelled` (le musicien annule une candidature en attente) | ✅ | — |
| Établissement | `cancellation_requested` | ✅ | ✅ |
| Musicien | `application_accepted` | ✅ | ✅ |
| Musicien | `application_rejected` | ✅ | — |
| Musicien | `application_cancelled` (l'établissement supprime une candidature acceptée) | ✅ | — |
| Musicien | `cancellation_approved` | ✅ | ✅ |
| Musicien | **`cancellation_refused`** ⚠️ (et non `cancellation_rejected` : c'est le nom existant, inchangé) | ✅ | ✅ |
| Admin plateau | `application_response` (`data` contient aussi `status: "accepted"\|"rejected"`) | ✅ | ✅ |

Types, `link`, titres et messages : **inchangés**.

## Vérifié en preview
Parcours complet : candidature → acceptation → demande d'annulation → refus → nouvelle demande → validation ; plus un refus et une candidature plateau acceptée. Les 10 notifications générées ont toutes `application_id`, `planning_slot_id`, `date` et `venue_id` (+ `plateau_id` pour la candidature plateau).

Merci ! 🎸
