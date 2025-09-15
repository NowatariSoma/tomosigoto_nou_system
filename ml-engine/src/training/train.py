"""
PPOを使った能の練習スケジュール作成の学習スクリプト
場面ベースシステム対応
"""

import hydra
from omegaconf import DictConfig, OmegaConf
import os
import numpy as np
import datetime
import math
from stable_baselines3 import PPO
from stable_baselines3.common.callbacks import CheckpointCallback, EvalCallback
from stable_baselines3.common.vec_env import DummyVecEnv, SubprocVecEnv
from stable_baselines3.common.monitor import Monitor
import logging
from typing import Dict, Any, Optional, List, Union

from src.environment.environment import PracticeScheduleEnv
from src.utils.utils import setup_logging, create_eval_env
from src.mask.wrappers import MaskingWrapper
from stable_baselines3.common.monitor import Monitor


def create_environment_with_dynamic_obs(environment_config: Dict[str, Any], use_masking: bool = True) -> Union[PracticeScheduleEnv, MaskingWrapper]:
    """動的観測空間を持つ環境を作成（場面ベース）"""
    
    # 環境設定を準備
    env_params = {
        "environment_config": environment_config,
        "environment_generator": environment_config.get("environment_generator", "random"),
        "dataset_path": environment_config.get("dataset_path", None),
        "seed": environment_config.get("seed", None),
        "reward_config": environment_config.get("reward_config", {})
    }
    
    # 基本環境を作成
    base_env = PracticeScheduleEnv(**env_params)
    
    # マスク機能を適用するかどうか
    # マスキングを有効化してテスト
    if use_masking:
        env_to_wrap = MaskingWrapper(base_env)
        # print("マスク機能を有効化しました")  # 並列環境で重複ログを削除
    else:
        env_to_wrap = base_env
        # print("マスク機能を無効化しました")  # 並列環境で重複ログを削除

    # モニタで包む（必要なrolloutログのみ有効化）
    try:
        return Monitor(env_to_wrap)
    except Exception:
        return env_to_wrap


def create_parallel_environments(environment_config: Dict[str, Any], use_masking: bool = True, n_envs: int = 8):
    """並列環境を作成（最適化版）"""
    def make_env():
        def _init():
            # 最適化: 環境作成時の重い処理を軽減
            env = create_environment_with_dynamic_obs(environment_config, use_masking)
            # 最適化: 初期化時の不要な計算を削減
            if hasattr(env, '_cached_mask'):
                env._cached_mask = None  # マスクキャッシュをクリア
            return env
        return _init
    
    if n_envs > 1:
        optimal_n_envs = min(n_envs, 64)
        
        if optimal_n_envs <= 8:
            # 少ない環境数ならDummyVecEnv（軽量）
            env_fns = [make_env() for _ in range(optimal_n_envs)]
            print(f"軽量並列環境作成: {optimal_n_envs}環境 (DummyVecEnv)")
            return DummyVecEnv(env_fns)
        else:
            # 多い環境数ならSubprocVecEnv（プロセス並列）
            env_fns = [make_env() for _ in range(optimal_n_envs)]
            print(f"プロセス並列環境作成: {optimal_n_envs}環境 (SubprocVecEnv)")
            return SubprocVecEnv(env_fns)
    else:
        # 単一環境
        return DummyVecEnv([make_env()])

