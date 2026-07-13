# 📱 CORRECTIF Build 95.14 — Liens Stripe (source de vérité)

⚠️ Le briefing 95.13 précédent contenait 2 erreurs (liens inversés + prix Étab. Annuel erroné). **Ceci est la version corrigée et validée dashboard Stripe.**

---

## 🔗 Les 4 liens Stripe (validés dashboard Stripe)

### Musicien PRO
| Cycle | Prix | Essai | Lien Stripe |
|---|---|---|---|
| **Mensuel** | 4,99€ / mois | 60 j | `https://buy.stripe.com/6oU9AS3WB4d2dg09XjafS05` |
| **Annuel** | 49,90€ / an (au lieu de 59,88€) | — | `https://buy.stripe.com/3cI9ASbp3eRG4JuglHafS09` |

### Établissement
| Cycle | Prix | Essai | Lien Stripe |
|---|---|---|---|
| **Mensuel** | 9,99€ / mois | 180 j (6 mois) | `https://buy.stripe.com/aFaaEWakZ8ti7VG9XjafS06` |
| **Annuel** | **99,99€** / an (au lieu de 119,88€) | 210 j (7 mois) | `https://buy.stripe.com/cNieVcfFj10Q8ZKfhDafS0a` |

---

## 🎁 Wording essais (identique mobile Build 126)

- **Musicien Mensuel** : *"2 mois d'essai gratuits — 200 premiers musiciens !"*
- **Musicien Annuel** : *"🎁 3 mois d'essai gratuits (2 mois + 1 mois bonus annuel) — 200 premiers"*
- **Étab. Mensuel** : *"6 mois gratuits pour les 200 premiers établissements !"*
- **Étab. Annuel** : *"🎁 7 mois d'essai gratuits (6 mois + 1 mois bonus annuel) — 200 premiers"*

## 💰 Économies affichées sur le toggle

- Musicien : **9,98€** (59,88 − 49,90)
- Établissement : **19,89€** (119,88 − 99,99)
- Message combiné : *"🎉 Économisez jusqu'à 19,89€ + 1 mois d'essai bonus sur les plans annuels"*

## 🔒 Backend aligné (200 premiers)

Le backend a été mis à jour pour aligner tous les seuils sur **200 premiers établissements** :
- `auth.py` : seuil venue passé de 100 → 200 pour l'offre 6 mois (180 jours)
- `payments.py` : seuil venue PRO count passé de 100 → 200
- `server.py` : endpoint `/api/stats/promo` retourne `promo_limit: 200`
- ✅ Vérifié : `GET /api/stats/promo` → `{"total_venues": 53, "promo_limit": 200, "remaining_slots": 147}`

## 🎁 Bonus 1 mois anti-triche (webhook Stripe)

Déjà en place backend, aucune action côté mobile. `POST /api/webhooks/stripe` gère `invoice.payment_succeeded` → extension +30 jours du `trial_end` au 1er paiement, avec flag `bonus_applied: bool` sur `User` pour l'idempotence.

---

## ✅ Checklist Mobile

- [ ] Remplacer les 2 anciens liens (mensuels) par les 4 nouveaux
- [ ] Corriger le prix Étab. Annuel : **99,99€/an** (pas 99,90€)
- [ ] Mettre à jour les 4 wordings d'essais (voir tableau)
- [ ] Toggle Mensuel/Annuel avec badge `−2 mois`
- [ ] Message toggle : *"Économisez jusqu'à 19,89€ + 1 mois d'essai bonus sur les plans annuels"*
- [ ] Data-testid : `billing-toggle`, `billing-monthly-btn`, `billing-yearly-btn`, `subscribe-musician-btn`, `subscribe-venue-btn`
