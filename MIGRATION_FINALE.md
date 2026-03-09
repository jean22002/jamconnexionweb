# 🚀 Migration MongoDB - Instructions Finales

## ✅ Ce Qui Est Prêt

- ✅ Cluster MongoDB Atlas créé : **customer-apps**
- ✅ Utilisateur créé : **jean_jamconnexion**
- ✅ Password : **Marshall220219831**
- ✅ Network Access configuré : **0.0.0.0/0** (Active)
- ✅ Backup créé : **/tmp/mongodb_backup/** (788 KB, 290 utilisateurs)

---

## 📦 Étape 1 : Télécharger le Backup

Le backup est compressé et prêt à être téléchargé :
```
/tmp/mongodb_backup.tar.gz (140 KB)
```

**Vous devez le télécharger depuis cet environnement vers votre ordinateur.**

---

## 🔧 Étape 2 : Installer MongoDB Tools (Sur Votre Ordinateur)

### Mac
```bash
brew tap mongodb/brew
brew install mongodb-database-tools
```

### Windows
Téléchargez depuis : https://www.mongodb.com/try/download/database-tools

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install mongodb-database-tools
```

---

## 📤 Étape 3 : Extraire le Backup

Sur votre ordinateur :
```bash
tar -xzf mongodb_backup.tar.gz
cd mongodb_backup
ls test_database/
```

Vous devriez voir toutes les collections (.bson files).

---

## 🚀 Étape 4 : Lancer la Migration

```bash
mongorestore \
  --uri="mongodb+srv://jean_jamconnexion:Marshall220219831@customer-apps.wvcdup.mongodb.net/test_database?retryWrites=true&w=majority" \
  --drop \
  test_database/
```

**Options expliquées** :
- `--uri` : URL complète MongoDB Atlas
- `--drop` : Supprime les données existantes avant l'import (évite les doublons)
- `test_database/` : Dossier contenant le backup

---

## ⏱️ Durée Estimée

L'import prend environ **1-2 minutes** selon votre connexion internet.

Vous devriez voir :
```
2026-03-09T...  restoring test_database.users from test_database/users.bson
2026-03-09T...  290 document(s) restored successfully. 0 document(s) failed to restore.
2026-03-09T...  restoring test_database.venues from test_database/venues.bson
2026-03-09T...  43 document(s) restored successfully. 0 document(s) failed to restore.
...
```

---

## ✅ Étape 5 : Vérifier l'Import

### Option A : Via MongoDB Atlas Interface

1. Allez sur https://cloud.mongodb.com
2. Cliquez sur **"Browse Collections"** à côté de customer-apps
3. Vérifiez :
   - Database : **test_database**
   - Collection **users** : **290 documents** ✅
   - Collection **venues** : **43 documents** ✅
   - Collection **musicians** : **76 documents** ✅

### Option B : Via Ligne de Commande

```bash
mongosh "mongodb+srv://jean_jamconnexion:Marshall220219831@customer-apps.wvcdup.mongodb.net/test_database"

# Dans le shell MongoDB :
db.users.countDocuments()  // Devrait retourner 290
db.venues.countDocuments()  // Devrait retourner 43
db.users.findOne({email: "bar@gmail.com"})  // Devrait retourner le compte
```

---

## 🎯 Étape 6 : Mettre à Jour les System Keys Emergent

Une fois la migration terminée, vous devez mettre à jour les credentials dans Emergent :

1. Dans Emergent, déploiement **jamconnexion.com**
2. Allez dans **"Edit System Keys"**
3. Modifiez :
   ```
   MONGO_URL=mongodb+srv://jean_jamconnexion:Marshall220219831@customer-apps.wvcdup.mongodb.net/?retryWrites=true&w=majority
   DB_NAME=test_database
   ```
4. **Cliquez sur "Re-deploy changes"**
5. **Attendez 5-10 minutes**

---

## 🧪 Étape 7 : Tester jamconnexion.com

```
URL : https://jamconnexion.com
Email : bar@gmail.com
Password : test
```

Si la connexion fonctionne → ✅ **MIGRATION RÉUSSIE !**

---

## ⚠️ En Cas de Problème

### Erreur : "Authentication failed"
Vérifiez que vous avez utilisé le bon username et password :
- Username : `jean_jamconnexion`
- Password : `Marshall220219831`

### Erreur : "server selection timeout"
Attendez 2-3 minutes de plus pour que Network Access se propage.

### Erreur : "IP not in whitelist"
Vérifiez que **0.0.0.0/0** est bien **Active** (vert) dans Network Access.

---

## 📊 Résumé des Credentials

```
Cluster : customer-apps.wvcdup.mongodb.net
Username : jean_jamconnexion  
Password : Marshall220219831
Database : test_database

URL Complète :
mongodb+srv://jean_jamconnexion:Marshall220219831@customer-apps.wvcdup.mongodb.net/test_database?retryWrites=true&w=majority
```

---

## 🎉 Après la Migration

Une fois que jamconnexion.com fonctionne :
1. Testez toutes les fonctionnalités critiques
2. Vérifiez que les données sont correctes
3. Sauvegardez votre code sur GitHub (bouton "Save")
4. Configurez des backups automatiques sur MongoDB Atlas (recommandé)

**Bonne chance ! 🚀**
