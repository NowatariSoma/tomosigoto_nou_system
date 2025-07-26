import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta
from app.auth.session import SessionManager, Session


class TestSession:
    """Sessionクラスのテストクラス"""
    
    def test_init_session(self):
        """セッション初期化テスト"""
        user_id = "user123"
        jwt = "jwt_token_here"
        user_agent = "Mozilla/5.0"
        ip_address = "192.168.1.1"
        
        session = Session(
            user_id=user_id,
            jwt=jwt,
            user_agent=user_agent,
            ip_address=ip_address
        )
        
        assert session.user_id == user_id
        assert session.jwt == jwt
        assert session.user_agent == user_agent
        assert session.ip_address == ip_address
        assert isinstance(session.session_id, str)
        assert len(session.session_id) > 0
        assert isinstance(session.created_at, datetime)
        assert isinstance(session.expires_at, datetime)
        assert session.expires_at > session.created_at
    
    def test_is_expired_false(self):
        """セッション有効期限内テスト"""
        session = Session(user_id="user123", jwt="jwt_token")
        # 作成直後なので有効期限内
        assert session.is_expired() == False
    
    def test_is_expired_true(self):
        """セッション有効期限切れテスト"""
        session = Session(user_id="user123", jwt="jwt_token")
        # 有効期限を過去に設定
        session.expires_at = datetime.utcnow() - timedelta(minutes=1)
        assert session.is_expired() == True
    
    def test_time_until_expiry(self):
        """有効期限までの時間計算テスト"""
        session = Session(user_id="user123", jwt="jwt_token")
        time_left = session.time_until_expiry()
        assert isinstance(time_left, timedelta)
        assert time_left.total_seconds() > 0
    
    def test_extend_session(self):
        """セッション有効期限延長テスト"""
        session = Session(user_id="user123", jwt="jwt_token")
        original_expiry = session.expires_at
        
        additional_time = 3600  # 1時間
        session.extend(additional_time)
        
        assert session.expires_at > original_expiry
        expected_expiry = original_expiry + timedelta(seconds=additional_time)
        assert abs((session.expires_at - expected_expiry).total_seconds()) < 1
    
    def test_to_dict(self):
        """セッション辞書変換テスト"""
        session = Session(
            user_id="user123",
            jwt="jwt_token",
            user_agent="Mozilla/5.0",
            ip_address="192.168.1.1"
        )
        
        session_dict = session.to_dict()
        
        assert session_dict["user_id"] == "user123"
        assert session_dict["session_id"] == session.session_id
        assert session_dict["jwt"] == "jwt_token"
        assert session_dict["user_agent"] == "Mozilla/5.0"
        assert session_dict["ip_address"] == "192.168.1.1"
        assert "created_at" in session_dict
        assert "expires_at" in session_dict
    
    def test_from_dict(self):
        """辞書からセッション作成テスト"""
        session_data = {
            "user_id": "user123",
            "session_id": "session_id_123",
            "jwt": "jwt_token",
            "user_agent": "Mozilla/5.0",
            "ip_address": "192.168.1.1",
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat()
        }
        
        session = Session.from_dict(session_data)
        
        assert session.user_id == "user123"
        assert session.session_id == "session_id_123"
        assert session.jwt == "jwt_token"
        assert session.user_agent == "Mozilla/5.0"
        assert session.ip_address == "192.168.1.1"
        assert isinstance(session.created_at, datetime)
        assert isinstance(session.expires_at, datetime)


