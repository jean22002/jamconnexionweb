# 🔧 Fix MongoDB Atlas Connection Timeout - Guide Complet

**Date** : 21 avril 2026  
**Problème** : `pymongo.errors.NetworkTimeout: ac-rc8qr8q-shard-00-XX.xtch2ol.mongodb.net:27017: timed out`  
**Environnement** : Production Kubernetes (Emergent)

---

## 🎯 Diagnostic

### Erreur Observée

```
pymongo.errors.NetworkTimeout: ac-rc8qr8q-shard-00-02.xtch2ol.mongodb.net:27017: timed out
TimeoutError: timed out sock.connect(sa)
```

### Cause Racine

L'**IP du cluster Kubernetes Emergent** n'est **PAS autorisée** dans la whitelist réseau de MongoDB Atlas.

MongoDB Atlas bloque par défaut toutes les connexions sauf celles provenant d'IPs explicitement autorisées.

---

## ✅ SOLUTION 1 : Autoriser TOUTES les IPs (Temporaire pour Test)

### Étapes

1. **Connectez-vous à MongoDB Atlas** :
   - Allez sur https://cloud.mongodb.com
   - Connectez-vous avec vos credentials

2. **Accédez à Network Access** :
   - Dans le menu de gauche : **Network Access**
   - Ou : Database → Connect → Network Access

3. **Ajoutez une règle "Autoriser tout"** :
   - Cliquez sur **"+ ADD IP ADDRESS"**
   - Cliquez sur **"ALLOW ACCESS FROM ANYWHERE"**
   - IP Address : `0.0.0.0/0` (pré-rempli)
   - Description : "Emergent Kubernetes Cluster - Temporary"
   - Cliquez sur **"Confirm"**

4. **Attendez 1-2 minutes** :
   - MongoDB Atlas applique les changements

5. **Redéployez l'application** :
   - Via Emergent UI : Deployments → Redeploy
   - Les connexions devraient maintenant fonctionner

### ⚠️ Sécurité

Cette méthode autorise **toutes les IPs** à se connecter. C'est acceptable pour :
- ✅ Environnements de test/développement
- ✅ Test initial de déploiement
- ❌ **Pas recommandé pour production long terme**

---

## ✅ SOLUTION 2 : Autoriser IPs Spécifiques Emergent (Production)

### Obtenir les IPs Emergent

**Option A : Via Support Emergent**
1. Contactez le support Emergent
2. Demandez : "Quelles sont les IP publiques (egress IPs) du cluster Kubernetes ?"
3. Vous recevrez une liste comme :
   ```
   34.170.12.145
   35.201.89.232
   104.154.78.91
   ```

**Option B : Via Logs de Déploiement**
1. Allez dans les logs de votre déploiement
2. Cherchez les IPs qui apparaissent dans les requêtes :
   ```
   INFO: 66.249.79.135:0 - "GET /api/stats/counts HTTP/1.1" 200 OK
   INFO: 66.249.79.134:0 - "POST /api/online-status/heartbeat HTTP/1.1" 401
   ```
3. Les IPs sources sont : `66.249.79.135`, `66.249.79.134`, etc.

### Ajouter les IPs à MongoDB Atlas

1. **MongoDB Atlas** → **Network Access**
2. Cliquez sur **"+ ADD IP ADDRESS"**
3. Pour chaque IP Emergent :
   - IP Address : `34.170.12.145` (exemple)
   - Description : "Emergent Kubernetes Pod 1"
   - Cliquez sur **"Confirm"**
4. Répétez pour toutes les IPs fournies
5. Attendez 1-2 minutes
6. Redéployez

---

## 🔧 Améliorations Apportées au Code

### Fichier : `/app/backend/server.py`

**Changements** :

```python
# AVANT (Timeouts trop courts)
client = AsyncIOMotorClient(
    mongo_url,
    serverSelectionTimeoutMS=5000,   # 5 secondes
    connectTimeoutMS=10000,          # 10 secondes
    socketTimeoutMS=45000,           # 45 secondes
)

# APRÈS (Timeouts adaptés pour Kubernetes)
client = AsyncIOMotorClient(
    mongo_url,
    serverSelectionTimeoutMS=30000,  # 30 secondes ✅
    connectTimeoutMS=20000,          # 20 secondes ✅
    socketTimeoutMS=60000,           # 60 secondes ✅
    heartbeatFrequencyMS=10000,      # Heartbeat toutes les 10s ✅
    appName="JamConnexion"           # Identification dans Atlas ✅
)
```

