from .auth import router as auth_router
from .account import router as account_router
from .uploads import router as uploads_router
from .payments import router as payments_router
from .webhooks import router as webhooks_router

__all__ = [
    'auth_router',
    'account_router',
    'uploads_router',
    'payments_router',
    'webhooks_router'
]
