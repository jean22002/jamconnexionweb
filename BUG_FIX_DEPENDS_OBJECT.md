# 🔧 Correction du Bug Critique : TypeError 'Depends' object is not subscriptable

## 📋 Résumé
**Date** : 12 avril 2026  
**Gravité** : P0 - Bloquant déploiement  
**Impact** : Impossibilité de sauvegarder les profils établissement et musicien  

## 🐛 Symptômes
- Erreur 500 Internal Server Error sur `/api/venues/me` (PUT)
- Erreur 500 Internal Server Error sur `/api/musicians/me` (PUT)
- TypeError dans les logs backend : `'Depends' object is not subscriptable`
- Message d'erreur utilisateur : "Error updating profile"

## 🔍 Cause Racine
Les fonctions alias `update_my_venue_profile` et `update_my_musician_profile` appelaient leurs fonctions principales sans passer l'argument `request`, causant un décalage des paramètres :

```python
# AVANT (CASSÉ)
async def update_my_venue_profile(data: VenueProfile, request: Request, current_user: dict = Depends(get_current_user)):
    return await update_venue_profile(data, current_user)  # ❌ Manque 'request'

# Résultat du décalage :
# - data → data ✓
# - current_user → request ✗
# - Depends(get_current_user) → current_user ✗
```

Quand le code essayait `current_user["role"]`, il recevait un objet `Depends` au lieu d'un dictionnaire → crash.

## ✅ Solution Appliquée

### Fichier 1 : `/app/backend/routes/venues.py` (ligne 224)
```python
# APRÈS (CORRIGÉ)
async def update_my_venue_profile(data: VenueProfile, request: Request, current_user: dict = Depends(get_current_user)):
    return await update_venue_profile(data, request, current_user)  # ✅ Ajout de 'request'
```

### Fichier 2 : `/app/backend/routes/musicians.py` (ligne 355)
```python
# APRÈS (CORRIGÉ)
async def update_my_musician_profile(data: MusicianProfile, request: Request, current_user: dict = Depends(get_current_user)):
    return await update_musician_profile(data, request, current_user)  # ✅ Ajout de 'request'
```

## 🧪 Tests de Validation

### Test Backend (curl)
```bash
✅ PUT /api/venues/me - 200 OK
✅ PUT /api/musicians/me - 200 OK
```

### Test Frontend
```
✅ Connexion établissement réussie
✅ Dashboard chargé sans erreurs console
✅ Plus d'erreurs 500 "Error updating profile"
```

## 📊 Impact
- **Avant** : 2 endpoints critiques en échec (500 Internal Server Error)
- **Après** : 2 endpoints fonctionnels (200 OK)
- **Déploiement** : Backend redémarre sans erreur

## 🔒 Prévention
Pour éviter ce type d'erreur à l'avenir :
1. Toujours vérifier que les appels de fonctions incluent TOUS les arguments non-optionnels
2. Utiliser le linter Python pour détecter les signatures de fonctions incorrectes
3. Tester les endpoints alias après toute modification de la signature des fonctions principales

## 📝 Notes
- Le bug affectait UNIQUEMENT les routes alias `/me` (mobiles)
- Les routes principales `/venues` et `/musicians` fonctionnaient correctement
- Aucun autre appel similaire trouvé dans le codebase
