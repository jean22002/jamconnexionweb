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


def get_welcome_email_html(name: str, email: str, role: str) -> str:
    """
    Génère le HTML de l'email de bienvenue
    """
    APP_URL = "https://jamconnexion.com"
    
    role_text = {
        "musician": "musicien",
        "venue": "établissement",
        "melomane": "mélomane"
    }
    
    role_fr = role_text.get(role, role)
    
    # Features selon le rôle
    features_html = ""
    if role == "musician":
        features_html = """
            <li>Créer et gérer vos groupes</li>
            <li>Organiser votre planning de concerts</li>
            <li>Inviter d'autres musiciens à rejoindre vos groupes</li>
            <li>Exporter vos événements vers Google Agenda</li>
        """
    elif role == "venue":
        features_html = """
            <li>Publier vos événements et jams</li>
            <li>Trouver des musiciens locaux</li>
            <li>Gérer vos réservations</li>
        """
    elif role == "melomane":
        features_html = """
            <li>Découvrir des concerts près de chez vous</li>
            <li>Suivre vos artistes préférés</li>
            <li>Participer à des événements musicaux</li>
        """
    
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue sur Jam Connexion</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f0f; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f0f;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(56, 189, 248, 0.2);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #38bdf8 0%, #9333ea 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                                🎵 Jam Connexion
                            </h1>
                            <p style="margin: 10px 0 0; font-size: 16px; color: #94a3b8;">
                                Plateforme Live Music
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; font-size: 24px; color: #38bdf8;">
                                Bienvenue {name} ! 👋
                            </h2>
                            
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #cbd5e1;">
                                Merci de vous être inscrit en tant que <strong style="color: #38bdf8;">{role_fr}</strong> sur Jam Connexion.
                                Votre compte a été créé avec succès !
                            </p>
                            
                            <!-- Info Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(56, 189, 248, 0.1); border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.2); margin: 20px 0;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0 0 10px; font-size: 14px; color: #94a3b8;">
                                            📧 <strong style="color: #cbd5e1;">Votre email de connexion :</strong>
                                        </p>
                                        <p style="margin: 0; font-size: 16px; color: #38bdf8; font-weight: 600;">
                                            {email}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0; font-size: 16px; line-height: 1.6; color: #cbd5e1;">
                                Vous pouvez dès maintenant vous connecter et profiter de toutes les fonctionnalités de la plateforme.
                            </p>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{APP_URL}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #38bdf8 0%, #9333ea 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);">
                                            Se connecter maintenant
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Features -->
                            <div style="margin: 30px 0; padding: 20px 0; border-top: 1px solid rgba(56, 189, 248, 0.2);">
                                <p style="margin: 0 0 15px; font-size: 14px; color: #94a3b8; font-weight: 600;">
                                    ✨ Que pouvez-vous faire sur Jam Connexion ?
                                </p>
                                <ul style="margin: 0; padding: 0 0 0 20px; color: #cbd5e1; font-size: 14px; line-height: 1.8;">
                                    {features_html}
                                </ul>
                            </div>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(56, 189, 248, 0.2);">
                            <p style="margin: 0 0 10px; font-size: 14px; color: #94a3b8;">
                                Besoin d'aide ? Contactez-nous à
                                <a href="mailto:support@jamconnexion.com" style="color: #38bdf8; text-decoration: none;">
                                    support@jamconnexion.com
                                </a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #64748b;">
                                © 2026 Jam Connexion. Tous droits réservés.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    """


async def send_welcome_email(name: str, email: str, role: str) -> bool:
    """
    Envoie un email de bienvenue à un nouvel utilisateur
    
    Args:
        name: Nom de l'utilisateur
        email: Email de l'utilisateur
        role: Rôle de l'utilisateur (musician, venue, melomane)
    
    Returns:
        True si l'email a été envoyé avec succès, False sinon
    """
    if not resend.api_key:
        logger.warning(f"Cannot send welcome email to {email} - Resend not configured")
        return False
    
    try:
        html_content = get_welcome_email_html(name, email, role)
        
        success = await send_email(
            to_email=email,
            subject="🎵 Bienvenue sur Jam Connexion !",
            html_content=html_content,
            from_email=f"Jam Connexion <{SENDER_EMAIL}>"
        )
        
        if success:
            logger.info(f"Welcome email sent successfully to {email}")
        
        return success
        
    except Exception as e:
        logger.error(f"Failed to send welcome email to {email}: {str(e)}")
        return False


def get_verification_email_html(name: str, verification_token: str) -> str:
    """
    Génère le HTML de l'email de vérification
    """
    APP_URL = "https://jamconnexion.com"
    verification_link = f"{APP_URL}/verify-email?token={verification_token}"
    
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérifiez votre email - Jam Connexion</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f0f; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f0f;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(56, 189, 248, 0.2);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #38bdf8 0%, #9333ea 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                                🎵 Jam Connexion
                            </h1>
                            <p style="margin: 10px 0 0; font-size: 16px; color: #94a3b8;">
                                Vérification de votre email
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; font-size: 24px; color: #38bdf8;">
                                Bonjour {name} ! 👋
                            </h2>
                            
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #cbd5e1;">
                                Merci de vous être inscrit sur <strong style="color: #38bdf8;">Jam Connexion</strong>.
                                Pour finaliser votre inscription et accéder à votre compte, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous.
                            </p>
                            
                            <!-- Warning Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(251, 191, 36, 0.1); border-radius: 8px; border: 1px solid rgba(251, 191, 36, 0.3); margin: 20px 0;">
                                <tr>
                                    <td style="padding: 15px;">
                                        <p style="margin: 0; font-size: 14px; color: #fbbf24;">
                                            ⚠️ <strong>Important :</strong> Vous ne pourrez pas vous connecter tant que votre email n'est pas vérifié.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{verification_link}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #38bdf8 0%, #9333ea 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);">
                                            ✅ Vérifier mon email
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alternative link -->
                            <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
                                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                                <a href="{verification_link}" style="color: #38bdf8; word-break: break-all;">
                                    {verification_link}
                                </a>
                            </p>
                            
                            <!-- Expiration notice -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(56, 189, 248, 0.1); border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.2); margin: 20px 0;">
                                <tr>
                                    <td style="padding: 15px;">
                                        <p style="margin: 0; font-size: 13px; color: #94a3b8; text-align: center;">
                                            ⏱️ Ce lien est valable pendant <strong style="color: #cbd5e1;">48 heures</strong>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(56, 189, 248, 0.2);">
                            <p style="margin: 0 0 10px; font-size: 14px; color: #94a3b8;">
                                Vous n'avez pas créé de compte ? Ignorez cet email.
                            </p>
                            <p style="margin: 0 0 10px; font-size: 14px; color: #94a3b8;">
                                Besoin d'aide ? Contactez-nous à
                                <a href="mailto:support@jamconnexion.com" style="color: #38bdf8; text-decoration: none;">
                                    support@jamconnexion.com
                                </a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #64748b;">
                                © 2026 Jam Connexion. Tous droits réservés.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    """


