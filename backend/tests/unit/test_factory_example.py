"""Factory Pattern Test Example - ファクトリーパターンのテスト例"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest
from tests.factories.user_factory import UserFactory
from tests.factories.venue_factory import VenueFactory


class TestFactoryPattern:
    """ファクトリーパターンの動作確認テスト"""
    
    def test_user_factory_create_single_user(self):
        """単一ユーザー生成のテスト"""
        factory = UserFactory()
        user = factory.create()
        
        assert user["id"] is not None
        assert "@testexample.com" in user["email"]
        assert user["password"] is not None
        assert user["is_active"] is True
        assert user["is_verified"] is False
        assert user["role"] == "user"
    
    def test_user_factory_create_admin(self):
        """管理者ユーザー生成のテスト"""
        factory = UserFactory()
        admin = factory.create_admin()
        
        assert admin["role"] == "admin"
        assert admin["is_verified"] is True
        assert "admin" in admin["email"]
    
    def test_user_factory_create_batch(self):
        """複数ユーザー生成のテスト"""
        factory = UserFactory()
        users = factory.create_batch(5)
        
        assert len(users) == 5
        emails = [u["email"] for u in users]
        assert len(set(emails)) == 5  # All emails should be unique
    
    def test_user_factory_with_overrides(self):
        """カスタム値でのユーザー生成テスト"""
        factory = UserFactory()
        custom_user = factory.create(
            email="custom@example.com",
            role="moderator"
        )
        
        assert custom_user["email"] == "custom@example.com"
        assert custom_user["role"] == "moderator"
    
    def test_venue_factory_create_single_venue(self):
        """単一会場生成のテスト"""
        factory = VenueFactory()
        venue = factory.create()
        
        assert venue["id"] is not None
        assert venue["name"] is not None
        assert venue["address"] is not None
        assert venue["capacity"] > 0
        assert venue["is_active"] is True
    
    def test_venue_factory_create_small_venue(self):
        """小規模会場生成のテスト"""
        factory = VenueFactory()
        small_venue = factory.create_small()
        
        assert small_venue["capacity"] < 100
        assert small_venue["capacity"] >= 20
    
    def test_venue_factory_create_large_venue(self):
        """大規模会場生成のテスト"""
        factory = VenueFactory()
        large_venue = factory.create_large()
        
        assert large_venue["capacity"] >= 1000
        assert large_venue["capacity"] <= 10000
    
    def test_venue_factory_japanese_names(self):
        """日本語の会場名生成テスト"""
        factory = VenueFactory()
        venues = factory.create_batch(3)
        
        for venue in venues:
            assert venue["name"] is not None
            # 最初の8件は定義済みの日本語名を使用
            if factory._counter <= 8:
                assert any(char in venue["name"] for char in "東大横福名札仙広")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])