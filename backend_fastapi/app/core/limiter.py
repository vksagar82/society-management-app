"""Rate limiter configuration for API endpoints.

Global rate limiting: 100 requests per minute per IP address
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

# Global limiter instance
# Default: 100 requests per minute per IP address
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"]
)
