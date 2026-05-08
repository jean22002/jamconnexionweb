# ✨ Nouvelle Fonctionnalité : Gestion des Amitiés

## 📋 Fonctionnalités ajoutées

### 1. Supprimer un ami ✅
- Bouton rouge avec icône `UserMinus` dans la carte ami
- Confirmation avant suppression
- Supprime l'amitié des deux côtés
- Toast de confirmation

### 2. Bloquer un utilisateur ✅
- Bouton orange avec icône `Ban` dans la carte ami
- Confirmation avant blocage
- Actions automatiques lors du blocage :
  - ✅ Suppression de l'amitié existante
  - ✅ Suppression des demandes d'ami en attente (dans les deux sens)
  - ✅ Enregistrement du blocage dans `db.blocked_users`
- Empêche les interactions futures entre les deux utilisateurs
- Toast de confirmation

### 3. Débloquer un utilisateur ✅
- Section dédiée "Utilisateurs bloqués" dans l'onglet "Amis"
- Cartes avec bordure rouge et image en niveaux de gris
- Bouton vert "Débloquer"
- Compteur d'utilisateurs bloqués
- Toast de confirmation

### 4. Protection contre les interactions avec utilisateurs bloqués ✅
- Impossible d'envoyer une demande d'ami à un utilisateur bloqué
- Impossible de recevoir une demande d'ami d'un utilisateur bloqué
- Message d'erreur : "Impossible d'envoyer une demande d'ami"

## 🛠️ Implémentation technique

### Backend (`/app/backend/routes/musicians.py`)

#### Nouveaux endpoints

**1. POST `/api/users/block/{user_id}`**
```python
- Vérifie que l'utilisateur cible existe
- Empêche l'auto-blocage
- Vérifie si déjà bloqué
- Supprime l'amitié existante
- Supprime les demandes d'ami en attente
- Crée l'entrée de blocage
```

**2. DELETE `/api/users/unblock/{user_id}`**
```python
- Supprime l'entrée de blocage
- Permet à nouveau les interactions
```

**3. GET `/api/users/blocked`**
```python
- Liste tous les utilisateurs bloqués
- Récupère les profils complets (pseudo, image)
- Support des 3 rôles (musician/venue/melomane)
```

#### Modification de l'endpoint existant

**POST `/api/friends/request`**
```python
# Ajout de la vérification de blocage
is_blocked = await db.blocked_users.find_one({
    "$or": [
        {"blocker_id": current_user["id"], "blocked_id": request.to_user_id},
        {"blocker_id": request.to_user_id, "blocked_id": current_user["id"]}
    ]
})
if is_blocked:
    raise HTTPException(status_code=403, detail="Impossible d'envoyer une demande d'ami")
```

### Structure MongoDB

**Collection `blocked_users`**
```json
{
  "id": "uuid",
  "blocker_id": "user-id",  // Qui bloque
  "blocked_id": "user-id",  // Qui est bloqué
  "created_at": "ISO-8601"
}
```

### Frontend (`/app/frontend/src/pages/MusicianDashboard.jsx`)

#### Nouvelles fonctions

```javascript
// Supprimer un ami
const removeFriend = async (friendUserId) => {
  await axios.delete(`${API}/friends/${friendUserId}`);
  toast.success("Ami supprimé");
  fetchFriends();
};

// Bloquer un utilisateur
const blockUser = async (userId) => {
  await axios.post(`${API}/users/block/${userId}`);
  toast.success("Utilisateur bloqué");
  fetchFriends();
};

// Débloquer un utilisateur
const unblockUser = async (userId) => {
  await axios.delete(`${API}/users/unblock/${userId}`);
  toast.success("Utilisateur débloqué");
  fetchBlockedUsers();
};

// Récupérer la liste des utilisateurs bloqués
const fetchBlockedUsers = async () => {
  const response = await axios.get(`${API}/users/blocked`);
  setBlockedUsers(response.data);
};
```

#### Nouvel état
```javascript
const [blockedUsers, setBlockedUsers] = useState([]);
```

#### UI de l'onglet "Amis" refactorisée

**Carte ami mise à jour** :
- ✅ Bouton "Voir" avec icône Eye
- ✅ Bouton "Supprimer" rouge avec icône UserMinus
- ✅ Bouton "Bloquer" orange avec icône Ban
- ✅ Navigation vers le bon profil selon le rôle

**Section Utilisateurs bloqués** :
- Affichée uniquement si `blockedUsers.length > 0`
- Cartes avec bordure rouge
- Image en niveaux de gris (grayscale)
- Icône Ban si pas d'image
- Bouton vert "Débloquer"
- Badge "Bloqué" en rouge

## ✅ Tests effectués

### Test 1 : Bloquer un ami
```bash
✅ Jean bloque Test User
✅ L'amitié est supprimée automatiquement
✅ Test User apparaît dans la liste des bloqués
✅ La liste d'amis de Jean est vide
```

