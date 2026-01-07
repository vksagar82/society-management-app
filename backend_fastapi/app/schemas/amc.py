"""
AMC (Annual Maintenance Contract) schemas for request/response validation.

This module defines Pydantic models for AMC management operations.
"""

from datetime import datetime, date
from typing import Optional
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field


class AMCBase(BaseModel):
    """Base AMC schema."""

    vendor_name: str = Field(..., min_length=2,
                             max_length=255, description="Vendor name")
    vendor_code: Optional[str] = Field(
        None, max_length=100, description="Vendor code")
    service_type: str = Field(..., max_length=255, description="Service type")
    work_order_number: Optional[str] = Field(
        None, max_length=255, description="Work order number")
    invoice_number: Optional[str] = Field(
        None, max_length=255, description="Invoice number")
    po_number: Optional[str] = Field(
        None, max_length=255, description="Purchase order number")
    contract_start_date: date = Field(..., description="Contract start date")
    contract_end_date: date = Field(..., description="Contract end date")
    annual_cost: Optional[Decimal] = Field(
        None, ge=0, description="Annual cost")
    currency: str = Field(default="INR", max_length=10,
                          description="Currency code")
    payment_terms: Optional[str] = Field(None, description="Payment terms")
    document_url: Optional[str] = Field(
        None, description="Contract document URL")
    contact_person: Optional[str] = Field(
        None, max_length=255, description="Contact person")
    contact_phone: Optional[str] = Field(
        None, max_length=20, description="Contact phone")
    email: Optional[EmailStr] = Field(None, description="Vendor email")
    vendor_address: Optional[str] = Field(None, description="Vendor address")
    gst_number: Optional[str] = Field(
        None, max_length=50, description="GST number")
    maintenance_frequency: Optional[str] = Field(
        None,
        description="Frequency: monthly, quarterly, semi-annual, annual, custom"
    )
    maintenance_interval_months: Optional[int] = Field(
        None,
        ge=1,
        description="Custom interval in months"
    )
    renewal_reminder_days: int = Field(
        default=30, ge=1, description="Renewal reminder days")
    notes: Optional[str] = Field(None, description="Additional notes")


class AMCCreate(AMCBase):
    """Schema for AMC creation."""

    society_id: UUID = Field(..., description="Society ID")


class AMCUpdate(BaseModel):
    """Schema for AMC updates."""

    vendor_name: Optional[str] = Field(None, min_length=2, max_length=255)
    vendor_code: Optional[str] = Field(None, max_length=100)
    service_type: Optional[str] = Field(None, max_length=255)
    work_order_number: Optional[str] = Field(None, max_length=255)
    invoice_number: Optional[str] = Field(None, max_length=255)
    po_number: Optional[str] = Field(None, max_length=255)
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    annual_cost: Optional[Decimal] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=10)
    payment_terms: Optional[str] = None
    document_url: Optional[str] = None
    contact_person: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    vendor_address: Optional[str] = None
    gst_number: Optional[str] = Field(None, max_length=50)
    maintenance_frequency: Optional[str] = None
    maintenance_interval_months: Optional[int] = Field(None, ge=1)
    last_service_date: Optional[date] = None
    next_service_date: Optional[date] = None
    service_reminder_days: Optional[int] = Field(None, ge=1)
    renewal_reminder_days: Optional[int] = Field(None, ge=1)
    status: Optional[str] = Field(
        None,
        description="Status: active, expired, pending_renewal, cancelled"
    )
    notes: Optional[str] = None


class AMCResponse(AMCBase):
    """Schema for AMC response."""

    id: UUID
    society_id: UUID
    last_service_date: Optional[date] = None
    next_service_date: Optional[date] = None
    service_reminder_days: int = 7
    status: str = "active"
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None

    class Config:
        """Pydantic config."""
        from_attributes = True


class AMCServiceHistoryBase(BaseModel):
    """Base AMC service history schema."""

    service_date: date = Field(..., description="Service date")
    service_type: Optional[str] = Field(
        None, max_length=100, description="Service type")
    technician_name: Optional[str] = Field(
        None, max_length=255, description="Technician name")
    work_performed: Optional[str] = Field(None, description="Work performed")
    issues_found: Optional[str] = Field(None, description="Issues found")
    service_cost: Optional[Decimal] = Field(
        None, ge=0, description="Service cost")
    invoice_number: Optional[str] = Field(
        None, max_length=255, description="Invoice number")
    service_report_url: Optional[str] = Field(
        None, description="Service report URL")
    next_service_date: Optional[date] = Field(
        None, description="Next service date")
    rating: Optional[int] = Field(
        None, ge=1, le=5, description="Service rating (1-5)")
    feedback: Optional[str] = Field(None, description="Service feedback")
    notes: Optional[str] = Field(None, description="Additional notes")


class AMCServiceHistoryCreate(AMCServiceHistoryBase):
    """Schema for AMC service history creation."""

    amc_id: UUID = Field(..., description="AMC ID")


class AMCServiceHistoryResponse(AMCServiceHistoryBase):
    """Schema for AMC service history response."""

    id: UUID
    amc_id: UUID
    created_at: datetime
    created_by: Optional[UUID] = None

    class Config:
        """Pydantic config."""
        from_attributes = True
