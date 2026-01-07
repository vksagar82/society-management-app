"""
Issue/Complaint schemas for request/response validation.

This module defines Pydantic models for issue management operations.
"""

from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class IssueBase(BaseModel):
    """Base issue schema with common fields."""

    title: str = Field(..., min_length=5, max_length=255,
                       description="Issue title")
    description: str = Field(..., min_length=10,
                             description="Issue description")
    category: Optional[str] = Field(
        None, max_length=100, description="Category")
    priority: str = Field(
        default="medium", description="Priority: low, medium, high, urgent")
    location: Optional[str] = Field(
        None, max_length=255, description="Location")
    target_resolution_date: Optional[date] = Field(
        None, description="Target resolution date")


class IssueCreate(IssueBase):
    """Schema for issue creation."""

    society_id: UUID = Field(..., description="Society ID")
    images: Optional[List[str]] = Field(None, description="Image URLs")
    attachment_urls: Optional[List[str]] = Field(
        None, description="Attachment URLs")


class IssueUpdate(BaseModel):
    """Schema for issue updates."""

    title: Optional[str] = Field(None, min_length=5, max_length=255)
    description: Optional[str] = Field(None, min_length=10)
    category: Optional[str] = Field(None, max_length=100)
    priority: Optional[str] = None
    status: Optional[str] = Field(
        None, description="Status: open, in_progress, resolved, closed")
    assigned_to: Optional[UUID] = Field(None, description="Assign to user ID")
    location: Optional[str] = Field(None, max_length=255)
    target_resolution_date: Optional[date] = None
    resolution_notes: Optional[str] = None


class IssueResponse(IssueBase):
    """Schema for issue response."""

    id: UUID
    society_id: UUID
    status: str
    reported_by: UUID
    assigned_to: Optional[UUID] = None
    images: Optional[List[str]] = None
    attachment_urls: Optional[List[str]] = None
    issue_date: datetime
    resolved_date: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True


class IssueCommentBase(BaseModel):
    """Base issue comment schema."""

    comment: str = Field(..., min_length=1, description="Comment text")
    attachment_url: Optional[str] = Field(None, description="Attachment URL")


class IssueCommentCreate(IssueCommentBase):
    """Schema for creating issue comment."""

    issue_id: UUID = Field(..., description="Issue ID")


class IssueCommentResponse(IssueCommentBase):
    """Schema for issue comment response."""

    id: UUID
    issue_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True
