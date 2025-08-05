from pydantic_settings import BaseSettings
from typing import Optional, List
import os
import json


class Settings(BaseSettings):
    # Supabase設定
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    # JWT設定
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # API設定
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Tomosigoto API"
    
    # CORS設定
    BACKEND_CORS_ORIGINS: List[str] = []
    
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