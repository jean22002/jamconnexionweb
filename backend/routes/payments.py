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
