"""
backend/app/core/rate_limit.py
------------------------------
In-memory sliding-window token bucket rate limiter for FastAPI endpoints.
Protects AI inference (/api/chat, /api/itinerary/generate) and authentication routes.
"""

import time
from collections import defaultdict
from typing import Dict, List, Callable
from fastapi import Request, HTTPException, status


class SlidingWindowRateLimiter:
    """
    Sliding-window in-memory request counter per client identity.
    Tracks timestamps of requests within a sliding time window.
    """
    def __init__(self, max_requests: int = 20, window_seconds: int = 3600):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.history: Dict[str, List[float]] = defaultdict(list)

    def _get_client_key(self, request: Request) -> str:
        # Check Authorization or Cookie for authenticated identity
        auth = request.headers.get("Authorization")
        if auth and auth.startswith("Bearer "):
            return f"auth:{auth[-16:]}"

        cookie = request.cookies.get("travelsathi_token")
        if cookie:
            return f"cookie:{cookie[-16:]}"

        # Fallback to forwarded IP or direct client host
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return f"ip:{forwarded.split(',')[0].strip()}"

        client_host = request.client.host if request.client else "unknown"
        return f"ip:{client_host}"

    async def __call__(self, request: Request):
        now = time.time()
        client_key = self._get_client_key(request)

        # Filter out timestamps outside the sliding window
        window_start = now - self.window_seconds
        timestamps = [ts for ts in self.history[client_key] if ts > window_start]
        self.history[client_key] = timestamps

        if len(timestamps) >= self.max_requests:
            oldest = timestamps[0]
            retry_after = max(1, int(oldest + self.window_seconds - now))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded: Maximum {self.max_requests} requests per hour allowed for this endpoint.",
                headers={"Retry-After": str(retry_after)}
            )

        self.history[client_key].append(now)


# Standard rate-limiting instances
rate_limit_login = SlidingWindowRateLimiter(max_requests=5, window_seconds=900)
rate_limit_auth = SlidingWindowRateLimiter(max_requests=25, window_seconds=3600)
rate_limit_ai = SlidingWindowRateLimiter(max_requests=20, window_seconds=3600)
rate_limit_itinerary = SlidingWindowRateLimiter(max_requests=20, window_seconds=3600)
rate_limit_hospitals = SlidingWindowRateLimiter(max_requests=20, window_seconds=3600)
