import pytest
from datetime import datetime, timedelta, UTC
from app.auth.password_policy import PasswordPolicy, ValidationResult


class TestPasswordPolicy:
    """パスワードポリシーのテストクラス"""
    
    def setup_method(self):
        """各テストの前処理"""
        self.policy = PasswordPolicy()
    
    def test_init_default_config(self):
        """デフォルト設定でのパスワードポリシー初期化テスト"""
        policy = PasswordPolicy()
        assert policy.min_length == 8
        assert policy.require_uppercase == True
        assert policy.require_lowercase == True
        assert policy.require_digit == True
        assert policy.require_special == True
        assert policy.password_history_count == 5
        assert policy.password_expiry_days == 90
    
    def test_init_custom_config(self):
        """カスタム設定でのパスワードポリシー初期化テスト"""
        config = {
            "min_length": 12,
            "require_uppercase": False,
            "require_lowercase": True,
            "require_digit": True,
            "require_special": False,
            "password_history_count": 3,
            "password_expiry_days": 30
        }
        policy = PasswordPolicy(config)
        assert policy.min_length == 12
        assert policy.require_uppercase == False
        assert policy.require_lowercase == True
        assert policy.require_digit == True
        assert policy.require_special == False
        assert policy.password_history_count == 3
        assert policy.password_expiry_days == 30
    
    def test_validate_password_valid_strong_password(self):
        """強力なパスワードの検証テスト"""
        result = self.policy.validate_password("MyStr0ng@Password123")
        assert result.is_valid == True
        assert result.has_errors() == False
        assert len(result.errors) == 0
    
    def test_validate_password_too_short(self):
        """短すぎるパスワードの検証テスト"""
        result = self.policy.validate_password("Sh0rt!")
        assert result.is_valid == False
        assert result.has_errors() == True
        assert "パスワードは8文字以上である必要があります" in result.errors
    
    def test_validate_password_no_uppercase(self):
        """大文字が含まれていないパスワードの検証テスト"""
        result = self.policy.validate_password("mystr0ng@password123")
        assert result.is_valid == False
        assert result.has_errors() == True
        assert "パスワードには大文字を含める必要があります" in result.errors
    
    def test_validate_password_no_lowercase(self):
        """小文字が含まれていないパスワードの検証テスト"""
        result = self.policy.validate_password("MYSTR0NG@PASSWORD123")
        assert result.is_valid == False
        assert result.has_errors() == True
        assert "パスワードには小文字を含める必要があります" in result.errors
    
    def test_validate_password_no_digit(self):
        """数字が含まれていないパスワードの検証テスト"""
        result = self.policy.validate_password("MyStr@ngPassword")
        assert result.is_valid == False
        assert result.has_errors() == True
        assert "パスワードには数字を含める必要があります" in result.errors
    
    def test_validate_password_no_special(self):
        """特殊文字が含まれていないパスワードの検証テスト"""
        result = self.policy.validate_password("MyStr0ngPassword123")
        assert result.is_valid == False
        assert result.has_errors() == True
        assert "パスワードには特殊文字を含める必要があります" in result.errors
    
    def test_validate_password_multiple_errors(self):
        """複数のエラーを含むパスワードの検証テスト"""
        result = self.policy.validate_password("short")
        assert result.is_valid == False
        assert result.has_errors() == True
        assert len(result.errors) >= 3  # 短い、大文字なし、数字なし、特殊文字なし
    
    def test_hash_password(self):
        """パスワードハッシュ化テスト"""
        password = "MyStr0ng@Password123"
        hashed = self.policy.hash_password(password)
        assert hashed != password
        assert len(hashed) > 50  # bcryptハッシュは通常60文字程度
        assert hashed.startswith("$2b$")  # bcryptハッシュのプレフィックス
    
    def test_verify_password_correct(self):
        """正しいパスワードの検証テスト"""
        password = "MyStr0ng@Password123"
        hashed = self.policy.hash_password(password)
        assert self.policy.verify_password(password, hashed) == True
    
    def test_verify_password_incorrect(self):
        """間違ったパスワードの検証テスト"""
        password = "MyStr0ng@Password123"
        wrong_password = "WrongPassword123"
        hashed = self.policy.hash_password(password)
        assert self.policy.verify_password(wrong_password, hashed) == False
    
    def test_generate_reset_token(self):
        """パスワードリセットトークン生成テスト"""
        user_id = "user123"
        token = self.policy.generate_reset_token(user_id)
        assert isinstance(token, str)
        assert len(token) > 50  # JWTトークンは通常長い
    
    def test_verify_reset_token_valid(self):
        """有効なリセットトークンの検証テスト"""
        user_id = "user123"
        token = self.policy.generate_reset_token(user_id)
        verified_user_id = self.policy.verify_reset_token(token)
        assert verified_user_id == user_id
    
    def test_verify_reset_token_invalid(self):
        """無効なリセットトークンの検証テスト"""
        invalid_token = "invalid.token.here"
        with pytest.raises(Exception):  # JWT検証エラーを期待
            self.policy.verify_reset_token(invalid_token)
    
    def test_verify_reset_token_expired(self):
        """期限切れリセットトークンの検証テスト"""
        # この部分は実装時に、有効期限を非常に短くしたトークンを作成してテストする
        user_id = "user123"
        # 実装では-1秒の有効期限でトークンを生成する機能が必要
        token = self.policy.generate_reset_token(user_id, expires_delta=timedelta(seconds=-1))
        with pytest.raises(Exception):  # 期限切れエラーを期待
            self.policy.verify_reset_token(token)


class TestValidationResult:
    """ValidationResultクラスのテスト"""
    
    def test_init_default(self):
        """デフォルト初期化テスト"""
        result = ValidationResult()
        assert result.is_valid == True
        assert result.errors == []
        assert result.message == ""
    
    def test_init_with_errors(self):
        """エラー付き初期化テスト"""
        errors = ["エラー1", "エラー2"]
        result = ValidationResult(is_valid=False, errors=errors, message="検証失敗")
        assert result.is_valid == False
        assert result.errors == errors
        assert result.message == "検証失敗"
    
    def test_add_error(self):
        """エラー追加テスト"""
        result = ValidationResult()
        result.add_error("新しいエラー")
        assert result.has_errors() == True
        assert "新しいエラー" in result.errors
        assert result.is_valid == False
    
    def test_has_errors_with_no_errors(self):
        """エラーなしの場合のhas_errorsテスト"""
        result = ValidationResult()
        assert result.has_errors() == False
    
    def test_has_errors_with_errors(self):
        """エラーありの場合のhas_errorsテスト"""
        result = ValidationResult(errors=["エラー"])
        assert result.has_errors() == True