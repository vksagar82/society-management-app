"""
Asset Management API endpoints using SQLAlchemy ORM.

This module provides endpoints for asset and asset category management.
"""

from typing import List, Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_active_user, check_society_access
from app.database import get_session
from app.models import Asset, AssetCategory, UserSociety
from app.schemas.asset import (
    AssetResponse,
    AssetCreate,
    AssetUpdate,
    AssetCategoryResponse,
    AssetCategoryCreate
)
from app.schemas.user import UserInDB

router = APIRouter(prefix="/assets", tags=["Assets"])


@router.get(
    "/categories",
    response_model=List[AssetCategoryResponse],
    summary="List Asset Categories",
    description="Get all asset categories."
)
async def list_categories(
    db: AsyncSession = Depends(get_session)
):
    """List all asset categories."""
    stmt = select(AssetCategory).order_by(AssetCategory.name)
    result = await db.execute(stmt)
    categories = result.scalars().all()

    return [AssetCategoryResponse.model_validate(c) for c in categories]


@router.post(
    "/categories",
    response_model=AssetCategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Asset Category",
    description="Create a new asset category."
)
async def create_category(
    category: AssetCategoryCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Create a new asset category.

    Requires developer role.
    """
    if current_user.global_role != "developer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only developers can create asset categories"
        )

    # Check if category already exists
    stmt = select(AssetCategory).where(
        and_(
            AssetCategory.name == category.name,
            AssetCategory.society_id == category.society_id
        )
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category already exists"
        )

    new_category = AssetCategory(
        id=uuid4(),
        name=category.name,
        description=category.description,
        society_id=category.society_id,
        created_by=current_user.id
    )

    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)

    return AssetCategoryResponse.model_validate(new_category)


@router.get(
    "",
    response_model=List[AssetResponse],
    summary="List Assets",
    description="Get list of assets with filtering."
)
async def list_assets(
    society_id: Optional[UUID] = Query(None),
    category_id: Optional[UUID] = Query(
        None, description="Filter by category"),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """List assets with filtering options."""
    stmt = select(Asset)

    if society_id:
        await check_society_access(current_user, str(society_id), db)
        stmt = stmt.where(Asset.society_id == society_id)
    else:
        # Get assets from user's societies
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

        stmt = stmt.where(Asset.society_id.in_(society_ids))

    # Apply filters
    if category_id:
        stmt = stmt.where(Asset.category_id == category_id)

    if status_filter:
        stmt = stmt.where(Asset.status == status_filter)

    # Order and pagination
    stmt = stmt.order_by(Asset.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(stmt)
    assets = result.scalars().all()

    return [AssetResponse.model_validate(a) for a in assets]


@router.post(
    "",
    response_model=AssetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Asset",
    description="Create a new asset."
)
async def create_asset(
    asset: AssetCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Create a new asset.

    Requires admin or manager role in the society or developer.
    """
    from app.core.deps import require_society_permission

    # Check permissions: admin or manager can create
    await require_society_permission(
        current_user,
        str(asset.society_id),
        db,
        allowed_roles=["admin", "manager"],
        action="create assets in this society"
    )

    # Verify category exists
    stmt = select(AssetCategory).where(AssetCategory.id == asset.category_id)
    result = await db.execute(stmt)
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset category not found"
        )

    new_asset = Asset(
        id=uuid4(),
        society_id=asset.society_id,
        category_id=asset.category_id,
        name=asset.name,
        description=asset.description,
        purchase_date=asset.purchase_date,
        purchase_cost=asset.purchase_cost,
        warranty_expiry_date=asset.warranty_expiry_date,
        location=asset.location,
        asset_code=asset.asset_code,
        image_url=asset.image_url,
        status="active",
        last_maintenance_date=None,
        next_maintenance_date=None,
        maintenance_frequency=asset.maintenance_frequency,
        notes=asset.notes,
        created_by=current_user.id,
    )

    db.add(new_asset)
    await db.commit()
    await db.refresh(new_asset)

    return AssetResponse.model_validate(new_asset)


@router.get(
    "/{asset_id}",
    response_model=AssetResponse,
    summary="Get Asset",
    description="Get details of a specific asset."
)
async def get_asset(
    asset_id: UUID,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """Get asset by ID."""
    stmt = select(Asset).where(Asset.id == asset_id)
    result = await db.execute(stmt)
    asset = result.scalar_one_or_none()

    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )

    # Check user has access to the society
    await check_society_access(current_user, str(asset.society_id), db)

    return AssetResponse.model_validate(asset)


@router.put(
    "/{asset_id}",
    response_model=AssetResponse,
    summary="Update Asset",
    description="Update asset details."
)
async def update_asset(
    asset_id: UUID,
    asset_update: AssetUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Update asset details.

    Requires admin or manager role in the society or developer.
    Members have view-only access.
    """
    # Get asset
    stmt = select(Asset).where(Asset.id == asset_id)
    result = await db.execute(stmt)
    asset = result.scalar_one_or_none()

    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )

    # Check permissions: admin or manager can update
    from app.core.deps import require_society_permission
    await require_society_permission(
        current_user,
        str(asset.society_id),
        db,
        allowed_roles=["admin", "manager"],
        action="update assets in this society"
    )

    # Update fields
    update_data = asset_update.model_dump(exclude_unset=True)

    # If category is being changed, verify it exists
    if "category_id" in update_data:
        stmt = select(AssetCategory).where(
            AssetCategory.id == update_data["category_id"])
        result = await db.execute(stmt)
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset category not found"
            )

    for field, value in update_data.items():
        setattr(asset, field, value)

    await db.commit()
    await db.refresh(asset)

    return AssetResponse.model_validate(asset)


@router.delete(
    "/{asset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Asset",
    description="Delete an asset."
)
async def delete_asset(
    asset_id: UUID,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Delete an asset.

    Requires admin role in the society or developer.
    Managers and members cannot delete assets.
    """
    # Get asset
    stmt = select(Asset).where(Asset.id == asset_id)
    result = await db.execute(stmt)
    asset = result.scalar_one_or_none()

    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )

    # Check permissions: only admin can delete
    from app.core.deps import require_society_permission
    await require_society_permission(
        current_user,
        str(asset.society_id),
        db,
        allowed_roles=["admin"],
        action="delete assets in this society"
    )

    await db.delete(asset)
    await db.commit()