def create_model_with_dynamic_obs(model_config: Dict[str, Any], env, environment_config: Dict[str, Any]) -> PPO:
    """動的観測空間に対応したモデルを作成（場面ベース）"""
    
    # ネットワーク構造を設定（場面ベースに最適化）
    policy_kwargs = model_config.get("policy_kwargs", {})
    
    # 場面ベースシステム用のネットワーク構造
    if "net_arch" not in policy_kwargs:
        policy_kwargs["net_arch"] = [
            dict(
                pi=[256, 256, 128],  # Policy network
                vf=[256, 256, 128]   # Value function network
            )
        ]
    
    model_config["policy_kwargs"] = policy_kwargs
    
    # PPOモデルを作成（CPUを明示的に指定）
    model = PPO(
        policy=model_config.get("policy", "MultiInputPolicy"),
        env=env,
        learning_rate=model_config.get("learning_rate", 0.0003),
        seed=model_config.get("seed", None),  # シード設定を追加
        n_steps=model_config.get("n_steps", 2048),
        batch_size=model_config.get("batch_size", 64),
        n_epochs=model_config.get("n_epochs", 10),
        gamma=model_config.get("gamma", 0.99),
        gae_lambda=model_config.get("gae_lambda", 0.99),
        clip_range=model_config.get("clip_range", 0.2),
        clip_range_vf=model_config.get("clip_range_vf", 0.2),
        ent_coef=model_config.get("ent_coef", 0.01),
        vf_coef=model_config.get("vf_coef", 0.5),
        max_grad_norm=model_config.get("max_grad_norm", 0.5),
        target_kl=model_config.get("target_kl", 0.01),
        tensorboard_log=model_config.get("tensorboard_log", "./ppo_tensorboard_logs/"),  # TensorBoardログは有効化
        policy_kwargs=policy_kwargs,
        device=model_config.get("device", "cpu"),  # 設定ファイルからデバイスを読み込み
        verbose=0  # ログを簡素化（重要な情報のみ表示）
    )
    
    return model


def load_or_create_model(model_config: Dict[str, Any], env, environment_config: Dict[str, Any]) -> PPO:
    """既存モデルから再開するか、新規に作成するかを選択してモデルを返す。

    model_config keys used:
      - resume_from_model: 既存モデルのzipパス（例: models/base_model/base_model10000000.zip）
      - device: cpu/cuda
    """
    resume_path = model_config.get("resume_from_model")

    if isinstance(resume_path, str) and len(resume_path) > 0 and os.path.exists(resume_path):
        print("\n=== 既存モデルから再開 ===")
        print(f"  モデルパス: {resume_path}")
        try:
            # 既存モデルを環境付きでロード
            model = PPO.load(resume_path, env=env, device=model_config.get("device", "cpu"))
            prev_steps = getattr(model, "num_timesteps", None)
            if prev_steps is not None:
                print(f"  これまでの学習ステップ: {prev_steps:,}")
            else:
                print("  これまでの学習ステップ: 不明")
            return model
        except Exception as e:
            print(f"  既存モデルのロードに失敗しました（新規作成にフォールバック）: {e}")
            # フォールバックで新規作成
            return create_model_with_dynamic_obs(model_config, env, environment_config)
    else:
        # 新規作成
        return create_model_with_dynamic_obs(model_config, env, environment_config)


