"""
イベント関連のAPIエンドポイント
練習スケジュールをイベントとして扱うエンドポイント群
"""
from typing import Any, Dict, List
from uuid import UUID

from app.api.deps import get_practice_schedule_service, get_attendance_service
from app.core.exceptions import APIException
from app.core.error_messages import ErrorMessage
from app.services.practice_schedule_service import PracticeScheduleService
from app.services.attendance_service import AttendanceService
from fastapi import APIRouter, Depends

router = APIRouter()


@router.get("/{event_id}")
async def get_event(
    event_id: str,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
):
    """
    指定したIDのイベント（練習スケジュール）を取得

    Args:
        event_id: イベントID (evt_で始まるIDまたはUUID)
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        イベント情報
    """
    # evt_プレフィックスを削除してUUIDを取得
    schedule_id = event_id.replace("evt_", "") if event_id.startswith("evt_") else event_id

    try:
        schedule = await practice_schedule_service.get_practice_schedule(UUID(schedule_id))

        # イベント形式に変換
        event_data = {
            "id": f"evt_{schedule['id']}",
            "schedule_id": schedule["id"],
            "title": schedule.get("title", "練習"),
            "description": schedule.get("description", ""),
            "start": f"{schedule['schedule_date']}T{schedule['start_time']}",
            "end": f"{schedule['schedule_date']}T{schedule['end_time']}",
            "date": schedule["schedule_date"],
            "start_time": schedule["start_time"],
            "end_time": schedule["end_time"],
            "type": schedule.get("schedule_type", "practice"),
            "status": schedule.get("status", "scheduled"),
        }

        return event_data
    except ValueError:
        raise APIException(ErrorMessage.INVALID_UUID_FORMAT)
    except Exception as e:
        raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)


@router.get("/{event_id}/participants")
async def get_event_participants(
    event_id: str,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
    attendance_service: AttendanceService = Depends(get_attendance_service),
):
    """
    指定したイベントの参加者一覧を取得

    Args:
        event_id: イベントID (evt_で始まるIDまたはUUID)
        practice_schedule_service: 練習スケジュール管理サービス
        attendance_service: 出欠管理サービス

    Returns:
        参加者一覧
    """
    # evt_プレフィックスを削除してUUIDを取得
    schedule_id = event_id.replace("evt_", "") if event_id.startswith("evt_") else event_id

    try:
        # スケジュールの存在確認
        schedule = await practice_schedule_service.get_practice_schedule(UUID(schedule_id))

        # 出席情報を取得
        attendances = await attendance_service.get_attendances_by_practice(UUID(schedule_id))

        # 参加者情報を整形
        participants = []
        for attendance in attendances:
            participant = {
                "id": attendance.get("id"),
                "user_id": attendance.get("user_id"),
                "name": attendance.get("user_name", ""),
                "email": attendance.get("user_email", ""),
                "status": attendance.get("status", "unknown"),
                "part_id": attendance.get("part_id"),
                "part_name": attendance.get("part_name", ""),
                "is_instructor": attendance.get("is_instructor", False),
            }
            participants.append(participant)

        return {
            "event_id": f"evt_{schedule_id}",
            "schedule_id": schedule_id,
            "total_count": len(participants),
            "participants": participants,
        }
    except ValueError:
        raise APIException(ErrorMessage.INVALID_UUID_FORMAT)
    except Exception as e:
        print(f"Error getting participants for event {event_id}: {e}")
        raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)


@router.get("/")
async def get_events(
    start_date: str = None,
    end_date: str = None,
    practice_schedule_service: PracticeScheduleService = Depends(get_practice_schedule_service),
):
    """
    イベント一覧を取得

    Args:
        start_date: 開始日 (YYYY-MM-DD形式、オプション)
        end_date: 終了日 (YYYY-MM-DD形式、オプション)
        practice_schedule_service: 練習スケジュール管理サービス

    Returns:
        イベント一覧
    """
    if start_date and end_date:
        # 日付範囲でフィルタリング
        calendar_data = await practice_schedule_service.get_practice_schedules_for_date_range(
            start_date, end_date
        )
        events = calendar_data.get("events", [])
    else:
        # 全件取得
        schedules = await practice_schedule_service.get_all_practice_schedules()

        # イベント形式に変換
        events = []
        for schedule in schedules:
            event = {
                "id": f"evt_{schedule['id']}",
                "schedule_id": schedule["id"],
                "title": schedule.get("title", "練習"),
                "description": schedule.get("description", ""),
                "start": f"{schedule['schedule_date']}T{schedule['start_time']}",
                "end": f"{schedule['schedule_date']}T{schedule['end_time']}",
                "date": schedule["schedule_date"],
                "start_time": schedule["start_time"],
                "end_time": schedule["end_time"],
                "type": schedule.get("schedule_type", "practice"),
                "status": schedule.get("status", "scheduled"),
            }
            events.append(event)

    return {
        "total_count": len(events),
        "events": events,
    }
