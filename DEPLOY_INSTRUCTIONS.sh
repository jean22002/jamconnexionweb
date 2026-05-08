#!/bin/bash
# Script de déploiement des correctifs Socket.IO vers www.jamconnexion.com
# Date: 2 avril 2026

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║  DÉPLOIEMENT DES CORRECTIFS SOCKET.IO - JAM CONNEXION            ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# ========================================================================
# ÉTAPE 1 : COPIER LES FICHIERS MODIFIÉS SUR VOTRE SERVEUR
# ========================================================================

echo "📋 FICHIERS À REMPLACER SUR www.jamconnexion.com :"
echo ""
echo "  Backend (1 fichier) :"
echo "    → /app/backend/websocket.py"
echo ""
echo "  Frontend (3 fichiers) :"
echo "    → /app/frontend/src/pages/VenueDashboard.jsx"
echo "    → /app/frontend/src/pages/MusicianDashboard.jsx"
echo "    → /app/frontend/public/service-worker.js"
echo ""

# ========================================================================
# ÉTAPE 2 : COMMANDES À EXÉCUTER SUR VOTRE SERVEUR
# ========================================================================

echo "══════════════════════════════════════════════════════════════════"
echo "🔧 COMMANDES À EXÉCUTER SUR VOTRE SERVEUR (SSH ou Terminal) :"
echo "══════════════════════════════════════════════════════════════════"
echo ""

echo "1️⃣ Aller dans le dossier frontend :"
echo "   cd /app/frontend"
echo ""

echo "2️⃣ Rebuild le frontend (avec le nouveau code) :"
echo "   yarn build"
echo "   (Durée : ~20-30 secondes)"
echo ""

echo "3️⃣ Redémarrer les services :"
echo "   sudo supervisorctl restart backend"
echo "   sudo supervisorctl restart frontend"
echo "   (ou équivalent selon votre configuration)"
echo ""

echo "4️⃣ Vérifier que les services tournent :"
echo "   sudo supervisorctl status"
echo ""

# ========================================================================
# ÉTAPE 3 : TEST POST-DÉPLOIEMENT
# ========================================================================

echo "══════════════════════════════════════════════════════════════════"
echo "✅ VÉRIFICATION POST-DÉPLOIEMENT :"
echo "══════════════════════════════════════════════════════════════════"
echo ""

echo "1️⃣ Sur www.jamconnexion.com :"
echo "   → Appuyez sur Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)"
echo "   → Ceci vide le cache PWA"
echo ""

echo "2️⃣ Connectez-vous avec : test@gmail.com / test"
echo ""

echo "3️⃣ Ouvrez DevTools > Console et cherchez :"
echo "   ✅ '✅ Socket.IO connected'"
echo "   ✅ '🔔 Notifications temps réel activées'"
echo ""

echo "4️⃣ Si vous voyez toujours 'server error' :"
echo "   → Le cache n'est pas vidé : essayez en navigation privée"
echo "   → Ou attendez 2-3 minutes et rechargez"
echo ""

# ========================================================================
# OPTION ALTERNATIVE : TÉLÉCHARGER LES FICHIERS
# ========================================================================

echo "══════════════════════════════════════════════════════════════════"
echo "📥 OPTION ALTERNATIVE (si vous n'avez pas accès SSH) :"
echo "══════════════════════════════════════════════════════════════════"
echo ""
echo "Les 4 fichiers modifiés sont disponibles dans ce dossier :"
echo "   /app/DEPLOY_FILES/"
echo ""
echo "Vous pouvez les télécharger et les uploader via FTP/SFTP"
echo "vers votre serveur de production."
echo ""

# ========================================================================
# RÉSUMÉ DES CHANGEMENTS
# ========================================================================

echo "══════════════════════════════════════════════════════════════════"
echo "📝 RÉSUMÉ DES CORRECTIFS APPLIQUÉS :"
echo "══════════════════════════════════════════════════════════════════"
echo ""
echo "✅ Backend (websocket.py) :"
echo "   • Logs améliorés (8 points de logging détaillés)"
echo "   • Sécurité : always_connect=False"
echo "   • Traceback complet des exceptions"
echo ""
echo "✅ Frontend (VenueDashboard.jsx & MusicianDashboard.jsx) :"
echo "   • Fix timing : autoConnect: !!profile?.id"
echo "   • Le WebSocket attend que le profil soit chargé"
echo ""
echo "✅ PWA (service-worker.js) :"
echo "   • CACHE_VERSION v7.2 (force refresh client)"
echo ""

echo "══════════════════════════════════════════════════════════════════"
echo "❓ BESOIN D'AIDE ?"
echo "══════════════════════════════════════════════════════════════════"
echo ""
echo "Si vous ne savez pas comment accéder à votre serveur,"
echo "dites-moi quelle méthode vous utilisez habituellement :"
echo ""
echo "  A) Accès SSH/Terminal"
echo "  B) FTP/FileZilla"
echo "  C) Interface web (cPanel, Plesk, etc.)"
echo "  D) Autre"
echo ""
echo "Et je vous fournirai les instructions détaillées !"
echo ""
