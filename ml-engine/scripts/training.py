#!/usr/bin/env python3
"""
能の練習表作成システム 単体学習を実行するスクリプト
設定ファイルを読み込んで学習を実行します
"""

import sys
import os

# プロジェクトルートをPythonパスに追加
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

import yaml
from src.run import run_single_training

def load_config(config_path):
    """設定ファイルを読み込む"""
    with open(config_path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    return config

def main():
    # 3つの設定ファイルを読み込み
    model_config = load_config("configs/model/model.yaml")
    reward_config = load_config("configs/reward/reward.yaml")
    environment_config = load_config("configs/environment/env.yaml")
    
    # 学習を実行（結果保存も含む）
    run_single_training(
        model_config=model_config,
        reward_config=reward_config,
        environment_config=environment_config,
        config_name="scene_based_system",
        save_result=True,
        result_dir="result"
    )

if __name__ == "__main__":
    main()