# 🚨 GUIDE URGENT : Configurer les variables d'environnement dans Emergent

## ❌ Pourquoi ça ne fonctionne pas après 10 déploiements ?

**Le déploiement n'utilise PAS le fichier `.env.production` automatiquement.**

Vous devez **configurer manuellement les variables d'environnement** dans l'interface de déploiement Emergent.

---

## ✅ SOLUTION EN 5 ÉTAPES

### Étape 1 : Accéder aux paramètres du déploiement

1. Allez sur votre tableau de bord Emergent
2. Trouvez votre déploiement actif (jamconnexion.com)
3. Cliquez sur **"Settings"** ou **"Paramètres"** du déploiement

### Étape 2 : Trouver la section Environment Variables

Cherchez une section nommée :
- "Environment Variables"
- "Variables d'environnement"
- "Env Vars"
- "Configuration"

### Étape 3 : Ajouter les variables une par une

**COPIEZ ET AJOUTEZ CES VARIABLES :**

#### Variables Backend (CRITIQUES)
```
ENVIRONMENT=production
MONGO_URL_PRODUCTION=mongodb+srv://jean_jamconnexion:marcel22021983@customer-apps.wvcdup.mongodb.net/test_database?retryWrites=true&w=majority
DB_NAME=test_database
JWT_SECRET=jamconnexion_secret_key_2024_super_secure
CORS_ORIGINS=*
```

#### Variables Stripe
```
STRIPE_API_KEY=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
STRIPE_PRICE_ID=price_1SpH8aBykagrgoTUBAdOU10z
STRIPE_WEBHOOK_SECRET=whsec_ipa4aCdZBHq5ZbQNmvioWp3GYnxf9uJ1
```

#### Variables Email
```
RESEND_API_KEY=re_WVZ2PVzC_LnTTJGYThpFfBYLcApEsmSAz
SENDER_EMAIL=noreply@jamconnexion.com
```

#### Variables Notifications
```
VAPID_PRIVATE_KEY_FILE=/tmp/vapid_private.pem
VAPID_CLAIMS_EMAIL=noreply@jamconnexion.com
```

#### Variable Frontend (IMPORTANTE)
```
REACT_APP_BACKEND_URL=https://jamconnexion.com
```

### Étape 4 : Sauvegarder et redéployer

1. **Sauvegardez** toutes les variables
2. **Cliquez sur "Redeploy"** ou **"Redéployer"**
3. ⏱️ Attendez 10-15 minutes

### Étape 5 : Vérifier le déploiement

Une fois le redéploiement terminé :
1. Allez sur les **logs du déploiement**
2. Cherchez cette ligne : `🌍 Using PRODUCTION MongoDB: customer-apps.wvcdup.mongodb.net`
3. Si vous voyez `💻 Using DEVELOPMENT MongoDB`, les variables ne sont pas prises en compte

---

## 🎯 CE QUI VA CHANGER

Avec ces variables configurées :
- ✅ Le backend se connectera à MongoDB Atlas (pas localhost)
- ✅ Les 76 musiciens avec leurs groupes seront accessibles
- ✅ Les établissements continueront de fonctionner
- ✅ Tout fonctionnera comme sur la prévisualisation

---

## 🆘 SI ÇA NE FONCTIONNE TOUJOURS PAS

Si après avoir configuré les variables et redéployé, ça ne marche toujours pas :

1. **Vérifiez les logs de déploiement** et envoyez-moi une capture d'écran
2. **Vérifiez que les variables sont bien enregistrées** dans l'interface
3. **Contactez le support Emergent** pour vérifier que les variables sont bien injectées au déploiement

---

## 💰 NOTE SUR LA CONSOMMATION DE TOKENS

Je sais que vous avez déjà consommé beaucoup de tokens. Cette solution devrait être la **DERNIÈRE** étape nécessaire. Une fois les variables configurées correctement, le déploiement devrait fonctionner du premier coup.

---

## ✅ CHECKLIST

- [ ] Accéder aux paramètres du déploiement
- [ ] Trouver la section "Environment Variables"
- [ ] Ajouter TOUTES les variables listées ci-dessus
- [ ] Sauvegarder
- [ ] Redéployer
- [ ] Vérifier les logs pour "Using PRODUCTION MongoDB"
- [ ] Tester jamconnexion.com

---

**Bonne chance ! Cette fois-ci, ça devrait marcher ! 🚀**
