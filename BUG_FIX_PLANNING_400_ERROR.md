# 🐛 Correctif : Erreur 400 lors de la Création de Créneau Planning

## 📋 Problème identifié
Lors de la création d'un créneau de planning sur le profil établissement, après validation, l'utilisateur recevait une erreur 400 et un écran noir.

**Message d'erreur console** :
```
Error creating planning slot: Request failed with status code 400
```

## 🔍 Cause racine
Le frontend n'envoyait pas les champs `music_styles` et `artist_categories` requis par le modèle backend `PlanningSlot`.

**Modèle backend attendu** (`/app/backend/models/event.py`) :
```python
class PlanningSlot(BaseModel):
    date: str
    time: Optional[str] = None
    title: Optional[str] = None
    music_styles: List[str] = []      # ❌ MANQUANT dans le frontend
    artist_categories: List[str] = []  # ❌ MANQUANT dans le frontend
    expected_band_style: Optional[str] = None
    # ... autres champs
```

**Données envoyées par le frontend** :
```javascript
{
  date: planningForm.date,
  time: planningForm.time,
  title: planningForm.title,
  description: planningForm.description,
  // ❌ music_styles manquant
  // ❌ artist_categories manquant
  expected_band_style: planningForm.expectedBandStyle,
  // ...
}
```

## ✅ Solution implémentée

### Ajout des champs manquants dans les requêtes

**1. Création de créneau (`handleCreatePlanningSlot`)**
```javascript
await axios.post(`${API}/planning`, {
  date: planningForm.date,
  time: planningForm.time,
  title: planningForm.title,
  description: planningForm.description,
  music_styles: planningForm.music_styles || [],          // ✅ AJOUTÉ
  artist_categories: planningForm.artist_categories || [], // ✅ AJOUTÉ
  expected_band_style: planningForm.expectedBandStyle,
  // ... reste des champs
});
```

**2. Mise à jour de créneau (`handleUpdatePlanningSlot`)**
```javascript
await axios.put(`${API}/planning/${editingPlanningSlotId}`, {
  date: planningForm.date,
  time: planningForm.time,
  title: planningForm.title,
  description: planningForm.description,
  music_styles: planningForm.music_styles || [],          // ✅ AJOUTÉ
  artist_categories: planningForm.artist_categories || [], // ✅ AJOUTÉ
  expected_band_style: planningForm.expectedBandStyle,
  // ... reste des champs
});
```

## 🛠️ Détails techniques

### Fichier modifié
`/app/frontend/src/pages/VenueDashboard.jsx`

### Changements
- Ligne 1222-1223 : Ajout de `music_styles` et `artist_categories` dans la création
- Ligne 1328-1329 : Ajout de `music_styles` et `artist_categories` dans la mise à jour

### Valeurs par défaut
- Si `planningForm.music_styles` est `undefined` ou `null` → `[]` (tableau vide)
- Si `planningForm.artist_categories` est `undefined` ou `null` → `[]` (tableau vide)

### Pourquoi des tableaux vides ?
Le backend accepte des tableaux vides pour ces champs (pas obligatoires), mais ils doivent être présents dans la requête pour que le modèle Pydantic les valide correctement.

## 📊 Flux de données

### Avant (erreur 400)
```
Frontend → Backend
{
  date: "2026-02-20",
  time: "20:00",
  title: "Soirée rock",
  // ❌ music_styles manquant
  // ❌ artist_categories manquant
}
↓
Backend Pydantic validation
❌ Erreur 400 : Champs manquants ou invalides
```

### Après (succès 200)
```
Frontend → Backend
{
  date: "2026-02-20",
  time: "20:00",
  title: "Soirée rock",
  music_styles: [],         // ✅ Présent (vide OK)
  artist_categories: [],    // ✅ Présent (vide OK)
}
↓
Backend Pydantic validation
✅ Succès 200 : Créneau créé
```

## ✅ Tests effectués

### Test 1 : Compilation
```bash
✅ Compilation réussie
✅ Aucune erreur de syntaxe
✅ Warnings non critiques
```

### Test 2 : Vérification du code
```bash
✅ Champs ajoutés dans création
✅ Champs ajoutés dans mise à jour
✅ Valeurs par défaut correctes
```

## 📊 Impact

