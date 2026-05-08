# ⚠️ ATTENTION : Différences Planning Entre les 3 Profils

<div align="center">

**Guide pour l'Agent Mobile**

**NE PAS CONFONDRE LES 3 TYPES DE PLANNING !**

</div>

---

## 🎯 Résumé Rapide

| Profil | Type Planning | Peut Créer/Éditer ? | API Endpoint |
|--------|---------------|---------------------|--------------|
| 🎸 **Musicien** | **Lecture Seule** | ❌ NON | `GET /musician/calendar-events` |
| 🏢 **Établissement** | **Gestion Complète** | ✅ OUI | `GET /planning/venue-calendar` + CRUD |
| 🎵 **Mélomane** | **Pas de planning** | ➖ N/A | Aucun |

---

## 📋 Détails par Profil

### 🎸 MUSICIEN - Calendrier en Lecture Seule

**Principe :**
- Le musicien **NE CRÉE PAS** d'événements
- Son planning se remplit **automatiquement** quand :
  - ✅ Une candidature est acceptée par un établissement
  - ✅ Il ajoute manuellement un concert dans son profil

**Affichage :**
```
┌────────────────────────────────┐
│ 📅 Mon Planning                │
│                                │
│    [Calendrier]                │
│    Dates colorées = événements │
│    Clic date → Détails         │
│                                │
│ ❌ PAS de bouton "Créer"       │
│ ❌ PAS de formulaire           │
└────────────────────────────────┘
```

**Données Affichées :**
- Type 1 : **Candidature Acceptée** (badge vert ✅)
- Type 2 : **Concert Confirmé** (badge bleu 🎵)

**Actions Possibles :**
- ✅ Voir détails événement
- ✅ Navigation vers carte
- ❌ Créer événement
- ❌ Modifier événement
- ❌ Supprimer événement

**API :**
```http
GET /api/musician/calendar-events
Authorization: Bearer {token}

Response:
{
  "events": [...],
  "eventsByDate": {
    "2024-03-15": [{ type: "accepted_application", ... }]
  }
}
```

**Documentation Complète :**  
→ `/app/README_PLANNING_MUSICIAN.md`

---

### 🏢 ÉTABLISSEMENT - Gestion Complète du Planning

**Principe :**
- L'établissement **CRÉE** des offres (slots) dans son planning
- Il peut **modifier** et **supprimer** ces offres
- Les musiciens postulent à ces offres
- L'établissement accepte/refuse les candidatures

**Affichage :**
```
┌────────────────────────────────┐
│ 📅 Mon Planning                │
│                                │
│    [Calendrier]                │
│    ✅ Bouton "Créer une offre" │
│    Clic date → Détails slots   │
│                                │
│ ┌────────────────────────────┐ │
│ │ Formulaire Création Slot   │ │
│ │ - Date                     │ │
│ │ - Heure début/fin          │ │
│ │ - Type (Concert/Jam/etc.)  │ │
│ │ - Styles musicaux          │ │
│ │ - Description              │ │
│ │ - Nombre de places         │ │
│ │ [Sauvegarder]              │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

**Données Affichées :**
- **Slots créés** (offres publiées)
- **Concerts confirmés** (avec musiciens choisis)
- **Jams sessions**
- **Karaokés**
- **Spectacles**

**Actions Possibles :**
- ✅ Créer slot/offre
- ✅ Modifier slot
- ✅ Supprimer slot
- ✅ Voir candidatures reçues
- ✅ Accepter/refuser candidatures
- ✅ Marquer comme "complet"

**APIs :**
```http
GET /api/planning/venue-calendar          # Lire
POST /api/planning/slots                  # Créer
PUT /api/planning/slots/{id}              # Modifier
DELETE /api/planning/slots/{id}           # Supprimer
```

**Documentation Complète :**  
→ `/app/README_VENUE_DASHBOARD.md` (Section Planning)

---

### 🎵 MÉLOMANE - Pas de Planning

**Principe :**
- Les mélomanes **NE CRÉENT PAS** d'événements
- Ils **découvrent** et **participent** aux événements publics
- Pas d'onglet "Planning" dans leur dashboard

**Affichage :**
```
┌────────────────────────────────┐
│ 📅 Événements Disponibles      │
│                                │
│    [Liste événements publics]  │
│    - Concerts                  │
│    - Jams ouvertes             │
│    - Karaokés                  │
│                                │
│ Clic → Bouton "Participer"     │
│                                │
│ ❌ PAS de calendrier personnel │
└────────────────────────────────┘
```

**Ce qu'ils voient :**
- Liste événements publics (planning/search)
- Onglet "Mes Participations" (événements rejoints)
- Onglet "Mes Favoris" (établissements favoris)

**APIs :**
```http
GET /api/planning/search                  # Chercher événements
POST /api/events/{id}/participate         # Rejoindre événement
GET /api/melomane/my-participations       # Mes participations
```

**Documentation Complète :**  
→ `/app/README_MELOMANE_DASHBOARD.md`

---

## 🔄 Flux Complet (Pour Comprendre)

### Scénario : Concert au Blue Note

```
1. 🏢 ÉTABLISSEMENT (Le Blue Note)
   ↓
   Crée un slot dans son planning :
   - Date: 15 mars 2024
   - Heure: 20h-23h
   - Type: Concert
   - Styles: Jazz, Blues
   - Places: 2 musiciens/groupes
   ↓
   
2. 🎸 MUSICIEN (John)
   ↓
   Voit l'offre dans "Recherche Planning"
   Postule à l'offre
   ↓
   
3. 🏢 ÉTABLISSEMENT
   ↓
   Reçoit candidature dans "Candidatures Reçues"
   Accepte John
   ↓
   
