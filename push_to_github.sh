#!/bin/bash

# Script de push automatique vers GitHub
# Pour Jam Connexion - jean22002/jamconnexionweb

set -e  # Arrêt en cas d'erreur

echo "🚀 Script de push automatique vers GitHub"
echo "=========================================="
echo ""

# Variables
GITHUB_TOKEN="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"
REPO_NAME="jamconnexionweb"
GITHUB_USER="jean22002"
REPO_URL="https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${REPO_NAME}.git"
LOCAL_PATH="$HOME/Desktop/${REPO_NAME}"

echo "📍 Repository: ${GITHUB_USER}/${REPO_NAME}"
echo "📂 Chemin local: ${LOCAL_PATH}"
echo ""

# Créer le dossier Desktop si nécessaire
mkdir -p "$HOME/Desktop"

# Vérifier si le repository existe déjà localement
if [ -d "${LOCAL_PATH}" ]; then
    echo "✅ Repository trouvé localement"
    cd "${LOCAL_PATH}"
    
    # Mettre à jour le remote avec le token
    git remote set-url origin "${REPO_URL}"
    
    # Récupérer les dernières modifications
    echo "📥 Récupération des dernières modifications..."
    git fetch origin
    
else
    echo "📥 Clonage du repository..."
    git clone "${REPO_URL}" "${LOCAL_PATH}"
    cd "${LOCAL_PATH}"
fi

echo ""
echo "📋 Statut actuel:"
git status --short

echo ""
echo "➕ Ajout de tous les fichiers modifiés..."
git add .

echo ""
echo "💬 Création du commit..."
git commit -m "✨ Mise à jour: Guide utilisateur, bouton Localisation, masquage bannière PRO

- Ajout d'un guide interactif adapté à chaque profil (Musicien, Établissement, Mélomane)
- Déplacement du bouton Localisation dans le header à côté des trophées
- Masquage de la bannière promotionnelle pour les utilisateurs PRO
- Correction du daemon de notifications (envoi à 13h précis)
" || echo "⚠️  Aucun changement à commiter"

echo ""
echo "🚀 Push vers GitHub..."
git push origin main

echo ""
echo "✅ SUCCÈS ! Tous les commits ont été poussés vers GitHub"
echo ""
echo "🔗 Vérifiez sur: https://github.com/${GITHUB_USER}/${REPO_NAME}/commits/main"
echo ""
echo "⚠️  IMPORTANT: Pensez à révoquer le token GitHub après utilisation:"
echo "   https://github.com/settings/tokens"
