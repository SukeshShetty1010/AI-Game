import os
import json
import hashlib
from typing import Dict, Any, Optional
import time

# Cache settings
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "cache")
CACHE_EXPIRY = 60 * 60 * 24  # 24 hours in seconds

def _ensure_cache_dir():
    """Ensure the cache directory exists."""
    os.makedirs(CACHE_DIR, exist_ok=True)

def _get_cache_key(prompt: str) -> str:
    """
    Generate a cache key from the prompt.
    
    Args:
        prompt: The user's prompt
        
    Returns:
        A hash of the prompt to use as the cache key
    """
    # Create a hash of the prompt to use as the cache key
    return hashlib.md5(prompt.encode()).hexdigest()

def get_cached_response(prompt: str) -> Optional[Dict[str, Any]]:
    """
    Check if a cached response exists for the given prompt.
    
    Args:
        prompt: The user's prompt
        
    Returns:
        The cached response if it exists and is valid, None otherwise
    """
    _ensure_cache_dir()
    cache_key = _get_cache_key(prompt)
    cache_file = os.path.join(CACHE_DIR, f"{cache_key}.json")
    
    if not os.path.exists(cache_file):
        return None
    
    try:
        with open(cache_file, "r") as f:
            cache_data = json.load(f)
        
        # Check if the cache has expired
        if time.time() - cache_data.get("timestamp", 0) > CACHE_EXPIRY:
            return None
        
        return cache_data.get("response")
    except (json.JSONDecodeError, KeyError, IOError):
        # If the cache file is corrupted or can't be read, ignore it
        return None

def cache_response(prompt: str, response: Dict[str, Any]) -> None:
    """
    Cache a response for the given prompt.
    
    Args:
        prompt: The user's prompt
        response: The response to cache
    """
    _ensure_cache_dir()
    cache_key = _get_cache_key(prompt)
    cache_file = os.path.join(CACHE_DIR, f"{cache_key}.json")
    
    cache_data = {
        "timestamp": time.time(),
        "prompt": prompt,
        "response": response
    }
    
    try:
        with open(cache_file, "w") as f:
            json.dump(cache_data, f, indent=2)
    except IOError:
        # If the cache file can't be written, just ignore it
        pass 