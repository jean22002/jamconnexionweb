# 🚀 INSTRUCTIONS DÉPLOIEMENT JAMCONNEXION.COM

## ⚠️ IMPORTANT
jamconnexion.com utilise Cloudflare Pages. Vous devez uploader le nouveau code.

## 📦 FICHIERS À DÉPLOYER

### Frontend (Cloudflare Pages)
- Dossier : `frontend/build/`
- Contient : Le site web compilé

### Backend (Cloudflare Workers ?)
- Dossier : `backend/`
- Tous les fichiers Python

## 🔧 OPTION 1 : Via Cloudflare Dashboard

1. Allez sur https://dash.cloudflare.com
2. Workers & Pages → jamconnexion
3. Deployments → Create deployment
4. Uploadez le dossier `frontend/build/`
5. Attendez 3 minutes
6. ✅ Testez jamconnexion.com

## 🔧 OPTION 2 : Via GitHub

1. Dans Emergent, cherchez "Save to GitHub"
2. Cliquez dessus
3. Pushez vers `main`
4. Cloudflare détectera automatiquement
5. ✅ Attendez 5 minutes

## 🔧 OPTION 3 : Contactez le support

Si rien ne fonctionne :
- Email : support@emergent.sh
- Dites : "Je ne peux pas déployer sur jamconnexion.com"
- Donnez votre Job ID

## ✅ VÉRIFICATION

Après déploiement :
1. Videz le cache : Cmd+Shift+R
2. Ouvrez la console (F12)
3. Connectez-vous
4. Vérifiez : AUCUNE erreur 500
