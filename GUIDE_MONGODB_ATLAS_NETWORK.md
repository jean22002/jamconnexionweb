# Guide : Débloquer l'Accès IP sur MongoDB Atlas

## Étape 1 : Trouver Vos Clusters

Vous êtes actuellement sur la page "Organization Settings". 

👉 **Cliquez sur "All Projects"** dans le menu de gauche (sous IDENTITY & ACCESS)

## Étape 2 : Sélectionner Votre Projet

Vous devriez voir une liste de projets. Cherchez un projet qui contient :
- "customer-app" ou
- "customer-apps" ou  
- Un projet créé pour jamconnexion

👉 **Cliquez sur ce projet**

## Étape 3 : Voir Vos Clusters

Une fois dans le projet, vous verrez vos clusters MongoDB.

Vous devriez voir un cluster nommé quelque chose comme :
- "customer-apps" 
- "Cluster0"
- Ou un autre nom

## Étape 4 : Débloquer l'Accès IP (IMPORTANT)

👉 Dans le **menu de gauche**, cherchez **"Network Access"** (sous SECURITY)

👉 Cliquez sur **"Network Access"**

👉 Cliquez sur le bouton **"ADD IP ADDRESS"** (en haut à droite)

👉 Dans la popup, cliquez sur **"ALLOW ACCESS FROM ANYWHERE"**
   - Cela va ajouter l'IP : **0.0.0.0/0**

👉 Cliquez sur **"Confirm"**

👉 **ATTENDEZ 2-3 MINUTES** que la modification prenne effet

## Étape 5 : Dites-Moi "C'est Fait"

Une fois que vous avez :
1. ✅ Cliqué sur "ALLOW ACCESS FROM ANYWHERE"
2. ✅ Attendu 2-3 minutes

👉 Revenez ici et dites-moi **"c'est fait"**

Je lancerai immédiatement la migration des données !

---

## 🔍 Résumé Visuel

```
Organization Settings (VOUS ÊTES ICI)
         ↓
All Projects (CLIQUEZ ICI)
         ↓
Sélectionnez votre projet
         ↓
Network Access (menu gauche)
         ↓
ADD IP ADDRESS
         ↓
ALLOW ACCESS FROM ANYWHERE
         ↓
Confirm
         ↓
Attendez 2-3 minutes
```
