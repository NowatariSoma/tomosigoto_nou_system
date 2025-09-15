"""
ML-Engine API スキーマ定義
練習表自動生成システム用の最小限のスキーマ
"""
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime

class MemberInfo(BaseModel):
    """メンバー情報"""
    id: str
    name: str
    part: str
    skill_level: str
    availability: List[str]
    priority: int  # 1-5の優先度

class VenueInfo(BaseModel):
    """会場情報"""
    id: str
    name: str
    capacity: int
    available_times: List[str]

class ScheduleData(BaseModel):
    """スケジュール基本データ"""
    start_date: str
    end_date: str
    practice_days: List[str]

class Constraints(BaseModel):
    """制約条件"""
    max_practice_hours_per_week: int = 10
    min_members_per_session: int = 3

class ScheduleOptimizationRequest(BaseModel):
    """
    スケジュール最適化リクエスト
    練習表生成に必要なデータ
    """
    schedule_data: ScheduleData
    members: List[MemberInfo]
    venues: List[VenueInfo]
    constraints: Optional[Constraints] = None

class OptimizedSession(BaseModel):
    """最適化されたセッション情報"""
    date: str
    time: str
    venue: str
    members: List[str]
    part: str

class OptimizedSchedule(BaseModel):
    """最適化されたスケジュール"""
    sessions: List[OptimizedSession]

class Assignments(BaseModel):
    """メンバー割り当て情報"""
    member_assignments: Dict[str, List[str]]

class ScheduleOptimizationResponse(BaseModel):
    """
    スケジュール最適化レスポンス
    最適化された練習表と結果
    """
    optimized_schedule: OptimizedSchedule
    reward: float
    assignments: Assignments
    processing_time: float
    model_version: str

class ModelStatusResponse(BaseModel):
    """
    モデル状態レスポンス
    システム稼働状況の確認
    """
    model_name: str                     # モデル名
    version: str                        # モデルバージョン
    status: str                         # 稼働状態
    last_updated: Optional[datetime]    # 最終更新日時
    performance_metrics: Optional[Dict[str, Any]] = None  # 性能指標
