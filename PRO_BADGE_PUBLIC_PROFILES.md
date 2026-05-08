# Badge PRO sur les profils publics - Documentation

## Vue d'ensemble

Le badge PRO est maintenant affiché sur les profils publics des musiciens qui remplissent les conditions suivantes :
- ✅ Abonnement PRO actif (`subscription_tier === 'pro'`)
- ✅ Statut d'abonnement actif (`subscription_status === 'active'`)
- ✅ Numéro GUSO renseigné (`guso_number` non vide)

## Composant : ProBadge

**Fichier :** `/app/frontend/src/components/ProBadge.jsx`

### Props

```javascript
<ProBadge 
  variant="default"  // 'compact' | 'default' | 'large'
  type="pro"         // 'pro' | 'guso' | 'both'
  showText={true}    // Afficher le texte ou juste l'icône
/>
```

### Variants

1. **compact** - Pour les listes (petite taille)
   - Icône 12px
   - Padding réduit
   - Texte xs

2. **default** - Standard (taille moyenne)
   - Icône 16px
   - Padding normal
   - Texte sm

3. **large** - Pour les titres (grande taille)
   - Icône 20px
   - Padding augmenté
   - Texte base

### Types de badge

1. **pro** - Badge PRO classique
   - Couleur : Primary/Cyan
   - Icône : Crown (👑)
   - Label : "PRO"

2. **guso** - Badge GUSO uniquement
   - Couleur : Green/Emerald
   - Icône : CheckCircle (✓)
   - Label : "GUSO"

3. **both** - Badge PRO + GUSO combiné
   - Couleur : Gradient Primary → Cyan → Green
   - Icône : Crown
   - Label : "PRO GUSO"

## Fonctions utilitaires

### `hasProBadge(musician)`
Vérifie si un musicien a le badge PRO complet.
```javascript
return musician?.subscription_tier === 'pro' && 
       musician?.guso_number && 
       musician?.subscription_status === 'active';
```

### `isGusoMember(musician)`
Vérifie si un musicien est membre GUSO (indépendamment de l'abonnement PRO).
```javascript
return musician?.is_guso_member && musician?.guso_number;
```

### `getBadgeType(musician)`
Retourne le type de badge à afficher automatiquement.
```javascript
const isPro = hasProBadge(musician);
const isGuso = isGusoMember(musician);

if (isPro && isGuso) return 'both';
if (isPro) return 'pro';
if (isGuso) return 'guso';
return null;
```

## Intégrations

### 1. Page de profil public - MusicianDetail.jsx

**Emplacement :** À côté du nom du musicien (h1)

```jsx
<div className="flex items-center gap-3">
  <h1>{musician.pseudo}</h1>
  {getBadgeType(musician) && (
    <ProBadge variant="default" type={getBadgeType(musician)} />
  )}
</div>
```

**Rendu :**
```
John Doe  [PRO] 
```

### 2. Liste des musiciens - MusiciansTab.jsx

**Emplacement :** À côté du nom dans les cards (h3)

```jsx
<div className="flex items-center gap-2">
  <h3>{musician.pseudo}</h3>
  {getBadgeType(musician) && (
    <ProBadge variant="compact" type={getBadgeType(musician)} showText={false} />
  )}
</div>
```

**Rendu :**
```
John Doe [👑]
```
(Icône seulement, pas de texte pour gagner de l'espace)

### 3. Autres emplacements possibles (à implémenter si besoin)

- Carte géographique (markers)
- Notifications
- Résultats de recherche
- Candidatures

## Design

### Glassmorphism effect
```css
backdrop-blur-sm
bg-gradient-to-r from-primary/20 to-cyan-500/20
border border-primary/50
```

### Gradients par type

**PRO :**
- Background : `from-primary/20 to-cyan-500/20`
- Border : `border-primary/50`
- Text : `text-primary`

**GUSO :**
- Background : `from-green-500/20 to-emerald-500/20`
- Border : `border-green-500/50`
- Text : `text-green-400`

**BOTH (combiné) :**
- Background : `from-primary/20 via-cyan-500/20 to-green-500/20`
- Border : `border-primary/50`
- Text : Gradient animé `bg-gradient-to-r from-primary via-cyan-400 to-green-400 bg-clip-text`

## Logique métier

### Conditions d'affichage

Le badge PRO s'affiche uniquement si **TOUTES** les conditions sont remplies :

1. ✅ `subscription_tier === 'pro'`
2. ✅ `subscription_status === 'active'` (pas "canceled", "past_due", etc.)
3. ✅ `guso_number` est renseigné (non null, non vide)

### Si l'abonnement est annulé

Si l'utilisateur annule son abonnement :
- Pendant la période d'accès payée → Le badge reste affiché
- Après expiration → Le badge disparaît automatiquement

### Si le numéro GUSO n'est pas renseigné

Si l'utilisateur est PRO mais n'a pas de numéro GUSO :
- Aucun badge PRO n'est affiché
- L'utilisateur est invité à renseigner son numéro dans l'onglet Comptabilité GUSO

## Tests

### Cas de test

1. **Musicien PRO avec GUSO** → Badge "PRO" affiché ✅
2. **Musicien PRO sans GUSO** → Aucun badge ❌
3. **Musicien FREE avec GUSO** → Aucun badge ❌
4. **Musicien PRO avec abonnement annulé** → Aucun badge ❌
5. **Musicien PRO en période d'essai** → Badge "PRO" affiché ✅

### Test manuel

1. Se connecter en tant que musicien
2. S'abonner à PRO
3. Renseigner le numéro GUSO
4. Se déconnecter
5. Accéder au profil public du musicien
6. **Vérifier que le badge PRO apparaît** ✅

## Avantages pour les musiciens PRO

- 🎯 **Visibilité** : Se démarque dans les listes de musiciens
- ✅ **Crédibilité** : Badge vérifié GUSO
- 💼 **Professionnalisme** : Signal de qualité pour les établissements
- 🚀 **ROI** : Justifie l'investissement dans l'abonnement PRO

## Notes techniques

- Composant 100% réutilisable
- Pas de dépendances externes (sauf Lucide icons)
- Responsive (adapté mobile/desktop)
- Performance optimisée (pas de re-render inutile)
- Accessible (screen readers)

## Évolutions futures possibles

- Badge animé (pulse, glow)
- Tooltip au survol avec infos PRO
- Badge "Nouveau PRO" pendant les 7 premiers jours
- Statistiques de visibilité pour les PRO
- A/B testing de différents designs de badge
