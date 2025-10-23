"""
スケジューリング最適化関連のスキーマ定義
"""
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from uuid import UUID


class OptimizationParams(BaseModel):
    """最適化パラメータ"""
    time_limit_seconds: int = Field(default=30, ge=1, le=300, description="時間制限（秒）")
    equality_weight: int = Field(default=100, ge=0, le=1000, description="均等性重み")
    allow_overlap: bool = Field(default=False, description="重複を許可するか")
    max_iterations: int = Field(default=1000, ge=100, le=10000, description="最大反復回数")
    solution_limit: int = Field(default=10, ge=1, le=100, description="解の上限")


class OptimizationRequest(BaseModel):
    """最適化リクエスト"""
    schedule_id: UUID = Field(..., description="スケジュールID")
    optimization_params: Optional[OptimizationParams] = Field(default=None, description="最適化パラメータ")


class PreviewRequest(BaseModel):
    """プレビューリクエスト"""
    schedule_id: UUID = Field(..., description="スケジュールID")
    optimization_params: Optional[OptimizationParams] = Field(default=None, description="最適化パラメータ")


class OptimizationResponse(BaseModel):
    """最適化レスポンス"""
    status: str = Field(..., description="ステータス")
    schedule_id: str = Field(..., description="スケジュールID")
    sessions_created: int = Field(..., description="作成されたセッション数")
    objective_value: float = Field(..., description="目的関数値")
    is_optimal: bool = Field(..., description="最適解かどうか")
    solve_time_seconds: float = Field(..., description="求解時間（秒）")
    instructor_distribution: Dict[str, int] = Field(..., description="指導者別セッション数")
    part_distribution: Dict[str, int] = Field(..., description="パート別セッション数")


class PreviewResponse(BaseModel):
    """プレビューレスポンス"""
    status: str = Field(..., description="ステータス")
    schedule_id: str = Field(..., description="スケジュールID")
    preview: bool = Field(default=True, description="プレビューモード")
    sessions_count: int = Field(..., description="セッション数")
    objective_value: float = Field(..., description="目的関数値")
    is_optimal: bool = Field(..., description="最適解かどうか")
    solve_time_seconds: float = Field(..., description="求解時間（秒）")
    instructor_distribution: Dict[str, int] = Field(..., description="指導者別セッション数")
    part_distribution: Dict[str, int] = Field(..., description="パート別セッション数")
    schedule_matrix: Dict[str, Dict[str, List[Dict[str, Any]]]] = Field(..., description="スケジュールマトリックス")


class ErrorResponse(BaseModel):
    """エラーレスポンス"""
    status: str = Field(default="error", description="ステータス")
    error_code: str = Field(..., description="エラーコード")
    message: str = Field(..., description="エラーメッセージ")
    details: Optional[Dict[str, Any]] = Field(default=None, description="詳細情報")
