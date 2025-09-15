"""
スケジュール関連のスキーマ定義
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import date, time, datetime
from uuid import UUID


class ScheduleCreateRequest(BaseModel):
    """スケジュール作成リクエスト"""
    schedule_id: UUID = Field(..., description="スケジュールID")


class MemberInfo(BaseModel):
    """メンバー情報（MLエンジン用）"""
    id: str = Field(..., description="メンバーID")
    name: str = Field(..., description="メンバー名")
    part: str = Field(..., description="パート名")
    skill_level: str = Field(..., description="スキルレベル")
    availability: List[str] = Field(..., description="利用可能日")
    priority: int = Field(..., description="メンバーの優先度（1-5）")


class VenueInfo(BaseModel):
    """会場情報（MLエンジン用）"""
    id: str = Field(..., description="会場ID")
    name: str = Field(..., description="会場名")
    capacity: int = Field(..., description="収容人数")
    available_times: List[str] = Field(..., description="利用可能時間")


class ScheduleData(BaseModel):
    """スケジュール基本データ（MLエンジン用）"""
    start_date: str = Field(..., description="開始日")
    end_date: str = Field(..., description="終了日")
    practice_days: List[str] = Field(..., description="練習日")


class Constraints(BaseModel):
    """制約条件（MLエンジン用）"""
    max_practice_hours_per_week: int = Field(default=10, description="週最大練習時間")
    min_members_per_session: int = Field(default=3, description="セッション最小人数")


class MLRequestData(BaseModel):
    """MLエンジンへのリクエストデータ"""
    schedule_data: ScheduleData
    members: List[MemberInfo]
    venues: List[VenueInfo]
    constraints: Optional[Constraints] = None


class OptimizedSession(BaseModel):
    """最適化されたセッション情報"""
    date: str = Field(..., description="日付")
    time: str = Field(..., description="時間")
    venue: str = Field(..., description="会場")
    members: List[str] = Field(..., description="参加メンバー")
    part: str = Field(..., description="パート")


class OptimizedSchedule(BaseModel):
    """最適化されたスケジュール"""
    sessions: List[OptimizedSession] = Field(..., description="セッションリスト")


class Assignments(BaseModel):
    """メンバー割り当て情報"""
    member_assignments: Dict[str, List[str]] = Field(..., description="メンバー別セッション割り当て")


class MLResponse(BaseModel):
    """MLエンジンからのレスポンス"""
    optimized_schedule: OptimizedSchedule
    reward: float = Field(..., description="報酬値")
    assignments: Assignments
    processing_time: float = Field(..., description="処理時間")
    model_version: str = Field(..., description="モデルバージョン")


class SessionCreateData(BaseModel):
    """セッション作成データ"""
    part_id: UUID = Field(..., description="パートID")
    title: str = Field(..., description="セッションタイトル")
    start_time: time = Field(..., description="開始時間")
    end_time: time = Field(..., description="終了時間")
    location_in_venue: Optional[str] = Field(None, description="会場内位置")
    priority: int = Field(default=0, description="優先度")


class ScheduleOptimizationResponse(BaseModel):
    """スケジュール最適化レスポンス"""
    schedule_id: UUID = Field(..., description="スケジュールID")
    status: str = Field(..., description="処理ステータス")
    message: str = Field(..., description="メッセージ")
    optimized_sessions: List[SessionCreateData] = Field(..., description="最適化されたセッションリスト")
    processing_time: float = Field(..., description="処理時間")
    model_version: str = Field(..., description="モデルバージョン")
    created_at: datetime = Field(..., description="作成日時")


class ErrorResponse(BaseModel):
    """エラーレスポンス"""
    error: str = Field(..., description="エラーメッセージ")
    details: Optional[Dict[str, Any]] = Field(None, description="詳細情報")
