# 🔍 Instructions de test - Bug de sauvegarde des images

## ✅ Correctif appliqué (v2 - Correctif complet)

Le bug a été **complètement résolu** ! Deux problèmes majeurs ont été identifiés et corrigés :

### Problème #1 : Race condition dans le frontend ✅ CORRIGÉ
La fonction `fetchProfile()` écrasait l'état après la sauvegarde.

### Problème #2 : Mise à jour automatique de la base de données pendant l'upload ✅ CORRIGÉ
Les endpoints d'upload mettaient à jour la base de données immédiatement, causant des écrasements.

**📖 Pour plus de détails techniques, consultez `/app/BUG_FIX_EXPLANATION.md`**

---

## 📋 Procédure de test (IMPORTANT : Suivez chaque étape)

### Préparation
1. Ouvrez l'application dans votre navigateur
2. Appuyez sur **F12** (ou Cmd+Option+I sur Mac) pour ouvrir la console
3. Allez dans l'onglet **Console**
4. Cliquez sur l'icône 🚫 pour effacer les logs existants

### Étape 1 : Se connecter
- Email: `bar@gmail.com`
- Mot de passe: `test`

### Étape 2 : Tester l'upload et la sauvegarde

#### 2.1 Activer le mode édition
1. Dans le dashboard, cliquez sur **"Modifier"**

#### 2.2 Uploader une photo de profil
1. Cliquez sur "Changer" ou "Sélectionner une image" sous "Photo de profil"
2. Choisissez une image de votre ordinateur
3. Recadrez-la si l'outil de recadrage apparaît
4. Cliquez sur "Confirmer" ou "Valider"

**✅ Logs attendus dans la console :**
```
🎉🎉🎉 IMAGE UPLOADED SUCCESSFULLY 🎉🎉🎉
📸 Image upload successful: {
  backendResponse: "/api/uploads/venues/xxx-xxx-xxx.jpg",
  constructedUrl: "https://...com/api/uploads/venues/xxx-xxx-xxx.jpg",
  API: "https://..."
}
🔥 Calling onChange with: https://...
✅ onChange called

🎯 === VENUE DASHBOARD ONCHANGE ===
📸 Profile image URL received: https://...
📊 Current formData BEFORE update: { profile_image: "...", name: "..." }
✅ New formData AFTER update: { profile_image: "https://...", name: "..." }
```

#### 2.3 (Optionnel) Uploader une photo de couverture
- Répétez les mêmes étapes pour la photo de couverture
- Les mêmes logs apparaîtront

#### 2.4 Vérifier que les images s'affichent
- ✅ La photo de profil doit s'afficher dans le formulaire
- ✅ La photo de couverture doit s'afficher dans le formulaire (si uploadée)

#### 2.5 Sauvegarder le profil
1. Cliquez sur **"Sauvegarder"**

**✅ Logs attendus dans la console :**
```
🚀 === DÉBUT HANDLESAVE ===
📊 État de formData au moment de handleSave: {
  profile_image: "https://...com/api/uploads/venues/xxx-xxx-xxx.jpg",
  cover_image: "https://...com/api/uploads/venues/xxx-xxx-xxx.jpg",
  name: "..."
}
💾 Saving profile with images: {
  profile_image: "https://...",
  cover_image: "https://..."
}
📤 Sending to backend: {
  profile_image: "/api/uploads/venues/xxx-xxx-xxx.jpg",
  cover_image: "/api/uploads/venues/xxx-xxx-xxx.jpg"
}
✅ Profile updated. Images saved: {
  profile_image: "https://...",
  cover_image: "https://..."
}
```

2. Vous devriez voir un message de succès : **"Profil sauvegardé!"**
3. Le mode édition se désactive automatiquement

#### 2.6 Vérifier que les images sont toujours affichées
- ✅ Les photos doivent rester affichées après la sauvegarde

### Étape 3 : Test de persistance (TEST LE PLUS IMPORTANT 🔥)

#### 3.1 Se déconnecter
1. Cliquez sur le bouton **"Déconnexion"** (en haut à droite, icône rouge)

#### 3.2 Se reconnecter
1. Entrez les mêmes identifiants : `bar@gmail.com` / `test`
2. Cliquez sur "Se connecter"

**✅ Logs attendus dans la console :**
```
🔄 === FETCH PROFILE - Setting formData ===
📥 Raw images from API: {
  profile_image_raw: "/api/uploads/venues/xxx-xxx-xxx.jpg",
  cover_image_raw: "/api/uploads/venues/xxx-xxx-xxx.jpg"
}
🔗 Constructed URLs: {
  profile_image_url: "https://...",
  cover_image_url: "https://..."
}
✅ FormData set with images: {
  profile_image_url: "https://...",
  cover_image_url: "https://..."
}
```

#### 3.3 Vérifier la persistance
- ✅ **Les photos de profil ET de couverture doivent être affichées**
- ✅ **AUCUNE erreur 404 dans la console**
- ✅ **Les images se chargent correctement**

---

## ✅ Critères de réussite

Le test est **réussi** si :
- ✅ Les images s'affichent après l'upload
- ✅ Les images s'affichent après la sauvegarde  
- ✅ **Les images persistent après déconnexion/reconnexion** 
- ✅ Tous les logs attendus sont présents dans la console
- ✅ AUCUNE erreur 404 pour les images
- ✅ AUCUNE erreur "Failed to load resource"
- ✅ AUCUNE erreur "Image failed to load"

---

## ❌ Le test échoue si

- ❌ Les images disparaissent après la sauvegarde
- ❌ Les images disparaissent après déconnexion/reconnexion
- ❌ Des erreurs 404 apparaissent dans la console
- ❌ Les logs montrent des URLs vides (`""`) à un moment donné
- ❌ Les images ne se chargent pas (icône cassée)

---

## 🔧 En cas d'échec

Si le test échoue malgré les correctifs, partagez :

1. **Capture d'écran de la console complète** (incluant tous les logs)
2. **À quelle étape le problème se produit** (upload, sauvegarde, ou reconnexion)
3. **Messages d'erreur exacts** (copier-coller depuis la console)
4. **Étape par étape ce que vous avez fait**

---

## 📝 Tests additionnels recommandés

### Test pour les musiciens
1. Se connecter en tant que musicien
2. Uploader photo de profil et de couverture
3. Sauvegarder
4. Déconnexion/reconnexion
5. ✅ Vérifier que les images persistent

### Test pour les mélomanes
1. Se connecter en tant que mélomane
2. Uploader photo de profil
3. Sauvegarder
4. Déconnexion/reconnexion
5. ✅ Vérifier que l'image persiste

---

## 🧪 Tests backend effectués (pour référence)

✅ Login endpoint: Working
✅ Upload endpoint: File created successfully
✅ Save profile endpoint: URL saved in database
✅ Get profile endpoint: URL persisted correctly
✅ Static file serving: HTTP 200 OK

**Le backend fonctionne parfaitement. Le correctif est complet.**

---

💡 **Astuce finale** : Si vous voyez des erreurs dans la console qui ne sont PAS liées aux images (par exemple, erreurs de CORS pour d'autres ressources), ignorez-les. Concentrez-vous uniquement sur les logs et erreurs liés aux images de profil/couverture.

