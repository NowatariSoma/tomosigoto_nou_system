"""
スケジューリング最適化関連のスキーマ定義
"""
import os
from typing import Any
from pydantic import BaseModel, Field, field_validator
from uuid import UUID

# 環境変数から最大タイムアウト値を取得（デフォルト600秒）
MAX_TIME_LIMIT_SECONDS = int(os.getenv("OPTIMIZATION_MAX_TIME_LIMIT_SECONDS", "600"))


class OptimizationParams(BaseModel):
    """最適化パラメータ"""
    time_limit_seconds: int = Field(
        default=30,
        ge=1,
        le=MAX_TIME_LIMIT_SECONDS,
        description=f"時間制限（秒、最大{MAX_TIME_LIMIT_SECONDS}秒）"
    )
    equality_weight: int = Field(default=100, ge=0, le=1000, description="均等性重み")
    allow_overlap: bool = Field(default=False, description="重複を許可するか")
    max_iterations: int = Field(default=1000, ge=100, le=10000, description="最大反復回数")
    solution_limit: int = Field(default=10, ge=1, le=100, description="解の上限")


class OptimizationRequest(BaseModel):
    """最適化リクエスト"""
    schedule_id: UUID = Field(..., description="スケジュールID")
    optimization_params: OptimizationParams | None = Field(default=None, description="最適化パラメータ")


class PreviewRequest(BaseModel):
    """プレビューリクエスト"""
    schedule_id: UUID = Field(..., description="スケジュールID")
    optimization_params: OptimizationParams | None = Field(default=None, description="最適化パラメータ")


class OptimizationResponse(BaseModel):
    """最適化レスポンス"""
    status: str = Field(..., description="ステータス")
    schedule_id: str = Field(..., description="スケジュールID")
    sessions_created: int = Field(..., description="作成されたセッション数")
    objective_value: float = Field(..., description="目的関数値")
    is_optimal: bool = Field(..., description="最適解かどうか")
    solve_time_seconds: float = Field(..., description="求解時間（秒）")
    instructor_distribution: dict[str, int] = Field(..., description="指導者別セッション数")
    part_distribution: dict[str, int] = Field(..., description="パート別セッション数")


class PreviewResponse(BaseModel):
    """プレビューレスポンス"""
    status: str = Field(..., description="ステータス")
    schedule_id: str = Field(..., description="スケジュールID")
    preview: bool = Field(default=True, description="プレビューモード")
    sessions_count: int = Field(..., description="セッション数")
    objective_value: float = Field(..., description="目的関数値")
    is_optimal: bool = Field(..., description="最適解かどうか")
    solve_time_seconds: float = Field(..., description="求解時間（秒）")
    instructor_distribution: dict[str, int] = Field(..., description="指導者別セッション数")
    part_distribution: dict[str, int] = Field(..., description="パート別セッション数")
    schedule_matrix: dict[str, dict[str, list[dict[str, Any]]]] = Field(..., description="スケジュールマトリックス")


class ErrorResponse(BaseModel):
    """エラーレスポンス"""
    status: str = Field(default="error", description="ステータス")
    error_code: str = Field(..., description="エラーコード")
    message: str = Field(..., description="エラーメッセージ")
    details: dict[str, Any] | None = Field(default=None, description="詳細情報")
