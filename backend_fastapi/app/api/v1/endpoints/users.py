"""
User API endpoints using SQLAlchemy ORM.

This module provides endpoints for user management including:
- List users
- Get user details
- Update user
- Delete user
- User settings
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import (
    get_current_active_user,
    require_admin
)
from app.database import get_session
from app.models import User
from app.schemas.user import (
    UserResponse,
    UserUpdate,
    UserSettings
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "",
    response_model=List[UserResponse],
    summary="List Users",
    description="Get a list of all users (admin/developer only)."
)
async def list_users(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        50, ge=1, le=100, description="Number of records to return"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    role: Optional[str] = Query(None, description="Filter by global role"),
    current_user: UserResponse = Depends(require_admin),
    db: AsyncSession = Depends(get_session)
):
    """
    List all users with pagination and filtering.

    **Permissions**: Admin or Developer

    Query parameters:
    - **skip**: Number of records to skip (for pagination)
    - **limit**: Maximum records to return (max 100)
    - **search**: Search query for name or email
    - **role**: Filter by global role
    """
    stmt = select(User)

    # Apply search filter
    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.where(or_(
            User.full_name.ilike(search_pattern),
            User.email.ilike(search_pattern)
        ))

    # Apply role filter
    if role:
        stmt = stmt.where(User.global_role == role)

    # Order and pagination
    stmt = stmt.order_by(User.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(stmt)
    users = result.scalars().all()

    return [UserResponse.model_validate(user) for user in users]


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get User",
    description="Get details of a specific user."
)
async def get_user(
    user_id: UUID,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Get user by ID.

    Users can view their own profile. Admins/developers can view any user.
    """
    # Allow users to view their own profile or admins/developers to view any
    if str(current_user.id) != str(user_id) and current_user.global_role not in ["admin", "developer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own profile"
        )

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserResponse.model_validate(user)


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update User",
    description="Update user details."
)
async def update_user(
    user_id: UUID,
    user_update: UserUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Update user details.

    Users can update their own profile. Admins/developers can update any user.

    **Note**: Use dedicated endpoints for:
    - Changing password: `POST /api/auth/change-password`
    - Updating roles: `PUT /api/auth/update-role`
    """
    # Allow users to update their own profile or admins/developers to update any
    if str(current_user.id) != str(user_id) and current_user.global_role not in ["admin", "developer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile"
        )

    # Get existing user
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update allowed fields
    update_data = user_update.model_dump(exclude_unset=True)

    # Prevent non-admin users from changing their global_role
    if "global_role" in update_data and current_user.global_role not in ["admin", "developer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot change your own role"
        )

    # Only admins/developers can toggle activation status
    if "is_active" in update_data and current_user.global_role not in ["admin", "developer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot change activation status"
        )

    # Check email uniqueness if changing email
    if "email" in update_data and update_data["email"] != user.email:
        check_stmt = select(User).where(User.email == update_data["email"])
        check_result = await db.execute(check_stmt)
        if check_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    # Apply updates
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete User",
    description="Delete a user (admin/developer only)."
)
async def delete_user(
    user_id: UUID,
    current_user: UserResponse = Depends(require_admin),
    db: AsyncSession = Depends(get_session)
):
    """
    Delete a user permanently.

    **Permissions**: Admin or Developer

    This will also delete all user_societies relationships.
    """
    # Prevent self-deletion
    if str(current_user.id) == str(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )

    # Check if user exists
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Delete user (cascade will handle user_societies)
    await db.delete(user)
    await db.commit()


@router.get(
    "/profile/settings",
    response_model=UserSettings,
    summary="Get User Settings",
    description="Get current user's settings."
)
async def get_user_settings(
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Get the authenticated user's settings.

    Returns notification preferences and other user-specific settings.
    """
    stmt = select(User).where(User.id == current_user.id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Settings is a JSON column
    settings: Dict[str, Any] = user.settings or {}  # type: ignore[assignment]
    return UserSettings(**settings)


@router.put(
    "/profile/settings",
    response_model=UserSettings,
    summary="Update User Settings",
    description="Update current user's settings."
)
async def update_user_settings(
    settings_update: UserSettings,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Update the authenticated user's settings.

    Allows updating notification preferences and other user-specific settings.
    """
    stmt = select(User).where(User.id == current_user.id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update settings (merge with existing)
    # type: ignore[assignment]
    current_settings: Dict[str, Any] = user.settings or {}
    updated_settings: Dict[str, Any] = {**current_settings, **
                                        settings_update.model_dump(exclude_unset=True)}
    user.settings = updated_settings  # type: ignore[assignment]

    await db.commit()
    await db.refresh(user)

    return UserSettings(**user.settings)


@router.post(
    "/profile/avatar",
    response_model=UserResponse,
    summary="Update Avatar",
    description="Update current user's avatar URL."
)
async def update_avatar(
    avatar_url: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Update the authenticated user's avatar URL.

    **Note**: This endpoint expects the avatar to be uploaded separately
    (e.g., to cloud storage) and accepts the resulting URL.
    """
    stmt = select(User).where(User.id == current_user.id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.avatar_url = avatar_url  # type: ignore[assignment]
    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)
