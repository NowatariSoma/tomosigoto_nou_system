"""
シーンベース最適化サービス
強化学習ベースのスケジュール最適化を提供
"""
import sys
import os
import time
from typing import Dict, Any, List, Optional
from datetime import datetime

# srcディレクトリをパスに追加
sys.path.append(os.path.join(os.path.dirname(__file__), '../../src'))

from app.core.config import settings
from app.core.exceptions import ModelLoadException, PredictionException, TrainingException

class SceneBasedOptimizerService:
    """シーンベース最適化サービス"""
    
    def __init__(self):
        self.model_loaded = False
        self.model = None
        self.env = None
        self.trainer = None
        
    async def _load_model(self):
        """モデルを読み込み"""
        if self.model_loaded:
            return
            
        try:
            # 強化学習環境の初期化
            from environment.environment import ScheduleOptimizationEnv
            from training.ppo_trainer import PPOTrainer
            
            self.env = ScheduleOptimizationEnv()
            self.trainer = PPOTrainer()
            
            # モデルの読み込み
            model_path = settings.MODELS["scene_based_system"]["model_path"]
            if os.path.exists(model_path):
                self.model = self.trainer.load_model(model_path)
            else:
                # デフォルトモデルを作成
                self.model = self.trainer.create_model()
            
            self.model_loaded = True
            
        except Exception as e:
            raise ModelLoadException(f"モデルの読み込みに失敗しました: {str(e)}")
    
    async def optimize(self, request) -> Dict[str, Any]:
        """スケジュール最適化"""
        try:
            await self._load_model()
            
            # 環境の初期化
            obs = self.env.reset(request.schedule_data)
            
            # モデルによる最適化
            action = await self.trainer.predict(self.model, obs)
            
            # 環境でアクション実行
            obs, reward, done, info = self.env.step(action)
            
            return {
                "optimized_schedule": info.get("schedule", request.schedule_data),
                "reward": float(reward),
                "assignments": info.get("assignments", {})
            }
            
        except Exception as e:
            raise PredictionException(f"スケジュール最適化に失敗しました: {str(e)}")
    
    async def train(self, config: Optional[Dict[str, Any]] = None):
        """強化学習モデルの学習"""
        try:
            await self._load_model()
            
            # 学習設定
            training_config = config or {}
            max_steps = training_config.get("max_steps", settings.REINFORCEMENT_LEARNING["max_steps"])
            
            # 学習実行
            result = await self.trainer.train(
                self.env,
                max_steps=max_steps,
                config=training_config
            )
            
            return result
            
        except Exception as e:
            raise TrainingException(f"モデル学習に失敗しました: {str(e)}")
    
    async def get_model_status(self) -> Dict[str, Any]:
        """モデル状態を取得"""
        try:
            await self._load_model()
            
            return {
                "status": "loaded" if self.model_loaded else "not_loaded",
                "model_path": settings.MODELS["scene_based_system"]["model_path"],
                "version": settings.MODELS["scene_based_system"]["version"],
                "metrics": {
                    "model_loaded": self.model_loaded,
                    "environment_ready": self.env is not None,
                    "trainer_ready": self.trainer is not None
                }
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "metrics": {
                    "model_loaded": False,
                    "environment_ready": False,
                    "trainer_ready": False
                }
            }
    
    async def visualize_assignments(self, schedule_id: str, visualization_types: List[str]) -> Dict[str, Any]:
        """割り当て結果の可視化"""
        try:
            from utils.visualization import AssignmentVisualizer
            
            visualizer = AssignmentVisualizer()
            output_path = settings.VISUALIZATION["output_path"]
            
            # 可視化の実行
            urls = {}
            for viz_type in visualization_types:
                if viz_type == "heatmap":
                    url = await visualizer.create_heatmap(schedule_id, output_path)
                    urls["heatmap"] = url
                elif viz_type == "timeline":
                    url = await visualizer.create_timeline(schedule_id, output_path)
                    urls["timeline"] = url
                elif viz_type == "assignments":
                    url = await visualizer.create_assignments(schedule_id, output_path)
                    urls["assignments"] = url
            
            return {"urls": urls}
            
        except Exception as e:
            raise Exception(f"可視化に失敗しました: {str(e)}")
