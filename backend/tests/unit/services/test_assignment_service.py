"""
所属サービスのユニットテスト
TDDアプローチに従い、期待される入出力を定義
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, date
from uuid import UUID, uuid4
from typing import List, Dict, Any, Tuple

import pytest


class TestAssignmentService:
    """所属サービスのテストクラス"""
    
    def setup_method(self):
        """テスト準備"""
        self.mock_assignment_repository = Mock()
        self.mock_part_repository = Mock()
        self.mock_user_service = Mock()
        
        self.assignment_id = uuid4()
        self.user_id = uuid4()
        self.part_id = uuid4()
        
        # サンプル所属データ
        self.sample_assignment = Mock()
        self.sample_assignment.id = self.assignment_id
        self.sample_assignment.user_id = self.user_id
        self.sample_assignment.part_id = self.part_id
        self.sample_assignment.is_primary = True
        self.sample_assignment.skill_level = 3
        self.sample_assignment.status = "active"
    
    def test_init_service(self):
        """サービス初期化テスト"""
        from app.services.assignment_service import AssignmentService
        
        service = AssignmentService(
            self.mock_assignment_repository,
            self.mock_part_repository,
            self.mock_user_service
        )
        
        assert service._assignment_repository == self.mock_assignment_repository
        assert service._part_repository == self.mock_part_repository
        assert service._user_service == self.mock_user_service
        assert hasattr(service, '_logger')
    
    @pytest.mark.asyncio
    async def test_get_user_assignments(self):
        """ユーザーの所属取得テスト"""
        from app.services.assignment_service import AssignmentService
        
        # モックリポジトリの設定
        self.mock_assignment_repository.get_user_assignments = AsyncMock(
            return_value=[self.sample_assignment]
        )
        
        service = AssignmentService(
            self.mock_assignment_repository,
            self.mock_part_repository,
            self.mock_user_service
        )
        assignments = await service.get_user_assignments(self.user_id)
        
        assert len(assignments) == 1
        assert assignments[0].user_id == self.user_id
        
        self.mock_assignment_repository.get_user_assignments.assert_called_once_with(self.user_id)
    
    @pytest.mark.asyncio
    async def test_get_active_assignments(self):
        """有効な所属取得テスト"""
        from app.services.assignment_service import AssignmentService
        
        # モックリポジトリの設定
        self.mock_assignment_repository.get_active_assignments = AsyncMock(
            return_value=[self.sample_assignment]
        )
        
        service = AssignmentService(
            self.mock_assignment_repository,
            self.mock_part_repository,
            self.mock_user_service
        )
        assignments = await service.get_active_assignments(self.user_id)
        
        assert len(assignments) == 1
        assert assignments[0].status == "active"
        
        self.mock_assignment_repository.get_active_assignments.assert_called_once_with(self.user_id)
    
    @pytest.mark.asyncio
    async def test_assign_member(self):
        """メンバー所属登録テスト"""
        from app.services.assignment_service import AssignmentService
        from app.schemas.part_schemas import AssignmentCreate
        
        # モックリポジトリの設定
        self.mock_assignment_repository.create_assignment = AsyncMock(
            return_value=self.sample_assignment
        )
        
        service = AssignmentService(
            self.mock_assignment_repository,
            self.mock_part_repository,
            self.mock_user_service
        )
        
        assignment_data = AssignmentCreate(
            user_id=self.user_id,
            part_id=self.part_id,
            is_primary=True,
            skill_level=3,
            assigned_date=date(2024, 1, 1)
        )
        created_by = uuid4()
        
        assignment = await service.assign_member(assignment_data, created_by)
        
        assert assignment.user_id == self.user_id
        assert assignment.part_id == self.part_id
        
        # リポジトリが呼ばれたことを確認
        self.mock_assignment_repository.create_assignment.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_update_assignment(self):
        """所属更新テスト"""
        from app.services.assignment_service import AssignmentService
        
        # 更新後の所属データ
        updated_assignment = Mock()
        updated_assignment.id = self.assignment_id
        updated_assignment.skill_level = 4
        
        # モックリポジトリの設定
        self.mock_assignment_repository.update_assignment = AsyncMock(
            return_value=updated_assignment
        )
        self.mock_assignment_repository.record_history = AsyncMock()
        
        service = AssignmentService(
            self.mock_assignment_repository,
            self.mock_part_repository,
            self.mock_user_service
        )
        
        update_data = {"skill_level": 4}
        modified_by = uuid4()
        
        assignment = await service.update_assignment(self.assignment_id, update_data, modified_by)
        
        assert assignment.skill_level == 4
        
        # 更新と履歴記録が呼ばれたことを確認
        self.mock_assignment_repository.update_assignment.assert_called_once()
        self.mock_assignment_repository.record_history.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_end_assignment(self):
        """所属終了テスト"""
        from app.services.assignment_service import AssignmentService
        
        # 終了後の所属データ
        ended_assignment = Mock()
        ended_assignment.id = self.assignment_id
        ended_assignment.status = "ended"
        ended_assignment.end_date = date(2024, 12, 31)
        
        # モックリポジトリの設定
        self.mock_assignment_repository.end_assignment = AsyncMock(
            return_value=ended_assignment
        )
        self.mock_assignment_repository.record_history = AsyncMock()
        
        service = AssignmentService(
            self.mock_assignment_repository,
            self.mock_part_repository,
            self.mock_user_service
        )
        
        end_date = date(2024, 12, 31)
        reason = "期間満了"
        modified_by = uuid4()
        
        assignment = await service.end_assignment(self.assignment_id, end_date, reason, modified_by)
        
        assert assignment.status == "ended"
        assert assignment.end_date == end_date
        
        # 終了処理と履歴記録が呼ばれたことを確認
        self.mock_assignment_repository.end_assignment.assert_called_once()
        self.mock_assignment_repository.record_history.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_part_members(self):
        """パートのメンバー取得テスト"""
        from app.services.assignment_service import AssignmentService
        
        # モックリポジトリの設定
        self.mock_assignment_repository.get_part_members = AsyncMock(
            return_value=[self.sample_assignment]
        )
        
        service = AssignmentService(
            self.mock_assignment_repository,
            self.mock_part_repository,
            self.mock_user_service
        )
        
        members = await service.get_part_members(self.part_id)
        
        assert len(members) == 1
        assert members[0].part_id == self.part_id
        
        self.mock_assignment_repository.get_part_members.assert_called_once_with(self.part_id)
    
    @pytest.mark.asyncio
    async def test_get_assignment_history(self):
        """所属履歴取得テスト"""
        from app.services.assignment_service import AssignmentService
        
        # サンプル履歴データ
        sample_history = Mock()
        sample_history.id = uuid4()
        sample_history.assignment_id = self.assignment_id
        sample_history.action_type = "update"
        
        # モックリポジトリの設定
        self.mock_assignment_repository.get_assignment_history = AsyncMock(
            return_value=[sample_history]
        )
        
        service = AssignmentService(
            self.mock_assignment_repository,
            self.mock_part_repository,
            self.mock_user_service
        )
        
        history = await service.get_assignment_history(self.assignment_id)
        
        assert len(history) == 1
        assert isinstance(history[0], dict)  # 辞書形式で返される
        
        self.mock_assignment_repository.get_assignment_history.assert_called_once_with(self.assignment_id)
    
    @pytest.mark.asyncio
    async def test_add_experience_points(self):
        """経験値追加テスト"""
        from app.services.assignment_service import AssignmentService
        
        # 経験値更新後の所属データ
        updated_assignment = Mock()
        updated_assignment.id = self.assignment_id
        updated_assignment.experience_points = 200
        
        # モックリポジトリの設定
        self.mock_assignment_repository.get_assignment = AsyncMock(
            return_value=self.sample_assignment
        )
        self.mock_assignment_repository.update_assignment = AsyncMock(
            return_value=updated_assignment
        )
        self.mock_assignment_repository.record_history = AsyncMock()
        
        service = AssignmentService(
            self.mock_assignment_repository,
            self.mock_part_repository,
            self.mock_user_service
        )
        
        points = 50
        reason = "公演参加"
        modified_by = uuid4()
        
        assignment = await service.add_experience_points(self.assignment_id, points, reason, modified_by)
        
        assert assignment.experience_points == 200
        
        # 更新と履歴記録が呼ばれたことを確認
        self.mock_assignment_repository.update_assignment.assert_called_once()
        self.mock_assignment_repository.record_history.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_transfer_member(self):
        """メンバー移動テスト"""
        from app.services.assignment_service import AssignmentService
        
        from_part_id = uuid4()
        to_part_id = uuid4()
        
        # 新しい所属データ
        new_assignment = Mock()
        new_assignment.id = uuid4()
        new_assignment.user_id = self.user_id
        new_assignment.part_id = to_part_id
        
        # モックリポジトリの設定
        self.mock_assignment_repository.end_assignment = AsyncMock()
        self.mock_assignment_repository.create_assignment = AsyncMock(
            return_value=new_assignment
        )
        self.mock_assignment_repository.record_history = AsyncMock()
        
        service = AssignmentService(
            self.mock_assignment_repository,
            self.mock_part_repository,
            self.mock_user_service
        )
        
        reason = "異動"
        modified_by = uuid4()
        
        assignment = await service.transfer_member(
            self.user_id, from_part_id, to_part_id, reason, modified_by
        )
        
        assert assignment.part_id == to_part_id
        
        # 古い所属の終了と新しい所属の作成が呼ばれたことを確認
        self.mock_assignment_repository.end_assignment.assert_called()
        self.mock_assignment_repository.create_assignment.assert_called()
    
    @pytest.mark.asyncio
    async def test_validate_assignment(self):
        """所属可能性の検証テスト"""
        from app.services.assignment_service import AssignmentService
        
        # モックパートデータ
        mock_part = Mock()
        mock_part.id = self.part_id
        mock_part.requirements = {"experience_years": 3}
        mock_part.is_active = True
        
        # モックユーザーデータ
        mock_user = Mock()
        mock_user.id = self.user_id
        
        # モックリポジトリの設定
        self.mock_part_repository.get_part = AsyncMock(return_value=mock_part)
        self.mock_user_service.get_user = AsyncMock(return_value=mock_user)
        
        service = AssignmentService(
            self.mock_assignment_repository,
            self.mock_part_repository,
            self.mock_user_service
        )
        
        is_valid, errors = await service.validate_assignment(self.user_id, self.part_id)
        
        assert isinstance(is_valid, bool)
        assert isinstance(errors, list)
        
        # パートとユーザーの取得が呼ばれたことを確認
        self.mock_part_repository.get_part.assert_called_once_with(self.part_id)
        self.mock_user_service.get_user.assert_called_once_with(self.user_id)