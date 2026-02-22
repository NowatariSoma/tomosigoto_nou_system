from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.protocols import (
    MemberAssignmentRepositoryProtocol,
    PartRepositoryProtocol,
    UserRepositoryProtocol,
)

logger = logging.getLogger(__name__)


class MemberAssignmentService:
    """
    メンバー所属関連のビジネスロジックを処理するサービスクラス
    リポジトリパターンと依存性注入に対応
    """

    def __init__(
        self,
        member_assignment_repository: MemberAssignmentRepositoryProtocol,
        part_repository: PartRepositoryProtocol,
        user_repository: UserRepositoryProtocol,
        auth_client
    ):
        """
        Args:
            member_assignment_repository: MemberAssignmentRepositoryProtocolインスタンス
            part_repository: PartRepositoryProtocolインスタンス
            user_repository: UserRepositoryProtocolインスタンス
            auth_client: Supabase認証クライアント
        """
        self.repository = member_assignment_repository
        self.part_repository = part_repository
        self.user_repository = user_repository
        self.auth_client = auth_client

    async def get_all_assignments(self) -> list[dict[str, Any]]:
        """すべてのメンバー所属を取得"""
        return await self.repository.find_all()

    async def get_assignment_by_id(self, assignment_id: UUID) -> dict[str, Any]:
        """IDでメンバー所属を取得"""
        assignment = await self.repository.find_by_id(assignment_id)
        if not assignment:
            raise APIException(ErrorMessage.MEMBER_ASSIGNMENT_NOT_FOUND)
        return assignment

    async def get_assignments_by_part(self, part_id: UUID) -> list[dict[str, Any]]:
        """パートIDでメンバー所属を取得"""
        # パートの存在確認
        part = await self.part_repository.find_by_id(part_id)
        if not part:
            raise APIException(ErrorMessage.PART_NOT_FOUND)
        
        return await self.repository.find_by_part_id(part_id)

    async def get_assignments_by_user(self, user_id: str) -> list[dict[str, Any]]:
        """ユーザーIDでメンバー所属を取得"""
        # ユーザーの存在確認
        user = await self.user_repository.find_by_id(user_id)
        if not user:
            raise APIException(ErrorMessage.USER_NOT_FOUND)
        
        return await self.repository.find_by_user_id(UUID(user_id))

    async def get_assignments_with_details(
        self, 
        assignment_id: UUID | None = None,
        part_id: UUID | None = None,
        user_id: str | None = None
    ) -> list[dict[str, Any]]:
        """詳細情報付きでメンバー所属を取得"""
        user_uuid = UUID(user_id) if user_id else None
        return await self.repository.find_with_details(assignment_id, part_id, user_uuid)

    async def create_assignment(self, assignment_data: dict[str, Any]) -> dict[str, Any]:
        """メンバー所属を作成"""
        # ユーザーの存在確認
        if "user_id" in assignment_data:
            user = await self.user_repository.find_by_id(assignment_data["user_id"])
            if not user:
                raise APIException(ErrorMessage.USER_NOT_FOUND)

        # パートの存在確認
        if "part_id" in assignment_data:
            try:
                part_id = UUID(assignment_data["part_id"])
                part = await self.part_repository.find_by_id(part_id)
                if not part:
                    raise APIException(ErrorMessage.PART_NOT_FOUND)
            except ValueError:
                raise APIException(ErrorMessage.BAD_REQUEST)

        # 重複チェック
        if "user_id" in assignment_data and "part_id" in assignment_data:
            user_uuid = UUID(assignment_data["user_id"])
            part_uuid = UUID(assignment_data["part_id"])
            existing_assignment = await self.repository.find_by_user_and_part(user_uuid, part_uuid)
            if existing_assignment:
                raise APIException(ErrorMessage.MEMBER_ASSIGNMENT_ALREADY_EXISTS)

        # カテゴリの検証
        if "category" in assignment_data:
            if assignment_data["category"] not in ["utai", "mai"]:
                raise APIException(ErrorMessage.INVALID_CATEGORY)

        # リポジトリを通してDBに保存
        created_assignment = await self.repository.create(assignment_data)
        logger.info(f"Member assignment created successfully: user_id={assignment_data.get('user_id', 'unknown')}, part_id={assignment_data.get('part_id', 'unknown')}")
        return created_assignment

    async def update_assignment(
        self, assignment_id: UUID, assignment_data: dict[str, Any]
    ) -> dict[str, Any]:
        """メンバー所属情報を更新"""
        # メンバー所属の存在確認
        existing_assignment = await self.repository.find_by_id(assignment_id)
        if not existing_assignment:
            raise APIException(ErrorMessage.MEMBER_ASSIGNMENT_NOT_FOUND)

        # 更新データを準備（None値を除外）
        update_data = {k: v for k, v in assignment_data.items() if v is not None}
        
        if not update_data:
            return existing_assignment

        # カテゴリの検証
        if "category" in update_data:
            if update_data["category"] not in ["utai", "mai"]:
                raise APIException(ErrorMessage.INVALID_CATEGORY)

        # リポジトリを通して更新
        updated_assignment = await self.repository.update(assignment_id, update_data)
        if not updated_assignment:
            raise APIException(ErrorMessage.MEMBER_ASSIGNMENT_NOT_FOUND)
            
        logger.info(f"Member assignment updated successfully: {assignment_id}")
        return updated_assignment

    async def remove_assignment(self, assignment_id: UUID) -> bool:
        """メンバー所属を削除"""
        # メンバー所属の存在確認
        assignment = await self.repository.find_by_id(assignment_id)
        if not assignment:
            raise APIException(ErrorMessage.MEMBER_ASSIGNMENT_NOT_FOUND)

        # リポジトリを通してDBから削除
        await self.repository.delete(assignment_id)
        logger.info(f"Member assignment deleted successfully: {assignment_id}")
        return True

    async def remove_assignment_by_user_and_part(self, user_id: str, part_id: UUID) -> bool:
        """ユーザーIDとパートIDでメンバー所属を削除"""
        # ユーザーの存在確認
        user = await self.user_repository.find_by_id(user_id)
        if not user:
            raise APIException(ErrorMessage.USER_NOT_FOUND)

        # パートの存在確認
        part = await self.part_repository.find_by_id(part_id)
        if not part:
            raise APIException(ErrorMessage.PART_NOT_FOUND)

        # メンバー所属の存在確認
        user_uuid = UUID(user_id)
        existing_assignment = await self.repository.find_by_user_and_part(user_uuid, part_id)
        if not existing_assignment:
            raise APIException(ErrorMessage.MEMBER_ASSIGNMENT_NOT_FOUND)

        # リポジトリを通してDBから削除
        await self.repository.delete_by_user_and_part(user_uuid, part_id)
        logger.info(f"Member assignment deleted successfully: user_id={user_id}, part_id={part_id}")
        return True

    async def get_assignment_count(self) -> int:
        """メンバー所属数を取得"""
        return await self.repository.count()

    async def bulk_assign_to_part(self, part_id: UUID, user_assignments: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """パートに複数のユーザーを一括所属させる"""
        # パートの存在確認
        part = await self.part_repository.find_by_id(part_id)
        if not part:
            raise APIException(ErrorMessage.PART_NOT_FOUND)

        results = []
        for user_assignment in user_assignments:
            try:
                # パートIDを設定
                assignment_data = user_assignment.copy()
                assignment_data["part_id"] = str(part_id)
                
                # 個別に作成
                created_assignment = await self.create_assignment(assignment_data)
                results.append(created_assignment)
            except APIException as e:
                # エラーが発生した場合はログに記録して続行
                logger.warning(f"Failed to assign user to part {part_id}: {e}")
                continue

        logger.info(f"Bulk assignment completed: {len(results)} assignments created for part {part_id}")
        return results
