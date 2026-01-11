"""
Authentication and authorization utilities.

This module provides JWT token generation/validation and password hashing
utilities for secure authentication.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Union, cast
from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.hash import pbkdf2_sha256

from config import settings

# Password hashing context. Switched to pbkdf2_sha256 to avoid bcrypt backend
# dependencies and length limits. Existing bcrypt hashes should be migrated if
# persisted in prod data; tests regenerate fixtures each run.
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    default="pbkdf2_sha256",
    deprecated="auto",
)


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.

    Args:
        password: Plain text password

    Returns:
        str: Hashed password
    """
    # Truncate to 10 bytes per policy.
    safe_password = password[:10]
    return pbkdf2_sha256.hash(safe_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.

    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to compare against

    Returns:
        bool: True if password matches, False otherwise
    """
    # Verify using pbkdf2_sha256; legacy bcrypt hashes should be re-hashed.
    return cast(bool, pwd_context.verify(plain_password[:10], hashed_password))


def create_access_token(
    data: Union[Dict[str, Any], str],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.

    Args:
        data: Data to encode in the token
        expires_delta: Optional expiration time delta

    Returns:
        str: Encoded JWT token
    """
    # Accept either a dict payload or a subject string; normalize to dict.
    to_encode = {"sub": data} if isinstance(data, str) else data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode.update({"exp": int(expire.timestamp())})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm
    )
    return cast(str, encoded_jwt)


def create_refresh_token(data: Union[Dict[str, Any], str]) -> str:
    """
    Create a JWT refresh token.

    Args:
        data: Data to encode in the token

    Returns:
        str: Encoded JWT refresh token
    """
    to_encode = {"sub": data} if isinstance(data, str) else data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": int(expire.timestamp()), "type": "refresh"})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm
    )
    return cast(str, encoded_jwt)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate a JWT token.

    Args:
        token: JWT token to decode

    Returns:
        Optional[Dict[str, Any]]: Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        return cast(Dict[str, Any], payload)
    except JWTError:
        return None
