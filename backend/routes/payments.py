from fastapi import APIRouter, HTTPException, Depends, Request
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
import logging
import json
import stripe
import uuid

from models import CheckoutRequest
from utils import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])

# MongoDB connection - Use production URL if ENVIRONMENT is production
environment = os.environ.get('ENVIRONMENT', 'development')
if environment == 'production':
    mongo_url = os.environ.get('MONGO_URL_PRODUCTION', os.environ['MONGO_URL'])
else:
    mongo_url = os.environ['MONGO_URL']

client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

logger = logging.getLogger(__name__)

STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
STRIPE_PRICE_ID = os.environ.get('STRIPE_PRICE_ID', 'price_1SpH8aBykagrgoTUBAdOU10z')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')
SUBSCRIPTION_PRICE = 12.99

stripe.api_key = STRIPE_API_KEY

@router.post("/checkout")
async def create_checkout(data: CheckoutRequest, request: Request, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can subscribe")
    
    try:
        success_url = f"{data.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{data.origin_url}/payment/cancel"
        
        # Create Stripe checkout session for subscription
        session = stripe.checkout.Session.create(
            mode='subscription',
            line_items=[{
                'price': STRIPE_PRICE_ID,
                'quantity': 1,
            }],
            success_url=success_url,
            cancel_url=cancel_url,
            client_reference_id=current_user["id"],
            customer_email=current_user["email"],
            metadata={
                "user_id": current_user["id"],
                "email": current_user["email"],
                "type": "venue_subscription"
            }
        )
        
        # Store transaction in database
        transaction_doc = {
            "id": str(uuid.uuid4()),
            "session_id": session.id,
            "user_id": current_user["id"],
            "email": current_user["email"],
            "amount": SUBSCRIPTION_PRICE,
            "currency": "eur",
            "status": "initiated",
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction_doc)
        
        return {"url": session.url, "session_id": session.id}
    
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Erreur lors de la création de la session de paiement: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@router.get("/status/{session_id}")
async def get_payment_status(session_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    try:
        # Retrieve session from Stripe
        session = stripe.checkout.Session.retrieve(session_id)
        
        # Get transaction from database
        transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        
        # Update transaction status if payment is complete
        if transaction and transaction.get("payment_status") != "paid":
            if session.payment_status == "paid":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"status": "completed", "payment_status": "paid", "completed_at": datetime.now(timezone.utc).isoformat()}}
                )
                await db.users.update_one(
                    {"id": current_user["id"]},
                    {"$set": {
                        "subscription_status": "active",
                        "has_active_subscription": True,
                        "subscription_started": datetime.now(timezone.utc).isoformat()
                    }}
                )
            elif session.status == "expired":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"status": "expired", "payment_status": "failed"}}
                )
        
        return {
            "status": session.status,
            "payment_status": session.payment_status,
            "amount_total": session.amount_total,
            "currency": session.currency
        }
    
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Erreur lors de la récupération du statut: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")


@router.post("/cancel-renewal")
async def cancel_subscription_renewal(current_user: dict = Depends(get_current_user)):
    """
    Annule le renouvellement automatique de l'abonnement.
    L'abonnement reste actif jusqu'à la fin de la période payée.
    """
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can manage subscriptions")
    
    try:
        # Récupérer le stripe_subscription_id de l'utilisateur
        user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
        
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
        stripe_subscription_id = user.get("stripe_subscription_id")
        
        if not stripe_subscription_id:
            raise HTTPException(status_code=400, detail="Aucun abonnement actif trouvé")
        
        # Annuler le renouvellement dans Stripe (à la fin de la période)
        subscription = stripe.Subscription.modify(
            stripe_subscription_id,
            cancel_at_period_end=True
        )
        
        # Mettre à jour l'utilisateur dans la BD
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {
                "subscription_cancel_at_period_end": True,
                "subscription_cancelled_at": datetime.now(timezone.utc).isoformat(),
                "subscription_end_date": datetime.fromtimestamp(subscription.current_period_end, tz=timezone.utc).isoformat()
            }}
        )
        
        return {
            "success": True,
            "message": "Le renouvellement automatique a été annulé. Votre abonnement restera actif jusqu'à la fin de la période.",
            "end_date": datetime.fromtimestamp(subscription.current_period_end, tz=timezone.utc).isoformat()
        }
    
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error in cancel_renewal: {str(e)}")
        return {
            "success": False,
            "message": f"Erreur Stripe: {str(e)}"
        }
    except Exception as e:
        logger.error(f"Unexpected error in cancel_renewal: {str(e)}")
        return {
            "success": False,
            "message": "Erreur interne du serveur"
        }

@router.post("/reactivate-renewal")
async def reactivate_subscription_renewal(current_user: dict = Depends(get_current_user)):
    """
    Réactive le renouvellement automatique de l'abonnement.
    """
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venue accounts can manage subscriptions")
    
    try:
        # Récupérer le stripe_subscription_id de l'utilisateur
        user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
        
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
        stripe_subscription_id = user.get("stripe_subscription_id")
        
        if not stripe_subscription_id:
            return {
                "success": False,
                "message": "Aucun abonnement actif trouvé"
            }
        
        # Réactiver le renouvellement dans Stripe
        subscription = stripe.Subscription.modify(
            stripe_subscription_id,
            cancel_at_period_end=False
        )
        
        # Mettre à jour l'utilisateur dans la BD
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {
                "subscription_cancel_at_period_end": False,
                "subscription_reactivated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {
            "success": True,
            "message": "Le renouvellement automatique a été réactivé.",
            "next_billing_date": datetime.fromtimestamp(subscription.current_period_end, tz=timezone.utc).isoformat()
        }
    
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error in reactivate_renewal: {str(e)}")
        return {
            "success": False,
            "message": f"Erreur Stripe: {str(e)}"
        }
    except HTTPException:
        # Re-raise HTTPException for proper FastAPI handling (404, 403)
        raise
    except Exception as e:
        logger.error(f"Unexpected error in reactivate_renewal: {str(e)}")
        return {
            "success": False,
            "message": "Erreur interne du serveur"
        }


@router.post("/simulate-successful-payment")
async def simulate_successful_payment(current_user: dict = Depends(get_current_user)):
    """
    Endpoint temporaire pour simuler un paiement réussi et activer l'abonnement
    À UTILISER UNIQUEMENT POUR LES TESTS QUAND LE WEBHOOK NE FONCTIONNE PAS
    """
    try:
        # Calculer la date de fin d'abonnement (1 mois à partir de maintenant)
        from dateutil.relativedelta import relativedelta
        end_date = datetime.now(timezone.utc) + relativedelta(months=1)
        
        # Mise à jour du statut d'abonnement
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {
                "subscription_status": "active",
                "has_active_subscription": True,
                "subscription_started": datetime.now(timezone.utc).isoformat(),
                "subscription_end_date": end_date.isoformat(),
                "subscription_cancel_at_period_end": False,
                "trial_end": None,
                "trial_days_left": None
            }}
        )
        
        logger.info(f"Simulated successful payment for user {current_user['id']}")
        
        return {
            "success": True,
            "message": "Abonnement activé avec succès",
            "subscription_status": "active",
            "subscription_end_date": end_date.isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error simulating payment: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de la simulation du paiement")
