from typing import Any, Dict, List
from uuid import UUID

from app.api.deps import get_current_user, get_current_user_optional, get_event_service
from app.core.exceptions import APIException
from app.core.error_messages import ErrorMessage
from app.schemas.events import (
    EventCreate,
    EventResponse,
    EventUpdate,
    EventWithRoundsResponse,
    RoundCreate,
    RoundResponse,
    RoundUpdate,
)
from app.services.event_service import EventService
from fastapi import APIRouter, Depends, Query

router = APIRouter()


@router.get("/", response_model=List[EventResponse])
async def get_events(
    event_service: EventService = Depends(get_event_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    すべてのイベントを取得

    Args:
        event_service: イベント管理サービス

    Returns:
        すべてのイベントのリスト
    """
    all_events = await event_service.get_all_events()
    return [EventResponse(**event) for event in all_events]


@router.get("/{event_id}", response_model=EventWithRoundsResponse)
async def get_event(
    event_id: str,
    event_service: EventService = Depends(get_event_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    指定したIDのイベントをラウンド情報付きで取得

    Args:
        event_id: イベントID
        event_service: イベント管理サービス

    Returns:
        指定したIDのイベント（ラウンド情報を含む）
    """
    event = await event_service.get_event_with_rounds(event_id)
    return EventWithRoundsResponse(**event)


@router.post("/", response_model=EventResponse)
async def create_event(
    event_data: EventCreate,
    event_service: EventService = Depends(get_event_service),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    新しいイベントを作成

    Args:
        event_data: 作成するイベントのデータ
        current_user: 現在のユーザー
        event_service: イベント管理サービス

    Returns:
        作成されたイベント
    """
    event_dict = event_data.model_dump()
    created_event = await event_service.create_event(event_dict)
    return EventResponse(**created_event)


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    event_data: EventUpdate,
    event_service: EventService = Depends(get_event_service),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    指定したイベントを更新

    Args:
        event_id: イベントID
        event_data: 更新後のイベントデータ
        current_user: 現在のユーザー
        event_service: イベント管理サービス

    Returns:
        更新されたイベント
    """
    event_dict = event_data.model_dump(exclude_unset=True)
    updated_event = await event_service.update_event(event_id, event_dict)
    return EventResponse(**updated_event)


@router.delete("/{event_id}")
async def delete_event(
    event_id: str,
    event_service: EventService = Depends(get_event_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    指定したイベントを削除

    Args:
        event_id: イベントID
        event_service: イベント管理サービス

    Returns:
        削除成功のメッセージ
    """
    await event_service.delete_event(event_id)
    return {"message": "イベントが正常に削除されました"}


# ===== ラウンド関連エンドポイント =====

@router.get("/{event_id}/rounds", response_model=List[RoundResponse])
async def get_rounds_by_event(
    event_id: str,
    event_service: EventService = Depends(get_event_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    指定したイベントのラウンド一覧を取得

    Args:
        event_id: イベントID
        event_service: イベント管理サービス

    Returns:
        指定したイベントのラウンド一覧
    """
    rounds = await event_service.get_rounds_by_event(event_id)
    return [RoundResponse(**round_data) for round_data in rounds]


@router.get("/{event_id}/rounds/{round_id}", response_model=RoundResponse)
async def get_round(
    event_id: str,
    round_id: UUID,
    event_service: EventService = Depends(get_event_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    指定したIDのラウンドを取得

    Args:
        event_id: イベントID
        round_id: ラウンドID
        event_service: イベント管理サービス

    Returns:
        指定したIDのラウンド
    """
    round_data = await event_service.get_round(round_id)
    # イベントIDが一致するか確認
    if round_data.get("event_id") != event_id:
        raise APIException(ErrorMessage.ROUND_NOT_FOUND)
    return RoundResponse(**round_data)


@router.post("/{event_id}/rounds", response_model=RoundResponse)
async def create_round(
    event_id: str,
    round_data: RoundCreate,
    event_service: EventService = Depends(get_event_service),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    新しいラウンドを作成

    Args:
        event_id: イベントID
        round_data: 作成するラウンドのデータ
        event_service: イベント管理サービス

    Returns:
        作成されたラウンド
    """
    round_dict = round_data.model_dump()
    # URLのevent_idを使用
    round_dict["event_id"] = event_id
    created_round = await event_service.create_round(round_dict)
    return RoundResponse(**created_round)


@router.put("/{event_id}/rounds/{round_id}", response_model=RoundResponse)
async def update_round(
    event_id: str,
    round_id: UUID,
    round_data: RoundUpdate,
    event_service: EventService = Depends(get_event_service),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    指定したラウンドを更新

    Args:
        event_id: イベントID
        round_id: ラウンドID
        round_data: 更新後のラウンドデータ
        event_service: イベント管理サービス

    Returns:
        更新されたラウンド
    """
    # ラウンドの存在とイベントIDの一致を確認
    existing_round = await event_service.get_round(round_id)
    if existing_round.get("event_id") != event_id:
        raise APIException(ErrorMessage.ROUND_NOT_FOUND)

    round_dict = round_data.model_dump(exclude_unset=True)
    updated_round = await event_service.update_round(round_id, round_dict)
    return RoundResponse(**updated_round)


@router.delete("/{event_id}/rounds/{round_id}")
async def delete_round(
    event_id: str,
    round_id: UUID,
    event_service: EventService = Depends(get_event_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    指定したラウンドを削除

    Args:
        event_id: イベントID
        round_id: ラウンドID
        event_service: イベント管理サービス

    Returns:
        削除成功のメッセージ
    """
    # ラウンドの存在とイベントIDの一致を確認
    existing_round = await event_service.get_round(round_id)
    if existing_round.get("event_id") != event_id:
        raise APIException(ErrorMessage.ROUND_NOT_FOUND)

    await event_service.delete_round(round_id)
    return {"message": "ラウンドが正常に削除されました"}