async def send_verification_email(name: str, email: str, verification_token: str) -> bool:
    """
    Envoie un email de vérification avec un lien unique
    
    Args:
        name: Nom de l'utilisateur
        email: Email de l'utilisateur
        verification_token: Token de vérification unique
    
    Returns:
        True si l'email a été envoyé avec succès, False sinon
    """
    if not resend.api_key:
        logger.warning(f"Cannot send verification email to {email} - Resend not configured")
        return False
    
    try:
        html_content = get_verification_email_html(name, verification_token)
        
        success = await send_email(
            to_email=email,
            subject="🔐 Vérifiez votre email - Jam Connexion",
            html_content=html_content,
            from_email=f"Jam Connexion <{SENDER_EMAIL}>"
        )
        
        if success:
            logger.info(f"Verification email sent successfully to {email}")
        
        return success
        
    except Exception as e:
        logger.error(f"Failed to send verification email to {email}: {str(e)}")
        return False


def get_account_activated_email_html(name: str) -> str:
    """
    Génère le HTML de l'email de confirmation d'activation
    """
    APP_URL = "https://jamconnexion.com"
    
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compte activé - Jam Connexion</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f0f; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f0f;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(56, 189, 248, 0.2);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(56, 189, 248, 0.1) 100%);">
                            <div style="font-size: 64px; margin-bottom: 10px;">🎉</div>
                            <h1 style="margin: 0; font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #22c55e 0%, #38bdf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                                Compte activé !
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; font-size: 24px; color: #22c55e;">
                                Félicitations {name} ! 🚀
                            </h2>
                            
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #cbd5e1;">
                                Votre adresse email a été vérifiée avec succès. Votre compte <strong style="color: #38bdf8;">Jam Connexion</strong> est maintenant <strong style="color: #22c55e;">pleinement actif</strong> !
                            </p>
                            
                            <!-- Success Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(34, 197, 94, 0.1); border-radius: 8px; border: 1px solid rgba(34, 197, 94, 0.3); margin: 20px 0;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0; font-size: 14px; color: #22c55e; text-align: center;">
                                            ✅ Vous pouvez maintenant profiter de toutes les fonctionnalités de la plateforme !
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0; font-size: 16px; line-height: 1.6; color: #cbd5e1;">
                                Connectez-vous dès maintenant pour :
                            </p>
                            
                            <ul style="margin: 0 0 20px; padding: 0 0 0 20px; color: #cbd5e1; font-size: 14px; line-height: 1.8;">
                                <li>Créer et gérer vos groupes</li>
                                <li>Organiser votre planning de concerts</li>
                                <li>Inviter d'autres musiciens</li>
                                <li>Et bien plus encore...</li>
                            </ul>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{APP_URL}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #22c55e 0%, #38bdf8 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);">
                                            🎵 Accéder à mon compte
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(56, 189, 248, 0.2);">
                            <p style="margin: 0 0 10px; font-size: 14px; color: #94a3b8;">
                                Besoin d'aide ? Contactez-nous à
                                <a href="mailto:support@jamconnexion.com" style="color: #38bdf8; text-decoration: none;">
                                    support@jamconnexion.com
                                </a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #64748b;">
                                © 2026 Jam Connexion. Tous droits réservés.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    """


async def send_account_activated_email(name: str, email: str) -> bool:
    """
    Envoie un email de confirmation d'activation de compte
    
    Args:
        name: Nom de l'utilisateur
        email: Email de l'utilisateur
    
    Returns:
        True si l'email a été envoyé avec succès, False sinon
    """
    if not resend.api_key:
        logger.warning(f"Cannot send activation email to {email} - Resend not configured")
        return False
    
    try:
        html_content = get_account_activated_email_html(name)
        
        success = await send_email(
            to_email=email,
            subject="🎉 Votre compte Jam Connexion est actif !",
            html_content=html_content,
            from_email=f"Jam Connexion <{SENDER_EMAIL}>"
        )
        
        if success:
            logger.info(f"Account activation email sent successfully to {email}")
        
        return success
        
    except Exception as e:
        logger.error(f"Failed to send activation email to {email}: {str(e)}")
        return False
