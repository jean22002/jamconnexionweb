# Tests Backend - Jam Connexion

Ce dossier contient tous les tests backend de l'application Jam Connexion.

## 📁 Structure des Tests

### Tests Fonctionnels
- `backend_test.py` - Suite de tests complète du backend
- `melomane_test.py` - Tests du système mélomane
- `melomane_bug_fix_test.py` - Tests de correction de bugs mélomane
- `final_melomane_test.py` - Tests finaux du profil mélomane
- `multi_musician_test.py` - Tests multi-musiciens

### Tests de Fonctionnalités
- `karaoke_spectacle_test.py` - Tests des événements karaoké et spectacle
- `concert_date_test.py` - Tests de gestion des dates de concerts
- `test_concert_date_bug.py` - Correction de bugs de dates
- `planning_slots_test.py` - Tests des créneaux de planning
- `test_planning_slots.py` - Tests supplémentaires de planning

### Tests de Notifications
- `test_notifications_system.py` - Tests du système de notifications complet
- `test_notifications_complete.py` - Tests de notifications avancés
- `test_notifications_only.py` - Tests isolés de notifications

### Tests de Messagerie
- `test_messaging_restriction.py` - Tests des restrictions de messagerie
- `messaging_restriction_test_results.json` - Résultats des tests

### Tests de Paiement
- `stripe_payment_test.py` - Tests d'intégration Stripe
- `stripe_test_results.json` - Résultats des tests Stripe

### Tests de Participation
- `test_double_participation.py` - Tests de double participation concerts
- `test_double_participation_jam.py` - Tests de double participation jams

### Tests de Correction de Bugs
- `bug_fix_test.py` - Tests de corrections de bugs généraux
- `critical_bug_test.py` - Tests de bugs critiques
- `test_title_time_bug.py` - Tests de bugs titre/temps
- `test_venues_me_concerts.py` - Tests endpoint concerts établissement

### Tests de Géolocalisation
- `focused_geolocation_test.py` - Tests de géolocalisation

### Tests de Débogage
- `debug_jwt.py` - Debug tokens JWT
- `debug_jwt_exact.py` - Debug JWT exact
- `debug_melomane.py` - Debug profil mélomane

## 🚀 Comment Exécuter les Tests

### Tous les tests
```bash
cd /app/backend/tests
python3 backend_test.py
```

### Test spécifique
```bash
cd /app/backend/tests
python3 melomane_test.py
```

### Tests avec pytest (si installé)
```bash
cd /app/backend
pytest tests/
```

## 📊 Résultats des Tests

Les résultats des tests sont sauvegardés dans :
- `messaging_restriction_test_results.json`
- `stripe_test_results.json`

## ⚠️ Notes Importantes

- Ces tests utilisent l'API backend en mode test
- Certains tests nécessitent des clés API (Stripe, etc.)
- Les tests peuvent créer des données temporaires dans la base de données
- Toujours exécuter les tests dans un environnement de développement/test

## 📝 Maintenance

Pour ajouter un nouveau test :
1. Créer un fichier `test_nom_de_la_fonctionnalite.py`
2. Utiliser la structure de test existante comme modèle
3. Documenter le test dans ce README
4. Exécuter le test pour vérifier qu'il fonctionne

## 🔍 Couverture des Tests

Les tests couvrent :
- ✅ Authentification et autorisation
- ✅ Profils (musiciens, mélomanes, établissements)
- ✅ Événements (concerts, jams, karaoké, spectacles)
- ✅ Notifications
- ✅ Messagerie
- ✅ Paiements Stripe
- ✅ Planning et créneaux
- ✅ Géolocalisation
- ✅ Participations aux événements
