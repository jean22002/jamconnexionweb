# 🔧 Guide : Créer une Facebook App pour Jam Connexion

## Prérequis
- Un compte Facebook (celui de Jam Connexion)
- 5 minutes de votre temps

---

## Étape 1️⃣ : Accéder à Facebook Developers

1. Allez sur : **https://developers.facebook.com/**
2. Connectez-vous avec votre compte Facebook
3. Cliquez sur **"Mes Apps"** (en haut à droite)
4. Cliquez sur **"Créer une app"**

---

## Étape 2️⃣ : Configurer l'App

### 2.1 Type d'app
- Sélectionnez : **"Consommateur"** (ou "Consumer")
- Cliquez sur **"Suivant"**

### 2.2 Informations de base
Remplissez :
- **Nom de l'app** : `Jam Connexion Events`
- **Email de contact** : Votre email professionnel
- **Compte WhatsApp Business** : Laissez vide
- Cliquez sur **"Créer une app"**

### 2.3 Vérification de sécurité
- Complétez le captcha
- Cliquez sur **"Soumettre"**

---

## Étape 3️⃣ : Ajouter le produit "Facebook Login"

1. Dans le tableau de bord de votre app, cherchez **"Facebook Login"**
2. Cliquez sur **"Configurer"**

### 3.1 Paramètres OAuth
Allez dans **Produits → Facebook Login → Paramètres** et ajoutez :

**URI de redirection OAuth valides :**
```
https://jamconnexion.com/api/auth/facebook/callback
https://collapsible-map.preview.emergentagent.com/api/auth/facebook/callback
```

**Domaines autorisés pour OAuth :**
```
jamconnexion.com
emergentagent.com
```

Cliquez sur **"Enregistrer les modifications"**

---

## Étape 4️⃣ : Récupérer vos identifiants

1. Allez dans **Paramètres → De base** (dans le menu de gauche)
2. Vous verrez :
   - **ID de l'app** : `123456789012345` (exemple)
   - **Clé secrète de l'app** : Cliquez sur **"Afficher"** pour la voir

**⚠️ IMPORTANT : Copiez ces deux valeurs, vous en aurez besoin !**

---

## Étape 5️⃣ : Demander les permissions

1. Allez dans **Vérification de l'app → Autorisations et fonctionnalités**
2. Demandez les permissions suivantes :
   - ✅ `pages_read_engagement` (Lire les événements de pages)
   - ✅ `pages_events` (Accéder aux événements)
   - ✅ `pages_show_list` (Lister les pages gérées)

**Note :** Ces permissions nécessitent une révision par Facebook si votre app devient publique. Pour l'instant, vous pouvez les utiliser en mode "Développement".

---

## Étape 6️⃣ : Ajouter votre Page Facebook en tant que testeur

1. Allez dans **Rôles → Testeurs**
2. Ajoutez votre compte Facebook comme testeur
3. Acceptez l'invitation (vous recevrez une notification)

---

## Étape 7️⃣ : Passer en mode "Développement" ou "En ligne"

### Option A : Mode Développement (recommandé pour tester)
- Votre app fonctionne uniquement pour vous et les testeurs ajoutés
- Pas besoin de révision Facebook
- **Activé par défaut** ✅

### Option B : Mode En ligne (pour tous les utilisateurs)
- Nécessite une révision par Facebook (7-14 jours)
- Obligatoire si vous voulez que TOUS vos établissements utilisent Facebook Events
- Allez dans **Vérification de l'app** pour soumettre

**Pour démarrer, restez en mode Développement.**

---

## ✅ Récapitulatif des informations à fournir

Une fois terminé, vous devriez avoir :

1. **App ID** : `123456789012345`
2. **App Secret** : `abc123def456...`

**Fournissez-moi ces 2 informations** et je les intégrerai dans le backend !

---

## 🆘 Aide

**Problème : "Je ne vois pas Facebook Login"**
→ Actualisez la page, il faut parfois attendre quelques secondes après la création de l'app

**Problème : "pages_events n'est pas disponible"**
→ Normal, Facebook a déprécié cette permission. Utilisez `pages_read_engagement` à la place

**Problème : "Mon app a été rejetée"**
→ En mode Développement, vous n'avez pas besoin d'approbation. Vérifiez que vous êtes bien en mode "Développement" dans les paramètres de l'app

---

## 📞 Prêt ?

Une fois que vous avez votre **App ID** et **App Secret**, envoyez-les moi et je finalise l'intégration !

🎯 Temps estimé : **5-10 minutes**