def train_with_configs(
    model_config: Dict[str, Any],
    reward_config: Dict[str, Any],
    environment_config: Dict[str, Any],
    config_name: str = "scene_based_training",
    save_result: bool = True,
    result_dir: str = "result",
    use_masking: bool = True
) -> Dict[str, Any]:
    """
    設定ベースの学習を実行（場面ベース）
    
    Args:
        model_config: モデル設定
        reward_config: 報酬設定
        environment_config: 環境設定
        config_name: 設定名
        save_result: 結果を保存するか
        result_dir: 結果保存ディレクトリ
        use_masking: 行動マスキングを使用するか
        
    Returns:
        学習結果
    """
    start_time = datetime.datetime.now()
    
    # グローバルシード設定（再現性確保）
    seed = model_config.get("seed", environment_config.get("seed", None))
    if seed is not None:
        import random
        import numpy as np
        import torch
        random.seed(seed)
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed(seed)
            torch.cuda.manual_seed_all(seed)
        print(f"シード設定: {seed}")
    
    print("=== 場面ベース学習を開始します ===")
    print(f"設定名: {config_name}")
    print(f"開始時刻: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 設定内容を詳細表示
    print("\n=== 詳細設定内容 ===")
    
    print("\n--- 環境設定 ---")
    print(f"  最大部屋数: {environment_config.get('max_rooms', 'N/A')}")
    print(f"  最大場面数: {environment_config.get('max_scenes', 'N/A')}")
    # 時間帯数は max_timeslots を優先表示。未設定の場合は ceil(max_scenes / max_rooms) を表示
    max_rooms_cfg = environment_config.get('max_rooms', 0)
    max_scenes_cfg = environment_config.get('max_scenes', 0)
    max_timeslots_cfg = environment_config.get('max_timeslots', None)
    if max_timeslots_cfg is not None:
        timeslots_str = str(max_timeslots_cfg)
    else:
        denom = max(1, int(max_rooms_cfg) if isinstance(max_rooms_cfg, int) else 1)
        numer = int(max_scenes_cfg) if isinstance(max_scenes_cfg, int) else 0
        timeslots_str = str(math.ceil(numer / denom))
    print(f"  時間帯数: {timeslots_str}")
    print(f"  最大ステップ数: {environment_config.get('max_steps', 'N/A')}")
    
    # 場面設定
    scenes = environment_config.get("scenes", [])
    if scenes:
        print(f"  場面数: {len(scenes)}")
        scene_names = [scene["name"] for scene in scenes[:5]]  # 最初の5つ
        print(f"  場面一覧: {', '.join(scene_names)}")
        if len(scenes) > 5:
            print(f"    ...他{len(scenes)-5}個")
    
    print("\n--- モデル設定 ---")
    print(f"  ポリシー: {model_config.get('policy', 'N/A')}")
    print(f"  学習率: {model_config.get('learning_rate', 'N/A')}")
    print(f"  総ステップ数: {model_config.get('total_timesteps', 'N/A'):,}")
    print(f"  バッチサイズ: {model_config.get('batch_size', 'N/A')}")
    print(f"  エポック数: {model_config.get('n_epochs', 'N/A')}")
    
    print("\n--- 報酬設定（入力） ---")
    # 新しい報酬設定構造に対応して詳細表示
    basic_rewards = reward_config.get('basic_rewards', {})
    quality_rewards = reward_config.get('quality_rewards', {})
    completion_rewards = reward_config.get('completion_rewards', {})
    person_constraints = reward_config.get('person_constraints', {})
    reward_weights = reward_config.get('reward_weights', {})

    def _fmt(d):
        return ", ".join([f"{k}: {v}" for k, v in d.items()]) if d else "(なし)"

    print(f"  basic_rewards: {_fmt(basic_rewards)}")
    print(f"  quality_rewards: {_fmt(quality_rewards)}")
    print(f"  person_constraints: {_fmt(person_constraints)}")
    print(f"  completion_rewards: {_fmt(completion_rewards)}")
    print(f"  reward_weights: {_fmt(reward_weights)}")
    
    # 並列環境を作成
    # 環境作成ログは簡素化
    print("\n=== 環境作成 ===")
    n_envs = model_config.get('n_envs', 1)
    
    # 最適化: n_envsがNoneの場合のフォールバック処理
    if n_envs is None:
        print("[WARNING] n_envsが設定されていません。デフォルト値1を使用します。")
        n_envs = 1
    
    # 環境に報酬設定を確実に伝播させる
    environment_config_with_reward = dict(environment_config or {})
    environment_config_with_reward['reward_config'] = reward_config or {}

    if n_envs > 1:
        env = create_parallel_environments(environment_config_with_reward, use_masking, n_envs)
        # 最適化: 並列環境の詳細情報を表示
        actual_n_envs = env.num_envs if hasattr(env, 'num_envs') else n_envs
        env_type = type(env).__name__
        print(f"並列環境作成完了: {actual_n_envs}環境並列, {env_type}")
    else:
        env = create_environment_with_dynamic_obs(environment_config_with_reward, use_masking)
        print(f"単一環境作成完了: {type(env).__name__}")
    
    # モデルを作成/または既存モデルから再開
    # print("\n=== モデル作成 ===")
    model = load_or_create_model(model_config, env, environment_config)
    # print(f"モデル作成完了: {type(model).__name__}")
    
    # コールバックを設定
    callbacks = []
    
    # チェックポイント保存
    checkpoint_callback = CheckpointCallback(
        save_freq=model_config.get("save_freq", 100000),
        save_path=f"./models/{config_name}/",
        name_prefix=f"{config_name}_model"
    )
    callbacks.append(checkpoint_callback)
    
    # 評価コールバック
    if model_config.get("eval_freq", 0) > 0:
        # print("=== 評価環境作成 ===")
        # トレーニング環境のタイプに合わせる、ログ抑制
        use_subproc_eval = n_envs > 1
        eval_env = create_eval_env(environment_config, use_masking, n_envs=n_envs if use_subproc_eval else 1, use_subproc=use_subproc_eval, verbose=False)
        # print("評価環境作成完了")
        
        print("=== 評価コールバック設定 ===")
        eval_callback = EvalCallback(
            eval_env,
            best_model_save_path=f"./models/{config_name}/best/",
            log_path=f"./logs/{config_name}/",
            eval_freq=model_config["eval_freq"],
            n_eval_episodes=model_config.get("n_eval_episodes", 10),
            deterministic=True,
            render=False
        )
        callbacks.append(eval_callback)
        print(f"評価コールバック設定完了: eval_freq={model_config['eval_freq']}, n_eval_episodes={model_config.get('n_eval_episodes', 10)}")
    

    
    # 学習を実行
    print("\n=== 学習開始 ===")
    total_timesteps = model_config.get("total_timesteps", 1000000)
    
    try:
        # 追加学習時は reset_num_timesteps=False を推奨
        reset_num_timesteps = model_config.get("reset_num_timesteps", False)
        tb_log_name = model_config.get("tb_log_name", None)
        if tb_log_name:
            print(f"TensorBoardログ名: {tb_log_name}")
        model.learn(
            total_timesteps=total_timesteps,
            callback=callbacks,
            progress_bar=True,
            reset_num_timesteps=reset_num_timesteps,
            tb_log_name=tb_log_name,
        )
        print("学習完了")
        
        # 結果を保存
        if save_result:
            save_training_result(
                model, env, model_config, reward_config, environment_config,
                config_name, result_dir, start_time
            )
        
        # 学習結果を返す
        result = {
            "config_name": config_name,
            "total_timesteps": total_timesteps,
            "start_time": start_time.isoformat(),
            "end_time": datetime.datetime.now().isoformat(),
            "model_path": f"./models/{config_name}/",
            "success": True
        }
        
        return result
        
    except Exception as e:
        print(f"学習中にエラーが発生しました: {e}")
        result = {
            "config_name": config_name,
            "total_timesteps": total_timesteps,
            "start_time": start_time.isoformat(),
            "end_time": datetime.datetime.now().isoformat(),
            "error": str(e),
            "success": False
        }
        return result


def save_training_result(
    model: PPO,
    env: Union[PracticeScheduleEnv, MaskingWrapper],
    model_config: Dict[str, Any],
    reward_config: Dict[str, Any],
    environment_config: Dict[str, Any],
    config_name: str,
    result_dir: str,
    start_time: datetime.datetime
):
    """学習結果を保存"""
    
    # 結果ディレクトリを作成
    os.makedirs(result_dir, exist_ok=True)
    
    # モデルを保存
    model_path = f"{result_dir}/{config_name}_final_model.zip"
    model.save(model_path)
    print(f"モデルを保存しました: {model_path}")
    
    # 設定を保存
    config_path = f"{result_dir}/{config_name}_config.json"
    config_data = {
        "model_config": model_config,
        "reward_config": reward_config,
        "environment_config": environment_config,
        "training_info": {
            "config_name": config_name,
            "start_time": start_time.isoformat(),
            "end_time": datetime.datetime.now().isoformat()
        }
    }
    
    import json
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config_data, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"設定を保存しました: {config_path}")


@hydra.main(version_base=None, config_path="../configs", config_name="model")
def main(cfg: DictConfig):
    """メイン関数"""
    
    # 設定を辞書に変換
    config = OmegaConf.to_container(cfg, resolve=True)
    
    # 学習を実行
    result = train_with_configs(
        model_config=config,
        reward_config={},  # デフォルト報酬設定
        environment_config={},  # デフォルト環境設定
        config_name="scene_based_default",
        save_result=True
    )
    
    if result["success"]:
        print("\n=== 学習完了 ===")
        print(f"結果保存先: {result['model_path']}")
    else:
        print("\n=== 学習失敗 ===")
        print(f"エラー: {result['error']}")


if __name__ == "__main__":
    main()


 