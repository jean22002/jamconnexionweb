"""
Configuration endpoint for mobile app
Provides all necessary configuration values (API keys, URLs, etc.)
"""
from fastapi import APIRouter
import os

router = APIRouter(prefix="/config", tags=["Configuration"])

@router.get("/", include_in_schema=True)
@router.get("", include_in_schema=True)  # Also accept without trailing slash
async def get_app_config():
    """
    Get application configuration for mobile app
    
    Returns:
    - Stripe publishable key
    - WebSocket URL
    - API base URL
    - Firebase configuration (if available)
    """
    
    # Get environment-specific URLs
    backend_url = os.environ.get('BACKEND_URL', 'https://jamconnexion.com')
    websocket_url = backend_url.replace('https://', 'wss://').replace('http://', 'ws://')
    
    # Stripe configuration
    stripe_publishable_key = os.environ.get('STRIPE_PUBLISHABLE_KEY', '')
    
    # Firebase Web SDK configuration (for mobile and web apps)
    firebase_api_key = os.environ.get('FIREBASE_API_KEY', '')
    firebase_auth_domain = os.environ.get('FIREBASE_AUTH_DOMAIN', '')
    firebase_project_id = os.environ.get('FIREBASE_PROJECT_ID', '')
    firebase_storage_bucket = os.environ.get('FIREBASE_STORAGE_BUCKET', '')
    firebase_messaging_sender_id = os.environ.get('FIREBASE_MESSAGING_SENDER_ID', '')
    firebase_app_id = os.environ.get('FIREBASE_APP_ID', '')
    
    # Check if Firebase is configured
    firebase_configured = bool(firebase_api_key and firebase_project_id)
    
    # Firebase configuration
    if firebase_configured:
        firebase_config = {
            "enabled": True,
            "apiKey": firebase_api_key,
            "authDomain": firebase_auth_domain,
            "projectId": firebase_project_id,
            "storageBucket": firebase_storage_bucket,
            "messagingSenderId": firebase_messaging_sender_id,
            "appId": firebase_app_id
        }
    else:
        firebase_config = {
            "enabled": False,
            "message": "Firebase not configured. Push notifications unavailable."
        }
    
    return {
        "api_base_url": backend_url,
        "websocket_url": f"{websocket_url}/socket.io",
        "stripe": {
            "publishable_key": stripe_publishable_key,
            "subscription_price": 12.99,
            "currency": "eur"
        },
        "firebase": firebase_config,
        "version": "2.0.0",
        "features": {
            "chat": True,
            "push_notifications": firebase_config["enabled"],
            "payments": bool(stripe_publishable_key),
            "real_time_updates": True
        }
    }
