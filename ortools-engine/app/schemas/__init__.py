"""
データスキーマ

最適化エンジン用のPydanticモデル
"""

from .optimization import (
    OptimizationRequest,
    OptimizationResponse,
    ModelStatus,
    HealthStatus
)
from .schedule import (
    Member,
    Venue,
    Constraints,
    ScheduleData,
    Session,
    Assignment,
    OptimizedSchedule,
    OptimizationResult
)

__all__ = [
    # 最適化関連
    "OptimizationRequest",
    "OptimizationResponse", 
    "ModelStatus",
    "HealthStatus",
    # スケジュール関連
    "Member",
    "Venue",
    "Constraints",
    "ScheduleData",
    "Session",
    "Assignment",
    "OptimizedSchedule",
    "OptimizationResult"
]
