"""
スケジュール関連のAPIエンドポイント
"""
import logging
from typing import Dict, Any
from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends
from app.services.schedule_service import ScheduleService
from app.schemas.schedule_schemas import (
    ScheduleCreateRequest,
    ScheduleOptimizationResponse,
    ErrorResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/optimize", response_model=ScheduleOptimizationResponse)
async def optimize_schedule(request: ScheduleCreateRequest):
    """
    スケジュール最適化API
    
    スケジュールIDを受け取り、MLエンジンを使用してスケジュールを最適化し、
    結果をsessionsテーブルに保存します。
    """
    try:
        logger.info(f"スケジュール最適化API呼び出し: schedule_id={request.schedule_id}")
        
        # スケジュールサービスを初期化
        schedule_service = ScheduleService()
        
        # スケジュール最適化を実行
        result = await schedule_service.optimize_schedule(request.schedule_id)
        
        logger.info(f"スケジュール最適化完了: schedule_id={request.schedule_id}, status={result.status}")
        
        return result
        
    except Exception as e:
        logger.error(f"スケジュール最適化APIエラー: {str(e)}, schedule_id={request.schedule_id}")
        raise HTTPException(
            status_code=500,
            detail=f"スケジュール最適化中にエラーが発生しました: {str(e)}"
        )


@router.get("/health/ml")
async def check_ml_engine_health():
    """
    MLエンジンのヘルスチェックAPI
    """
    try:
        schedule_service = ScheduleService()
        health_status = await schedule_service.check_ml_engine_health()
        
        return {
            "status": "success",
            "ml_engine": health_status
        }
        
    except Exception as e:
        logger.error(f"MLエンジンヘルスチェックエラー: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"MLエンジンのヘルスチェックに失敗しました: {str(e)}"
        )


@router.get("/{schedule_id}/status")
async def get_schedule_status(schedule_id: UUID):
    """
    スケジュールのステータス確認API
    """
    try:
        schedule_service = ScheduleService()
        # スケジュールリポジトリから直接取得
        schedule_info = await schedule_service.schedule_repository.get_schedule_by_id(schedule_id)
        
        if not schedule_info:
            raise HTTPException(
                status_code=404,
                detail=f"スケジュールが見つかりません: {schedule_id}"
            )
        
        return {
            "schedule_id": schedule_id,
            "status": schedule_info.get("status", "unknown"),
            "schedule_date": schedule_info.get("schedule_date"),
            "description": schedule_info.get("description")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"スケジュールステータス取得エラー: {str(e)}, schedule_id={schedule_id}")
        raise HTTPException(
            status_code=500,
            detail=f"スケジュールステータスの取得に失敗しました: {str(e)}"
        )