### Bénéfices

- ✅ Plus de temps pour établir la connexion initiale (30s au lieu de 5s)
- ✅ Connexions plus stables (60s socket timeout)
- ✅ Meilleure visibilité dans MongoDB Atlas (appName)
- ✅ Monitoring amélioré (heartbeat fréquent)

---

## 🧪 Vérification Post-Fix

### 1. Vérifier la Connexion MongoDB Atlas

Une fois les IPs autorisées et l'app redéployée :

**Check Logs Backend** :
```bash
# Via Emergent UI → Logs → Backend

# Recherchez :
✅ "Connected to MongoDB"
✅ "MongoDB Connection Pool configured"
❌ Plus de "NetworkTimeout"
❌ Plus de "timed out"
```

**Requêtes API** :
```bash
curl https://www.jamconnexion.com/api/stats/promo
# Devrait retourner JSON sans erreur 520
```

### 2. Dashboard MongoDB Atlas

1. Allez sur **MongoDB Atlas** → **Metrics**
2. Onglet **"Connections"**
3. Vérifiez :
   - ✅ Connexions actives : 10-100 (selon le trafic)
   - ✅ Pas de pic d'erreurs de connexion
   - ✅ AppName "JamConnexion" visible

---

## 🚨 Dépannage

### Erreur Persiste Après Ajout IP

**Problème** : Timeouts même après ajout des IPs

**Solutions** :

1. **Vérifier la Connection String** :
   ```bash
   # Dans backend/.env
   MONGO_URL="mongodb+srv://USER:PASSWORD@cluster.mongodb.net/DB?retryWrites=true&w=majority"
   
   # Vérifiez :
   - USER et PASSWORD corrects
   - Cluster name correct (customer-apps.xtch2ol.mongodb.net)
   - DB name correct (test_database)
   ```

2. **Tester la Connexion Manuellement** :
   ```bash
   # Depuis un pod Kubernetes Emergent
   mongosh "mongodb+srv://USER:PASSWORD@cluster.mongodb.net/test_database"
   
   # Devrait se connecter sans timeout
   ```

3. **Vérifier Database User** :
   - MongoDB Atlas → Database Access
   - User "jean_jamconnexion" existe ?
   - Password correct ?
   - Rôle : "Atlas Admin" ou "readWrite@test_database"

4. **Firewall Kubernetes** :
   - Contactez Emergent Support
   - Vérifiez qu'aucun firewall sortant ne bloque le port 27017

---

## 📊 Checklist Complète

### Avant Redéploiement

- [ ] MongoDB Atlas Network Access configuré (0.0.0.0/0 ou IPs spécifiques)
- [ ] Code mis à jour avec nouveaux timeouts (server.py)
- [ ] Connection string vérifiée dans backend/.env
- [ ] Database user créé avec permissions correctes
- [ ] Code poussé vers GitHub ("Save to GitHub")

### Pendant Redéploiement

- [ ] Build Docker réussit (~2-3min)
- [ ] Déploiement Kubernetes termine sans erreur
- [ ] Health checks passent

### Après Redéploiement

- [ ] Logs backend : "Connected to MongoDB" ✅
- [ ] Logs backend : Plus de "NetworkTimeout" ✅
- [ ] API fonctionnelle : curl /api/stats/promo → 200 OK
- [ ] Dashboard Atlas : Connexions actives visibles
- [ ] Hard refresh www.jamconnexion.com → Site fonctionne

---

## 🎯 Résumé

**Problème** : MongoDB Atlas timeout  
**Cause** : IP Kubernetes non autorisée  
**Solution** : Ajouter IP dans MongoDB Atlas Network Access  
**Code Fix** : Timeouts augmentés dans server.py ✅  
**Durée** : ~5 minutes (config Atlas + redéploiement)

---

## 📞 Support

**MongoDB Atlas Help** :
- Documentation : https://docs.atlas.mongodb.com/security-whitelist/
- Support : https://support.mongodb.com

**Emergent Support** :
- Pour obtenir les IPs du cluster Kubernetes
- Pour assistance déploiement

---

**Créé le** : 21 avril 2026  
**Version** : 1.0
