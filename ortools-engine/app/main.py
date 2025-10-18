"""
OR-Tools最適化エンジン FastAPIアプリケーション

既存のml-engineと互換性のあるAPIを提供
"""

import time
from contextlib import asynccontextmanager
from typing import Dict, Any
import structlog
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .models.optimization import (
    OptimizationRequest, OptimizationResponse, ModelStatus, HealthStatus
)
from .services import ORToolsOptimizer, ConstraintValidator

# ログ設定
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)

# グローバル変数
optimizer: ORToolsOptimizer = None
validator: ConstraintValidator = None
start_time: float = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリケーションのライフサイクル管理"""
    global optimizer, validator, start_time
    
    # 起動時
    start_time = time.time()
    logger.info("OR-Tools最適化エンジンを起動中...")
    
    optimizer = ORToolsOptimizer(timeout_seconds=30)
    validator = ConstraintValidator()
    
    logger.info("OR-Tools最適化エンジンの起動完了")
    
    yield
    
    # 終了時
    logger.info("OR-Tools最適化エンジンを終了中...")


# FastAPIアプリケーション作成
app = FastAPI(
    title="OR-Tools最適化エンジン",
    description="能の練習表作成システム用のOR-Toolsベース最適化エンジン",
    version="1.0.0",
    lifespan=lifespan
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/ml/health", response_model=HealthStatus)
async def health_check():
    """ヘルスチェック"""
    global start_time
    
    uptime = time.time() - start_time if start_time else None
    
    return HealthStatus(
        status="healthy",
        service="ortools-engine",
        port=8001,
        endpoints=[
            "POST /api/v1/ml/predict/schedule-optimization",
            "GET /api/v1/ml/models/status",
            "GET /api/v1/ml/health"
        ],
        uptime=uptime
    )


@app.get("/api/v1/ml/models/status", response_model=ModelStatus)
async def get_model_status():
    """モデル状態確認"""
    global optimizer, validator
    
    # テスト環境では初期化されていない場合があるため、その場で初期化
    if not optimizer or not validator:
        optimizer = ORToolsOptimizer(timeout_seconds=30)
        validator = ConstraintValidator()
    
    return ModelStatus(
        model_name="ortools-optimizer",
        version="1.0.0",
        status="loaded",
        last_updated=time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        performance_metrics={
            "model_loaded": True,
            "environment_ready": True,
            "optimizer_ready": True,
            "max_scenes": 20,
            "max_rooms": 10,
            "max_timeslots": 4,
            "timeout_seconds": optimizer.timeout_seconds
        }
    )


@app.post("/api/v1/ml/predict/schedule-optimization", response_model=OptimizationResponse)
async def predict_schedule_optimization(request: OptimizationRequest):
    """スケジュール最適化（メイン機能）"""
    global optimizer, validator
    
    # テスト環境では初期化されていない場合があるため、その場で初期化
    if not optimizer or not validator:
        optimizer = ORToolsOptimizer(timeout_seconds=30)
        validator = ConstraintValidator()
    
    start_time = time.time()
    
    try:
        # 制約検証
        if not validator.validate_request(request):
            errors = validator.get_validation_errors()
            logger.warning("制約検証失敗", errors=errors)
            return OptimizationResponse(
                success=False,
                result=None,
                error=f"制約検証に失敗しました: {', '.join(errors)}",
                processing_time=time.time() - start_time
            )
        
        # 最適化実行
        logger.info("スケジュール最適化を開始", 
                   member_count=len(request.members),
                   venue_count=len(request.venues))
        
        result = optimizer.optimize_schedule(request)
        
        processing_time = time.time() - start_time
        
        if result.constraints_satisfied:
            logger.info("スケジュール最適化完了", 
                       processing_time=processing_time,
                       reward=result.reward,
                       sessions=result.optimized_schedule.total_sessions)
            
            return OptimizationResponse(
                success=True,
                result=result,
                error=None,
                processing_time=processing_time
            )
        else:
            logger.warning("スケジュール最適化失敗", 
                          processing_time=processing_time,
                          status=result.optimization_status)
            
            return OptimizationResponse(
                success=False,
                result=result,
                error=f"最適化に失敗しました (ステータス: {result.optimization_status})",
                processing_time=processing_time
            )
    
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error("スケジュール最適化中にエラーが発生", 
                    error=str(e), 
                    processing_time=processing_time)
        
        return OptimizationResponse(
            success=False,
            result=None,
            error=f"最適化中にエラーが発生しました: {str(e)}",
            processing_time=processing_time
        )


@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {
        "message": "OR-Tools最適化エンジン",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
