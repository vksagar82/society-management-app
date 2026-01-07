"""
Authentication schemas for request/response validation.

This module defines Pydantic models for authentication operations.
"""

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Schema for login request."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class LoginResponse(BaseModel):
    """Schema for login response."""

    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    user: dict = Field(..., description="User information")


class RefreshTokenRequest(BaseModel):
    """Schema for token refresh request."""

    refresh_token: str = Field(..., description="Refresh token")


class TokenResponse(BaseModel):
    """Schema for token response."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")


class SignupRequest(BaseModel):
    """Schema for signup request."""

    email: EmailStr = Field(..., description="User email address")
    phone: str = Field(..., min_length=10, max_length=20,
                       description="Phone number")
    full_name: str = Field(..., min_length=2,
                           max_length=255, description="Full name")
    password: str = Field(..., min_length=8,
                          description="Password (min 8 characters)")
    society_id: str = Field(None, description="Optional society ID to join")
