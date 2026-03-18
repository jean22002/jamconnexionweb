# Instructions pour Faire Fonctionner jamconnexion.com

## ⚠️ Problème Actuel

Le DNS est configuré MAIS l'application retourne toujours des erreurs 520 car :
- Le frontend charge ✅
- Le backend ne répond pas (erreur 520) ❌

## ✅ Solution : Créer un Nouveau Déploiement Production

### Étape 1 : Dans l'Interface Emergent

1. **Ouvrez votre projet** dans Emergent
2. Cherchez un bouton **"Deploy to Production"** ou **"Publish"** ou **"Create Production Deployment"**
3. **Cliquez dessus** - cela va créer un nouveau déploiement stable
4. **Attendez** que le déploiement soit terminé (2-5 minutes)

### Étape 2 : Lier le Domaine au Nouveau Déploiement

Une fois le déploiement production créé :

1. Dans Emergent, allez dans les **paramètres du nouveau déploiement**
2. Cherchez l'option **"Custom Domain"** ou **"Link Domain"**
3. Entrez : `jamconnexion.com`
4. Suivez les instructions Emergent/Entri

### Étape 3 : Vérifier que DNS Pointe Correctement

Vos enregistrements DNS actuels (dans Hostinger) :
```
A @ 172.66.2.113 (TTL 300)
A @ 162.159.142.117 (TTL 300)
```

Ces IPs Cloudflare sont correctes SI elles sont fournies par Emergent lors de la liaison du domaine.

### Étape 4 : Attendre et Tester

- **Attendez 5-15 minutes** pour la propagation DNS
- **Testez** en ouvrant : https://jamconnexion.com
- **Connectez-vous** avec bar@gmail.com / test

---

## 🎯 Alternative : Utiliser l'URL Preview Maintenant

En attendant que le domaine custom soit configuré, vous pouvez utiliser :

```
https://production-bugfix-1.preview.emergentagent.com
```

Cette URL fonctionne **parfaitement** dès maintenant (testé et vérifié).

---

## 🔍 Diagnostic Actuel

**État DNS** : ✅ Configuré correctement  
**État Frontend** : ✅ Charge sur jamconnexion.com  
**État Backend** : ❌ Erreur 520 (backend non démarré ou mal configuré)  
**Cause probable** : Pas de déploiement production actif lié au domaine

---

## 📞 Besoin d'Aide ?

Si vous ne trouvez pas le bouton "Deploy to Production" dans Emergent :
1. Cherchez dans la barre de navigation
2. Ou dans les paramètres du projet
3. Ou contactez le support Emergent

Le coût est de **50 crédits/mois** pour un déploiement production avec domaine custom.
