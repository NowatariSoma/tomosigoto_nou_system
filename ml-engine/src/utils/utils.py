"""
能の練習表作成システム ユーティリティ関数
場面ベースシステム対応
"""

import logging
import os
import json
import yaml
import numpy as np
from typing import Dict, Any, Optional, List
from stable_baselines3.common.vec_env import DummyVecEnv
from stable_baselines3.common.monitor import Monitor
from src.environment.environment import PracticeScheduleEnv
from src.mask.action_masking import get_scene_assignment_stats
import math


def setup_logging(level: str = "INFO", log_file: str = "training.log") -> None:
    """
    ログ設定を初期化
    
    Args:
        level: ログレベル
        log_file: ログファイル名
    """
    logging.basicConfig(
        level=getattr(logging, level),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler(log_file, encoding='utf-8')
        ]
    )


def create_eval_env(
    environment_config: Dict[str, Any], 
    use_masking: bool = True,
    n_envs: int = 1,
    use_subproc: bool = False,
    verbose: bool = True
) -> DummyVecEnv:
    """
    評価用の環境を作成（場面ベース）
    
    Args:
        environment_config: 環境設定
        use_masking: 行動マスキングを使用するか
        n_envs: 並列環境数（評価用は通常1）
        use_subproc: SubprocVecEnvを使用するか
        verbose: 詳細ログを出力するか
        
    Returns:
        評価用の環境
    """
    if verbose:
        print("=== 評価環境作成開始 ===")
        print(f"環境設定: {environment_config}")
    
    def make_env():
        if verbose:
            print("  - 評価環境インスタンス作成中...")
        
        try:
            # 学習環境と同じ方法で環境設定を準備（評価用に一部制限）
            eval_environment_config = environment_config.copy()
            eval_environment_config["max_steps"] = min(environment_config.get("max_steps", 50), 30)  # 評価用に制限
            
            env_params = {
                "environment_config": eval_environment_config,
                "environment_generator": eval_environment_config.get("environment_generator", "random"),
                "dataset_path": eval_environment_config.get("dataset_path", None),
                "seed": eval_environment_config.get("seed", 42),  # デフォルト値を設定
                "reward_config": eval_environment_config.get("reward_config", {})
            }
            if verbose:
                print(f"  - 評価用max_steps制限: {eval_environment_config['max_steps']}")
            
            # 新しい環境を作成（学習環境と同じ方法）
            eval_env = PracticeScheduleEnv(**env_params)
            eval_env._is_evaluation = True  # 評価環境フラグを設定
            if verbose:
                print("  - PracticeScheduleEnv作成完了")
            
            # マスキングラッパーを適用
            if use_masking:
                if verbose:
                    print("  - マスキングラッパー適用中...")
                from src.mask.wrappers import MaskingWrapper
                eval_env = MaskingWrapper(eval_env)
                if verbose:
                    print("  - マスキングラッパー適用完了")
            
            # Monitorで包む
            if verbose:
                print("  - Monitorラッパー適用中...")
            eval_env = Monitor(eval_env)
            if verbose:
                print("  - Monitorラッパー適用完了")
            
            if verbose:
                print("  - 評価環境作成完了")
            return eval_env
            
        except Exception as e:
            if verbose:
                print(f"  ❌ 評価環境作成エラー: {e}")
                import traceback
                print(f"  詳細エラー: {traceback.format_exc()}")
            raise e
    
    if verbose:
        print("  - DummyVecEnv作成中...")
    
    # 並列環境数の処理（評価用は通常1環境）
    if n_envs > 1 and use_subproc:
        # 複数環境が必要な場合はSubprocVecEnvを使用
        from stable_baselines3.common.vec_env import SubprocVecEnv
        vec_env = SubprocVecEnv([make_env for _ in range(n_envs)])
        if verbose:
            print(f"  - SubprocVecEnv作成完了: {n_envs}環境")
    else:
        # 通常はDummyVecEnvを使用
        vec_env = DummyVecEnv([make_env])
        if verbose:
            print("  - DummyVecEnv作成完了: 1環境")
    
    if verbose:
        print("=== 評価環境作成完了 ===")
    
    return vec_env


def ensure_directory(path: str) -> None:
    """
    ディレクトリが存在しない場合は作成
    
    Args:
        path: ディレクトリパス
    """
    if not os.path.exists(path):
        os.makedirs(path)


def save_config(config: Dict[str, Any], path: str) -> None:
    """
    設定をファイルに保存
    
    Args:
        config: 設定辞書
        path: 保存先パス
    """
    # ファイル拡張子に応じて保存形式を決定
    if path.endswith('.yaml') or path.endswith('.yml'):
        with open(path, 'w', encoding='utf-8') as f:
            yaml.dump(config, f, default_flow_style=False, allow_unicode=True)
    elif path.endswith('.json'):
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False, default=str)
    else:
        # デフォルトはYAML
        with open(path, 'w', encoding='utf-8') as f:
            yaml.dump(config, f, default_flow_style=False, allow_unicode=True)


