# 🐛 Correctif : Système d'Amis Complet

## 📋 Problèmes identifiés et corrigés

### Problème 1 : Les amis n'apparaissent pas dans la liste après acceptation ❌ → ✅
**Cause** : Incohérence dans les noms de champs MongoDB  
- Les demandes utilisent `from_user_id` et `to_user_id`
- L'endpoint `/friends` cherchait `user1_id` et `user2_id`

**Solution** : Modification de tous les endpoints pour utiliser les bons champs :
- `/api/friends` : Recherche maintenant avec `from_user_id` et `to_user_id`
- `/api/friends/{friend_user_id}` (DELETE) : Corrigé
- Compteurs d'amis dans les profils : Corrigés
- Pipeline d'agrégation pour les listes de musiciens : Corrigé

### Problème 2 : Le bouton "Ajouter" ne change pas en "Amis" ❌ → ✅
**Cause** : Les données d'amis n'étaient pas récupérées correctement (voir Problème 1)

**Solution** : 
- Backend corrigé, retourne maintenant les bonnes données
- Ajout de `user_id` en plus de `friend_id` pour compatibilité
- Frontend actualise la liste après acceptation

### Problème 3 : Les notifications n'apparaissent pas en temps réel ❌ → ⚡ Amélioré
**Cause** : Pas de mécanisme de rafraîchissement automatique des demandes d'amis

**Solution** :
- Ajout du rafraîchissement des amis dans le polling existant (toutes les 30 secondes)
- Notification de confirmation envoyée à l'expéditeur quand la demande est acceptée
- Suppression de la notification de demande pour l'accepteur

## 🛠️ Modifications techniques

### Backend (`/app/backend/routes/musicians.py`)

#### 1. Endpoint `/api/friends` (GET)
```python
# AVANT : Cherchait user1_id et user2_id
{"user1_id": current_user["id"], "status": "accepted"}

# APRÈS : Cherche from_user_id et to_user_id
{"from_user_id": current_user["id"], "status": "accepted"}
```

**Améliorations** :
- Récupère le profil complet selon le rôle (musician/venue/melomane)
- Retourne `profile_id`, `pseudo`, `profile_image`, `city`, `instruments`
- Ajout de `user_id` pour compatibilité avec le frontend

#### 2. Endpoint `/api/friends/accept/{request_id}` (POST)
**Nouvelles fonctionnalités** :
- ✅ Crée une notification pour l'expéditeur : "X a accepté votre demande d'ami"
- ✅ Supprime la notification de demande pour l'accepteur
- ✅ Type de notification : `friend_accepted`

#### 3. Endpoint `/api/friends/{friend_user_id}` (DELETE)
```python
# AVANT
{"user1_id": current_user["id"], "user2_id": friend_user_id}

# APRÈS
{"from_user_id": current_user["id"], "to_user_id": friend_user_id}
```

#### 4. Compteurs d'amis
Corrigés dans :
- `POST /musicians` (création de profil)
- `PUT /musicians` (mise à jour de profil)
- `GET /musicians/me` (mon profil)
- `GET /musicians/{musician_id}` (profil public)
- `GET /musicians` (liste avec agrégation)

#### 5. Vérification d'amitié existante
```python
# Dans /api/friends/request
# AVANT : user1_id, user2_id
# APRÈS : from_user_id, to_user_id
```

### Frontend (`/app/frontend/src/pages/MusicianDashboard.jsx`)

#### 1. Polling des amis
```javascript
// Ajouté dans l'interval de notifications (ligne 660)
const notificationInterval = setInterval(() => {
  fetchNotifications();
  fetchFriends(); // ✅ NOUVEAU : Rafraîchit aussi les demandes d'amis
}, 30000);
```

## ✅ Tests effectués

### Test 1 : Création et acceptation d'amitié
```bash
# Utilisateur Test envoie demande à Jean
✅ Demande créée

# Jean accepte la demande
✅ Acceptation réussie

# Vérification des deux côtés
✅ Jean voit "Test User" dans ses amis
✅ Test User voit "Jean" dans ses amis
```

### Test 2 : Structure des données retournées
```json
{
  "friend_id": "user-id",
  "user_id": "user-id",
  "friend_name": "Test User",
  "friend_role": "melomane",
  "pseudo": "Test User",
  "profile_image": null,
  "profile_id": "profile-id",
  "city": "Béziers",
  "since": "2026-02-16T..."
}
```

## 📊 Impact

### Avant
- ❌ Liste d'amis toujours vide après acceptation
- ❌ Bouton "Ajouter" reste affiché même après être devenu ami
- ❌ Notifications visibles seulement après rafraîchissement manuel
- ❌ Incohérence base de données (champs incorrects)

### Après
- ✅ Liste d'amis se remplit automatiquement
- ✅ Bouton change en "Ami" (vert) après acceptation
- ✅ Notifications rafraîchies toutes les 30 secondes
- ✅ Base de données cohérente
- ✅ Notification de confirmation envoyée à l'expéditeur
- ✅ Support des 3 rôles (musician/venue/melomane)

## 🔄 Flux complet

### Envoi de demande d'ami
1. User A clique sur "Ajouter" sur le profil de User B
2. Demande créée dans `db.friends` avec status "pending"
3. Notification créée pour User B (type: "friend_request")
4. Bouton change en "Envoyé" pour User A

### Acceptation
1. User B voit la notification
2. User B clique sur "Accepter"
3. Status de la demande passe à "accepted"
4. Notification de type "friend_accepted" envoyée à User A
5. Notification de demande supprimée pour User B
6. Les deux utilisateurs sont maintenant amis

### Affichage
1. User A voit User B dans l'onglet "Amis"
2. User B voit User A dans l'onglet "Amis"
3. Le bouton "Ajouter" affiche maintenant "Ami" (vert)
4. Compteur "Amis (X)" mis à jour

## 🎯 Fichiers modifiés

### Backend
- `/app/backend/routes/musicians.py` : 7 fonctions corrigées
  - `list_friends()` : Logique complète réécrite
  - `accept_friend_request()` : Ajout notifications
  - `remove_friend()` : Correction champs
  - `create_musician_profile()` : Correction compteur
  - `update_musician_profile()` : Correction compteur
  - `get_my_musician_profile()` : Correction compteur
  - `get_musician()` : Correction compteur
  - `search_musicians()` : Correction agrégation
  - `send_friend_request()` : Correction vérification

### Frontend
- `/app/frontend/src/pages/MusicianDashboard.jsx` : 
  - Ajout polling pour `fetchFriends()`

## 🚀 Prochaines améliorations possibles

### Court terme
- [ ] Ajouter un indicateur visuel quand de nouvelles demandes arrivent
- [ ] Son de notification pour nouvelles demandes
- [ ] Badge compteur sur l'icône de notifications

### Moyen terme
- [ ] WebSockets pour notifications vraiment instantanées
- [ ] Liste des amis en ligne
- [ ] Suggestions d'amis basées sur localisation/instruments

### Long terme
- [ ] Chat privé entre amis
- [ ] Partage de sessions de jam entre amis
- [ ] Groupes d'amis
