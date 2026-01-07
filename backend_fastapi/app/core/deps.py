"""
Authentication dependencies for route protection.

This module provides FastAPI dependencies for authenticating requests
and checking user permissions based on roles and scopes.
"""

from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import decode_token
from app.schemas.user import UserInDB

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserInDB:
    """
    Get the current authenticated user from JWT token.

    Args:
        credentials: HTTP authorization credentials with Bearer token

    Returns:
        UserInDB: Current authenticated user

    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch user from database
    query = """
        SELECT id, email, phone, full_name, global_role, is_active, 
               avatar_url, settings, created_at, updated_at
        FROM users
        WHERE id = :user_id
    """
    user = await database.fetch_one(query=query, values={"user_id": user_id})

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )

    return UserInDB(**dict(user))


async def get_current_active_user(
    current_user: UserInDB = Depends(get_current_user)
) -> UserInDB:
    """
    Get current active user.

    Args:
        current_user: Current authenticated user

    Returns:
        UserInDB: Current active user

    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


def require_roles(allowed_roles: List[str]):
    """
    Dependency factory to check if user has required role.

    Args:
        allowed_roles: List of allowed roles

    Returns:
        Dependency function that checks user role
    """
    async def role_checker(
        current_user: UserInDB = Depends(get_current_active_user)
    ) -> UserInDB:
        if current_user.global_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user

    return role_checker


# Common role dependencies
require_developer = require_roles(["developer"])
require_admin = require_roles(["developer", "admin"])
require_manager = require_roles(["developer", "admin", "manager"])


async def check_society_access(
    user: UserInDB,
    society_id: str,
    required_role: Optional[str] = None
) -> bool:
    """
    Check if user has access to a specific society.

    Args:
        user: Current user
        society_id: Society ID to check access for
        required_role: Optional specific role required within society

    Returns:
        bool: True if user has access, raises HTTPException otherwise

    Raises:
        HTTPException: If user doesn't have access
    """
    # Developers have access to all societies
    if user.global_role == "developer":
        return True

    # Check user-society mapping
    query = """
        SELECT role, approval_status
        FROM user_societies
        WHERE user_id = :user_id AND society_id = :society_id
    """
    mapping = await database.fetch_one(
        query=query,
        values={"user_id": str(user.id), "society_id": society_id}
    )

    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No access to this society"
        )

    if mapping["approval_status"] != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Society membership not approved"
        )

    if required_role and mapping["role"] != required_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Required role '{required_role}' within society"
        )

    return True
