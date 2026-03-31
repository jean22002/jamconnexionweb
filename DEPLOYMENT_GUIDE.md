# 🚀 Guide de Déploiement du Nouveau Build

## Situation Actuelle

✅ **Nouveau build créé** : `/app/frontend/build/` (avec le correctif setProfileForm)  
❌ **www.jamconnexion.com** : Sert l'ancien build depuis votre serveur de production

---

## 📦 Option 1 : Télécharger et Déployer Manuellement

### Étape 1 : Créer une archive du build

```bash
cd /app/frontend
tar -czf build-$(date +%Y%m%d-%H%M%S).tar.gz build/
```

Le fichier sera : `build-20260331-213400.tar.gz`

### Étape 2 : Télécharger l'archive

**Via l'interface Emergent** :
- Accéder au gestionnaire de fichiers
- Télécharger `/app/frontend/build-*.tar.gz`

**Ou via SSH/SCP** (si disponible) :
```bash
scp user@emergent-server:/app/frontend/build-*.tar.gz ./
```

### Étape 3 : Déployer sur votre serveur

```bash
# Sur votre serveur de production (où www.jamconnexion.com est hébergé)
# Extraire l'archive
tar -xzf build-*.tar.gz

# Sauvegarder l'ancien build (au cas où)
mv /chemin/vers/ancien/build /chemin/vers/ancien/build.backup

# Copier le nouveau build
cp -r build/* /chemin/vers/votre/serveur/web/
```

---

## 📦 Option 2 : Déploiement via Git (Recommandé)

Si votre code est sur Git :

### Étape 1 : Commit le nouveau build
```bash
cd /app/frontend
git add build/
git commit -m "Build production avec correctif setProfileForm"
git push origin main
```

### Étape 2 : Sur votre serveur de production
```bash
git pull origin main
# Le nouveau build sera automatiquement déployé
```

---

## 📦 Option 3 : Utiliser le Déploiement Emergent Natif

Si Emergent gère votre déploiement :

1. **Dans l'interface Emergent** : Cliquer sur "Deploy"
2. L'application détectera automatiquement le nouveau build
3. Le déploiement se fera automatiquement

---

## ⚡ Option 4 : Test Immédiat (Sans Déployer)

**Servir le build localement pour tester** :

```bash
# Depuis ce pod Emergent
cd /app/frontend/build
python3 -m http.server 8080
```

Ensuite, configurer un tunnel ou accéder via l'URL preview Emergent.

---

## 🔍 Identifier Où Déployer

**Trouvez où www.jamconnexion.com est hébergé** :

```bash
# Votre serveur de production (pas ce pod)
# Chercher le dossier racine web
find / -name "jamconnexion" -type d 2>/dev/null
# Ou
ls -la /var/www/
ls -la /home/*/public_html/
```

Le nouveau build doit remplacer les fichiers dans ce dossier.

---

## 📝 Checklist de Déploiement

- [ ] Sauvegarder l'ancien build (backup)
- [ ] Copier le nouveau build vers le serveur de production
- [ ] Redémarrer le serveur web (nginx/apache) si nécessaire
- [ ] Purger le cache Cloudflare (✅ Déjà fait)
- [ ] Tester : www.jamconnexion.com
- [ ] Vérifier : Plus d'erreur setProfileForm dans la console

---

## 🎯 Résumé

**Le problème** : 
- Nouveau build créé ✅
- Mais pas déployé sur le serveur qui sert www.jamconnexion.com ❌

**La solution** :
1. **Copier** `/app/frontend/build/` vers votre serveur de production
2. **Remplacer** l'ancien build
3. **Tester** : L'erreur aura disparu

---

**Quelle option préférez-vous ?**
- Option 1 : Télécharger et déployer manuellement ?
- Option 2 : Via Git ?
- Option 3 : Déploiement Emergent natif ?
- Option 4 : Besoin d'aide pour identifier où déployer ?
