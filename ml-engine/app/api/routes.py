"""
ML-Engine API ルーター
練習表自動生成システム用の最小限のエンドポイント
"""
from fastapi import APIRouter, HTTPException
from app.api.schemas import (
    ScheduleOptimizationRequest,
    ScheduleOptimizationResponse,
    ModelStatusResponse
)
from app.services.scene_based_optimizer import SceneBasedOptimizerService
from app.core.exceptions import create_error_response
import time

ml_router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@ml_router.post("/predict/schedule-optimization", response_model=ScheduleOptimizationResponse)
async def optimize_schedule(request: ScheduleOptimizationRequest):
    """
    スケジュール最適化API（メイン機能）
    練習表の自動生成を行う
    """
    try:
        start_time = time.time()
        
        service = SceneBasedOptimizerService()
        result = await service.optimize(request)
        
        processing_time = time.time() - start_time
        
        return ScheduleOptimizationResponse(
            optimized_schedule=result["optimized_schedule"],
            reward=result["reward"],
            assignments=result["assignments"],
            processing_time=processing_time,
            model_version="latest"
        )
    except Exception as e:
        raise create_error_response(f"スケジュール最適化に失敗しました: {str(e)}")

@ml_router.get("/models/status", response_model=ModelStatusResponse)
async def get_models_status():
    """
    モデル状態確認API
    システムの稼働状況を確認
    """
    try:
        service = SceneBasedOptimizerService()
        status = await service.get_model_status()
        
        return ModelStatusResponse(
            model_name="scene_based_system",
            version="latest",
            status=status["status"],
            last_updated=status.get("last_updated"),
            performance_metrics=status.get("metrics")
        )
    except Exception as e:
        raise create_error_response(f"モデル状態の取得に失敗しました: {str(e)}")

@ml_router.get("/health")
async def health_check():
    """
    ヘルスチェックAPI
    サービス稼働状況の確認
    """
    return {
        "status": "healthy", 
        "service": "ml-engine", 
        "port": 8001,
        "endpoints": [
            "POST /api/v1/ml/predict/schedule-optimization",
            "GET /api/v1/ml/models/status",
            "GET /api/v1/ml/health"
        ]
    }
