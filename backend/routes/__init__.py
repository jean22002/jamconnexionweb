from .auth import router as auth_router
from .account import router as account_router
from .uploads import router as uploads_router
from .payments import router as payments_router
from .webhooks import router as webhooks_router
from .messages import router as messages_router
from .reviews import router as reviews_router
from .notifications import router as notifications_router
from .venues import router as venues_router
from .musicians import router as musicians_router
from .melomanes import router as melomanes_router
from .events import router as events_router
from .planning import router as planning_router
from .bands import router as bands_router
from .friends import router as friends_router

__all__ = [
    'auth_router',
    'account_router',
    'uploads_router',
    'payments_router',
    'webhooks_router',
    'messages_router',
    'reviews_router',
    'notifications_router',
    'venues_router',
    'musicians_router',
    'melomanes_router',
    'events_router',
    'planning_router',
    'bands_router',
    'friends_router'
]
