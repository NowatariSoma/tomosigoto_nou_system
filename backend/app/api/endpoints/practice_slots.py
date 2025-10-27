from typing import Any, Dict, List, Optional
from uuid import UUID

from app.api.deps import get_current_user, get_current_user_optional, get_practice_schedule_service
from app.core.exceptions import APIException
from app.core.error_messages import ErrorMessage
from app.schemas.practice_schedules import (
    PracticeScheduleCreate,
    PracticeScheduleResponse,
    PracticeScheduleUpdate,
    PracticeScheduleDisplayResponse,
    SessionCreate,
    SessionResponse,
    SessionUpdate,
    PracticeScheduleWithDetailsResponse,
)
from app.services.practice_schedule_service import PracticeScheduleService
from fastapi import APIRouter, Depends, Query

router = APIRouter()


@router.get("/", response_model=List[PracticeScheduleResponse])
async def get_practice_schedules(
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
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
    # current_user: Dict[str, Any] = Depends(get_current_user),
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
    # current_user: Dict[str, Any] = Depends(get_current_user),
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
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    指定した練習スケジュールの詳細情報（idealフォーマット）を取得

    Args:
        schedule_id: 練習スケジュールID
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        理想的な形式の練習スケジュール詳細情報
    """
    details_data = await practice_schedule_service.get_practice_schedule_ideal_format_by_id(schedule_id)
    if not details_data:
        raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)
    return details_data


@router.get("/{schedule_id}/display", response_model=PracticeScheduleDisplayResponse)
async def get_practice_schedule_for_display(
    schedule_id: UUID,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
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


@router.get("/date/{target_date}/details", response_model=Dict[str, Any])
async def get_practice_schedule_details_by_date(
    target_date: str,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    指定した日付の練習スケジュール詳細情報（idealフォーマット）を取得

    Args:
        target_date: 対象日付 (YYYY-MM-DD形式)
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        理想的な形式の練習スケジュール詳細情報
    """
    details_data = await practice_schedule_service.get_practice_schedule_ideal_format_by_date(target_date)
    if not details_data:
        raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)
    return details_data


