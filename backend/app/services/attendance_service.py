from typing import Any, Dict, List, Optional
from uuid import UUID

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.attendance_repository import AttendanceRepository


class AttendanceService:
    """出欠管理のビジネスロジックを実装するクラス"""

    def __init__(self, attendance_repository: AttendanceRepository):
        self.repository = attendance_repository

    async def get_all_attendances(self) -> List[Dict[str, Any]]:
        """すべての出欠記録を取得"""
        return await self.repository.find_all()

    async def get_attendance(self, attendance_id: UUID) -> Dict[str, Any]:
        """指定したIDの出欠記録を取得"""
        attendance = await self.repository.find_by_id(attendance_id)
        if not attendance:
            raise APIException(ErrorMessage.USER_NOT_FOUND)
        return attendance

    async def get_attendances_by_practice(self, practice_schedule_id: UUID) -> List[Dict[str, Any]]:
        """指定した練習スケジュールの出欠記録を取得"""
        return await self.repository.find_by_practice_schedule(practice_schedule_id)

    async def get_attendances_by_user(self, user_id: UUID) -> List[Dict[str, Any]]:
        """指定したユーザーの出欠記録を取得"""
        return await self.repository.find_by_user(user_id)

    async def get_attendance_by_practice_and_user(
        self, practice_schedule_id: UUID, user_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """指定した練習とユーザーの組み合わせの出欠記録を取得"""
        return await self.repository.find_by_practice_and_user(practice_schedule_id, user_id)

    async def create_attendance(self, attendance_data: Dict[str, Any]) -> Dict[str, Any]:
        """出欠記録を作成"""
        # 既存の記録があるかチェック
        existing = await self.repository.find_by_practice_and_user(
            attendance_data["practice_schedule_id"], attendance_data["user_id"]
        )
        if existing:
            raise APIException("既にこの練習の出欠記録が存在します")
        
        return await self.repository.create(attendance_data)

    async def update_attendance(self, attendance_id: UUID, attendance_data: Dict[str, Any]) -> Dict[str, Any]:
        """出欠記録を更新"""
        # 存在チェック
        existing = await self.repository.find_by_id(attendance_id)
        if not existing:
            raise APIException(ErrorMessage.USER_NOT_FOUND)
        
        return await self.repository.update(attendance_id, attendance_data)

    async def upsert_attendance(self, attendance_data: Dict[str, Any]) -> Dict[str, Any]:
        """出欠記録を作成または更新（practice_schedule_id + user_idの組み合わせで）"""
        return await self.repository.upsert(attendance_data)

    async def remove_attendance(self, attendance_id: UUID) -> bool:
        """出欠記録を削除"""
        attendance = await self.repository.find_by_id(attendance_id)
        if not attendance:
            raise APIException(ErrorMessage.USER_NOT_FOUND)
        
        await self.repository.delete(attendance_id)
        return True

    async def get_attendance_summary(self) -> List[Dict[str, Any]]:
        """練習別の出欠サマリーを取得"""
        return await self.repository.get_attendance_summary()

    async def get_user_attendance_history(self) -> List[Dict[str, Any]]:
        """ユーザー別の出欠履歴を取得"""
        return await self.repository.get_user_attendance_history()

    async def bulk_update_attendances(
        self, practice_schedule_id: UUID, attendances: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """複数の出欠記録を一括更新"""
        results = []
        for attendance_data in attendances:
            attendance_data["practice_schedule_id"] = practice_schedule_id
            result = await self.repository.upsert(attendance_data)
            results.append(result)
        return results

