import uuid
import json
from datetime import datetime, timedelta, UTC
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class Session:
    """セッション情報を表すクラス"""
    
    def __init__(
        self,
        user_id: str,
        jwt: str,
        user_agent: str = None,
        ip_address: str = None,
        session_id: str = None,
        created_at: datetime = None,
        expires_at: datetime = None
    ):
        """セッションの初期化"""
        self.user_id = user_id
        self.jwt = jwt
        self.user_agent = user_agent
        self.ip_address = ip_address
        self.session_id = session_id or str(uuid.uuid4())
        self.created_at = created_at or datetime.now(UTC)
        self.expires_at = expires_at or (datetime.now(UTC) + timedelta(days=1))  # デフォルト24時間
    
    def is_expired(self) -> bool:
        """有効期限確認"""
        return datetime.now(UTC) > self.expires_at
    
    def time_until_expiry(self) -> timedelta:
        """残り有効時間取得"""
        return self.expires_at - datetime.now(UTC)
    
    def extend(self, additional_time: int) -> None:
        """有効期間延長（秒単位）"""
        self.expires_at += timedelta(seconds=additional_time)
    
    def to_dict(self) -> Dict[str, Any]:
        """セッション辞書変換"""
        return {
            "user_id": self.user_id,
            "session_id": self.session_id,
            "jwt": self.jwt,
            "user_agent": self.user_agent,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Session":
        """辞書からセッション作成"""
        return cls(
            user_id=data["user_id"],
            jwt=data["jwt"],
            user_agent=data.get("user_agent"),
            ip_address=data.get("ip_address"),
            session_id=data["session_id"],
            created_at=datetime.fromisoformat(data["created_at"]),
            expires_at=datetime.fromisoformat(data["expires_at"])
        )


class SessionManager:
    """セッション管理クラス"""
    
    def __init__(self, redis_client, session_ttl: int = 86400):
        """マネージャーの初期化"""
        self.redis_client = redis_client
        self.session_ttl = session_ttl  # セッション有効期限（秒）
        self.cache_prefix = "session"
        self.user_sessions_prefix = "user_sessions"
    
    async def create_session(
        self,
        user_id: str,
        jwt: str,
        user_agent: str = None,
        ip_address: str = None
    ) -> Session:
        """セッション作成"""
        session = Session(
            user_id=user_id,
            jwt=jwt,
            user_agent=user_agent,
            ip_address=ip_address
        )
        
        # Redisにセッションを保存
        session_key = f"{self.cache_prefix}:{session.session_id}"
        session_data = json.dumps(session.to_dict())
        
        await self.redis_client.setex(session_key, self.session_ttl, session_data)
        
        # ユーザーのセッション一覧に追加
        user_sessions_key = f"{self.user_sessions_prefix}:{user_id}"
        await self.redis_client.sadd(user_sessions_key, session.session_id)
        await self.redis_client.expire(user_sessions_key, self.session_ttl)
        
        return session
    
    async def validate_session(self, session_id: str, jwt: str) -> bool:
        """セッション検証"""
        try:
            session_key = f"{self.cache_prefix}:{session_id}"
            session_data = await self.redis_client.get(session_key)
            
            if not session_data:
                return False
            
            session_dict = json.loads(session_data)
            session = Session.from_dict(session_dict)
            
            # セッションの有効期限チェック
            if session.is_expired():
                # 期限切れセッションを削除
                await self.terminate_session(session_id)
                return False
            
            # JWTトークンの一致チェック
            if session.jwt != jwt:
                return False
            
            return True
        except Exception:
            return False
    
    async def terminate_session(self, session_id: str) -> bool:
        """セッション終了"""
        try:
            session_key = f"{self.cache_prefix}:{session_id}"
            
            # セッションデータを取得してユーザーIDを確認
            session_data = await self.redis_client.get(session_key)
            if session_data:
                session_dict = json.loads(session_data)
                user_id = session_dict["user_id"]
                
                # ユーザーのセッション一覧から削除
                user_sessions_key = f"{self.user_sessions_prefix}:{user_id}"
                await self.redis_client.srem(user_sessions_key, session_id)
            
            # セッションデータを削除
            result = await self.redis_client.delete(session_key)
            return result > 0
        except Exception:
            return False
    
    async def terminate_all_sessions(self, user_id: str) -> bool:
        """ユーザーの全セッション終了"""
        try:
            user_sessions_key = f"{self.user_sessions_prefix}:{user_id}"
            session_ids = await self.redis_client.smembers(user_sessions_key)
            
            if session_ids:
                # 各セッションを削除
                session_keys = [f"{self.cache_prefix}:{sid}" for sid in session_ids]
                await self.redis_client.delete(*session_keys)
            
            # ユーザーのセッション一覧を削除
            await self.redis_client.delete(user_sessions_key)
            
            return True
        except Exception:
            return False
    
    async def get_active_sessions(self, user_id: str) -> List[Session]:
        """アクティブセッション取得"""
        try:
            user_sessions_key = f"{self.user_sessions_prefix}:{user_id}"
            session_ids = await self.redis_client.smembers(user_sessions_key)
            
            if not session_ids:
                return []
            
            # 各セッションデータを取得
            session_keys = [f"{self.cache_prefix}:{sid}" for sid in session_ids]
            session_data_list = await self.redis_client.mget(session_keys)
            
            sessions = []
            for session_data in session_data_list:
                if session_data:
                    session_dict = json.loads(session_data)
                    session = Session.from_dict(session_dict)
                    
                    # 有効期限をチェック
                    if not session.is_expired():
                        sessions.append(session)
                    else:
                        # 期限切れセッションを削除
                        await self.terminate_session(session.session_id)
            
            return sessions
        except Exception:
            return []
    
    async def refresh_session(self, session_id: str, new_jwt: str) -> Optional[Session]:
        """セッション更新"""
        try:
            session_key = f"{self.cache_prefix}:{session_id}"
            session_data = await self.redis_client.get(session_key)
            
            if not session_data:
                return None
            
            session_dict = json.loads(session_data)
            session = Session.from_dict(session_dict)
            
            # 新しいJWTでセッションを更新
            session.jwt = new_jwt
            session.expires_at = datetime.now(UTC) + timedelta(seconds=self.session_ttl)
            
            # Redisに更新されたセッションを保存
            updated_session_data = json.dumps(session.to_dict())
            await self.redis_client.setex(session_key, self.session_ttl, updated_session_data)
            
            return session
        except Exception:
            return None