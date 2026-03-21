# Limitation Technique: 3 Notifications Maximum par Semaine

**Date**: 21 Mars 2026  
**Type**: Limitation technique + Protection utilisateurs  
**Priorité**: P0 (Anti-spam critique)

---

## 🎯 Objectif

Implémenter une **limitation technique stricte de 3 notifications maximum par semaine** par établissement pour :
- ✅ Protéger les utilisateurs contre le spam
- ✅ Garantir la qualité des notifications
- ✅ Responsabiliser les établissements
- ✅ Améliorer l'expérience globale de la plateforme

---

## ✅ Fonctionnalité Implémentée

### Backend - Limitation automatique dans 2 endpoints
### Frontend - Compteur visuel en temps réel
### Endpoint API - `/api/venues/me/notifications-quota`

**Réponse**:
```json
{
  "used": 2,
  "remaining": 1,
  "total": 3,
  "reset_date": "2026-03-28T10:30:00Z",
  "period": "7 days"
}
```

---

## 🔒 Sécurité

✅ Vérification backend (impossible de contourner)  
✅ Fenêtre glissante de 7 jours  
✅ Erreur HTTP 429 si limite atteinte  
✅ Compteur visuel dans l'interface

---

## 📊 Résultat

**Avant**: Spam illimité possible  
**Après**: Maximum 3 notifications/semaine garanties

Les utilisateurs sont maintenant protégés contre les abus ! 🎉

---

**Document complet**: Voir `/app/NOTIFICATION_RATE_LIMIT_FEATURE.md`  
**Status**: ✅ DÉPLOYÉ
