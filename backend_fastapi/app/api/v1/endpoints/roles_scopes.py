from typing import List, cast, Optional
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_active_user
from app.database import get_session
from app.models import Role, Scope, RoleScope, User
from app.schemas.role_scope import (
    RoleCreate,
    RoleUpdate,
    RoleResponse,
    RoleWithScopes,
    ScopeCreate,
    ScopeUpdate,
    ScopeResponse,
    RoleScopesUpdate,
)
from app.schemas.user import UserResponse

router = APIRouter(prefix="/roles", tags=["Roles & Scopes"])


# Utility helpers
async def _require_developer_or_admin(user: UserResponse) -> None:
    if user.global_role not in {"developer", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires developer or admin role",
        )


@router.get("", response_model=List[RoleResponse], summary="List roles")
async def list_roles(db: AsyncSession = Depends(get_session)):
    result = await db.execute(select(Role).order_by(Role.name))
    roles = result.scalars().all()
    return [RoleResponse.model_validate(r) for r in roles]


@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED, summary="Create role")
async def create_role(
    payload: RoleCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    await _require_developer_or_admin(current_user)

    name = payload.name.strip().lower()
    # Check duplicate
    result = await db.execute(select(Role).where(Role.name == name))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Role already exists")

    role = Role(name=name, description=payload.description or payload.name)
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return RoleResponse.model_validate(role)


@router.patch("/{role_name}", response_model=RoleResponse, summary="Update role")
async def update_role(
    role_name: str,
    payload: RoleUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    await _require_developer_or_admin(current_user)

    name = role_name.strip().lower()
    result = await db.execute(select(Role).where(Role.name == name))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if payload.description is not None:
        role.description = cast(str, payload.description)

    await db.commit()
    await db.refresh(role)
    return RoleResponse.model_validate(role)


@router.delete("/{role_name}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete role")
async def delete_role(
    role_name: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    await _require_developer_or_admin(current_user)

    name = role_name.strip().lower()
    result = await db.execute(select(Role).where(Role.name == name))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Prevent deletion if users reference this role
    count_result = await db.execute(select(func.count()).select_from(User).where(User.global_role == name))
    user_count = count_result.scalar_one()
    if user_count:
        raise HTTPException(
            status_code=400, detail="Cannot delete role in use by users")

    await db.execute(delete(RoleScope).where(RoleScope.role_id == role.id))
    await db.execute(delete(Role).where(Role.id == role.id))
    await db.commit()
    return None


@router.get("/{role_name}/scopes", response_model=RoleWithScopes, summary="List scopes for a role")
async def get_role_scopes(role_name: str, db: AsyncSession = Depends(get_session)):
    name = role_name.strip().lower()
    result = await db.execute(
        select(Role)
        .where(Role.name == name)
        .options(selectinload(Role.role_scopes).selectinload(RoleScope.scope))
    )
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    scopes = [ScopeResponse.model_validate(
        rs.scope) for rs in role.role_scopes]
    return RoleWithScopes(
        id=cast(UUID, role.id),
        name=cast(str, role.name),
        description=cast(Optional[str], role.description),
        created_at=cast(datetime, role.created_at),
        updated_at=cast(datetime, role.updated_at),
        scopes=scopes,
    )


@router.put("/{role_name}/scopes", response_model=RoleWithScopes, summary="Replace scopes for a role")
async def set_role_scopes(
    role_name: str,
    payload: RoleScopesUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    await _require_developer_or_admin(current_user)

    name = role_name.strip().lower()
    result = await db.execute(select(Role).where(Role.name == name))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Fetch scopes by name
    scope_names = {s.strip().lower() for s in payload.scopes}
    result = await db.execute(select(Scope).where(Scope.name.in_(scope_names)))
    scopes = result.scalars().all()

    if len(scopes) != len(scope_names):
        missing = scope_names - cast(set, {cast(str, s.name) for s in scopes})
        raise HTTPException(
            status_code=400,
            detail=f"Scopes not found: {', '.join(sorted(missing))}",
        )

    # Replace mappings
    await db.execute(delete(RoleScope).where(RoleScope.role_id == role.id))
    for scope in scopes:
        db.add(RoleScope(role_id=role.id, scope_id=scope.id))

    await db.commit()

    # Reload role with scopes
    result = await db.execute(
        select(Role)
        .where(Role.id == role.id)
        .options(selectinload(Role.role_scopes).selectinload(RoleScope.scope))
    )
    role = result.scalar_one()
    scopes_resp = [ScopeResponse.model_validate(
        rs.scope) for rs in role.role_scopes]

    return RoleWithScopes(
        id=cast(UUID, role.id),
        name=cast(str, role.name),
        description=cast(Optional[str], role.description),
        created_at=cast(datetime, role.created_at),
        updated_at=cast(datetime, role.updated_at),
        scopes=scopes_resp,
    )


@router.get("/scopes", response_model=List[ScopeResponse], summary="List scopes")
async def list_scopes(db: AsyncSession = Depends(get_session)):
    result = await db.execute(select(Scope).order_by(Scope.name))
    scopes = result.scalars().all()
    return [ScopeResponse.model_validate(s) for s in scopes]


@router.post("/scopes", response_model=ScopeResponse, status_code=status.HTTP_201_CREATED, summary="Create scope")
async def create_scope(
    payload: ScopeCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    await _require_developer_or_admin(current_user)

    name = payload.name.strip().lower()
    result = await db.execute(select(Scope).where(Scope.name == name))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Scope already exists")

    scope = Scope(name=name, description=payload.description or payload.name)
    db.add(scope)
    await db.commit()
    await db.refresh(scope)
    return ScopeResponse.model_validate(scope)


@router.patch("/scopes/{scope_name}", response_model=ScopeResponse, summary="Update scope")
async def update_scope(
    scope_name: str,
    payload: ScopeUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    await _require_developer_or_admin(current_user)

    name = scope_name.strip().lower()
    result = await db.execute(select(Scope).where(Scope.name == name))
    scope = result.scalar_one_or_none()
    if not scope:
        raise HTTPException(status_code=404, detail="Scope not found")

    if payload.description is not None:
        scope.description = cast(str, payload.description)

    await db.commit()
    await db.refresh(scope)
    return ScopeResponse.model_validate(scope)


@router.delete("/scopes/{scope_name}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete scope")
async def delete_scope(
    scope_name: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    await _require_developer_or_admin(current_user)

    name = scope_name.strip().lower()
    result = await db.execute(select(Scope).where(Scope.name == name))
    scope = result.scalar_one_or_none()
    if not scope:
        raise HTTPException(status_code=404, detail="Scope not found")

    await db.execute(delete(RoleScope).where(RoleScope.scope_id == scope.id))
    await db.execute(delete(Scope).where(Scope.id == scope.id))
    await db.commit()
    return None
