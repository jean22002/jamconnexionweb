# 🎵 LOGIQUE OFFICIELLE D'INTERMITTENCE - DOCUMENTATION

## 📋 Vue d'ensemble

Le système de comptabilité GUSO a été mis à jour pour respecter la **logique administrative officielle de France Travail** (ex-Pôle Emploi) pour le calcul des heures des artistes intermittents du spectacle.

---

## 🎯 Changements Principaux

### ❌ AVANT (Logique Incorrecte)
- Les heures étaient calculées à partir des montants en euros ou d'une logique moyenne
- Pas de distinction entre les types de cachets
- Confusion entre revenus (€) et heures retenues

### ✅ APRÈS (Logique Officielle)
- **Cachet isolé = 12 heures** (règle France Travail)
- **Cachet groupé = 8 heures** (règle France Travail)
- Les euros restent séparés pour le suivi financier
- Calcul officiel : `heures_totales = (cachets_isolés × 12) + (cachets_groupés × 8)`

---

## 🔧 Modifications Techniques

### 1. **Modèle de Données** (`/app/backend/models/musician.py`)

Ajout du champ `cachet_type` au modèle `MusicianConcert` :

```python
class MusicianConcert(BaseModel):
    # ...
    cachet_type: Optional[str] = None  # "isolé" (12h) ou "groupé" (8h)
```

### 2. **Backend** (`/app/backend/routes/musicians.py`)

#### Fonction de calcul officielle :
```python
def calculate_concert_hours_official(concert: dict) -> float:
    """
    Calcule les heures selon la logique officielle:
    - Cachet isolé = 12h
    - Cachet groupé = 8h
    """
    cachet_type = concert.get("cachet_type")
    if cachet_type == "isolé":
        return 12.0
    elif cachet_type == "groupé":
        return 8.0
    else:
        return concert.get("guso_hours", 0)  # Legacy fallback
```

#### Endpoint `/api/musicians/me/guso/summary` :
Retourne maintenant :
```json
{
  "total_hours": 52,
  "cachets_isoles_count": 3,
  "cachets_groupes_count": 2,
  "hours_from_isoles": 36,
  "hours_from_groupes": 16,
  "total_cachet": 975.0,
  "concerts_count": 5,
  "declared_count": 2,
  "pending_count": 3,
  "threshold": 507,
  "progress_percentage": 10.26
}
```

#### Export CSV :
Colonnes mises à jour :
- `Type Cachet` : "Isolé" ou "Groupé"
- `Heures France Travail` : 12 ou 8 selon le type

### 3. **Frontend** (`/app/frontend/src/components/accounting/GusoAccountingTab.jsx`)

#### Affichage du summary :
```jsx
<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
  <div>
    <p>Cachets isolés</p>
    <p className="text-blue-400">{summary.cachets_isoles_count || 0}</p>
    <p>= {(summary.cachets_isoles_count || 0) * 12}h</p>
  </div>
  <div>
    <p>Cachets groupés</p>
    <p className="text-purple-400">{summary.cachets_groupes_count || 0}</p>
    <p>= {(summary.cachets_groupes_count || 0) * 8}h</p>
  </div>
</div>
```

#### Affichage des concerts :
Chaque concert affiche maintenant :
- 🎵 Type de cachet (Isolé 12h / Groupé 8h)
- ⏱️ Heures retenues France Travail
- 💰 Cachet en euros (séparé)
- 📄 Type de contrat
- ✅/⏳ Statut de déclaration

---

## 🧪 Script de Migration

Un script Python a été créé pour gérer les données existantes :

```bash
# Lister les concerts sans type de cachet
python /app/backend/scripts/migrate_cachet_types.py list

# Migration automatique (12h->isolé, 8h->groupé)
python /app/backend/scripts/migrate_cachet_types.py migrate

# Définir manuellement le type
python /app/backend/scripts/migrate_cachet_types.py set USER_ID CONCERT_ID isolé
python /app/backend/scripts/migrate_cachet_types.py set USER_ID CONCERT_ID groupé

# Créer des données de test
python /app/backend/scripts/migrate_cachet_types.py test
```

---

## 📊 Exemples Concrets

### Exemple 1 : Musicien Solo
```
5 cachets isolés :
- 5 × 12h = 60 heures
- Revenus : 750€ (5 × 150€)
- Progression : 60/507h = 11.8%
```

