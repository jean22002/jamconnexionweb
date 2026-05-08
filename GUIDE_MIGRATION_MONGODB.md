# 🚀 Guide de Migration MongoDB vers Atlas

## ✅ Ce que j'ai préparé pour vous

- **Base de données source** : `test_database` (base locale)
- **Utilisateurs** : 290
- **Collections** : 29 (users, musicians, venues, jams, etc.)
- **Taille du backup** : 137 KB
- **Fichier à télécharger** : `BACKUP_REEL_BASE64.txt` (2461 lignes)

---

## 📥 ÉTAPE 1 : Télécharger le backup

Le fichier `BACKUP_REEL_BASE64.txt` est prêt dans `/app/`.

**Option A : Via l'interface Emergent**
1. Allez dans l'explorateur de fichiers
2. Trouvez `/app/BACKUP_REEL_BASE64.txt`
3. Téléchargez-le sur votre ordinateur

**Option B : Je vous l'envoie en parties dans le chat**
- Le fichier fait 2461 lignes
- Je peux l'envoyer en 5 parties de ~500 lignes chacune

---

## 🔧 ÉTAPE 2 : Préparer le backup sur votre ordinateur

Ouvrez un terminal sur votre ordinateur et exécutez :

```bash
# 1. Décoder le fichier base64
base64 -d BACKUP_REEL_BASE64.txt > backup_reel.tar.gz

# 2. Vérifier que le fichier est correct
ls -lh backup_reel.tar.gz
# Devrait afficher environ 137K

# 3. Extraire le backup
tar -xzf backup_reel.tar.gz

# 4. Vérifier le contenu
ls -lh dump_reel/test_database/
# Vous devriez voir tous les fichiers .bson et .metadata.json
```

---

## 🌐 ÉTAPE 3 : Restaurer vers MongoDB Atlas

### 📝 Informations de connexion Atlas

- **Cluster** : customer-apps.wvcdup.mongodb.net
- **Utilisateur** : jean_jamconnexion
- **Mot de passe** : Marshall220219831
- **Base de données cible** : test_database

### 🚀 Commande de restauration

```bash
mongorestore \
  --uri="mongodb+srv://jean_jamconnexion:Marshall220219831@customer-apps.wvcdup.mongodb.net/test_database" \
  --nsInclude="test_database.*" \
  --drop \
  ./dump_reel/test_database
```

**Explication des options :**
- `--uri` : Connexion à votre cluster Atlas
- `--nsInclude` : Ne restaure que la base `test_database`
- `--drop` : Supprime les collections existantes avant de restaurer (pour éviter les doublons)
- `./dump_reel/test_database` : Chemin vers le dossier du backup

---

## ✅ ÉTAPE 4 : Vérifier la restauration

Une fois la restauration terminée, vous devriez voir :

```
2026-03-14T...  finished restoring test_database.users (290 documents, 0 failures)
2026-03-14T...  finished restoring test_database.musicians (X documents, 0 failures)
...
2026-03-14T...  290 document(s) restored successfully. 0 document(s) failed to restore.
```

---

## 🧪 ÉTAPE 5 : Tester votre site de production

Testez l'API de connexion :

```bash
curl https://jamconnexion.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bar@gmail.com","password":"test"}'
```

**Si vous recevez un token, c'est gagné ! 🎉**

---

## ❌ Dépannage

### Problème : "command not found: mongorestore"

**Solution** : Installez MongoDB Database Tools

**Sur macOS :**
```bash
brew tap mongodb/brew
brew install mongodb-database-tools
```

**Sur Ubuntu/Debian :**
```bash
sudo apt-get install mongodb-database-tools
```

**Sur Windows :**
Téléchargez depuis : https://www.mongodb.com/try/download/database-tools

---

### Problème : "authentication failed"

**Solution** : Vérifiez vos identifiants Atlas

1. Allez sur https://cloud.mongodb.com
2. Vérifiez Database Access → Users
3. Le mot de passe est bien : `Marshall220219831`

---

### Problème : "connection refused" ou "timed out"

**Solution** : Vérifiez Network Access

1. Allez sur https://cloud.mongodb.com
2. Network Access → IP Access List
3. Ajoutez `0.0.0.0/0` (pour autoriser toutes les IP temporairement)
4. OU ajoutez votre IP actuelle

---

## 📞 Besoin d'aide ?

Si vous rencontrez un problème :
1. Copiez le message d'erreur complet
2. Revenez dans le chat
3. Je vous aiderai à résoudre le problème !

---

## 🎯 Résumé rapide

```bash
# Sur votre ordinateur :
base64 -d BACKUP_REEL_BASE64.txt > backup_reel.tar.gz
tar -xzf backup_reel.tar.gz
mongorestore --uri="mongodb+srv://jean_jamconnexion:Marshall220219831@customer-apps.wvcdup.mongodb.net/test_database" --nsInclude="test_database.*" --drop ./dump_reel/test_database
```

Voilà, c'est tout ! 🚀
