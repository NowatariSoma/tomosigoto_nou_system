"""
スケジュール関連のスキーマ

既存のml-engineのAPIと互換性を保つためのデータモデル定義
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


class Member(BaseModel):
    """メンバー情報"""
    id: str = Field(..., description="メンバーID")
    name: str = Field(..., description="メンバー名")
    part: str = Field(..., description="担当パート（シテ、ワキ、地謡など）")
    skill_level: str = Field(..., description="スキルレベル")
    availability: List[str] = Field(..., description="利用可能日")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "member_1",
                "name": "田中太郎",
                "part": "謡",
                "skill_level": "上級",
                "availability": ["monday", "wednesday"]
            }
        }
    )


class Venue(BaseModel):
    """会場情報"""
    id: str = Field(..., description="会場ID")
    name: str = Field(..., description="会場名")
    capacity: int = Field(..., description="収容人数")
    available_times: List[str] = Field(..., description="利用可能時間")
    priority: int = Field(default=1, description="会場の優先度")
    equipment: List[str] = Field(default=[], description="設備・機材")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "venue_1",
                "name": "練習場A",
                "capacity": 20,
                "available_times": ["09:00-12:00", "14:00-17:00"],
                "priority": 1,
                "equipment": ["音響設備", "照明"]
            }
        }
    )


class Constraints(BaseModel):
    """制約条件"""
    max_practice_hours_per_week: int = Field(default=10, description="週最大練習時間")
    min_members_per_session: int = Field(default=3, description="セッション最小人数")
    max_sessions_per_day: int = Field(default=4, description="1日の最大セッション数")
    min_break_time: int = Field(default=30, description="最小休憩時間（分）")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "max_practice_hours_per_week": 10,
                "min_members_per_session": 3,
                "max_sessions_per_day": 4,
                "min_break_time": 30
            }
        }
    )


class ScheduleData(BaseModel):
    """スケジュール基本データ"""
    start_date: str = Field(..., description="開始日")
    end_date: str = Field(..., description="終了日")
    practice_days: List[str] = Field(..., description="練習日")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "practice_days": ["monday", "wednesday", "friday"]
            }
        }
    )


class Session(BaseModel):
    """練習セッション"""
    id: str = Field(..., description="セッションID")
    date: str = Field(..., description="日付")
    time: str = Field(..., description="時間")
    venue: str = Field(..., description="会場名")
    members: List[str] = Field(..., description="参加メンバーID")
    part: str = Field(..., description="練習パート")
    duration: int = Field(..., description="練習時間（分）")
    priority: int = Field(default=1, description="優先度")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "session_1",
                "date": "2024-01-01",
                "time": "09:00-12:00",
                "venue": "練習場A",
                "members": ["member_1", "member_2"],
                "part": "謡",
                "duration": 180,
                "priority": 1
            }
        }
    )


class Assignment(BaseModel):
    """割り当て情報"""
    member_id: str = Field(..., description="メンバーID")
    session_ids: List[str] = Field(..., description="割り当てられたセッションID")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "member_id": "member_1",
                "session_ids": ["session_1", "session_3"]
            }
        }
    )


class OptimizedSchedule(BaseModel):
    """最適化されたスケジュール"""
    sessions: List[Session] = Field(..., description="練習セッション一覧")
    assignments: Dict[str, List[str]] = Field(..., description="メンバー別セッション割り当て")
    total_sessions: int = Field(..., description="総セッション数")
    total_practice_time: int = Field(..., description="総練習時間（分）")
    venue_utilization: Dict[str, float] = Field(..., description="会場利用率")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "sessions": [],
                "assignments": {
                    "member_1": ["session_1", "session_3"],
                    "member_2": ["session_1", "session_2"]
                },
                "total_sessions": 10,
                "total_practice_time": 1800,
                "venue_utilization": {
                    "venue_1": 0.85,
                    "venue_2": 0.75
                }
            }
        }
    )


class OptimizationResult(BaseModel):
    """最適化結果"""
    optimized_schedule: OptimizedSchedule = Field(..., description="最適化されたスケジュール")
    reward: float = Field(..., description="最適化スコア")
    processing_time: float = Field(..., description="処理時間（秒）")
    model_version: str = Field(..., description="モデルバージョン")
    constraints_satisfied: bool = Field(..., description="制約満足フラグ")
    optimization_status: str = Field(..., description="最適化ステータス")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "optimized_schedule": {},
                "reward": 0.85,
                "processing_time": 2.5,
                "model_version": "ortools-v1.0.0",
                "constraints_satisfied": True,
                "optimization_status": "OPTIMAL"
            }
        }
    )
