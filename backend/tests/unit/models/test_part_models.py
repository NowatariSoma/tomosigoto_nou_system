"""
パートモデルのユニットテスト
TDDアプローチに従い、期待される入出力を定義
"""
import pytest
from datetime import datetime, date
from uuid import UUID, uuid4
from typing import Dict, Any

import pytest


class TestPartCategoryModel:
    """パートカテゴリモデルのテストクラス"""
    
    def setup_method(self):
        """テスト準備"""
        self.sample_category_data = {
            "id": 1,
            "name": "謡",
            "description": "謡のパート",
            "attributes": {"type": "vocal", "difficulty": "intermediate"},
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
    
    def test_create_category(self):
        """カテゴリ作成テスト"""
        from app.models.part import PartCategory
        
        category = PartCategory(**self.sample_category_data)
        
        assert category.id == 1
        assert category.name == "謡"
        assert category.description == "謡のパート"
        assert category.attributes["type"] == "vocal"
        assert isinstance(category.created_at, datetime)
    
    def test_to_dict(self):
        """辞書変換テスト"""
        from app.models.part import PartCategory
        
        category = PartCategory(**self.sample_category_data)
        result = category.to_dict()
        
        assert isinstance(result, dict)
        assert result["id"] == 1
        assert result["name"] == "謡"
        assert "created_at" in result


class TestPartDefinitionModel:
    """パート定義モデルのテストクラス"""
    
    def setup_method(self):
        """テスト準備"""
        self.part_id = uuid4()
        self.parent_id = uuid4()
        self.sample_part_data = {
            "id": self.part_id,
            "category_id": 1,
            "parent_id": self.parent_id,
            "name": "シテ",
            "code": "SHITE",
            "level": 1,
            "description": "主役パート",
            "requirements": {"experience_years": 5, "skill_level": "advanced"},
            "attributes": {"stage_position": "center", "costume": "special"},
            "is_active": True,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
    
    def test_create_part(self):
        """パート作成テスト"""
        from app.models.part import PartDefinition
        
        part = PartDefinition(**self.sample_part_data)
        
        assert part.id == self.part_id
        assert part.category_id == 1
        assert part.parent_id == self.parent_id
        assert part.name == "シテ"
        assert part.code == "SHITE"
        assert part.level == 1
        assert part.is_active is True
        assert isinstance(part.requirements, dict)
    
    def test_has_requirement(self):
        """要件確認テスト"""
        from app.models.part import PartDefinition
        
        part = PartDefinition(**self.sample_part_data)
        
        assert part.has_requirement("experience_years") is True
        assert part.has_requirement("nonexistent") is False
    
    def test_is_sub_part_of(self):
        """下位パート確認テスト"""
        from app.models.part import PartDefinition
        
        part = PartDefinition(**self.sample_part_data)
        
        assert part.is_sub_part_of(self.parent_id) is True
        assert part.is_sub_part_of(uuid4()) is False


class TestMemberAssignmentModel:
    """メンバー所属モデルのテストクラス"""
    
    def setup_method(self):
        """テスト準備"""
        self.assignment_id = uuid4()
        self.user_id = uuid4()
        self.part_id = uuid4()
        self.sample_assignment_data = {
            "id": self.assignment_id,
            "user_id": self.user_id,
            "part_id": self.part_id,
            "is_primary": True,
            "skill_level": 3,
            "experience_points": 150,
            "assigned_date": date(2024, 1, 1),
            "end_date": None,
            "status": "active",
            "attributes": {"notes": "主担当として配属"},
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
    
    def test_create_assignment(self):
        """所属作成テスト"""
        from app.models.part import MemberAssignment
        
        assignment = MemberAssignment(**self.sample_assignment_data)
        
        assert assignment.id == self.assignment_id
        assert assignment.user_id == self.user_id
        assert assignment.part_id == self.part_id
        assert assignment.is_primary is True
        assert assignment.skill_level == 3
        assert assignment.experience_points == 150
        assert assignment.status == "active"
        assert assignment.end_date is None
    
    def test_is_active(self):
        """有効所属確認テスト"""
        from app.models.part import MemberAssignment
        
        assignment = MemberAssignment(**self.sample_assignment_data)
        
        # 終了日がない場合は有効
        assert assignment.is_active() is True
        
        # 終了日が過去の場合は無効
        assignment.end_date = date(2023, 12, 31)
        assert assignment.is_active() is False
        
        # 終了日が未来の場合は有効
        assignment.end_date = date(2025, 12, 31)
        assert assignment.is_active() is True
    
    def test_duration_days(self):
        """所属期間計算テスト"""
        from app.models.part import MemberAssignment
        
        assignment = MemberAssignment(**self.sample_assignment_data)
        
        # 終了日がない場合はNoneを返す
        assert assignment.duration_days() is None
        
        # 終了日がある場合は日数を計算
        assignment.end_date = date(2024, 1, 31)
        assert assignment.duration_days() == 30


class TestAssignmentHistoryModel:
    """所属履歴モデルのテストクラス"""
    
    def setup_method(self):
        """テスト準備"""
        self.history_id = uuid4()
        self.assignment_id = uuid4()
        self.modified_by = uuid4()
        self.sample_history_data = {
            "id": self.history_id,
            "assignment_id": self.assignment_id,
            "action_type": "update",
            "previous_state": {"skill_level": 2, "status": "active"},
            "new_state": {"skill_level": 3, "status": "active"},
            "action_date": datetime.now(),
            "reason": "スキルレベル向上",
            "modified_by": self.modified_by
        }
    
    def test_create_history(self):
        """履歴作成テスト"""
        from app.models.part import AssignmentHistory
        
        history = AssignmentHistory(**self.sample_history_data)
        
        assert history.id == self.history_id
        assert history.assignment_id == self.assignment_id
        assert history.action_type == "update"
        assert history.reason == "スキルレベル向上"
        assert history.modified_by == self.modified_by
    
    def test_get_changes(self):
        """変更内容取得テスト"""
        from app.models.part import AssignmentHistory
        
        history = AssignmentHistory(**self.sample_history_data)
        changes = history.get_changes()
        
        assert isinstance(changes, dict)
        assert "skill_level" in changes
        assert changes["skill_level"] == (2, 3)
        # statusは変更されていないので含まれない
        assert "status" not in changes