### Exemple 2 : Groupe
```
3 cachets groupés + 2 cachets isolés :
- 3 × 8h = 24 heures
- 2 × 12h = 24 heures
- TOTAL : 48 heures
- Revenus : 850€
- Progression : 48/507h = 9.5%
```

### Exemple 3 : Mix (cas réaliste)
```
10 cachets isolés + 15 cachets groupés :
- 10 × 12h = 120 heures
- 15 × 8h = 120 heures
- TOTAL : 240 heures
- Revenus : 3 500€
- Progression : 240/507h = 47.3%
```

---

## 🎨 Interface Utilisateur

### Dashboard GUSO Affiche :

1. **Progression vers 507h** (barre de progression)
2. **Décomposition des cachets** :
   - Nombre de cachets isolés × 12h
   - Nombre de cachets groupés × 8h
3. **Revenus séparés** (en euros)
4. **Concerts déclarés / à déclarer**

### Carte de Concert Affiche :

```
🎵 Café Concert - Paris
📅 15/02/2025
🎵 Type: ISOLÉ (12h)
⏱️ Heures retenues: 12h
💰 Cachet: 150.00€
📄 Contrat: CDDU
✅ Déclaré
```

---

## 🔄 Workflow Utilisateur

### Pour Ajouter un Concert GUSO :

1. Créer/modifier un concert dans le profil
2. **[TODO FRONTEND]** Cocher "Concert GUSO"
3. **[TODO FRONTEND]** Sélectionner le type de cachet :
   - 🎵 **Cachet isolé** (12h) : Pour les prestations solo ou petites formations
   - 🎸 **Cachet groupé** (8h) : Pour les grands groupes, orchestres, festivals
4. Renseigner le montant du cachet (€)
5. Les heures sont **automatiquement calculées** selon le type

### Modification du Type :

Pour changer le type de cachet d'un concert existant :
```bash
python /app/backend/scripts/migrate_cachet_types.py set USER_ID CONCERT_ID isolé
# ou
python /app/backend/scripts/migrate_cachet_types.py set USER_ID CONCERT_ID groupé
```

---

## ✅ Conformité Officielle

Le système respecte maintenant :

- ✅ **Article R5422-3 du Code du travail**
- ✅ **Circulaire UNEDIC n°2016-25**
- ✅ **Règles de conversion France Travail**
- ✅ Séparation claire entre :
  - Heures retenues pour l'intermittence (507h)
  - Rémunération en euros (suivi financier)

---

## 🚧 Travail Restant (TODO)

### Frontend à Compléter :

1. **Formulaire d'ajout de concert** :
   - [ ] Ajouter un sélecteur "Type de cachet" (Radio buttons ou Select)
   - [ ] Options : "Cachet isolé (12h)" / "Cachet groupé (8h)"
   - [ ] Afficher automatiquement les heures calculées

2. **Modal d'édition de concert** :
   - [ ] Permettre de modifier le type de cachet
   - [ ] Mettre à jour les heures en temps réel

3. **Validation** :
   - [ ] Rendre le champ `cachet_type` obligatoire pour les concerts GUSO
   - [ ] Message d'erreur si non renseigné

### Base de Données :

- [x] Modèle de données mis à jour
- [x] Script de migration créé
- [ ] Migrer les concerts existants (exécuter `python migrate_cachet_types.py migrate`)

---

## 📞 Support

Pour toute question sur la logique d'intermittence :
- France Travail Spectacle : https://www.francetravail.fr/spectacle
- GUSO : https://www.guso.fr

---

## 📝 Notes Techniques

### Fallback pour Legacy Data :
Les concerts créés avant cette mise à jour sans `cachet_type` utilisent `guso_hours` en fallback. Il est recommandé de :
1. Lister les concerts sans type : `python migrate_cachet_types.py list`
2. Migrer automatiquement : `python migrate_cachet_types.py migrate`

### API Endpoints Mis à Jour :
- `GET /api/musicians/me/guso/summary` : Inclut `cachets_isoles_count`, `cachets_groupes_count`, `hours_from_isoles`, `hours_from_groupes`
- `GET /api/musicians/me/guso/concerts` : Chaque concert inclut `cachet_type`
- `GET /api/musicians/me/guso/export/csv` : Export CSV mis à jour avec colonnes "Type Cachet" et "Heures France Travail"

---

**Version:** 1.0.0  
**Date:** 22 Décembre 2025  
**Conformité:** France Travail / UNEDIC 2025
