"""
メンバー所属管理のビジネスロジック実装
BACK-DB-001.2: パート区分・メンバー所属テーブル設計
"""
import logging
from typing import List, Dict, Any, Tuple
from uuid import UUID
from datetime import date, datetime

from app.repositories.member_assignment_repository import MemberAssignmentRepository
from app.repositories.part_repository import PartRepository
from app.schemas.part_schemas import (
    AssignmentCreate, AssignmentResponse
)


logger = logging.getLogger(__name__)


class AssignmentService:
    """メンバー所属管理のビジネスロジックを実装するサービス"""
    
    def __init__(
        self,
        assignment_repository: MemberAssignmentRepository,
        part_repository: PartRepository,
        user_service
    ):
        """
        サービスの初期化
        
        Args:
            assignment_repository: 所属リポジトリ
            part_repository: パートリポジトリ
            user_service: ユーザーサービス
        """
        self._assignment_repository = assignment_repository
        self._part_repository = part_repository
        self._user_service = user_service
        self._logger = logger
    
    def _create_assignment_response(self, assignment, part_name: str = None) -> AssignmentResponse:
        """MemberAssignmentからAssignmentResponseを作成"""
        # パート名を取得（キャッシュされていない場合）
        if not part_name:
            # 実際にはキャッシュ機能やJOINクエリを使用すべき
            part_name = f"Part-{assignment.part_id}"
        
        return AssignmentResponse(
            id=assignment.id,
            user_id=assignment.user_id,
            part_id=assignment.part_id,
            part_name=part_name,
            is_primary=assignment.is_primary,
            skill_level=assignment.skill_level,
            experience_points=assignment.experience_points,
            assigned_date=assignment.assigned_date,
            end_date=assignment.end_date,
            status=assignment.status,
            created_at=assignment.created_at
        )
    
    async def get_user_assignments(self, user_id: UUID) -> List[AssignmentResponse]:
        """ユーザーの所属取得"""
        assignments = await self._assignment_repository.get_user_assignments(user_id)
        
        # パート名を取得してレスポンスを作成
        responses = []
        for assignment in assignments:
            part = await self._part_repository.get_part(assignment.part_id)
            part_name = part.name if part else f"Unknown-{assignment.part_id}"
            responses.append(self._create_assignment_response(assignment, part_name))
        
        return responses
    
    async def get_active_assignments(self, user_id: UUID) -> List[AssignmentResponse]:
        """有効な所属取得"""
        assignments = await self._assignment_repository.get_active_assignments(user_id)
        
        # パート名を取得してレスポンスを作成
        responses = []
        for assignment in assignments:
            part = await self._part_repository.get_part(assignment.part_id)
            part_name = part.name if part else f"Unknown-{assignment.part_id}"
            responses.append(self._create_assignment_response(assignment, part_name))
        
        return responses
    
    async def assign_member(self, assignment_data: AssignmentCreate, created_by: UUID) -> AssignmentResponse:
        """メンバー所属登録"""
        # バリデーション
        is_valid, errors = await self.validate_assignment(assignment_data.user_id, assignment_data.part_id)
        if not is_valid:
            raise ValueError(f"Assignment validation failed: {', '.join(errors)}")
        
        # 主担当チェック
        if assignment_data.is_primary:
            existing_primary = await self._assignment_repository.get_part_members(assignment_data.part_id)
            for member in existing_primary:
                if member.is_primary and member.status == 'active':
                    raise ValueError(f"Part {assignment_data.part_id} already has a primary assignment")
        
        # データ準備
        create_data = {
            "user_id": assignment_data.user_id,
            "part_id": assignment_data.part_id,
            "is_primary": assignment_data.is_primary,
            "skill_level": assignment_data.skill_level,
            "assigned_date": assignment_data.assigned_date,
            "attributes": assignment_data.attributes or {}
        }
        
        assignment = await self._assignment_repository.create_assignment(create_data)
        
        # 履歴記録
        await self._assignment_repository.record_history(
            assignment_id=assignment.id,
            action_type="create",
            previous={},
            new=assignment.to_dict(),
            reason="新規所属登録",
            modified_by=created_by
        )
        
        # レスポンス作成
        part = await self._part_repository.get_part(assignment.part_id)
        part_name = part.name if part else f"Unknown-{assignment.part_id}"
        
        return self._create_assignment_response(assignment, part_name)
    
    async def update_assignment(self, assignment_id: UUID, data: dict, modified_by: UUID) -> AssignmentResponse:
        """所属更新"""
        # 既存データ取得
        existing_assignment = await self._assignment_repository.get_assignment(assignment_id)
        if not existing_assignment:
            raise ValueError(f"Assignment with id {assignment_id} not found")
        
        # 主担当変更チェック
        if "is_primary" in data and data["is_primary"] and not existing_assignment.is_primary:
            existing_primary = await self._assignment_repository.get_part_members(existing_assignment.part_id)
            for member in existing_primary:
                if member.is_primary and member.status == 'active' and member.id != assignment_id:
                    raise ValueError(f"Part {existing_assignment.part_id} already has a primary assignment")
        
        # 変更前状態を記録
        previous_state = existing_assignment.to_dict()
        
        # 更新実行
        updated_assignment = await self._assignment_repository.update_assignment(assignment_id, data)
        
        # 履歴記録
        await self._assignment_repository.record_history(
            assignment_id=assignment_id,
            action_type="update",
            previous=previous_state,
            new=updated_assignment.to_dict(),
            reason="所属情報更新",
            modified_by=modified_by
        )
        
        # レスポンス作成
        part = await self._part_repository.get_part(updated_assignment.part_id)
        part_name = part.name if part else f"Unknown-{updated_assignment.part_id}"
        
        return self._create_assignment_response(updated_assignment, part_name)
    
    async def end_assignment(self, assignment_id: UUID, end_date: date, reason: str, modified_by: UUID) -> AssignmentResponse:
        """所属終了"""
        # 既存データ取得
        existing_assignment = await self._assignment_repository.get_assignment(assignment_id)
        if not existing_assignment:
            raise ValueError(f"Assignment with id {assignment_id} not found")
        
        if existing_assignment.status != 'active':
            raise ValueError(f"Assignment {assignment_id} is not active")
        
        # 変更前状態を記録
        previous_state = existing_assignment.to_dict()
        
        # 終了処理
        ended_assignment = await self._assignment_repository.end_assignment(assignment_id, end_date, reason)
        
        # 履歴記録
        await self._assignment_repository.record_history(
            assignment_id=assignment_id,
            action_type="end",
            previous=previous_state,
            new=ended_assignment.to_dict(),
            reason=reason or "所属終了",
            modified_by=modified_by
        )
        
        # レスポンス作成
        part = await self._part_repository.get_part(ended_assignment.part_id)
        part_name = part.name if part else f"Unknown-{ended_assignment.part_id}"
        
        return self._create_assignment_response(ended_assignment, part_name)
    
    async def get_part_members(self, part_id: UUID) -> List[AssignmentResponse]:
        """パートのメンバー取得"""
        # パート存在チェック
        part = await self._part_repository.get_part(part_id)
        if not part:
            raise ValueError(f"Part with id {part_id} not found")
        
        assignments = await self._assignment_repository.get_part_members(part_id)
        
        # レスポンス作成
        responses = []
        for assignment in assignments:
            responses.append(self._create_assignment_response(assignment, part.name))
        
        return responses
    
    async def get_assignment_history(self, assignment_id: UUID) -> List[Dict]:
        """所属履歴取得"""
        # 所属存在チェック
        assignment = await self._assignment_repository.get_assignment(assignment_id)
        if not assignment:
            raise ValueError(f"Assignment with id {assignment_id} not found")
        
        history = await self._assignment_repository.get_assignment_history(assignment_id)
        
        # 辞書形式で返す
        return [hist.to_dict() for hist in history]
    
    async def add_experience_points(self, assignment_id: UUID, points: int, reason: str, modified_by: UUID) -> AssignmentResponse:
        """経験値追加"""
        # 既存データ取得
        existing_assignment = await self._assignment_repository.get_assignment(assignment_id)
        if not existing_assignment:
            raise ValueError(f"Assignment with id {assignment_id} not found")
        
        if existing_assignment.status != 'active':
            raise ValueError(f"Assignment {assignment_id} is not active")
        
        # 変更前状態を記録
        previous_state = existing_assignment.to_dict()
        
        # 経験値更新
        new_experience_points = existing_assignment.experience_points + points
        update_data = {"experience_points": new_experience_points}
        
        updated_assignment = await self._assignment_repository.update_assignment(assignment_id, update_data)
        
        # 履歴記録
        await self._assignment_repository.record_history(
            assignment_id=assignment_id,
            action_type="experience_add",
            previous=previous_state,
            new=updated_assignment.to_dict(),
            reason=reason,
            modified_by=modified_by
        )
        
        # レスポンス作成
        part = await self._part_repository.get_part(updated_assignment.part_id)
        part_name = part.name if part else f"Unknown-{updated_assignment.part_id}"
        
        return self._create_assignment_response(updated_assignment, part_name)
    
    async def transfer_member(self, user_id: UUID, from_part_id: UUID, to_part_id: UUID, reason: str, modified_by: UUID) -> AssignmentResponse:
        """メンバー移動"""
        # 既存の所属を取得
        user_assignments = await self._assignment_repository.get_user_assignments(user_id)
        from_assignment = None
        
        for assignment in user_assignments:
            if assignment.part_id == from_part_id and assignment.status == 'active':
                from_assignment = assignment
                break
        
        if not from_assignment:
            raise ValueError(f"Active assignment from part {from_part_id} not found for user {user_id}")
        
        # 移動先パートの妥当性チェック
        is_valid, errors = await self.validate_assignment(user_id, to_part_id)
        if not is_valid:
            raise ValueError(f"Transfer validation failed: {', '.join(errors)}")
        
        # 既存の所属を終了
        await self.end_assignment(from_assignment.id, date.today(), f"転属: {reason}", modified_by)
        
        # 新しい所属を作成
        new_assignment_data = AssignmentCreate(
            user_id=user_id,
            part_id=to_part_id,
            is_primary=from_assignment.is_primary,  # 主担当ステータスを引き継ぎ
            skill_level=1,  # 新しいパートではスキルレベルは1からスタート
            assigned_date=date.today(),
            attributes={"transferred_from": str(from_part_id), "reason": reason}
        )
        
        new_assignment_response = await self.assign_member(new_assignment_data, modified_by)
        return new_assignment_response
    
    async def validate_assignment(self, user_id: UUID, part_id: UUID) -> Tuple[bool, List[str]]:
        """所属可能性の検証"""
        errors = []
        
        # ユーザー存在チェック
        try:
            user = await self._user_service.get_user(user_id)
            if not user:
                errors.append(f"User {user_id} not found")
        except Exception:
            errors.append(f"User {user_id} not found")
        
        # パート存在チェック
        part = await self._part_repository.get_part(part_id)
        if not part:
            errors.append(f"Part {part_id} not found")
        elif not part.is_active:
            errors.append(f"Part {part_id} is not active")
        
        # 重複所属チェック（同じパートに既に所属していないか）
        if not errors:  # 前のチェックが通った場合のみ
            user_assignments = await self._assignment_repository.get_user_assignments(user_id)
            for assignment in user_assignments:
                if assignment.part_id == part_id and assignment.status == 'active':
                    errors.append(f"User {user_id} is already assigned to part {part_id}")
                    break
        
        # 要件チェック（パートに要件がある場合）
        if part and part.requirements:
            # 実際の実装では、ユーザーの経験年数やスキルレベルをチェック
            # ここでは簡単な例として、経験年数要件のみをチェック
            if "experience_years" in part.requirements:
                required_years = part.requirements["experience_years"]
                # ユーザーの経験年数を取得（実装省略）
                # user_experience_years = await self.get_user_experience_years(user_id)
                # if user_experience_years < required_years:
                #     errors.append(f"User requires {required_years} years of experience for this part")
        
        return len(errors) == 0, errors