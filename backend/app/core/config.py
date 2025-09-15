from pydantic_settings import BaseSettings
from typing import Optional, List
import os
import json


class Settings(BaseSettings):
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
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:3000/",
        "http://localhost:3001/",
        "http://127.0.0.1:3000/",
        "http://127.0.0.1:3001/",
        "*"  # 開発環境用：すべてのオリジンを許可
    ]
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # BACKEND_CORS_ORIGINSが文字列の場合、JSONとして解析
        if isinstance(self.BACKEND_CORS_ORIGINS, str):
            self.BACKEND_CORS_ORIGINS = json.loads(self.BACKEND_CORS_ORIGINS)
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # 追加の環境変数を無視


settings = Settings() 