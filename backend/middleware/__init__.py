"""
Middleware package for FastAPI optimizations
"""
from .cache_headers import CacheHeadersMiddleware

__all__ = ['CacheHeadersMiddleware']
