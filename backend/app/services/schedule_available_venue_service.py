"""
スケジュール利用可能会場関連のビジネスロジック
"""
from __future__ import annotations

from typing import Any
from uuid import UUID

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from fastapi import HTTPException, status
from app.repositories.schedule_available_venue_repository import ScheduleAvailableVenueRepository


class ScheduleAvailableVenueService:
    """スケジュール利用可能会場のビジネスロジックを実装するクラス"""

    def __init__(self, schedule_available_venue_repository: ScheduleAvailableVenueRepository):
        self.repository = schedule_available_venue_repository

    async def get_all_schedule_available_venues(
        self,
        schedule_id: UUID | None = None,
        venue_id: UUID | None = None
    ) -> list[dict[str, Any]]:
        """スケジュール利用可能会場一覧を取得"""
        items = await self.repository.find_all_with_details(
            limit=1000,  # 十分大きな値を設定
            offset=0,
            schedule_id=schedule_id,
            venue_id=venue_id
        )
        
        return items

    async def get_schedule_available_venue(self, schedule_venue_id: UUID) -> dict[str, Any]:
        """指定したIDのスケジュール利用可能会場を取得"""
        schedule_venue = await self.repository.find_by_id(schedule_venue_id)
        if not schedule_venue:
            raise APIException(ErrorMessage.USER_NOT_FOUND)
        return schedule_venue

    async def get_schedule_available_venues_by_schedule(self, schedule_id: UUID) -> list[dict[str, Any]]:
        """指定したスケジュールの利用可能会場一覧を取得"""
        return await self.repository.find_by_schedule(schedule_id)

    async def get_schedule_available_venues_by_venue(self, venue_id: UUID) -> list[dict[str, Any]]:
        """指定した会場のスケジュール利用可能性一覧を取得"""
        return await self.repository.find_by_venue(venue_id)

    async def create_schedule_available_venue(self, schedule_venue_data: dict[str, Any]) -> dict[str, Any]:
        """スケジュール利用可能会場を作成"""
        # スケジュールと会場の存在確認
        await self._validate_schedule_and_venue(
            schedule_venue_data["schedule_id"],
            schedule_venue_data["venue_id"]
        )
        
        # 重複チェック
        existing = await self.repository.find_by_schedule_and_venue(
            schedule_venue_data["schedule_id"],
            schedule_venue_data["venue_id"]
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="指定されたスケジュールと会場の組み合わせは既に存在します"
            )
        
        return await self.repository.create(schedule_venue_data)

    async def create_schedule_available_venues_bulk(
        self, 
        schedule_id: UUID,
        venues: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """スケジュール利用可能会場を一括作成"""
        created_items = []
        errors = []
        
        # スケジュールの存在確認
        schedule = await self.repository.find_schedule_by_id(schedule_id)
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定されたスケジュールが存在しません"
            )
        
        for venue_data in venues:
            try:
                venue_id = venue_data.get("venue_id")
                if not venue_id:
                    errors.append("venue_idが指定されていません")
                    continue
                
                # 重複チェック
                existing = await self.repository.find_by_schedule_and_venue(schedule_id, venue_id)
                if existing:
                    errors.append(f"会場 {venue_id} は既にスケジュール {schedule_id} に登録されています")
                    continue
                
                # 会場の存在確認
                venue = await self.repository.find_venue_by_id(venue_id)
                if not venue:
                    errors.append(f"会場 {venue_id} が存在しません")
                    continue
                
                # 作成
                schedule_venue_data = {
                    "schedule_id": schedule_id,
                    "venue_id": venue_id,
                    "is_preferred": venue_data.get("is_preferred", False),
                    "priority": venue_data.get("priority", 0),
                    "notes": venue_data.get("notes")
                }
                created_item = await self.repository.create(schedule_venue_data)
                created_items.append(created_item)
                
            except Exception as e:
                errors.append(f"会場 {venue_data.get('venue_id', 'unknown')}: {str(e)}")
        
        return {
            "created_count": len(created_items),
            "created_items": created_items,
            "errors": errors
        }

    async def update_schedule_available_venue(
        self, 
        schedule_venue_id: UUID, 
        update_data: dict[str, Any]
    ) -> dict[str, Any]:
        """スケジュール利用可能会場を更新"""
        # 存在確認
        existing = await self.repository.find_by_id(schedule_venue_id)
        if not existing:
            raise APIException(ErrorMessage.USER_NOT_FOUND)
        
        # スケジュールと会場の存在確認（更新される場合）
        if "schedule_id" in update_data or "venue_id" in update_data:
            schedule_id = update_data.get("schedule_id", existing["schedule_id"])
            venue_id = update_data.get("venue_id", existing["venue_id"])
            await self._validate_schedule_and_venue(schedule_id, venue_id)
            
            # 重複チェック（自分以外で同じ組み合わせがないか）
            duplicate = await self.repository.find_by_schedule_and_venue(schedule_id, venue_id)
            if duplicate and duplicate["id"] != str(schedule_venue_id):
                raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="指定されたスケジュールと会場の組み合わせは既に存在します"
            )
        
        return await self.repository.update(schedule_venue_id, update_data)

    async def update_venue_availability_bulk(
        self,
        schedule_id: UUID,
        venue_updates: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """会場利用可能性を一括更新"""
        created_count = 0
        updated_count = 0
        deleted_count = 0
        errors = []
        
        # スケジュールの存在確認
        schedule = await self.repository.find_schedule_by_id(schedule_id)
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定されたスケジュールが存在しません"
            )
        
        for venue_update in venue_updates:
            try:
                venue_id = venue_update.get("venue_id")
                action = venue_update.get("action", "create")
                
                if not venue_id:
                    errors.append("venue_idが指定されていません")
                    continue
                
                if action == "create":
                    # 作成
                    existing = await self.repository.find_by_schedule_and_venue(schedule_id, venue_id)
                    if existing:
                        errors.append(f"会場 {venue_id} は既に登録されています")
                        continue
                    
                    schedule_venue_data = {
                        "schedule_id": schedule_id,
                        "venue_id": venue_id,
                        "is_preferred": venue_update.get("is_preferred", False),
                        "priority": venue_update.get("priority", 0),
                        "notes": venue_update.get("notes")
                    }
                    await self.repository.create(schedule_venue_data)
                    created_count += 1
                    
                elif action == "update":
                    # 更新
                    existing = await self.repository.find_by_schedule_and_venue(schedule_id, venue_id)
                    if not existing:
                        errors.append(f"会場 {venue_id} が見つかりません")
                        continue
                    
                    update_data = {}
                    if "is_preferred" in venue_update:
                        update_data["is_preferred"] = venue_update["is_preferred"]
                    if "priority" in venue_update:
                        update_data["priority"] = venue_update["priority"]
                    if "notes" in venue_update:
                        update_data["notes"] = venue_update["notes"]
                    
                    if update_data:
                        await self.repository.update(existing["id"], update_data)
                        updated_count += 1
                    
                elif action == "delete":
                    # 削除
                    existing = await self.repository.find_by_schedule_and_venue(schedule_id, venue_id)
                    if not existing:
                        errors.append(f"会場 {venue_id} が見つかりません")
                        continue
                    
                    await self.repository.delete(existing["id"])
                    deleted_count += 1
                    
                else:
                    errors.append(f"不正なアクション: {action}")
                    
            except Exception as e:
                errors.append(f"会場 {venue_update.get('venue_id', 'unknown')}: {str(e)}")
        
        return {
            "created_count": created_count,
            "updated_count": updated_count,
            "deleted_count": deleted_count,
            "errors": errors
        }

    async def delete_schedule_available_venue(self, schedule_venue_id: UUID) -> bool:
        """スケジュール利用可能会場を削除"""
        existing = await self.repository.find_by_id(schedule_venue_id)
        if not existing:
            raise APIException(ErrorMessage.USER_NOT_FOUND)
        
        return await self.repository.delete(schedule_venue_id)

    async def delete_schedule_available_venues_by_schedule(self, schedule_id: UUID) -> int:
        """指定したスケジュールの利用可能会場をすべて削除"""
        return await self.repository.delete_by_schedule(schedule_id)

    async def delete_schedule_available_venues_by_venue(self, venue_id: UUID) -> int:
        """指定した会場の利用可能性をすべて削除"""
        return await self.repository.delete_by_venue(venue_id)

    async def _validate_schedule_and_venue(self, schedule_id: UUID, venue_id: UUID):
        """スケジュールと会場の存在確認"""
        # スケジュールの存在確認
        schedule = await self.repository.find_schedule_by_id(schedule_id)
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定されたスケジュールが存在しません"
            )
        
        # 会場の存在確認
        venue = await self.repository.find_venue_by_id(venue_id)
        if not venue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定された会場が存在しません"
            )
        
        return True
