"""
スケジュール取得APIエンドポイント定義
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import date
from uuid import UUID

from app.api.deps import get_current_user, get_supabase_service
from app.services.schedule_service import ScheduleService
from app.repositories.schedule_repository import ScheduleRepository
from app.schemas.schedule import (
    ScheduleResponseSchema, PaginatedResponse, MonthlyScheduleResponse, 
    WeeklyScheduleResponse, ScheduleQueryParams
)
from app.core.pagination import PaginationParams


router = APIRouter()


def get_schedule_service(
    supabase_service = Depends(get_supabase_service)
) -> ScheduleService:
    """スケジュールサービスの依存性注入"""
    repository = ScheduleRepository(supabase_service.client)
    return ScheduleService(repository)


@router.get("/", response_model=PaginatedResponse)
async def get_schedules(
    start_date: Optional[date] = Query(None, description="開始日"),
    end_date: Optional[date] = Query(None, description="終了日"),
    part_id: Optional[UUID] = Query(None, description="パートID"),
    venue_id: Optional[UUID] = Query(None, description="会場ID"),
    schedule_type: Optional[str] = Query(None, description="練習種別"),
    status: Optional[str] = Query(None, description="ステータス"),
    page: int = Query(1, ge=1, description="ページ番号"),
    limit: int = Query(20, ge=1, le=100, description="取得件数"),
    sort_by: str = Query("schedule_date", description="ソート項目"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$", description="ソート順"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    schedule_service: ScheduleService = Depends(get_schedule_service)
):
    """
    スケジュール一覧取得
    
    - 日付範囲、パート、会場などの条件でフィルタリング可能
    - ページネーション対応
    - ソート機能付き
    """
    try:
        pagination = PaginationParams(page=page, limit=limit)
        
        # フィルター条件を組み立て
        if start_date or end_date or part_id:
            # 日付範囲またはパート指定の場合
            if part_id and not start_date and not end_date:
                # パートのみ指定
                result = await schedule_service.get_schedules_by_part_id(
                    part_id, pagination=pagination
                )
            else:
                # 日付範囲指定（パート含む可能性あり）
                result = await schedule_service.get_schedules_by_date_range(
                    start_date, end_date, part_id, pagination
                )
        else:
            # 複合フィルター条件
            filters = {}
            if venue_id:
                filters["venue_id"] = venue_id
            if schedule_type:
                filters["schedule_type"] = schedule_type
            if status:
                filters["status"] = status
            if sort_by:
                filters["sort_by"] = sort_by
            if sort_order:
                filters["sort_order"] = sort_order
            
            result = await schedule_service.get_schedules_with_filters(
                filters, pagination
            )
        
        return PaginatedResponse(
            items=result.items,
            total=result.total,
            page=result.page,
            limit=result.limit,
            pages=result.pages,
            has_next=result.has_next,
            has_previous=result.has_previous
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"スケジュール取得エラー: {str(e)}"
        )


@router.get("/{schedule_id}", response_model=ScheduleResponseSchema)
async def get_schedule_by_id(
    schedule_id: UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    schedule_service: ScheduleService = Depends(get_schedule_service)
):
    """
    スケジュール詳細取得
    
    - 指定されたIDのスケジュール詳細情報を取得
    - セッション情報も含む
    """
    try:
        schedule = await schedule_service.get_schedule_details(schedule_id)
        
        if not schedule:
            raise HTTPException(
                status_code=404,
                detail="指定されたスケジュールが見つかりません"
            )
        
        return schedule
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"スケジュール詳細取得エラー: {str(e)}"
        )


@router.get("/month/{year}/{month}", response_model=MonthlyScheduleResponse)
async def get_monthly_schedules(
    year: int,
    month: int,
    part_id: Optional[UUID] = Query(None, description="パートID"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    schedule_service: ScheduleService = Depends(get_schedule_service)
):
    """
    月別スケジュール取得
    
    - 指定された年月のスケジュールを取得
    - カレンダー表示用に最適化されたデータ形式
    - パート指定でフィルタリング可能
    """
    try:
        # 年月の妥当性チェック
        if not (1 <= month <= 12):
            raise HTTPException(
                status_code=400,
                detail="月は1-12の範囲で指定してください"
            )
        
        if not (2000 <= year <= 2100):
            raise HTTPException(
                status_code=400,
                detail="年は2000-2100の範囲で指定してください"
            )
        
        result = await schedule_service.get_monthly_schedules(year, month, part_id)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"月別スケジュール取得エラー: {str(e)}"
        )


@router.get("/week/{year}/{week_number}", response_model=WeeklyScheduleResponse)
async def get_weekly_schedules(
    year: int,
    week_number: int,
    part_id: Optional[UUID] = Query(None, description="パートID"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    schedule_service: ScheduleService = Depends(get_schedule_service)
):
    """
    週別スケジュール取得
    
    - 指定された年・週番号のスケジュールを取得
    - ISO週番号を使用（1年の最初の木曜日を含む週が第1週）
    - パート指定でフィルタリング可能
    """
    try:
        # 週番号の妥当性チェック
        if not (1 <= week_number <= 53):
            raise HTTPException(
                status_code=400,
                detail="週番号は1-53の範囲で指定してください"
            )
        
        if not (2000 <= year <= 2100):
            raise HTTPException(
                status_code=400,
                detail="年は2000-2100の範囲で指定してください"
            )
        
        result = await schedule_service.get_weekly_schedules(year, week_number, part_id)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"週別スケジュール取得エラー: {str(e)}"
        )


@router.get("/part/{part_id}", response_model=PaginatedResponse)
async def get_schedules_by_part(
    part_id: UUID,
    start_date: Optional[date] = Query(None, description="開始日"),
    end_date: Optional[date] = Query(None, description="終了日"),
    page: int = Query(1, ge=1, description="ページ番号"),
    limit: int = Query(20, ge=1, le=100, description="取得件数"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    schedule_service: ScheduleService = Depends(get_schedule_service)
):
    """
    パート別スケジュール取得
    
    - 指定されたパートが参加するスケジュールを取得
    - 日付範囲での絞り込み可能
    - ページネーション対応
    """
    try:
        pagination = PaginationParams(page=page, limit=limit)
        
        result = await schedule_service.get_schedules_by_part_id(
            part_id, start_date, end_date, pagination
        )
        
        return PaginatedResponse(
            items=result.items,
            total=result.total,
            page=result.page,
            limit=result.limit,
            pages=result.pages,
            has_next=result.has_next,
            has_previous=result.has_previous
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"パート別スケジュール取得エラー: {str(e)}"
        )


@router.get("/venue/{venue_id}", response_model=PaginatedResponse)
async def get_schedules_by_venue(
    venue_id: UUID,
    start_date: Optional[date] = Query(None, description="開始日"),
    end_date: Optional[date] = Query(None, description="終了日"),
    page: int = Query(1, ge=1, description="ページ番号"),
    limit: int = Query(20, ge=1, le=100, description="取得件数"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    schedule_service: ScheduleService = Depends(get_schedule_service)
):
    """
    会場別スケジュール取得
    
    - 指定された会場のスケジュールを取得
    - 日付範囲での絞り込み可能
    - ページネーション対応
    """
    try:
        pagination = PaginationParams(page=page, limit=limit)
        
        filters = {
            "venue_id": venue_id
        }
        
        if start_date:
            filters["start_date"] = start_date
        if end_date:
            filters["end_date"] = end_date
        
        result = await schedule_service.get_schedules_with_filters(
            filters, pagination
        )
        
        return PaginatedResponse(
            items=result.items,
            total=result.total,
            page=result.page,
            limit=result.limit,
            pages=result.pages,
            has_next=result.has_next,
            has_previous=result.has_previous
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"会場別スケジュール取得エラー: {str(e)}"
        )