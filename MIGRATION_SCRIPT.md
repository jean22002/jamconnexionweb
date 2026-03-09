# 🚀 Script de Migration MongoDB vers Atlas

## 📦 Backup Créé

✅ Backup compressé disponible dans : `/tmp/mongodb_backup.tar.gz`
- **Taille** : ~200 KB compressé
- **Contenu** : 290 utilisateurs, 43 venues, 76 musicians, 30 collections

---

## ⚡ OPTION RAPIDE : Migration Automatique

### Étape 1 : Obtenez l'URL MongoDB Atlas Complète

Dans l'interface Emergent (Edit System Keys), vous avez :
```
MONGO_URL: mongodb+srv://venue-debug.d6mbpsslqs2c73dnvspg@customer-app...
```

**J'ai besoin de l'URL COMPLÈTE** qui ressemble à :
```
mongodb+srv://USERNAME:PASSWORD@customer-app-XXXXX.mongodb.net/?retryWrites=true&w=majority
```

### Étape 2 : Fournissez-moi l'URL

Une fois que vous avez l'URL complète, **copiez-la et envoyez-la moi** (elle sera sécurisée).

### Étape 3 : Je Lance la Migration

Je vais exécuter :
```bash
mongorestore \
  --uri="VOTRE_URL_ATLAS_COMPLETE" \
  --db=test_database \
  --drop \
  /tmp/mongodb_backup/test_database
```

**L'option `--drop`** supprime d'abord les données existantes dans Atlas (pour éviter les doublons).

---

## 🔑 Comment Obtenir l'URL Complète ?

### Option A : Depuis MongoDB Atlas

1. Allez sur https://cloud.mongodb.com
2. Connectez-vous
3. Sélectionnez votre cluster `customer-app`
4. Cliquez sur **"Connect"**
5. Choisissez **"Connect your application"**
6. Copiez l'URL de connexion (format SRV)
7. **Remplacez `<password>` par votre mot de passe réel**

### Option B : Depuis les System Keys Emergent

1. Dans votre déploiement jamconnexion.com
2. Allez dans **"Edit System Keys"**
3. Trouvez `MONGO_URL`
4. **Cliquez sur l'icône "œil"** pour révéler l'URL complète
5. Copiez l'URL entière

---

## 📋 Commandes de Migration Manuelles (Si Vous Préférez)

Si vous voulez faire la migration vous-même sur votre ordinateur :

### 1. Télécharger le Backup

```bash
# Depuis votre terminal local, pas dans Emergent
scp ou téléchargez /tmp/mongodb_backup.tar.gz vers votre ordinateur
```

### 2. Extraire le Backup

```bash
tar -xzf mongodb_backup.tar.gz
cd mongodb_backup
```

### 3. Installer MongoDB Tools (si nécessaire)

```bash
# Mac
brew install mongodb-database-tools

# Ubuntu/Debian  
sudo apt-get install mongodb-database-tools

# Windows
# Télécharger depuis: https://www.mongodb.com/try/download/database-tools
```

### 4. Importer dans Atlas

```bash
mongorestore \
  --uri="mongodb+srv://USERNAME:PASSWORD@customer-app-XXXXX.mongodb.net" \
  --db=test_database \
  --drop \
  test_database/
```

**Remplacez** :
- `USERNAME` : Votre nom d'utilisateur MongoDB Atlas
- `PASSWORD` : Votre mot de passe MongoDB Atlas
- `customer-app-XXXXX.mongodb.net` : Votre adresse de cluster complète

### 5. Vérifier l'Import

Connectez-vous à MongoDB Atlas et vérifiez :
```
Database: test_database
Collections:
  - users: 290 documents ✅
  - venues: 43 documents ✅
  - musicians: 76 documents ✅
  - (+ 27 autres collections)
```

---

## 🎯 Après la Migration

Une fois les données importées dans Atlas :

### 1. Redéployer l'Application

Dans Emergent, déploiement jamconnexion.com :
1. Allez dans l'onglet **"Secrets"** ou **"Overview"**
2. Cliquez sur **"Re-deploy changes"**
3. Attendez 5-10 minutes

### 2. Tester la Connexion

```bash
# Ouvrez https://jamconnexion.com
# Essayez de vous connecter avec:
Email: bar@gmail.com
Password: test
```

Si la connexion fonctionne → ✅ Migration réussie !

---

## ❓ Besoin d'Aide ?

**Donnez-moi l'URL MongoDB Atlas complète et je m'occupe de tout !**

Ou si vous préférez le faire vous-même, suivez les commandes ci-dessus.