class TestSessionManager:
    """SessionManagerクラスのテストクラス"""
    
    def setup_method(self):
        """各テストの前処理"""
        # Redisクライアントのモックを作成
        self.mock_redis = AsyncMock()
        self.session_manager = SessionManager(
            redis_client=self.mock_redis,
            session_ttl=86400  # 24時間
        )
    
    @pytest.mark.asyncio
    async def test_create_session_success(self):
        """セッション作成成功テスト"""
        user_id = "user123"
        jwt = "jwt_token_here"
        user_agent = "Mozilla/5.0"
        ip_address = "192.168.1.1"
        
        # Redis操作成功をモック
        self.mock_redis.setex = AsyncMock(return_value=True)
        self.mock_redis.sadd = AsyncMock(return_value=1)
        self.mock_redis.expire = AsyncMock(return_value=True)
        
        # テスト実行
        session = await self.session_manager.create_session(
            user_id=user_id,
            jwt=jwt,
            user_agent=user_agent,
            ip_address=ip_address
        )
        
        # アサーション
        assert isinstance(session, Session)
        assert session.user_id == user_id
        assert session.jwt == jwt
        assert session.user_agent == user_agent
        assert session.ip_address == ip_address
        
        # Redisが正しく呼ばれたかチェック
        self.mock_redis.setex.assert_called_once()
        self.mock_redis.sadd.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_validate_session_valid(self):
        """有効なセッション検証テスト"""
        session_id = "session123"
        jwt = "jwt_token"
        
        # 有効なセッションデータをモック
        session_data = {
            "user_id": "user123",
            "session_id": session_id,
            "jwt": jwt,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat()
        }
        
        import json
        self.mock_redis.get = AsyncMock(return_value=json.dumps(session_data))
        
        # テスト実行
        is_valid = await self.session_manager.validate_session(session_id, jwt)
        
        # アサーション
        assert is_valid == True
        self.mock_redis.get.assert_called_once_with(f"session:{session_id}")
    
    @pytest.mark.asyncio
    async def test_validate_session_not_found(self):
        """存在しないセッション検証テスト"""
        session_id = "nonexistent_session"
        jwt = "jwt_token"
        
        # セッションが見つからない場合をモック
        self.mock_redis.get = AsyncMock(return_value=None)
        
        # テスト実行
        is_valid = await self.session_manager.validate_session(session_id, jwt)
        
        # アサーション
        assert is_valid == False
    
    @pytest.mark.asyncio
    async def test_validate_session_expired(self):
        """期限切れセッション検証テスト"""
        session_id = "session123"
        jwt = "jwt_token"
        
        # 期限切れセッションデータをモック
        session_data = {
            "user_id": "user123",
            "session_id": session_id,
            "jwt": jwt,
            "created_at": (datetime.utcnow() - timedelta(hours=25)).isoformat(),
            "expires_at": (datetime.utcnow() - timedelta(hours=1)).isoformat()
        }
        
        import json
        self.mock_redis.get = AsyncMock(return_value=json.dumps(session_data))
        
        # テスト実行
        is_valid = await self.session_manager.validate_session(session_id, jwt)
        
        # アサーション
        assert is_valid == False
    
    @pytest.mark.asyncio
    async def test_validate_session_jwt_mismatch(self):
        """JWTトークン不一致セッション検証テスト"""
        session_id = "session123"
        jwt = "different_jwt_token"
        
        # 異なるJWTを持つセッションデータをモック
        session_data = {
            "user_id": "user123",
            "session_id": session_id,
            "jwt": "original_jwt_token",
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat()
        }
        
        import json
        self.mock_redis.get = AsyncMock(return_value=json.dumps(session_data))
        
        # テスト実行
        is_valid = await self.session_manager.validate_session(session_id, jwt)
        
        # アサーション
        assert is_valid == False
    
    @pytest.mark.asyncio
    async def test_terminate_session_success(self):
        """セッション終了成功テスト"""
        session_id = "session123"
        user_id = "user123"
        
        # セッションデータ取得をモック
        session_data = {
            "user_id": user_id,
            "session_id": session_id
        }
        import json
        self.mock_redis.get = AsyncMock(return_value=json.dumps(session_data))
        
        # Redis削除操作成功をモック
        self.mock_redis.delete = AsyncMock(return_value=1)
        self.mock_redis.srem = AsyncMock(return_value=1)
        
        # テスト実行
        result = await self.session_manager.terminate_session(session_id)
        
        # アサーション
        assert result == True
        self.mock_redis.delete.assert_called_once_with(f"session:{session_id}")
        self.mock_redis.srem.assert_called_once_with(f"user_sessions:{user_id}", session_id)
    
    @pytest.mark.asyncio
    async def test_terminate_all_sessions_success(self):
        """ユーザーの全セッション終了テスト"""
        user_id = "user123"
        session_ids = ["session1", "session2", "session3"]
        
        # ユーザーのセッション一覧取得をモック
        self.mock_redis.smembers = AsyncMock(return_value=set(session_ids))
        
        # セッション削除操作をモック
        self.mock_redis.delete = AsyncMock(return_value=len(session_ids))
        
        # テスト実行
        result = await self.session_manager.terminate_all_sessions(user_id)
        
        # アサーション
        assert result == True
        
        # 各セッションが削除されたかチェック
        expected_calls = [f"session:{sid}" for sid in session_ids] + [f"user_sessions:{user_id}"]
        assert self.mock_redis.delete.call_count == 1
    
    @pytest.mark.asyncio
    async def test_get_active_sessions(self):
        """アクティブセッション取得テスト"""
        user_id = "user123"
        session_ids = ["session1", "session2"]
        
        # ユーザーのセッション一覧取得をモック
        self.mock_redis.smembers = AsyncMock(return_value=set(session_ids))
        
        # 各セッションデータをモック
        session_data_list = []
        for i, sid in enumerate(session_ids):
            session_data = {
                "user_id": user_id,
                "session_id": sid,
                "jwt": f"jwt_token_{i}",
                "created_at": datetime.utcnow().isoformat(),
                "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat()
            }
            session_data_list.append(json.dumps(session_data))
        
        import json
        self.mock_redis.mget = AsyncMock(return_value=session_data_list)
        
        # テスト実行
        sessions = await self.session_manager.get_active_sessions(user_id)
        
        # アサーション
        assert len(sessions) == 2
        assert all(isinstance(session, Session) for session in sessions)
        assert sessions[0].user_id == user_id
        assert sessions[1].user_id == user_id
    
    @pytest.mark.asyncio
    async def test_refresh_session_success(self):
        """セッション更新成功テスト"""
        session_id = "session123"
        new_jwt = "new_jwt_token"
        
        # 既存セッションデータをモック
        existing_session_data = {
            "user_id": "user123",
            "session_id": session_id,
            "jwt": "old_jwt_token",
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(hours=12)).isoformat()
        }
        
        import json
        self.mock_redis.get = AsyncMock(return_value=json.dumps(existing_session_data))
        self.mock_redis.setex = AsyncMock(return_value=True)
        
        # テスト実行
        updated_session = await self.session_manager.refresh_session(session_id, new_jwt)
        
        # アサーション
        assert isinstance(updated_session, Session)
        assert updated_session.jwt == new_jwt
        assert updated_session.session_id == session_id
        assert updated_session.user_id == "user123"
        
        # Redisが更新されたかチェック
        self.mock_redis.setex.assert_called_once()