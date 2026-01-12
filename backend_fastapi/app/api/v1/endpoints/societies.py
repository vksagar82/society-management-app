"""
Society API endpoints using SQLAlchemy ORM.

This module provides endpoints for society management including:
- List societies
- Create society
- Get society details
- Update society
- Delete society
- Manage user memberships
- Approval workflows
"""

from typing import List, Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.core.deps import get_current_active_user
from app.database import get_session
from app.models import Society, UserSociety
from app.schemas.user import UserInDB
from app.schemas.society import (
    SocietyResponse,
    SocietyCreate,
    SocietyUpdate,
    UserSocietyCreate,
    UserSocietyResponse,
    ApprovalRequest,
    SocietyApprovalRequest
)
from app.schemas.user import UserResponse

router = APIRouter(prefix="/societies", tags=["Societies"])


@router.get(
    "",
    response_model=List[SocietyResponse],
    summary="List Societies",
    description="Get list of all societies with pagination and search."
)
async def list_societies(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        50, ge=1, le=100, description="Number of records per page (max 100)"),
    search: Optional[str] = Query(
        None, description="Search by society name or city"),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    List societies with pagination and optional search.

    **Permissions**:
    - Developers: See all societies (including pending approval)
    - Other users: See only approved societies they are members of

    **Query Parameters**:
    - `skip`: Pagination offset (default: 0)
    - `limit`: Results per page (default: 50, max: 100)
    - `search`: Filter by name or city (partial match, case-insensitive)

    **Use Cases**:
    - Developer browsing all societies in the system
    - User viewing their joined societies
    - User searching for a specific society to join
    """
    if current_user.global_role == "developer":
        # Developers see all societies including pending
        stmt = select(Society)

        if search:
            search_pattern = f"%{search}%"
            stmt = stmt.where(or_(
                Society.name.ilike(search_pattern),
                Society.city.ilike(search_pattern)
            ))

        stmt = stmt.order_by(Society.created_at.desc()
                             ).offset(skip).limit(limit)
        result = await db.execute(stmt)
        societies = result.scalars().all()
    else:
        # Get approved societies user is a member of
        stmt = select(Society).join(
            UserSociety, Society.id == UserSociety.society_id
        ).where(
            and_(
                UserSociety.user_id == current_user.id,
                UserSociety.approval_status == "approved",
                Society.approval_status == "approved"  # Only approved societies
            )
        )

        if search:
            search_pattern = f"%{search}%"
            stmt = stmt.where(or_(
                Society.name.ilike(search_pattern),
                Society.city.ilike(search_pattern)
            ))

        stmt = stmt.order_by(Society.created_at.desc()
                             ).offset(skip).limit(limit)
        result = await db.execute(stmt)
        societies = result.scalars().all()

    return [SocietyResponse.model_validate(s) for s in societies]


@router.post(
    "",
    response_model=SocietyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Society",
    description="Create a new society and automatically become its admin."
)
async def create_society(
    society: SocietyCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Create a new society.

    **Request Body**:
    - `name`: Society name (required)
    - `address`: Street address (required)
    - `city`: City name (required)
    - `state`: State/province (required)
    - `pincode`: Postal code (required)
    - `contact_person`: Primary contact name (optional)
    - `contact_email`: Contact email (optional)
    - `contact_phone`: Contact phone number (optional)
    - `logo_url`: Society logo URL (optional)

    **Permissions**: Any authenticated user

    **Behavior**:
    - Society is created with "pending" status
    - Only developers can approve societies
    - Creator is automatically added as admin (pending until society approved)
    - For developers: society is auto-approved

    **Returns**: Newly created society object
    """
    # Create society
    is_developer = current_user.global_role == "developer"
    new_society = Society(
        id=uuid4(),
        name=society.name,
        address=society.address,
        city=society.city,
        state=society.state,
        pincode=society.pincode,
        contact_person=society.contact_person,
        contact_email=society.contact_email,
        contact_phone=society.contact_phone,
        logo_url=society.logo_url,
        approval_status="approved" if is_developer else "pending",
        approved_by=current_user.id if is_developer else None,
        approved_at=datetime.utcnow() if is_developer else None
    )

    db.add(new_society)
    await db.flush()

    # Add creator as admin
    user_society = UserSociety(
        user_id=current_user.id,
        society_id=new_society.id,
        role="admin",
        approval_status="approved",
        approved_by=current_user.id,
        approved_at=datetime.utcnow()
    )

    db.add(user_society)
    await db.commit()
    await db.refresh(new_society)

    return SocietyResponse.model_validate(new_society)


