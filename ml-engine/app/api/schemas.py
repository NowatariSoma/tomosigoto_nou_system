"""
ML-Engine API スキーマ定義
練習表自動生成システム用の最小限のスキーマ
"""
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime

class ScheduleOptimizationRequest(BaseModel):
    """
    スケジュール最適化リクエスト
    練習表生成に必要なデータ
    """
    schedule_data: Dict[str, Any]  # 基本スケジュールデータ
    members: List[Dict[str, Any]]  # メンバー情報
    venues: List[Dict[str, Any]]   # 会場情報
    constraints: Optional[Dict[str, Any]] = None  # 制約条件

class ScheduleOptimizationResponse(BaseModel):
    """
    スケジュール最適化レスポンス
    最適化された練習表と結果
    """
    optimized_schedule: Dict[str, Any]  # 最適化されたスケジュール
    reward: float                       # 最適化スコア
    assignments: Dict[str, Any]         # メンバー割り当て結果
    processing_time: float              # 処理時間（秒）
    model_version: str                  # 使用モデルバージョン

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
