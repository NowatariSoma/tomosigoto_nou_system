"""
ContactService のユニットテスト
"""
import pytest
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4

from app.services.contact_service import ContactService
from app.core.exceptions import APIException
from tests.helpers.factories import make_contact, make_user_profile


class TestContactService:
    """ContactService のテスト"""

    def setup_method(self):
        self.mock_repo = AsyncMock()
        self.mock_profile_repo = AsyncMock()
        self.service = ContactService(
            contact_repository=self.mock_repo,
            user_profile_repository=self.mock_profile_repo,
        )

    # ===== _get_user_name =====

    @pytest.mark.asyncio
    async def test_get_user_name_with_profile(self):
        """ユーザー名取得 - プロフィールあり"""
        profile = make_user_profile(
            first_name_kanji="太郎", last_name_kanji="田中"
        )
        self.mock_profile_repo.get_profile_by_user_id.return_value = profile

        result = await self.service._get_user_name(str(uuid4()))

        assert result == "田中 太郎"

    @pytest.mark.asyncio
    async def test_get_user_name_no_profile(self):
        """ユーザー名取得 - プロフィールなし"""
        self.mock_profile_repo.get_profile_by_user_id.return_value = None

        result = await self.service._get_user_name(str(uuid4()))

        assert result == "不明"

    @pytest.mark.asyncio
    async def test_get_user_name_error(self):
        """ユーザー名取得 - エラー時はデフォルト値"""
        self.mock_profile_repo.get_profile_by_user_id.side_effect = Exception("DB error")

        result = await self.service._get_user_name(str(uuid4()))

        assert result == "不明"

    # ===== create_contact =====

    @pytest.mark.asyncio
    async def test_create_contact_success(self):
        """お問い合わせ作成 - 正常（Discord通知成功）"""
        user_id = str(uuid4())
        contact_data = {
            "user_id": user_id,
            "category": "question",
            "content": "テスト問い合わせ",
        }
        created = make_contact(**contact_data)

        self.mock_profile_repo.get_profile_by_user_id.return_value = make_user_profile(
            first_name_kanji="太郎", last_name_kanji="テスト"
        )
        self.mock_repo.create.return_value = created

        with patch.object(self.service, "_send_discord_notification", new_callable=AsyncMock) as mock_discord:
            result = await self.service.create_contact(contact_data)

        assert result == created
        assert contact_data["name"] == "テスト 太郎"

    @pytest.mark.asyncio
    async def test_create_contact_discord_failure_still_saves(self):
        """お問い合わせ作成 - Discord通知失敗してもDB保存は成功"""
        contact_data = {
            "user_id": str(uuid4()),
            "category": "bug",
            "content": "バグ報告",
        }
        created = make_contact(**contact_data)

        self.mock_profile_repo.get_profile_by_user_id.return_value = None
        self.mock_repo.create.return_value = created

        with patch.object(
            self.service,
            "_send_discord_notification",
            new_callable=AsyncMock,
            side_effect=Exception("Discord error"),
        ):
            result = await self.service.create_contact(contact_data)

        assert result == created
        self.mock_repo.create.assert_called_once()

    # ===== get_contact =====

    @pytest.mark.asyncio
    async def test_get_contact(self):
        """お問い合わせ取得"""
        contact_id = str(uuid4())
        contact = make_contact(id=contact_id)
        self.mock_repo.find_by_id.return_value = contact

        result = await self.service.get_contact(contact_id)

        assert result == contact

    # ===== get_all_contacts =====

    @pytest.mark.asyncio
    async def test_get_all_contacts(self):
        """お問い合わせ一覧取得"""
        contacts = [make_contact(), make_contact()]
        self.mock_repo.find_all.return_value = contacts

        result = await self.service.get_all_contacts()

        assert result == contacts
        self.mock_repo.find_all.assert_called_once_with(user_id=None)

    @pytest.mark.asyncio
    async def test_get_all_contacts_by_user(self):
        """ユーザー指定でお問い合わせ一覧取得"""
        user_id = str(uuid4())
        contacts = [make_contact(user_id=user_id)]
        self.mock_repo.find_all.return_value = contacts

        result = await self.service.get_all_contacts(user_id=user_id)

        self.mock_repo.find_all.assert_called_once_with(user_id=user_id)

    # ===== update_contact =====

    @pytest.mark.asyncio
    async def test_update_contact(self):
        """お問い合わせ更新"""
        contact_id = str(uuid4())
        update_data = {"status": "resolved"}
        updated = make_contact(id=contact_id, status="resolved")
        self.mock_repo.update.return_value = updated

        result = await self.service.update_contact(contact_id, update_data)

        assert result == updated

    # ===== remove_contact =====

    @pytest.mark.asyncio
    async def test_remove_contact_success(self):
        """お問い合わせ削除 - 正常"""
        contact_id = str(uuid4())
        self.mock_repo.find_by_id.return_value = make_contact(id=contact_id)
        self.mock_repo.delete.return_value = None

        result = await self.service.remove_contact(contact_id)

        assert result is True

    @pytest.mark.asyncio
    async def test_remove_contact_not_found(self):
        """お問い合わせ削除 - 存在しない"""
        self.mock_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            await self.service.remove_contact(str(uuid4()))
