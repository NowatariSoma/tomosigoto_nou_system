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
        """スケジュール最適化（visualize_assignments.pyを参考に実装）"""
        try:
            # 環境設定と報酬設定を読み込み
            from src.utils.utils import load_config
            
            env_config = load_config('configs/environment/env.yaml')
            reward_config = load_config('configs/reward/reward.yaml')
            env_config['reward_config'] = reward_config
            
            # 学習時と同じ環境作成方法を使用
            from src.training.train import create_environment_with_dynamic_obs
            
            # 学習時と同じ環境を作成（マスキング有効）
            env = create_environment_with_dynamic_obs(env_config, use_masking=True)
            
            # Monitorで包まれている場合の環境属性アクセス
            if hasattr(env, 'env'):
                base_env = env.env
                if hasattr(base_env, 'env'):
                    base_env = base_env.env
            else:
                base_env = env
            
            # 受け取ったデータを環境に適用
            await self._apply_request_data_to_env(base_env, request)
            
            # 割り当ての実行
            obs, _ = env.reset()
            done = False
            steps = 0
            max_steps = env_config.get('max_steps', 40)
            
            # 学習済みモデルがあれば使用、なければランダム
            if hasattr(self, 'model') and self.model is not None:
                from stable_baselines3 import PPO
                model = PPO.load("models/scene_based_system/best/best_model.zip")
                
                while not done and steps < max_steps:
                    action, _ = model.predict(obs, deterministic=True)
                    obs, _, done, _, _ = env.step(action)
                    steps += 1
            else:
                # ランダムアクション（デモ用）
                while not done and steps < max_steps:
                    action = env.action_space.sample()
                    obs, _, done, _, _ = env.step(action)
                    steps += 1
            
            # 最終的なスケジュールを取得
            schedule = base_env.schedule[:base_env.num_timeslots, :base_env.num_scenes, :base_env.num_rooms].copy()
            
            # 人物割り当て情報を取得
            people_assignments = self._get_people_assignments(base_env, schedule)
            
            # 最適化されたスケジュールを生成
            optimized_sessions = self._convert_schedule_to_sessions(schedule, base_env, people_assignments)
            
            # メンバー割り当て情報を生成
            member_assignments = self._generate_member_assignments(people_assignments)
            
            # 報酬を計算
            reward = self._calculate_reward(base_env, schedule)
            
            return {
                "optimized_schedule": {
                    "sessions": optimized_sessions
                },
                "reward": float(reward),
                "assignments": {
                    "member_assignments": member_assignments
                }
            }
            
        except Exception as e:
            raise PredictionException(f"スケジュール最適化に失敗しました: {str(e)}")
    
    async def _apply_request_data_to_env(self, base_env, request):
        """受け取ったデータを環境に適用"""
        try:
            # メンバー情報を環境に適用
            if hasattr(base_env, 'people_scene_participation'):
                # メンバー数を設定
                base_env.num_people = len(request.members)
                base_env.max_people = max(base_env.max_people, len(request.members))
                
                # 参加場面と優先度を設定
                for person_idx, member in enumerate(request.members):
                    # 参加場面を設定（簡易版：全場面に参加と仮定）
                    for scene_idx in range(min(base_env.num_scenes, len(request.members))):
                        if scene_idx < base_env.people_scene_participation.shape[1]:
                            base_env.people_scene_participation[person_idx, scene_idx] = 1
                            
                            # 優先度を設定（0-1範囲に正規化）
                            priority_normalized = (member.priority - 1) / 4.0  # 1-5 -> 0-1
                            if scene_idx < base_env.people_scene_priorities.shape[1]:
                                base_env.people_scene_priorities[person_idx, scene_idx] = priority_normalized
            
            # パート名を設定
            if hasattr(base_env, 'part_info'):
                part_names = [member.part for member in request.members]
                base_env.part_info = {'part_names': part_names}
                
        except Exception as e:
            print(f"データ適用エラー: {e}")
    
    def _get_people_assignments(self, base_env, schedule):
        """人物の割り当て情報を取得（visualize_assignments.pyを参考）"""
        people_assignments = {}
        
        if not hasattr(base_env, 'people_scene_participation'):
            return people_assignments
        
        num_timeslots, num_scenes, num_rooms = schedule.shape
        
        for t in range(num_timeslots):
            assigned_people = set()
            
            # 通常の部屋への割り当てを処理
            for s in range(num_scenes):
                for r in range(num_rooms):
                    if schedule[t, s, r] == 1 and s < base_env.num_scenes:
                        # この場面に参加する人物を取得
                        participating_people = []
                        for person_idx in range(base_env.num_people):
                            if (person_idx < base_env.people_scene_participation.shape[0] and 
                                s < base_env.people_scene_participation.shape[1] and
                                base_env.people_scene_participation[person_idx, s] == 1):
                                participating_people.append(person_idx)
                                assigned_people.add(person_idx)
                        
                        if participating_people:
                            key = f't{t}_r{r}_s{s}'
                            people_assignments[key] = participating_people
            
            # 未割り当ての人物を自主部屋に配置
            unassigned_people = []
            for person_idx in range(base_env.num_people):
                if person_idx not in assigned_people:
                    unassigned_people.append(person_idx)
            
            if unassigned_people:
                key = f't{t}_r-1_s-1'
                people_assignments[key] = unassigned_people
        
        return people_assignments
    
    def _convert_schedule_to_sessions(self, schedule, base_env, people_assignments):
        """スケジュールをセッション形式に変換"""
        sessions = []
        num_timeslots, num_scenes, num_rooms = schedule.shape
        
        # パート名を取得
        part_names = []
        if hasattr(base_env, 'part_info') and 'part_names' in base_env.part_info:
            part_names = base_env.part_info['part_names']
        else:
            part_names = [f'パート{i}' for i in range(num_scenes)]
        
        for t in range(num_timeslots):
            for s in range(num_scenes):
                for r in range(num_rooms):
                    if schedule[t, s, r] == 1:
                        # 参加メンバーを取得
                        key = f't{t}_r{r}_s{s}'
                        members = people_assignments.get(key, [])
                        
                        session = {
                            "date": f"2024-01-{t+1:02d}",  # 簡易的な日付
                            "time": f"{9+t*2:02d}:00-{11+t*2:02d}:00",  # 簡易的な時間
                            "venue": f"会場{r}",
                            "members": [str(m) for m in members],
                            "part": part_names[s] if s < len(part_names) else f'パート{s}'
                        }
                        sessions.append(session)
        
        return sessions
    
    def _generate_member_assignments(self, people_assignments):
        """メンバー割り当て情報を生成"""
        member_assignments = {}
        
        for key, people in people_assignments.items():
            for person_id in people:
                if str(person_id) not in member_assignments:
                    member_assignments[str(person_id)] = []
                member_assignments[str(person_id)].append(key)
        
        return member_assignments
    
    def _calculate_reward(self, base_env, schedule):
        """報酬を計算"""
        try:
            # 完了率を計算
            total_assignments = schedule.sum()
            max_possible = min(base_env.num_scenes * base_env.num_timeslots, 
                             base_env.num_rooms * base_env.num_timeslots)
            completion_rate = total_assignments / max_possible if max_possible > 0 else 0
            
            # 簡易的な報酬計算
            reward = completion_rate * 100  # 完了率を100倍して報酬とする
            
            return reward
        except Exception:
            return 0.0
    
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
