"""
SQLAlchemy ORM models for the Society Management System.

This module defines all database models using SQLAlchemy ORM for async operations.
"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Text, Date, Numeric,
    ForeignKey, UniqueConstraint, JSON, CheckConstraint, Index
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    """Users table - society members."""

    __tablename__ = "users"
    __table_args__ = (
        Index('ix_users_email', 'email'),
        Index('ix_users_phone', 'phone'),
        Index('ix_users_global_role', 'global_role'),
        Index('ix_users_is_active', 'is_active'),
        Index('ix_users_created_at', 'created_at'),
        Index('ix_users_reset_token', 'reset_token'),
    )

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=UUID)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(Text, nullable=True)
    # developer, admin, manager, member
    global_role = Column(String(50), default="member")
    is_active = Column(Boolean, default=True)
    settings = Column(JSON, default={})
    last_login = Column(DateTime, nullable=True)
    reset_token = Column(String(255), nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    # Relationships
    user_societies = relationship(
        "UserSociety", back_populates="user", cascade="all, delete-orphan")
    issues_reported = relationship(
        "Issue", foreign_keys="Issue.reported_by", back_populates="reporter")
    issues_assigned = relationship(
        "Issue", foreign_keys="Issue.assigned_to", back_populates="assignee")
    issue_comments = relationship(
        "IssueComment", back_populates="user", cascade="all, delete-orphan")
    amcs_created = relationship(
        "AMC", back_populates="created_by_user", foreign_keys="AMC.created_by")
    asset_categories = relationship(
        "AssetCategory", back_populates="created_by_user")
    assets = relationship("Asset", back_populates="created_by_user")


class Society(Base):
    """Society table."""

    __tablename__ = "societies"
    __table_args__ = (
        Index('ix_societies_name', 'name'),
        Index('ix_societies_city', 'city'),
        Index('ix_societies_created_at', 'created_at'),
    )

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=UUID)
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    contact_person = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    logo_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    # Relationships
    user_societies = relationship(
        "UserSociety", back_populates="society", cascade="all, delete-orphan")
    issues = relationship("Issue", back_populates="society",
                          cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="society",
                          cascade="all, delete-orphan")
    amcs = relationship("AMC", back_populates="society",
                        cascade="all, delete-orphan")
    asset_categories = relationship(
        "AssetCategory", back_populates="society", cascade="all, delete-orphan")


class UserSociety(Base):
    """User-Society mapping (many-to-many)."""

    __tablename__ = "user_societies"
    __table_args__ = (
        UniqueConstraint("user_id", "society_id", name="uq_user_society"),
        Index('ix_user_societies_user_id', 'user_id'),
        Index('ix_user_societies_society_id', 'society_id'),
        Index('ix_user_societies_approval_status', 'approval_status'),
        Index('ix_user_societies_role', 'role'),
        Index('ix_user_societies_user_society', 'user_id', 'society_id'),
    )

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=UUID)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)
    society_id = Column(PG_UUID(as_uuid=True), ForeignKey(
        "societies.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), default="member")  # admin, manager, member
    # pending, approved, rejected
    approval_status = Column(String(50), default="pending")
    approved_by = Column(PG_UUID(as_uuid=True),
                         ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    flat_no = Column(String(50), nullable=True)
    wing = Column(String(50), nullable=True)
    is_primary = Column(Boolean, default=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    # Relationships
    user = relationship(
        "User", back_populates="user_societies", foreign_keys=[user_id])
    society = relationship("Society", back_populates="user_societies")


class Issue(Base):
    """Issues/Complaints table."""

    __tablename__ = "issues"
    __table_args__ = (
        Index('ix_issues_society_id', 'society_id'),
        Index('ix_issues_status', 'status'),
        Index('ix_issues_priority', 'priority'),
        Index('ix_issues_category', 'category'),
        Index('ix_issues_reported_by', 'reported_by'),
        Index('ix_issues_assigned_to', 'assigned_to'),
        Index('ix_issues_created_at', 'created_at'),
        Index('ix_issues_society_status', 'society_id', 'status'),
    )

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=UUID)
    society_id = Column(PG_UUID(as_uuid=True), ForeignKey(
        "societies.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)
    # low, medium, high, urgent
    priority = Column(String(50), default="medium")
    # open, in_progress, resolved, closed
    status = Column(String(50), default="open")
    reported_by = Column(PG_UUID(as_uuid=True),
                         ForeignKey("users.id"), nullable=False)
    assigned_to = Column(PG_UUID(as_uuid=True),
                         ForeignKey("users.id"), nullable=True)
    location = Column(String(255), nullable=True)
    images = Column(JSON, nullable=True)  # Array of image URLs
    attachment_urls = Column(JSON, nullable=True)
    issue_date = Column(DateTime, default=datetime.utcnow)
    target_resolution_date = Column(Date, nullable=True)
    resolved_date = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    # Relationships
    society = relationship("Society", back_populates="issues")
    reporter = relationship("User", foreign_keys=[
                            reported_by], back_populates="issues_reported")
    assignee = relationship("User", foreign_keys=[
                            assigned_to], back_populates="issues_assigned")
    comments = relationship(
        "IssueComment", back_populates="issue", cascade="all, delete-orphan")


class IssueComment(Base):
    """Issue comments/updates table."""

    __tablename__ = "issue_comments"
    __table_args__ = (
        Index('ix_issue_comments_issue_id', 'issue_id'),
        Index('ix_issue_comments_user_id', 'user_id'),
        Index('ix_issue_comments_created_at', 'created_at'),
    )

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=UUID)
    issue_id = Column(PG_UUID(as_uuid=True), ForeignKey(
        "issues.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(PG_UUID(as_uuid=True),
                     ForeignKey("users.id"), nullable=False)
    comment = Column(Text, nullable=False)
    attachment_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    # Relationships
    issue = relationship("Issue", back_populates="comments")
    user = relationship("User", back_populates="issue_comments")


class AssetCategory(Base):
    """Asset categories table."""

    __tablename__ = "asset_categories"
    __table_args__ = (
        UniqueConstraint("society_id", "name",
                         name="uq_asset_categories_society_name"),
        Index('ix_asset_categories_society_id', 'society_id'),
        Index('ix_asset_categories_name', 'name'),
    )

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=UUID)
    society_id = Column(PG_UUID(as_uuid=True), ForeignKey(
        "societies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(PG_UUID(as_uuid=True),
                        ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    # Relationships
    society = relationship("Society", back_populates="asset_categories")
    created_by_user = relationship("User", back_populates="asset_categories")
    assets = relationship("Asset", back_populates="category")


class Asset(Base):
    """Assets table."""

    __tablename__ = "assets"
    __table_args__ = (
        Index('ix_assets_society_id', 'society_id'),
        Index('ix_assets_category_id', 'category_id'),
        Index('ix_assets_status', 'status'),
        Index('ix_assets_asset_code', 'asset_code'),
        Index('ix_assets_created_at', 'created_at'),
        Index('ix_assets_society_status', 'society_id', 'status'),
    )

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=UUID)
    society_id = Column(PG_UUID(as_uuid=True), ForeignKey(
        "societies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    category_id = Column(PG_UUID(as_uuid=True), ForeignKey(
        "asset_categories.id", ondelete="SET NULL"), nullable=True)
    description = Column(Text, nullable=True)
    purchase_date = Column(Date, nullable=True)
    purchase_cost = Column(Numeric(12, 2), nullable=True)
    warranty_expiry_date = Column(Date, nullable=True)
    amc_id = Column(PG_UUID(as_uuid=True),
                    ForeignKey("amcs.id"), nullable=True)
    location = Column(String(255), nullable=True)
    asset_code = Column(String(100), unique=True, nullable=True)
    image_url = Column(Text, nullable=True)
    # active, inactive, maintenance, decommissioned
    status = Column(String(50), default="active")
    last_maintenance_date = Column(Date, nullable=True)
    next_maintenance_date = Column(Date, nullable=True)
    # monthly, quarterly, annually
    maintenance_frequency = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)
    created_by = Column(PG_UUID(as_uuid=True),
                        ForeignKey("users.id"), nullable=True)

    # Relationships
    society = relationship("Society", back_populates="assets")
    category = relationship("AssetCategory", back_populates="assets")
    created_by_user = relationship("User", back_populates="assets")
    amc = relationship("AMC", foreign_keys=[amc_id])


class AMC(Base):
    """AMC (Annual Maintenance Contract) table."""

    __tablename__ = "amcs"
    __table_args__ = (
        Index('ix_amcs_society_id', 'society_id'),
        Index('ix_amcs_status', 'status'),
        Index('ix_amcs_contract_end_date', 'contract_end_date'),
        Index('ix_amcs_next_service_date', 'next_service_date'),
        Index('ix_amcs_vendor_name', 'vendor_name'),
        Index('ix_amcs_created_at', 'created_at'),
        Index('ix_amcs_society_status', 'society_id', 'status'),
    )

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=UUID)
    society_id = Column(PG_UUID(as_uuid=True), ForeignKey(
        "societies.id", ondelete="CASCADE"), nullable=False)
    vendor_name = Column(String(255), nullable=False)
    vendor_code = Column(String(100), nullable=True)
    service_type = Column(String(255), nullable=False)
    work_order_number = Column(String(255), nullable=True)
    invoice_number = Column(String(255), nullable=True)
    po_number = Column(String(255), nullable=True)
    contract_start_date = Column(Date, nullable=False)
    contract_end_date = Column(Date, nullable=False)
    annual_cost = Column(Numeric(12, 2), nullable=True)
    currency = Column(String(10), default="INR")
    payment_terms = Column(Text, nullable=True)
    document_url = Column(Text, nullable=True)
    contact_person = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    vendor_address = Column(Text, nullable=True)
    gst_number = Column(String(50), nullable=True)
    maintenance_frequency = Column(String(50), nullable=True)
    maintenance_interval_months = Column(Integer, nullable=True)
    last_service_date = Column(Date, nullable=True)
    next_service_date = Column(Date, nullable=True)
    service_reminder_days = Column(Integer, default=7)
    renewal_reminder_days = Column(Integer, default=30)
    status = Column(String(50), default="active")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)
    created_by = Column(PG_UUID(as_uuid=True),
                        ForeignKey("users.id"), nullable=True)

    # Relationships
    society = relationship("Society", back_populates="amcs")
    created_by_user = relationship("User", back_populates="amcs_created")
    service_history = relationship(
        "AMCServiceHistory", back_populates="amc", cascade="all, delete-orphan")


class AMCServiceHistory(Base):
    """AMC Service History - Track each maintenance service."""

    __tablename__ = "amc_service_history"
    __table_args__ = (
        Index('ix_amc_service_history_amc_id', 'amc_id'),
        Index('ix_amc_service_history_service_date', 'service_date'),
        Index('ix_amc_service_history_created_at', 'created_at'),
    )

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=UUID)
    amc_id = Column(PG_UUID(as_uuid=True), ForeignKey(
        "amcs.id", ondelete="CASCADE"), nullable=False)
    service_date = Column(Date, nullable=False)
    service_type = Column(String(100), nullable=True)
    technician_name = Column(String(255), nullable=True)
    work_performed = Column(Text, nullable=True)
    issues_found = Column(Text, nullable=True)
    parts_replaced = Column(JSON, nullable=True)
    service_cost = Column(Numeric(12, 2), nullable=True)
    invoice_number = Column(String(255), nullable=True)
    service_report_url = Column(Text, nullable=True)
    assets_serviced = Column(JSON, nullable=True)
    next_service_date = Column(Date, nullable=True)
    rating = Column(Integer, nullable=True)  # 1-5
    feedback = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(PG_UUID(as_uuid=True),
                        ForeignKey("users.id"), nullable=True)

    # Relationships
    amc = relationship("AMC", back_populates="service_history")
