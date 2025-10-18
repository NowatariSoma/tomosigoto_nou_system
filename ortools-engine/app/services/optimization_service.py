"""
最適化サービス

OR-Toolsを使用したスケジュール最適化のビジネスロジック
"""

import logging
import time
from typing import Dict, Any
from app.schemas import (
    OptimizationRequest,
    OptimizationResponse,
    ModelStatus,
    OptimizationResult,
    OptimizedSchedule,
    Session,
    Assignment
)
from app.core.optimization import ORToolsOptimizer
from app.core.exceptions import (
    OptimizationTimeoutException,
    OptimizationFailedException,
    ModelNotReadyException
)
from app.core.config import settings

logger = logging.getLogger(__name__)


class OptimizationService:
    """最適化サービス"""
    
    def __init__(self):
        self.optimizer = ORToolsOptimizer(
            timeout_seconds=settings.OPTIMIZATION_TIMEOUT,
            max_rooms=settings.MAX_ROOMS,
            max_scenes=settings.MAX_SCENES,
            max_timeslots=settings.MAX_TIMESLOTS,
            max_people=settings.MAX_PEOPLE
        )
        self._model_ready = False
        self._initialize_model()
    
    def _initialize_model(self):
        """モデルの初期化"""
        try:
            # 最適化エンジンの初期化
            self.optimizer.initialize()
            self._model_ready = True
            logger.info("最適化モデルの初期化が完了しました")
        except Exception as e:
            logger.error(f"最適化モデルの初期化に失敗しました: {str(e)}")
            self._model_ready = False
    
    async def get_model_status(self) -> ModelStatus:
        """モデル状態の取得"""
        return ModelStatus(
            model_name="ortools-optimizer",
            version=settings.VERSION,
            status="loaded" if self._model_ready else "not_ready",
            last_updated=time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            performance_metrics={
                "model_loaded": self._model_ready,
                "environment_ready": self._model_ready,
                "optimizer_ready": self._model_ready,
                "timeout_seconds": settings.OPTIMIZATION_TIMEOUT,
                "max_rooms": settings.MAX_ROOMS,
                "max_scenes": settings.MAX_SCENES,
                "max_timeslots": settings.MAX_TIMESLOTS,
                "max_people": settings.MAX_PEOPLE
            }
        )
    
    async def optimize_schedule(self, request: OptimizationRequest) -> OptimizationResponse:
        """スケジュール最適化の実行"""
        if not self._model_ready:
            raise ModelNotReadyException()
        
        start_time = time.time()
        
        try:
            # 最適化の実行
            optimization_result = await self._run_optimization(request)
            
            processing_time = time.time() - start_time
            
            return OptimizationResponse(
                success=True,
                result=optimization_result,
                error=None,
                processing_time=processing_time
            )
            
        except OptimizationTimeoutException as e:
            processing_time = time.time() - start_time
            logger.error(f"最適化タイムアウト: {processing_time:.2f}秒")
            return OptimizationResponse(
                success=False,
                result=None,
                error=f"最適化がタイムアウトしました（{settings.OPTIMIZATION_TIMEOUT}秒）",
                processing_time=processing_time
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"最適化エラー: {str(e)}")
            return OptimizationResponse(
                success=False,
                result=None,
                error=f"最適化に失敗しました: {str(e)}",
                processing_time=processing_time
            )
    
    async def _run_optimization(self, request: OptimizationRequest) -> OptimizationResult:
        """最適化の実行（内部メソッド）"""
        try:
            # OR-Toolsを使用した最適化
            result = self.optimizer.optimize(
                schedule_data=request.schedule_data,
                members=request.members,
                venues=request.venues,
                constraints=request.constraints
            )
            
            # 結果の変換
            optimized_schedule = self._convert_to_optimized_schedule(result)
            
            return OptimizationResult(
                optimized_schedule=optimized_schedule,
                reward=result.get("reward", 0.0),
                processing_time=result.get("processing_time", 0.0),
                model_version=settings.VERSION,
                constraints_satisfied=result.get("constraints_satisfied", True),
                optimization_status=result.get("status", "OPTIMAL")
            )
            
        except Exception as e:
            raise OptimizationFailedException(f"最適化の実行に失敗しました: {str(e)}")
    
    def _convert_to_optimized_schedule(self, result: Dict[str, Any]) -> OptimizedSchedule:
        """最適化結果をOptimizedScheduleに変換"""
        sessions = []
        assignments = {}
        venue_utilization = {}
        
        # セッションの作成
        for session_data in result.get("sessions", []):
            session = Session(
                id=session_data["id"],
                date=session_data["date"],
                time=session_data["time"],
                venue=session_data["venue"],
                members=session_data["members"],
                part=session_data["part"],
                duration=session_data["duration"],
                priority=session_data.get("priority", 1)
            )
            sessions.append(session)
        
        # 割り当ての作成
        for member_id, session_ids in result.get("assignments", {}).items():
            assignments[member_id] = session_ids
        
        # 会場利用率の計算
        venue_utilization = result.get("venue_utilization", {})
        
        return OptimizedSchedule(
            sessions=sessions,
            assignments=assignments,
            total_sessions=len(sessions),
            total_practice_time=sum(s.duration for s in sessions),
            venue_utilization=venue_utilization
        )
