"""
AMC (Annual Maintenance Contract) API endpoints using SQLAlchemy ORM.

This module provides endpoints for AMC and service history management.
"""

from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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
from app.schemas.user import UserResponse

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
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """List AMCs with filtering options."""
    stmt = select(AMC)
    
    if society_id:
        await check_society_access(current_user, str(society_id))
        stmt = stmt.where(AMC.society_id == society_id)
    else:
        # Get AMCs from user's societies
        stmt_societies = select(UserSociety.society_id).where(
            and_(
                UserSociety.user_id == current_user.id,
                UserSociety.status == "approved"
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
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Create a new AMC.

    Requires admin role in the society or developer.
    """
    # Check user is admin in society or developer
    if current_user.global_role != "developer":
        stmt = select(UserSociety).where(
            and_(
                UserSociety.user_id == current_user.id,
                UserSociety.society_id == amc.society_id,
                UserSociety.role == "admin",
                UserSociety.status == "approved"
            )
        )
        result = await db.execute(stmt)
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be an admin of this society"
            )
    
    # Verify asset exists and belongs to same society
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
        asset_id=amc.asset_id,
        vendor_name=amc.vendor_name,
        vendor_contact=amc.vendor_contact,
        vendor_email=amc.vendor_email,
        contract_type=amc.contract_type,
        description=amc.description,
        start_date=amc.start_date,
        end_date=amc.end_date,
        renewal_date=amc.renewal_date,
        amount=amc.amount,
        payment_frequency=amc.payment_frequency,
        terms_and_conditions=amc.terms_and_conditions,
        coverage_details=amc.coverage_details,
        service_frequency=amc.service_frequency,
        last_service_date=amc.last_service_date,
        next_service_date=amc.next_service_date,
        status=amc.status or "active",
        document_urls=amc.document_urls or []
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
    current_user: UserResponse = Depends(get_current_active_user),
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
    stmt = select(UserSociety).where(
        and_(
            UserSociety.user_id == current_user.id,
            UserSociety.society_id == amc.society_id,
            UserSociety.status == "approved"
        )
    )
    result = await db.execute(stmt)
    if not result.scalar_one_or_none() and current_user.global_role != "developer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this AMC"
        )
    
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
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Update AMC details.

    Requires admin role in the society or developer.
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
    
    # Check permissions
    if current_user.global_role != "developer":
        stmt = select(UserSociety).where(
            and_(
                UserSociety.user_id == current_user.id,
                UserSociety.society_id == amc.society_id,
                UserSociety.role == "admin",
                UserSociety.status == "approved"
            )
        )
        result = await db.execute(stmt)
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be an admin of this society"
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
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Delete an AMC.

    Requires admin role in the society or developer.
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
    
    # Check permissions
    if current_user.global_role != "developer":
        stmt = select(UserSociety).where(
            and_(
                UserSociety.user_id == current_user.id,
                UserSociety.society_id == amc.society_id,
                UserSociety.role == "admin",
                UserSociety.status == "approved"
            )
        )
        result = await db.execute(stmt)
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be an admin of this society"
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
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Add a service history record to an AMC.

    Requires admin role in the society or developer.
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
    
    # Check permissions
    if current_user.global_role != "developer":
        stmt = select(UserSociety).where(
            and_(
                UserSociety.user_id == current_user.id,
                UserSociety.society_id == amc.society_id,
                UserSociety.role == "admin",
                UserSociety.status == "approved"
            )
        )
        result = await db.execute(stmt)
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be an admin of this society"
            )
    
    new_service = AMCServiceHistory(
        id=uuid4(),
        amc_id=amc_id,
        service_date=service.service_date,
        performed_by=service.performed_by,
        service_type=service.service_type,
        description=service.description,
        issues_found=service.issues_found,
        actions_taken=service.actions_taken,
        parts_replaced=service.parts_replaced or [],
        next_service_date=service.next_service_date,
        cost=service.cost,
        remarks=service.remarks,
        document_urls=service.document_urls or []
    )
    
    db.add(new_service)
    
    # Update AMC last_service_date and next_service_date
    amc.last_service_date = service.service_date
    if service.next_service_date:
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
    current_user: UserResponse = Depends(get_current_active_user),
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
    stmt = select(UserSociety).where(
        and_(
            UserSociety.user_id == current_user.id,
            UserSociety.society_id == amc.society_id,
            UserSociety.status == "approved"
        )
    )
    result = await db.execute(stmt)
    if not result.scalar_one_or_none() and current_user.global_role != "developer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this AMC"
        )
    
    # Get service history
    stmt = select(AMCServiceHistory).where(
        AMCServiceHistory.amc_id == amc_id
    ).order_by(AMCServiceHistory.service_date.desc())
    
    result = await db.execute(stmt)
    services = result.scalars().all()
    
    return [AMCServiceHistoryResponse.model_validate(s) for s in services]
