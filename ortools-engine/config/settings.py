"""
アプリケーション設定

環境変数とデフォルト値の管理
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """アプリケーション設定"""
    
    # 基本設定
    app_name: str = "OR-Tools最適化エンジン"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # サーバー設定
    host: str = "0.0.0.0"
    port: int = 8001
    
    # 最適化設定
    max_rooms: int = 10
    max_scenes: int = 20
    max_timeslots: int = 4
    max_people: int = 60
    optimization_timeout: int = 30
    
    # ログ設定
    log_level: str = "INFO"
    log_format: str = "json"
    
    # データベース設定（将来の拡張用）
    database_url: Optional[str] = None
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# グローバル設定インスタンス
settings = Settings()
