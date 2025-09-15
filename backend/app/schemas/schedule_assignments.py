from pydantic import BaseModel, Field, field_validator
from typing import Optional, Union, Any
from datetime import datetime
from uuid import UUID


class ScheduleAssignmentBase(BaseModel):
    practice_slot_id: Union[UUID, str]
    time_slot: str = Field(..., description="時間スロット（例: 19:00）")
    group_id: Union[UUID, str]
    part_id: Union[UUID, str]
    notes: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

    @field_validator('practice_slot_id', 'group_id', 'part_id', mode='before')
    @classmethod
    def convert_str_to_uuid(cls, v: Any) -> UUID:
        if isinstance(v, str):
            try:
                return UUID(v)
            except ValueError:
                raise ValueError(f"Invalid UUID format: {v}")
        return v


class ScheduleAssignmentCreate(ScheduleAssignmentBase):
    pass


class ScheduleAssignmentUpdate(BaseModel):
    part_id: Optional[UUID] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class ScheduleAssignmentResponse(ScheduleAssignmentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        # 文字列からUUIDへの自動変換を有効化
        str_strip_whitespace = True
        validate_assignment = True


class ScheduleAssignmentWithDetails(ScheduleAssignmentResponse):
    group_name: Optional[str] = None
    group_display_name: Optional[str] = None
    group_color: Optional[str] = None
    part_name: Optional[str] = None
    part_display_name: Optional[str] = None
