# 📡 API Jam Connexion - Documentation Synchronisation

**Date de mise à jour** : 21 avril 2026  
**Version API** : v2.1  
**Destinataires** : Équipe Mobile, Équipe Backend, Développeurs externes

---

## 🆕 NOUVEAUTÉS API - Préférences de Notifications

### Vue d'ensemble

Système de préférences de notifications pour les établissements permettant de contrôler les types de notifications reçues. Les notifications ne sont plus envoyées systématiquement, mais respectent désormais les préférences utilisateur.

---

## 📍 Nouveaux Endpoints

### 1. GET - Récupérer les préférences de notifications

```http
GET /api/venues/me/notification-preferences
Authorization: Bearer {token}
```

#### Réponse (200 OK)

```json
{
  "notification_preferences": {
    "new_participants": true,
    "new_applications": true,
    "application_cancellation": true,
    "new_messages": true,
    "new_followers": true
  }
}
```

#### Valeurs par défaut

Si l'établissement n'a jamais configuré ses préférences, **toutes sont activées par défaut** :

```json
{
  "new_participants": true,
  "new_applications": true,
  "application_cancellation": true,
  "new_messages": true,
  "new_followers": true
}
```

#### Codes de réponse

| Code | Description |
|------|-------------|
| `200` | Préférences récupérées avec succès |
| `401` | Token manquant ou invalide |
| `403` | Accès refusé (utilisateur n'est pas un établissement) |
| `404` | Établissement non trouvé |

---

### 2. PUT - Mettre à jour les préférences de notifications

```http
PUT /api/venues/me/notification-preferences
Authorization: Bearer {token}
Content-Type: application/json
```

#### Body (JSON)

```json
{
  "new_participants": false,
  "new_applications": true,
  "application_cancellation": true,
  "new_messages": false,
  "new_followers": true
}
```

**Note** : Vous pouvez envoyer uniquement les clés que vous souhaitez modifier. Les clés non envoyées ne seront pas modifiées.

#### Réponse (200 OK)

```json
{
  "message": "Préférences de notifications mises à jour",
  "notification_preferences": {
    "new_participants": false,
    "new_applications": true,
    "application_cancellation": true,
    "new_messages": false,
    "new_followers": true
  }
}
```

#### Codes de réponse

| Code | Description |
|------|-------------|
| `200` | Préférences mises à jour avec succès |
| `401` | Token manquant ou invalide |
| `403` | Accès refusé (utilisateur n'est pas un établissement) |
| `404` | Établissement non trouvé |

---

## 📋 Types de Notifications & Mapping

| Clé de préférence | Description | Déclencheur | Fichier Backend |
|-------------------|-------------|-------------|-----------------|
| `new_participants` | Nouveaux participants à un événement | Un utilisateur (mélomane/musicien) marque sa participation | `events.py` |
| `new_applications` | Candidatures reçues | Un musicien postule à un créneau de planning | `websocket.py` + `planning.py` |
| `application_cancellation` | Annulation de candidature | Un musicien annule sa candidature en attente | `planning.py` |
| `new_messages` | Messages reçus | Réception d'un nouveau message | `messages.py` |
| `new_followers` | Nouveaux abonnés (Jacks) | Un utilisateur suit l'établissement | `websocket.py` + `venues.py` |

---

## 🔄 Changements de Comportement

### Avant (v2.0)

```python
# Notifications envoyées SYSTÉMATIQUEMENT
await db.notifications.insert_one(notification)
```

### Après (v2.1)

```python
# Vérification des préférences AVANT envoi
from utils.notification_preferences import should_send_notification

should_notify = await should_send_notification(
    venue["user_id"],
    "new_applications",  # Type de notification
    "venue"
)

if should_notify:
    await db.notifications.insert_one(notification)
else:
    logger.info("Notification skipped (preference disabled)")
```

---

## 🗄️ Structure MongoDB

### Collection `venues`

Nouveau champ ajouté :

```javascript
{
  "id": "venue_123",
  "name": "Le Bar Jazz",
  "user_id": "user_456",
  // ... autres champs existants ...
  
  // NOUVEAU
  "notification_preferences": {
    "new_participants": true,
    "new_applications": true,
    "application_cancellation": true,
    "new_messages": true,
    "new_followers": true
  }
}
```

**Type** : `Object` (optionnel)  
**Par défaut** : Non défini (toutes les notifications activées)

---

## 🔐 Authentification & Permissions

### Restrictions

- ✅ **Établissements uniquement** : Ces endpoints ne sont accessibles qu'aux utilisateurs avec `role: "venue"`
- ❌ **Musiciens** : Retourne `403 Forbidden`
- ❌ **Mélomanes** : Retourne `403 Forbidden`

### Vérification du token

```javascript
// Exemple JavaScript/TypeScript
const token = localStorage.getItem('token');

const response = await fetch(
  'https://jamconnexion.com/api/venues/me/notification-preferences',
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

if (response.status === 403) {
  console.error('Accès refusé : utilisateur non autorisé');
}
```

---

## 📱 Exemples d'Intégration Mobile

### React Native - Récupérer les préférences

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const fetchNotificationPreferences = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const API_URL = 'https://jamconnexion.com/api';
    
    const response = await fetch(
      `${API_URL}/venues/me/notification-preferences`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.notification_preferences;
    
  } catch (error) {
    console.error('Error fetching preferences:', error);
    // Retourner valeurs par défaut en cas d'erreur
    return {
      new_participants: true,
      new_applications: true,
      application_cancellation: true,
      new_messages: true,
      new_followers: true
    };
  }
};
```

### React Native - Mettre à jour les préférences

```javascript
const updateNotificationPreferences = async (preferences) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const API_URL = 'https://jamconnexion.com/api';
    
    const response = await fetch(
      `${API_URL}/venues/me/notification-preferences`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Préférences mises à jour:', data.message);
    return data.notification_preferences;
    
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
};

// Utilisation
await updateNotificationPreferences({
  new_messages: false,  // Désactiver les notifications de messages
  new_applications: true  // Garder les candidatures
});
```

### React Native - UI avec Switches

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, ActivityIndicator } from 'react-native';

const NotificationPreferencesScreen = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    new_participants: true,
    new_applications: true,
    application_cancellation: true,
    new_messages: true,
    new_followers: true
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const prefs = await fetchNotificationPreferences();
    setPreferences(prefs);
    setLoading(false);
  };

  const handleToggle = async (key) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key]
    };
    
    setPreferences(newPreferences);
    setSaving(true);

    try {
      await updateNotificationPreferences(newPreferences);
    } catch (error) {
      // Revert on error
      setPreferences(preferences);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ActivityIndicator />;
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        Préférences de notifications
      </Text>

      <View style={{ marginBottom: 15 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text>Nouveaux participants</Text>
          <Switch
            value={preferences.new_participants}
            onValueChange={() => handleToggle('new_participants')}
            disabled={saving}
          />
        </View>
      </View>

      <View style={{ marginBottom: 15 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text>Candidatures reçues</Text>
          <Switch
            value={preferences.new_applications}
            onValueChange={() => handleToggle('new_applications')}
            disabled={saving}
          />
        </View>
      </View>

      <View style={{ marginBottom: 15 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text>Annulation de candidature</Text>
          <Switch
            value={preferences.application_cancellation}
            onValueChange={() => handleToggle('application_cancellation')}
            disabled={saving}
          />
        </View>
      </View>

      <View style={{ marginBottom: 15 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text>Messages</Text>
          <Switch
            value={preferences.new_messages}
            onValueChange={() => handleToggle('new_messages')}
            disabled={saving}
          />
        </View>
      </View>

      <View style={{ marginBottom: 15 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text>Nouveaux abonnés</Text>
          <Switch
            value={preferences.new_followers}
            onValueChange={() => handleToggle('new_followers')}
            disabled={saving}
          />
        </View>
      </View>

      {saving && <ActivityIndicator style={{ marginTop: 10 }} />}
    </View>
  );
};

export default NotificationPreferencesScreen;
```

---

## 🧪 Tests & Validation

### Test 1 : Récupération des préférences

```bash
curl -X GET \
  'https://jamconnexion.com/api/venues/me/notification-preferences' \
  -H 'Authorization: Bearer YOUR_VENUE_TOKEN'
```

**Réponse attendue** : `200 OK` avec objet `notification_preferences`

---

### Test 2 : Mise à jour des préférences

```bash
curl -X PUT \
  'https://jamconnexion.com/api/venues/me/notification-preferences' \
  -H 'Authorization: Bearer YOUR_VENUE_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "new_participants": false,
    "new_applications": true,
    "application_cancellation": true,
    "new_messages": false,
    "new_followers": true
  }'
```

**Réponse attendue** : `200 OK` avec message de confirmation

---

### Test 3 : Vérification du comportement

1. Désactiver `new_applications` via l'API
2. Faire postuler un musicien à un créneau
3. **Résultat attendu** : Aucune notification créée dans la collection `notifications`
4. **Log backend** : `"Notification skipped for venue xxx (new_applications disabled)"`

---

## 🔍 Débogage & Logs

### Logs Backend (FastAPI)

Les notifications ignorées sont loggées :

```
INFO: ✓ Notification sent to venue user_456 for participation in event event_789
INFO: Notification skipped for venue user_123 (new_participants disabled)
INFO: Notification skipped for venue user_456 (new_messages disabled)
```

### Vérifier les préférences en base

```javascript
// MongoDB Query
db.venues.findOne(
  { user_id: "user_123" },
  { notification_preferences: 1 }
)
```

---

## ⚠️ Points d'Attention

### 1. Rétrocompatibilité

Les établissements existants **sans préférences configurées** reçoivent toutes les notifications (comportement par défaut).

### 2. Types de notifications non couverts

Les préférences ne s'appliquent **QUE** aux 5 types listés. Les autres notifications (badges, rappels d'événements, etc.) sont **toujours envoyées**.

