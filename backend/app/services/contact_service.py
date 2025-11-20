import logging
from typing import Any, Dict, Optional

import httpx

from app.core.config import settings
from app.core.exceptions import APIException
from app.repositories.contact_repository import ContactRepository
from app.repositories.user_profile_repository import UserProfileRepository

logger = logging.getLogger(__name__)


class ContactService:
    """お問い合わせについての機能を実装するクラス"""

    def __init__(
        self,
        contact_repository: ContactRepository,
        user_profile_repository: UserProfileRepository,
    ):
        self.repository = contact_repository
        self.user_profile_repository = user_profile_repository

    async def _get_user_name(self, user_id: str) -> str:
        """ユーザーIDからユーザー名を取得"""
        try:
            profile = await self.user_profile_repository.get_profile_by_user_id(user_id)
            if profile:
                first_name = profile.get("first_name_kanji", "")
                last_name = profile.get("last_name_kanji", "")
                if first_name and last_name:
                    return f"{last_name} {first_name}"
                elif first_name:
                    return first_name
                elif last_name:
                    return last_name
        except Exception as e:
            logger.warning(f"ユーザープロフィールの取得に失敗しました: {str(e)}")
        
        # プロフィールが見つからない場合はデフォルト値を返す
        return "不明"

    async def create_contact(self, contact_data: Dict[str, Any]) -> Dict[str, Any]:
        """お問い合わせを作成し、Discordに通知を送信"""
        # user_idからユーザー名を取得して自動設定
        user_id = contact_data.get("user_id")
        if user_id:
            # UUID型の場合は文字列に変換
            user_id_str = str(user_id) if user_id else ""
            if user_id_str:
                user_name = await self._get_user_name(user_id_str)
                contact_data["name"] = user_name
        
        # データベースに保存
        contact = await self.repository.create(contact_data)

        # Discord通知を送信（失敗してもDB保存は成功させる）
        try:
            await self._send_discord_notification(contact)
        except Exception as e:
            logger.error(f"Discord通知の送信に失敗しました: {str(e)}")
            # エラーをログに記録するが、例外は投げない（DB保存は成功しているため）

        return contact

    async def _send_discord_notification(self, contact: Dict[str, Any]) -> None:
        """Discord Webhookに通知を送信"""
        if not settings.DISCORD_WEBHOOK_URL:
            logger.warning("DISCORD_WEBHOOK_URLが設定されていません。通知をスキップします。")
            return

        # カテゴリの日本語名を取得
        category_map = {
            "bug": "バグ報告",
            "feature": "機能要望",
            "question": "質問",
            "other": "その他",
        }
        category_jp = category_map.get(contact.get("category", ""), "その他")

        # Discord Embed形式のメッセージを作成
        embed = {
            "title": "新しいお問い合わせが届きました",
            "color": 0x5865F2,  # Discordのブランドカラー
            "fields": [
                {
                    "name": "名前",
                    "value": contact.get("name", "不明"),
                    "inline": True,
                },
                {
                    "name": "カテゴリ",
                    "value": category_jp,
                    "inline": True,
                },
                {
                    "name": "内容",
                    "value": contact.get("content", "")[:1000],  # Discordの制限に合わせて1000文字まで
                    "inline": False,
                },
                {
                    "name": "問い合わせID",
                    "value": str(contact.get("id", "")),
                    "inline": True,
                },
            ],
            "timestamp": contact.get("created_at"),
        }

        payload = {
            "embeds": [embed],
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                settings.DISCORD_WEBHOOK_URL,
                json=payload,
                timeout=10.0,
            )
            response.raise_for_status()

    async def get_contact(self, contact_id: str) -> Dict[str, Any]:
        """指定したお問い合わせ情報を取得"""
        return await self.repository.find_by_id(contact_id)

    async def get_all_contacts(
        self, user_id: Optional[str] = None
    ) -> list[Dict[str, Any]]:
        """お問い合わせ一覧を取得（user_idが指定された場合はそのユーザーのみ）"""
        return await self.repository.find_all(user_id=user_id)

    async def update_contact(
        self, contact_id: str, contact_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """指定したお問い合わせ情報を更新"""
        return await self.repository.update(contact_id, contact_data)

    async def remove_contact(self, contact_id: str) -> bool:
        """指定したお問い合わせを削除"""
        contact = await self.repository.find_by_id(contact_id)

        if not contact:
            raise APIException("お問い合わせが見つかりませんでした")

        await self.repository.delete(contact_id)
        return True

