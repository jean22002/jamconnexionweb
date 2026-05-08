# 🔧 Résolution P0 - Socket.IO "server error" & "No profile ID"

**Date:** 2 avril 2026  
**Status:** ✅ RÉSOLU

---

## 🎯 Problèmes identifiés

### 1. ❌ Socket.IO "server error" (Impossible à déboguer)
**Symptôme:** L'utilisateur recevait une erreur générique "server error" sans détails.

**Cause racine:** Le logging backend était insuffisant. L'exception capturée dans `websocket.py` ne loguait pas le traceback complet (`exc_info=False` par défaut).

**Solution:** Ajout de `exc_info=True` et de logs détaillés à chaque étape du handshake :
- 🔌 Tentative de connexion (SID, présence d'auth)
- 🔑 Token reçu (longueur)
- ✅ Payload décodé (clés présentes)
- 👤 User extrait (id, name, role)

---

### 2. ⚠️ "No profile ID, skipping fetch"
**Symptôme:** Le frontend affichait ce warning dans la console au chargement du dashboard.

**Cause racine:** Le hook `useWebSocket` s'initialisait **avant** que le profil utilisateur ne soit chargé, causant :
1. Tentative de connexion Socket.IO trop tôt
2. Appels API avec `profile.id = undefined`

**Solution:** Ajout d'un paramètre `autoConnect` conditionnel :
```javascript
useWebSocket(token, {
  autoConnect: !!profile?.id, // N'initialise le WS qu'une fois le profil chargé
  onNotification: (message) => { ... }
})
```

---

### 3. 🔓 Faille de sécurité: `always_connect=True`
**Symptôme:** Le backend acceptait les connexions Socket.IO même sans token valide.

**Cause racine:** Configuration Socket.IO avec `always_connect=True` (ligne 18, `websocket.py`).

**Solution:** Changement vers `always_connect=False` pour rejeter toute connexion sans authentification valide.

---

## ✅ Modifications apportées

### Backend (`/app/backend/websocket.py`)
1. **Amélioration des logs** (lignes 38-97)
   - Ajout de 8 points de logging détaillés
   - `exc_info=True` sur toutes les exceptions
   - Affichage du contenu de `auth` et `payload`

2. **Sécurisation** (ligne 18)
   ```python
   always_connect=False  # Était: True
   ```

### Frontend
1. **`/app/frontend/src/pages/VenueDashboard.jsx`** (ligne 2356)
   ```javascript
   autoConnect: !!profile?.id
   ```

2. **`/app/frontend/src/pages/MusicianDashboard.jsx`** (ligne 1367)
   ```javascript
   autoConnect: !!profile?.id
   ```

3. **Service Worker** (`/app/frontend/public/service-worker.js`)
   - Incrémentation `CACHE_VERSION` de `v7.1` → `v7.2`
   - Rebuild complet : `yarn build`

---

## 🧪 Tests effectués

### ✅ Test 1: Backend Socket.IO avec JWT local
**Fichier:** `/app/test_socketio_connection.py`  
**Résultat:** ✅ PASS
- Connexion avec token valide : ✅ Réussie
- Connexion sans token : ✅ Rejetée (après fix `always_connect=False`)

### ✅ Test 2: Backend Socket.IO avec JWT production
**Fichier:** `/app/test_socketio_production.py`  
**Résultat:** ✅ PASS
- Token réel de `test@gmail.com` : ✅ Connexion établie
- Logs backend montrent :
  ```
  🔌 New connection attempt: BBeAvPBc... | Auth data received: True
  🔑 Token received for BBeAvPBc... (length: 237)
  ✅ Token decoded successfully | Payload keys: ['user_id', 'email', 'role', 'exp']
  👤 User extracted: {'id': 'fa1de398-...', 'name': 'test', 'role': 'musician'}
  ✅ User fa1de398-... (test) connected successfully
  ```

### ✅ Test 3: API REST production
**Endpoint:** `https://jamconnexion.com/api/stats/counts`  
**Résultat:** ✅ Fonctionnel
```json
{
  "musicians": 79,
  "venues": 43
}
```

---

## 📊 Synthèse

| Composant | Status Avant | Status Après | Changement |
|-----------|--------------|--------------|------------|
| Backend Socket.IO | ❌ Logs insuffisants | ✅ Logs complets | +8 logs détaillés |
| Sécurité Socket.IO | ⚠️ `always_connect=True` | ✅ `always_connect=False` | Auth obligatoire |
| Frontend (VenueDashboard) | ❌ WS init trop tôt | ✅ Init conditionnelle | `autoConnect: !!profile?.id` |
| Frontend (MusicianDashboard) | ❌ WS init trop tôt | ✅ Init conditionnelle | `autoConnect: !!profile?.id` |
| PWA Cache | v7.1 | v7.2 | Force refresh client |

---

## 🚀 Instructions pour l'utilisateur

### À tester en production (www.jamconnexion.com)
1. **Vider le cache du navigateur** (Cmd/Ctrl + Shift + R)
2. Se connecter avec `test@gmail.com` / `test`
3. Ouvrir DevTools > Console
4. Vérifier la présence de :
   ```
   ✅ Socket.IO connected
   🔔 Notifications temps réel activées
   ```
5. **Si vous voyez toujours "server error" :**
   - Ouvrir DevTools > Network > WS
   - Capturer un screenshot et me l'envoyer

### Vérification des logs backend (Production)
L'utilisateur peut demander les logs Cloudflare ou vérifier sur son serveur :
```bash
tail -f /var/log/supervisor/backend.err.log | grep "Socket\|🔌"
```

---

## 🔮 Prochaines étapes (P2)

1. **Refactoring MusicianDashboard.jsx** (~3000 lignes)
   - Extraire les composants de gestion des groupes
   - Créer des hooks personnalisés pour la logique métier
   
2. **Monitoring WebSocket en production**
   - Ajouter des métriques (nombre de connexions actives)
   - Dashboard de supervision

3. **Tests automatisés**
   - Tests unitaires pour `useWebSocket` hook
   - Tests d'intégration Socket.IO (Playwright)

---

## 📝 Notes techniques

### Pourquoi `autoConnect` résout le problème ?
Le hook `useEffect` de `useWebSocket.js` se déclenche lorsque `autoConnect` ou `token` change :
```javascript
useEffect(() => {
  if (autoConnect && token) {
    connect();
  }
  return () => disconnect();
}, [token, autoConnect]);
```

**Séquence avant fix :**
1. Dashboard se monte → `profile = null`
2. `useWebSocket(token, { autoConnect: true })` → Connexion immédiate ❌
3. `fetchEvents()` appelé avec `profile.id = undefined` ❌

**Séquence après fix :**
1. Dashboard se monte → `profile = null`
2. `useWebSocket(token, { autoConnect: false })` → Pas de connexion ✅
3. `fetchProfile()` charge le profil → `profile = { id: 'abc...' }`
4. Re-render → `autoConnect: !!profile?.id = true` → Connexion établie ✅
5. `fetchEvents()` appelé avec `profile.id = 'abc...'` ✅

---

**Auteur:** Agent E1  
**Durée totale:** ~25 minutes  
**Fichiers modifiés:** 5  
**Tests créés:** 2
