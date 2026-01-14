from .auth import router as auth_router
from .musicians import router as musicians_router
from .venues import router as venues_router
from .events import router as events_router
from .messages import router as messages_router
from .payments import router as payments_router
from .reviews import router as reviews_router
from .uploads import router as uploads_router

__all__ = [
    'auth_router',
    'musicians_router',
    'venues_router',
    'events_router',
    'messages_router',
    'payments_router',
    'reviews_router',
    'uploads_router'
]
