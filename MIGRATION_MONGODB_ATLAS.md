# Migration des Données vers MongoDB Atlas

## ✅ Backup Créé

J'ai exporté toute votre base de données `test_database` :
- **Taille** : 788 KB
- **290 utilisateurs** (dont bar@gmail.com)
- **43 établissements**
- **76 musiciens**
- **30 collections** au total

## 📋 Vos Options

### Option A : Vérifier Si Atlas a Déjà les Données (RECOMMANDÉ EN PREMIER)

**Avant de migrer**, vérifiez si MongoDB Atlas a déjà vos données :

1. Allez sur https://cloud.mongodb.com
2. Connectez-vous avec votre compte
3. Trouvez le cluster `customer-app`
4. Regardez dans la base `test_database`
5. Vérifiez la collection `users`

**Si vous trouvez vos 290 utilisateurs** → Pas besoin de migration !
Le problème est alors dans les permissions ou la connexion.

**Si Atlas est vide ou a des données différentes** → Continuez avec Option B.

---

### Option B : Importer les Données dans MongoDB Atlas

#### Étape 1 : Télécharger le Backup

Le backup est dans `/tmp/mongodb_backup/`. Vous devez le télécharger sur votre ordinateur.

Depuis votre terminal local, utilisez cette commande pour créer une archive :

```bash
cd /tmp
tar -czf mongodb_backup.tar.gz mongodb_backup/
```

#### Étape 2 : Récupérer l'URL MongoDB Atlas Complète

Dans vos System Keys du déploiement jamconnexion.com, vous avez :
```
MONGO_URL: mongodb+srv://venue-debug.d6mbpsslqs2c73dnvspg@customer-app...
```

Vous avez besoin de l'URL COMPLÈTE avec :
- Le nom d'utilisateur
- Le mot de passe
- L'adresse complète du cluster

Format attendu :
```
mongodb+srv://USERNAME:PASSWORD@customer-app-xxxxx.mongodb.net/?retryWrites=true&w=majority
```

#### Étape 3 : Installer MongoDB Tools (si nécessaire)

Sur votre ordinateur local :
```bash
# Mac
brew install mongodb-database-tools

# Ubuntu/Debian
sudo apt-get install mongodb-database-tools

# Windows
# Télécharger depuis: https://www.mongodb.com/try/download/database-tools
```

#### Étape 4 : Importer dans Atlas

```bash
mongorestore \
  --uri="mongodb+srv://USERNAME:PASSWORD@customer-app-xxxxx.mongodb.net" \
  --db=test_database \
  /chemin/vers/mongodb_backup/test_database
```

**Remplacez** :
- `USERNAME:PASSWORD` par vos credentials MongoDB Atlas
- `customer-app-xxxxx.mongodb.net` par votre cluster Atlas complet
- `/chemin/vers/mongodb_backup/test_database` par le chemin local du backup

#### Étape 5 : Vérifier l'Import

Après l'import, vérifiez dans MongoDB Atlas que :
- ✅ 290 documents dans la collection `users`
- ✅ 43 documents dans `venues`
- ✅ 76 documents dans `musicians`
- ✅ Toutes les autres collections

#### Étape 6 : Tester le Déploiement

Une fois les données importées dans Atlas :
1. Allez dans le déploiement jamconnexion.com
2. Cliquez sur **"Re-deploy changes"**
3. Attendez 5-10 minutes
4. Testez https://jamconnexion.com avec bar@gmail.com / test

---

### Option C : Utiliser MongoDB Local en Production (PAS RECOMMANDÉ)

Si vous ne voulez pas utiliser Atlas, vous pouvez changer les System Keys :

```
MONGO_URL: mongodb://localhost:27017
```

**MAIS** cela signifie :
- Pas de scalabilité
- Pas de backups automatiques
- Risque de perte de données
- Moins sécurisé

---

## 🎯 Ma Recommandation

1. **D'ABORD** : Vérifiez MongoDB Atlas (Option A) - peut-être que les données y sont déjà !
2. **SI VIDE** : Importez les données (Option B)
3. **ENSUITE** : Redéployez et testez

---

## ❓ Questions ?

- Avez-vous accès à MongoDB Atlas ?
- Voulez-vous que je vous aide à créer les commandes d'import personnalisées ?
- Préférez-vous que je compresse le backup pour que vous puissiez le télécharger ?

**Dites-moi comment vous voulez procéder !**
