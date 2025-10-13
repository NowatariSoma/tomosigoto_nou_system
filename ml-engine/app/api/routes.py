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
from app.core.config import settings
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

@ml_router.get("/optimization/config")
async def get_optimization_config():
    """
    最適化設定取得API
    現在の最適化アルゴリズム設定を取得
    """
    return {
        "algorithm_type": settings.OPTIMIZATION.get("algorithm_type", "greedy"),
        "use_algorithm_fallback": settings.OPTIMIZATION.get("use_algorithm_fallback", True),
        "max_iterations": settings.OPTIMIZATION.get("max_iterations", 1000),
        "timeout_seconds": settings.OPTIMIZATION.get("timeout_seconds", 30),
        "available_algorithms": ["greedy", "genetic"]
    }

@ml_router.post("/optimization/config")
async def update_optimization_config(config: dict):
    """
    最適化設定更新API
    最適化アルゴリズムの設定を更新
    """
    try:
        # 設定の更新
        if "algorithm_type" in config:
            if config["algorithm_type"] not in ["greedy", "genetic"]:
                raise HTTPException(status_code=400, detail="無効なアルゴリズムタイプです")
            settings.OPTIMIZATION["algorithm_type"] = config["algorithm_type"]
        
        if "use_algorithm_fallback" in config:
            settings.OPTIMIZATION["use_algorithm_fallback"] = bool(config["use_algorithm_fallback"])
        
        if "max_iterations" in config:
            settings.OPTIMIZATION["max_iterations"] = max(1, int(config["max_iterations"]))
        
        if "timeout_seconds" in config:
            settings.OPTIMIZATION["timeout_seconds"] = max(1, int(config["timeout_seconds"]))
        
        return {
            "message": "設定が更新されました",
            "current_config": {
                "algorithm_type": settings.OPTIMIZATION.get("algorithm_type", "greedy"),
                "use_algorithm_fallback": settings.OPTIMIZATION.get("use_algorithm_fallback", True),
                "max_iterations": settings.OPTIMIZATION.get("max_iterations", 1000),
                "timeout_seconds": settings.OPTIMIZATION.get("timeout_seconds", 30)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"設定の更新に失敗しました: {str(e)}")
