#!/usr/bin/env python
"""Generate a valid JWT dev/admin token for testing."""
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict

import jwt

SECRET_KEY = "Hy07HivWRcrnAbOQ+Or9xsDEv89cKIWmFVLSzvVqbmzGPhXJk6x+o5vaTuyTbCxQl0g8GMyqJbgJy4c3MJyJ0w=="  # nosec B105 - Dev token generation only
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Use a fixed UUID for the dev user
DEV_USER_ID = str(uuid.UUID("00000000-0000-0000-0000-000000000001"))

to_encode: Dict[str, Any] = {"sub": DEV_USER_ID, "scope": "developer admin"}
expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
to_encode.update({"exp": int(expire.timestamp())})
token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
print(token)
