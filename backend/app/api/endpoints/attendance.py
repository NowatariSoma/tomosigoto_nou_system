from typing import Any, Dict, List
from uuid import UUID

from app.api.deps import get_current_user, get_attendance_service
from app.schemas.attendance import (
    AttendanceBase, 
    AttendanceCreate, 
    AttendanceResponse, 
    AttendanceUpdate,
    AttendanceSummary,
    UserAttendanceHistory
)
from app.services.attendance_service import AttendanceService
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter()


@router.get("/", response_model=List[AttendanceResponse])
async def get_attendances(
    attendance_service: AttendanceService = Depends(get_attendance_service),
):
    """
    すべての出欠記録を取得

    Args:
        attendance_service: 出欠管理サービス

    Returns:
        すべての出欠記録のリスト
    """
    all_attendance_data = await attendance_service.get_all_attendances()
    return all_attendance_data


@router.get("/{attendance_id}", response_model=AttendanceResponse)
async def get_attendance(
    attendance_id: UUID,
    attendance_service: AttendanceService = Depends(get_attendance_service),
):
    """
    指定したIDの出欠記録を取得

    Args:
        attendance_id: 出欠記録ID
        attendance_service: 出欠管理サービス

    Returns:
        指定したIDの出欠記録
    """
    attendance_data = await attendance_service.get_attendance(attendance_id)
    return AttendanceResponse(**attendance_data)


@router.get("/practice/{practice_schedule_id}", response_model=List[AttendanceResponse])
async def get_attendances_by_practice(
    practice_schedule_id: UUID,
    attendance_service: AttendanceService = Depends(get_attendance_service),
):
    """
    指定した練習スケジュールの出欠記録を取得

    Args:
        practice_schedule_id: 練習スケジュールID
        attendance_service: 出欠管理サービス

    Returns:
        指定した練習の出欠記録のリスト
    """
    attendances = await attendance_service.get_attendances_by_practice(practice_schedule_id)
    return [AttendanceResponse(**attendance) for attendance in attendances]


@router.get("/user/{user_id}", response_model=List[AttendanceResponse])
async def get_attendances_by_user(
    user_id: UUID,
    attendance_service: AttendanceService = Depends(get_attendance_service),
):
    """
    指定したユーザーの出欠記録を取得

    Args:
        user_id: ユーザーID
        attendance_service: 出欠管理サービス

    Returns:
        指定したユーザーの出欠記録のリスト
    """
    attendances = await attendance_service.get_attendances_by_user(user_id)
    return [AttendanceResponse(**attendance) for attendance in attendances]


@router.post("/", response_model=AttendanceResponse)
async def create_attendance(
    attendance_data: AttendanceCreate,
    attendance_service: AttendanceService = Depends(get_attendance_service),
):
    """
    新しい出欠記録を作成

    Args:
        attendance_data: 作成する出欠記録のデータ
        current_user: 現在のユーザー
        attendance_service: 出欠管理サービス

    Returns:
        作成された出欠記録
    """
    # 作成者と更新者を設定
    attendance_dict = attendance_data.model_dump()
    attendance_dict["created_by"] = str(current_user["id"])
    attendance_dict["updated_by"] = str(current_user["id"])
    
    created_attendance = await attendance_service.create_attendance(attendance_dict)
    return AttendanceResponse(**created_attendance)


@router.put("/{attendance_id}", response_model=AttendanceResponse)
async def update_attendance(
    attendance_id: UUID,
    attendance_data: AttendanceUpdate,
    attendance_service: AttendanceService = Depends(get_attendance_service),
):
    """
    指定した出欠記録を更新

    Args:
        attendance_id: 出欠記録ID
        attendance_data: 更新後の出欠記録データ
        current_user: 現在のユーザー
        attendance_service: 出欠管理サービス

    Returns:
        更新された出欠記録
    """
    # 更新者を設定
    attendance_dict = attendance_data.model_dump(exclude_unset=True)
    attendance_dict["updated_by"] = str(current_user["id"])
    
    updated_attendance = await attendance_service.update_attendance(attendance_id, attendance_dict)
    return AttendanceResponse(**updated_attendance)


@router.post("/upsert", response_model=AttendanceResponse)
async def upsert_attendance(
    attendance_data: AttendanceCreate,
    attendance_service: AttendanceService = Depends(get_attendance_service),
):
    """
    出欠記録を作成または更新（practice_schedule_id + user_idの組み合わせで）

    Args:
        attendance_data: 出欠記録のデータ
        attendance_service: 出欠管理サービス

    Returns:
        作成または更新された出欠記録
    """
    # 作成者と更新者を設定（開発用）
    attendance_dict = attendance_data.model_dump()
    attendance_dict["created_by"] = attendance_dict["user_id"]  # ユーザーIDをそのまま使用
    attendance_dict["updated_by"] = attendance_dict["user_id"]
    
    upserted_attendance = await attendance_service.upsert_attendance(attendance_dict)
    return AttendanceResponse(**upserted_attendance)


@router.delete("/{attendance_id}")
async def delete_attendance(
    attendance_id: UUID,
    attendance_service: AttendanceService = Depends(get_attendance_service),
):
    """
    指定した出欠記録を削除

    Args:
        attendance_id: 出欠記録ID
        attendance_service: 出欠管理サービス

    Returns:
        削除成功のメッセージ
    """
    await attendance_service.remove_attendance(attendance_id)
    return {"message": "出欠記録が正常に削除されました"}


@router.get("/summary/practice", response_model=List[AttendanceSummary])
async def get_attendance_summary(
    attendance_service: AttendanceService = Depends(get_attendance_service),
):
    """
    練習別の出欠サマリーを取得

    Args:
        attendance_service: 出欠管理サービス

    Returns:
        練習別の出欠サマリーのリスト
    """
    summary_data = await attendance_service.get_attendance_summary()
    return [AttendanceSummary(**summary) for summary in summary_data]


@router.get("/summary/user", response_model=List[UserAttendanceHistory])
async def get_user_attendance_history(
    attendance_service: AttendanceService = Depends(get_attendance_service),
):
    """
    ユーザー別の出欠履歴を取得

    Args:
        attendance_service: 出欠管理サービス

    Returns:
        ユーザー別の出欠履歴のリスト
    """
    history_data = await attendance_service.get_user_attendance_history()
    return [UserAttendanceHistory(**history) for history in history_data]


@router.post("/bulk/{practice_schedule_id}")
async def bulk_update_attendances(
    practice_schedule_id: UUID,
    attendances: List[AttendanceCreate],
    attendance_service: AttendanceService = Depends(get_attendance_service),
):
    """
    複数の出欠記録を一括更新

    Args:
        practice_schedule_id: 練習スケジュールID
        attendances: 出欠記録のリスト
        current_user: 現在のユーザー
        attendance_service: 出欠管理サービス

    Returns:
        更新された出欠記録のリスト
    """
    # 各記録に作成者と更新者を設定
    attendance_dicts = []
    for attendance in attendances:
        attendance_dict = attendance.model_dump()
        attendance_dict["created_by"] = str(current_user["id"])
        attendance_dict["updated_by"] = str(current_user["id"])
        attendance_dicts.append(attendance_dict)
    
    updated_attendances = await attendance_service.bulk_update_attendances(
        practice_schedule_id, attendance_dicts
    )
    return [AttendanceResponse(**attendance) for attendance in updated_attendances]