### Test 2 : Débloquer un utilisateur
```bash
✅ Jean débloque Test User
✅ Test User disparaît de la liste des bloqués
✅ Possibilité de redevenir amis
```

### Test 3 : Protection contre demandes d'ami
```bash
✅ Test User (bloqué) essaie d'envoyer demande à Jean
❌ Erreur 403 : "Impossible d'envoyer une demande d'ami"
✅ Jean (bloqueur) essaie d'envoyer demande à Test User
❌ Erreur 403 : "Impossible d'envoyer une demande d'ami"
```

### Test 4 : Suppression mutuelle
```bash
✅ Blocage supprime l'amitié existante
✅ Blocage supprime les demandes en attente
✅ Fonctionne dans les deux sens
```

## 🎨 Design

### Boutons de l'onglet Amis

**Bouton Voir** :
```jsx
<Button variant="outline" className="flex-1 rounded-full border-white/20 gap-2">
  <Eye className="w-4 h-4" />
  Voir
</Button>
```

**Bouton Supprimer** :
```jsx
<Button 
  variant="outline" 
  className="rounded-full border-red-500/30 text-red-500 hover:bg-red-500/10"
>
  <UserMinus className="w-4 h-4" />
</Button>
```

**Bouton Bloquer** :
```jsx
<Button 
  variant="outline" 
  className="rounded-full border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
>
  <Ban className="w-4 h-4" />
</Button>
```

### Carte Utilisateur Bloqué
```jsx
<div className="card-venue p-5 border-2 border-red-500/20">
  <LazyImage className="grayscale" />
  <p className="text-xs text-red-500">Bloqué</p>
  <Button className="border-green-500/30 text-green-500">
    Débloquer
  </Button>
</div>
```

## 📊 Flux utilisateur

### Bloquer un ami
1. Aller dans l'onglet "Amis"
2. Cliquer sur l'icône Ban (orange)
3. Confirmer le blocage
4. ✅ Ami supprimé et bloqué
5. ✅ Apparaît dans "Utilisateurs bloqués"

### Débloquer un utilisateur
1. Scroller jusqu'à "Utilisateurs bloqués"
2. Cliquer sur "Débloquer"
3. ✅ Utilisateur débloqué
4. ✅ Possibilité de redevenir amis

### Supprimer un ami (sans bloquer)
1. Aller dans l'onglet "Amis"
2. Cliquer sur l'icône UserMinus (rouge)
3. Confirmer la suppression
4. ✅ Ami supprimé (mais pas bloqué)
5. ✅ Peut envoyer une nouvelle demande

## 🔒 Sécurité

### Protection backend
- ✅ Vérification d'authentification (token JWT)
- ✅ Empêche l'auto-blocage
- ✅ Vérifie l'existence de l'utilisateur cible
- ✅ Empêche les doublons de blocage
- ✅ Vérifie le blocage avant demande d'ami

### Protection frontend
- ✅ Confirmation avant action destructive
- ✅ Messages d'erreur clairs
- ✅ Toast de feedback pour chaque action
- ✅ Rafraîchissement automatique des listes

## 🎯 Impact

### Avant
- ❌ Impossible de supprimer un ami
- ❌ Impossible de bloquer un utilisateur indésirable
- ❌ Pas de gestion des utilisateurs problématiques
- ❌ Amis pour toujours sans possibilité de gérer

### Après
- ✅ Suppression facile d'un ami
- ✅ Blocage d'utilisateurs indésirables
- ✅ Liste des utilisateurs bloqués
- ✅ Déblocage simple
- ✅ Protection automatique contre interactions non désirées
- ✅ Interface claire et intuitive

## 🚀 Améliorations futures possibles

### Court terme
- [ ] Raison du blocage (optionnelle)
- [ ] Historique des blocages (admin)
- [ ] Signaler en même temps que bloquer

### Moyen terme
- [ ] Blocage temporaire (durée limitée)
- [ ] Liste noire partagée (signalements multiples)
- [ ] Rapport d'abus automatique après X blocages

### Long terme
- [ ] IA pour détecter comportements problématiques
- [ ] Système de réputation
- [ ] Modération communautaire

## 📝 Notes techniques

### Collections MongoDB
- `friends` : Amis et demandes (status: pending/accepted)
- `blocked_users` : Blocages (nouveau)

### Indexes recommandés
```javascript
// Pour optimiser les recherches de blocage
db.blocked_users.createIndex({ "blocker_id": 1, "blocked_id": 1 }, { unique: true });
db.blocked_users.createIndex({ "blocker_id": 1 });
db.blocked_users.createIndex({ "blocked_id": 1 });
```

### Performance
- Requête simple pour vérifier blocage : O(1) avec index
- Liste des bloqués : O(n) où n = nombre d'utilisateurs bloqués (généralement petit)
- Impact négligeable sur les performances globales
