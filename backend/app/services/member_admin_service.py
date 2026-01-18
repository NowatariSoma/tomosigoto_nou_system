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

        # user_rolesテーブルからロール & is_instructorを取得
        user_roles_with_instructor = await self.user_role_repository.get_user_roles_with_instructor()
        role_map: Dict[str, str] = {}
        instructor_map: Dict[str, bool] = {}
        for record in user_roles_with_instructor:
            user_id = record.get("user_id")
            if not user_id:
                continue
            role_map[user_id] = self._normalize_role_type(record.get("role_type"))
            instructor_map[user_id] = bool(record.get("is_instructor")) if record.get("is_instructor") is not None else False

        return [
            self._serialize_member(
                user,
                profile_map.get(user["id"]),
                role_map.get(user["id"], "basic"),
                bool(instructor_map.get(user["id"], False))
            )
            for user in users
        ]

    async def get_member(self, user_id: str) -> Dict[str, Any]:
        """単一メンバーの情報を取得"""
        user = await self.user_service.get_user_by_id(user_id)
        if not user:
            raise APIException(ErrorMessage.USER_NOT_FOUND)

        profile = await self.user_profile_repository.get_profile_by_user_id(user_id)
        role_record = await self.user_role_repository.get_role_by_user_id(user_id)
        normalized_role = self._normalize_role_type(role_record.get("role_type") if role_record else None)
        is_instructor = await self.user_role_repository.get_instructor_flag(user_id)
        return self._serialize_member(
            user,
            profile,
            normalized_role,
            bool(is_instructor) if is_instructor is not None else False,
        )

    async def update_member_role(self, user_id: str, role: str) -> Dict[str, Any]:
        """管理者権限の付与/剥奪（user_roleテーブルで）"""
        await self.user_service.get_user_by_id(user_id)  # ensure user exists

        role_type_value = self._to_role_type_value(role)

        existing_role = await self.user_role_repository.get_role_by_user_id(user_id)
        if existing_role:
            await self.user_role_repository.update_role(user_id, {"role_type": role_type_value})
        else:
            await self.user_role_repository.create_role({
                "user_id": user_id,
                "role_type": role_type_value,
            })

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
        role: str,
        is_instructor: bool = False,
    ) -> Dict[str, Any]:
        display_name = self._build_display_name(profile, user)
        return {
            "id": user["id"],
            "email": user.get("email"),
            "name": display_name,
            "role": role,
            "is_instructor": is_instructor,
            "last_active_at": user.get("last_sign_in_at"),
        }

    def _normalize_role_type(self, role_type: Optional[str]) -> str:
        if role_type == "admin":
            return "admin"
        if role_type == "viewer":
            return "viewer"
        return "basic"

    def _to_role_type_value(self, role: str) -> str:
        if role == "admin":
            return "admin"
        if role == "viewer":
            return "viewer"
        return "basic"

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

