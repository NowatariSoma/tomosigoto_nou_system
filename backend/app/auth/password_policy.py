import re
import secrets
from datetime import datetime, timedelta, UTC
from typing import List, Optional, Dict, Any
from passlib.context import CryptContext
import jwt
from pydantic import BaseModel


class ValidationResult:
    """パスワード検証結果を表すクラス"""
    
    def __init__(self, is_valid: bool = True, errors: List[str] = None, message: str = ""):
        self.is_valid = is_valid
        self.errors = errors or []
        self.message = message
        
        # エラーがある場合は無効とマークする
        if self.errors:
            self.is_valid = False
    
    def add_error(self, error: str) -> None:
        """エラーを追加"""
        self.errors.append(error)
        self.is_valid = False
    
    def has_errors(self) -> bool:
        """エラーがあるかどうかを確認"""
        return len(self.errors) > 0


class PasswordPolicy:
    """パスワードポリシー管理クラス"""
    
    def __init__(self, config: dict = None):
        """ポリシー設定の初期化"""
        default_config = {
            "min_length": 8,
            "require_uppercase": True,
            "require_lowercase": True,
            "require_digit": True,
            "require_special": True,
            "password_history_count": 5,
            "password_expiry_days": 90
        }
        
        if config:
            default_config.update(config)
        
        self.min_length = default_config["min_length"]
        self.require_uppercase = default_config["require_uppercase"]
        self.require_lowercase = default_config["require_lowercase"]
        self.require_digit = default_config["require_digit"]
        self.require_special = default_config["require_special"]
        self.password_history_count = default_config["password_history_count"]
        self.password_expiry_days = default_config["password_expiry_days"]
        
        # パスワードハッシュ化用のコンテキスト
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # リセットトークン用の秘密鍵
        self._token_secret = secrets.token_urlsafe(32)
    
    def validate_password(self, password: str) -> ValidationResult:
        """パスワード検証"""
        result = ValidationResult()
        
        # 最小文字数チェック
        if len(password) < self.min_length:
            result.add_error(f"パスワードは{self.min_length}文字以上である必要があります")
        
        # 大文字チェック
        if self.require_uppercase and not re.search(r'[A-Z]', password):
            result.add_error("パスワードには大文字を含める必要があります")
        
        # 小文字チェック
        if self.require_lowercase and not re.search(r'[a-z]', password):
            result.add_error("パスワードには小文字を含める必要があります")
        
        # 数字チェック
        if self.require_digit and not re.search(r'\d', password):
            result.add_error("パスワードには数字を含める必要があります")
        
        # 特殊文字チェック
        if self.require_special and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            result.add_error("パスワードには特殊文字を含める必要があります")
        
        return result
    
    def hash_password(self, password: str) -> str:
        """パスワードハッシュ化"""
        return self.pwd_context.hash(password)
    
    def verify_password(self, password: str, hash: str) -> bool:
        """パスワード検証"""
        return self.pwd_context.verify(password, hash)
    
    def generate_reset_token(self, user_id: str, expires_delta: timedelta = None) -> str:
        """リセットトークン生成"""
        if expires_delta is None:
            expires_delta = timedelta(hours=1)  # デフォルト1時間
        
        expire = datetime.now(UTC) + expires_delta
        payload = {
            "user_id": user_id,
            "exp": expire,
            "type": "password_reset"
        }
        
        return jwt.encode(payload, self._token_secret, algorithm="HS256")
    
    def verify_reset_token(self, token: str) -> str:
        """リセットトークン検証"""
        try:
            payload = jwt.decode(token, self._token_secret, algorithms=["HS256"])
            
            # トークンタイプをチェック
            if payload.get("type") != "password_reset":
                raise jwt.InvalidTokenError("Invalid token type")
            
            return payload["user_id"]
        except jwt.ExpiredSignatureError:
            raise Exception("Token has expired")
        except jwt.InvalidTokenError:
            raise Exception("Invalid token")