"""
VenueService のユニットテスト
"""
import pytest
from unittest.mock import Mock
from uuid import UUID, uuid4

from app.services.venue_service import VenueService
from app.core.exceptions import APIException
from tests.helpers.factories import make_venue


class TestVenueService:
    """VenueService のテスト"""

    def setup_method(self):
        self.mock_repo = Mock()
        self.service = VenueService(
            venue_repository=self.mock_repo,
        )

    # ===== get_all_venues =====

    def test_get_all_venues_success(self):
        """全会場取得 - 正常"""
        venues = [make_venue(), make_venue(name="別の会場")]
        self.mock_repo.find_all.return_value = venues

        result = self.service.get_all_venues()

        assert result == venues
        self.mock_repo.find_all.assert_called_once()

    def test_get_all_venues_empty(self):
        """全会場取得 - 空リスト"""
        self.mock_repo.find_all.return_value = []

        result = self.service.get_all_venues()

        assert result == []

    # ===== get_venue =====

    def test_get_venue_success(self):
        """ID指定で会場取得 - 正常"""
        venue_id = uuid4()
        venue = make_venue(id=str(venue_id))
        self.mock_repo.find_by_id.return_value = venue

        result = self.service.get_venue(venue_id)

        assert result == venue
        self.mock_repo.find_by_id.assert_called_once_with(venue_id)

    # ===== create_venue =====

    def test_create_venue_success(self):
        """会場作成 - 正常"""
        venue_data = {"name": "新しい会場", "capacity": 100}
        created_venue = make_venue(name="新しい会場", capacity=100)
        self.mock_repo.create.return_value = created_venue

        result = self.service.create_venue(venue_data)

        assert result == created_venue
        self.mock_repo.create.assert_called_once_with(venue_data)

    # ===== update_venue =====

    def test_update_venue_success(self):
        """会場更新 - 正常"""
        venue_id = uuid4()
        update_data = {"name": "更新された会場"}
        updated_venue = make_venue(id=str(venue_id), name="更新された会場")
        self.mock_repo.update.return_value = updated_venue

        result = self.service.update_venue(venue_id, update_data)

        assert result == updated_venue
        self.mock_repo.update.assert_called_once_with(venue_id, update_data)

    # ===== remove_venue =====

    def test_remove_venue_success(self):
        """会場削除 - 正常"""
        venue_id = uuid4()
        venue = make_venue(id=str(venue_id))
        self.mock_repo.find_by_id.return_value = venue
        self.mock_repo.delete.return_value = None

        result = self.service.remove_venue(venue_id)

        assert result is True
        self.mock_repo.find_by_id.assert_called_once_with(venue_id)
        self.mock_repo.delete.assert_called_once_with(venue_id)

    def test_remove_venue_not_found(self):
        """会場削除 - 存在しない場合はAPIException"""
        venue_id = uuid4()
        self.mock_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            self.service.remove_venue(venue_id)

        self.mock_repo.delete.assert_not_called()
