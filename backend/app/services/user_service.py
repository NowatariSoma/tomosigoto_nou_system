from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, status

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.protocols import UserRepositoryProtocol

logger = logging.getLogger(__name__)


class UserService:
    """ユーザー関連のビジネスロジックを処理するサービスクラス"""

    def __init__(self, user_repository: UserRepositoryProtocol) -> None:
        self.repository = user_repository

    def get_all_users(self) -> list[dict[str, Any]]:
        return self.repository.get_all_users()

    def get_user_by_id(self, user_id: str) -> dict[str, Any] | None:
        user = self.repository.get_user_by_id(user_id)
        if not user:
            raise APIException(ErrorMessage.USER_NOT_FOUND)
        return user

    def create_user(self, user_data: dict[str, Any]) -> dict[str, Any]:
        existing_user = self.repository.get_user_by_email(user_data["email"])
        if existing_user:
            raise APIException(ErrorMessage.USER_ALREADY_EXISTS)

        password = user_data.get("password", "")
        if len(password) < 6:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Password does not meet requirements",
            )

        return self.repository.create_user(user_data)

    def delete_user(self, user_id: str) -> bool:
        user = self.repository.get_user_by_id(user_id)
        if not user:
            raise APIException(ErrorMessage.USER_NOT_FOUND)
        self.repository.delete_user(user_id)
        logger.info(f"User deleted: {user_id}")
        return True

    def update_user(self, user_id: str, user_data: dict[str, Any]) -> dict[str, Any] | None:
        existing_user = self.repository.get_user_by_id(user_id)
        if not existing_user:
            raise APIException(ErrorMessage.USER_NOT_FOUND)

        update_data = {k: v for k, v in user_data.items() if k in ("email", "name")}
        if not update_data:
            return existing_user

        updated_user = self.repository.update_user(user_id, update_data)
        logger.info(f"User updated: {user_id}")
        return updated_user
