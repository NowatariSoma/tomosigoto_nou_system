from typing import Any, Dict, List, Optional
from uuid import UUID

from app.api.deps import get_current_user, get_current_user_optional
from app.core.exceptions import APIException
from app.core.error_messages import ErrorMessage
from app.schemas.events import (
    EventCreate,
    EventResponse,
    EventUpdate,
    EventSettlementCreate,
    EventSettlementResponse,
    EventSettlementUpdate,
    EventWithSettlementsResponse,
    EventSettlementSummary,
)
from app.services.events_service import EventsService
from app.repositories.events_repository import EventsRepository, EventSettlementsRepository
from fastapi import APIRouter, Depends, Query
from app.core.db import get_supabase_client

router = APIRouter()


def get_events_service(client = Depends(get_supabase_client)) -> EventsService:
    """イベントサービスの依存性注入"""
    events_repository = EventsRepository(client)
    event_settlements_repository = EventSettlementsRepository(client)
    return EventsService(events_repository, event_settlements_repository)


# ===== Event Endpoints =====

@router.get("/", response_model=List[EventResponse])
async def get_events(
    limit: Optional[int] = Query(None, description="取得する件数の上限"),
    events_service: EventsService = Depends(get_events_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    すべてのイベントを取得

    Args:
        limit: 取得する件数の上限
        events_service: イベント管理サービス

    Returns:
        すべてのイベントのリスト
    """
    events = await events_service.get_all_events(limit=limit)
    return [EventResponse(**event) for event in events]


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    events_service: EventsService = Depends(get_events_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    指定したIDのイベントを取得

    Args:
        event_id: イベントID
        events_service: イベント管理サービス

    Returns:
        指定したIDのイベント
    """
    event = await events_service.get_event_by_id(event_id)
    return EventResponse(**event)


@router.post("/", response_model=EventResponse, status_code=201)
async def create_event(
    event: EventCreate,
    events_service: EventsService = Depends(get_events_service),
    current_user: Dict[str, Any] = Depends(get_current_user_optional),
):
    """
    新しいイベントを作成

    Args:
        event: イベント作成データ
        events_service: イベント管理サービス
        current_user: 現在のユーザー情報

    Returns:
        作成されたイベント
    """
    user_id = UUID(current_user.get("id")) if current_user and current_user.get("id") else None
    event_data = event.model_dump()
    created_event = await events_service.create_event(event_data, user_id)
    return EventResponse(**created_event)


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    event: EventUpdate,
    events_service: EventsService = Depends(get_events_service),
    current_user: Dict[str, Any] = Depends(get_current_user_optional),
):
    """
    イベントを更新

    Args:
        event_id: イベントID
        event: イベント更新データ
        events_service: イベント管理サービス
        current_user: 現在のユーザー情報

    Returns:
        更新されたイベント
    """
    user_id = UUID(current_user.get("id")) if current_user and current_user.get("id") else None
    event_data = event.model_dump(exclude_unset=True)
    updated_event = await events_service.update_event(event_id, event_data, user_id)
    return EventResponse(**updated_event)


@router.delete("/{event_id}", status_code=204)
async def delete_event(
    event_id: str,
    events_service: EventsService = Depends(get_events_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    イベントを削除

    Args:
        event_id: イベントID
        events_service: イベント管理サービス

    Returns:
        削除成功時は204 No Content
    """
    await events_service.delete_event(event_id)
    return None


# ===== Event Settlement Endpoints =====

@router.get("/{event_id}/settlement", response_model=List[EventSettlementResponse])
async def get_event_settlements(
    event_id: str,
    events_service: EventsService = Depends(get_events_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    指定したイベントの決済情報を取得

    Args:
        event_id: イベントID
        events_service: イベント管理サービス

    Returns:
        指定したイベントの決済情報リスト
    """
    settlements = await events_service.get_settlements_by_event_id(event_id)
    return [EventSettlementResponse(**settlement) for settlement in settlements]


@router.get("/{event_id}/settlement/summary", response_model=EventSettlementSummary)
async def get_event_settlement_summary(
    event_id: str,
    events_service: EventsService = Depends(get_events_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    指定したイベントの決済サマリーを取得

    Args:
        event_id: イベントID
        events_service: イベント管理サービス

    Returns:
        指定したイベントの決済サマリー
    """
    summary = await events_service.get_settlement_summary(event_id)
    return EventSettlementSummary(**summary)


@router.post("/{event_id}/settlement", response_model=EventSettlementResponse, status_code=201)
async def create_event_settlement(
    event_id: str,
    settlement: EventSettlementCreate,
    events_service: EventsService = Depends(get_events_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    イベントの決済情報を作成

    Args:
        event_id: イベントID
        settlement: 決済情報作成データ
        events_service: イベント管理サービス

    Returns:
        作成された決済情報
    """
    settlement_data = settlement.model_dump()
    # event_idをパスパラメータから設定
    settlement_data["event_id"] = event_id
    created_settlement = await events_service.create_settlement(settlement_data)
    return EventSettlementResponse(**created_settlement)


@router.get("/settlements/{settlement_id}", response_model=EventSettlementResponse)
async def get_settlement(
    settlement_id: UUID,
    events_service: EventsService = Depends(get_events_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    指定したIDの決済情報を取得

    Args:
        settlement_id: 決済情報ID
        events_service: イベント管理サービス

    Returns:
        指定したIDの決済情報
    """
    settlement = await events_service.get_settlement_by_id(settlement_id)
    return EventSettlementResponse(**settlement)


@router.put("/settlements/{settlement_id}", response_model=EventSettlementResponse)
async def update_settlement(
    settlement_id: UUID,
    settlement: EventSettlementUpdate,
    events_service: EventsService = Depends(get_events_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    決済情報を更新

    Args:
        settlement_id: 決済情報ID
        settlement: 決済情報更新データ
        events_service: イベント管理サービス

    Returns:
        更新された決済情報
    """
    settlement_data = settlement.model_dump(exclude_unset=True)
    updated_settlement = await events_service.update_settlement(settlement_id, settlement_data)
    return EventSettlementResponse(**updated_settlement)


@router.delete("/settlements/{settlement_id}", status_code=204)
async def delete_settlement(
    settlement_id: UUID,
    events_service: EventsService = Depends(get_events_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    決済情報を削除

    Args:
        settlement_id: 決済情報ID
        events_service: イベント管理サービス

    Returns:
        削除成功時は204 No Content
    """
    await events_service.delete_settlement(settlement_id)
    return None


# ===== Combined Endpoints =====

@router.get("/{event_id}/with-settlements", response_model=Dict[str, Any])
async def get_event_with_settlements(
    event_id: str,
    events_service: EventsService = Depends(get_events_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    決済情報を含むイベントを取得

    Args:
        event_id: イベントID
        events_service: イベント管理サービス

    Returns:
        決済情報を含むイベント
    """
    event_with_settlements = await events_service.get_event_with_settlements(event_id)
    return event_with_settlements