4. 🎸 MUSICIEN (John)
   ↓
   ✅ L'événement apparaît AUTOMATIQUEMENT dans son planning
   Badge: "Candidature Acceptée"
   ↓
   
5. 🎵 MÉLOMANE (Marie)
   ↓
   Voit le concert dans "Événements Disponibles"
   Clique "Participer"
   Reçoit confirmation
```

**Résultat :**
- 🏢 Établissement : Voit le slot + candidatures dans son planning
- 🎸 Musicien : Voit l'événement en **lecture seule** dans son planning
- 🎵 Mélomane : Voit l'événement dans "Mes Participations"

---

## ⚠️ Erreurs Fréquentes à Éviter

### ❌ Erreur 1 : Copier le Planning Établissement pour Musicien

**Mauvais :**
```javascript
// ❌ NE PAS FAIRE ÇA
const MusicianPlanning = () => {
  return (
    <>
      <Calendar />
      <Button onPress={createSlot}>Créer une offre</Button>  ← FAUX !
      <SlotForm />  ← FAUX !
    </>
  );
};
```

**Bon :**
```javascript
// ✅ CORRECT
const MusicianPlanning = () => {
  return (
    <>
      <Calendar markedDates={eventsByDate} />
      {/* PAS de bouton créer */}
      {/* PAS de formulaire */}
      <EventDetailsModal events={selectedDateEvents} />
    </>
  );
};
```

---

### ❌ Erreur 2 : Mélanger les Endpoints API

**Mauvais :**
```javascript
// ❌ FAUX - Utiliser l'API établissement pour musicien
const fetchMusicianPlanning = async () => {
  await api.get('/planning/venue-calendar');  ← FAUX !
};
```

**Bon :**
```javascript
// ✅ CORRECT - Endpoint spécifique musicien
const fetchMusicianPlanning = async () => {
  await api.get('/musician/calendar-events');  ← CORRECT
};
```

---

### ❌ Erreur 3 : Permettre Modification pour Musicien

**Mauvais :**
```javascript
// ❌ FAUX
const EventCard = ({ event }) => {
  return (
    <>
      <Text>{event.venue_name}</Text>
      <Button onPress={editEvent}>Modifier</Button>  ← FAUX !
      <Button onPress={deleteEvent}>Supprimer</Button>  ← FAUX !
    </>
  );
};
```

**Bon :**
```javascript
// ✅ CORRECT
const EventCard = ({ event }) => {
  return (
    <>
      <Text>{event.venue_name}</Text>
      {/* Aucun bouton modification */}
      <Button onPress={() => showOnMap(event)}>Voir sur carte</Button>  ← OK
    </>
  );
};
```

---

## 📊 Tableau Récapitulatif Complet

| Fonctionnalité | 🎸 Musicien | 🏢 Établissement | 🎵 Mélomane |
|----------------|-------------|------------------|-------------|
| **A un planning personnel** | ✅ OUI (lecture) | ✅ OUI (gestion) | ❌ NON |
| **Voir calendrier mensuel** | ✅ | ✅ | ❌ |
| **Créer événement/slot** | ❌ | ✅ | ❌ |
| **Modifier événement** | ❌ | ✅ | ❌ |
| **Supprimer événement** | ❌ | ✅ | ❌ |
| **Source données** | Candidatures + Concerts | Slots créés | N/A |
| **Voir événements publics** | ✅ (recherche) | ❌ | ✅ |
| **Participer événement** | ❌ (postule) | ❌ | ✅ |
| **Endpoint principal** | `/musician/calendar-events` | `/planning/venue-calendar` | `/planning/search` |

---

## 🎯 Checklist pour l'Agent Mobile

Avant d'implémenter le planning, **VÉRIFIER** :

### Pour Musicien
- [ ] Utiliser endpoint `/musician/calendar-events`
- [ ] Afficher calendrier en **lecture seule**
- [ ] Deux types badges (Acceptée/Confirmé)
- [ ] Pas de bouton "Créer"
- [ ] Pas de formulaire
- [ ] Bouton "Voir sur carte" seulement
- [ ] Référence : `/app/README_PLANNING_MUSICIAN.md`

### Pour Établissement
- [ ] Utiliser endpoints `/planning/*` (CRUD)
- [ ] Afficher calendrier avec **gestion complète**
- [ ] Bouton "Créer une offre"
- [ ] Formulaire création slot complet
- [ ] Boutons modifier/supprimer
- [ ] Référence : `/app/README_VENUE_DASHBOARD.md`

### Pour Mélomane
- [ ] PAS de planning personnel
- [ ] Liste événements publics (`/planning/search`)
- [ ] Bouton "Participer"
- [ ] Onglet "Mes Participations"
- [ ] Référence : `/app/README_MELOMANE_DASHBOARD.md`

---

## 📚 Documentation Complète

| Fichier | Contenu |
|---------|---------|
| `/app/README_PLANNING_MUSICIAN.md` | **Planning Musicien** (lecture seule) |
| `/app/README_VENUE_DASHBOARD.md` | Planning Établissement (gestion) |
| `/app/README_MELOMANE_DASHBOARD.md` | Mélomane (pas de planning) |
| `/app/README_PLANNING_SYSTEM.md` | Système global de planning |
| `/app/PLANNING_DIFFERENCES.md` | **Ce fichier** (différences) |

---

<div align="center">

**⚠️ MESSAGE IMPORTANT POUR L'AGENT MOBILE ⚠️**

**NE PAS copier le même planning pour les 3 profils !**

Musicien = Lecture seule  
Établissement = Gestion complète  
Mélomane = Pas de planning

**Bien lire les README spécifiques avant d'implémenter !**

</div>
