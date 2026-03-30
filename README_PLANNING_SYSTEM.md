# 📅 Système de Planning - Guide Complet

<div align="center">

![Planning](https://img.shields.io/badge/Planning-Système_Calendrier-D946EF?style=for-the-badge&logo=calendar&logoColor=white)

**Documentation complète du système de planning pour Jam Connexion Mobile**

</div>

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Logique Complète](#-logique-complète)
- [Types d'Événements](#-types-dévénements)
- [Fonctionnement par Rôle](#-fonctionnement-par-rôle)
- [API Endpoints](#-api-endpoints)
- [Implémentation React Native](#-implémentation-react-native)
- [Couleurs & UI](#-couleurs--ui)
- [Formulaires](#-formulaires)
- [Exemples de Code](#-exemples-de-code)
- [Gestion des Erreurs](#-gestion-des-erreurs)

---

## 🎯 Vue d'ensemble

Le **système de planning** est le cœur de Jam Connexion. Il permet :

- 🎤 Aux **établissements** de créer et gérer leurs événements musicaux
- 🎸 Aux **musiciens** de voir leurs participations + créneaux disponibles
- 🎵 Aux **mélomanes** de découvrir les événements à venir

### Concept Central

```
CALENDRIER = Événements de l'établissement + Créneaux disponibles + Participations
```

---

## 🔄 Logique Complète

### 1️⃣ **Affichage des événements existants**

Quand un établissement crée un concert, karaoké, spectacle ou jam, ces événements apparaissent **automatiquement** sur le calendrier avec les bonnes couleurs :

- 🔴 **Réservé** (Concert/Spectacle confirmé)
- 🟣 **Karaoké**
- 🟣 **Spectacle**
- 🟢 **Jam Session**
- 🔵 **Bœuf** (improvisation)

### 2️⃣ **Clic sur un jour avec événement**

→ Affiche les **détails** (type, heure, description) avec options :
- ✏️ **Modifier**
- 🗑️ **Supprimer**

### 3️⃣ **Clic sur un jour libre**

→ Ouvre le **formulaire de création** de créneau pré-rempli avec la date

### 4️⃣ **Pour les musiciens**

Le planning affiche :
- ✅ Leurs **participations confirmées** (concerts où ils jouent)
- 📢 **Créneaux disponibles** des établissements (offres de concerts)

---

## 🎪 Types d'Événements

### Pour les Établissements

| Type | Description | Couleur | Icône |
|------|-------------|---------|-------|
| **Jam Session** | Session d'improvisation ouverte | 🟢 Vert | 🎸 |
| **Concert** | Concert privé ou public | 🔴 Rouge | 🎤 |
| **Karaoké** | Soirée karaoké | 🟣 Violet | 🎤 |
| **Spectacle** | Spectacle/show complet | 🟠 Orange | 🎭 |
| **Bœuf** | Jam informel | 🔵 Bleu | 🎺 |

### États d'un Événement

| État | Description |
|------|-------------|
| **Libre** | Aucun événement prévu (jour vide) |
| **Réservé** | Événement créé et confirmé |
| **Complet** | Nombre max de participants atteint (Jam) |
| **Annulé** | Événement supprimé |

---

## 👥 Fonctionnement par Rôle

### 🎤 Établissement (Venue)

**Ce qu'il voit dans son Planning :**
- Tous ses événements créés (Jams, Concerts, Karaokés, Spectacles)
- Calendrier avec couleurs selon le type d'événement

**Ce qu'il peut faire :**
1. ✅ **Créer un événement** : Clic sur jour libre → Formulaire
2. ✏️ **Modifier un événement** : Clic sur événement → Modifier
3. 🗑️ **Supprimer un événement** : Clic sur événement → Supprimer
4. 👥 **Voir les participants** : Liste des musiciens inscrits

**Flux de création :**
```
1. Clic sur jour vide (ex: 15 Mars)
   ↓
2. Formulaire s'ouvre avec date pré-remplie
   ↓
3. Choix du type : Jam / Concert / Karaoké / Spectacle
   ↓
4. Remplir :
   - Heure début / fin
   - Styles musicaux
   - Description
   - (Jam) Nombre max de participants
   ↓
5. Enregistrer
   ↓
6. L'événement apparaît sur le calendrier avec la bonne couleur
   ↓
7. Notification push envoyée aux abonnés (Jacks)
```

---

### 🎸 Musicien

**Ce qu'il voit dans son Planning :**
- ✅ **Participations confirmées** : Événements où il a été accepté (concerts, jams)
- 📢 **Créneaux disponibles** : Offres des établissements (via API `/planning/search`)

**Ce qu'il peut faire :**
1. 👀 **Voir ses participations** : Liste des concerts à venir
2. 📅 **Voir les créneaux dispo** : Établissements cherchant musiciens
3. ✉️ **Postuler** : Envoyer une candidature pour un créneau
4. ❌ **Annuler participation** : Se désinscrire d'un événement

**Exemple de Planning Musicien :**

```
Calendrier Musicien (Mars 2024)
┌────────┬────────┬────────┬────────┬────────┬────────┬────────┐
│  Lun   │  Mar   │  Mer   │  Jeu   │  Ven   │  Sam   │  Dim   │
├────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│        │        │        │   14   │   15   │   16   │   17   │
│        │        │        │        │ 🎤     │        │        │
│        │        │        │        │ Concert│        │        │
├────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│   18   │   19   │   20   │   21   │   22   │   23   │   24   │
│        │        │ 🎸     │        │ 📢     │        │        │
│        │        │ Jam    │        │ Dispo  │        │        │
└────────┴────────┴────────┴────────┴────────┴────────┴────────┘

Légende :
🎤 = Participation confirmée (je joue !)
🎸 = Jam Session où je participe
📢 = Créneau disponible (établissement cherche musicien)
```

---

### 🎵 Mélomane

**Ce qu'il voit dans son Planning :**
- 🎭 **Événements publics** : Jams ouvertes, concerts publics
- ✅ **Mes participations** : Événements où il s'est inscrit

**Ce qu'il peut faire :**
1. 👀 **Voir les événements publics**
2. ✅ **S'inscrire à une Jam/Karaoké**
3. ❌ **Annuler sa participation**

---

## 🔌 API Endpoints

### 1. Récupérer les créneaux/événements

```http
GET /api/planning/search
```

**Query Parameters :**
```
?date=2024-03-15           (optionnel : filtrer par date)
?start_date=2024-03-01     (optionnel : date début)
?end_date=2024-03-31       (optionnel : date fin)
?styles=Rock,Jazz          (optionnel : filtrer par styles)
?venue_id=abc123           (optionnel : événements d'un établissement)
```

**Réponse (exemple) :**
```json
{
  "events": [
    {
      "id": "evt_123",
      "type": "concert",
      "date": "2024-03-15",
      "start_time": "20:00",
      "end_time": "23:00",
      "venue_id": "venue_456",
      "venue_name": "Le Blue Note",
      "music_styles": ["Jazz", "Blues"],
      "description": "Soirée Jazz live",
      "status": "confirmed",
      "participants": [],
      "max_participants": null
    },
    {
      "id": "evt_124",
      "type": "jam",
      "date": "2024-03-20",
      "start_time": "19:00",
      "end_time": "22:00",
      "venue_id": "venue_789",
      "venue_name": "Rock Café",
      "music_styles": ["Rock", "Blues"],
      "description": "Jam Session ouverte",
      "status": "open",
      "participants": [
        {"id": "mus_1", "name": "John Doe"}
      ],
      "max_participants": 5
    }
  ],
  "available_slots": [
    {
      "id": "slot_789",
      "venue_id": "venue_101",
      "venue_name": "Jazz Club",
      "date": "2024-03-22",
      "music_styles": ["Jazz", "Soul"],
      "message": "Recherche groupe de jazz pour soirée privée"
    }
  ]
}
```

---

### 2. Créer un événement (Établissement)

```http
POST /api/planning/slots
Authorization: Bearer {token}
```

**Body :**
```json
{
  "type": "jam",
  "date": "2024-03-25",
  "start_time": "20:00",
  "end_time": "23:00",
  "music_styles": ["Rock", "Blues"],
  "description": "Jam Session ouverte à tous",
  "max_participants": 5
}
```

**Réponse :**
```json
{
  "id": "evt_125",
  "type": "jam",
  "date": "2024-03-25",
  "start_time": "20:00",
  "end_time": "23:00",
  "venue_id": "venue_current",
  "music_styles": ["Rock", "Blues"],
  "description": "Jam Session ouverte à tous",
  "status": "open",
  "participants": [],
  "max_participants": 5,
  "created_at": "2024-03-10T15:30:00Z"
}
```

---

### 3. Modifier un événement

```http
PUT /api/planning/slots/{id}
Authorization: Bearer {token}
```

**Body :**
```json
{
  "start_time": "21:00",
  "description": "Jam Session Rock/Blues (modifiée)"
}
```

---

### 4. Supprimer un événement

```http
DELETE /api/planning/slots/{id}
Authorization: Bearer {token}
```

**Réponse :**
```json
{
  "message": "Événement supprimé avec succès"
}
```

---

### 5. Rejoindre un événement (Musicien/Mélomane)

```http
POST /api/events/{event_id}/join
Authorization: Bearer {token}
```

**Réponse :**
```json
{
  "message": "Participation confirmée",
  "event": {
    "id": "evt_123",
    "type": "jam",
    "date": "2024-03-20"
  }
}
```

---

### 6. Annuler participation

```http
DELETE /api/events/{event_id}/leave
Authorization: Bearer {token}
```

---

## 📱 Implémentation React Native

### Installation

```bash
npm install react-native-calendars
npm install @react-native-community/datetimepicker
```

### Configuration du Calendrier

```javascript
import { Calendar } from 'react-native-calendars';
import { useState, useEffect } from 'react';
import api from '../services/api';

const PlanningScreen = () => {
  const [events, setEvents] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Récupérer les événements
  useEffect(() => {
    fetchEvents();
  }, []);
  
  const fetchEvents = async () => {
    try {
      const response = await api.get('/planning/search');
      const { events, available_slots } = response.data;
      
      setEvents(events);
      markCalendarDates(events);
    } catch (error) {
      console.error('Erreur récupération planning:', error);
    }
  };
  
  // Marquer les dates avec événements
  const markCalendarDates = (eventsList) => {
    const marked = {};
    
    eventsList.forEach(event => {
      marked[event.date] = {
        marked: true,
        dotColor: getEventColor(event.type),
        selectedColor: getEventColor(event.type),
        customStyles: {
          container: {
            backgroundColor: getEventColor(event.type, 0.2)
          }
        }
      };
    });
    
    setMarkedDates(marked);
  };
  
  // Couleur selon le type
  const getEventColor = (type, opacity = 1) => {
    const colors = {
      jam: `rgba(34, 197, 94, ${opacity})`,      // Vert
      concert: `rgba(239, 68, 68, ${opacity})`,  // Rouge
      karaoke: `rgba(168, 85, 247, ${opacity})`, // Violet
      spectacle: `rgba(249, 115, 22, ${opacity})`, // Orange
      boeuf: `rgba(59, 130, 246, ${opacity})`    // Bleu
    };
    return colors[type] || `rgba(156, 163, 175, ${opacity})`;
  };
  
  // Gérer clic sur une date
  const onDayPress = (day) => {
    const dateString = day.dateString;
    const eventsOnDate = events.filter(e => e.date === dateString);
    
    if (eventsOnDate.length > 0) {
      // Jour avec événement(s) → Afficher détails
      setSelectedEvent(eventsOnDate[0]);
      setModalVisible(true);
    } else {
      // Jour libre → Ouvrir formulaire création
      setSelectedDate(dateString);
      setModalVisible(true);
    }
  };
  
  return (
    <View style={styles.container}>
      <Calendar
        markedDates={markedDates}
        onDayPress={onDayPress}
        theme={{
          backgroundColor: '#0A0A12',
          calendarBackground: '#13131A',
          textSectionTitleColor: '#9CA3AF',
          selectedDayBackgroundColor: '#D946EF',
          selectedDayTextColor: '#FFFFFF',
          todayTextColor: '#17D9D9',
          dayTextColor: '#F8FAFC',
          monthTextColor: '#F8FAFC',
          arrowColor: '#D946EF',
          textDayFontFamily: 'Manrope',
          textMonthFontFamily: 'Unbounded',
          textDayHeaderFontFamily: 'Manrope',
        }}
        style={styles.calendar}
      />
      
      {/* Liste des événements du jour */}
      <EventsList events={events} onEventPress={onDayPress} />
      
      {/* Modal détails ou création */}
      <Modal visible={modalVisible} onClose={() => setModalVisible(false)}>
        {selectedEvent ? (
          <EventDetails event={selectedEvent} />
        ) : (
          <CreateEventForm date={selectedDate} />
        )}
      </Modal>
    </View>
  );
};
```

---

## 🎨 Couleurs & UI

### Codes Couleurs des Événements

```javascript
export const EVENT_COLORS = {
  jam: {
    color: '#22C55E',        // Vert
    bg: 'rgba(34, 197, 94, 0.1)',
    border: 'rgba(34, 197, 94, 0.3)',
    icon: '🎸'
  },
  concert: {
    color: '#EF4444',        // Rouge
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: '🎤'
  },
  karaoke: {
    color: '#A855F7',        // Violet
    bg: 'rgba(168, 85, 247, 0.1)',
    border: 'rgba(168, 85, 247, 0.3)',
    icon: '🎤'
  },
  spectacle: {
    color: '#F97316',        // Orange
    bg: 'rgba(249, 115, 22, 0.1)',
    border: 'rgba(249, 115, 22, 0.3)',
    icon: '🎭'
  },
  boeuf: {
    color: '#3B82F6',        // Bleu
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.3)',
    icon: '🎺'
  }
};
```

### Badge de Type d'Événement

```javascript
const EventBadge = ({ type }) => {
  const config = EVENT_COLORS[type];
  
  return (
    <View style={[
      styles.badge,
      { backgroundColor: config.bg, borderColor: config.border }
    ]}>
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={[styles.text, { color: config.color }]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  text: {
    fontFamily: 'Manrope',
    fontSize: 14,
    fontWeight: '600',
  }
});
```

---

## 📝 Formulaires

### Formulaire Création d'Événement (Établissement)

```javascript
const CreateEventForm = ({ date, onSuccess }) => {
  const [formData, setFormData] = useState({
    type: 'jam',
    date: date,
    start_time: '20:00',
    end_time: '23:00',
    music_styles: [],
    description: '',
    max_participants: 5
  });
  
  const handleSubmit = async () => {
    try {
      const response = await api.post('/planning/slots', formData);
      Toast.show({ text: 'Événement créé !' });
      onSuccess();
    } catch (error) {
      Toast.show({ text: 'Erreur création événement', type: 'error' });
    }
  };
  
  return (
    <View style={styles.form}>
      <Text style={styles.title}>Créer un événement</Text>
      
      {/* Type d'événement */}
      <View style={styles.field}>
        <Label>Type</Label>
        <Picker
          selectedValue={formData.type}
          onValueChange={(value) => setFormData({...formData, type: value})}
        >
          <Picker.Item label="🎸 Jam Session" value="jam" />
          <Picker.Item label="🎤 Concert" value="concert" />
          <Picker.Item label="🎤 Karaoké" value="karaoke" />
          <Picker.Item label="🎭 Spectacle" value="spectacle" />
        </Picker>
      </View>
      
      {/* Date (pré-remplie) */}
      <View style={styles.field}>
        <Label>Date</Label>
        <Text style={styles.dateText}>{formData.date}</Text>
      </View>
      
      {/* Heure début */}
      <View style={styles.field}>
        <Label>Heure début</Label>
        <DateTimePicker
          mode="time"
          value={parseTime(formData.start_time)}
          onChange={(e, time) => setFormData({
            ...formData,
            start_time: formatTime(time)
          })}
        />
      </View>
      
      {/* Heure fin */}
      <View style={styles.field}>
        <Label>Heure fin</Label>
        <DateTimePicker
          mode="time"
          value={parseTime(formData.end_time)}
          onChange={(e, time) => setFormData({
            ...formData,
            end_time: formatTime(time)
          })}
        />
      </View>
      
      {/* Styles musicaux */}
      <View style={styles.field}>
        <Label>Styles musicaux</Label>
        <MultiSelect
          items={MUSIC_STYLES}
          selectedItems={formData.music_styles}
          onSelectedItemsChange={(styles) => 
            setFormData({...formData, music_styles: styles})
          }
        />
      </View>
      
      {/* Description */}
      <View style={styles.field}>
        <Label>Description</Label>
        <TextInput
          multiline
          numberOfLines={4}
          value={formData.description}
          onChangeText={(text) => setFormData({...formData, description: text})}
          placeholder="Décrivez votre événement..."
        />
      </View>
      
      {/* Max participants (si Jam) */}
      {formData.type === 'jam' && (
        <View style={styles.field}>
          <Label>Nombre max de participants</Label>
          <Slider
            minimumValue={2}
            maximumValue={20}
            step={1}
            value={formData.max_participants}
            onValueChange={(val) => 
              setFormData({...formData, max_participants: val})
            }
          />
          <Text>{formData.max_participants} participants</Text>
        </View>
      )}
      
      {/* Boutons */}
      <View style={styles.buttons}>
        <Button title="Annuler" onPress={onCancel} />
        <Button 
          title="Créer" 
          onPress={handleSubmit}
          disabled={!formData.music_styles.length}
        />
      </View>
    </View>
  );
};
```

---

## ⚠️ Point Important : API `/planning/search`

### Erreur Actuelle

```
⚠️ L'API /planning/search du serveur de production renvoie actuellement 
une erreur 500.
```

### Solution Temporaire

En attendant que l'API soit fixée :

1. **Le calendrier s'affiche vide** (tout "Libre")
2. **Le formulaire de création fonctionne** 
3. **Quand l'API sera réparée** → Tout s'affichera automatiquement

**Code pour gérer l'erreur :**

```javascript
const fetchEvents = async () => {
  try {
    const response = await api.get('/planning/search');
    const { events } = response.data;
    setEvents(events);
    markCalendarDates(events);
  } catch (error) {
    if (error.response?.status === 500) {
      console.warn('API planning temporairement indisponible');
      // Afficher calendrier vide mais fonctionnel
      setEvents([]);
      setMarkedDates({});
    } else {
      console.error('Erreur planning:', error);
    }
  }
};
```

---

## 🎯 Résumé pour l'Agent Mobile

### Ce qu'il faut implémenter

✅ **Calendrier avec react-native-calendars**
- Marquer les dates avec événements (couleurs)
- Gérer clic sur date avec événement → Détails
- Gérer clic sur date libre → Formulaire création

✅ **Formulaire création événement**
- Type (Jam, Concert, Karaoké, Spectacle)
- Date (pré-remplie)
- Heure début/fin (DateTimePicker)
- Styles musicaux (MultiSelect)
- Description (TextArea)
- Max participants (Slider, si Jam)

✅ **Liste des événements**
- Badge avec couleur selon type
- Détails (heure, lieu, description)
- Actions (Modifier, Supprimer, Rejoindre)

✅ **Gestion des erreurs**
- API 500 → Calendrier vide mais formulaire fonctionnel
- Rate limiting → Debounce sur refresh

---

## 🚀 Endpoints à Utiliser

```javascript
// Récupérer planning
GET /api/planning/search

// Créer événement (établissement)
POST /api/planning/slots

// Modifier événement
PUT /api/planning/slots/{id}

// Supprimer événement
DELETE /api/planning/slots/{id}

// Rejoindre événement (musicien/mélomane)
POST /api/events/{event_id}/join

// Annuler participation
DELETE /api/events/{event_id}/leave
```

---

<div align="center">

**Le système de planning est prêt à être développé !** 📅✨

</div>
