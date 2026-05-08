# 🔔 Guide d'implémentation des Notifications Temps Réel (Mobile)

## 📋 Vue d'ensemble

Le backend Jam Connexion implémente un système complet de **notifications temps réel** via **Socket.IO** (WebSocket). Ce document détaille tout ce que l'application mobile doit implémenter pour recevoir et afficher ces notifications.

---

## 🏗️ Architecture

### Backend (✅ Déjà implémenté)
- **Protocole** : Socket.IO (WebSocket avec fallback HTTP polling)
- **URL** : `https://jamconnexion.com/api/socket.io`
- **Authentification** : JWT Token dans l'objet `auth`
- **Serveur** : Compatible Cloudflare proxy, reconnexion automatique

### Mobile (⚠️ À implémenter)
- **Librairie recommandée** : `socket.io-client` pour React Native / Flutter
- **Gestion** : Connexion, déconnexion, notifications push locales
- **UI** : Toasts, badges, notifications in-app

---

## 🔌 Connexion WebSocket

### 1. Installation de la librairie

**React Native :**
```bash
npm install socket.io-client
# ou
yarn add socket.io-client
```

**Flutter :**
```bash
flutter pub add socket_io_client
```

### 2. Configuration de la connexion

**React Native (JavaScript/TypeScript) :**
```javascript
import io from 'socket.io-client';

const BACKEND_URL = 'https://jamconnexion.com';
const SOCKET_PATH = '/api/socket.io';

// Connexion avec authentification JWT
const socket = io(BACKEND_URL, {
  path: SOCKET_PATH,
  auth: {
    token: userJwtToken  // ⚠️ IMPORTANT: Votre JWT token
  },
  transports: ['websocket', 'polling'],  // WebSocket + fallback
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

// Événements de connexion
socket.on('connect', () => {
  console.log('✅ WebSocket connecté');
});

socket.on('disconnect', (reason) => {
  console.log('❌ WebSocket déconnecté:', reason);
  if (reason === 'io server disconnect') {
    // Le serveur a forcé la déconnexion
    socket.connect();
  }
});

socket.on('connect_error', (error) => {
  console.error('❌ Erreur de connexion:', error.message);
  // Gérer l'expiration du token, demander un refresh
});
```

**Flutter (Dart) :**
```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

IO.Socket socket = IO.io('https://jamconnexion.com', 
  IO.OptionBuilder()
    .setPath('/api/socket.io')
    .setAuth({'token': userJwtToken})
    .setTransports(['websocket', 'polling'])
    .enableReconnection()
    .setReconnectionAttempts(999999)
    .setReconnectionDelay(1000)
    .setReconnectionDelayMax(5000)
    .build()
);

socket.onConnect((_) {
  print('✅ WebSocket connecté');
});

socket.onDisconnect((_) {
  print('❌ WebSocket déconnecté');
});

socket.onConnectError((data) {
  print('❌ Erreur de connexion: $data');
});
```

---

## 📨 Types de Notifications (9 types)

Toutes les notifications sont reçues via l'événement `notification` :

```javascript
socket.on('notification', (data) => {
  const { notification_type, data: payload } = data;
  
  // Gérer selon le type
  handleNotification(notification_type, payload);
});
```

### 1️⃣ Nouveau Message (`new_message`)

**Quand ?** Un utilisateur envoie un message dans une conversation  
**Destinataire** : L'autre participant de la conversation  

```json
{
  "notification_type": "new_message",
  "data": {
    "from_name": "GuitaristeTest",
    "from_id": "user_123",
    "message_preview": "Salut ! On répète demain ?",
    "conversation_id": "conv_456",
    "action_url": "/messages"
  }
}
```

**Action mobile :**
- Afficher une notification push : "💬 Nouveau message de GuitaristeTest"
- Mettre à jour le badge de l'onglet Messages
- Rediriger vers `/messages` au tap

---

### 2️⃣ Nouvelle Candidature (`new_application`)

**Quand ?** Un musicien postule à une offre/slot  
**Destinataire** : L'établissement propriétaire de l'offre  

```json
{
  "notification_type": "new_application",
  "data": {
    "musician_name": "Les Rockeurs",
    "event_name": "Créneau du 2026-05-15",
    "application_id": "app_789",
    "action_url": "/venue-dashboard"
  }
}
```

**Action mobile :**
- Afficher : "📝 Les Rockeurs a postulé pour Créneau du 2026-05-15"
- Badge sur l'onglet Planning/Candidatures
- Rediriger vers la liste des candidatures

---

### 3️⃣ Candidature Acceptée (`application_status` avec `status: "accepted"`)

**Quand ?** Un établissement accepte une candidature  
**Destinataire** : Le musicien qui a postulé  

```json
{
  "notification_type": "application_status",
  "data": {
    "status": "accepted",
    "event_name": "Créneau du 2026-05-15",
    "venue_name": "Le Refuge Solidaire",
    "action_url": "/musician-dashboard"
  }
}
```

