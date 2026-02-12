# Refactoring Backend - Progress Tracker

## ✅ Complété

### Utilitaires
- [x] `utils/db.py` créé avec `normalize_image_url`, `create_notification`, `notify_venue_subscribers`
- [x] `utils/__init__.py` mis à jour avec les nouveaux exports

### Routes
- [x] `routes/friends.py` créé (8 endpoints déplacés depuis server.py)
  - POST /friends/request
  - GET /friends/requests
  - GET /friends/sent
  - DELETE /friends/cancel/{request_id}
  - POST /friends/accept/{request_id}
  - POST /friends/reject/{request_id}
  - GET /friends/
  - DELETE /friends/{friend_user_id}

## 🚧 En cours

### Routes existantes à compléter
- [ ] `routes/auth.py` - Ajouter `change-password` (1 endpoint manquant)
- [ ] `routes/account.py` - Ajouter suspend/delete (2 endpoints manquants)
- [ ] `routes/uploads.py` - Compléter tous les endpoints upload
- [ ] `routes/venues.py` - Ajouter past-events, profitability, subscriptions
- [ ] `routes/events.py` - Vérifier et compléter jams/concerts/karaoke/spectacles
- [ ] `routes/bands.py` - Ajouter endpoints manquants
- [ ] `routes/reviews.py` - Vérifier complétude

## 📋 À faire

### server.py
- [ ] Réduire server.py à ~200 lignes (configuration + imports uniquement)
- [ ] Supprimer tous les endpoints déplacés
- [ ] Garder uniquement :
  - Configuration (CORS, DB, Stripe, JWT)
  - Import des routers
  - app.include_router() pour chaque router
  - Servir les fichiers statiques (/api/uploads)

### Tests cleanup
- [ ] Supprimer fichiers debug obsolètes
- [ ] Supprimer fichiers JSON de résultats
- [ ] Organiser les vrais tests

## 📊 Statistiques

### Avant refactoring
- `server.py`: **3992 lignes**
- Endpoints dans server.py: **~85**

### Après refactoring (cible)
- `server.py`: **~200 lignes**
- Routes organisées: **10+ fichiers**
- Endpoints mieux organisés par domaine

## 🎯 Prochaines étapes immédiates

1. Ajouter change-password dans routes/auth.py
2. Créer/compléter routes/account.py (suspend/delete)
3. Déplacer tous les endpoints /upload/* vers routes/uploads.py
4. Déplacer endpoints venues manquants
5. Créer nouveau server.py minimal
6. Tester que tout fonctionne
