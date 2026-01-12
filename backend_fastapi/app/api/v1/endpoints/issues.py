"""
Issues/Complaints API endpoints using SQLAlchemy ORM.

This module provides endpoints for issue/complaint management.
"""

from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_active_user, check_society_access
from app.database import get_session
from app.models import Issue, IssueComment, UserSociety, Society
from app.schemas.issue import (
    IssueResponse,
    IssueCreate,
    IssueUpdate,
    IssueCommentCreate,
    IssueCommentResponse
)
from app.schemas.user import UserInDB

router = APIRouter(prefix="/issues", tags=["Issues"])


@router.get(
    "",
    response_model=List[IssueResponse],
    summary="List Issues",
    description="Get list of issues with filtering."
)
async def list_issues(
    society_id: Optional[UUID] = Query(None),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    category: Optional[str] = Query(None, description="Filter by category"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """List issues with filtering options."""
    stmt = select(Issue)

    if society_id:
        await check_society_access(current_user, str(society_id), db)
        stmt = stmt.where(Issue.society_id == society_id)
    else:
        # Get issues from user's societies
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

        stmt = stmt.where(Issue.society_id.in_(society_ids))

    # Apply filters
    if status_filter:
        stmt = stmt.where(Issue.status == status_filter)

    if priority:
        stmt = stmt.where(Issue.priority == priority)

    if category:
        stmt = stmt.where(Issue.category == category)

    # Order and pagination
    stmt = stmt.order_by(Issue.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(stmt)
    issues = result.scalars().all()

    return [IssueResponse.model_validate(i) for i in issues]


@router.post(
    "",
    response_model=IssueResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Issue",
    description="Create a new issue/complaint."
)
async def create_issue(
    issue: IssueCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Create a new issue/complaint.

    Requires user to be a member of the society (any role).
    """
    # Check society exists first
    stmt = select(Society).where(Society.id == issue.society_id)
    result = await db.execute(stmt)
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Society not found"
        )

    # Check user is member of society
    await check_society_access(current_user, str(issue.society_id), db)

    # Create issue
    new_issue = Issue(
        id=uuid4(),
        society_id=issue.society_id,
        title=issue.title,
        description=issue.description,
        category=issue.category,
        priority=issue.priority,
        status="open",
        reported_by=current_user.id,
        location=issue.location,
        images=issue.images or [],
        attachment_urls=issue.attachment_urls or [],
        issue_date=datetime.utcnow(),
        target_resolution_date=issue.target_resolution_date
    )

    db.add(new_issue)
    await db.commit()
    await db.refresh(new_issue)

    return IssueResponse.model_validate(new_issue)


@router.get(
    "/{issue_id}",
    response_model=IssueResponse,
    summary="Get Issue",
    description="Get details of a specific issue."
)
async def get_issue(
    issue_id: UUID,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """Get issue by ID."""
    stmt = select(Issue).where(Issue.id == issue_id)
    result = await db.execute(stmt)
    issue = result.scalar_one_or_none()

    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )

    # Check user has access to the society
    await check_society_access(current_user, str(issue.society_id), db)

    return IssueResponse.model_validate(issue)


@router.put(
    "/{issue_id}",
    response_model=IssueResponse,
    summary="Update Issue",
    description="Update issue details."
)
async def update_issue(
    issue_id: UUID,
    issue_update: IssueUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Update issue details.

    Issue reporter, assignee, admins, or managers can update.
    Members can only update issues they reported.
    """
    # Get issue
    stmt = select(Issue).where(Issue.id == issue_id)
    result = await db.execute(stmt)
    issue = result.scalar_one_or_none()

    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )

    # Check permissions
    from app.core.deps import get_user_society_role

    is_reporter = str(issue.reported_by) == str(current_user.id)
    is_assignee = issue.assigned_to and str(
        issue.assigned_to) == str(current_user.id)
    user_role = await get_user_society_role(current_user, str(issue.society_id), db)
    is_admin_or_manager = user_role in ["admin", "manager"]

    if not (is_reporter or is_assignee or is_admin_or_manager):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this issue"
        )

    # Update fields
    update_data = issue_update.model_dump(exclude_unset=True)

    # If status is being changed to resolved, set resolved_date
    if "status" in update_data and update_data["status"] == "resolved" and issue.status != "resolved":
        update_data["resolved_date"] = datetime.utcnow()

    for field, value in update_data.items():
        setattr(issue, field, value)

    await db.commit()
    await db.refresh(issue)

    return IssueResponse.model_validate(issue)


@router.delete(
    "/{issue_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Issue",
    description="Delete an issue."
)
async def delete_issue(
    issue_id: UUID,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Delete an issue.

    Only issue reporter, society admins, or developers can delete.
    Managers and members can only delete issues they reported.
    """
    # Get issue
    stmt = select(Issue).where(Issue.id == issue_id)
    result = await db.execute(stmt)
    issue = result.scalar_one_or_none()

    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )

    # Check permissions
    from app.core.deps import get_user_society_role

    is_reporter = str(issue.reported_by) == str(current_user.id)
    user_role = await get_user_society_role(current_user, str(issue.society_id), db)
    is_admin = user_role == "admin"

    if not (is_reporter or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this issue"
        )

    await db.delete(issue)
    await db.commit()


@router.post(
    "/{issue_id}/comments",
    response_model=IssueCommentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add Comment",
    description="Add a comment to an issue."
)
async def add_comment(
    issue_id: UUID,
    comment: IssueCommentCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Add a comment to an issue.

    Requires user to be a member of the society.
    """
    # Get issue
    stmt = select(Issue).where(Issue.id == issue_id)
    result = await db.execute(stmt)
    issue = result.scalar_one_or_none()

    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )

    # Check user has access to the society
    stmt = select(UserSociety).where(
        and_(
            UserSociety.user_id == current_user.id,
            UserSociety.society_id == issue.society_id,
            UserSociety.approval_status == "approved"
        )
    )
    result = await db.execute(stmt)
    if not result.scalar_one_or_none() and current_user.global_role != "developer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this issue"
        )

    # Create comment
    new_comment = IssueComment(
        id=uuid4(),
        issue_id=issue_id,
        user_id=current_user.id,
        comment=comment.comment,
        attachment_url=comment.attachment_url
    )

    db.add(new_comment)
    await db.commit()
    await db.refresh(new_comment)

    return IssueCommentResponse.model_validate(new_comment)


@router.get(
    "/{issue_id}/comments",
    response_model=List[IssueCommentResponse],
    summary="Get Comments",
    description="Get all comments for an issue."
)
async def get_comments(
    issue_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    """Get all comments for an issue."""
    # Get issue to check access
    stmt = select(Issue).where(Issue.id == issue_id)
    result = await db.execute(stmt)
    issue = result.scalar_one_or_none()

    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )

    # Check user has access to the society
    stmt = select(UserSociety).where(
        and_(
            UserSociety.user_id == current_user.id,
            UserSociety.society_id == issue.society_id,
            UserSociety.approval_status == "approved"
        )
    )
    result = await db.execute(stmt)
    if not result.scalar_one_or_none() and current_user.global_role != "developer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this issue"
        )

    # Get comments with pagination
    stmt = select(IssueComment).where(
        IssueComment.issue_id == issue_id
    ).order_by(IssueComment.created_at.asc()).offset(skip).limit(limit)

    result = await db.execute(stmt)
    comments = result.scalars().all()

    return [IssueCommentResponse.model_validate(c) for c in comments]
