# 🎤 Dashboard Établissement - Guide Complet des 15 Onglets

<div align="center">

![Venue Dashboard](https://img.shields.io/badge/Venue-Dashboard-D946EF?style=for-the-badge&logo=building&logoColor=white)

**Documentation exhaustive de tous les onglets du tableau de bord Établissement**

</div>

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [1. Profil](#1--profil)
- [2. Jams (Bœufs)](#2--jams-bœufs)
- [3. Concerts](#3--concerts)
- [4. Karaoké](#4--karaoké)
- [5. Spectacle](#5--spectacle)
- [6. Planning](#6--planning)
- [7. Candidatures](#7--candidatures)
- [8. Jacks (Abonnés)](#8--jacks-abonnés)
- [9. Notifications](#9--notifications)
- [10. History (Historique)](#10--history-historique)
- [11. Accounting (Comptabilité)](#11--accounting-comptabilité)
- [12. Reviews (Avis)](#12--reviews-avis)
- [13. Bands (Groupes)](#13--bands-groupes)
- [14. Gallery (Galerie)](#14--gallery-galerie)
- [15. Settings (Paramètres)](#15--settings-paramètres)

---

## 🎯 Vue d'ensemble

Le **Dashboard Établissement** contient **15 onglets** organisés ainsi :

```
┌─────────────────────────────────────────────────────────┐
│  ☰  Jam Connexion          🔔(12)  💬(5)  ⚙️            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Profil] [Jams] [Concerts] [Karaoké] [Spectacle]      │
│  [Planning] [Candidatures] [Jacks] [Notifications]     │
│  [History] [Accounting] [Reviews] [Bands] [Gallery]    │
│  [Settings]                                             │
│                                                          │
│  ═══════════════════════════════════════════════════    │
│  │                                                  │    │
│  │   Contenu de l'onglet actif                     │    │
│  │                                                  │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Navigation Tabs (Scrollable)

```javascript
<TabsList className="flex w-full overflow-x-auto bg-muted/50 rounded-full p-1 gap-1">
  <TabsTrigger value="profile">Profil</TabsTrigger>
  <TabsTrigger value="jams">Jams</TabsTrigger>
  <TabsTrigger value="concerts">Concerts</TabsTrigger>
  <TabsTrigger value="karaoke">Karaoké</TabsTrigger>
  <TabsTrigger value="spectacle">Spectacle</TabsTrigger>
  <TabsTrigger value="planning">Planning</TabsTrigger>
  <TabsTrigger value="candidatures">Candidatures</TabsTrigger>
  <TabsTrigger value="jacks">Jacks</TabsTrigger>
  <TabsTrigger value="notifications">Notifications</TabsTrigger>
  <TabsTrigger value="history">History</TabsTrigger>
  <TabsTrigger value="accounting">Accounting</TabsTrigger>
  <TabsTrigger value="reviews">Reviews</TabsTrigger>
  <TabsTrigger value="bands">Bands</TabsTrigger>
  <TabsTrigger value="gallery">Gallery</TabsTrigger>
  <TabsTrigger value="settings">Settings</TabsTrigger>
</TabsList>
```

---

## 1. 📝 Profil

### Description
Affichage et modification du profil de l'établissement.

### UI/Wireframe

```
┌─────────────────────────────────────────────────────────┐
│  Le Blue Note                          [✏️ Éditer le profil]
│  Établissement                                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📞 Contact                    ℹ️ Informations          │
│  ┌─────────────────────┐      ┌──────────────────────┐  │
│  │ 📍 Adresse           │      │ Description          │  │
│  │ 25 Rue des Lombards │      │ Bar à Jazz           │  │
│  │ 75011 Paris         │      │ emblématique...      │  │
│  │                     │      │                      │  │
│  │ ☎️ Téléphone         │      │ 👥 Capacité          │  │
│  │ 01 42 33 37 71      │      │ 100 personnes        │  │
│  │                     │      │                      │  │
│  │ ✉️ Email             │      │ 🔗 Réseaux sociaux   │  │
│  │ contact@blue.fr     │      │ 🌐 Facebook Instagram│  │
│  └─────────────────────┘      └──────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Données Affichées

| Champ | Type | Exemple |
|-------|------|---------|
| `name` | String | "Le Blue Note" |
| `venue_type` | String | "Bar à Jazz" |
| `address` | String | "25 Rue des Lombards" |
| `postal_code` | String | "75011" |
| `city` | String | "Paris" |
| `phone` | String | "01 42 33 37 71" |
| `email` | String | "contact@bluenote.fr" |
| `description` | Text | "Bar à Jazz emblématique..." |
| `capacity` | Number | 100 |
| `website` | URL | "https://bluenote.fr" |
| `facebook` | URL | "https://facebook.com/bluenote" |
| `instagram` | URL | "https://instagram.com/bluenote" |
| `music_styles` | Array | ["Jazz", "Blues", "Soul"] |

### Actions

- ✏️ **Éditer le profil** : Ouvre une modal avec formulaire complet

### Modal d'édition

```
┌─────────────────────────────────────────────────────────┐
│  ✕              Éditer le profil                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📸 Photo de profil                                     │
│  [Photo actuelle]      [📷 Changer photo]               │
│                                                          │
│  Nom de l'établissement *                               │
│  [Le Blue Note_________________________]                │
│                                                          │
│  Type d'établissement                                   │
│  [Bar à Jazz___________________________]                │
│                                                          │
│  📍 Adresse *                                           │
│  [25 Rue des Lombards__________________]                │
│                                                          │
│  Code postal | Ville                                    │
│  [75011] [Paris_________________________]               │
│                                                          │
│  📱 Téléphone                                           │
│  [01 42 33 37 71_______________________]                │
│                                                          │
│  ✉️ Email                                               │
│  [contact@bluenote.fr__________________]                │
│                                                          │
│  🌐 Site web                                            │
│  [https://bluenote.fr__________________]                │
│                                                          │
│  📝 Description                                         │
│  ┌──────────────────────────────────────┐               │
│  │ Bar à Jazz emblématique depuis 1985  │               │
│  │ Programmation de qualité...          │               │
│  └──────────────────────────────────────┘               │
│                                                          │
│  👥 Capacité                                            │
│  [100] personnes                                        │
│                                                          │
│  🎵 Styles musicaux acceptés                            │
│  ☑️ Jazz  ☑️ Blues  ☑️ Soul  ☐ Rock                    │
│  ☐ Pop   ☐ Funk   ☐ Reggae                             │
│                                                          │
│  🔗 Réseaux sociaux                                     │
│  Facebook : [https://facebook.com/bluenote]             │
│  Instagram : [https://instagram.com/bluenote]           │
│                                                          │
│  [Annuler]                        [💾 Enregistrer]      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### API Endpoints

```http
GET /api/venues/me
PUT /api/venues/me
POST /api/upload/venue-photo
```

### Code React Native

```javascript
const ProfileTab = ({ venue, onEdit }) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{venue.name}</Text>
          <Text style={styles.type}>{venue.venue_type || 'Établissement'}</Text>
        </View>
        <TouchableOpacity onPress={onEdit} style={styles.editButton}>
          <Icon name="edit" size={20} color="#D946EF" />
          <Text style={styles.editText}>Éditer le profil</Text>
        </TouchableOpacity>
      </View>
      
      {/* Grille 2 colonnes */}
      <View style={styles.grid}>
        {/* Colonne Contact */}
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>📞 Contact</Text>
          
          {venue.address && (
            <View style={styles.row}>
              <Icon name="map-pin" size={20} color="#D946EF" />
              <View>
                <Text style={styles.label}>Adresse</Text>
                <Text style={styles.value}>{venue.address}</Text>
                <Text style={styles.value}>{venue.postal_code} {venue.city}</Text>
              </View>
            </View>
          )}
          
          {venue.phone && (
            <View style={styles.row}>
              <Icon name="phone" size={20} color="#D946EF" />
              <View>
                <Text style={styles.label}>Téléphone</Text>
                <Text style={styles.value}>{venue.phone}</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Colonne Informations */}
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>ℹ️ Informations</Text>
          
          {venue.description && (
            <View>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.value}>{venue.description}</Text>
            </View>
          )}
          
          {/* Réseaux sociaux */}
          <View style={styles.socials}>
            {venue.website && (
              <TouchableOpacity onPress={() => Linking.openURL(venue.website)}>
                <Icon name="globe" size={24} color="#D946EF" />
              </TouchableOpacity>
            )}
            {venue.facebook && (
              <TouchableOpacity onPress={() => Linking.openURL(venue.facebook)}>
                <Icon name="facebook" size={24} color="#D946EF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};
```

---

## 2. 🎸 Jams (Bœufs)

### Description
Gestion des bœufs musicaux (jam sessions ouvertes).

### UI/Wireframe

```
┌─────────────────────────────────────────────────────────┐
│  Bœufs Musicaux                    [➕ Nouveau bœuf]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 🎸 Bœuf Rock │  │ 🎷 Jam Jazz  │  │ 🎤 Open Mic  │  │
│  │              │  │              │  │              │  │
│  │ 📅 15 Mars   │  │ 📅 20 Mars   │  │ 📅 25 Mars   │  │
│  │ ⏰ 20h-23h   │  │ ⏰ 19h-22h   │  │ ⏰ 21h-00h   │  │
│  │              │  │              │  │              │  │
│  │ 👥 3/5       │  │ 👥 5/8       │  │ 👥 2/10      │  │
│  │              │  │              │  │              │  │
│  │ [✏️ Éditer]  │  │ [✏️ Éditer]  │  │ [✏️ Éditer]  │  │
│  │ [🗑️]         │  │ [🗑️]         │  │ [🗑️]         │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Données d'un Jam

| Champ | Type | Exemple |
|-------|------|---------|
| `id` | String | "jam_123" |
| `title` | String | "Bœuf Rock" |
| `date` | Date | "2024-03-15" |
| `start_time` | Time | "20:00" |
| `end_time` | Time | "23:00" |
| `music_styles` | Array | ["Rock", "Blues"] |
| `description` | Text | "Session ouverte..." |
| `max_participants` | Number | 5 |
| `participants` | Array | [{id, name}, ...] |
| `instruments_disponibles` | Array | ["Batterie", "Micro"] |

### Modal Création/Édition

```
┌─────────────────────────────────────────────────────────┐
│  ✕              Nouveau bœuf musical                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Titre                                                  │
│  [Bœuf Rock du vendredi______________]                  │
│                                                          │
│  📅 Date                                                │
│  [15 Mars 2024____] [📅]                                │
│                                                          │
│  ⏰ Heure début        ⏰ Heure fin                      │
│  [20:00] [⏰]         [23:00] [⏰]                       │
│                                                          │
│  🎵 Styles musicaux                                     │
│  ☑️ Rock  ☑️ Blues  ☐ Jazz  ☐ Funk                     │
│                                                          │
│  👥 Nombre max de participants                          │
│  [━━━●━━━] 5                                           │
│                                                          │
│  🎸 Instruments disponibles                             │
│  ☑️ Batterie  ☑️ Basse  ☑️ Guitare électrique           │
│  ☑️ Micro     ☐ Piano                                  │
│                                                          │
│  📝 Description                                         │
│  ┌──────────────────────────────────────┐               │
│  │ Session ouverte à tous, venez jammer │               │
│  │ dans une ambiance conviviale...      │               │
│  └──────────────────────────────────────┘               │
│                                                          │
│  [Annuler]                        [✅ Créer]            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### API Endpoints

```http
GET /api/events?type=jam
POST /api/events
PUT /api/events/{id}
DELETE /api/events/{id}
GET /api/events/{id}/participants
```

### Code React Native

```javascript
const JamsTab = ({ jams, onCreate, onEdit, onDelete }) => {
  if (jams.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Icon name="music" size={64} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>Aucun bœuf</Text>
        <Text style={styles.emptyText}>Créez votre premier bœuf musical</Text>
        <Button title="Nouveau bœuf" onPress={onCreate} />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bœufs Musicaux</Text>
        <Button 
          title="Nouveau bœuf" 
          onPress={onCreate}
          icon="plus"
        />
      </View>
      
      <FlatList
        data={jams}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.jamCard}>
            <Text style={styles.jamTitle}>{item.title || 'Bœuf musical'}</Text>
            
            <View style={styles.jamInfo}>
              <Icon name="calendar" size={16} />
              <Text>{formatDate(item.date)}</Text>
            </View>
            
            <View style={styles.jamInfo}>
              <Icon name="clock" size={16} />
              <Text>{item.start_time} - {item.end_time}</Text>
            </View>
            
            <View style={styles.jamInfo}>
              <Icon name="users" size={16} />
              <Text>{item.participants?.length || 0}/{item.max_participants}</Text>
            </View>
            
            <View style={styles.actions}>
              <Button 
                title="Éditer" 
                onPress={() => onEdit(item)}
                variant="outline"
              />
              <Button 
                icon="trash" 
                onPress={() => onDelete(item.id)}
                variant="destructive"
              />
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};
```

---

## 3. 🎤 Concerts

### Description
Gestion des concerts (événements avec groupe/musicien confirmé).

### Différence avec Jams
- **Concerts** = Événement **fermé** avec musicien/groupe **confirmé**
- **Jams** = Événement **ouvert** avec participation **libre**

### UI (similaire à Jams)

```
┌─────────────────────────────────────────────────────────┐
│  Concerts                          [➕ Nouveau concert]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 🎸 The Rockers│ │ 🎹 Jazz Trio │  │ 🎤 Solo Show │  │
│  │              │  │              │  │              │  │
│  │ 📅 15 Mars   │  │ 📅 22 Mars   │  │ 📅 30 Mars   │  │
│  │ ⏰ 21h-23h   │  │ ⏰ 20h-22h   │  │ ⏰ 19h-21h   │  │
│  │              │  │              │  │              │  │
│  │ 🎫 Entrée 15€│  │ 🎫 Gratuit   │  │ 🎫 10€       │  │
│  │              │  │              │  │              │  │
│  │ ✅ Confirmé  │  │ ✅ Confirmé  │  │ ⏳ En attente│  │
│  │              │  │              │  │              │  │
│  │ [✏️ Éditer]  │  │ [✏️ Éditer]  │  │ [✏️ Éditer]  │  │
│  │ [🗑️]         │  │ [🗑️]         │  │ [🗑️]         │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Données Supplémentaires (vs Jams)

| Champ | Type | Exemple |
|-------|------|---------|
| `artist_name` | String | "The Rockers" |
| `artist_id` | String | "artist_123" (si lié à un musicien) |
| `ticket_price` | Number | 15 (€) |
| `is_free` | Boolean | false |
| `status` | Enum | "confirmed", "pending", "cancelled" |
| `expected_attendees` | Number | 50 |

### Modal Création

```
┌─────────────────────────────────────────────────────────┐
│  ✕              Nouveau concert                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Nom du groupe/artiste *                                │
│  [The Rockers________________________]                  │
│                                                          │
│  📅 Date *                                              │
│  [15 Mars 2024____] [📅]                                │
│                                                          │
│  ⏰ Heure début *      ⏰ Heure fin *                    │
│  [21:00] [⏰]         [23:00] [⏰]                       │
│                                                          │
│  🎵 Styles musicaux *                                   │
│  ☑️ Rock  ☑️ Blues  ☐ Jazz                             │
│                                                          │
│  🎫 Prix d'entrée                                       │
│  ◉ Gratuit   ○ Payant : [15] €                         │
│                                                          │
│  👥 Nombre de spectateurs attendus                      │
│  [50___]                                                │
│                                                          │
│  📝 Description                                         │
│  ┌──────────────────────────────────────┐               │
│  │ Concert Rock avec The Rockers        │               │
│  │ Répertoire: reprises + compos        │               │
│  └──────────────────────────────────────┘               │
│                                                          │
│  [Annuler]                        [✅ Créer]            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 4. 🎤 Karaoké

### Description
Gestion des soirées karaoké.

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Soirées Karaoké                   [➕ Nouveau karaoké] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │ 🎤 Karaoké   │  │ 🎤 80's Night│                     │
│  │    Party     │  │              │                     │
│  │              │  │              │                     │
│  │ 📅 18 Mars   │  │ 📅 25 Mars   │                     │
│  │ ⏰ 21h-02h   │  │ ⏰ 20h-01h   │                     │
│  │              │  │              │                     │
│  │ 🎵 Tous styles│ │ 🎵 80's only │                     │
│  │              │  │              │                     │
│  │ [✏️ Éditer]  │  │ [✏️ Éditer]  │                     │
│  │ [🗑️]         │  │ [🗑️]         │                     │
│  └──────────────┘  └──────────────┘                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Données Spécifiques

| Champ | Type | Exemple |
|-------|------|---------|
| `theme` | String | "80's Night" (optionnel) |
| `equipment_available` | Boolean | true |
| `song_list_url` | URL | "https://..." (optionnel) |

---

## 5. 🎭 Spectacle

### Description
Gestion des spectacles (one-man-show, théâtre musical, etc.).

### UI (similaire aux concerts)

### Données Spécifiques

| Champ | Type | Exemple |
|-------|------|---------|
| `show_type` | String | "One-man-show", "Théâtre musical" |
| `duration` | String | "1h30" |

---

## 6. 📅 Planning

### Description
Vue calendrier consolidée de TOUS les événements (Jams, Concerts, Karaokés, Spectacles).

### UI

```
┌─────────────────────────────────────────────────────────┐
│                    Mars 2024                    [<] [>] │
├─────────────────────────────────────────────────────────┤
│  Lun   Mar   Mer   Jeu   Ven   Sam   Dim               │
├─────────────────────────────────────────────────────────┤
│        │      │      │      │  1    │  2    │  3        │
│        │      │      │      │       │ 🎤    │           │
├────────┼──────┼──────┼──────┼───────┼───────┼───────────┤
│  4     │  5   │  6   │  7   │  8    │  9    │ 10        │
│        │      │      │      │       │ 🎸    │           │
├────────┼──────┼──────┼──────┼───────┼───────┼───────────┤
│  11    │ 12   │ 13   │ 14   │ 15    │ 16    │ 17        │
│        │      │      │      │ 🎤    │       │           │
│        │      │      │      │ 🎸    │       │           │
└─────────────────────────────────────────────────────────┘

Légende :
🎸 = Jam Session (Vert)
🎤 = Concert (Rouge)
🎤 = Karaoké (Violet)
🎭 = Spectacle (Orange)
```

**Voir README_PLANNING_SYSTEM.md pour les détails complets**

---

## 7. 📬 Candidatures

### Description
Envoyer des invitations/candidatures aux musiciens.

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Inviter des musiciens                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🔍 Rechercher                                          │
│  [Nom, ville, styles...________________] [🔍]           │
│                                                          │
│  Filtres : [Styles ▼] [Ville ▼] [Disponibilité ▼]      │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 👤 John Doe                    [✉️ Inviter]     │    │
│  │ 🎸 Guitariste • Paris                            │    │
│  │ 🎵 Rock, Blues, Jazz                             │    │
│  │ ⭐⭐⭐⭐⭐ (4.8)                                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 👤 Jane Smith                  [✉️ Inviter]     │    │
│  │ 🎹 Pianiste • Lyon                               │    │
│  │ 🎵 Jazz, Soul, Funk                              │    │
│  │ ⭐⭐⭐⭐ (4.2)                                    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Modal Invitation

```
┌─────────────────────────────────────────────────────────┐
│  ✕         Inviter John Doe                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Type d'événement *                                     │
│  ○ Concert  ○ Jam  ○ Karaoké  ◉ Spectacle              │
│                                                          │
│  📅 Date proposée *                                     │
│  [15 Mars 2024____] [📅]                                │
│                                                          │
│  ⏰ Heure                                               │
│  [21:00] - [23:00]                                      │
│                                                          │
│  💰 Rémunération proposée                               │
│  [150] €                                                │
│                                                          │
│  📝 Message personnalisé                                │
│  ┌──────────────────────────────────────┐               │
│  │ Bonjour John,                        │               │
│  │ Nous aimerions vous inviter pour...  │               │
│  └──────────────────────────────────────┘               │
│                                                          │
│  [Annuler]                        [📤 Envoyer]          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### API Endpoints

```http
GET /api/musicians?search=...&styles=...
POST /api/applications
```

---

## 8. 👥 Jacks (Abonnés)

### Description
Liste des utilisateurs (musiciens/mélomanes) abonnés à l'établissement.

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Mes abonnés (Jacks) - 42 personnes                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 👤 John Doe                    [💬] [✉️]        │    │
│  │ 🎸 Musicien • Paris                              │    │
│  │ 📅 Abonné depuis le 10 Fév 2024                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 👤 Marie Martin                [💬] [✉️]        │    │
│  │ 🎵 Mélomane • Lyon                               │    │
│  │ 📅 Abonné depuis le 15 Jan 2024                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Actions

- 💬 **Envoyer message** : Ouvre la messagerie
- ✉️ **Inviter à un événement** : Ouvre modal d'invitation

### API Endpoints

```http
GET /api/venues/me/subscribers
```

---

## 9. 🔔 Notifications

### Description
Historique des notifications reçues.

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Notifications                          [✓ Tout marquer lu]
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Aujourd'hui                                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🔵 Nouveau message de John Doe                   │    │
│  │ Il y a 5 minutes                            [×]  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ✅ Candidature acceptée par Jane Smith           │    │
│  │ Il y a 2 heures                             [×]  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Hier                                                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 📅 Rappel : Concert demain 20h                   │    │
│  │ Il y a 1 jour                               [×]  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 10. 📜 History (Historique)

### Description
Liste des événements passés.

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Historique des événements                              │
│  [Filtrer par mois ▼] [Type ▼]                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Mars 2024                                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🎤 Concert - The Rockers                         │    │
│  │ 📅 15 Mars • ⏰ 21h-23h                          │    │
│  │ 👥 85 spectateurs                                │    │
│  │ ⭐⭐⭐⭐⭐ (4.9) - 12 avis                        │    │
│  │ [👁️ Voir détails]                                │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🎸 Jam Session Rock                              │    │
│  │ 📅 08 Mars • ⏰ 20h-23h                          │    │
│  │ 👥 5/5 participants                              │    │
│  │ [👁️ Voir détails]                                │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 11. 💼 Accounting (Comptabilité)

### Description
Gestion comptable GUSO (Guichet Unique du Spectacle Occasionnel).

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Comptabilité GUSO                                      │
│  [Exporter PDF ↓]                                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📊 Résumé                                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Total dépensé ce mois : 1 250 €                  │    │
│  │ Nombre de concerts GUSO : 8                      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  📋 Liste des concerts GUSO                             │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 15 Mars • The Rockers                            │    │
│  │ Montant : 150 €                                  │    │
│  │ Statut : ✅ Déclaré                              │    │
│  │ [📄 Facture] [✏️ Modifier]                       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 12. ⭐ Reviews (Avis)

### Description
Avis laissés par les musiciens/mélomanes.

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Avis clients - Note moyenne : ⭐ 4.7/5 (24 avis)       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 👤 John Doe                  ⭐⭐⭐⭐⭐            │    │
│  │ Musicien • Il y a 2 jours                        │    │
│  │                                                   │    │
│  │ "Super ambiance, très bon accueil. Le son est    │    │
│  │  nickel et le public au rendez-vous !"           │    │
│  │                                                   │    │
│  │ [💬 Répondre]                                     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 👤 Marie Martin              ⭐⭐⭐⭐              │    │
│  │ Mélomane • Il y a 1 semaine                      │    │
│  │                                                   │    │
│  │ "Très bonne programmation, dommage que le bar    │    │
│  │  soit un peu cher."                              │    │
│  │                                                   │    │
│  │ [💬 Répondre]                                     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 13. 🎸 Bands (Groupes)

### Description
Liste des groupes musicaux ayant joué dans l'établissement.

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Groupes & Artistes                                     │
│  [Rechercher..._______________] [🔍]                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🎸 The Rockers                                   │    │
│  │ Rock • Paris                                     │    │
│  │ 🎤 Concerts joués : 5                            │    │
│  │ ⭐⭐⭐⭐⭐ (4.9)                                  │    │
│  │ [👁️ Voir profil] [✉️ Inviter]                   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 14. 📸 Gallery (Galerie)

### Description
Galerie photos de l'établissement.

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Galerie photos                     [📷 Ajouter photo]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │  [IMG]  │ │  [IMG]  │ │  [IMG]  │ │  [IMG]  │       │
│  │   [×]   │ │   [×]   │ │   [×]   │ │   [×]   │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│                                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                    │
│  │  [IMG]  │ │  [IMG]  │ │  [IMG]  │                    │
│  │   [×]   │ │   [×]   │ │   [×]   │                    │
│  └─────────┘ └─────────┘ └─────────┘                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 15. ⚙️ Settings (Paramètres)

### Description
Paramètres du compte.

### UI

```
┌─────────────────────────────────────────────────────────┐
│  Paramètres                                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🔐 Sécurité                                            │
│  [Changer mot de passe]                                 │
│                                                          │
│  🔔 Notifications                                       │
│  ☑️ Notifications push                                  │
│  ☑️ Emails                                              │
│  ☐ SMS                                                  │
│                                                          │
│  👁️ Visibilité                                          │
│  ◉ Profil public  ○ Profil privé                       │
│                                                          │
│  🗑️ Zone dangereuse                                     │
│  [Supprimer mon compte]                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Résumé pour l'Agent Mobile

### Checklist d'Implémentation

```
✅ Tab 1 : Profil
 ☐ Affichage lecture seule
 ☐ Modal édition complète
 ☐ Upload photo

✅ Tab 2-5 : Événements (Jams, Concerts, Karaoké, Spectacle)
 ☐ Liste en grille
 ☐ Modal création
 ☐ Modal édition
 ☐ Suppression avec confirmation

✅ Tab 6 : Planning
 ☐ Calendrier react-native-calendars
 ☐ Couleurs par type
 ☐ Voir README_PLANNING_SYSTEM.md

✅ Tab 7 : Candidatures
 ☐ Recherche musiciens
 ☐ Filtres
 ☐ Modal invitation

✅ Tab 8 : Jacks
 ☐ Liste abonnés
 ☐ Actions (message, inviter)

✅ Tab 9 : Notifications
 ☐ Liste historique
 ☐ Marquer comme lu

✅ Tab 10 : History
 ☐ Liste événements passés
 ☐ Filtres

✅ Tab 11 : Accounting
 ☐ Tableau concerts GUSO
 ☐ Export PDF

✅ Tab 12 : Reviews
 ☐ Liste avis
 ☐ Répondre

✅ Tab 13 : Bands
 ☐ Liste groupes
 ☐ Profils

✅ Tab 14 : Gallery
 ☐ Grille photos
 ☐ Upload/Supprimer

✅ Tab 15 : Settings
 ☐ Changement mot de passe
 ☐ Notifications toggle
 ☐ Suppression compte
```

---

<div align="center">

**Guide complet des 15 onglets du Dashboard Établissement** ✅

</div>
