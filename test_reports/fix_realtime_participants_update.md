# 🔧 Amélioration: Mise à Jour Temps Réel des Participants

## 🐛 Problème Signalé
**Reporter:** Utilisateur (Établissement)  
**Date:** 17 février 2026  
**Priorité:** P2 (Amélioration UX)

### Description
Sur le profil établissement, quand on consulte la page d'un concert/événement, il faut rafraîchir manuellement la page pour voir les participants qui s'ajoutent ou se retirent. Pas de mise à jour automatique en temps réel.

---

## 🔍 Diagnostic

### Comportement Existant
1. ✅ Un polling existe déjà : `fetchEvents()` toutes les 60 secondes
2. ✅ Ce polling met à jour les états `concerts`, `jams`, `karaokes`, `spectacles`
3. ❌ Mais il ne met PAS à jour `selectedEvent` (l'événement actuellement consulté)

### Cause Racine
Lorsque l'utilisateur ouvre le détail d'un événement:
1. Le composant copie l'événement dans `selectedEvent` (état local)
2. Le polling met à jour `concerts` ou `jams` toutes les 60s
3. Mais `selectedEvent` reste avec les anciennes données car c'est une copie indépendante
4. L'utilisateur voit donc toujours l'ancien nombre de participants

**Fichier concerné:** `/app/frontend/src/pages/VenueDashboard.jsx`

---

## ✅ Solutions Implémentées

### 1. Synchronisation de `selectedEvent` avec les Données Rafraîchies

**Fichier:** `/app/frontend/src/pages/VenueDashboard.jsx` (après ligne 415)

**Code ajouté:**
```javascript
// Mettre à jour selectedEvent quand les données sont rafraîchies
useEffect(() => {
  if (selectedEvent && selectedEventType) {
    let updatedEvent = null;
    
    if (selectedEventType === 'concert') {
      updatedEvent = concerts.find(c => c.id === selectedEvent.id);
    } else if (selectedEventType === 'jam') {
      updatedEvent = jams.find(j => j.id === selectedEvent.id);
    } else if (selectedEventType === 'karaoke') {
      updatedEvent = karaokes.find(k => k.id === selectedEvent.id);
    } else if (selectedEventType === 'spectacle') {
      updatedEvent = spectacles.find(s => s.id === selectedEvent.id);
    }
    
    // Mettre à jour selectedEvent si l'événement existe toujours
    if (updatedEvent) {
      setSelectedEvent(updatedEvent);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [concerts, jams, karaokes, spectacles]);
```

**Fonctionnement:**
- Quand `concerts`, `jams`, `karaokes` ou `spectacles` changent (via le polling)
- Si un événement est actuellement sélectionné (`selectedEvent` existe)
- Le useEffect cherche la version mise à jour de cet événement
- Met à jour `selectedEvent` avec les nouvelles données
- **Résultat:** L'interface se met à jour automatiquement avec le nouveau nombre de participants

### 2. Réduction du Temps de Polling

**Avant:**
```javascript
const interval = setInterval(() => {
  fetchEvents();
}, 60000); // 60 secondes
```

**Après:**
```javascript
const interval = setInterval(() => {
  fetchEvents();
}, 15000); // 15 secondes pour mises à jour temps réel
```

**Impact:** 
- Mises à jour 4x plus rapides (15s au lieu de 60s)
- Les participants s'affichent/disparaissent avec un délai maximum de 15 secondes
- Équilibre entre réactivité et charge serveur

---

## 🧪 Tests

### Scénario de Test

**Contexte:**
- Établissement connecté
- Concert créé avec 0 participant
- Modal de détail du concert ouvert

**Actions:**
1. Musicien A rejoint le concert → `participants_count: 0 → 1`
2. Attendre 15 secondes maximum
3. ✅ Le modal doit afficher "1 participant" automatiquement (sans refresh)
4. Musicien B rejoint le concert → `participants_count: 1 → 2`
5. Attendre 15 secondes maximum
6. ✅ Le modal doit afficher "2 participants" automatiquement
7. Musicien A quitte le concert → `participants_count: 2 → 1`
8. Attendre 15 secondes maximum
9. ✅ Le modal doit afficher "1 participant" automatiquement

### Vérification Backend
```bash
# API retourne bien participants_count
GET /api/venues/{venue_id}/concerts
Response: [
  {
    "id": "...",
    "date": "2026-03-04",
    "participants_count": 0,  # ✅ Champ présent
    ...
  }
]
```

---

## 📊 Impact

### Avant
- ❌ Nombre de participants figé au moment de l'ouverture du détail
- ❌ Refresh manuel obligatoire pour voir les changements
- ❌ Mauvaise expérience utilisateur
- ⚠️ Polling toutes les 60 secondes (trop lent)

### Après
- ✅ Nombre de participants mis à jour automatiquement toutes les 15 secondes
- ✅ Aucune action utilisateur requise
- ✅ Expérience fluide et moderne
- ✅ Synchronisation automatique de `selectedEvent`

---

## 🎯 Cas d'Usage Bénéficiaires

1. **Bœufs (Jams Sessions)**
   - Voir en temps réel qui rejoint/quitte
   - Gérer la jauge de participants

2. **Concerts Dates**
   - Suivre les inscriptions des musiciens
   - Voir le nombre total de personnes

3. **Karaokés**
   - Suivre les participants en temps réel

4. **Spectacles**
   - Gérer les inscriptions des groupes et participants

---

## 🔑 Architecture Technique

### Flux de Données

```
┌─────────────────────────────────────────┐
│     Polling (toutes les 15 secondes)    │
│                                         │
│  setInterval(() => {                    │
│    fetchEvents()                        │
│  }, 15000)                              │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   fetchEvents() - API Calls             │
│                                         │
│  GET /api/venues/{id}/jams              │
│  GET /api/venues/{id}/concerts          │
│  GET /api/venues/{id}/karaoke           │
│  GET /api/venues/{id}/spectacle         │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   États mis à jour                      │
│                                         │
│  setJams(newJams)                       │
│  setConcerts(newConcerts)               │
│  setKaraokes(newKaraokes)               │
│  setSpectacles(newSpectacles)           │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   useEffect déclenché                   │
│                                         │
│  Détecte changement dans concerts[]     │
│  Cherche updatedEvent                   │
│  setSelectedEvent(updatedEvent)         │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   UI se met à jour automatiquement      │
│                                         │
│  Modal affiche nouveau participants_count│
└─────────────────────────────────────────┘
```

---

## 📝 Fichiers Modifiés

- `/app/frontend/src/pages/VenueDashboard.jsx`
  - Ajout useEffect pour synchroniser `selectedEvent`
  - Réduction polling: 60s → 15s

---

## 🎯 Statut Final
**RÉSOLU ✅**

Les participants s'affichent maintenant automatiquement en temps réel avec un délai maximum de 15 secondes.

---

## 💡 Améliorations Futures Possibles

1. **WebSockets** (si charge importante)
   - Notifications push instantanées au lieu de polling
   - Pas de délai de 15 secondes
   
2. **Polling Adaptatif**
   - Plus rapide (5s) quand modal ouvert
   - Plus lent (30s) quand modal fermé
   
3. **Optimistic UI**
   - Mettre à jour immédiatement l'UI avant la réponse serveur
   - Rollback si erreur
