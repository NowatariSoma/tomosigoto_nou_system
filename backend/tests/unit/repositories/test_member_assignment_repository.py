"""
メンバー所属リポジトリのユニットテスト
TDDアプローチに従い、期待される入出力を定義
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, date
from uuid import UUID, uuid4
from typing import List, Dict, Any

import pytest


class TestMemberAssignmentRepository:
    """メンバー所属リポジトリのテストクラス"""
    
    def setup_method(self):
        """テスト準備"""
        self.mock_db_client = Mock()
        self.assignment_id = uuid4()
        self.user_id = uuid4()
        self.part_id = uuid4()
        
        self.sample_assignment_data = {
            "id": str(self.assignment_id),
            "user_id": str(self.user_id),
            "part_id": str(self.part_id),
            "is_primary": True,
            "skill_level": 3,
            "experience_points": 150,
            "assigned_date": "2024-01-01",
            "end_date": None,
            "status": "active",
            "attributes": {"notes": "主担当として配属"},
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        self.sample_history_data = {
            "id": str(uuid4()),
            "assignment_id": str(self.assignment_id),
            "action_type": "update",
            "previous_state": {"skill_level": 2},
            "new_state": {"skill_level": 3},
            "action_date": datetime.now(),
            "reason": "スキルレベル向上",
            "modified_by": str(uuid4())
        }
    
    def test_init_repository(self):
        """リポジトリ初期化テスト"""
        from app.repositories.member_assignment_repository import MemberAssignmentRepository
        
        repo = MemberAssignmentRepository(self.mock_db_client)
        
        assert repo._db_client == self.mock_db_client
        assert hasattr(repo, '_logger')
    
    @pytest.mark.asyncio
    async def test_get_user_assignments(self):
        """ユーザーの所属一覧取得テスト"""
        from app.repositories.member_assignment_repository import MemberAssignmentRepository
        
        # モックレスポンス設定
        mock_response = Mock()
        mock_response.data = [self.sample_assignment_data]
        self.mock_db_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        repo = MemberAssignmentRepository(self.mock_db_client)
        assignments = await repo.get_user_assignments(self.user_id)
        
        assert len(assignments) == 1
        assert assignments[0].user_id == self.user_id
        assert assignments[0].part_id == self.part_id
        
        # DBクライアントが正しく呼ばれたことを確認
        self.mock_db_client.table.assert_called_with('member_assignments')
    
    @pytest.mark.asyncio
    async def test_get_active_assignments(self):
        """有効な所属一覧取得テスト"""
        from app.repositories.member_assignment_repository import MemberAssignmentRepository
        
        # モックレスポンス設定
        mock_response = Mock()
        mock_response.data = [self.sample_assignment_data]
        query_mock = self.mock_db_client.table.return_value.select.return_value.eq.return_value.eq.return_value
        query_mock.execute.return_value = mock_response
        
        repo = MemberAssignmentRepository(self.mock_db_client)
        assignments = await repo.get_active_assignments(self.user_id)
        
        assert len(assignments) == 1
        assert assignments[0].status == "active"
    
    @pytest.mark.asyncio
    async def test_get_assignment(self):
        """特定所属取得テスト"""
        from app.repositories.member_assignment_repository import MemberAssignmentRepository
        
        # モックレスポンス設定
        mock_response = Mock()
        mock_response.data = [self.sample_assignment_data]
        self.mock_db_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        repo = MemberAssignmentRepository(self.mock_db_client)
        assignment = await repo.get_assignment(self.assignment_id)
        
        assert assignment is not None
        assert assignment.id == self.assignment_id
        assert assignment.user_id == self.user_id
    
    @pytest.mark.asyncio
    async def test_create_assignment(self):
        """所属作成テスト"""
        from app.repositories.member_assignment_repository import MemberAssignmentRepository
        
        # モックレスポンス設定
        mock_response = Mock()
        mock_response.data = [self.sample_assignment_data]
        self.mock_db_client.table.return_value.insert.return_value.execute.return_value = mock_response
        
        repo = MemberAssignmentRepository(self.mock_db_client)
        assignment_data = {
            "user_id": str(self.user_id),
            "part_id": str(self.part_id),
            "is_primary": True,
            "skill_level": 3,
            "assigned_date": date(2024, 1, 1)
        }
        
        assignment = await repo.create_assignment(assignment_data)
        
        assert assignment.user_id == self.user_id
        assert assignment.part_id == self.part_id
        assert assignment.is_primary is True
        
        self.mock_db_client.table.assert_called_with('member_assignments')
    
    @pytest.mark.asyncio
    async def test_update_assignment(self):
        """所属更新テスト"""
        from app.repositories.member_assignment_repository import MemberAssignmentRepository
        
        # モックレスポンス設定
        updated_data = self.sample_assignment_data.copy()
        updated_data["skill_level"] = 4
        mock_response = Mock()
        mock_response.data = [updated_data]
        self.mock_db_client.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response
        
        repo = MemberAssignmentRepository(self.mock_db_client)
        update_data = {"skill_level": 4}
        
        assignment = await repo.update_assignment(self.assignment_id, update_data)
        
        assert assignment.skill_level == 4
        self.mock_db_client.table.return_value.update.assert_called_with(update_data)
    
    @pytest.mark.asyncio
    async def test_end_assignment(self):
        """所属終了テスト"""
        from app.repositories.member_assignment_repository import MemberAssignmentRepository
        
        # モックレスポンス設定
        ended_data = self.sample_assignment_data.copy()
        ended_data["end_date"] = "2024-12-31"
        ended_data["status"] = "ended"
        mock_response = Mock()
        mock_response.data = [ended_data]
        self.mock_db_client.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response
        
        repo = MemberAssignmentRepository(self.mock_db_client)
        end_date = date(2024, 12, 31)
        reason = "期間満了"
        
        assignment = await repo.end_assignment(self.assignment_id, end_date, reason)
        
        assert assignment.status == "ended"
        # 更新データに終了日が含まれていることを確認
        update_call = self.mock_db_client.table.return_value.update.call_args[0][0]
        assert "end_date" in update_call
        assert "status" in update_call
    
    @pytest.mark.asyncio
    async def test_get_part_members(self):
        """パートのメンバー一覧取得テスト"""
        from app.repositories.member_assignment_repository import MemberAssignmentRepository
        
        # モックレスポンス設定
        mock_response = Mock()
        mock_response.data = [self.sample_assignment_data]
        self.mock_db_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        repo = MemberAssignmentRepository(self.mock_db_client)
        members = await repo.get_part_members(self.part_id)
        
        assert len(members) == 1
        assert members[0].part_id == self.part_id
        
        # 正しいパートIDでフィルターされたことを確認
        self.mock_db_client.table.return_value.select.return_value.eq.assert_called_with('part_id', str(self.part_id))
    
    @pytest.mark.asyncio
    async def test_get_assignment_history(self):
        """所属履歴取得テスト"""
        from app.repositories.member_assignment_repository import MemberAssignmentRepository
        
        # モックレスポンス設定
        mock_response = Mock()
        mock_response.data = [self.sample_history_data]
        self.mock_db_client.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = mock_response
        
        repo = MemberAssignmentRepository(self.mock_db_client)
        history = await repo.get_assignment_history(self.assignment_id)
        
        assert len(history) == 1
        assert history[0].assignment_id == self.assignment_id
        assert history[0].action_type == "update"
        
        # 履歴テーブルから取得していることを確認
        self.mock_db_client.table.assert_called_with('assignment_history')
    
    @pytest.mark.asyncio
    async def test_record_history(self):
        """履歴記録テスト"""
        from app.repositories.member_assignment_repository import MemberAssignmentRepository
        
        # モックレスポンス設定
        mock_response = Mock()
        mock_response.data = [self.sample_history_data]
        self.mock_db_client.table.return_value.insert.return_value.execute.return_value = mock_response
        
        repo = MemberAssignmentRepository(self.mock_db_client)
        modified_by = uuid4()
        
        history = await repo.record_history(
            assignment_id=self.assignment_id,
            action_type="update",
            previous={"skill_level": 2},
            new={"skill_level": 3},
            reason="スキルレベル向上",
            modified_by=modified_by
        )
        
        assert history.assignment_id == self.assignment_id
        assert history.action_type == "update"
        assert history.reason == "スキルレベル向上"
        
        # 履歴テーブルに挿入されたことを確認
        self.mock_db_client.table.assert_called_with('assignment_history')