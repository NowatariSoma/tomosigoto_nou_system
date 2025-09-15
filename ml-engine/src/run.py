#!/usr/bin/env python3
"""
練習スケジュール作成AIの単体学習実行スクリプト
設定を引数として受け取り、単体学習を実行します。
"""

import sys
import os
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any

# プロジェクトルートをPythonパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.training.train import train_with_configs

def run_single_training(
    model_config: Dict[str, Any],
    reward_config: Dict[str, Any], 
    environment_config: Dict[str, Any],
    config_name: str = "single_training",
    save_result: bool = True,
    result_dir: str = "result"
) -> Dict[str, Any]:
    """
    単体学習を実行する関数
    
    Args:
        model_config: モデル設定
        reward_config: 報酬設定
        environment_config: 環境設定
        config_name: 設定名（ログ用）
        save_result: 結果をファイルに保存するかどうか
        result_dir: 結果保存ディレクトリ
    
    Returns:
        学習結果
    """
    
    start_time = datetime.now()
    
    print("=== ハード環境単体学習を開始します ===")
    print(f"設定名: {config_name}")
    print(f"開始時刻: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 設定内容は train.py で詳細表示するため、ここでは簡潔に
    # print("\n=== 詳細設定内容 ===")  # 重複ログを削除
    
    print("\n--- 学習開始 ---")
    
    try:
        # 学習を実行
        result = train_with_configs(
            model_config=model_config,
            reward_config=reward_config,
            environment_config=environment_config,
            config_name=config_name,
            save_result=save_result,
            result_dir=result_dir,
            use_masking=True
        )
        
        end_time = datetime.now()
        training_duration = end_time - start_time
        
        # 結果を詳細表示
        print(f"\n=== 学習完了 ===")
        print(f"学習時間: {training_duration}")
        print(f"学習成功: {result.get('success', False)}")
        
        if result.get('success', False):
            print(f"最終モデル: {result.get('model_path', 'N/A')}")
            
            # 評価結果を詳細表示
            evaluation = result.get('evaluation', {})
            if evaluation:
                print(f"\n=== 最終評価結果 ===")
                print(f"📊 基本指標:")
                print(f"  成功率: {evaluation.get('success_rate', 0):.1%}")
                print(f"  平均報酬: {evaluation.get('mean_episode_reward', 0):.2f}")
                print(f"  平均割り当て率: {evaluation.get('mean_assignment_rate', 0):.1%}")
                print(f"  平均完了率: {evaluation.get('mean_completion_rate', 0):.1%}")
                print(f"  平均エピソード長: {evaluation.get('mean_episode_length', 0):.1f}")
                
                # 標準偏差も表示
                print(f"\n📈 変動指標:")
                print(f"  報酬標準偏差: {evaluation.get('std_episode_reward', 0):.2f}")
                print(f"  割り当て率標準偏差: {evaluation.get('std_assignment_rate', 0):.1%}")
                print(f"  完了率標準偏差: {evaluation.get('std_completion_rate', 0):.1%}")
                print(f"  エピソード長標準偏差: {evaluation.get('std_episode_length', 0):.1f}")
                
                # 詳細な割り当て率情報
                assignment_rates = evaluation.get('assignment_rates', [])
                if assignment_rates:
                    print(f"\n=== 割り当て率詳細分析 ===")
                    print(f"📋 各エピソードの割り当て率:")
                    for i, rate in enumerate(assignment_rates, 1):
                        status_icon = "🟢" if rate >= 0.8 else "🟡" if rate >= 0.5 else "🔴"
                        print(f"  {status_icon} エピソード{i:2d}: {rate:.1%}")
                    
                    # 分布分析
                    high_rate = sum(1 for rate in assignment_rates if rate >= 0.8)
                    medium_rate = sum(1 for rate in assignment_rates if 0.5 <= rate < 0.8)
                    low_rate = sum(1 for rate in assignment_rates if rate < 0.5)
                    
                    print(f"\n📊 割り当て率分布:")
                    print(f"  🟢 高割り当て率 (80%以上): {high_rate:2d}/{len(assignment_rates)} エピソード ({high_rate/len(assignment_rates):.1%})")
                    print(f"  🟡 中割り当て率 (50-80%):   {medium_rate:2d}/{len(assignment_rates)} エピソード ({medium_rate/len(assignment_rates):.1%})")
                    print(f"  🔴 低割り当て率 (50%未満):   {low_rate:2d}/{len(assignment_rates)} エピソード ({low_rate/len(assignment_rates):.1%})")
                    
                    # 最高・最低割り当て率
                    max_rate = max(assignment_rates)
                    min_rate = min(assignment_rates)
                    print(f"\n🎯 割り当て率範囲:")
                    print(f"  最高割り当て率: {max_rate:.1%}")
                    print(f"  最低割り当て率: {min_rate:.1%}")
                    print(f"  割り当て率範囲: {max_rate - min_rate:.1%}")
                
                # 報酬詳細
                episode_rewards = evaluation.get('episode_rewards', [])
                if episode_rewards:
                    print(f"\n=== 報酬詳細分析 ===")
                    max_reward = max(episode_rewards)
                    min_reward = min(episode_rewards)
                    print(f"🏆 報酬範囲:")
                    print(f"  最高報酬: {max_reward:.2f}")
                    print(f"  最低報酬: {min_reward:.2f}")
                    print(f"  報酬範囲: {max_reward - min_reward:.2f}")
                    
                    # 正の報酬を獲得したエピソード数
                    positive_rewards = sum(1 for reward in episode_rewards if reward > 0)
                    print(f"  正の報酬エピソード: {positive_rewards}/{len(episode_rewards)} ({positive_rewards/len(episode_rewards):.1%})")
                
                # 学習性能の総合評価
                print(f"\n=== 学習性能総合評価 ===")
                success_rate = evaluation.get('success_rate', 0)
                mean_assignment = evaluation.get('mean_assignment_rate', 0)
                
                if success_rate >= 0.8 and mean_assignment >= 0.8:
                    performance = "🌟 優秀"
                elif success_rate >= 0.6 and mean_assignment >= 0.6:
                    performance = "✅ 良好"
                elif success_rate >= 0.4 and mean_assignment >= 0.4:
                    performance = "⚠️ 改善が必要"
                else:
                    performance = "❌ 要再学習"
                
                print(f"総合評価: {performance}")
                print(f"評価基準: 成功率 {success_rate:.1%}, 割り当て率 {mean_assignment:.1%}")
        else:
            print(f"\n❌ 学習エラー詳細:")
            print(f"エラー: {result.get('error', '不明なエラー')}")
            
            # エラー時の詳細情報
            metadata = result.get('metadata', {})
            if metadata:
                print(f"設定名: {metadata.get('config_name', 'N/A')}")
                print(f"学習開始時刻: {metadata.get('start_time', 'N/A')}")
                print(f"エラー発生時刻: {metadata.get('end_time', 'N/A')}")
        
        print(f"\n=== 学習セッション終了 ===")
        print(f"設定名: {config_name}")
        print(f"総実行時間: {training_duration}")
        print(f"実行完了時刻: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # 結果にメタデータを追加
        result['metadata'] = result.get('metadata', {})
        result['metadata'].update({
            'config_name': config_name,
            'training_duration': str(training_duration),
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat()
        })
        
        # 結果をファイルに保存
        if save_result:
            # resultディレクトリを作成（存在しない場合）
            os.makedirs(result_dir, exist_ok=True)
            
            # 結果ファイル名を生成
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            result_filename = f"{result_dir}/{config_name}_training_result_{timestamp}.json"
            
            # JSONファイルに保存
            with open(result_filename, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            
            print(f"\n💾 結果保存:")
            print(f"結果ファイル保存完了: {result_filename}")
        else:
            print(f"\n💾 結果保存:")
            print(f"結果保存はスキップされました（save_result=False）")
        
        return result
        
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        
        error_result = {
            "success": False,
            "error": str(e),
            "training_time": datetime.now().isoformat(),
            "metadata": {
                'config_name': config_name,
                'training_duration': str(datetime.now() - start_time),
                'start_time': start_time.isoformat(),
                'end_time': datetime.now().isoformat()
            }
        }
        
        # エラー時も結果を保存
        if save_result:
            os.makedirs(result_dir, exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            result_filename = f"{result_dir}/{config_name}_error_result_{timestamp}.json"
            
            with open(result_filename, 'w', encoding='utf-8') as f:
                json.dump(error_result, f, indent=2, ensure_ascii=False)
            
            print(f"\n💾 エラー結果保存完了: {result_filename}")
        
        return error_result

def main():
    """デフォルト設定での学習を実行（後方互換性のため）"""
    print("=== デフォルト設定での単体学習 ===")
    
    # デフォルト設定
    default_model_config = {
        "policy": "MultiInputPolicy",
        "learning_rate": 0.0001,
        "n_steps": 2048,
        "batch_size": 64,
        "n_epochs": 10,
        "gamma": 0.99,
        "gae_lambda": 0.95,
        "clip_range": 0.2,
        "ent_coef": 0.05,
        "vf_coef": 0.5,
        "max_grad_norm": 0.5,
        "tensorboard_log": "./ppo_tensorboard_logs/",
        "total_timesteps": 100000,
        "save_freq": 10000,
        "eval_freq": 5000,
        "n_eval_episodes": 10
    }
    
    default_environment_config = {
        "num_people": 10,
        "num_rooms": 3,
        "num_timeslots": 4,
        "room_capacity": 6,
        "max_steps": 50
    }
    
    default_reward_config = {
        "type": "basic",
        "placement_reward": 5.0,
        "step_penalty": -0.05,
        "unassigned_penalty": -1.0,
        "completion_bonus": 20.0,
        "completion_threshold": 0.8
    }
    
    result = run_single_training(
        model_config=default_model_config,
        reward_config=default_reward_config,
        environment_config=default_environment_config,
        config_name="default"
    )
    
    return result

if __name__ == "__main__":
    main()
