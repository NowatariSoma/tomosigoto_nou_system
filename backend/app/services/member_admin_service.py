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

        # user_roleテーブルから管理者を取得
        admin_roles = await self.user_role_repository.get_roles_by_type("admin")
        admin_user_ids = {role["user_id"] for role in admin_roles if role.get("user_id")}
        
        # user_rolesテーブルからis_instructorフラグを取得
        user_roles_with_instructor = await self.user_role_repository.get_user_roles_with_instructor()
        instructor_map = {
            role["user_id"]: role.get("is_instructor", False)
            for role in user_roles_with_instructor
            if role.get("user_id")
        }

        return [
            self._serialize_member(
                user,
                profile_map.get(user["id"]),
                user["id"] in admin_user_ids,
                instructor_map.get(user["id"], False)
            )
            for user in users
        ]

    async def get_member(self, user_id: str) -> Dict[str, Any]:
        """単一メンバーの情報を取得"""
        user = await self.user_service.get_user_by_id(user_id)
        if not user:
            raise APIException(ErrorMessage.USER_NOT_FOUND)

        profile = await self.user_profile_repository.get_profile_by_user_id(user_id)
        admin_role = await self.user_role_repository.get_role_by_user_and_type(user_id, "admin")
        is_instructor = await self.user_role_repository.get_instructor_flag(user_id)
        return self._serialize_member(user, profile, admin_role is not None, is_instructor)

    async def update_member_role(self, user_id: str, role: str) -> Dict[str, Any]:
        """管理者権限の付与/剥奪（user_roleテーブルで）"""
        await self.user_service.get_user_by_id(user_id)  # ensure user exists

        # user_roleテーブルでrole_typeを更新
        existing_role = await self.user_role_repository.get_role_by_user_id(user_id)
        if role == "admin":
            if not existing_role:
                await self.user_role_repository.create_role({
                    "user_id": user_id,
                    "role_type": "admin",
                })
            elif existing_role.get("role_type") != "admin":
                await self.user_role_repository.update_role(user_id, {"role_type": "admin"})
        else:
            # basicまたはviewerに変更
            if not existing_role:
                await self.user_role_repository.create_role({
                    "user_id": user_id,
                    "role_type": "user",  # デフォルトはuser
                })
            elif existing_role.get("role_type") == "admin":
                await self.user_role_repository.update_role(user_id, {"role_type": "user"})

        return await self.get_member(user_id)

    async def update_instructor_flag(self, user_id: str, is_instructor: bool) -> Dict[str, Any]:
        """指導者フラグの更新（user_rolesテーブルで）"""
        await self.user_service.get_user_by_id(user_id)  # ensure user exists
        await self.user_role_repository.update_instructor_flag(user_id, is_instructor)
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
        is_instructor: bool = False,
    ) -> Dict[str, Any]:
        display_name = self._build_display_name(profile, user)
        return {
            "id": user["id"],
            "email": user.get("email"),
            "name": display_name,
            "role": "admin" if is_admin else "basic",
            "is_instructor": is_instructor,
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

