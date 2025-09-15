"""
練習表関連のAPIエンドポイント
"""

import logging
from datetime import date
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.core.exceptions import create_error_response, create_success_response
from app.core.supabase import get_supabase
from app.repositories.practice_schedule_repository import PracticeScheduleRepository
from app.schemas.practice_schedules import (
    PracticeSlotCreate,
    PracticeSlotResponse,
    PracticeSlotUpdate,
    PracticeSlotWithItemsResponse,
    ScheduleItemCreate,
    ScheduleItemResponse,
    ScheduleItemUpdate,
)
from app.services.practice_schedule_service import PracticeScheduleService

logger = logging.getLogger(__name__)

router = APIRouter()


def get_practice_slot_service() -> PracticeScheduleService:
    """練習表サービスの依存性注入"""
    client = get_supabase()
    repository = PracticeScheduleRepository(client)
    return PracticeScheduleService(repository)


@router.get("/", response_model=Dict[str, Any])
async def get_all_practice_slots(
    service: PracticeScheduleService = Depends(get_practice_slot_service),
):
    """すべての練習表を取得"""
    try:
        practice_schedules = await service.get_all_practice_schedules()
        return create_success_response(practice_schedules, f"Found {len(practice_schedules)} practice schedules")
    except Exception as e:
        logger.error(f"Error fetching practice slots: {str(e)}")
        return create_error_response("Failed to fetch practice slots", e)


@router.get("/{practice_slot_id}", response_model=Dict[str, Any])
async def get_practice_slot_by_id(
    practice_slot_id: str,
    service: PracticeScheduleService = Depends(get_practice_slot_service),
):
    """IDで練習表を取得"""
    try:
        practice_schedule = await service.get_practice_schedule_by_id(practice_slot_id)
        return create_success_response(practice_schedule, "Practice schedule found")
    except Exception as e:
        logger.error(f"Error fetching practice slot {practice_slot_id}: {str(e)}")
        return create_error_response("Failed to fetch practice slot", e)


@router.get("/date/{target_date}", response_model=Dict[str, Any])
async def get_practice_slot_by_date(
    target_date: date,
    service: PracticeScheduleService = Depends(get_practice_slot_service),
):
    """日付で練習表を取得"""
    try:
        practice_schedule = await service.get_practice_schedule_by_date(target_date)
        return create_success_response(practice_schedule, "Practice schedule found")
    except Exception as e:
        logger.error(f"Error fetching practice slot for date {target_date}: {str(e)}")
        return create_error_response("Failed to fetch practice slot", e)


@router.get("/{practice_slot_id}/with-items", response_model=Dict[str, Any])
async def get_practice_slot_with_schedule_items(
    practice_slot_id: str,
    service: PracticeScheduleService = Depends(get_practice_slot_service),
):
    """練習表とスケジュールアイテムを一緒に取得"""
    try:
        practice_schedule = await service.get_practice_schedule_with_sessions(practice_slot_id)
        return create_success_response(practice_schedule, "Practice schedule with sessions found")
    except Exception as e:
        logger.error(f"Error fetching practice slot with items {practice_slot_id}: {str(e)}")
        return create_error_response("Failed to fetch practice slot with items", e)


@router.post("/", response_model=Dict[str, Any])
async def create_practice_slot(
    practice_slot_data: PracticeSlotCreate,
    service: PracticeScheduleService = Depends(get_practice_slot_service),
):
    """練習表を作成"""
    try:
        practice_schedule = await service.create_practice_schedule(practice_slot_data)
        return create_success_response(practice_schedule, "Practice schedule created successfully")
    except Exception as e:
        logger.error(f"Error creating practice slot: {str(e)}")
        return create_error_response("Failed to create practice slot", e)


@router.post("/with-sample-data", response_model=Dict[str, Any])
async def create_practice_slot_with_sample_data(
    target_date: date,
    service: PracticeScheduleService = Depends(get_practice_slot_service),
):
    """サンプルデータ付きの練習表を作成（デバッグ用）"""
    try:
        practice_schedule = await service.create_practice_schedule_with_sample_data(target_date)
        return create_success_response(practice_schedule, "Practice schedule with sample data created successfully")
    except Exception as e:
        logger.error(f"Error creating practice slot with sample data: {str(e)}")
        return create_error_response("Failed to create practice slot with sample data", e)


@router.put("/{practice_slot_id}", response_model=Dict[str, Any])
async def update_practice_slot(
    practice_slot_id: str,
    practice_slot_data: PracticeSlotUpdate,
    service: PracticeScheduleService = Depends(get_practice_slot_service),
):
    """練習表を更新"""
    try:
        practice_schedule = await service.update_practice_schedule(practice_slot_id, practice_slot_data)
        return create_success_response(practice_schedule, "Practice schedule updated successfully")
    except Exception as e:
        logger.error(f"Error updating practice slot {practice_slot_id}: {str(e)}")
        return create_error_response("Failed to update practice slot", e)


@router.delete("/{practice_slot_id}", response_model=Dict[str, Any])
async def delete_practice_slot(
    practice_slot_id: str,
    service: PracticeScheduleService = Depends(get_practice_slot_service),
):
    """練習表を削除"""
    try:
        await service.delete_practice_schedule(practice_slot_id)
        return create_success_response(None, "Practice schedule deleted successfully")
    except Exception as e:
        logger.error(f"Error deleting practice slot {practice_slot_id}: {str(e)}")
        return create_error_response("Failed to delete practice slot", e)


# スケジュールアイテム関連のエンドポイント

@router.post("/{practice_slot_id}/schedule-items", response_model=Dict[str, Any])
async def create_schedule_item(
    practice_slot_id: str,
    schedule_item_data: ScheduleItemCreate,
    service: PracticeScheduleService = Depends(get_practice_slot_service),
):
    """スケジュールアイテムを作成"""
    try:
        session = await service.create_session(schedule_item_data)
        return create_success_response(session, "Session created successfully")
    except Exception as e:
        logger.error(f"Error creating schedule item: {str(e)}")
        return create_error_response("Failed to create schedule item", e)


@router.put("/schedule-items/{schedule_item_id}", response_model=Dict[str, Any])
async def update_schedule_item(
    schedule_item_id: str,
    schedule_item_data: ScheduleItemUpdate,
    service: PracticeScheduleService = Depends(get_practice_slot_service),
):
    """スケジュールアイテムを更新"""
    try:
        session = await service.update_session(schedule_item_id, schedule_item_data)
        return create_success_response(session, "Session updated successfully")
    except Exception as e:
        logger.error(f"Error updating schedule item {schedule_item_id}: {str(e)}")
        return create_error_response("Failed to update schedule item", e)


@router.delete("/schedule-items/{schedule_item_id}", response_model=Dict[str, Any])
async def delete_schedule_item(
    schedule_item_id: str,
    service: PracticeScheduleService = Depends(get_practice_slot_service),
):
    """スケジュールアイテムを削除"""
    try:
        await service.delete_session(schedule_item_id)
        return create_success_response(None, "Session deleted successfully")
    except Exception as e:
        logger.error(f"Error deleting schedule item {schedule_item_id}: {str(e)}")
        return create_error_response("Failed to delete schedule item", e)
