"""
スケジュール関連のデータモデル定義
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, date, time
from uuid import UUID, uuid4


class PracticeSchedule(BaseModel):
    """練習スケジュールのドメインモデル"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(default_factory=uuid4, description="スケジュールID")
    venue_id: UUID = Field(description="会場ID")
    schedule_date: date = Field(description="練習日")
    start_time: time = Field(description="開始時間")
    end_time: time = Field(description="終了時間")
    title: str = Field(description="練習タイトル")
    description: Optional[str] = Field(None, description="説明")
    schedule_type: str = Field(default="regular", description="練習種別")
    status: str = Field(default="draft", description="ステータス")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="メタデータ")
    created_at: datetime = Field(default_factory=datetime.now, description="作成日時")
    updated_at: datetime = Field(default_factory=datetime.now, description="更新日時")
    created_by: UUID = Field(description="作成者ID")
    
    def duration_minutes(self) -> int:
        """練習時間（分）を計算"""
        start_datetime = datetime.combine(self.schedule_date, self.start_time)
        end_datetime = datetime.combine(self.schedule_date, self.end_time)
        return int((end_datetime - start_datetime).total_seconds() / 60)
    
    def is_active(self) -> bool:
        """有効なスケジュールかどうか確認"""
        return self.status in ["published", "in_progress"]
    
    def to_dict(self) -> dict:
        """辞書形式に変換"""
        return {
            "id": str(self.id),
            "venue_id": str(self.venue_id),
            "schedule_date": self.schedule_date.isoformat(),
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat(),
            "title": self.title,
            "description": self.description,
            "schedule_type": self.schedule_type,
            "status": self.status,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "created_by": str(self.created_by),
            "duration_minutes": self.duration_minutes()
        }


class Session(BaseModel):
    """セッションのドメインモデル"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(default_factory=uuid4, description="セッションID")
    schedule_id: UUID = Field(description="スケジュールID参照")
    start_time: time = Field(description="開始時間")
    end_time: time = Field(description="終了時間")
    title: str = Field(description="セッションタイトル")
    description: Optional[str] = Field(None, description="説明")
    session_type: str = Field(default="practice", description="セッション種別")
    priority: int = Field(default=1, ge=1, le=10, description="優先度")
    resources: Dict[str, Any] = Field(default_factory=dict, description="必要リソース")
    location_in_venue: Optional[str] = Field(None, description="会場内位置")
    status: str = Field(default="scheduled", description="ステータス")
    created_at: datetime = Field(default_factory=datetime.now, description="作成日時")
    updated_at: datetime = Field(default_factory=datetime.now, description="更新日時")
    
    def duration_minutes(self) -> int:
        """セッション時間（分）を計算"""
        start_datetime = datetime.combine(datetime.today(), self.start_time)
        end_datetime = datetime.combine(datetime.today(), self.end_time)
        return int((end_datetime - start_datetime).total_seconds() / 60)
    
    def overlaps_with(self, other_session: 'Session') -> bool:
        """他のセッションと重複するか確認"""
        return not (self.end_time <= other_session.start_time or 
                   self.start_time >= other_session.end_time)
    
    def to_dict(self) -> dict:
        """辞書形式に変換"""
        return {
            "id": str(self.id),
            "schedule_id": str(self.schedule_id),
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat(),
            "title": self.title,
            "description": self.description,
            "session_type": self.session_type,
            "priority": self.priority,
            "resources": self.resources,
            "location_in_venue": self.location_in_venue,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "duration_minutes": self.duration_minutes()
        }


class SessionInstructor(BaseModel):
    """セッション担当者のドメインモデル"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(default_factory=uuid4, description="担当者ID")
    session_id: UUID = Field(description="セッションID参照")
    user_id: UUID = Field(description="ユーザーID参照")
    role: str = Field(default="instructor", description="役割")
    status: str = Field(default="assigned", description="ステータス")
    notes: Dict[str, Any] = Field(default_factory=dict, description="備考")
    created_at: datetime = Field(default_factory=datetime.now, description="作成日時")
    updated_at: datetime = Field(default_factory=datetime.now, description="更新日時")
    
    def is_primary(self) -> bool:
        """主担当かどうか確認"""
        return self.role == "primary"
    
    def to_dict(self) -> dict:
        """辞書形式に変換"""
        return {
            "id": str(self.id),
            "session_id": str(self.session_id),
            "user_id": str(self.user_id),
            "role": self.role,
            "status": self.status,
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


class PartSessionAssignment(BaseModel):
    """パート別セッション割り当てのドメインモデル"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(default_factory=uuid4, description="割り当てID")
    session_id: UUID = Field(description="セッションID参照")
    part_id: UUID = Field(description="パートID参照")
    priority: int = Field(default=1, ge=1, le=10, description="優先度")
    is_required: bool = Field(default=False, description="必須参加フラグ")
    special_requirements: Dict[str, Any] = Field(default_factory=dict, description="特別要件")
    status: str = Field(default="assigned", description="ステータス")
    created_at: datetime = Field(default_factory=datetime.now, description="作成日時")
    updated_at: datetime = Field(default_factory=datetime.now, description="更新日時")
    
    def to_dict(self) -> dict:
        """辞書形式に変換"""
        return {
            "id": str(self.id),
            "session_id": str(self.session_id),
            "part_id": str(self.part_id),
            "priority": self.priority,
            "is_required": self.is_required,
            "special_requirements": self.special_requirements,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


class Venue(BaseModel):
    """会場のドメインモデル"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(default_factory=uuid4, description="会場ID")
    name: str = Field(description="会場名")
    capacity: Optional[int] = Field(None, description="収容人数")
    address: Optional[str] = Field(None, description="住所")
    created_at: datetime = Field(default_factory=datetime.now, description="作成日時")
    updated_at: datetime = Field(default_factory=datetime.now, description="更新日時")


class PartDefinition(BaseModel):
    """パート定義のドメインモデル"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(default_factory=uuid4, description="パートID")
    name: str = Field(description="パート名")
    description: Optional[str] = Field(None, description="説明")
    parent_id: Optional[UUID] = Field(None, description="親パートID")
    created_at: datetime = Field(default_factory=datetime.now, description="作成日時")
    updated_at: datetime = Field(default_factory=datetime.now, description="更新日時")