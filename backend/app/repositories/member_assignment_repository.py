"""
メンバー所属データアクセスレイヤー
BACK-DB-001.2: パート区分・メンバー所属テーブル設計
"""
import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, date

from app.models.part import MemberAssignment, AssignmentHistory
from app.core.exceptions import handle_supabase_errors


logger = logging.getLogger(__name__)


class MemberAssignmentRepository:
    """メンバー所属データにアクセスするリポジトリクラス"""
    
    def __init__(self, db_client):
        """
        リポジトリの初期化
        
        Args:
            db_client: Supabaseクライアント
        """
        self._db_client = db_client
        self._logger = logger
    
    def _convert_assignment_data(self, data: dict) -> dict:
        """データベースのデータをMemberAssignmentモデル用に変換"""
        converted = data.copy()
        
        # UUIDの文字列を変換
        for uuid_field in ['id', 'user_id', 'part_id']:
            if uuid_field in converted and converted[uuid_field] is not None and isinstance(converted[uuid_field], str):
                converted[uuid_field] = UUID(converted[uuid_field])
        
        # 日付の文字列を変換
        for date_field in ['assigned_date', 'end_date']:
            if date_field in converted and converted[date_field]:
                if isinstance(converted[date_field], str):
                    converted[date_field] = date.fromisoformat(converted[date_field])
        
        # datetimeの文字列を変換
        for datetime_field in ['created_at', 'updated_at']:
            if datetime_field in converted and converted[datetime_field]:
                if isinstance(converted[datetime_field], str):
                    converted[datetime_field] = datetime.fromisoformat(converted[datetime_field].replace('Z', '+00:00'))
        
        return converted
    
    def _convert_history_data(self, data: dict) -> dict:
        """データベースのデータをAssignmentHistoryモデル用に変換"""
        converted = data.copy()
        
        # UUIDの文字列を変換
        for uuid_field in ['id', 'assignment_id', 'modified_by']:
            if uuid_field in converted and converted[uuid_field] is not None and isinstance(converted[uuid_field], str):
                converted[uuid_field] = UUID(converted[uuid_field])
        
        # datetimeの文字列を変換
        if 'action_date' in converted and converted['action_date']:
            if isinstance(converted['action_date'], str):
                converted['action_date'] = datetime.fromisoformat(converted['action_date'].replace('Z', '+00:00'))
        
        return converted
    
    @handle_supabase_errors("get_user_assignments")
    async def get_user_assignments(self, user_id: UUID) -> List[MemberAssignment]:
        """ユーザーの所属一覧"""
        response = self._db_client.table('member_assignments').select('*').eq('user_id', str(user_id)).execute()
        
        assignments = []
        if response.data:
            for data in response.data:
                converted_data = self._convert_assignment_data(data)
                assignments.append(MemberAssignment(**converted_data))
        
        self._logger.info(f"Retrieved {len(assignments)} assignments for user {user_id}")
        return assignments
    
    @handle_supabase_errors("get_active_assignments")
    async def get_active_assignments(self, user_id: UUID) -> List[MemberAssignment]:
        """有効な所属一覧"""
        response = (self._db_client.table('member_assignments')
                   .select('*')
                   .eq('user_id', str(user_id))
                   .eq('status', 'active')
                   .execute())
        
        assignments = []
        if response.data:
            for data in response.data:
                converted_data = self._convert_assignment_data(data)
                assignments.append(MemberAssignment(**converted_data))
        
        return assignments
    
    @handle_supabase_errors("get_assignment")
    async def get_assignment(self, assignment_id: UUID) -> Optional[MemberAssignment]:
        """特定所属を取得"""
        response = self._db_client.table('member_assignments').select('*').eq('id', str(assignment_id)).execute()
        
        if response.data and len(response.data) > 0:
            converted_data = self._convert_assignment_data(response.data[0])
            return MemberAssignment(**converted_data)
        
        return None
    
    @handle_supabase_errors("create_assignment")
    async def create_assignment(self, assignment_data: dict) -> MemberAssignment:
        """所属を作成"""
        # データの準備
        insert_data = {
            "user_id": str(assignment_data["user_id"]),
            "part_id": str(assignment_data["part_id"]),
            "is_primary": assignment_data.get("is_primary", False),
            "skill_level": assignment_data.get("skill_level", 1),
            "experience_points": assignment_data.get("experience_points", 0),
            "assigned_date": assignment_data["assigned_date"].isoformat() if isinstance(assignment_data["assigned_date"], date) else assignment_data["assigned_date"],
            "status": assignment_data.get("status", "active"),
            "attributes": assignment_data.get("attributes", {})
        }
        
        if "end_date" in assignment_data and assignment_data["end_date"]:
            insert_data["end_date"] = assignment_data["end_date"].isoformat() if isinstance(assignment_data["end_date"], date) else assignment_data["end_date"]
        
        response = self._db_client.table('member_assignments').insert(insert_data).execute()
        
        if response.data and len(response.data) > 0:
            converted_data = self._convert_assignment_data(response.data[0])
            self._logger.info(f"Created assignment for user {assignment_data['user_id']} to part {assignment_data['part_id']}")
            return MemberAssignment(**converted_data)
        
        raise Exception("Failed to create assignment")
    
    @handle_supabase_errors("update_assignment")
    async def update_assignment(self, assignment_id: UUID, data: dict) -> MemberAssignment:
        """所属を更新"""
        # 更新可能なフィールドのみを抽出
        update_data = {}
        for field in ["is_primary", "skill_level", "experience_points", "status", "attributes", "end_date"]:
            if field in data:
                if field == "end_date" and data[field]:
                    update_data[field] = data[field].isoformat() if isinstance(data[field], date) else data[field]
                else:
                    update_data[field] = data[field]
        
        if not update_data:
            # 更新するデータがない場合は現在のデータを返す
            return await self.get_assignment(assignment_id)
        
        response = self._db_client.table('member_assignments').update(update_data).eq('id', str(assignment_id)).execute()
        
        if response.data and len(response.data) > 0:
            converted_data = self._convert_assignment_data(response.data[0])
            self._logger.info(f"Updated assignment {assignment_id}")
            return MemberAssignment(**converted_data)
        
        raise Exception(f"Failed to update assignment {assignment_id}")
    
    @handle_supabase_errors("end_assignment")
    async def end_assignment(self, assignment_id: UUID, end_date: date, reason: str = None) -> MemberAssignment:
        """所属を終了"""
        update_data = {
            "end_date": end_date.isoformat(),
            "status": "ended"
        }
        
        response = self._db_client.table('member_assignments').update(update_data).eq('id', str(assignment_id)).execute()
        
        if response.data and len(response.data) > 0:
            converted_data = self._convert_assignment_data(response.data[0])
            self._logger.info(f"Ended assignment {assignment_id} on {end_date}")
            return MemberAssignment(**converted_data)
        
        raise Exception(f"Failed to end assignment {assignment_id}")
    
    @handle_supabase_errors("get_part_members")
    async def get_part_members(self, part_id: UUID) -> List[MemberAssignment]:
        """パートのメンバー一覧"""
        response = self._db_client.table('member_assignments').select('*').eq('part_id', str(part_id)).execute()
        
        assignments = []
        if response.data:
            for data in response.data:
                converted_data = self._convert_assignment_data(data)
                assignments.append(MemberAssignment(**converted_data))
        
        return assignments
    
    @handle_supabase_errors("get_assignment_history")
    async def get_assignment_history(self, assignment_id: UUID) -> List[AssignmentHistory]:
        """所属履歴取得"""
        response = (self._db_client.table('assignment_history')
                   .select('*')
                   .eq('assignment_id', str(assignment_id))
                   .order('action_date', desc=True)
                   .execute())
        
        history = []
        if response.data:
            for data in response.data:
                converted_data = self._convert_history_data(data)
                history.append(AssignmentHistory(**converted_data))
        
        return history
    
    @handle_supabase_errors("record_history")
    async def record_history(
        self,
        assignment_id: UUID,
        action_type: str,
        previous: dict,
        new: dict,
        reason: str,
        modified_by: UUID
    ) -> AssignmentHistory:
        """履歴記録"""
        insert_data = {
            "assignment_id": str(assignment_id),
            "action_type": action_type,
            "previous_state": previous,
            "new_state": new,
            "reason": reason,
            "modified_by": str(modified_by)
        }
        
        response = self._db_client.table('assignment_history').insert(insert_data).execute()
        
        if response.data and len(response.data) > 0:
            converted_data = self._convert_history_data(response.data[0])
            self._logger.info(f"Recorded {action_type} history for assignment {assignment_id}")
            return AssignmentHistory(**converted_data)
        
        raise Exception("Failed to record history")