from __future__ import annotations

import logging
from typing import Any

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.user_repository import UserRepository
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


class UserService:
    """
    ユーザー関連のビジネスロジックを処理するサービスクラス
    リポジトリパターンと依存性注入に対応
    """

    def __init__(self, user_repository: UserRepository, auth_client) -> None:
        """
        Args:
            user_repository: UserRepositoryインスタンス
            auth_client: Supabase認証クライアント
        """
        self.repository = user_repository
        self.auth_client = auth_client

    async def get_all_users(self) -> list[dict[str, Any]]:
        """すべてのユーザーを取得"""
        return await self.repository.get_all_users()

    async def get_user_by_id(self, user_id: str) -> dict[str, Any] | None:
        """IDでユーザーを取得"""
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise APIException(ErrorMessage.USER_NOT_FOUND)
        return user

    async def verify_jwt_token(self, token: str) -> dict[str, Any] | None:
        """JWTトークンを検証"""
        try:
            response = self.auth_client.get_user(token)

            if hasattr(response, "user") and response.user:
                return response.user.dict()
            else:
                return None

        except Exception as e:
            logger.error(f"Error verifying token: {str(e)}")
            return None

    async def create_user(self, user_data: dict[str, Any]) -> dict[str, Any]:
        """ユーザーを作成（認証とDB両方）"""
        logger.info(f"Creating user with email: {user_data['email']}")

        # 既存ユーザーチェック（メールアドレスベース）
        existing_user = await self.repository.get_user_by_email(user_data["email"])
        if existing_user:
            logger.warning(f"User already exists in DB: {user_data['email']}")
            raise APIException(ErrorMessage.USER_ALREADY_EXISTS)

        # パスワード強度チェック
        password = user_data.get("password", "")
        if len(password) < 6:
            logger.warning(f"Password too weak for user: {user_data['email']}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Password does not meet requirements",
            )

        # Supabase Authでユーザーを作成
        logger.info(f"Creating user in Supabase Auth: {user_data['email']}")
        auth_response = self.auth_client.admin.create_user(
            {
                "email": user_data["email"],
                "password": user_data["password"],
                "email_confirm": True,  # メール確認を自動で有効にする
            }
        )
        logger.info(
            f"Supabase Auth user created with ID: {auth_response.user.id if auth_response.user else 'None'}"
        )

        if not auth_response.user:
            raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)

        # DBに保存するユーザー情報
        user_record = {
            "id": auth_response.user.id,
            "email": user_data["email"],
            "name": user_data.get("name", None),
            "created_at": (
                auth_response.user.created_at.isoformat()
                if auth_response.user.created_at
                else None
            ),
            "updated_at": (
                auth_response.user.updated_at.isoformat()
                if auth_response.user.updated_at
                else None
            ),
        }

        # リポジトリを通してDBに保存
        logger.info(f"Saving user to DB: {user_record}")
        created_user = await self.repository.create_user(user_record)
        logger.info(f"User created successfully: {user_data['email']}")
        return created_user

    async def delete_user(self, user_id: str) -> bool:
        """ユーザーを削除（DBと認証両方から）"""
        # ユーザーの存在確認
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise APIException(ErrorMessage.USER_NOT_FOUND)

        # まずDBから削除
        await self.repository.delete_user(user_id)

        # 次にSupabase Authからも削除
        try:
            self.auth_client.admin.delete_user(user_id)
        except Exception as e:
            logger.error(f"Failed to delete user from auth: {str(e)}")
            # DBから削除済みなので、エラーは警告のみ

        logger.info(f"User deleted successfully: {user_id}")
        return True

    async def update_user(
        self, user_id: str, user_data: dict[str, Any]
    ) -> dict[str, Any] | None:
        """ユーザー情報を更新"""
        # ユーザーの存在確認
        existing_user = await self.repository.get_user_by_id(user_id)
        if not existing_user:
            raise APIException(ErrorMessage.USER_NOT_FOUND)

        # 更新データを準備
        update_data = {}
        if "email" in user_data:
            update_data["email"] = user_data["email"]
        if "name" in user_data:
            update_data["name"] = user_data["name"]

        if not update_data:
            return existing_user

        # リポジトリを通して更新
        updated_user = await self.repository.update_user(user_id, update_data)
        logger.info(f"User updated successfully: {user_id}")
        return updated_user