**Action mobile :**
- Afficher : "✅ Candidature acceptée pour Créneau du 2026-05-15 chez Le Refuge Solidaire"
- Son de célébration 🎉
- Rediriger vers le calendrier des concerts confirmés

---

### 4️⃣ Candidature Refusée (`application_status` avec `status: "rejected"`)

**Quand ?** Un établissement refuse une candidature  
**Destinataire** : Le musicien qui a postulé  

```json
{
  "notification_type": "application_status",
  "data": {
    "status": "rejected",
    "event_name": "Créneau du 2026-05-15",
    "venue_name": "Le Refuge Solidaire",
    "action_url": "/musician-dashboard"
  }
}
```

**Action mobile :**
- Afficher : "❌ Candidature non retenue pour Créneau du 2026-05-15"
- Ne pas sonner (notification discrète)

---

### 5️⃣ Nouvel Abonné (`new_subscriber`)

**Quand ?** Un musicien/mélomane s'abonne à un établissement  
**Destinataire** : L'établissement  

```json
{
  "notification_type": "new_subscriber",
  "data": {
    "subscriber_name": "GuitaristeTest",
    "subscriber_role": "musician",
    "action_url": "/venue-dashboard"
  }
}
```

**Action mobile :**
- Afficher : "🔔 GuitaristeTest s'est abonné à votre établissement"
- Badge sur l'onglet Abonnés

---

### 6️⃣ Badge Débloqué (`badge_unlocked`)

**Quand ?** Un utilisateur débloque un nouveau badge/achievement  
**Destinataire** : L'utilisateur concerné  

```json
{
  "notification_type": "badge_unlocked",
  "data": {
    "badge_name": "Première Scène",
    "badge_description": "Vous avez joué votre premier concert !",
    "action_url": "/musician-dashboard"
  }
}
```

**Action mobile :**
- Afficher une notification spéciale : "🏆 Badge débloqué : Première Scène"
- Animation de célébration dans l'app
- Afficher une modale avec le badge

---

### 7️⃣ Nouvelle Offre Disponible (`new_slot_available`) - PRO uniquement

**Quand ?** Un établissement publie une nouvelle offre/créneau  
**Destinataire** : Musiciens PRO abonnés à cet établissement  

```json
{
  "notification_type": "new_slot_available",
  "data": {
    "venue_name": "Le Refuge Solidaire",
    "slot_date": "2026-05-20",
    "slot_id": "slot_123",
    "action_url": "/musician-dashboard"
  }
}
```

**Action mobile :**
- Afficher : "📅 Nouvelle offre chez Le Refuge Solidaire le 2026-05-20"
- Badge PRO sur la notification
- Rediriger vers la carte/offres disponibles

---

### 8️⃣ Nouveau Jam Créé (`event` de type `new_event_created`)

**Quand ?** Un établissement crée un nouveau boeuf musical  
**Destinataire** : Tous les utilisateurs connectés (broadcast)  

```json
{
  "type": "event",
  "event_type": "new_event_created",
  "data": {
    "type": "jam",
    "venue_name": "Le Refuge Solidaire",
    "city": "Paris",
    "date": "2026-05-25",
    "music_styles": ["Jazz", "Blues"]
  }
}
```

**Action mobile :**
- Afficher discrètement : "🎤 Nouveau boeuf musical chez Le Refuge Solidaire"
- Option : Mettre à jour la liste des événements en arrière-plan
- Notification silencieuse (pas de son)

---

### 9️⃣ Nouveau Concert Créé (`event` de type `new_event_created`)

**Quand ?** Un établissement crée un nouveau concert  
**Destinataire** : Tous les utilisateurs connectés (broadcast)  

```json
{
  "type": "event",
  "event_type": "new_event_created",
  "data": {
    "type": "concert",
    "venue_name": "Le Refuge Solidaire",
    "city": "Paris",
    "date": "2026-06-01",
    "music_styles": ["Rock", "Pop"]
  }
}
```

**Action mobile :**
- Afficher discrètement : "🎸 Nouveau concert chez Le Refuge Solidaire"
- Rafraîchir automatiquement la liste des événements

---

## 🔧 Implémentation Recommandée

### 1. Service de Notification (Singleton)

