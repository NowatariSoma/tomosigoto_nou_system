"""
設定管理

既存のバックエンド構成に合わせた設定管理
"""

from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    """アプリケーション設定"""
    
    # 基本設定
    PROJECT_NAME: str = "OR-Tools Optimization Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # サーバー設定
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    
    # CORS設定
    BACKEND_CORS_ORIGINS: List[str] = []
    
    # 最適化設定
    OPTIMIZATION_TIMEOUT: int = 30  # 秒
    MAX_ROOMS: int = 10
    MAX_SCENES: int = 20
    MAX_TIMESLOTS: int = 4
    MAX_PEOPLE: int = 60
    
    # ログ設定
    LOG_LEVEL: str = "INFO"
    DEBUG: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # CORS設定の文字列解析
        if isinstance(self.BACKEND_CORS_ORIGINS, str):
            self.BACKEND_CORS_ORIGINS = json.loads(self.BACKEND_CORS_ORIGINS)


settings = Settings()
