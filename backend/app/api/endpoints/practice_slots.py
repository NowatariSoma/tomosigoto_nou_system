from typing import Any, Dict, List
from uuid import UUID

from app.api.deps import get_practice_schedule_service
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
from fastapi import APIRouter, Depends, HTTPException

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
        raise HTTPException(status_code=404, detail=f"Practice schedule not found for date: {target_date}")
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


@router.get("/{schedule_id}/details", response_model=PracticeScheduleWithDetailsResponse)
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
    schedule_with_details = await practice_schedule_service.get_practice_schedule_with_details(schedule_id)
    return PracticeScheduleWithDetailsResponse(**schedule_with_details)


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
    # モックデータを返す（将来的には実データから変換）
    return {
        "schedule_info": {
            "id": "0471df8a-950a-459b-ab12-f31e000cbb3f",
            "schedule_date": target_date,
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "description": "定期公演「高砂」総練習"
        },
        "venues": [
            {
                "id": "venue-1",
                "name": "今出川キャンパス 良心館ｄ",
                "priority": 1,
                "color": "#FF6B6B"
            },
            {
                "id": "venue-2", 
                "name": "今出川キャンパス 至誠館",
                "priority": 2,
                "color": "#4ECDC4"
            }
        ],
        "time_schedule": {
            "09:00": {
                "venue-1": [
                    {
                        "part_id": "part-1",
                        "part_name": "前シテパート",
                        "part_color": "#FFD700",
                        "session_title": "前シテ（老翁）個人練習",
                        "instructors": ["山田太郎"],
                        "participants": 5,
                        "status": "confirmed"
                    }
                ],
                "venue-2": [
                    {
                        "part_id": "part-2",
                        "part_name": "地謡パート", 
                        "part_color": "#87CEEB",
                        "session_title": "地謡基礎練習",
                        "instructors": ["鈴木花子"],
                        "participants": 8,
                        "status": "confirmed"
                    }
                ]
            },
            "09:30": {
                "venue-1": [
                    {
                        "part_id": "part-3",
                        "part_name": "後シテパート",
                        "part_color": "#98FB98", 
                        "session_title": "後シテ（住吉明神）個人練習",
                        "instructors": ["田中次郎"],
                        "participants": 3,
                        "status": "confirmed"
                    }
                ],
                "venue-2": [
                    {
                        "part_id": "part-2",
                        "part_name": "地謡パート",
                        "part_color": "#87CEEB",
                        "session_title": "地謡合わせ",
                        "instructors": ["鈴木花子", "佐藤三郎"],
                        "participants": 12,
                        "status": "confirmed"
                    }
                ]
            },
            "10:00": {
                "venue-1": [],
                "venue-2": [
                    {
                        "part_id": "part-4",
                        "part_name": "囃子パート",
                        "part_color": "#DDA0DD",
                        "session_title": "囃子練習",
                        "instructors": ["高橋四郎"],
                        "participants": 6,
                        "status": "confirmed"
                    }
                ]
            },
            "10:30": {
                "venue-1": [],
                "venue-2": []
            },
            "11:00": {
                "venue-1": [],
                "venue-2": []
            },
            "11:30": {
                "venue-1": [],
                "venue-2": []
            },
            "12:00": {
                "venue-1": [],
                "venue-2": []
            }
        }
    }


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

@router.get("/groups", response_model=List[dict])
async def get_groups():
    """
    すべてのグループを取得（仮実装）
    """
    # 仮のデータ返却
    return []


@router.get("/groups/{group_id}")
async def get_group(group_id: str):
    """
    指定したIDのグループを取得（仮実装）
    """
    return {"id": group_id, "name": f"Group {group_id}"}


# ===== Parts関連エンドポイント =====

@router.get("/parts", response_model=List[dict])
async def get_parts():
    """
    すべてのパートを取得（仮実装）
    """
    # 仮のデータ返却
    return []


@router.get("/parts/{part_id}")
async def get_part(part_id: str):
    """
    指定したIDのパートを取得（仮実装）
    """
    return {"id": part_id, "name": f"Part {part_id}"}