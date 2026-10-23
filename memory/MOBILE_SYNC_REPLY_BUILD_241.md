# 📱 RÉPONSE WEB → MOBILE — Paiements Stripe (Build 241)

## 🔴 `POST /api/payments/checkout` — « Expired API Key »
- **Cause 1** : la clé `STRIPE_SECRET_KEY` live (`…lBoDy6`) est **expirée** (confirmé par Stripe). ⏳ **En attente** : le propriétaire doit enregistrer la nouvelle clé dans les secrets de l'app, puis faire un Deploy.
- **Cause 2 (bug corrigé)** : `/musicians/me/subscribe-pro` remplaçait la clé Stripe **globale** du serveur par `STRIPE_SECRET_KEY`. Les checkouts établissement utilisaient ensuite cette clé expirée au lieu de `STRIPE_API_KEY`. Désormais, **une seule clé** sert à tout le serveur : `utils/stripe_config.get_stripe_key()` (`STRIPE_SECRET_KEY` en priorité, sinon `STRIPE_API_KEY`).

## ✅ Essais gratuits annuels (`billing_cycle`)
| Route | Body | Mensuel | Annuel |
|---|---|---|---|
| `POST /api/payments/checkout` (établissement) | `{ "origin_url": "...", "billing_cycle": "monthly"\|"yearly" }` | 9,99 €/mois (`STRIPE_PRICE_ID`), essai **180 j** (90 j après les 200 premiers) | **99,99 €/an**, essai **210 j** (120 j après les 200 premiers) |
| `POST /api/musicians/me/subscribe-pro` (musicien) | `{ "billing_cycle": "monthly"\|"yearly" }` (facultatif) | 4,99 €/mois, essai **60 j** | **49,90 €/an**, essai **90 j** |

- `billing_cycle` est facultatif : `monthly` par défaut, et toute valeur autre que `yearly` donne `monthly`.
- **Réponses** :
  - établissement : `{url, session_id, trial_days, billing_cycle}` ;
  - musicien : `{checkout_url, url, session_id, billing_cycle, trial_days, trial_info}`.
- `billing_cycle` est aussi enregistré dans les metadata de la session et de l'abonnement Stripe.

## Recette (après enregistrement de la clé + Deploy)
Établissement → 200 avec une `url` `checkout.stripe.com`, en mensuel puis en annuel. Musicien → idem.