**React Native :**
```javascript
// services/NotificationService.js
import io from 'socket.io-client';
import { showNotification } from './LocalNotifications';

class NotificationService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket?.connected) return;

    this.socket = io('https://jamconnexion.com', {
      path: '/api/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('✅ Notifications activées');
    });

    this.socket.on('notification', (data) => {
      this.handleNotification(data);
    });

    this.socket.on('event', (data) => {
      this.handleEvent(data);
    });
  }

  handleNotification(data) {
    const { notification_type, data: payload } = data;

    // Mapper les types vers des messages user-friendly
    const messages = {
      'new_message': `💬 ${payload.from_name} vous a envoyé un message`,
      'new_application': `📝 ${payload.musician_name} a postulé`,
      'application_status': payload.status === 'accepted'
        ? `✅ Candidature acceptée chez ${payload.venue_name}`
        : `❌ Candidature non retenue`,
      'new_subscriber': `🔔 ${payload.subscriber_name} s'est abonné`,
      'badge_unlocked': `🏆 Badge : ${payload.badge_name}`,
      'new_slot_available': `📅 Nouvelle offre chez ${payload.venue_name}`,
    };

    const message = messages[notification_type] || 'Nouvelle notification';

    // Afficher notification locale
    showNotification({
      title: 'Jam Connexion',
      body: message,
      data: payload,
    });

    // Mettre à jour les badges UI
    this.updateBadges(notification_type);
  }

  handleEvent(data) {
    const { event_type, data: payload } = data;

    if (event_type === 'new_event_created') {
      // Rafraîchir silencieusement la liste des événements
      // EventsStore.refresh();
    }
  }

  updateBadges(type) {
    // Incrémenter les compteurs de badges UI
    // Ex: badge sur l'icône Messages, Planning, etc.
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }
}

export default new NotificationService();
```

### 2. Utilisation dans l'App

```javascript
// App.js
import NotificationService from './services/NotificationService';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      // Connexion au WebSocket
      NotificationService.connect(token);

      return () => {
        NotificationService.disconnect();
      };
    }
  }, [isAuthenticated, token]);

  return <RootNavigator />;
}
```

---

## 📡 Endpoints REST Complémentaires

En plus du WebSocket, l'API fournit des endpoints REST pour la gestion des notifications :

### GET `/api/notifications`
Récupérer l'historique des notifications (pagination)

**Headers :**
```
Authorization: Bearer <JWT_TOKEN>
```

**Réponse :**
```json
[
  {
    "id": "notif_123",
    "recipient_id": "user_456",
    "type": "new_application",
    "title": "Nouvelle candidature",
    "message": "Les Rockeurs a postulé",
    "read": false,
    "created_at": "2026-04-14T10:30:00Z",
    "action_url": "/venue-dashboard"
  }
]
```

### GET `/api/notifications/unread/count`
Compter les notifications non lues

**Réponse :**
```json
{
  "count": 5
}
```

### PUT `/api/notifications/{notification_id}/read`
Marquer une notification comme lue

### PUT `/api/notifications/read-all`
Marquer toutes les notifications comme lues

---

## ✅ Checklist d'implémentation

### Phase 1 : WebSocket de base
- [ ] Installer `socket.io-client`
- [ ] Créer `NotificationService.js`
- [ ] Implémenter la connexion avec JWT
- [ ] Tester la connexion/déconnexion
- [ ] Gérer les erreurs (token expiré, etc.)

### Phase 2 : Notifications locales
- [ ] Configurer les notifications push locales (iOS/Android)
- [ ] Implémenter `showNotification()` pour chaque type
- [ ] Tester chaque type de notification

### Phase 3 : UI & UX
- [ ] Badge compteur sur l'icône Messages
- [ ] Badge compteur sur l'icône Planning
- [ ] Liste des notifications in-app
- [ ] Marquer comme lu au tap
- [ ] Sons de notification personnalisés

### Phase 4 : Optimisations
- [ ] Gérer la reconnexion après perte de réseau
- [ ] Throttle des notifications (éviter spam)
- [ ] Cache des notifications reçues
- [ ] Synchronisation avec le backend au retour en foreground

---

## 🐛 Troubleshooting

### Problème : "connect_error: token invalid"
**Solution :** Vérifiez que le JWT est valide et non expiré. Implémentez un refresh token.

### Problème : "WebSocket ne se connecte jamais"
**Solution :** Vérifiez le path `/api/socket.io` et que `transports: ['websocket', 'polling']` est bien défini.

### Problème : "Notifications en double"
**Solution :** Assurez-vous de déconnecter le socket lors du démontage du composant.

### Problème : "Token expiré pendant la connexion"
**Solution :** Interceptez `connect_error`, rafraîchissez le token, puis reconnectez.

---

## 📞 Support

Pour toute question sur l'implémentation :
- **Backend** : Jam Connexion API (voir `API_DOCUMENTATION.md`)
- **WebSocket** : Socket.IO documentation officielle
- **Mobile** : Ce guide + tests avec Postman/curl

---

## 🎯 Résumé

**Backend** : ✅ Complet (9 types de notifications)  
**Mobile** : ⚠️ À implémenter selon ce guide  
**Protocole** : Socket.IO (WebSocket)  
**Authentification** : JWT Token  
**Priorité** : Messages > Candidatures > Badges > Events  

**Bon développement ! 🚀**
