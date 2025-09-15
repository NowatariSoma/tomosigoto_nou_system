import logging
from typing import List, Optional
from app.repositories.schedule_assignments_repository import ScheduleAssignmentsRepository
from app.schemas.schedule_assignments import (
    ScheduleAssignmentCreate,
    ScheduleAssignmentUpdate,
    ScheduleAssignmentResponse,
    ScheduleAssignmentWithDetails
)

logger = logging.getLogger(__name__)


class ScheduleAssignmentsService:
    def __init__(self, repository: ScheduleAssignmentsRepository):
        self.repository = repository

    async def get_all_assignments(self) -> List[ScheduleAssignmentResponse]:
        """すべてのスケジュール割り当てを取得"""
        try:
            assignments = await self.repository.find_all()
            return [ScheduleAssignmentResponse(**assignment) for assignment in assignments]
        except Exception as e:
            logger.error(f"Error getting all assignments: {e}")
            return []

    async def get_assignments_by_practice_slot(self, practice_slot_id: str) -> List[ScheduleAssignmentWithDetails]:
        """指定された練習日のすべての割り当てを取得"""
        try:
            assignments = await self.repository.find_by_practice_slot(practice_slot_id)
            result = []
            
            for assignment in assignments:
                # グループ情報を抽出
                group_info = assignment.get("groups", {})
                group_name = group_info.get("name") if group_info else None
                group_display_name = group_info.get("display_name") if group_info else None
                group_color = group_info.get("color") if group_info else None
                
                # パート情報を抽出
                part_info = assignment.get("practice_parts", {})
                part_name = part_info.get("name") if part_info else None
                part_display_name = part_info.get("display_name") if part_info else None
                
                # 基本情報をコピー
                assignment_data = {k: v for k, v in assignment.items() if k not in ["groups", "practice_parts"]}
                
                # 詳細情報を追加
                assignment_data.update({
                    "group_name": group_name,
                    "group_display_name": group_display_name,
                    "group_color": group_color,
                    "part_name": part_name,
                    "part_display_name": part_display_name
                })
                
                result.append(ScheduleAssignmentWithDetails(**assignment_data))
            
            return result
        except Exception as e:
            logger.error(f"Error getting assignments by practice slot: {e}")
            return []

    async def get_assignment_by_time_and_group(
        self, 
        practice_slot_id: str, 
        time_slot: str, 
        group_id: str
    ) -> Optional[ScheduleAssignmentWithDetails]:
        """指定された時間・グループの割り当てを取得"""
        try:
            assignment = await self.repository.find_by_time_and_group(practice_slot_id, time_slot, group_id)
            if not assignment:
                return None
            
            # グループ情報を抽出
            group_info = assignment.get("groups", {})
            group_name = group_info.get("name") if group_info else None
            group_display_name = group_info.get("display_name") if group_info else None
            group_color = group_info.get("color") if group_info else None
            
            # パート情報を抽出
            part_info = assignment.get("practice_parts", {})
            part_name = part_info.get("name") if part_info else None
            part_display_name = part_info.get("display_name") if part_info else None
            
            # 基本情報をコピー
            assignment_data = {k: v for k, v in assignment.items() if k not in ["groups", "practice_parts"]}
            
            # 詳細情報を追加
            assignment_data.update({
                "group_name": group_name,
                "group_display_name": group_display_name,
                "group_color": group_color,
                "part_name": part_name,
                "part_display_name": part_display_name
            })
            
            return ScheduleAssignmentWithDetails(**assignment_data)
        except Exception as e:
            logger.error(f"Error getting assignment by time and group: {e}")
            return None

    async def create_assignment(self, assignment_data: ScheduleAssignmentCreate) -> ScheduleAssignmentResponse:
        """新しいスケジュール割り当てを作成"""
        try:
            assignment_dict = assignment_data.model_dump()
            result = await self.repository.create(assignment_dict)
            return ScheduleAssignmentResponse(**result)
        except Exception as e:
            logger.error(f"Error creating assignment: {e}")
            raise

    async def update_assignment(self, assignment_id: str, assignment_data: ScheduleAssignmentUpdate) -> ScheduleAssignmentResponse:
        """スケジュール割り当てを更新"""
        try:
            update_dict = assignment_data.model_dump(exclude_unset=True)
            result = await self.repository.update(assignment_id, update_dict)
            return ScheduleAssignmentResponse(**result)
        except Exception as e:
            logger.error(f"Error updating assignment: {e}")
            raise

    async def delete_assignment(self, assignment_id: str) -> bool:
        """スケジュール割り当てを削除"""
        try:
            return await self.repository.delete(assignment_id)
        except Exception as e:
            logger.error(f"Error deleting assignment: {e}")
            raise

    async def upsert_assignment(self, assignment_data: ScheduleAssignmentCreate) -> ScheduleAssignmentResponse:
        """スケジュール割り当てを更新または作成"""
        try:
            assignment_dict = assignment_data.model_dump()
            result = await self.repository.upsert(assignment_dict)
            return ScheduleAssignmentResponse(**result)
        except Exception as e:
            logger.error(f"Error upserting assignment: {e}")
            raise