### 3. Permissions

Seuls les **établissements** peuvent accéder à ces endpoints. Les musiciens et mélomanes recevront un `403 Forbidden`.

### 4. WebSocket vs Database

Les préférences s'appliquent aux deux :
- ✅ Notifications WebSocket temps réel (via `websocket.py`)
- ✅ Notifications en base de données (via `db.notifications.insert_one()`)

---

## 🚀 Roadmap Future

### Version 2.2 (Prochainement)

- [ ] Préférences de notifications pour musiciens
- [ ] Préférences de notifications pour mélomanes
- [ ] Configuration des notifications email
- [ ] Horaires "Ne pas déranger"

### Version 2.3

- [ ] Groupement de notifications (digest quotidien)
- [ ] Notifications push mobile avec préférences granulaires
- [ ] Statistiques sur les notifications envoyées/ignorées

---

## 📞 Support

Pour toute question sur l'intégration API :

- **Documentation complète** : `/app/memory/PRD.md`
- **Tests credentials** : `/app/memory/test_credentials.md`
- **Backend code** : 
  - `/app/backend/routes/venues.py` (lignes 1736-1821)
  - `/app/backend/utils/notification_preferences.py`

---

## ✅ Checklist d'Intégration Mobile

- [ ] Implémenter `GET /api/venues/me/notification-preferences`
- [ ] Implémenter `PUT /api/venues/me/notification-preferences`
- [ ] Créer l'écran UI avec switches
- [ ] Gérer les états de chargement
- [ ] Gérer les erreurs réseau
- [ ] Tester avec un compte établissement
- [ ] Vérifier que les préférences persistent après refresh
- [ ] Tester le comportement avec notifications désactivées

---

**Dernière mise à jour** : 21 avril 2026  
**Version** : 2.1  
**Auteur** : Équipe Backend Jam Connexion
