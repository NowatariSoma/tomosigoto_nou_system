"""
ML-Engine設定ファイル
"""
import os
from typing import Dict, Any

class Settings:
    """ML-Engine設定クラス"""
    
    # 基本設定
    PROJECT_NAME: str = "ML-Engine"
    VERSION: str = "1.0.0"
    PORT: int = 8001
    HOST: str = "0.0.0.0"
    
    # API設定
    MAX_WORKERS: int = 4
    TIMEOUT: int = 30
    
    # モデル設定
    MODELS: Dict[str, Any] = {
        "scene_based_system": {
            "enabled": True,
            "version": "latest",
            "model_path": "./models/scene_based_system/best",
            "endpoint": "/predict/schedule-optimization",
            "type": "reinforcement_learning"
        }
    }
    
    # 強化学習設定
    REINFORCEMENT_LEARNING: Dict[str, Any] = {
        "algorithm": "PPO",
        "environment": "scene_based_system",
        "reward_function": "scene_based_reward",
        "max_steps": 20000000,
        "checkpoint_interval": 1000000
    }
    
    # データ設定
    DATA: Dict[str, Any] = {
        "sources": ["supabase", "csv", "json"],
        "supabase_url": os.getenv("SUPABASE_URL", "http://127.0.0.1:54321"),
        "supabase_key": os.getenv("SUPABASE_ANON_KEY", "")
    }
    
    # 可視化設定
    VISUALIZATION: Dict[str, Any] = {
        "output_path": "./outputs/visualizations",
        "formats": ["png", "svg"],
        "include_heatmap": True,
        "include_timeline": True,
        "include_assignments": True
    }

settings = Settings()
