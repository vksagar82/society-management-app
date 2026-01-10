"""
Society schemas for request/response validation.

This module defines Pydantic models for society-related API operations.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class SocietyBase(BaseModel):
    """Base society schema with common fields."""

    name: str = Field(..., min_length=2, max_length=255,
                      description="Society name")
    address: str = Field(..., description="Society address")
    city: Optional[str] = Field(None, max_length=100, description="City")
    state: Optional[str] = Field(None, max_length=100, description="State")
    pincode: Optional[str] = Field(
        None, max_length=10, description="Postal code")
    contact_person: Optional[str] = Field(
        None, max_length=255, description="Contact person name")
    contact_email: Optional[EmailStr] = Field(
        None, description="Contact email")
    contact_phone: Optional[str] = Field(
        None, max_length=20, description="Contact phone")
    logo_url: Optional[str] = Field(None, description="Society logo URL")


class SocietyCreate(SocietyBase):
    """Schema for society creation."""
    pass


class SocietyUpdate(BaseModel):
    """Schema for society updates."""

    name: Optional[str] = Field(None, min_length=2, max_length=255)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    pincode: Optional[str] = Field(None, max_length=10)
    contact_person: Optional[str] = Field(None, max_length=255)
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=20)
    logo_url: Optional[str] = None


class SocietyResponse(SocietyBase):
    """Schema for society response."""

    id: UUID
    approval_status: str = Field(
        default="pending", description="Society approval status: pending, approved")
    approved_by: Optional[UUID] = Field(
        None, description="Developer who approved the society")
    approved_at: Optional[datetime] = Field(
        None, description="When society was approved")
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True


class UserSocietyBase(BaseModel):
    """Base user-society mapping schema."""

    flat_no: Optional[str] = Field(
        None, max_length=50, description="Flat/Unit number")
    wing: Optional[str] = Field(None, max_length=50, description="Wing/Block")


class UserSocietyCreate(UserSocietyBase):
    """Schema for joining a society."""

    society_id: UUID = Field(..., description="Society ID to join")
    role: Optional[str] = Field(
        "member",
        description="Desired role: admin, manager, or member (default: member)"
    )


class UserSocietyUpdate(BaseModel):
    """Schema for updating user-society mapping."""

    role: Optional[str] = Field(None, description="Role within society")
    flat_no: Optional[str] = Field(None, max_length=50)
    wing: Optional[str] = Field(None, max_length=50)


class UserSocietyResponse(UserSocietyBase):
    """Schema for user-society mapping response."""

    id: UUID
    user_id: UUID
    society_id: UUID
    role: str = Field(..., description="Role: admin, manager, member")
    approval_status: str = Field(...,
                                 description="Status: pending, approved, rejected")
    approved_by: Optional[UUID] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    is_primary: bool = Field(default=False, description="Is primary society")
    joined_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True


class ApprovalRequest(BaseModel):
    """Schema for membership approval."""

    user_society_id: UUID = Field(..., description="User-society mapping ID")
    approved: bool = Field(..., description="Approve or reject")
    rejection_reason: Optional[str] = Field(
        None, description="Reason for rejection")


class SocietyApprovalRequest(BaseModel):
    """Schema for society approval by developer."""

    approved: bool = Field(..., description="Approve or reject the society")
    rejection_reason: Optional[str] = Field(
        None, description="Reason if rejected")
