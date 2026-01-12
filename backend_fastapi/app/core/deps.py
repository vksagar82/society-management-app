"""
Authentication dependencies for route protection.

This module provides FastAPI dependencies for authenticating requests
and checking user permissions based on roles and scopes.
"""

from typing import Any, List, Optional, cast

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.database import get_session
from app.models import User
from app.schemas.user import UserInDB

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_session),
) -> UserInDB:
    """
    Get the current authenticated user from JWT token.

    Args:
        credentials: HTTP authorization credentials with Bearer token
        db: Database session

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
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User account is disabled"
        )

    return UserInDB(
        id=cast(Any, user.id),
        email=cast(Any, user.email),
        phone=cast(Any, user.phone),
        full_name=cast(Any, user.full_name),
        global_role=cast(Any, user.global_role),
        is_active=cast(Any, user.is_active),
        avatar_url=cast(Any, user.avatar_url),
        settings=cast(Any, user.settings),
        created_at=cast(Any, user.created_at),
        updated_at=cast(Any, user.updated_at),
        last_login=cast(Any, user.last_login),
    )


async def get_current_active_user(
    current_user: UserInDB = Depends(get_current_user),
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
            status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user"
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
        current_user: UserInDB = Depends(get_current_active_user),
    ) -> UserInDB:
        if current_user.global_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {', '.join(allowed_roles)}",
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
    db: AsyncSession,
    required_role: Optional[str] = None,
) -> bool:
    """
    Check if user has access to a specific society.

    Args:
        user: Current user
        society_id: Society ID to check access for
        db: Database session
        required_role: Optional specific role required within society

    Returns:
        bool: True if user has access, raises HTTPException otherwise

    Raises:
        HTTPException: If user doesn't have access
    """
    from sqlalchemy import and_

    from app.models import Society, UserSociety

    # Developers have access to all societies
    if user.global_role == "developer":
        return True

    # Check if society is approved first
    society_stmt = select(Society).where(Society.id == society_id)
    society_result = await db.execute(society_stmt)
    society = society_result.scalar_one_or_none()

    if not society:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Society not found"
        )

    if society.approval_status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Society is not approved yet. Only developers can access pending societies.",
        )

    # Check user-society mapping
    stmt = select(UserSociety).where(
        and_(UserSociety.user_id == user.id, UserSociety.society_id == society_id)
    )
    result = await db.execute(stmt)
    mapping = result.scalar_one_or_none()

    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="No access to this society"
        )

    if mapping.approval_status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Society membership not approved",
        )

    if required_role and mapping.role != required_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Required role '{required_role}' within society",
        )

    return True


async def get_user_society_role(
    user: UserInDB, society_id: str, db: AsyncSession
) -> Optional[str]:
    """
    Get user's role in a specific society.

    Args:
        user: Current user
        society_id: Society ID
        db: Database session

    Returns:
        Optional[str]: User's role in society (admin, manager, member) or None
    """
    from sqlalchemy import and_

    from app.models import UserSociety

    # Developers are treated as admins in all societies
    if user.global_role == "developer":
        return "admin"

    stmt = select(UserSociety).where(
        and_(
            UserSociety.user_id == user.id,
            UserSociety.society_id == society_id,
            UserSociety.approval_status == "approved",
        )
    )
    result = await db.execute(stmt)
    mapping = result.scalar_one_or_none()

    return cast(Optional[str], mapping.role if mapping else None)


async def require_society_permission(
    user: UserInDB,
    society_id: str,
    db: AsyncSession,
    allowed_roles: List[str] = ["admin", "manager", "member"],
    action: str = "access",
) -> str:
    """
    Check if user has required permission in a society.

    Args:
        user: Current user
        society_id: Society ID
        db: Database session
        allowed_roles: List of roles allowed to perform the action
        action: Description of action being performed (for error message)

    Returns:
        str: User's role in the society

    Raises:
        HTTPException: If user doesn't have required permission
    """
    # First check basic society access
    await check_society_access(user, society_id, db)

    # Get user's role
    role = await get_user_society_role(user, society_id, db)

    if not role or role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions to {action}. Required roles: {', '.join(allowed_roles)}",
        )

    return role
