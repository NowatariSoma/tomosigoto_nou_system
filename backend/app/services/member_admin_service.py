from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.user_profile_repository import UserProfileRepository
from app.repositories.user_role_repository import UserRoleRepository
from app.services.user_service import UserService


class MemberAdminService:
    """メンバー管理（管理者用）のビジネスロジック"""

    def __init__(
        self,
        user_service: UserService,
        user_role_repository: UserRoleRepository,
        user_profile_repository: UserProfileRepository,
    ) -> None:
        self.user_service = user_service
        self.user_role_repository = user_role_repository
        self.user_profile_repository = user_profile_repository

    async def list_members(self) -> List[Dict[str, Any]]:
        """全メンバーの一覧を取得"""
        users = await self.user_service.get_all_users()
        if not users:
            return []

        user_ids = [user["id"] for user in users if user.get("id")]
        profiles = await self.user_profile_repository.get_profiles_by_user_ids(user_ids)
        profile_map = {profile["user_id"]: profile for profile in profiles}

        roles = await self.user_role_repository.get_all_roles(include_hidden=True)
        admin_user_ids = {
            role["user_id"]
            for role in roles
            if role.get("role_type") == "admin"
        }

        return [
            self._serialize_member(user, profile_map.get(user["id"]), user["id"] in admin_user_ids)
            for user in users
        ]

    async def get_member(self, user_id: str) -> Dict[str, Any]:
        """単一メンバーの情報を取得"""
        user = await self.user_service.get_user_by_id(user_id)
        if not user:
            raise APIException(ErrorMessage.USER_NOT_FOUND)

        profile = await self.user_profile_repository.get_profile_by_user_id(user_id)
        admin_role = await self.user_role_repository.get_role_by_user_and_type(user_id, "admin")
        return self._serialize_member(user, profile, admin_role is not None)

    async def update_member_role(self, user_id: str, role: str) -> Dict[str, Any]:
        """管理者権限の付与/剥奪"""
        await self.user_service.get_user_by_id(user_id)  # ensure user exists

        if role == "admin":
            existing_admin_role = await self.user_role_repository.get_role_by_user_and_type(user_id, "admin")
            if not existing_admin_role:
                await self.user_role_repository.create_role({
                    "user_id": user_id,
                    "role_type": "admin",
                    "is_visible_to_general": True,
                })
        else:
            await self.user_role_repository.delete_role_by_type(user_id, "admin")

        return await self.get_member(user_id)

    async def remove_member(self, user_id: str) -> None:
        """ユーザーアカウント削除（ロール情報も合わせて削除）"""
        await self.user_role_repository.delete_role(user_id)
        await self.user_service.delete_user(user_id)

    def _serialize_member(
        self,
        user: Dict[str, Any],
        profile: Optional[Dict[str, Any]],
        is_admin: bool,
    ) -> Dict[str, Any]:
        display_name = self._build_display_name(profile, user)
        return {
            "id": user["id"],
            "email": user.get("email"),
            "name": display_name,
            "role": "admin" if is_admin else "basic",
            "last_active_at": user.get("last_sign_in_at"),
        }

    def _build_display_name(
        self,
        profile: Optional[Dict[str, Any]],
        user: Dict[str, Any],
    ) -> str:
        if profile:
            last_name = profile.get("last_name_kanji") or ""
            first_name = profile.get("first_name_kanji") or ""
            full_name = f"{last_name}{first_name}".strip()
            if full_name:
                return full_name
        return user.get("email") or "不明なユーザー"

