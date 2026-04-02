#!/usr/bin/env python3
"""
Test Socket.IO avec token de production
"""
import socketio
import requests
import sys
import os

BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_URL = f"{BACKEND_URL}/api"

def get_real_token():
    """Récupère un token JWT réel depuis l'API"""
    print("🔐 Connexion avec les credentials de test...")
    
    response = requests.post(f"{API_URL}/auth/login", json={
        "email": "test@gmail.com",
        "password": "test"
    })
    
    if response.status_code == 200:
        data = response.json()
        token = data.get('token')
        print(f"   ✅ Token obtenu: {token[:50]}...")
        return token
    else:
        print(f"   ❌ Échec de connexion: {response.status_code}")
        return None

def test_production_socketio():
    """Test avec un token réel de production"""
    
    print("=" * 70)
    print("🧪 TEST SOCKET.IO - PRODUCTION avec token réel")
    print("=" * 70)
    
    # 1. Obtenir token
    token = get_real_token()
    if not token:
        print("\n❌ Impossible de récupérer un token")
        return False
    
    # 2. Créer le client Socket.IO
    print("\n🔌 Tentative de connexion Socket.IO...")
    print(f"   URL: {BACKEND_URL}/socket.io/")
    
    sio = socketio.Client(logger=False, engineio_logger=False)
    
    connection_success = False
    connection_error = None
    
    @sio.event
    def connect():
        nonlocal connection_success
        connection_success = True
        print(f"   ✅ CONNEXION RÉUSSIE !")
        print(f"   └─ SID: {sio.sid}")
    
    @sio.event
    def connect_error(data):
        nonlocal connection_error
        connection_error = data
        print(f"   ❌ ERREUR: {data}")
    
    @sio.event
    def disconnect():
        print("   📤 Déconnexion")
    
    # 3. Connexion
    try:
        sio.connect(
            BACKEND_URL,
            auth={'token': token},
            transports=['websocket', 'polling'],
            wait_timeout=10
        )
        
        sio.sleep(2)
        sio.disconnect()
        
        if connection_success:
            print("\n" + "=" * 70)
            print("✅ TEST RÉUSSI - Socket.IO fonctionne en production !")
            print("=" * 70)
            return True
        else:
            print("\n" + "=" * 70)
            print("❌ TEST ÉCHOUÉ - La connexion n'a pas abouti")
            print(f"   Erreur: {connection_error}")
            print("=" * 70)
            return False
            
    except Exception as e:
        print(f"\n❌ EXCEPTION: {type(e).__name__}: {e}")
        print("\n" + "=" * 70)
        print("❌ TEST ÉCHOUÉ")
        print("=" * 70)
        return False

if __name__ == "__main__":
    success = test_production_socketio()
    sys.exit(0 if success else 1)