@router.get("/date/{target_date}/ideal", response_model=Dict[str, Any])
async def get_practice_schedule_ideal_format(
    target_date: str,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
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
    current_user: Dict[str, Any] = Depends(get_current_user),
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
    try:
        # 作成者と更新者を設定
        schedule_dict = schedule_data.model_dump()
        schedule_dict["created_by"] = str(current_user["id"])
        schedule_dict["updated_by"] = str(current_user["id"])

        created_schedule = await practice_schedule_service.create_practice_schedule(schedule_dict)
        return PracticeScheduleResponse(**created_schedule)
    except Exception as e:
        raise


@router.put("/{schedule_id}", response_model=PracticeScheduleResponse)
async def update_practice_schedule(
    schedule_id: UUID,
    schedule_data: PracticeScheduleUpdate,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
    current_user: Dict[str, Any] = Depends(get_current_user),
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
    try:
        # 更新者を設定
        schedule_dict = schedule_data.model_dump(exclude_unset=True)
        schedule_dict["updated_by"] = str(current_user["id"])

        updated_schedule = await practice_schedule_service.update_practice_schedule(schedule_id, schedule_dict)

        return PracticeScheduleResponse(**updated_schedule)
    except Exception as e:
        raise


@router.put("/{schedule_id}/with-details", response_model=PracticeScheduleWithDetailsResponse)
async def update_practice_schedule_with_details(
    schedule_id: UUID,
    schedule_data: Dict[str, Any],
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
    current_user: Dict[str, Any] = Depends(get_current_user),
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
    # 更新者を設定
    schedule_data["updated_by"] = str(current_user["id"])

    updated_schedule = await practice_schedule_service.update_practice_schedule_with_details(schedule_id, schedule_data)
    return PracticeScheduleWithDetailsResponse(**updated_schedule)


@router.delete("/{schedule_id}")
async def delete_practice_schedule(
    schedule_id: UUID,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
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
    # current_user: Dict[str, Any] = Depends(get_current_user),
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
    # current_user: Dict[str, Any] = Depends(get_current_user),
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
    return SessionResponse.model_validate(session)


@router.post("/sessions", response_model=SessionResponse)
async def create_session(
    session_data: SessionCreate,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    新しいセッションを作成

    Args:
        session_data: 作成するセッションのデータ
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        作成されたセッション
    """
    print(f"DEBUG create_session endpoint: session_data = {session_data}")
    print(f"DEBUG create_session endpoint: current_user = {current_user}")

    # セッションデータを取得（created_by/updated_byは不要）
    session_dict = session_data.model_dump()
    print(f"DEBUG create_session endpoint: session_dict = {session_dict}")

    # venue_idが指定されている場合は、schedule_available_venue_idに変換
    if session_dict.get("venue_id") and not session_dict.get("schedule_available_venue_id"):
        # まず、venue_idとして検索
        schedule_available_venue = await practice_schedule_service.schedule_available_venue_repository.find_by_schedule_and_venue(
            session_dict["schedule_id"], session_dict["venue_id"]
        )
        
        if schedule_available_venue:
            # venue_idだった場合、schedule_available_venue_idに変換
            session_dict["schedule_available_venue_id"] = str(schedule_available_venue.get("id"))
            print(f"DEBUG create_session endpoint: venue_id -> schedule_available_venue_id = {session_dict['schedule_available_venue_id']}")
        else:
            # venue_idで見つからない場合は、schedule_available_venue_idである可能性
            # schedule_available_venuesテーブルで直接検索
            try:
                # session_dict["venue_id"]がすでにUUIDの場合とstrの場合を両方対応
                venue_id_value = session_dict["venue_id"]
                if isinstance(venue_id_value, UUID):
                    search_id = venue_id_value
                else:
                    search_id = UUID(venue_id_value)
                    
                schedule_venue = await practice_schedule_service.schedule_available_venue_repository.find_by_id(search_id)
                if schedule_venue:
                    session_dict["schedule_available_venue_id"] = str(schedule_venue.get("id"))
                    print(f"DEBUG create_session endpoint: schedule_available_venue_idを直接使用 = {session_dict['schedule_available_venue_id']}")
                else:
                    raise APIException(ErrorMessage.SCHEDULE_VENUE_NOT_FOUND)
            except Exception as e:
                print(f"DEBUG create_session endpoint: ID検索エラー: {e}")
                raise APIException(ErrorMessage.SCHEDULE_VENUE_NOT_FOUND)
    
    # venue_idを削除（sessionsテーブルには存在しない）
    session_dict.pop("venue_id", None)

    created_session = await practice_schedule_service.create_session(session_dict)
    print(f"DEBUG create_session endpoint: created_session = {created_session}")
    return SessionResponse.model_validate(created_session)


@router.put("/sessions/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: UUID,
    session_data: SessionUpdate,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
    current_user: Dict[str, Any] = Depends(get_current_user),
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
    # セッションデータを取得（updated_byは不要）
    session_dict = session_data.model_dump(exclude_unset=True)

    updated_session = await practice_schedule_service.update_session(session_id, session_dict)
    return SessionResponse.model_validate(updated_session)


@router.put("/sessions/{session_id}/move", response_model=SessionResponse)
async def move_session(
    session_id: UUID,
    target_venue_id: UUID = Query(..., description="移動先会場ID"),
    target_slot_order: int = Query(..., description="移動先時限番号"),
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    セッションを別の会場・時限に移動

    Args:
        session_id: セッションID
        target_venue_id: 移動先会場ID（venue_idまたはschedule_available_venue_id）
        target_slot_order: 移動先時限番号
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        更新されたセッション
    """
    # セッション情報を取得
    session = await practice_schedule_service.session_repository.find_by_id(session_id)
    if not session:
        raise APIException(ErrorMessage.SESSION_NOT_FOUND)
    
    schedule_id = session.get("schedule_id")
    
    # target_venue_idがvenue_idの場合はschedule_available_venue_idに変換
    # target_venue_idが既にschedule_available_venue_idの場合はそのまま使用
    # まず、schedule_available_venuesテーブルでIDを検索
    schedule_venue = await practice_schedule_service.schedule_available_venue_repository.find_by_schedule_and_venue(
        schedule_id, target_venue_id
    )
    
    if schedule_venue:
        # venue_idだった場合、schedule_available_venue_idに変換
        actual_target_venue_id = schedule_venue.get("id")
        print(f"DEBUG move_session: venue_id -> schedule_available_venue_id = {actual_target_venue_id}")
    else:
        # schedule_available_venue_idだった場合、そのまま使用
        actual_target_venue_id = target_venue_id
        print(f"DEBUG move_session: schedule_available_venue_idを直接使用 = {actual_target_venue_id}")
    
    updated_session = await practice_schedule_service.move_session(
        session_id, actual_target_venue_id, target_slot_order
    )
    # Pydantic v2では、dictからモデルを作成する際にmodel_validate()を使用
    return SessionResponse.model_validate(updated_session)


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: UUID,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
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


# ===== Monthカレンダー表示用エンドポイント =====

@router.get("/calendar/month/{year}/{month}")
async def get_practice_schedules_for_month_calendar(
    year: int,
    month: int,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Monthカレンダー表示用の練習スケジュール一覧を取得

    Args:
        year: 年 (例: 2024)
        month: 月 (1-12)
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        指定月の練習スケジュール一覧（カレンダー表示用形式）
    """
    if not (1 <= month <= 12):
        raise APIException(ErrorMessage.INVALID_MONTH)
    
    calendar_events = await practice_schedule_service.get_practice_schedules_for_month_calendar(year, month)
    return {
        "year": year,
        "month": month,
        "events": calendar_events,
        "total_count": len(calendar_events)
    }


@router.get("/calendar/range")
async def get_practice_schedules_for_date_range(
    start_date: str = Query(..., description="開始日 (YYYY-MM-DD形式)"),
    end_date: str = Query(..., description="終了日 (YYYY-MM-DD形式)"),
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    指定した日付範囲の練習スケジュール一覧を取得（カレンダー表示用）

    Args:
        start_date: 開始日 (YYYY-MM-DD形式)
        end_date: 終了日 (YYYY-MM-DD形式)
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        指定範囲の練習スケジュール一覧（カレンダー表示用形式）
    """
    # 日付形式の簡単な検証
    try:
        from datetime import datetime
        datetime.strptime(start_date, "%Y-%m-%d")
        datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise APIException(ErrorMessage.INVALID_DATE_FORMAT)
    
    calendar_events = await practice_schedule_service.get_practice_schedules_for_date_range(start_date, end_date)
    return {
        "start_date": start_date,
        "end_date": end_date,
        "events": calendar_events,
        "total_count": len(calendar_events)
    }


# ===== Groups関連エンドポイント =====
# TODO: 実装が必要になった際に適切なサービス層と共に実装する

# ===== Parts関連エンドポイント =====
# TODO: 実装が必要になった際に適切なサービス層と共に実装する