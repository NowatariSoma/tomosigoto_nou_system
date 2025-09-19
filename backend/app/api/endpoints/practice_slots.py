from typing import Any, Dict, List
from uuid import UUID

from app.api.deps import get_practice_schedule_service
from app.core.exceptions import APIException
from app.core.error_messages import ErrorMessage
from app.schemas.practice_schedules import (
    PracticeScheduleCreate,
    PracticeScheduleResponse,
    PracticeScheduleUpdate,
    PracticeScheduleWithDetailsResponse,
    PracticeScheduleDisplayResponse,
    SessionCreate,
    SessionResponse,
    SessionUpdate,
)
from app.services.practice_schedule_service import PracticeScheduleService
from fastapi import APIRouter, Depends

router = APIRouter()


@router.get("/", response_model=List[PracticeScheduleResponse])
async def get_practice_schedules(
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
):
    """
    すべての練習スケジュールを取得

    Args:
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        すべての練習スケジュールのリスト
    """
    all_schedules = await practice_schedule_service.get_all_practice_schedules()
    return [PracticeScheduleResponse(**schedule) for schedule in all_schedules]


@router.get("/date/{target_date}", response_model=PracticeScheduleResponse)
async def get_practice_schedule_by_date(
    target_date: str,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
):
    """
    指定した日付の練習スケジュールを取得

    Args:
        target_date: 対象日付 (YYYY-MM-DD形式)
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        指定した日付の練習スケジュール
    """
    schedule = await practice_schedule_service.get_practice_schedule_by_date(target_date)
    if not schedule:
        raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)
    return PracticeScheduleResponse(**schedule)


@router.get("/{schedule_id}", response_model=PracticeScheduleResponse)
async def get_practice_schedule(
    schedule_id: UUID,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
):
    """
    指定したIDの練習スケジュールを取得

    Args:
        schedule_id: 練習スケジュールID
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        指定したIDの練習スケジュール
    """
    schedule = await practice_schedule_service.get_practice_schedule(schedule_id)
    return PracticeScheduleResponse(**schedule)


@router.get("/{schedule_id}/details", response_model=Dict[str, Any])
async def get_practice_schedule_with_details(
    schedule_id: UUID,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
):
    """
    指定した練習スケジュールの詳細情報（利用可能会場、セッション含む）を取得

    Args:
        schedule_id: 練習スケジュールID
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        練習スケジュールの詳細情報
    """
    details_data = await practice_schedule_service.get_practice_schedule_details_by_id(schedule_id)
    if not details_data:
        raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)
    return details_data


@router.get("/{schedule_id}/display", response_model=PracticeScheduleDisplayResponse)
async def get_practice_schedule_for_display(
    schedule_id: UUID,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
):
    """
    練習表表示用の練習スケジュール情報を取得（名前情報含む）

    Args:
        schedule_id: 練習スケジュールID
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        練習表表示用の練習スケジュール情報
    """
    schedule_display = await practice_schedule_service.get_practice_schedule_for_display(schedule_id)
    return PracticeScheduleDisplayResponse(**schedule_display)


@router.get("/date/{target_date}/ideal", response_model=Dict[str, Any])
async def get_practice_schedule_ideal_format(
    target_date: str,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
):
    """
    フロントエンド理想形式の練習スケジュール情報を取得

    Args:
        target_date: 対象日付 (YYYY-MM-DD形式)
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        理想的な形式の練習スケジュール情報
    """
    ideal_data = await practice_schedule_service.get_practice_schedule_ideal_format_by_date(target_date)
    if not ideal_data:
        raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)
    return ideal_data


@router.post("/", response_model=PracticeScheduleResponse)
async def create_practice_schedule(
    schedule_data: PracticeScheduleCreate,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
):
    """
    新しい練習スケジュールを作成

    Args:
        schedule_data: 作成する練習スケジュールのデータ
        current_user: 現在のユーザー
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        作成された練習スケジュール
    """
    # 作成者と更新者を設定（仮の値）
    schedule_dict = schedule_data.model_dump()
    schedule_dict["created_by"] = "system"
    schedule_dict["updated_by"] = "system"

    created_schedule = await practice_schedule_service.create_practice_schedule(schedule_dict)
    return PracticeScheduleResponse(**created_schedule)


