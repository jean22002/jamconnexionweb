from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
import logging
import json
import stripe

router = APIRouter(prefix="/webhook", tags=["Webhooks"])

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

logger = logging.getLogger(__name__)

STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')

stripe.api_key = STRIPE_API_KEY

@router.post("/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events with signature verification"""
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")
    
    if not STRIPE_WEBHOOK_SECRET:
        logger.warning("Webhook secret not configured - accepting webhook without verification")
        try:
            event = stripe.Event.construct_from(
                json.loads(payload), stripe.api_key
            )
        except Exception as e:
            logger.error(f"Error parsing webhook payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid payload")
    else:
        # Verify webhook signature
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid webhook signature: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    try:
        if event.type == 'checkout.session.completed':
            session = event.data.object
            logger.info(f"Processing checkout.session.completed: {session.id}")
            
            # Try to get user_id from client_reference_id or metadata
            user_id = session.get('client_reference_id') or session.get('metadata', {}).get('user_id')
            
            # If no user_id, try to find user by email (for payment links)
            customer_email = session.get('customer_details', {}).get('email') or session.get('customer_email')
            
            user = None
            if user_id:
                user = await db.users.find_one({"id": user_id}, {"_id": 0})
                logger.info(f"Found user by ID: {user_id}")
            elif customer_email:
                user = await db.users.find_one({"email": customer_email}, {"_id": 0})
                if user:
                    logger.info(f"Found user by email: {customer_email}")
                else:
                    logger.warning(f"No user found with email: {customer_email}")
            
            if user:
                # Get subscription details from Stripe
                subscription_id = session.get('subscription')
                
                update_data = {
                    "subscription_status": "active",
                    "has_active_subscription": True,
                    "subscription_started": datetime.now(timezone.utc).isoformat(),
                    "trial_end": None,  # Clear trial status
                    "trial_days_left": None  # Clear trial days
                }
                
                # If subscription ID exists, store it and get end date
                if subscription_id:
                    try:
                        subscription = stripe.Subscription.retrieve(subscription_id)
                        update_data["stripe_subscription_id"] = subscription_id
                        update_data["stripe_customer_id"] = subscription.customer
                        update_data["subscription_end_date"] = datetime.fromtimestamp(
                            subscription.current_period_end, tz=timezone.utc
                        ).isoformat()
                        update_data["subscription_cancel_at_period_end"] = subscription.cancel_at_period_end
                        logger.info(f"Retrieved subscription details: {subscription_id}")
                    except Exception as e:
                        logger.error(f"Error retrieving subscription: {e}")
                
                # Update user subscription status
                result = await db.users.update_one(
                    {"id": user["id"]},
                    {"$set": update_data}
                )
                logger.info(f"Subscription activated for user {user['id']} (email: {user['email']}), matched: {result.matched_count}, modified: {result.modified_count}")
                
                # Update venue subscription status if user is a venue
                if user.get("role") == "venue":
                    await db.venues.update_one(
                        {"user_id": user["id"]},
                        {"$set": {
                            "subscription_status": "active",
                            "trial_end": None,
                            "trial_days_left": None
                        }}
                    )
                    logger.info(f"Updated venue subscription for user {user['id']}")
                
                # Update transaction status
                await db.payment_transactions.update_one(
                    {"session_id": session.id},
                    {"$set": {
                        "status": "completed",
                        "payment_status": "paid",
                        "completed_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
            else:
                logger.error(f"Could not find user for checkout session {session.id}. Email: {customer_email}, ID: {user_id}")
        
        elif event.type == 'customer.subscription.deleted':
            # Handle subscription cancellation
            subscription = event.data.object
            customer_id = subscription.customer
            
            # Find user by Stripe customer ID if stored
            user = await db.users.find_one({"stripe_customer_id": customer_id}, {"_id": 0})
            if user:
                await db.users.update_one(
                    {"id": user["id"]},
                    {"$set": {
                        "subscription_status": "cancelled",
                        "has_active_subscription": False,
                        "subscription_cancelled": datetime.now(timezone.utc).isoformat()
                    }}
                )
                logger.info(f"Subscription cancelled for user {user['id']}")
        
        return {"status": "success"}
    
    except Exception as e:
        logger.error(f"Error processing webhook event: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")
