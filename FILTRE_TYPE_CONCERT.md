# 🎭 FILTRE TYPE DE CONCERT - DOCUMENTATION

## 📋 Vue d'ensemble

Un nouveau filtre a été ajouté à l'onglet **"Comptabilité Générale"** pour permettre de distinguer facilement les concerts GUSO (intermittence) des paiements classiques.

---

## ✨ Nouvelles Fonctionnalités

### 1. **Filtre "Type de concert"**

Trois options disponibles :
- 🎵 **Tous les concerts** : Affiche tous les concerts (GUSO + classiques)
- 🎵 **GUSO (Intermittence)** : Affiche uniquement les concerts déclarés GUSO
- 💰 **Paiement classique** : Affiche uniquement les concerts non-GUSO

### 2. **Badges visuels sur chaque concert**

Chaque concert affiche maintenant un badge indiquant son type :

#### Concerts GUSO :
- 🎵 **GUSO Isolé (12h)** - Badge bleu
- 🎸 **GUSO Groupé (8h)** - Badge bleu
- 🎵 **GUSO** - Badge bleu (si le type de cachet n'est pas encore défini)

#### Concerts classiques :
- 💰 **Paiement classique** - Badge gris

---

## 🎨 Interface Utilisateur

### Emplacement des Filtres

```
┌─────────────────────────────────────────────────────────┐
│  📊 Comptabilité PRO                    [Exporter CSV]  │
├─────────────────────────────────────────────────────────┤
│  [Année ▼]  [Statut ▼]  [Type de concert ▼]           │
│  └─ 2025    └─ Tous     └─ Tous les concerts          │
├─────────────────────────────────────────────────────────┤
│  💰 Revenus      ⏳ En attente      📊 Cachet moyen    │
└─────────────────────────────────────────────────────────┘
```

### Exemple de Carte de Concert

```
┌───────────────────────────────────────────────────────┐
│ Café Concert                  🎵 GUSO Isolé (12h)    │
│                               ✅ Payé                 │
│ 📅 vendredi 15 février 2025                           │
│ 📍 Paris                                              │
│                                        150.00€        │
│                               [📄 Facture]            │
└───────────────────────────────────────────────────────┘
```

---

## 🔧 Modifications Techniques

### Fichier modifié
`/app/frontend/src/components/accounting/AccountingTab.jsx`

### Ajouts principaux :

#### 1. État du filtre :
```javascript
const [filters, setFilters] = useState({
  year: new Date().getFullYear(),
  status: 'all',
  concertType: 'all'  // 'all', 'guso', 'classic'
});
```

#### 2. Fonction de filtrage :
```javascript
const filteredConcerts = concerts.filter(concert => {
  if (filters.concertType === 'all') return true;
  if (filters.concertType === 'guso') return concert.is_guso === true;
  if (filters.concertType === 'classic') return !concert.is_guso;
  return true;
});
```

#### 3. Badge de type de concert :
```javascript
const getConcertTypeBadge = (concert) => {
  if (concert.is_guso) {
    const cachetType = concert.cachet_type;
    let label = 'GUSO';
    let icon = '🎵';
    
    if (cachetType === 'isolé') {
      label = 'GUSO Isolé (12h)';
      icon = '🎵';
    } else if (cachetType === 'groupé') {
      label = 'GUSO Groupé (8h)';
      icon = '🎸';
    }
    
    return <badge bleu avec icon et label>;
  }
  
  return <badge gris "Paiement classique">;
};
```

---

## 🎯 Cas d'Usage

### Scénario 1 : Voir uniquement les concerts GUSO
**Besoin :** Vérifier mes déclarations GUSO avant de remplir mon dossier France Travail

1. Aller dans **Dashboard Musicien** → Onglet **"Abonnements"**
2. Cliquer sur **"Comptabilité Générale"**
3. Sélectionner **"🎵 GUSO (Intermittence)"** dans le filtre "Type de concert"
4. → Seuls les concerts GUSO apparaissent

### Scénario 2 : Voir uniquement les paiements classiques
**Besoin :** Gérer ma comptabilité de prestations non-déclarées au GUSO

1. Même chemin que Scénario 1
2. Sélectionner **"💰 Paiement classique"** dans le filtre
3. → Seuls les concerts non-GUSO apparaissent

### Scénario 3 : Vue d'ensemble complète
**Besoin :** Voir tous mes concerts avec leur type

1. Sélectionner **"Tous les concerts"** (option par défaut)
2. Chaque concert affiche son badge (GUSO ou Classique)
3. → Vue complète avec identification visuelle rapide

---

## 📊 Statistiques Affichées

Les cartes de résumé en haut de l'onglet affichent **toujours les totaux globaux**, indépendamment du filtre sélectionné :
- 💰 **Revenus totaux** de l'année
- ⏳ **En attente** (paiements non reçus)
- 📊 **Cachet moyen**

> **Note :** Les statistiques ne sont PAS filtrées par type de concert. Pour voir les statistiques GUSO uniquement, utilisez l'onglet "Comptabilité GUSO".

---

## 🔀 Différence entre les deux onglets

### Onglet "Comptabilité Générale"
- Affiche **tous les concerts** avec cachet
- Filtre par : Année, Statut de paiement, **Type de concert** ✨
- Objectif : Gestion globale de la comptabilité
- Actions : Upload de factures, marquer comme payé

### Onglet "Comptabilité GUSO"
- Affiche **uniquement les concerts GUSO**
- Filtre par : Année, Statut de déclaration
- Objectif : Suivi de l'intermittence (507h)
- Actions : Marquer comme déclaré, éditer totaux manuels
- Affichage spécifique : Décomposition cachets isolés/groupés

---

## ✅ Avantages

1. **Clarté visuelle** : Identification immédiate du type de concert
2. **Filtrage rapide** : Accès direct aux concerts d'un type spécifique
3. **Conformité** : Facilite la préparation des déclarations administratives
4. **Flexibilité** : Combinaison de filtres (année + statut + type)

---

## 🚀 Exemples d'Utilisation

### Exemple 1 : Préparation déclaration trimestrielle GUSO
```
Filtres :
- Année : 2025
- Statut : Tous
- Type : 🎵 GUSO (Intermittence)

Résultat : Liste de tous les concerts GUSO 2025, 
avec leur type (isolé/groupé) et statut de déclaration
```

### Exemple 2 : Suivi des paiements en retard (classiques uniquement)
```
Filtres :
- Année : 2025
- Statut : En attente
- Type : 💰 Paiement classique

Résultat : Liste des concerts non-GUSO avec paiements en attente
Action : Relancer les établissements
```

### Exemple 3 : Export annuel complet
```
Filtres :
- Année : 2024
- Statut : Tous
- Type : Tous les concerts

Action : Exporter CSV
Résultat : Fichier CSV complet pour la comptabilité annuelle
```

---

## 🎨 Codes Couleurs

| Type de Concert | Badge | Couleur | Signification |
|-----------------|-------|---------|---------------|
| 🎵 GUSO Isolé | `GUSO Isolé (12h)` | Bleu | Concert intermittence - 12 heures |
| 🎸 GUSO Groupé | `GUSO Groupé (8h)` | Bleu | Concert intermittence - 8 heures |
| 🎵 GUSO | `GUSO` | Bleu | Concert GUSO sans type défini |
| 💰 Classique | `Paiement classique` | Gris | Concert hors intermittence |

---

## 🔄 Workflow Complet

### Ajouter un concert GUSO :
1. Créer le concert dans le profil
2. ✅ Cocher "Concert GUSO"
3. **[TODO]** Sélectionner le type (isolé/groupé)
4. Renseigner le cachet
5. → Le concert apparaît avec le badge GUSO

### Ajouter un concert classique :
1. Créer le concert dans le profil
2. ❌ **Ne pas** cocher "Concert GUSO"
3. Renseigner le cachet
4. → Le concert apparaît avec le badge "Paiement classique"

---

## 📱 Responsive Design

Le filtre s'adapte à toutes les tailles d'écran :
- **Desktop** : 3 filtres côte à côte
- **Tablette** : 3 filtres en grille
- **Mobile** : 3 filtres empilés verticalement

---

## 🎓 Conseils d'Utilisation

### Pour les musiciens intermittents :
1. Utilisez le filtre **"GUSO"** avant chaque déclaration trimestrielle
2. Vérifiez que tous vos concerts GUSO ont un type (isolé/groupé)
3. Exportez le CSV pour vos archives administratives

### Pour les musiciens non-intermittents :
1. Utilisez le filtre **"Paiement classique"** pour votre comptabilité
2. L'onglet "Comptabilité GUSO" ne vous concerne pas

### Pour tous :
1. La vue **"Tous les concerts"** vous donne une vision globale
2. Utilisez les badges visuels pour repérer rapidement le type
3. Combinez les filtres pour des recherches précises

---

## ✅ Checklist de Vérification

Après cette mise à jour, vérifiez que :
- [ ] Le filtre "Type de concert" apparaît bien dans l'interface
- [ ] Les 3 options sont sélectionnables
- [ ] Les badges apparaissent sur chaque concert
- [ ] Le filtrage fonctionne correctement
- [ ] Le compteur de concerts se met à jour selon le filtre

---

**Version :** 1.1.0  
**Date :** 22 Décembre 2025  
**Compatible avec :** Logique officielle d'intermittence v1.0.0
