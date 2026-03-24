"""
スケジュール時間スロット関連のビジネスロジック
"""
from __future__ import annotations

from typing import Any
from uuid import UUID
from datetime import time

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from fastapi import HTTPException, status
from app.repositories.protocols import ScheduleTimeSlotRepositoryProtocol


class ScheduleTimeSlotService:
    """スケジュール時間スロットのビジネスロジックを実装するクラス"""

    def __init__(self, schedule_time_slot_repository: ScheduleTimeSlotRepositoryProtocol):
        self.repository = schedule_time_slot_repository

    def get_all_schedule_time_slots(
        self,
        schedule_id: UUID | None = None
    ) -> list[dict[str, Any]]:
        """スケジュール時間スロット一覧を取得"""
        if schedule_id:
            data = self.repository.find_by_schedule(schedule_id)
        else:
            data = self.repository.find_all()
        return [self._format_time_slot(item) for item in data]

    def get_schedule_time_slot(self, time_slot_id: UUID) -> dict[str, Any]:
        """指定したIDのスケジュール時間スロットを取得"""
        time_slot = self.repository.find_by_id(time_slot_id)
        if not time_slot:
            raise APIException(ErrorMessage.USER_NOT_FOUND)
        return self._format_time_slot(time_slot)

    def get_schedule_time_slots_by_schedule(self, schedule_id: UUID) -> list[dict[str, Any]]:
        """指定したスケジュールの時間スロット一覧を取得"""
        data = self.repository.find_by_schedule(schedule_id)
        return [self._format_time_slot(item) for item in data]

    def create_schedule_time_slot(self, time_slot_data: dict[str, Any]) -> dict[str, Any]:
        """スケジュール時間スロットを作成"""
        # スケジュールの存在確認
        self._validate_schedule(time_slot_data["schedule_id"])

        # 開始時刻 < 終了時刻のチェック
        if time_slot_data["start_time"] >= time_slot_data["end_time"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="開始時刻は終了時刻より前である必要があります"
            )

        result = self.repository.create(time_slot_data)
        return self._format_time_slot(result)

    def create_schedule_time_slots_bulk(
        self,
        schedule_id: UUID,
        time_slots: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """スケジュール時間スロットを一括作成"""
        created_items = []
        errors = []

        # スケジュールの存在確認
        schedule = self.repository.find_schedule_by_id(schedule_id)
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定されたスケジュールが存在しません"
            )

        for time_slot_data in time_slots:
            try:
                slot_order = time_slot_data.get("slot_order")
                start_time = time_slot_data.get("start_time")
                end_time = time_slot_data.get("end_time")

                if not slot_order:
                    errors.append("slot_orderが指定されていません")
                    continue

                if not start_time or not end_time:
                    errors.append(f"slot_order {slot_order}: start_timeまたはend_timeが指定されていません")
                    continue

                # 開始時刻 < 終了時刻のチェック
                if isinstance(start_time, str):
                    start_time_obj = self._parse_time_string(start_time)
                else:
                    start_time_obj = start_time

                if isinstance(end_time, str):
                    end_time_obj = self._parse_time_string(end_time)
                else:
                    end_time_obj = end_time

                if start_time_obj >= end_time_obj:
                    errors.append(f"slot_order {slot_order}: 開始時刻は終了時刻より前である必要があります")
                    continue

                # 作成
                create_data = {
                    "schedule_id": schedule_id,
                    "slot_order": slot_order,
                    "start_time": start_time_obj if isinstance(start_time_obj, time) else start_time,
                    "end_time": end_time_obj if isinstance(end_time_obj, time) else end_time
                }
                created_item = self.repository.create(create_data)
                created_items.append(self._format_time_slot(created_item))

            except Exception as e:
                errors.append(f"slot_order {time_slot_data.get('slot_order', 'unknown')}: {str(e)}")

        return {
            "created_count": len(created_items),
            "created_items": created_items,
            "errors": errors
        }

    def update_schedule_time_slot(
        self,
        time_slot_id: UUID,
        update_data: dict[str, Any]
    ) -> dict[str, Any]:
        """スケジュール時間スロットを更新"""
        from datetime import datetime

        # 存在確認
        existing = self.repository.find_by_id(time_slot_id)
        if not existing:
            raise APIException(ErrorMessage.USER_NOT_FOUND)

        # スケジュールの存在確認（更新される場合）
        if "schedule_id" in update_data:
            self._validate_schedule(update_data["schedule_id"])

        # 時間フィールドをtime型に変換（文字列の場合）
        processed_data = dict(update_data)
        if "start_time" in processed_data and isinstance(processed_data["start_time"], str):
            processed_data["start_time"] = self._parse_time_string(processed_data["start_time"])
        if "end_time" in processed_data and isinstance(processed_data["end_time"], str):
            processed_data["end_time"] = self._parse_time_string(processed_data["end_time"])

        # 開始時刻 < 終了時刻のチェック（更新される場合）
        start_time = processed_data.get("start_time", existing.get("start_time"))
        end_time = processed_data.get("end_time", existing.get("end_time"))

        # time型に変換（既存データが文字列の場合）
        if isinstance(start_time, str):
            start_time = self._parse_time_string(start_time)
        if isinstance(end_time, str):
            end_time = self._parse_time_string(end_time)

        if start_time and end_time and start_time >= end_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="開始時刻は終了時刻より前である必要があります"
            )

        result = self.repository.update(time_slot_id, processed_data)
        return self._format_time_slot(result)

    def _parse_time_string(self, time_str: str) -> time:
        """文字列をtime型に変換"""
        from datetime import datetime

        # タイムスタンプ形式（06:37:33.593Z）の場合
        if "Z" in time_str or "T" in time_str:
            try:
                dt = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
                return dt.time()
            except:
                # パースに失敗した場合は、時刻部分を抽出
                if "T" in time_str:
                    time_part = time_str.split("T")[1].split("Z")[0].split("+")[0].split("-")[0]
                else:
                    time_part = time_str.split("Z")[0]
                time_parts = time_part.split(":")
                if len(time_parts) >= 2:
                    hour = int(time_parts[0])
                    minute = int(time_parts[1])
                    second = int(time_parts[2].split(".")[0]) if len(time_parts) > 2 else 0
                    return time(hour, minute, second)

        # HH:MM または HH:MM:SS 形式
        time_parts = time_str.split(":")
        if len(time_parts) >= 2:
            hour = int(time_parts[0])
            minute = int(time_parts[1])
            second = int(time_parts[2]) if len(time_parts) > 2 else 0
            return time(hour, minute, second)

        raise ValueError(f"無効な時刻形式: {time_str}")

    def delete_schedule_time_slot(self, time_slot_id: UUID) -> bool:
        """スケジュール時間スロットを削除"""
        existing = self.repository.find_by_id(time_slot_id)
        if not existing:
            raise APIException(ErrorMessage.USER_NOT_FOUND)

        return self.repository.delete(time_slot_id)

    def delete_schedule_time_slots_by_schedule(self, schedule_id: UUID) -> int:
        """指定したスケジュールの時間スロットをすべて削除"""
        return self.repository.delete_by_schedule(schedule_id)

    def _format_time_slot(self, time_slot: dict[str, Any]) -> dict[str, Any]:
        """時間スロットの時間フィールドをHH:MM形式に変換"""
        from datetime import datetime

        formatted = dict(time_slot)

        # start_time の変換
        if "start_time" in formatted and formatted["start_time"]:
            if isinstance(formatted["start_time"], time):
                formatted["start_time"] = formatted["start_time"].strftime("%H:%M")
            elif isinstance(formatted["start_time"], str):
                # 文字列の場合、様々な形式に対応
                time_str = formatted["start_time"]
                # ISO 8601形式（06:31:41.814Z）やタイムスタンプ形式の場合
                if "T" in time_str or "Z" in time_str:
                    # タイムスタンプ形式から時刻部分を抽出
                    try:
                        dt = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
                        formatted["start_time"] = dt.strftime("%H:%M")
                    except:
                        # パースに失敗した場合は、最初の5文字（HH:MM）を取得
                        if ":" in time_str:
                            formatted["start_time"] = time_str[:5]
                elif ":" in time_str:
                    # HH:MM:SS形式からHH:MM形式に変換
                    formatted["start_time"] = time_str[:5]

        # end_time の変換
        if "end_time" in formatted and formatted["end_time"]:
            if isinstance(formatted["end_time"], time):
                formatted["end_time"] = formatted["end_time"].strftime("%H:%M")
            elif isinstance(formatted["end_time"], str):
                # 文字列の場合、様々な形式に対応
                time_str = formatted["end_time"]
                # ISO 8601形式（06:31:41.814Z）やタイムスタンプ形式の場合
                if "T" in time_str or "Z" in time_str:
                    # タイムスタンプ形式から時刻部分を抽出
                    try:
                        dt = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
                        formatted["end_time"] = dt.strftime("%H:%M")
                    except:
                        # パースに失敗した場合は、最初の5文字（HH:MM）を取得
                        if ":" in time_str:
                            formatted["end_time"] = time_str[:5]
                elif ":" in time_str:
                    # HH:MM:SS形式からHH:MM形式に変換
                    formatted["end_time"] = time_str[:5]

        return formatted

    def _validate_schedule(self, schedule_id: UUID):
        """スケジュールの存在確認"""
        schedule = self.repository.find_schedule_by_id(schedule_id)
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定されたスケジュールが存在しません"
            )
        return True
