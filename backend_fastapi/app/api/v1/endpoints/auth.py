"""
Authentication API endpoints using SQLAlchemy ORM.

This module provides endpoints for user authentication including:
- Login
- Signup
- Token refresh
- Password reset
- User profile
"""

from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.core.deps import get_current_user, get_current_active_user
from app.database import get_session
from app.models import User, UserSociety
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    TokenResponse,
    SignupRequest,
)
from app.schemas.user import UserResponse, PasswordChange, PasswordReset, PasswordResetConfirm
from app.utils.email import send_password_reset_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="User Registration",
    description="Register a new user account with email and password."
)
async def signup(
    signup_data: SignupRequest,
    db: AsyncSession = Depends(get_session)
):
    """
    Register a new user.

    - **email**: Valid email address (must be unique)
    - **phone**: Phone number (must be unique)
    - **full_name**: User's full name
    - **password**: Strong password (min 8 chars, with uppercase, lowercase, digit)
    - **society_id**: Optional society ID to join upon registration

    Returns the created user details (without password).
    """
    # Check if user already exists
    stmt = select(User).where(
        (User.email == signup_data.email) | (User.phone == signup_data.phone)
    )
    existing_user = await db.scalar(stmt)

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or phone already exists"
        )

    # Hash password with a 10-byte cap (per current policy)
    safe_password = signup_data.password[:10]
    password_hash = hash_password(safe_password)

    # Create user
    user = User(
        id=uuid4(),
        email=signup_data.email,
        phone=signup_data.phone,
        full_name=signup_data.full_name,
        password_hash=password_hash,
        global_role="member",
        is_active=True
    )

    db.add(user)
    await db.flush()

    # If society_id provided, create pending membership
    if signup_data.society_id:
        user_society = UserSociety(
            id=uuid4(),
            user_id=user.id,
            society_id=uuid4() if isinstance(signup_data.society_id,
                                             str) else signup_data.society_id,
            role="member",
            approval_status="pending"
        )
        db.add(user_society)

    await db.commit()
    await db.refresh(user)

    return UserResponse(**user.__dict__)


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="User Login",
    description="Authenticate user and receive access and refresh tokens."
)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_session)
):
    """
    Authenticate user and return JWT tokens.

    - **email**: User's email address
    - **password**: User's password

    Returns access token, refresh token, and user information.
    """
    # Get user by email
    stmt = select(User).where(User.email == login_data.email)
    user = await db.scalar(stmt)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.add(user)
    await db.commit()

    # Create tokens
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    user_dict = {
        "id": str(user.id),
        "email": user.email,
        "phone": user.phone,
        "full_name": user.full_name,
        "global_role": user.global_role,
        "is_active": user.is_active,
        "avatar_url": user.avatar_url,
        "settings": user.settings,
        "created_at": user.created_at,
        "updated_at": user.updated_at
    }

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_dict
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh Access Token",
    description="Get a new access token using a refresh token."
)
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_session)
):
    """
    Get a new access token using a refresh token.

    - **refresh_token**: Valid refresh token

    Returns a new access token.
    """
    payload = decode_token(request.refresh_token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    # Verify user exists
    stmt = select(User).where(User.id == user_id)
    user = await db.scalar(stmt)

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    access_token = create_access_token(user_id)

    return TokenResponse(access_token=access_token)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Current User",
    description="Get the profile of the currently authenticated user."
)
async def get_me(
    current_user: UserResponse = Depends(get_current_active_user)
) -> UserResponse:
    """
    Get the profile of the currently authenticated user.

    Returns user details including email, phone, name, and role.
    """
    return current_user


@router.post(
    "/forgot-password",
    summary="Request Password Reset",
    description="Request a password reset link via email."
)
async def forgot_password(
    request: PasswordReset,
    db: AsyncSession = Depends(get_session)
):
    """
    Request a password reset.

    - **email**: User's email address

    Sends a password reset link via email if account exists.
    """
    stmt = select(User).where(User.email == request.email)
    user = await db.scalar(stmt)

    if not user:
        # Don't reveal if email exists
        return {"message": "If account exists, password reset link has been sent"}

    # Generate reset token
    reset_token = str(uuid4())
    reset_expiry = datetime.utcnow() + timedelta(hours=24)

    user.reset_token = reset_token
    user.reset_token_expiry = reset_expiry
    db.add(user)
    await db.commit()

    # Send email
    await send_password_reset_email(user.email, reset_token)

    return {"message": "Password reset link sent to your email"}


@router.post(
    "/reset-password",
    summary="Reset Password",
    description="Reset password using the token from email."
)
async def reset_password(
    request: PasswordResetConfirm,
    db: AsyncSession = Depends(get_session)
):
    """
    Reset password using token.

    - **token**: Password reset token from email
    - **new_password**: New password

    Returns success message if password was reset.
    """
    stmt = select(User).where(User.reset_token == request.token)
    user = await db.scalar(stmt)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    if user.reset_token_expiry and user.reset_token_expiry < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )

    # Update password
    user.password_hash = hash_password(request.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.add(user)
    await db.commit()

    return {"message": "Password reset successfully"}


@router.post(
    "/change-password",
    summary="Change Password",
    description="Change password for authenticated user."
)
async def change_password(
    request: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Change password for authenticated user.

    - **current_password**: Current password
    - **new_password**: New password

    Returns success message if password was changed.
    """
    # Fetch fresh user from DB
    stmt = select(User).where(User.id == current_user.id)
    user = await db.scalar(stmt)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not verify_password(request.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    user.password_hash = hash_password(request.new_password)
    db.add(user)
    await db.commit()

    return {"message": "Password changed successfully"}
