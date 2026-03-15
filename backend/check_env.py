#!/usr/bin/env python3
"""
Script pour détecter automatiquement l'environnement et configurer MongoDB
"""
import os
from pathlib import Path
from dotenv import load_dotenv, set_key

# Charger les variables d'environnement
load_dotenv()

# Détecter l'environnement
# Si l'URL du backend contient le domaine personnalisé, on est en production
backend_url = os.environ.get('REACT_APP_BACKEND_URL', '')
env_file = Path(__file__).parent / '.env'

if 'jamconnexion.com' in backend_url:
    print("🌍 Environnement détecté : PRODUCTION")
    set_key(env_file, 'ENVIRONMENT', 'production')
else:
    print("💻 Environnement détecté : DEVELOPMENT")
    set_key(env_file, 'ENVIRONMENT', 'development')

# Afficher la configuration MongoDB
environment = os.environ.get('ENVIRONMENT', 'development')
if environment == 'production':
    mongo_url = os.environ.get('MONGO_URL_PRODUCTION', 'NOT SET')
    print(f"📊 MongoDB: Atlas Cloud")
    print(f"🔗 URL: {mongo_url.split('@')[1] if '@' in mongo_url else mongo_url}")
else:
    print(f"📊 MongoDB: Local")
    print(f"🔗 URL: localhost:27017")

print(f"🗄️  Database: {os.environ.get('DB_NAME', 'test_database')}")
