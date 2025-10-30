"""
スケジューリング最適化APIエンドポイント
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID

from app.schemas.scheduling import (
    OptimizationRequest, OptimizationResponse, PreviewRequest, PreviewResponse, ErrorResponse
)
from app.services.scheduling_optimization_service import SchedulingOptimizationService
from app.api.deps import get_scheduling_optimization_service, get_current_user
from app.core.exceptions import APIException

router = APIRouter()


@router.post(
    "/optimize",
    response_model=OptimizationResponse,
    status_code=status.HTTP_200_OK,
    summary="スケジュール最適化",
    description="指定されたスケジュールを最適化し、結果をデータベースに保存します。"
)
async def optimize_schedule(
    request: OptimizationRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),  # 認証が必要
    service: SchedulingOptimizationService = Depends(get_scheduling_optimization_service)
) -> OptimizationResponse:
    """スケジュールを最適化"""
    try:
        # 最適化パラメータを辞書形式に変換
        optimization_params = None
        if request.optimization_params:
            optimization_params = request.optimization_params.dict()
        
        # 最適化を実行
        result = await service.optimize_schedule(
            schedule_id=request.schedule_id,
            optimization_params=optimization_params
        )
        
        return OptimizationResponse(**result)
        
    except APIException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "OPTIMIZATION_FAILED",
                "message": str(e),
                "schedule_id": str(request.schedule_id)
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "INTERNAL_ERROR",
                "message": "内部サーバーエラーが発生しました",
                "schedule_id": str(request.schedule_id)
            }
        )


@router.post(
    "/preview",
    response_model=PreviewResponse,
    status_code=status.HTTP_200_OK,
    summary="最適化プレビュー",
    description="最適化結果をプレビューします（データベースに保存されません）。"
)
async def preview_optimization(
    request: PreviewRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),  # 認証が必要
    service: SchedulingOptimizationService = Depends(get_scheduling_optimization_service)
) -> PreviewResponse:
    """最適化結果をプレビュー"""
    try:
        # 最適化パラメータを辞書形式に変換
        optimization_params = None
        if request.optimization_params:
            optimization_params = request.optimization_params.dict()
        
        # プレビューを実行
        result = await service.preview_optimization(
            schedule_id=request.schedule_id,
            optimization_params=optimization_params
        )
        
        return PreviewResponse(**result)
        
    except APIException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "PREVIEW_FAILED",
                "message": str(e),
                "schedule_id": str(request.schedule_id)
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "INTERNAL_ERROR",
                "message": "内部サーバーエラーが発生しました",
                "schedule_id": str(request.schedule_id)
            }
        )


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="ヘルスチェック",
    description="スケジューリング最適化サービスのヘルスチェック"
)
async def health_check() -> Dict[str, str]:
    """ヘルスチェック"""
    return {
        "status": "healthy",
        "service": "scheduling_optimization",
        "version": "1.0.0"
    }
