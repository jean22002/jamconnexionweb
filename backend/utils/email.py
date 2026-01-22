import os
import asyncio
import logging
import resend
from typing import Optional

logger = logging.getLogger(__name__)

# Initialize Resend with API key
resend.api_key = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    from_email: Optional[str] = None
) -> bool:
    """
    Send an email using Resend API (async wrapper for sync SDK)
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML content of the email
        from_email: Sender email (optional, uses SENDER_EMAIL by default)
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if not resend.api_key:
        logger.error("RESEND_API_KEY not configured")
        return False
    
    params = {
        "from": from_email or SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        # Run sync SDK in thread to keep FastAPI non-blocking
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent successfully to {to_email}, ID: {email.get('id')}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False


def get_password_change_email_html(user_name: str, user_email: str) -> str:
    """
    Generate HTML content for password change notification email
    
    Args:
        user_name: User's name
        user_email: User's email
    
    Returns:
        str: HTML content
    """
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                background: #f9f9f9;
                padding: 30px;
                border: 1px solid #ddd;
            }}
            .footer {{
                background: #333;
                color: #fff;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                border-radius: 0 0 10px 10px;
            }}
            .alert {{
                background: #fff3cd;
                border: 1px solid #ffc107;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }}
            .button {{
                display: inline-block;
                padding: 12px 30px;
                background: #667eea;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔐 Changement de Mot de Passe</h1>
        </div>
        <div class="content">
            <p>Bonjour <strong>{user_name}</strong>,</p>
            
            <p>Nous vous confirmons que le mot de passe de votre compte <strong>{user_email}</strong> a été modifié avec succès.</p>
            
            <div class="alert">
                ⚠️ <strong>Vous n'êtes pas à l'origine de cette modification ?</strong><br>
                Si vous n'avez pas demandé ce changement, veuillez contacter notre équipe de support immédiatement.
            </div>
            
            <p><strong>Informations :</strong></p>
            <ul>
                <li>Date et heure : {get_current_datetime()}</li>
                <li>Compte : {user_email}</li>
            </ul>
            
            <p>Pour votre sécurité, nous vous recommandons de :</p>
            <ul>
                <li>Utiliser un mot de passe unique et fort</li>
                <li>Ne jamais partager votre mot de passe</li>
                <li>Activer l'authentification à deux facteurs si disponible</li>
            </ul>
            
            <p>Merci de faire confiance à <strong>Jam Connexion</strong> !</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 Jam Connexion - Tous droits réservés</p>
            <p>Ceci est un email automatique, merci de ne pas y répondre.</p>
        </div>
    </body>
    </html>
    """


def get_current_datetime() -> str:
    """Get current date and time formatted for emails"""
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    # Format to French locale
    return now.strftime("%d/%m/%Y à %H:%M UTC")
