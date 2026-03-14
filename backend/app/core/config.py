from pydantic_settings import BaseSettings
import os
import json


class Settings(BaseSettings):
    # 環境設定
    ENVIRONMENT: str = "development"

    # Supabase設定
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""

    # JWT設定
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # API設定
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Tomosigoto API"

    # CORS設定
    BACKEND_CORS_ORIGINS: list[str] = []

    # スケジュール表示設定
    DEFAULT_VENUE_COLORS: list[str] = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"]
    DEFAULT_PART_COLORS: list[str] = ["#FFD700", "#87CEEB", "#98FB98", "#DDA0DD", "#F7DC6F", "#BB8FCE"]

    # 時間スケジュール設定
    SCHEDULE_START_HOUR: int = 9

    # メールアドレス重複チェック設定
    ENABLE_EMAIL_DUPLICATE_CHECK: bool = True
    SCHEDULE_END_HOUR: int = 17
    SCHEDULE_SLOT_MINUTES: int = 30

    # YouTube API設定
    YOUTUBE_API_KEY: str | None = None
    GOOGLE_CLIENT_SECRETS_FILE: str | None = None
    YOUTUBE_OAUTH_REDIRECT_URI: str | None = None
    # 環境変数から直接OAuth設定を読む場合
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None

    # YouTube OAuth 認証完了後のリダイレクト先（フロントのオリジン。未設定の場合はJSONレスポンスのまま）
    FRONTEND_ORIGIN: str | None = None

    # Discord Webhook設定
    DISCORD_WEBHOOK_URL: str | None = None

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # BACKEND_CORS_ORIGINSが文字列の場合、JSONとして解析
        if isinstance(self.BACKEND_CORS_ORIGINS, str):
            self.BACKEND_CORS_ORIGINS = json.loads(self.BACKEND_CORS_ORIGINS)

    class Config:
        # Docker環境とローカル環境の両方に対応
        # 環境変数から直接読み込む（docker-compose.ymlでenv_fileが設定されている場合）
        # または .env ファイルから読み込む
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"  # 追加の環境変数を無視


settings = Settings()