@router.post(
    "/{society_id}/approve-society",
    response_model=SocietyResponse,
    summary="Approve Society (Developer Only)",
    description="Approve a pending society. Only developers can approve societies."
)
async def approve_society(
    society_id: UUID,
    approval: SocietyApprovalRequest,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Approve or reject a society.

    **Path Parameters**:
    - `society_id`: UUID of the society (required)

    **Request Body**:
    - `approved`: Boolean - true to approve (required)

    **Permissions**: Developer only

    **Behavior**:
    - Sets society approval_status to "approved"
    - Records developer who approved and timestamp
    - Only pending societies can be approved
    - Members can only access approved societies

    **Returns**: Updated society object

    **Errors**:
    - 404: Society not found
    - 403: Not a developer
    - 400: Society already approved
    """
    # Only developers can approve societies
    if current_user.global_role != "developer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only developers can approve societies"
        )

    # Get society
    stmt = select(Society).where(Society.id == society_id)
    result = await db.execute(stmt)
    society = result.scalar_one_or_none()

    if not society:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Society not found"
        )

    if society.approval_status == "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Society is already approved"
        )

    if approval.approved:
        society.approval_status = "approved"  # type: ignore[assignment]
        society.approved_by = current_user.id  # type: ignore[assignment]
        society.approved_at = datetime.utcnow()  # type: ignore[assignment]

    await db.commit()
    await db.refresh(society)

    return SocietyResponse.model_validate(society)


@router.get(
    "/{society_id}",
    response_model=SocietyResponse,
    summary="Get Society Details",
    description="Retrieve detailed information about a specific society."
)
async def get_society(
    society_id: UUID,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Get society details by ID.

    **Path Parameters**:
    - `society_id`: UUID of the society (required)

    **Permissions**:
    - Any authenticated user can view society details

    **Returns**: Complete society object including name, address, contact info, etc.

    **Errors**:
    - 404: Society not found
    """
    stmt = select(Society).where(Society.id == society_id)
    result = await db.execute(stmt)
    society = result.scalar_one_or_none()

    if not society:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Society not found"
        )

    return SocietyResponse.model_validate(society)


@router.put(
    "/{society_id}",
    response_model=SocietyResponse,
    summary="Update Society",
    description="Update society details and settings."
)
async def update_society(
    society_id: UUID,
    society_update: SocietyUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Update society information.

    **Path Parameters**:
    - `society_id`: UUID of the society (required)

    **Request Body** (all fields optional):
    - `name`: Society name
    - `address`: Street address
    - `city`: City name
    - `state`: State/province
    - `pincode`: Postal code
    - `contact_person`: Primary contact name
    - `contact_email`: Contact email
    - `contact_phone`: Contact phone
    - `logo_url`: Logo URL

    **Permissions**:
    - Developers: Can update any society
    - Admins: Can only update societies where they are admin
    - Managers/Members: Cannot update societies

    **Returns**: Updated society object

    **Errors**:
    - 404: Society not found
    - 403: Insufficient permissions (not admin or developer)
    """
    from app.core.deps import require_society_permission

    # Check permissions: only developers and admins can update
    await require_society_permission(
        current_user,
        str(society_id),
        db,
        allowed_roles=["admin"],
        action="update this society"
    )

    # Get society
    stmt = select(Society).where(Society.id == society_id)
    result = await db.execute(stmt)
    society = result.scalar_one_or_none()

    if not society:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Society not found"
        )

    # Update fields
    update_data = society_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(society, field, value)

    await db.commit()
    await db.refresh(society)

    return SocietyResponse.model_validate(society)


@router.delete(
    "/{society_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Society",
    description="Permanently delete a society and all associated data."
)
async def delete_society(
    society_id: UUID,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Delete a society permanently.

    **Path Parameters**:
    - `society_id`: UUID of the society (required)

    **Permissions**:
    - Developers: Can delete any society
    - Admins: Can only delete societies where they are admin
    - Managers/Members: Cannot delete societies

    **Cascade Behavior**:
    - Deletes all UserSociety relationships (memberships)
    - Deletes all Issues associated with the society
    - Deletes all Assets associated with the society
    - Deletes all AMC (Annual Maintenance Contract) records
    - **WARNING**: This is a destructive operation

    **Returns**: 204 No Content (success) or error

    **Errors**:
    - 404: Society not found
    - 403: Insufficient permissions
    """
    from app.core.deps import require_society_permission

    # Check permissions: only developers and admins can delete
    await require_society_permission(
        current_user,
        str(society_id),
        db,
        allowed_roles=["admin"],
        action="delete this society"
    )
    stmt = select(Society).where(Society.id == society_id)
    result = await db.execute(stmt)
    society = result.scalar_one_or_none()

    if not society:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Society not found"
        )

    await db.delete(society)
    await db.commit()


