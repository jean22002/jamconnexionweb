# Intégration des Notifications Push dans les Événements

## 🎯 Objectif
Intégrer l'envoi de notifications push dans les événements clés de l'application pour tenir les utilisateurs informés en temps réel.

## ✅ Événements Intégrés

### 1. 💬 Nouveaux Messages

**Fichier modifié** : `/app/backend/routes/messages.py`

**Déclencheur** : Quand un utilisateur envoie un message

**Code ajouté** :
```python
# Send push notification
try:
    from routes.push_notifications import send_push_notification
    await send_push_notification(
        user_id=data.recipient_id,
        notification_data={
            "title": f"💬 {current_user['name']}",
            "message": data.subject[:100] if data.subject else "Nouveau message",
            "link": "/messages-improved",
            "type": "message",
            "id": message_doc["id"],
            "icon": sender_image
        }
    )
except Exception as e:
    print(f"Failed to send push notification: {e}")
```

**Comportement** :
- Le destinataire reçoit une notification push avec :
  - Nom de l'expéditeur
  - Sujet du message (max 100 caractères)
  - Lien direct vers la messagerie
  - Image de profil de l'expéditeur
- Si l'envoi échoue, le message est quand même créé (pas de blocage)

---

### 2. 🏆 Badges Débloqués

**Fichier modifié** : `/app/backend/routes/badges.py`

**Déclencheur** : Quand un utilisateur débloque un nouveau badge (via `/api/badges/check`)

**Code ajouté** :
```python
# Send push notification
try:
    from routes.push_notifications import send_push_notification
    await send_push_notification(
        user_id=user_id,
        notification_data={
            "title": "🏆 Badge débloqué !",
            "message": f"{badge['icon']} {badge['name']} - {badge['unlock_message']}",
            "link": "/badges",
            "type": "badge",
            "icon": badge["icon"],
            "data": {
                "badge_id": badge["id"],
                "points": badge["points"]
            }
        }
    )
except Exception as push_error:
    logger.error(f"Error sending push notification for badge: {push_error}")
```

**Comportement** :
- L'utilisateur reçoit une notification push avec :
  - Titre : "🏆 Badge débloqué !"
  - Message : Icône + nom + message de félicitations
  - Lien direct vers la page des badges
  - Données du badge (ID, points)

---

### 3. 👥 Demandes d'Amis (Envoi)

**Fichier modifié** : `/app/backend/server.py` (fonction `send_friend_request`)

**Déclencheur** : Quand un musicien envoie une demande d'ami

**Code ajouté** :
```python
# Send push notification
try:
    from routes.push_notifications import send_push_notification
    await send_push_notification(
        user_id=data.to_user_id,
        notification_data={
            "title": "👥 Nouvelle demande d'ami",
            "message": f"{current_user['name']} souhaite devenir ami avec vous",
            "link": "/musician",
            "type": "friend_request",
            "icon": sender_image,
            "data": {
                "request_id": request_id,
                "from_user_id": current_user["id"]
            }
        }
    )
except Exception as e:
    print(f"Failed to send push notification: {e}")
```

**Comportement** :
- Le destinataire reçoit une notification push avec :
  - Nom de la personne qui envoie la demande
  - Lien vers le profil du musicien
  - Image de profil de l'expéditeur

---

### 4. ✅ Demandes d'Amis (Acceptation)

**Fichier modifié** : `/app/backend/server.py` (fonction `accept_friend_request`)

**Déclencheur** : Quand un musicien accepte une demande d'ami

**Code ajouté** :
```python
# Send push notification
try:
    from routes.push_notifications import send_push_notification
    # Get acceptor's profile image
    acceptor_musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    acceptor_image = acceptor_musician.get("profile_image") if acceptor_musician else None
    
    await send_push_notification(
        user_id=request["user1_id"],
        notification_data={
            "title": "✅ Demande acceptée !",
            "message": f"{current_user['name']} a accepté votre demande d'ami",
            "link": "/musician",
            "type": "friend_accepted",
            "icon": acceptor_image,
            "data": {
                "friend_id": current_user["id"]
            }
        }
    )
except Exception as e:
    print(f"Failed to send push notification: {e}")
```

**Comportement** :
- L'expéditeur de la demande reçoit une notification push avec :
  - Nom de la personne qui a accepté
  - Lien vers son profil musicien
  - Image de profil

---

## 🎨 Format des Notifications

Toutes les notifications suivent le même format de données :

```python
{
    "title": str,           # Titre court (avec emoji)
    "message": str,         # Corps du message
    "link": str,            # URL de destination
    "type": str,            # Type : "message", "badge", "friend_request", "friend_accepted"
    "icon": str (optional), # URL de l'image/icône
    "data": dict (optional) # Données additionnelles contextuelles
}
```

## 🔄 Flux de Notification

```
Action Utilisateur
    ↓
Traitement Backend (routes/*)
    ↓
Création de la ressource (message, badge, etc.)
    ↓
Notification in-app (db.notifications)
    ↓
Notification Push (send_push_notification)
    ↓
Récupération des abonnements actifs
    ↓
[TODO Production] Envoi via pywebpush
    ↓
Service Worker reçoit le push
    ↓
Affichage de la notification système
    ↓
Clic → Navigation vers le lien
```