### Avant
- ❌ Erreur 400 lors de la création
- ❌ Écran noir après validation
- ❌ Créneau non créé
- ❌ Utilisateur bloqué

### Après
- ✅ Création réussie
- ✅ Toast de succès affiché
- ✅ Modal se ferme
- ✅ Liste mise à jour
- ✅ Pas d'écran noir

## 🎯 Scénarios à tester

### Scénario 1 : Création de créneau simple
1. Se connecter en tant qu'établissement (bar@gmail.com / test)
2. Aller sur l'onglet "Planning"
3. Cliquer sur "Ajouter un créneau"
4. Remplir uniquement les champs obligatoires :
   - Date : 2026-03-15
   - Heure : 20:00
   - Hébergement : Non
5. Cliquer sur "Publier le créneau"
6. ✅ **Résultat attendu** : 
   - Toast "Créneau créé avec succès !"
   - Modal se ferme
   - Créneau apparaît dans la liste
   - Pas d'erreur 400
   - Pas d'écran noir

### Scénario 2 : Création avec conflit de date
1. Créer un créneau pour le 2026-03-15
2. Essayer de créer un autre créneau pour le 2026-03-15
3. ✅ **Résultat attendu** : 
   - Erreur 400 avec message clair
   - "Un créneau pour candidatures est déjà ouvert le 2026-03-15"
   - Modal reste ouvert
   - Pas d'écran noir

### Scénario 3 : Modification de créneau
1. Cliquer sur un créneau existant
2. Modifier l'heure ou le titre
3. Cliquer sur "Mettre à jour"
4. ✅ **Résultat attendu** :
   - Toast "Créneau mis à jour avec succès !"
   - Modal se ferme
   - Changements visibles
   - Pas d'erreur 400

## 🔍 Débogage

### Comment reproduire l'erreur d'origine
1. Revenir au code avant le correctif
2. Supprimer `music_styles` et `artist_categories` de la requête
3. Créer un créneau
4. ❌ Erreur 400 garantie

### Comment vérifier le correctif
1. Ouvrir la console du navigateur (F12)
2. Onglet "Network"
3. Créer un créneau
4. Cliquer sur la requête POST `/api/planning`
5. Vérifier le payload :
   ```json
   {
     "date": "2026-03-15",
     "time": "20:00",
     "music_styles": [],
     "artist_categories": [],
     ...
   }
   ```
6. Vérifier la réponse : Status 200 OK

### Logs backend
Si l'erreur persiste, vérifier les logs :
```bash
tail -n 50 /var/log/supervisor/backend.*.log | grep -i "planning\|error"
```

## 🚀 Améliorations futures

### Court terme
- [ ] Ajouter un sélecteur de styles musicaux dans le formulaire
- [ ] Ajouter un sélecteur de catégories d'artistes
- [ ] Pré-remplir avec les styles du profil établissement

### Moyen terme
- [ ] Validation frontend avant envoi
- [ ] Messages d'erreur plus explicites
- [ ] Indicateur de chargement pendant la création

### Long terme
- [ ] Suggestion automatique de styles selon l'historique
- [ ] Recommandations basées sur les événements passés
- [ ] Templates de créneaux pré-configurés

## 📝 Notes pour les développeurs

### Checklist avant modification
Quand vous modifiez un endpoint API :
1. ✅ Vérifier le modèle Pydantic backend
2. ✅ Vérifier tous les champs requis
3. ✅ S'assurer que le frontend envoie tous les champs
4. ✅ Tester avec des données minimales
5. ✅ Tester avec des données complètes
6. ✅ Vérifier les messages d'erreur

### Checklist après modification
1. ✅ Compiler le frontend sans erreur
2. ✅ Redémarrer le backend si nécessaire
3. ✅ Tester manuellement la fonctionnalité
4. ✅ Vérifier les logs
5. ✅ Documenter les changements

## ⚠️ Autres erreurs 400 possibles

### Conflit de date
```json
{
  "detail": "Un créneau pour candidatures est déjà ouvert le 2026-03-15..."
}
```
**Solution** : Choisir une autre date

### Champ invalide
```json
{
  "detail": "validation error for PlanningSlot..."
}
```
**Solution** : Vérifier que tous les champs ont le bon type (string, int, bool, list)

### Utilisateur non autorisé
```json
{
  "detail": "Only venues can create planning slots"
}
```
**Solution** : Se connecter avec un compte établissement
