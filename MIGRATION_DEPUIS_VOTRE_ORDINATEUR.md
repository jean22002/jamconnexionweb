# Migration MongoDB - Instructions pour Votre Ordinateur

## 📦 Étape 1 : Télécharger le Backup

Le backup est disponible dans cet environnement à :
`/tmp/mongodb_backup.tar.gz` (140 KB)

Vous devez le télécharger sur votre ordinateur local.

## 🔧 Étape 2 : Installer MongoDB Database Tools

### Mac
```bash
brew tap mongodb/brew
brew install mongodb-database-tools
```

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install mongodb-database-tools
```

### Windows
Téléchargez depuis : https://www.mongodb.com/try/download/database-tools

## 📤 Étape 3 : Extraire le Backup

```bash
tar -xzf mongodb_backup.tar.gz
cd mongodb_backup
ls -la test_database/
```

Vous devriez voir toutes les collections (.bson et .metadata.json)

## 🚀 Étape 4 : Importer dans MongoDB Atlas

```bash
mongorestore \
  --uri="mongodb+srv://venue-debug:d6m6bpslqs2c73dnvspg@customer-apps.wvcdup.mongodb.net/test_database?appName=production-db-fix&maxPoolSize=5&retryWrites=true&timeoutMS=10000&w=majority" \
  --drop \
  test_database/
```

**Options expliquées** :
- `--uri` : URL complète de MongoDB Atlas
- `--drop` : Supprime les collections existantes avant l'import (évite les doublons)
- `test_database/` : Dossier contenant le backup

## ✅ Étape 5 : Vérifier l'Import

Une fois terminé, vous devriez voir :
```
290 documents imported into users
43 documents imported into venues
76 documents imported into musicians
... (autres collections)
```

## 🔍 Étape 6 : Vérifier sur MongoDB Atlas

1. Allez sur https://cloud.mongodb.com
2. Sélectionnez le cluster **customer-apps**
3. Cliquez sur **"Browse Collections"**
4. Vérifiez la base **test_database** :
   - `users` : 290 documents ✅
   - `venues` : 43 documents ✅
   - `musicians` : 76 documents ✅

## 🚀 Étape 7 : Redéployer l'Application

1. Dans Emergent, déploiement **jamconnexion.com**
2. Cliquez sur **"Re-deploy changes"**
3. Attendez 5-10 minutes

## 🧪 Étape 8 : Tester

```
URL : https://jamconnexion.com
Email : bar@gmail.com
Password : test
```

Si la connexion fonctionne → ✅ Migration réussie !

---

## ⚠️ En Cas de Problème

### Erreur : "IP not in whitelist"

1. Allez dans **Network Access** sur MongoDB Atlas
2. Ajoutez **0.0.0.0/0** pour autoriser toutes les IPs (temporairement)
3. Réessayez l'import

### Erreur : "Authentication failed"

Vérifiez que l'URL MongoDB contient le bon username et password.

### Timeout pendant l'import

L'import peut prendre 2-5 minutes selon la connexion internet.
