"""
AMC (Annual Maintenance Contract) API endpoints using SQLAlchemy ORM.

This module provides endpoints for AMC and service history management.
"""

from typing import List, Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_active_user, check_society_access
from app.database import get_session
from app.models import AMC, AMCServiceHistory, UserSociety, Asset
from app.schemas.amc import (
    AMCResponse,
    AMCCreate,
    AMCUpdate,
    AMCServiceHistoryResponse,
    AMCServiceHistoryCreate
)
from app.schemas.user import UserInDB

router = APIRouter(prefix="/amcs", tags=["AMCs"])


@router.get(
    "",
    response_model=List[AMCResponse],
    summary="List AMCs",
    description="Get list of AMCs with filtering."
)
async def list_amcs(
    society_id: Optional[UUID] = Query(None),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """List AMCs with filtering options."""
    stmt = select(AMC)

    if society_id:
        await check_society_access(current_user, str(society_id), db)
        stmt = stmt.where(AMC.society_id == society_id)
    else:
        # Get AMCs from user's societies
        stmt_societies = select(UserSociety.society_id).where(
            and_(
                UserSociety.user_id == current_user.id,
                UserSociety.approval_status == "approved"
            )
        )
        result = await db.execute(stmt_societies)
        society_ids = [row[0] for row in result.all()]

        if not society_ids:
            return []

        stmt = stmt.where(AMC.society_id.in_(society_ids))

    # Apply filters
    if status_filter:
        stmt = stmt.where(AMC.status == status_filter)

    # Order and pagination
    stmt = stmt.order_by(AMC.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(stmt)
    amcs = result.scalars().all()

    return [AMCResponse.model_validate(a) for a in amcs]


@router.post(
    "",
    response_model=AMCResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create AMC",
    description="Create a new AMC."
)
async def create_amc(
    amc: AMCCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Create a new AMC.

    Requires admin or manager role in the society or developer.
    Members cannot create AMCs.
    """
    from app.core.deps import require_society_permission

    # Check permissions: admin or manager can create
    await require_society_permission(
        current_user,
        str(amc.society_id),
        db,
        allowed_roles=["admin", "manager"],
        action="create AMCs in this society"
    )

    # Verify asset exists and belongs to same society (if asset_id provided)
    if amc.asset_id:
        stmt = select(Asset).where(
            and_(
                Asset.id == amc.asset_id,
                Asset.society_id == amc.society_id
            )
        )
        result = await db.execute(stmt)
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found in this society"
            )

    new_amc = AMC(
        id=uuid4(),
        society_id=amc.society_id,
        vendor_name=amc.vendor_name,
        vendor_code=getattr(amc, "vendor_code", None),
        service_type=amc.service_type,
        work_order_number=getattr(amc, "work_order_number", None),
        invoice_number=getattr(amc, "invoice_number", None),
        po_number=getattr(amc, "po_number", None),
        contract_start_date=amc.contract_start_date,
        contract_end_date=amc.contract_end_date,
        annual_cost=getattr(amc, "annual_cost", None),
        currency=getattr(amc, "currency", "INR"),
        payment_terms=getattr(amc, "payment_terms", None),
        document_url=getattr(amc, "document_url", None),
        contact_person=getattr(amc, "contact_person", None),
        contact_phone=getattr(amc, "contact_phone", None),
        email=getattr(amc, "email", None),
        vendor_address=getattr(amc, "vendor_address", None),
        gst_number=getattr(amc, "gst_number", None),
        maintenance_frequency=getattr(amc, "maintenance_frequency", None),
        maintenance_interval_months=getattr(
            amc, "maintenance_interval_months", None),
        last_service_date=getattr(amc, "last_service_date", None),
        next_service_date=getattr(amc, "next_service_date", None),
        service_reminder_days=getattr(amc, "service_reminder_days", 7),
        renewal_reminder_days=getattr(amc, "renewal_reminder_days", 30),
        status=getattr(amc, "status", "active"),
        notes=getattr(amc, "notes", None),
        created_by=current_user.id,
    )

    db.add(new_amc)
    await db.commit()
    await db.refresh(new_amc)

    return AMCResponse.model_validate(new_amc)


@router.get(
    "/{amc_id}",
    response_model=AMCResponse,
    summary="Get AMC",
    description="Get details of a specific AMC."
)
async def get_amc(
    amc_id: UUID,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """Get AMC by ID."""
    stmt = select(AMC).where(AMC.id == amc_id)
    result = await db.execute(stmt)
    amc = result.scalar_one_or_none()

    if not amc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AMC not found"
        )

    # Check user has access to the society
    await check_society_access(current_user, str(amc.society_id), db)

    return AMCResponse.model_validate(amc)


@router.put(
    "/{amc_id}",
    response_model=AMCResponse,
    summary="Update AMC",
    description="Update AMC details."
)
async def update_amc(
    amc_id: UUID,
    amc_update: AMCUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Update AMC details.

    Requires admin or manager role in the society or developer.
    Members have view-only access.
    """
    # Get AMC
    stmt = select(AMC).where(AMC.id == amc_id)
    result = await db.execute(stmt)
    amc = result.scalar_one_or_none()

    if not amc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AMC not found"
        )

    # Check permissions: admin or manager can update
    from app.core.deps import require_society_permission
    await require_society_permission(
        current_user,
        str(amc.society_id),
        db,
        allowed_roles=["admin", "manager"],
        action="update AMCs in this society"
    )

    # Update fields
    update_data = amc_update.model_dump(exclude_unset=True)

    # If asset_id is being changed, verify it exists and belongs to same society
    if "asset_id" in update_data and update_data["asset_id"]:
        stmt = select(Asset).where(
            and_(
                Asset.id == update_data["asset_id"],
                Asset.society_id == amc.society_id
            )
        )
        result = await db.execute(stmt)
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found in this society"
            )

    for field, value in update_data.items():
        setattr(amc, field, value)

    await db.commit()
    await db.refresh(amc)

    return AMCResponse.model_validate(amc)


@router.delete(
    "/{amc_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete AMC",
    description="Delete an AMC."
)
async def delete_amc(
    amc_id: UUID,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Delete an AMC.

    Requires admin role in the society or developer.
    Managers and members cannot delete AMCs.
    """
    # Get AMC
    stmt = select(AMC).where(AMC.id == amc_id)
    result = await db.execute(stmt)
    amc = result.scalar_one_or_none()

    if not amc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AMC not found"
        )

    # Check permissions: only admin can delete
    from app.core.deps import require_society_permission
    await require_society_permission(
        current_user,
        str(amc.society_id),
        db,
        allowed_roles=["admin"],
        action="delete AMCs in this society"
    )

    await db.delete(amc)
    await db.commit()


@router.post(
    "/{amc_id}/service-history",
    response_model=AMCServiceHistoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add Service History",
    description="Add a service record to an AMC."
)
async def add_service_history(
    amc_id: UUID,
    service: AMCServiceHistoryCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Add a service history record to an AMC.

    Requires admin or manager role in the society or developer.
    """
    # Get AMC
    stmt = select(AMC).where(AMC.id == amc_id)
    result = await db.execute(stmt)
    amc = result.scalar_one_or_none()

    if not amc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AMC not found"
        )

    # Check permissions: admin or manager can add service history
    from app.core.deps import require_society_permission
    await require_society_permission(
        current_user,
        str(amc.society_id),
        db,
        allowed_roles=["admin", "manager"],
        action="add service history in this society"
    )

    new_service = AMCServiceHistory(
        id=uuid4(),
        amc_id=amc_id,
        service_date=service.service_date,
        service_type=getattr(service, 'service_type', None),
        technician_name=getattr(service, 'technician_name', None),
        work_performed=getattr(service, 'work_performed', None),
        issues_found=getattr(service, 'issues_found', None),
        service_cost=getattr(service, 'service_cost', None),
        invoice_number=getattr(service, 'invoice_number', None),
        service_report_url=getattr(service, 'service_report_url', None),
        next_service_date=getattr(service, 'next_service_date', None),
        rating=getattr(service, 'rating', None),
        feedback=getattr(service, 'feedback', None),
        notes=getattr(service, 'notes', None),
        created_by=current_user.id
    )

    db.add(new_service)

    # Update AMC last_service_date and next_service_date
    amc.last_service_date = service.service_date  # type: ignore[assignment]
    if service.next_service_date:
        # type: ignore[assignment]
        amc.next_service_date = service.next_service_date

    await db.commit()
    await db.refresh(new_service)

    return AMCServiceHistoryResponse.model_validate(new_service)


@router.get(
    "/{amc_id}/service-history",
    response_model=List[AMCServiceHistoryResponse],
    summary="Get Service History",
    description="Get service history for an AMC."
)
async def get_service_history(
    amc_id: UUID,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """Get all service history records for an AMC."""
    # Get AMC to check access
    stmt = select(AMC).where(AMC.id == amc_id)
    result = await db.execute(stmt)
    amc = result.scalar_one_or_none()

    if not amc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AMC not found"
        )

    # Check user has access to the society
    await check_society_access(current_user, str(amc.society_id), db)

    # Get service history
    stmt = select(AMCServiceHistory).where(
        AMCServiceHistory.amc_id == amc_id
    ).order_by(AMCServiceHistory.service_date.desc())

    result = await db.execute(stmt)
    services = result.scalars().all()

    return [AMCServiceHistoryResponse.model_validate(s) for s in services]
