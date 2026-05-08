# Fonctionnalité : Événements Passés Cliquables

## 🎯 Objectif
Permettre aux établissements de **cliquer sur les événements passés** pour voir leurs détails complets, et pas seulement pour éditer la rentabilité.

## ✅ Modifications apportées

### Fichier modifié : `/app/frontend/src/pages/VenueDashboard.jsx`

#### 1. **Événements passés maintenant cliquables** (Ligne ~5033-5038)
```jsx
<div
  key={event.id}
  className="p-4 bg-card rounded-xl border border-white/10 hover:border-primary/30 transition-colors cursor-pointer"
  onClick={() => handleEditEvent(event, event.type)}
  title="Cliquez pour voir les détails de l'événement"
>
```

**Changement :**
- Ajout de `cursor-pointer` pour indiquer que l'élément est cliquable
- Ajout de `onClick={() => handleEditEvent(event, event.type)}` pour ouvrir les détails
- Ajout d'un `title` pour l'accessibilité

#### 2. **Icône visuelle pour indiquer la cliquabilité** (Ligne ~5041)
```jsx
<div className="flex items-center gap-3 mb-2">
  <Eye className="w-4 h-4 text-primary opacity-60" />
  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
    event.type === 'jam' 
      ? 'bg-purple-500/20 text-purple-400' 
      : 'bg-blue-500/20 text-blue-400'
  }`}>
    {event.type === 'jam' ? '🎸 Bœuf' : '🎤 Concert'}
  </span>
```

**Changement :**
- Ajout d'une icône "👁️ Eye" pour indiquer visuellement que l'événement peut être consulté

#### 3. **Empêcher la propagation du clic sur le bouton de rentabilité** (Ligne ~5111-5115)
```jsx
<Button
  onClick={(e) => {
    e.stopPropagation();  // ← NOUVEAU
    openProfitabilityEdit(event);
  }}
  size="sm"
  variant="outline"
  className="rounded-full"
>
```

**Changement :**
- Ajout de `e.stopPropagation()` pour éviter que le clic sur le bouton "Ajouter/Modifier" n'ouvre aussi les détails de l'événement

## 🎨 Expérience utilisateur

### Avant
- Les événements passés étaient **affichés en lecture seule**
- Seul le bouton "Ajouter/Modifier" de rentabilité était interactif
- Impossible de voir les détails complets d'un ancien événement

### Après
- Les événements passés sont **entièrement cliquables** 👆
- Une icône "👁️" indique visuellement qu'on peut cliquer
- Le curseur devient une main (pointer) au survol
- Un clic ouvre les détails complets de l'événement
- Le bouton de rentabilité reste fonctionnel sans interférence

## 📱 Comment tester

1. **Connexion** en tant qu'établissement (venue)
   - Email: `bar@gmail.com`
   - Mot de passe: `test`

2. **Naviguer** vers l'onglet "Historique" dans le dashboard

3. **Créer un événement avec date passée** (si nécessaire pour le test) :
   ```bash
   # Via l'API directement pour créer un événement passé
   curl -X POST "$API_URL/api/jams" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "date": "2026-01-01",
       "start_time": "20:00",
       "end_time": "23:00",
       "music_styles": ["Rock", "Blues"]
     }'
   ```

4. **Cliquer** sur n'importe quel événement passé affiché

5. **Vérifier** que la modale s'ouvre avec tous les détails :
   - Date et horaires
   - Styles musicaux
   - Description
   - Instruments disponibles
   - Règlement
   - etc.

## 🔍 Backend

L'endpoint backend existe déjà et fonctionne correctement :
- **GET** `/api/venues/me/past-events` → Retourne tous les événements passés avec rentabilité

## ✨ Bénéfices

1. **Consultation facilitée** : Les établissements peuvent revoir les détails de leurs anciens événements
2. **Suivi historique** : Meilleure traçabilité de ce qui a été organisé
3. **Référence** : Possibilité de dupliquer ou s'inspirer d'anciens événements
4. **UX cohérente** : Même comportement que les événements futurs

## 🚀 Statut

✅ **Implémenté** - Prêt pour test utilisateur
