"""
Rate Limiting Configuration for FastAPI using SlowAPI
Protects critical endpoints from abuse and DDoS attacks
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi import Request, Response
from fastapi.responses import JSONResponse


# Create limiter instance
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200/minute"],  # Default limit for all routes
    storage_uri="memory://",  # In-memory storage (use Redis for production)
    strategy="fixed-window"
)


# Custom rate limit exceeded handler
def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """Custom error response when rate limit is exceeded"""
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "message": f"Too many requests. Please try again later.",
            "retry_after": exc.detail
        },
        headers={"Retry-After": str(exc.detail)}
    )


# Rate limit decorators by category
# Usage: @router.post("/endpoint", dependencies=[Depends(strict_rate_limit)])

# CRITICAL: Authentication & Security
AUTH_RATE_LIMIT = "10/5minutes"  # Login attempts
REGISTER_RATE_LIMIT = "5/hour"  # Account creation
RESET_PASSWORD_RATE_LIMIT = "3/hour"  # Password reset

# IMPORTANT: Content Creation
CREATE_PROFILE_RATE_LIMIT = "10/hour"  # Profile creation
CREATE_EVENT_RATE_LIMIT = "30/hour"  # Event creation
APPLY_RATE_LIMIT = "50/hour"  # Job applications
UPLOAD_RATE_LIMIT = "20/hour"  # File uploads
MESSAGE_RATE_LIMIT = "20/minute"  # Messaging
BROADCAST_RATE_LIMIT = "10/hour"  # Broadcast messages

# MODERATE: Search & Read Operations
SEARCH_RATE_LIMIT = "50/minute"  # Search queries
READ_RATE_LIMIT = "100/minute"  # General read operations


# Decorator helper functions
def get_rate_limit_for_route(path: str, method: str) -> str:
    """
    Returns appropriate rate limit string based on route and method
    Used by the middleware to apply limits automatically
    """
    
    # Authentication routes (CRITICAL)
    if "/api/auth/login" in path and method == "POST":
        return AUTH_RATE_LIMIT
    if "/api/auth/register" in path and method == "POST":
        return REGISTER_RATE_LIMIT
    if "/api/auth/reset-password" in path and method == "POST":
        return RESET_PASSWORD_RATE_LIMIT
    
    # Profile creation (IMPORTANT)
    if path in ["/api/venues", "/api/musicians"] and method == "POST":
        return CREATE_PROFILE_RATE_LIMIT
    
    # Event creation (IMPORTANT)
    if method == "POST" and any(event_type in path for event_type in ["/jams", "/concerts", "/karaoke", "/spectacles"]):
        return CREATE_EVENT_RATE_LIMIT
    
    # Messaging (IMPORTANT)
    if "/api/messages" in path and method == "POST":
        return MESSAGE_RATE_LIMIT
    if "/api/broadcast" in path and method == "POST":
        return BROADCAST_RATE_LIMIT
    
    # File uploads (IMPORTANT)
    if "/api/uploads" in path and method == "POST":
        return UPLOAD_RATE_LIMIT
    
    # Applications (IMPORTANT)
    if "/api/applications" in path and method == "POST":
        return APPLY_RATE_LIMIT
    
    # Search operations (MODERATE)
    if "search" in path or "nearby" in path:
        return SEARCH_RATE_LIMIT
    
    # Read operations (MODERATE)
    if method == "GET":
        return READ_RATE_LIMIT
    
    # Default for all other routes
    return "200/minute"
