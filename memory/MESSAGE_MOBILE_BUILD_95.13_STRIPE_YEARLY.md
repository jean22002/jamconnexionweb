# 📱 Briefing Agent Mobile — Build 95.13 (Stripe Yearly Links)

**Date** : Feb 2026
**Priorité** : P0 — À intégrer immédiatement dans `mobile/app/tarifs.tsx`

---

## 🎯 Contexte
Les liens Stripe pour les abonnements **annuels** ont été créés côté web. Le toggle Mensuel/Annuel est déjà opérationnel sur le web (`/pricing`, `/tarifs`) et doit être synchronisé côté mobile avec les URL correspondantes.

---

## 🔗 Liens Stripe (source de vérité)

### Musicien PRO
| Cycle | Prix affiché | Lien Stripe |
|---|---|---|
| **Mensuel** | 4,99€ / mois | `https://buy.stripe.com/5kQfZgfFjfVK0te4CZafS04` |
| **Annuel** | 49,90€ / an (au lieu de 59,88€) | `https://buy.stripe.com/cNieVcfFj10Q8ZKfhDafS0a` |

### Établissement
| Cycle | Prix affiché | Lien Stripe |
|---|---|---|
| **Mensuel** | 9,99€ / mois | `https://buy.stripe.com/3cI8wOfFj5h68ZKd9vafS03` |
| **Annuel** | 99,90€ / an (au lieu de 119,88€) | `https://buy.stripe.com/3cI9ASbp3eRG4JuglHafS09` |

---

## 🎁 Règles UX à respecter côté mobile (identique au web)

### Musicien PRO
- **Mensuel** : "2 mois d'essai gratuits" (200 premiers musiciens)
- **Annuel** : "🎁 3 mois d'essai gratuits" (2 mois + **1 mois bonus annuel**) — pour les 200 premiers musiciens
- Badge : `🎁 2 mois gratuits` en badge fixe (ou remplacer par `🎁 3 mois gratuits` en mode annuel — au choix, à ton feeling UX)

### Établissement
- **Mensuel** : "2 mois d'essai gratuit inclus"
- **Annuel** : "3 mois d'essai gratuits" (2 mois + 1 mois bonus annuel — même logique que Musicien PRO)

### Toggle Mensuel/Annuel
- Un toggle en haut de la page, avec label `−2 mois` sur l'option Annuel
- Sur activation d'Annuel : afficher le message `🎉 Économisez 9,98€ + 1 mois d'essai bonus pour le plan Musicien PRO`

---

## 🔒 Backend anti-triche (déjà en place)
Le webhook Stripe `invoice.payment_succeeded` (route `POST /api/webhooks/stripe`) gère le **bonus de 30 jours au premier paiement réussi** :
- Champ `bonus_applied: bool` ajouté au modèle `User`
- Le bonus n'est déclenché qu'une seule fois par utilisateur, sur le premier `invoice.payment_succeeded`
- Idempotent → aucune action mobile requise, tout est géré backend

---

## ✅ Checklist Agent Mobile
- [ ] Ajouter les 2 nouvelles constantes `STRIPE_PAYMENT_LINK_*_YEARLY`
- [ ] Ajouter le toggle Mensuel/Annuel (`billingCycle` state)
- [ ] Router le bon lien Stripe selon le cycle sélectionné (via `Linking.openURL(...)`)
- [ ] Mettre à jour les libellés d'essai (2 → 3 mois en annuel)
- [ ] Optionnel P3 : ajouter le flag `bonus_available` depuis `/api/auth/me` pour afficher dynamiquement l'offre bonus (backend à préparer côté web si demandé)

---

## 📌 À noter
- La monétisation web (AdSense/Ezoic) reste **désactivée**. AdMob mobile reste la seule source publicitaire.
- Reste synchronisé côté texte : le web utilise le même wording (`3 mois d'essai gratuits`, `1 mois bonus annuel`).
