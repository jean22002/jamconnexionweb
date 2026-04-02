#!/usr/bin/env python3
"""
Script de test pour Socket.IO - Connexion avec JWT
Objectif: Reproduire l'erreur "server error" et identifier la cause
"""
import socketio
import sys
import os
from pathlib import Path

# Ajouter le backend au path
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from utils.auth import create_token

# Configuration
BACKEND_URL = "http://localhost:8001"

def test_socketio_with_jwt():
    """Test de connexion Socket.IO avec un JWT valide"""
    
    print("=" * 60)
    print("🧪 TEST SOCKET.IO - Connexion avec JWT")
    print("=" * 60)
    
    # 1. Créer un token JWT de test
    print("\n1️⃣ Génération d'un token JWT de test...")
    test_token = create_token(
        user_id="test_user_123",
        email="test@gmail.com",
        role="musician"
    )
    print(f"   ✅ Token généré: {test_token[:50]}...")
    
    # 2. Créer le client Socket.IO
    print("\n2️⃣ Création du client Socket.IO...")
    sio = socketio.Client(logger=True, engineio_logger=True)
    
    # 3. Définir les event handlers
    @sio.event
    def connect():
        print("   ✅ CONNEXION RÉUSSIE !")
        print(f"   └─ SID: {sio.sid}")
    
    @sio.event
    def connect_error(data):
        print(f"   ❌ ERREUR DE CONNEXION: {data}")
    
    @sio.event
    def disconnect():
        print("   ❌ Déconnecté")
    
    # 4. Tenter la connexion
    print("\n3️⃣ Tentative de connexion au backend...")
    print(f"   URL: {BACKEND_URL}/socket.io/")
    print(f"   Auth: {{ token: <JWT> }}")
    
    try:
        sio.connect(
            BACKEND_URL,
            auth={'token': test_token},
            transports=['websocket', 'polling'],
            wait_timeout=10
        )
        
        print("\n4️⃣ Connexion établie, test de ping...")
        sio.sleep(2)
        
        print("\n5️⃣ Déconnexion propre...")
        sio.disconnect()
        
        print("\n" + "=" * 60)
        print("✅ TEST RÉUSSI - Socket.IO fonctionne correctement")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n❌ ÉCHEC DU TEST")
        print(f"   Exception: {type(e).__name__}")
        print(f"   Message: {e}")
        
        print("\n" + "=" * 60)
        print("❌ TEST ÉCHOUÉ - Vérifiez les logs backend ci-dessus")
        print("=" * 60)
        return False

def test_socketio_without_token():
    """Test de connexion Socket.IO SANS token (doit échouer)"""
    
    print("\n" + "=" * 60)
    print("🧪 TEST SOCKET.IO - Connexion SANS token (attendu: échec)")
    print("=" * 60)
    
    sio = socketio.Client()
    
    @sio.event
    def connect():
        print("   ⚠️ CONNEXION RÉUSSIE (inattendu !)")
    
    @sio.event
    def connect_error(data):
        print(f"   ✅ Connexion rejetée comme attendu: {data}")
    
    try:
        sio.connect(BACKEND_URL, wait_timeout=5)
        sio.disconnect()
        print("   ❌ La connexion aurait dû être rejetée !")
        return False
    except Exception:
        print("   ✅ Connexion correctement rejetée")
        return True

if __name__ == "__main__":
    print("\n🚀 Démarrage des tests Socket.IO\n")
    
    # Test 1: Avec token valide
    result1 = test_socketio_with_jwt()
    
    # Test 2: Sans token
    result2 = test_socketio_without_token()
    
    # Résumé
    print("\n" + "=" * 60)
    print("📊 RÉSUMÉ DES TESTS")
    print("=" * 60)
    print(f"   Test avec token:    {'✅ PASS' if result1 else '❌ FAIL'}")
    print(f"   Test sans token:    {'✅ PASS' if result2 else '❌ FAIL'}")
    print("=" * 60)
    
    sys.exit(0 if (result1 and result2) else 1)
