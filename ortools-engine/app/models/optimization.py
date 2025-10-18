"""
最適化関連のデータモデル

APIリクエスト・レスポンス用のデータモデル定義
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from .schedule import ScheduleData, Member, Venue, Constraints, OptimizationResult


class OptimizationRequest(BaseModel):
    """最適化リクエスト"""
    schedule_data: ScheduleData = Field(..., description="スケジュール基本データ")
    members: List[Member] = Field(..., description="メンバー一覧")
    venues: List[Venue] = Field(..., description="会場一覧")
    constraints: Optional[Constraints] = Field(default=None, description="制約条件")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "schedule_data": {
                    "start_date": "2024-01-01",
                    "end_date": "2024-01-31",
                    "practice_days": ["monday", "wednesday", "friday"]
                },
                "members": [
                    {
                        "id": "member_1",
                        "name": "田中太郎",
                        "part": "謡",
                        "skill_level": "上級",
                        "availability": ["monday", "wednesday"]
                    }
                ],
                "venues": [
                    {
                        "id": "venue_1",
                        "name": "練習場A",
                        "capacity": 20,
                        "available_times": ["09:00-12:00", "14:00-17:00"]
                    }
                ],
                "constraints": {
                    "max_practice_hours_per_week": 10,
                    "min_members_per_session": 3
                }
            }
        }
    )


class OptimizationResponse(BaseModel):
    """最適化レスポンス"""
    success: bool = Field(..., description="成功フラグ")
    result: Optional[OptimizationResult] = Field(default=None, description="最適化結果")
    error: Optional[str] = Field(default=None, description="エラーメッセージ")
    processing_time: float = Field(..., description="処理時間（秒）")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "result": {
                    "optimized_schedule": {},
                    "reward": 0.85,
                    "processing_time": 2.5,
                    "model_version": "ortools-v1.0.0",
                    "constraints_satisfied": True,
                    "optimization_status": "OPTIMAL"
                },
                "error": None,
                "processing_time": 2.5
            }
        }
    )


class ModelStatus(BaseModel):
    """モデル状態"""
    model_name: str = Field(..., description="モデル名")
    version: str = Field(..., description="バージョン")
    status: str = Field(..., description="状態")
    last_updated: str = Field(..., description="最終更新日時")
    performance_metrics: Dict[str, Any] = Field(..., description="パフォーマンス指標")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "model_name": "ortools-optimizer",
                "version": "1.0.0",
                "status": "loaded",
                "last_updated": "2024-01-15T10:30:00Z",
                "performance_metrics": {
                    "model_loaded": True,
                    "environment_ready": True,
                    "optimizer_ready": True,
                    "max_scenes": 20,
                    "max_rooms": 10,
                    "max_timeslots": 4
                }
            }
        }
    )


class HealthStatus(BaseModel):
    """ヘルスチェック状態"""
    status: str = Field(..., description="状態")
    service: str = Field(..., description="サービス名")
    port: int = Field(..., description="ポート番号")
    endpoints: List[str] = Field(..., description="利用可能エンドポイント")
    uptime: Optional[float] = Field(default=None, description="稼働時間（秒）")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "healthy",
                "service": "ortools-engine",
                "port": 8001,
                "endpoints": [
                    "POST /api/v1/ml/predict/schedule-optimization",
                    "GET /api/v1/ml/models/status",
                    "GET /api/v1/ml/health"
                ],
                "uptime": 3600.0
            }
        }
    )