def load_config(path: str) -> Dict[str, Any]:
    """
    設定ファイルを読み込み
    
    Args:
        path: 設定ファイルのパス
        
    Returns:
        設定辞書
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"設定ファイルが見つかりません: {path}")
    
    # ファイル拡張子に応じて読み込み形式を決定
    if path.endswith('.yaml') or path.endswith('.yml'):
        with open(path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    elif path.endswith('.json'):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        # デフォルトはYAML
        with open(path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)


def calculate_scene_metrics(env: PracticeScheduleEnv) -> Dict[str, Any]:
    """
    場面ベースのメトリクスを計算
    
    Args:
        env: 環境
        
    Returns:
        メトリクス辞書
    """
    # 基本的な統計情報を取得
    scene_stats = get_scene_assignment_stats(env)
    
    # スケジュールの品質指標を計算
    schedule_quality = calculate_schedule_quality(env)
    
    # 監督品質を計算
    supervision_quality = calculate_supervision_quality(env)
    
    # 時間効率を計算
    time_efficiency = calculate_time_efficiency(env)
    
    metrics = {
        "scene_assignment": scene_stats,
        "schedule_quality": schedule_quality,
        "supervision_quality": supervision_quality,
        "time_efficiency": time_efficiency,
        "overall_score": 0.0
    }
    
    # 総合スコアを計算
    overall_score = (
        scene_stats["completion_rate"] * 0.4 +
        supervision_quality["coverage_rate"] * 0.3 +
        time_efficiency["utilization_rate"] * 0.2 +
        schedule_quality["balance_score"] * 0.1
    )
    metrics["overall_score"] = overall_score
    
    return metrics


def calculate_schedule_quality(env: PracticeScheduleEnv) -> Dict[str, float]:
    """
    スケジュールの品質を計算
    
    Args:
        env: 環境
        
    Returns:
        品質指標辞書
    """
    schedule = env.schedule
    
    # 部屋の使用バランスを計算
    room_usage = np.sum(schedule, axis=(0, 1))  # 各部屋の総使用回数
    if np.sum(room_usage) > 0:
        balance_score = 1.0 - np.std(room_usage) / np.mean(room_usage)
        balance_score = max(0.0, min(1.0, balance_score))  # 0-1の範囲に制限
    else:
        balance_score = 0.0
    
    # 時間帯の使用バランスを計算
    time_usage = np.sum(schedule, axis=(1, 2))  # 各時間帯の総使用回数
    if np.sum(time_usage) > 0:
        time_balance = 1.0 - np.std(time_usage) / np.mean(time_usage)
        time_balance = max(0.0, min(1.0, time_balance))
    else:
        time_balance = 0.0
    
    return {
        "balance_score": balance_score,
        "time_balance": time_balance,
        "total_assignments": int(np.sum(schedule))
    }


def calculate_supervision_quality(env: PracticeScheduleEnv) -> Dict[str, float]:
    """
    監督品質を計算
    
    Args:
        env: 環境
        
    Returns:
        監督品質指標辞書
    """
    schedule = env.schedule
    supervision_status = env.supervision_status
    
    # 監督が必要な場面の数を計算
    total_supervision_needed = 0
    total_supervision_provided = 0
    
    for time in range(env.num_timeslots):
        for room in range(env.max_rooms):
            # この部屋・時間帯に場面がいるかチェック
            scenes_in_room = np.where(schedule[time, :, room] == 1)[0]
            if len(scenes_in_room) > 0:
                total_supervision_needed += 1
                
                # 監督場面がいるかチェック
                if np.sum(supervision_status[time, :, room]) > 0:
                    total_supervision_provided += 1
    
    # 監督カバレッジ率を計算
    coverage_rate = (total_supervision_provided / total_supervision_needed 
                    if total_supervision_needed > 0 else 0.0)
    
    return {
        "coverage_rate": coverage_rate,
        "total_sessions": total_supervision_needed,
        "supervised_sessions": total_supervision_provided
    }


def calculate_time_efficiency(env: PracticeScheduleEnv) -> Dict[str, float]:
    """
    時間効率を計算
    
    Args:
        env: 環境
        
    Returns:
        時間効率指標辞書
    """
    schedule = env.schedule
    
    # 使用された時間帯の数を計算
    used_timeslots = 0
    total_assignments = 0
    
    for time in range(env.num_timeslots):
        time_assignments = np.sum(schedule[time, :, :])
        if time_assignments > 0:
            used_timeslots += 1
            total_assignments += time_assignments
    
    # 時間帯利用率
    utilization_rate = used_timeslots / env.num_timeslots if env.num_timeslots > 0 else 0.0
    
    # 平均割り当て密度
    avg_density = (total_assignments / used_timeslots 
                  if used_timeslots > 0 else 0.0)
    
    return {
        "utilization_rate": utilization_rate,
        "used_timeslots": used_timeslots,
        "total_timeslots": env.num_timeslots,
        "avg_density": avg_density
    }


def print_scene_schedule_summary(env: PracticeScheduleEnv) -> None:
    """
    場面スケジュールの概要を表示
    
    Args:
        env: 環境
    """
    print("\n" + "="*60)
    print("場面スケジュール概要")
    print("="*60)
    
    # 基本情報
    print(f"場面数: {env.num_scenes}")
    print(f"部屋数: {env.max_rooms}")
    print(f"時間帯数: {env.num_timeslots}")
    
    # 完了状況
    completion_rate = np.sum(env.scene_status) / env.num_scenes
    print(f"完了率: {completion_rate:.2%}")
    
    # 各時間帯の状況
    print(f"\n時間帯別状況:")
    for time in range(min(5, env.num_timeslots)):  # 最初の5時間帯のみ表示
        time_assignments = np.sum(env.schedule[time, :, :])
        print(f"  時間帯 {time}: {time_assignments} 場面割り当て")
    
    # 各場面の状況
    print(f"\n場面別状況:")
    for i, scene in enumerate(env.scenes):
        scene_name = scene["name"]
        is_assigned = env.scene_status[i]
        status = "割り当て済み" if is_assigned else "未割り当て"
        print(f"  {scene_name}: {status}")
    
    # 部屋別状況
    print(f"\n部屋別状況:")
    for room in range(min(3, env.max_rooms)):  # 最初の3部屋のみ表示
        room_assignments = np.sum(env.schedule[:, :, room])
        print(f"  部屋 {room}: {room_assignments} 場面割り当て")
    
    print("="*60)


def save_scene_schedule(env: PracticeScheduleEnv, filepath: str) -> None:
    """
    場面スケジュールをファイルに保存
    
    Args:
        env: 環境
        filepath: 保存先ファイルパス
    """
    schedule_data = {
        "metadata": {
            "num_scenes": env.num_scenes,
            "num_rooms": env.max_rooms,
            "num_timeslots": env.num_timeslots,
            "completion_rate": float(np.sum(env.scene_status) / env.num_scenes)
        },
        "scenes": [
            {
                "name": scene["name"],
                "category": scene["category"],
                "priority": scene["priority"],
                "is_supervisor": scene["is_supervisor"],
                "is_assigned": bool(env.scene_status[i])
            }
            for i, scene in enumerate(env.scenes)
        ],
        "schedule": env.schedule.tolist(),
        "supervision_status": env.supervision_status.tolist()
    }
    
    # ファイル拡張子に応じて保存形式を決定
    if filepath.endswith('.json'):
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(schedule_data, f, indent=2, ensure_ascii=False)
    else:
        # デフォルトはYAML
        with open(filepath, 'w', encoding='utf-8') as f:
            yaml.dump(schedule_data, f, default_flow_style=False, allow_unicode=True)
    
    print(f"スケジュールを保存しました: {filepath}")


def load_scene_schedule(filepath: str) -> Dict[str, Any]:
    """
    場面スケジュールをファイルから読み込み
    
    Args:
        filepath: ファイルパス
        
    Returns:
        スケジュールデータ辞書
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"スケジュールファイルが見つかりません: {filepath}")
    
    # ファイル拡張子に応じて読み込み形式を決定
    if filepath.endswith('.json'):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        # デフォルトはYAML
        with open(filepath, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)


def validate_scene_config(scene_config: Dict[str, Any]) -> List[str]:
    """
    場面設定の妥当性を検証
    
    Args:
        scene_config: 場面設定
        
    Returns:
        エラーメッセージのリスト
    """
    errors = []
    
    # 必須フィールドのチェック
    required_fields = ["name", "category", "priority"]
    for field in required_fields:
        if field not in scene_config:
            errors.append(f"必須フィールド '{field}' が不足しています")
    
    # 優先度の範囲チェック
    if "priority" in scene_config:
        priority = scene_config["priority"]
        if not isinstance(priority, (int, float)) or priority < 1 or priority > 5:
            errors.append("優先度は1から5の範囲である必要があります")
    
    # 監督場面の設定チェック
    if scene_config.get("is_supervisor", False):
        if "supervision_scenes" not in scene_config:
            errors.append("監督場面には 'supervision_scenes' の設定が必要です")
        elif not isinstance(scene_config["supervision_scenes"], list):
            errors.append("'supervision_scenes' はリストである必要があります")
    
    return errors 