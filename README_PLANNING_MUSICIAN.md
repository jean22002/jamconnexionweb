# 📅 Onglet Planning - Dashboard Musicien

<div align="center">

**Spécifications Complètes pour l'App Mobile**

⚠️ **ATTENTION : Le Planning Musicien est DIFFÉRENT du Planning Établissement**

</div>

---

## 🎯 Vue d'ensemble

L'onglet **Planning** du dashboard Musicien affiche un **calendrier de LECTURE SEULE** montrant tous les événements où le musicien va jouer.

### ⚠️ Différences Critiques avec les Autres Profils

| Profil | Type de Planning | Peut Créer/Modifier ? |
|--------|------------------|----------------------|
| 🎸 **Musicien** | **LECTURE SEULE** - Voir ses concerts | ❌ NON |
| 🏢 **Établissement** | **GESTION** - Créer/éditer slots | ✅ OUI |
| 🎵 **Mélomane** | Pas de planning | ➖ N/A |

**Pourquoi ?**
- Les **musiciens** ne créent PAS d'événements
- Ils **postulent** à des offres créées par les établissements
- Leur planning se remplit automatiquement quand :
  - ✅ Une candidature est acceptée
  - ✅ Un concert est confirmé manuellement

---

## 📋 Table des Matières

- [Fonctionnalités](#-fonctionnalités)
- [Sources de Données](#-sources-de-données)
- [Interface Utilisateur](#-interface-utilisateur)
- [API & Données](#-api--données)
- [Implémentation Mobile](#-implémentation-mobile)
- [Différences avec Établissement](#-différences-avec-établissement)

---

## 🔥 Fonctionnalités

### 1. Calendrier Mensuel (Lecture Seule)

**Comportement :**
- Affiche le mois en cours par défaut
- Navigation mois précédent/suivant
- Dates avec événements colorées en violet/primary
- Clic sur une date → Modal avec détails événements

**États :**
```javascript
const [currentMonth, setCurrentMonth] = useState(new Date());
const [eventsByDate, setEventsByDate] = useState({});
const [selectedDate, setSelectedDate] = useState(null);
const [showEventModal, setShowEventModal] = useState(false);
const [loadingCalendar, setLoadingCalendar] = useState(true);
```

**UI :**
```
┌─────────────────────────────────────────┐
│ 📅 Mon Planning                         │
├─────────────────────────────────────────┤
│                                         │
│      [<]    Mars 2024    [>]            │
│                                         │
│  L   M   M   J   V   S   D              │
│              1   2   3   4   5          │
│  6   7   8   9  10  11  12              │
│ 13  14 [15] 16  17  18  19  ← 15 = Événement (violet)
│ 20  21  22  23  24  25  26              │
│ 27  28  29  30  31                      │
│                                         │
└─────────────────────────────────────────┘
```

---

### 2. Deux Types d'Événements

#### Type 1 : Candidature Acceptée ✅

**Source :** Applications acceptées (`status: "accepted"`)

**Exemple :**
```json
{
  "type": "accepted_application",
  "date": "2024-03-15",
  "time": "20:00-23:00",
  "venue_name": "Le Blue Note",
  "venue_city": "Paris",
  "venue_department": "75",
  "venue_id": "venue_123",
  "venue_latitude": 48.8566,
  "venue_longitude": 2.3522,
  "band_name": "Les Jazzmen",
  "title": "Concert - Le Blue Note",
  "description": "Soirée Jazz Soul",
  "slot_id": "slot_456",
  "application_id": "app_789"
}
```

**Badge UI :**
```
┌──────────────────────────────┐
│ ✅ Candidature Acceptée      │ ← Badge vert
└──────────────────────────────┘
```

#### Type 2 : Concert Confirmé 🎵

**Source :** Concerts ajoutés manuellement dans le profil musicien

**Exemple :**
```json
{
  "type": "confirmed_concert",
  "date": "2024-03-20",
  "time": "21:00",
  "venue_name": "Jazz Café",
  "venue_city": "Lyon",
  "venue_department": "69",
  "venue_id": "venue_456",
  "venue_latitude": 45.7640,
  "venue_longitude": 4.8357,
  "title": "Concert - Jazz Café",
  "description": "Concert privé",
  "concert_id": "concert_123"
}
```

**Badge UI :**
```
┌──────────────────────────────┐
│ 🎵 Concert Confirmé          │ ← Badge bleu
└──────────────────────────────┘
```

---

### 3. Modal Détails Événement

**Déclenchement :**
- Clic sur une date colorée du calendrier

**Contenu :**
```
┌─────────────────────────────────────────────┐
│ Événements du vendredi 15 mars 2024        │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ✅ Candidature Acceptée                  │ │
│ │                                          │ │
│ │ Le Blue Note                             │ │
│ │                                          │ │
│ │ 🕐 20:00-23:00                           │ │
│ │ 📍 Paris (75)                            │ │
│ │ 🎸 Groupe: Les Jazzmen                   │ │
│ │                                          │ │
│ │ Soirée Jazz Soul au cœur de Paris...    │ │
│ │                                          │ │
│ │ ┌───────────────────────────────────┐   │ │
│ │ │ 📍 Voir sur la carte              │   │ │ ← Bouton
│ │ └───────────────────────────────────┘   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 🎵 Concert Confirmé                      │ │
│ │                                          │ │
│ │ Jazz Café                                │ │
│ │ ...                                      │ │
│ └─────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

**Informations Affichées :**

| Champ | Toujours Présent | Exemple |
|-------|------------------|---------|
| Type (Badge) | ✅ Oui | "Candidature Acceptée" / "Concert Confirmé" |
| Nom Établissement | ✅ Oui | "Le Blue Note" |
| Heure | ⚠️ Parfois | "20:00-23:00" |
| Ville | ✅ Oui | "Paris (75)" |
| Groupe | ⚠️ Parfois | "Les Jazzmen" |
| Description | ⚠️ Parfois | "Soirée Jazz Soul..." |
| Bouton Carte | ⚠️ Si GPS disponible | Si `latitude` et `longitude` présents |

---

### 4. Bouton "Voir sur la carte"

**Comportement :**
1. Utilisateur clique sur "Voir sur la carte" dans le modal
2. Modal se ferme
3. Navigation vers onglet "Carte" (Map Tab)
4. Carte se centre automatiquement sur l'établissement
5. Toast : "Affichage de {venue_name} sur la carte"

**Conditions :**
- Visible uniquement si `event.venue_latitude` ET `event.venue_longitude` existent
- Si GPS manquant → Toast erreur : "Coordonnées GPS non disponibles"

**Flux :**
```
1. User clique "Voir sur la carte"
   ↓
2. setShowEventModal(false)
   ↓
3. setActiveTab("map")
   ↓
4. setMapCenter([event.latitude, event.longitude])
   ↓
5. Carte affiche l'établissement
```

---

## 📊 Sources de Données

### Source 1 : Candidatures Acceptées

**Endpoint :** `GET /api/musician/calendar-events`

**Logique Backend :**
```python
# 1. Récupérer toutes les candidatures acceptées
accepted_apps = await db.applications.find({
    "musician_id": musician["id"],
    "status": "accepted"
}).to_list(1000)

# 2. Pour chaque candidature :
#    - Récupérer le slot (planning_slot_id)
#    - Récupérer l'établissement (venue_id)
#    - Construire l'événement
```

**Collections MongoDB Impliquées :**
- `applications` - Candidatures du musicien
- `planning_slots` - Détails des offres (date, heure, description)
- `venues` - Informations établissement (nom, ville, GPS)

### Source 2 : Concerts Confirmés

**Logique Backend :**
```python
# Récupérer le profil musicien
musician = await db.musicians.find_one({"user_id": current_user["id"]})

# Extraire liste concerts
concerts = musician.get("concerts", [])

# Chaque concert contient déjà toutes les infos
for concert in concerts:
    event = {
        "type": "confirmed_concert",
        "date": concert.get("date"),
        "venue_name": concert.get("venue_name"),
        # ...
    }
```

**Collection MongoDB :**
- `musicians.concerts` - Array dans le document musicien

---

## 🔌 API & Données

### Endpoint Principal

**Requête :**
```http
GET /api/musician/calendar-events
Authorization: Bearer {jwt_token}
```

**Réponse :**
```json
{
  "events": [
    {
      "type": "accepted_application",
      "date": "2024-03-15",
      "time": "20:00-23:00",
      "venue_name": "Le Blue Note",
      "venue_city": "Paris",
      "venue_department": "75",
      "venue_id": "venue_123",
      "venue_latitude": 48.8566,
      "venue_longitude": 2.3522,
      "band_name": "Les Jazzmen",
      "title": "Concert - Le Blue Note",
      "description": "Soirée Jazz Soul",
      "slot_id": "slot_456",
      "application_id": "app_789"
    },
    {
      "type": "confirmed_concert",
      "date": "2024-03-20",
      "time": "21:00",
      "venue_name": "Jazz Café",
      "venue_city": "Lyon",
      "venue_department": "69",
      "venue_id": "venue_456",
      "venue_latitude": 45.7640,
      "venue_longitude": 4.8357,
      "title": "Concert - Jazz Café",
      "description": null,
      "concert_id": "concert_123"
    }
  ],
  "eventsByDate": {
    "2024-03-15": [
      {
        "type": "accepted_application",
        "date": "2024-03-15",
        "venue_name": "Le Blue Note",
        // ... même objet que dans events
      }
    ],
    "2024-03-20": [
      {
        "type": "confirmed_concert",
        // ...
      }
    ]
  }
}
```

**Structure :**
- `events` : Array de tous les événements (pour liste chronologique)
- `eventsByDate` : Objet avec dates en clés (pour colorier calendrier)

---

## 📱 Implémentation Mobile

### 1. Composant Calendrier

**Bibliothèque Recommandée :**
```bash
npm install react-native-calendars
```

**Code :**
```javascript
import { Calendar } from 'react-native-calendars';

const PlanningTab = () => {
  const [eventsByDate, setEventsByDate] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendarEvents();
  }, []);

  const fetchCalendarEvents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/musician/calendar-events');
      setEventsByDate(response.data.eventsByDate || {});
    } catch (error) {
      console.error('Erreur chargement planning:', error);
      Alert.alert('Erreur', 'Impossible de charger le planning');
    } finally {
      setLoading(false);
    }
  };

  // Formater les dates pour le calendrier
  const markedDates = useMemo(() => {
    const marked = {};
    Object.keys(eventsByDate).forEach(date => {
      marked[date] = {
        marked: true,
        dotColor: '#a855f7', // Violet
        selected: date === selectedDate,
        selectedColor: '#a855f7'
      };
    });
    return marked;
  }, [eventsByDate, selectedDate]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📅 Mon Planning</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#a855f7" />
      ) : (
        <Calendar
          markedDates={markedDates}
          onDayPress={(day) => {
            setSelectedDate(day.dateString);
            setModalVisible(true);
          }}
          theme={{
            backgroundColor: '#1e1e2e',
            calendarBackground: '#1e1e2e',
            textSectionTitleColor: '#ffffff',
            selectedDayBackgroundColor: '#a855f7',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#ec4899',
            dayTextColor: '#ffffff',
            textDisabledColor: '#666666',
            dotColor: '#a855f7',
            selectedDotColor: '#ffffff',
            arrowColor: '#a855f7',
            monthTextColor: '#ffffff',
          }}
        />
      )}
      
      <EventModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        events={eventsByDate[selectedDate] || []}
        selectedDate={selectedDate}
        onShowOnMap={handleShowOnMap}
      />
    </View>
  );
};
```

### 2. Modal Événements

```javascript
const EventModal = ({ visible, onClose, events, selectedDate, onShowOnMap }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Événements du {formatDate(selectedDate)}
          </Text>
          
          <ScrollView style={styles.eventsList}>
            {events.length === 0 ? (
              <View style={styles.noEvents}>
                <Text>Aucun événement ce jour</Text>
              </View>
            ) : (
              events.map((event, index) => (
                <EventCard
                  key={index}
                  event={event}
                  onShowOnMap={onShowOnMap}
                />
              ))
            )}
          </ScrollView>
          
          <Button title="Fermer" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const EventCard = ({ event, onShowOnMap }) => {
  const getBadgeStyle = () => {
    if (event.type === 'accepted_application') {
      return { bg: '#10b98120', text: '#10b981', label: '✅ Candidature Acceptée' };
    } else {
      return { bg: '#3b82f620', text: '#3b82f6', label: '🎵 Concert Confirmé' };
    }
  };
  
  const badge = getBadgeStyle();
  
  return (
    <View style={styles.eventCard}>
      {/* Badge Type */}
      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.badgeText, { color: badge.text }]}>
          {badge.label}
        </Text>
      </View>
      
      {/* Nom Établissement */}
      <Text style={styles.venueName}>{event.venue_name}</Text>
      
      {/* Heure */}
      {event.time && (
        <View style={styles.infoRow}>
          <Icon name="clock" size={16} color="#a855f7" />
          <Text style={styles.infoText}>{event.time}</Text>
        </View>
      )}
      
      {/* Ville */}
      <View style={styles.infoRow}>
        <Icon name="map-pin" size={16} color="#a855f7" />
        <Text style={styles.infoText}>
          {event.venue_city}
          {event.venue_department && ` (${event.venue_department})`}
        </Text>
      </View>
      
      {/* Groupe */}
      {event.band_name && (
        <View style={styles.infoRow}>
          <Icon name="music" size={16} color="#a855f7" />
          <Text style={styles.infoText}>{event.band_name}</Text>
        </View>
      )}
      
      {/* Description */}
      {event.description && (
        <Text style={styles.description}>{event.description}</Text>
      )}
      
      {/* Bouton Carte */}
      {event.venue_latitude && event.venue_longitude && (
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => onShowOnMap(event)}
        >
          <Icon name="map-pin" size={16} color="#fff" />
          <Text style={styles.mapButtonText}>Voir sur la carte</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
```

### 3. Navigation vers Carte

```javascript
const handleShowOnMap = (event) => {
  // Vérifier coordonnées
  if (!event.venue_latitude || !event.venue_longitude) {
    Alert.alert('Erreur', 'Coordonnées GPS non disponibles');
    return;
  }
  
  // Fermer modal
  setModalVisible(false);
  
  // Naviguer vers onglet Carte
  navigation.navigate('Dashboard', {
    screen: 'Map',
    params: {
      centerOn: {
        latitude: event.venue_latitude,
        longitude: event.venue_longitude,
        venueName: event.venue_name
      }
    }
  });
  
  // Toast
  Toast.show({
    type: 'success',
    text1: 'Affichage sur la carte',
    text2: event.venue_name
  });
};
```

---

## ⚠️ Différences avec Planning Établissement

**C'EST CRUCIAL DE NE PAS CONFONDRE !**

### Planning Musicien (Lecture Seule)

| Fonctionnalité | Musicien |
|----------------|----------|
| **Affichage** | ✅ Calendrier avec événements |
| **Créer événement** | ❌ NON |
| **Modifier événement** | ❌ NON |
| **Supprimer événement** | ❌ NON |
| **Source données** | Candidatures acceptées + Concerts confirmés |
| **Interaction** | Voir détails, navigation carte |

### Planning Établissement (Gestion)

| Fonctionnalité | Établissement |
|----------------|---------------|
| **Affichage** | ✅ Calendrier avec slots |
| **Créer slot** | ✅ OUI (formulaire complet) |
| **Modifier slot** | ✅ OUI |
| **Supprimer slot** | ✅ OUI |
| **Source données** | `planning_slots` créés par l'établissement |
| **Interaction** | CRUD complet |

### Schéma Comparatif

```
MUSICIEN (Lecture Seule)
┌──────────────────────────────┐
│ Calendrier                   │
│  - Affichage événements      │
│  - Clic → Modal détails      │
│  - Bouton "Voir sur carte"   │
│  - Pas de boutons créer/edit │
└──────────────────────────────┘

ÉTABLISSEMENT (Gestion)
┌──────────────────────────────┐
│ Calendrier                   │
│  - Affichage slots           │
│  - Clic → Modal détails      │
│  - Bouton "Créer slot"       │
│  - Bouton "Modifier"         │
│  - Bouton "Supprimer"        │
│  - Formulaire création       │
└──────────────────────────────┘
```

---

## ✅ Checklist Implémentation

### Phase 1 : MVP

- [ ] Afficher calendrier mensuel (react-native-calendars)
- [ ] Appeler API `/musician/calendar-events`
- [ ] Colorer dates avec événements (violet)
- [ ] Modal détails événements au clic
- [ ] Badge type événement (Acceptée/Confirmé)
- [ ] Afficher infos : venue, heure, ville, groupe
- [ ] Bouton "Voir sur la carte" (si GPS disponible)
- [ ] Navigation vers Map Tab avec centrage
- [ ] Loading state + error handling

### Phase 2 : Améliorations

- [ ] Pull-to-refresh pour recharger
- [ ] Animation transition modal
- [ ] Skeleton loading pour calendrier
- [ ] Empty state si aucun événement
- [ ] Toast confirmations
- [ ] Icônes pour types événements
- [ ] Formater dates en français

---

## 🐛 Gestion des Erreurs

| Erreur | Cause | Action |
|--------|-------|--------|
| API échoue | Backend down | Afficher message + bouton Réessayer |
| Aucun événement | Pas de concerts | Calendrier vide, message explicatif |
| GPS manquant | Établissement sans coordonnées | Masquer bouton carte |
| Modal vide | Date sans événement | "Aucun événement ce jour" |

---

## 🎨 Design Tokens

```javascript
const colors = {
  primary: '#a855f7',           // Violet (événements)
  secondary: '#ec4899',         // Rose
  success: '#10b981',           // Vert (acceptée)
  info: '#3b82f6',             // Bleu (confirmé)
  background: '#1e1e2e',
  card: 'rgba(255,255,255,0.05)',
  text: '#ffffff',
};

const badges = {
  accepted: {
    bg: '#10b98120',
    text: '#10b981',
    label: '✅ Candidature Acceptée'
  },
  confirmed: {
    bg: '#3b82f620',
    text: '#3b82f6',
    label: '🎵 Concert Confirmé'
  }
};
```

---

## 📚 Bibliothèques Recommandées

```json
{
  "dependencies": {
    "react-native-calendars": "^1.1305.0",
    "react-native-modal": "^13.0.1",
    "react-native-toast-message": "^2.1.7"
  }
}
```

---

## 🎯 Résumé Technique

**Complexité :** Facile-Moyenne

**Temps estimé :** 1-2 jours

**Points clés :**
- ⚠️ **LECTURE SEULE** - Pas de création/modification
- 2 types événements (acceptée/confirmé)
- Navigation vers carte
- API unique : `/musician/calendar-events`

**Erreurs à éviter :**
- ❌ NE PAS copier le planning établissement
- ❌ NE PAS ajouter de boutons créer/modifier
- ❌ NE PAS permettre la gestion de slots

---

<div align="center">

**Planning Musicien : Calendrier en Lecture Seule** 📅

Affiche uniquement les événements confirmés  
Pas de création ni modification  
Source : Candidatures acceptées + Concerts manuels

**L'Agent Mobile doit bien faire la distinction ! ⚠️**

</div>
