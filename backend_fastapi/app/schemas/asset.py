"""
Asset and Asset Category schemas for request/response validation.

This module defines Pydantic models for asset management operations.
"""

from datetime import datetime, date
from typing import Optional
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field


class AssetCategoryBase(BaseModel):
    """Base asset category schema."""

    name: str = Field(..., min_length=2, max_length=100,
                      description="Category name")
    description: Optional[str] = Field(
        None, description="Category description")


class AssetCategoryCreate(AssetCategoryBase):
    """Schema for asset category creation."""

    society_id: UUID = Field(..., description="Society ID")


class AssetCategoryUpdate(BaseModel):
    """Schema for asset category updates."""

    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None


class AssetCategoryResponse(AssetCategoryBase):
    """Schema for asset category response."""

    id: UUID
    society_id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True


class AssetBase(BaseModel):
    """Base asset schema."""

    name: str = Field(..., min_length=2, max_length=255,
                      description="Asset name")
    description: Optional[str] = Field(None, description="Asset description")
    purchase_date: Optional[date] = Field(None, description="Purchase date")
    purchase_cost: Optional[Decimal] = Field(
        None, ge=0, description="Purchase cost")
    warranty_expiry_date: Optional[date] = Field(
        None, description="Warranty expiry date")
    location: Optional[str] = Field(
        None, max_length=255, description="Asset location")
    asset_code: Optional[str] = Field(
        None, max_length=100, description="Unique asset code")
    image_url: Optional[str] = Field(None, description="Asset image URL")
    maintenance_frequency: Optional[str] = Field(
        None,
        description="Maintenance frequency: monthly, quarterly, annually"
    )
    notes: Optional[str] = Field(None, description="Additional notes")


class AssetCreate(AssetBase):
    """Schema for asset creation."""

    society_id: UUID = Field(..., description="Society ID")
    category_id: Optional[UUID] = Field(None, description="Asset category ID")


class AssetUpdate(BaseModel):
    """Schema for asset updates."""

    name: Optional[str] = Field(None, min_length=2, max_length=255)
    category_id: Optional[UUID] = None
    description: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_cost: Optional[Decimal] = Field(None, ge=0)
    warranty_expiry_date: Optional[date] = None
    location: Optional[str] = Field(None, max_length=255)
    asset_code: Optional[str] = Field(None, max_length=100)
    image_url: Optional[str] = None
    status: Optional[str] = Field(
        None,
        description="Status: active, inactive, maintenance, decommissioned"
    )
    last_maintenance_date: Optional[date] = None
    next_maintenance_date: Optional[date] = None
    maintenance_frequency: Optional[str] = None
    notes: Optional[str] = None


class AssetResponse(AssetBase):
    """Schema for asset response."""

    id: UUID
    society_id: UUID
    category_id: Optional[UUID] = None
    status: str = Field(default="active")
    last_maintenance_date: Optional[date] = None
    next_maintenance_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None

    class Config:
        """Pydantic config."""
        from_attributes = True
