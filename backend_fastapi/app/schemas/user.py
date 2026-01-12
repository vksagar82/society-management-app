"""
User schemas for request/response validation.

This module defines Pydantic models for user-related API operations.
"""

from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, validator


class UserBase(BaseModel):
    """Base user schema with common fields."""

    email: EmailStr = Field(..., description="User email address")
    phone: str = Field(..., min_length=10, max_length=20, description="Phone number")
    full_name: str = Field(..., min_length=2, max_length=255, description="Full name")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL")


class UserCreate(UserBase):
    """Schema for user creation."""

    password: str = Field(..., min_length=8, description="Password (min 8 characters)")

    @validator("password")
    def validate_password(cls, v):
        """Validate password strength."""
        if not any(char.isdigit() for char in v):
            raise ValueError("Password must contain at least one digit")
        if not any(char.isupper() for char in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(char.islower() for char in v):
            raise ValueError("Password must contain at least one lowercase letter")
        return v


class UserUpdate(BaseModel):
    """Schema for user updates."""

    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    avatar_url: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user response."""

    id: UUID
    global_role: str = Field(
        ..., description="Global role: developer, admin, manager, member"
    )
    is_active: bool
    settings: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class UserInDB(UserResponse):
    """User schema with all database fields."""

    last_login: Optional[datetime] = None


class UserWithPassword(UserInDB):
    """User schema including password hash (internal use only)."""

    password_hash: str


class PasswordChange(BaseModel):
    """Schema for password change."""

    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")

    @validator("new_password")
    def validate_password(cls, v):
        """Validate password strength."""
        if not any(char.isdigit() for char in v):
            raise ValueError("Password must contain at least one digit")
        if not any(char.isupper() for char in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(char.islower() for char in v):
            raise ValueError("Password must contain at least one lowercase letter")
        return v


class PasswordReset(BaseModel):
    """Schema for password reset."""

    email: EmailStr = Field(..., description="User email address")


class PasswordResetConfirm(BaseModel):
    """Schema for password reset confirmation."""

    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, description="New password")

    @validator("new_password")
    def validate_password(cls, v):
        """Validate password strength."""
        if not any(char.isdigit() for char in v):
            raise ValueError("Password must contain at least one digit")
        if not any(char.isupper() for char in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(char.islower() for char in v):
            raise ValueError("Password must contain at least one lowercase letter")
        return v


class UserSettings(BaseModel):
    """Schema for user settings."""

    timezone: Optional[str] = Field("UTC", description="User timezone")
    date_format: Optional[str] = Field(
        "YYYY-MM-DD", description="Date format preference"
    )
    notifications_enabled: Optional[bool] = Field(
        True, description="Enable notifications"
    )
    email_notifications: Optional[bool] = Field(
        True, description="Enable email notifications"
    )