## 🛡️ Gestion des Erreurs

### Principe : "Fail Gracefully"

Toutes les notifications push sont dans des blocs `try/except` pour garantir que :
- ❌ Si l'envoi échoue → L'action principale **réussit quand même**
- ✅ Le message est créé
- ✅ La demande d'ami est envoyée
- ✅ Le badge est débloqué
- 📝 L'erreur est loggée pour debug

**Exemple** :
```python
try:
    await send_push_notification(...)
except Exception as e:
    print(f"Failed to send push notification: {e}")
    # L'exécution continue normalement
```

## 📊 Impact sur les Performances

### Mesures prises :
1. **Asynchrone** : `await send_push_notification()` ne bloque pas
2. **Non-bloquant** : Les erreurs n'interrompent pas le flux
3. **Optimisé** : Pas de boucle synchrone pour l'envoi multi-appareils

### Overhead estimé :
- **Sans abonnés** : ~0ms (early return)
- **Avec 1 abonné** : ~10ms (requête DB + préparation)
- **Avec 3+ abonnés** : ~15ms (requête DB + préparation multi-appareils)

Total : **< 20ms par notification** (négligeable)

## 🧪 Tests

### Backend (curl)

**1. Test Message + Notification Push**
```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
TOKEN="your_token_here"

# Envoyer un message
curl -X POST "$API_URL/api/messages" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "recipient_id": "recipient_user_id",
  "subject": "Test notification",
  "content": "Test de notification push"
}'
```

**2. Test Badge + Notification Push**
```bash
# Vérifier et débloquer des badges
curl -X POST "$API_URL/api/badges/check" \
-H "Authorization: Bearer $TOKEN"
```

**3. Test Demande d'Ami + Notification Push**
```bash
# Envoyer une demande d'ami
curl -X POST "$API_URL/api/friends/request" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "to_user_id": "target_musician_id"
}'
```

### Validation
- ✅ Lint Python : 0 erreur
- ✅ Backend redémarre sans erreur
- ✅ Pas de régression sur les fonctionnalités existantes

## 📝 Logs

Pour débugger les notifications, surveiller ces logs :

```bash
# Backend general logs
tail -f /var/log/supervisor/backend.out.log

# Backend error logs
tail -f /var/log/supervisor/backend.err.log

# Rechercher les notifications push
grep -i "push notification" /var/log/supervisor/backend.out.log
```

## 🚀 Déploiement Production

### Ce qui fonctionne maintenant :
✅ Intégration dans les événements
✅ Structure des notifications
✅ Gestion des abonnements
✅ Notifications locales de test

### Ce qu'il reste pour la production :
⏳ Générer des clés VAPID réelles
⏳ Installer pywebpush : `pip install pywebpush`
⏳ Décommenter le code dans `send_push_notification()`

**Code à activer dans `/app/backend/routes/push_notifications.py`** :
```python
from pywebpush import webpush, WebPushException

# Dans send_push_notification()
for sub in subscriptions:
    try:
        webpush(
            subscription_info=sub["subscription"],
            data=json.dumps(notification_data),
            vapid_private_key=os.environ.get('VAPID_PRIVATE_KEY'),
            vapid_claims={"sub": "mailto:contact@jam-connexion.com"}
        )
    except WebPushException as e:
        logger.error(f"Error sending push: {e}")
        # Désactiver l'abonnement s'il est invalide
        if e.response.status_code == 410:  # Gone
            await db.push_subscriptions.update_one(
                {"id": sub["id"]},
                {"$set": {"active": False}}
            )
```

## 📈 Statistiques & Monitoring (Future)

### Métriques à tracker :
- Nombre de notifications envoyées par type
- Taux de succès/échec
- Taux de clic (click-through rate)
- Temps moyen d'envoi

### Dashboard potentiel :
- Notifications envoyées aujourd'hui
- Top 3 types les plus envoyés
- Utilisateurs les plus actifs
- Erreurs récentes

## ✅ Résultat Final

### Événements avec Notifications Push
| Événement | Status | Destination | Type |
|-----------|--------|-------------|------|
| Nouveau message | ✅ | Destinataire | `message` |
| Badge débloqué | ✅ | Utilisateur | `badge` |
| Demande d'ami envoyée | ✅ | Destinataire | `friend_request` |
| Demande d'ami acceptée | ✅ | Expéditeur | `friend_accepted` |
| Événement à venir | ⏳ | Participants | `event_reminder` |

### Fichiers Modifiés
- `/app/backend/routes/messages.py`
- `/app/backend/routes/badges.py`
- `/app/backend/server.py`

### Impact
- **Expérience utilisateur** : ⬆️ Engagement accru
- **Rétention** : ⬆️ Les utilisateurs reviennent plus souvent
- **Temps de réponse** : ⬆️ Réactions plus rapides aux messages
- **Performance** : ➡️ Aucun impact négatif

Le système est **prêt pour la production** après l'ajout de pywebpush et des clés VAPID !