@router.post(
    "/{society_id}/join",
    response_model=UserSocietyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Request to Join Society",
    description="Submit a membership request to join a society."
)
async def join_society(
    society_id: UUID,
    join_request: Optional[UserSocietyCreate] = Body(default=None),
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Request membership in a society.

    **Path Parameters**:
    - `society_id`: UUID of the society (required)

    **Request Body**:
    - `role`: Desired role - admin, manager, or member (default: member)
    - `flat_no`: Flat/unit number (optional)
    - `wing`: Wing/block (optional)

    **Permissions**: Any authenticated user (but society must be approved)

    **Approval Workflow**:
    - **Admin requests**: Require developer approval
    - **Manager requests**: Require admin approval
    - **Member requests**: Require manager or admin approval

    **Membership Status Flow**:
    1. Initial request: status = "pending" (awaiting approval)
    2. Appropriate role approves: status = "approved" (full member access)
    3. Rejected: status = "rejected" (can re-request)
    4. User leaves: membership deleted

    **Validation**:
    - Society must be approved by a developer first
    - Prevents duplicate pending requests
    - Prevents join if already approved member
    - Allows re-requesting after rejection

    **Returns**: UserSociety object with pending status

    **Errors**:
    - 404: Society not found
    - 403: Society not approved yet
    - 400: Already a member or pending request exists
    """
    # Check society exists and is approved
    stmt = select(Society).where(Society.id == society_id)
    result = await db.execute(stmt)
    society = result.scalar_one_or_none()

    if not society:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Society not found"
        )

    # Only developers can join pending societies
    if society.approval_status != "approved" and current_user.global_role != "developer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Society is pending approval. Only developers can access pending societies."
        )

    # Check if already a member or has pending request
    stmt = select(UserSociety).where(
        and_(
            UserSociety.user_id == current_user.id,
            UserSociety.society_id == society_id
        )
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        if existing.approval_status == "approved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are already a member of this society"
            )
        elif existing.approval_status == "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have a pending request for this society"
            )
        elif existing.approval_status == "rejected":
            # Allow re-requesting
            existing.approval_status = "pending"  # type: ignore[assignment]
            existing.rejected_at = None  # type: ignore[assignment]
            existing.rejected_by = None  # type: ignore[assignment]
            await db.commit()
            await db.refresh(existing)
            return UserSocietyResponse.model_validate(existing)

    # Validate role
    requested_role = join_request.role if join_request else "member"
    if requested_role not in ["admin", "manager", "member"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'admin', 'manager', or 'member'"
        )

    # Create new membership request
    user_society = UserSociety(
        user_id=current_user.id,
        society_id=society_id,
        role=requested_role,
        flat_no=join_request.flat_no if join_request else None,
        wing=join_request.wing if join_request else None,
        approval_status="pending"
    )

    db.add(user_society)
    await db.commit()
    await db.refresh(user_society)

    return UserSocietyResponse.model_validate(user_society)


@router.get(
    "/{society_id}/members",
    response_model=List[UserSocietyResponse],
    summary="List Society Members",
    description="Get all members and pending requests for a society."
)
async def get_society_members(
    society_id: UUID,
    status_filter: Optional[str] = Query(
        None, description="Filter by status: 'pending', 'approved', or 'rejected'"),
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Get all members of a society with optional status filtering.

    **Path Parameters**:
    - `society_id`: UUID of the society (required)

    **Query Parameters**:
    - `status_filter`: Optional filter by approval status
      - "approved": Only approved members
      - "pending": Only pending requests
      - "rejected": Only rejected requests
      - null: All memberships (default)

    **Permissions**: Any authenticated user

    **Returns**: List of UserSociety objects including user details

    **Response Fields per Member**:
    - `id`: Membership record ID
    - `user_id`: Member's user ID
    - `society_id`: Society ID
    - `role`: Member role ('admin' or 'member')
    - `approval_status`: Status ('pending', 'approved', 'rejected')
    - `approved_at`: Timestamp when approved
    - `rejected_at`: Timestamp when rejected
    - `user`: Full user object
    """
    stmt = select(UserSociety).where(
        UserSociety.society_id == society_id
    ).options(selectinload(UserSociety.user))

    if status_filter:
        stmt = stmt.where(UserSociety.approval_status == status_filter)

    result = await db.execute(stmt)
    memberships = result.scalars().all()

    return [UserSocietyResponse.model_validate(m) for m in memberships]


@router.post(
    "/{society_id}/approve",
    response_model=UserSocietyResponse,
    summary="Approve or Reject Member",
    description="Approve or reject a pending membership request."
)
async def approve_member(
    society_id: UUID,
    approval: ApprovalRequest,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Approve or reject a pending membership request.

    **Path Parameters**:
    - `society_id`: UUID of the society (required)

    **Request Body**:
    - `user_society_id`: UUID of the membership request (required)
    - `approved`: Boolean - true to approve, false to reject (required)
    - `rejection_reason`: Optional reason text if rejecting (optional)

    **Permissions** (Approval Workflow):
    - **Admin requests**: Only developers can approve
    - **Manager requests**: Only admins (or developers) can approve
    - **Member requests**: Managers or admins (or developers) can approve

    **Behavior**:
    - **Approve**: Sets status to "approved", records approver & timestamp
    - **Reject**: Sets status to "rejected", records rejector & timestamp & reason
    - Can only approve/reject "pending" requests

    **Returns**: Updated UserSociety object

    **Errors**:
    - 404: Membership request not found
    - 400: Membership is not in "pending" status
    - 403: Insufficient permissions for this role approval
    """
    # Get the membership request first to check the role being requested
    stmt = select(UserSociety).where(
        UserSociety.id == approval.user_society_id)
    result = await db.execute(stmt)
    membership = result.scalar_one_or_none()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership request not found"
        )

    # Check approval permissions based on requested role
    from app.core.deps import get_user_society_role

    requested_role = membership.role
    approver_role = await get_user_society_role(current_user, str(society_id), db)

    # Approval workflow:
    # - Admin role: Only developers can approve
    # - Manager role: Only admins (or developers) can approve
    # - Member role: Managers or admins (or developers) can approve

    can_approve = False

    if current_user.global_role == "developer":
        can_approve = True
    elif requested_role == "admin":
        # Only developers can approve admins
        can_approve = False
    elif requested_role == "manager":
        # Only admins can approve managers
        can_approve = approver_role == "admin"
    elif requested_role == "member":
        # Managers or admins can approve members
        can_approve = approver_role in ["admin", "manager"]

    if not can_approve:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions to approve {requested_role} role. "
                   f"Admin approvals require developer, Manager approvals require admin, "
                   f"Member approvals require manager or admin."
        )

    if membership.approval_status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Membership is already {membership.approval_status}"
        )

    # Update membership based on approval flag
    if approval.approved:
        membership.approval_status = "approved"  # type: ignore[assignment]
        membership.approved_by = current_user.id  # type: ignore[assignment]
        membership.approved_at = datetime.utcnow()  # type: ignore[assignment]
    else:
        membership.approval_status = "rejected"  # type: ignore[assignment]
        membership.rejected_by = current_user.id
        membership.rejected_at = datetime.utcnow()
        if approval.rejection_reason:
            # type: ignore[assignment]
            membership.rejection_reason = approval.rejection_reason

    await dbmembership.rejection_reason = approval.rejection_reason  # type: ignore[assignment]

    return UserSocietyResponse.model_validate(membership)