@router.post("/with-details", response_model=PracticeScheduleWithDetailsResponse)
async def create_practice_schedule_with_details(
    schedule_data: Dict[str, Any],
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
):
    """
    練習スケジュールを関連データと一緒に作成

    Args:
        schedule_data: 作成する練習スケジュールと関連データ
        current_user: 現在のユーザー
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        作成された練習スケジュールの詳細情報
    """
    # 作成者と更新者を設定（仮の値）
    schedule_data["created_by"] = "system"
    schedule_data["updated_by"] = "system"

    created_schedule = await practice_schedule_service.create_practice_schedule_with_details(schedule_data)
    return PracticeScheduleWithDetailsResponse(**created_schedule)


@router.put("/{schedule_id}", response_model=PracticeScheduleResponse)
async def update_practice_schedule(
    schedule_id: UUID,
    schedule_data: PracticeScheduleUpdate,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
):
    """
    指定した練習スケジュールを更新

    Args:
        schedule_id: 練習スケジュールID
        schedule_data: 更新後の練習スケジュールデータ
        current_user: 現在のユーザー
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        更新された練習スケジュール
    """
    # 更新者を設定（仮の値）
    schedule_dict = schedule_data.model_dump(exclude_unset=True)
    schedule_dict["updated_by"] = "system"

    updated_schedule = await practice_schedule_service.update_practice_schedule(schedule_id, schedule_dict)
    return PracticeScheduleResponse(**updated_schedule)


@router.put("/{schedule_id}/with-details", response_model=PracticeScheduleWithDetailsResponse)
async def update_practice_schedule_with_details(
    schedule_id: UUID,
    schedule_data: Dict[str, Any],
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
):
    """
    練習スケジュールを関連データと一緒に更新

    Args:
        schedule_id: 練習スケジュールID
        schedule_data: 更新後の練習スケジュールと関連データ
        current_user: 現在のユーザー
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        更新された練習スケジュールの詳細情報
    """
    # 更新者を設定（仮の値）
    schedule_data["updated_by"] = "system"

    updated_schedule = await practice_schedule_service.update_practice_schedule_with_details(schedule_id, schedule_data)
    return PracticeScheduleWithDetailsResponse(**updated_schedule)


@router.delete("/{schedule_id}")
async def delete_practice_schedule(
    schedule_id: UUID,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
):
    """
    指定した練習スケジュールを削除

    Args:
        schedule_id: 練習スケジュールID
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        削除成功のメッセージ
    """
    await practice_schedule_service.remove_practice_schedule(schedule_id)
    return {"message": "練習スケジュールが正常に削除されました"}


# ===== セッション関連エンドポイント =====

@router.get("/{schedule_id}/sessions", response_model=List[SessionResponse])
async def get_sessions_by_schedule(
    schedule_id: UUID,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
):
    """
    指定した練習スケジュールのセッション一覧を取得

    Args:
        schedule_id: 練習スケジュールID
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        指定した練習スケジュールのセッション一覧
    """
    sessions = await practice_schedule_service.get_sessions_by_schedule(schedule_id)
    return [SessionResponse(**session) for session in sessions]


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: UUID,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
):
    """
    指定したIDのセッションを取得

    Args:
        session_id: セッションID
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        指定したIDのセッション
    """
    session = await practice_schedule_service.get_session(session_id)
    return SessionResponse(**session)


@router.post("/sessions", response_model=SessionResponse)
async def create_session(
    session_data: SessionCreate,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
):
    """
    新しいセッションを作成

    Args:
        session_data: 作成するセッションのデータ
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        作成されたセッション
    """
    session_dict = session_data.model_dump()
    created_session = await practice_schedule_service.create_session(session_dict)
    return SessionResponse(**created_session)


@router.put("/sessions/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: UUID,
    session_data: SessionUpdate,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
):
    """
    指定したセッションを更新

    Args:
        session_id: セッションID
        session_data: 更新後のセッションデータ
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        更新されたセッション
    """
    session_dict = session_data.model_dump(exclude_unset=True)
    updated_session = await practice_schedule_service.update_session(session_id, session_dict)
    return SessionResponse(**updated_session)


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: UUID,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
):
    """
    指定したセッションを削除

    Args:
        session_id: セッションID
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        削除成功のメッセージ
    """
    await practice_schedule_service.remove_session(session_id)
    return {"message": "セッションが正常に削除されました"}


# ===== Groups関連エンドポイント =====
# TODO: 実装が必要になった際に適切なサービス層と共に実装する

# ===== Parts関連エンドポイント =====
# TODO: 実装が必要になった際に適切なサービス層と共に実装する