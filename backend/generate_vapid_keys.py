#!/usr/bin/env python3
"""
Script pour générer des clés VAPID au format requis
"""
from py_vapid import Vapid
import base64

# Générer les clés VAPID
vapid = Vapid()
vapid.generate_keys()

# Sauvegarder dans des fichiers
vapid.save_key("/tmp/vapid_private.pem")
vapid.save_public_key("/tmp/vapid_public.pem")

# Convertir la clé publique en base64 URL-safe
from cryptography.hazmat.primitives import serialization

public_key_bytes = vapid.public_key.public_bytes(
    encoding=serialization.Encoding.X962,
    format=serialization.PublicFormat.UncompressedPoint
)

# Encoder en base64 URL-safe
public_key_b64 = base64.urlsafe_b64encode(public_key_bytes).decode('utf-8').rstrip('=')

print("=" * 60)
print("CLÉS VAPID GÉNÉRÉES")
print("=" * 60)
print()
print("PUBLIC KEY (pour /app/frontend/src/hooks/usePushNotifications.js):")
print("-" * 60)
print(public_key_b64)
print()
print("PRIVATE KEY (pour /app/backend/.env):")
print("-" * 60)
print("Fichier: /tmp/vapid_private.pem")
print("(La clé privée doit être lue depuis le fichier PEM)")
print()
print("=" * 60)
print("INSTRUCTIONS")
print("=" * 60)
print("1. Copier la PUBLIC KEY dans le frontend")
print("2. Ajouter VAPID_PRIVATE_KEY_FILE=/tmp/vapid_private.pem dans backend/.env")
print("3. Ou copier le contenu du fichier PEM dans VAPID_PRIVATE_KEY")
print()
