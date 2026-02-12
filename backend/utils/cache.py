"""
Simple In-Memory Cache Utility using cachetools
Alternative to Redis for simpler deployments
"""
from cachetools import TTLCache
from functools import wraps
import asyncio
from typing import Callable, Any, Optional
import hashlib
import json

# Create global cache instance
# maxsize=1000 items, TTL=300 seconds (5 minutes)
cache_store = TTLCache(maxsize=1000, ttl=300)

# Separate cache for stats with longer TTL (10 minutes)
stats_cache = TTLCache(maxsize=100, ttl=600)


def generate_cache_key(func_name: str, *args, **kwargs) -> str:
    """Generate a unique cache key from function name and arguments"""
    key_data = {
        'func': func_name,
        'args': args,
        'kwargs': kwargs
    }
    key_string = json.dumps(key_data, sort_keys=True, default=str)
    return hashlib.md5(key_string.encode()).hexdigest()


def cache_result(ttl: int = 300, cache_instance: TTLCache = None):
    """
    Decorator to cache function results
    
    Args:
        ttl: Time to live in seconds
        cache_instance: Specific cache instance to use (default: cache_store)
    
    Usage:
        @cache_result(ttl=600)
        async def get_stats():
            # expensive operation
            return data
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Use specified cache or default
            cache = cache_instance if cache_instance is not None else cache_store
            
            # Generate cache key
            cache_key = generate_cache_key(func.__name__, *args, **kwargs)
            
            # Check if result is in cache
            if cache_key in cache:
                return cache[cache_key]
            
            # Call function and cache result
            result = await func(*args, **kwargs)
            cache[cache_key] = result
            
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            cache = cache_instance if cache_instance is not None else cache_store
            cache_key = generate_cache_key(func.__name__, *args, **kwargs)
            
            if cache_key in cache:
                return cache[cache_key]
            
            result = func(*args, **kwargs)
            cache[cache_key] = result
            
            return result
        
        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


def invalidate_cache(pattern: Optional[str] = None):
    """
    Invalidate cache entries
    
    Args:
        pattern: If None, clear all. If provided, clear matching keys
    """
    if pattern is None:
        cache_store.clear()
        stats_cache.clear()
    else:
        # Clear entries matching pattern
        keys_to_delete = [k for k in cache_store.keys() if pattern in k]
        for key in keys_to_delete:
            del cache_store[key]


def get_cache_stats() -> dict:
    """Get cache statistics"""
    return {
        'cache_store': {
            'size': len(cache_store),
            'maxsize': cache_store.maxsize,
            'ttl': cache_store.ttl
        },
        'stats_cache': {
            'size': len(stats_cache),
            'maxsize': stats_cache.maxsize,
            'ttl': stats_cache.ttl
        }
    }


# Convenience function for stats caching
def cache_stats(ttl: int = 600):
    """Decorator specifically for stats endpoints with longer TTL"""
    return cache_result(ttl=ttl, cache_instance=stats_cache)
