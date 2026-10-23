import os


def get_stripe_key() -> str:
    """Build 241 — clé Stripe unique pour tout le serveur (STRIPE_SECRET_KEY prioritaire)."""
    return os.environ.get("STRIPE_SECRET_KEY") or os.environ.get("STRIPE_API_KEY")


MUSICIAN_TRIAL_DAYS = {"monthly": 60, "yearly": 90}
VENUE_TRIAL_DAYS = {"monthly": (180, 90), "yearly": (210, 120)}  # (200 premiers, au-delà)
MUSICIAN_YEARLY_CENTS = 4990
VENUE_YEARLY_CENTS = 9999
