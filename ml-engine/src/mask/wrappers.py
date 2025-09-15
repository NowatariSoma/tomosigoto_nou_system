"""
行動マスク対応のラッパー
"""

import gymnasium as gym
import numpy as np
from typing import Any, Dict, Tuple, Optional, TYPE_CHECKING

from .action_masking import get_action_mask

if TYPE_CHECKING:
    from src.environment.environment import PracticeScheduleEnv


class MaskingWrapper(gym.Wrapper):
    """
    行動マスクを適用する環境ラッパー
    """
    
    def __init__(self, env: "PracticeScheduleEnv"):
        """
        初期化
        
        Args:
            env: ラップする環境
        """
        super().__init__(env)
        self.env = env
        
        # 行動マスク用の観測空間を追加
        self.observation_space = gym.spaces.Dict({
            **env.observation_space.spaces,
            'action_mask': gym.spaces.Box(
                low=0, high=1, 
                shape=(env.action_space.n,), 
                dtype=np.int8
            )
        })
    
    def reset(self, **kwargs) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        環境をリセットし、初期観測にマスクを追加
        
        Returns:
            観測辞書（マスク付き）とinfo辞書
        """
        obs, info = self.env.reset(**kwargs)
        
        # 行動マスクを計算して観測に追加
        action_mask = get_action_mask(self.env)
        obs['action_mask'] = action_mask.astype(np.int8)
        
        return obs, info
    
    def step(self, action: int) -> Tuple[Dict[str, Any], float, bool, bool, Dict[str, Any]]:
        """
        行動を実行し、次の観測にマスクを追加
        
        Args:
            action: 実行する行動
            
        Returns:
            観測辞書（マスク付き）、報酬、終了フラグ、切り詰めフラグ、info辞書
        """
        # 行動の有効性をチェックし、無効な場合は有効な行動に置き換え
        current_mask = get_action_mask(self.env)
        if not current_mask[action]:
            # 有効な行動を探す
            valid_actions = np.where(current_mask)[0]
            if len(valid_actions) > 0:
                original_action = action
                # ランダムではなく最初の有効行動を使用（安定性重視）
                action = int(valid_actions[0])
                # ログ量を抑えるため詳細ログはinfo経由に限定
            else:
                # 有効な行動が全く無ければそのまま実行（環境側のフォールバックに委ねる）
                pass
        
        # 行動を実行
        obs, reward, done, truncated, info = self.env.step(action)
        
        # 新しい状態での行動マスクを計算
        action_mask = get_action_mask(self.env)
        obs['action_mask'] = action_mask.astype(np.int8)
        
        # マスク情報をinfoに追加（デバッグ用）
        info['action_mask'] = action_mask
        info['valid_actions'] = int(np.sum(action_mask))
        info['selected_action'] = action
        
        return obs, reward, done, truncated, info
    
    def get_action_mask(self) -> np.ndarray:
        """
        現在の状態での行動マスクを取得
        
        Returns:
            np.ndarray: 行動マスク
        """
        return get_action_mask(self.env)
    
    def seed(self, seed=None):
        """
        環境のシードを設定
        
        Args:
            seed: シード値
            
        Returns:
            シード値のリスト
        """
        return self.env.seed(seed)
    
    def sample_valid_action(self) -> int:
        """
        有効な行動からランダムに1つを選択
        
        Returns:
            int: 有効な行動のインデックス
        """
        mask = self.get_action_mask()
        valid_actions = np.where(mask)[0]
        
        if len(valid_actions) > 0:
            return np.random.choice(valid_actions)
        else:
            # フォールバック：最初の行動を返す
            return 0


 
