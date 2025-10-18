"""
最適化エンドポイント

既存のml-engineのAPIと互換性を保つエンドポイント
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from app.schemas import (
    OptimizationRequest,
    OptimizationResponse,
    ModelStatus,
    HealthStatus
)
from app.services.optimization_service import OptimizationService
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


def get_optimization_service() -> OptimizationService:
    """最適化サービスの依存性注入"""
    return OptimizationService()


@router.get("/health", response_model=HealthStatus)
async def health_check():
    """ヘルスチェック"""
    try:
        return HealthStatus(
            status="healthy",
            service="ortools-engine",
            port=settings.PORT,
            endpoints=[
                "POST /api/v1/ortools/predict/schedule-optimization",
                "GET /api/v1/ortools/models/status",
                "GET /api/v1/ortools/health"
            ],
            uptime=None  # 実装時に稼働時間を計算
        )
    except Exception as e:
        logger.error(f"ヘルスチェックエラー: {str(e)}")
        raise HTTPException(status_code=500, detail="ヘルスチェックに失敗しました")


@router.get("/models/status", response_model=ModelStatus)
async def get_model_status(
    optimization_service: OptimizationService = Depends(get_optimization_service)
):
    """モデル状態確認"""
    try:
        return await optimization_service.get_model_status()
    except Exception as e:
        logger.error(f"モデル状態確認エラー: {str(e)}")
        raise HTTPException(status_code=500, detail="モデル状態の確認に失敗しました")


@router.post("/predict/schedule-optimization", response_model=OptimizationResponse)
async def predict_schedule_optimization(
    request: OptimizationRequest,
    optimization_service: OptimizationService = Depends(get_optimization_service)
):
    """スケジュール最適化（メイン機能）"""
    try:
        logger.info(f"スケジュール最適化リクエスト受信: {len(request.members)}名, {len(request.venues)}会場")
        
        result = await optimization_service.optimize_schedule(request)
        
        logger.info(f"スケジュール最適化完了: {result.processing_time:.2f}秒")
        return result
        
    except Exception as e:
        logger.error(f"スケジュール最適化エラー: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"スケジュール最適化に失敗しました: {str(e)}"
        )
