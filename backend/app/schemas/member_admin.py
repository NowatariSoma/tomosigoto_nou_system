from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel


class MemberSummaryResponse(BaseModel):
    id: UUID
    email: str
    name: str
    role: Literal["admin", "basic", "viewer"]
    is_instructor: bool = False
    last_active_at: Optional[datetime] = None


class MemberRoleUpdateRequest(BaseModel):
    role: Literal["admin", "basic", "viewer"]


class MemberInstructorUpdateRequest(BaseModel):
    is_instructor: bool

