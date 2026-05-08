"""
Cache Headers Middleware for FastAPI
Automatically adds appropriate Cache-Control headers based on route type
"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import re


class CacheHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add appropriate Cache-Control headers based on route patterns
    
    Categories:
    1. Static Assets (JS/CSS/Images): 1 year cache
    2. Public API Data: 5 minutes cache
    3. Semi-Dynamic Data (Events): 1 minute cache
    4. Private User Data: No cache
    5. Mutations (POST/PUT/DELETE): No cache
    """
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        
        # Define route patterns for each cache strategy
        self.static_patterns = [
            r'/api/uploads/.*\.(jpg|jpeg|png|gif|svg|webp|ico|css|js|woff|woff2|ttf)$',
            r'/static/.*',
        ]
        
        self.public_data_patterns = [
            r'^/api/venues/?$',
            r'^/api/venues/[a-zA-Z0-9-]+/?$',
            r'^/api/musicians/?$',
            r'^/api/bands/?$',
        ]
        
        self.semi_dynamic_patterns = [
            r'/api/venues/.+/jams$',
            r'/api/venues/.+/concerts$',
            r'/api/venues/.+/karaoke$',
            r'/api/venues/.+/spectacles$',
            r'/api/calendar/events',
        ]
        
        self.private_data_patterns = [
            r'/api/venues/me',
            r'/api/musicians/me',
            r'/api/notifications',
            r'/api/messages',
        ]
    
    def _match_patterns(self, path: str, patterns: list) -> bool:
        """Check if path matches any pattern in the list"""
        return any(re.search(pattern, path) for pattern in patterns)
    
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        
        path = request.url.path
        method = request.method
        
        # Skip cache headers for mutations
        if method in ['POST', 'PUT', 'DELETE', 'PATCH']:
            response.headers['Cache-Control'] = 'no-store'
            return response
        
        # Static assets: long-term cache
        if self._match_patterns(path, self.static_patterns):
            response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
            response.headers['CDN-Cache-Control'] = 'public, max-age=31536000'
        
        # Public data: medium-term cache
        elif self._match_patterns(path, self.public_data_patterns):
            response.headers['Cache-Control'] = 'public, max-age=300, stale-while-revalidate=600'
            response.headers['CDN-Cache-Control'] = 'public, max-age=600'
            response.headers['Vary'] = 'Accept-Encoding'
        
        # Semi-dynamic data: short-term cache
        elif self._match_patterns(path, self.semi_dynamic_patterns):
            response.headers['Cache-Control'] = 'public, max-age=60, stale-while-revalidate=300'
            response.headers['CDN-Cache-Control'] = 'public, max-age=120'
        
        # Private data: no cache
        elif self._match_patterns(path, self.private_data_patterns):
            response.headers['Cache-Control'] = 'private, no-cache, must-revalidate'
        
        # Default for authenticated routes: no cache
        elif 'Authorization' in request.headers or '/me' in path:
            response.headers['Cache-Control'] = 'private, no-cache, must-revalidate'
        
        # Default for all other GET requests: short cache
        else:
            response.headers['Cache-Control'] = 'public, max-age=60'
        
        return response
