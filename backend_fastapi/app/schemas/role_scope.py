from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class RoleBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50, description="Role name")
    description: Optional[str] = Field(None, description="Role description")


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    description: Optional[str] = Field(None, description="Role description")


class ScopeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Scope name")
    description: Optional[str] = Field(None, description="Scope description")


class ScopeCreate(ScopeBase):
    pass


class ScopeUpdate(BaseModel):
    description: Optional[str] = Field(None, description="Scope description")


class ScopeResponse(ScopeBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RoleResponse(RoleBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RoleWithScopes(RoleResponse):
    scopes: List[ScopeResponse] = []


class RoleScopesUpdate(BaseModel):
    scopes: List[str] = Field(
        default_factory=list, description="List of scope names to assign"
    )
