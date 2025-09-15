# ML-Engine フォルダ構成案

## 概要
ポート8001でML-Engineを独立サービスとして動作させ、ポート8000のFastAPIバックエンドから呼び出す構成案です。ML機能を独立したサービスとして管理します。

## 元プロジェクト構成の分析
元の `tomosigoto-nou-ai` プロジェクトは強化学習（PPO）ベースのスケジュール最適化システムで、以下の特徴があります：
- **強化学習**: PPO（Proximal Policy Optimization）を使用
- **環境**: スケジュール最適化のためのカスタム環境
- **報酬関数**: シーンベースの報酬システム
- **可視化**: 割り当て結果の可視化機能
- **モデル管理**: ステップベースのモデル保存

## 全体構成

```
tomosigoto_nou_system/
├── backend/                           # 既存バックエンド（ポート8000）
│   ├── app/
│   │   ├── api/
│   │   │   ├── api.py                # 既存API ルーター
│   │   │   └── ml/                   # ML API（/api/v1/ml/*）
│   │   │       ├── __init__.py
│   │   │       ├── routes.py         # ML API エンドポイント（8001番へのプロキシ）
│   │   │       └── schemas.py        # ML リクエスト/レスポンススキーマ
│   │   ├── services/
│   │   │   ├── user_service.py       # 既存サービス
│   │   │   └── ml/                   # ML サービス層（8001番へのHTTPクライアント）
│   │   │       ├── __init__.py
│   │   │       ├── ml_client.py      # ML-Engine HTTPクライアント
│   │   │       ├── schedule_optimizer.py  # スケジュール最適化サービス
│   │   │       └── model_manager.py       # モデル管理サービス
├── ml-engine/                         # ML-Engine独立サービス（ポート8001）
│   ├── app/
│   │   ├── main.py                   # FastAPI メインアプリケーション
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py             # ML API エンドポイント
│   │   │   └── schemas.py            # ML リクエスト/レスポンススキーマ
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── scene_based_optimizer.py  # スケジュール最適化サービス
│   │   │   ├── model_manager.py          # モデル管理サービス
│   │   │   └── visualization_service.py  # 可視化サービス
│   │   └── core/
│   │       ├── __init__.py
│   │       ├── config.py             # ML設定
│   │       └── exceptions.py         # 例外処理
│   ├── configs/                      # 設定ファイル（元プロジェクト構成を踏襲）
│   │   ├── __init__.py
│   │   ├── environment/
│   │   │   └── env.yaml
│   │   ├── model/
│   │   │   ├── __init__.py
│   │   │   └── model.yaml
│   │   └── reward/
│   │       └── reward.yaml
│   ├── models/                       # 学習済みモデル保存（元プロジェクト構成を踏襲）
│   │   ├── saved/                    # 保存済みモデル
│   │   │   └── 01.zip
│   │   ├── scene_based_system/       # シーンベースシステムモデル
│   │   │   ├── best/                 # 最良モデル
│   │   │   ├── scene_based_system_model_16000000_steps.zip
│   │   │   └── scene_based_system_model_8000000_steps.zip
│   │   └── metadata/
│   │       ├── model_registry.json
│   │       └── version_history.json
│   ├── src/                          # ML ソースコード（元プロジェクト構成を踏襲）
│   │   ├── __init__.py
│   │   ├── environment/              # 強化学習環境
│   │   │   ├── __init__.py
│   │   │   └── environment.py        # スケジュール最適化環境
│   │   ├── rewards/                  # 報酬関数
│   │   │   ├── __init__.py
│   │   │   └── scene_based_reward.py # シーンベース報酬
│   │   ├── training/                 # 強化学習トレーニング
│   │   │   ├── __init__.py
│   │   │   ├── ppo_trainer.py
│   │   │   └── evaluator.py
│   │   ├── mask/                     # マスク機能
│   │   │   └── __init__.py
│   │   ├── utils/                    # ML ユーティリティ
│   │   │   ├── __init__.py
│   │   │   ├── visualization.py
│   │   │   ├── config_loader.py
│   │   │   └── logger.py
│   │   └── run.py                    # メイン実行ファイル
│   ├── logs/                         # ログファイル（元プロジェクト構成を踏襲）
│   │   └── scene_based_system/
│   │       └── evaluations.npz
│   ├── outputs/                      # 出力ファイル（元プロジェクト構成を踏襲）
│   │   ├── assignments/              # 割り当て結果
│   │   └── visualizations/           # 可視化結果
│   │       ├── people_assignment_*.png
│   │       ├── schedule_heatmap_*.png
│   │       └── schedule_timeline_*.png
│   ├── ppo_tensorboard_logs/         # PPO TensorBoardログ（元プロジェクト構成を踏襲）
│   │   └── (複数のppo_20M_run_XXフォルダ)
│   ├── result/                       # 結果ファイル（元プロジェクト構成を踏襲）
│   │   ├── scene_based_system_config.json
│   │   ├── scene_based_system_final_model.zip
│   │   └── (複数のトレーニング結果JSONファイル)
│   ├── scripts/                      # 管理スクリプト（元プロジェクト構成を踏襲）
│   │   ├── __init__.py
│   │   ├── training.py               # 強化学習トレーニングスクリプト
│   │   └── visualize_assignments.py  # 割り当て可視化スクリプト
│   ├── tests/                        # ML テスト
│   │   ├── __init__.py
│   │   ├── test_environment.py
│   │   ├── test_rewards.py
│   │   ├── test_training.py
│   │   └── fixtures/
│   │       ├── sample_data.json
│   │       └── test_models/
│   ├── requirements.txt              # ML依存関係
│   ├── Dockerfile                    # ML サービス用
│   ├── ML_COMMANDS_GUIDE.md          # コマンドガイド
│   ├── visualize_assignments_flow.md # 可視化フロー説明
│   ├── モデル設定.md                  # モデル設定説明
│   ├── 構成.md                       # 構成説明
│   └── 設計書.md                     # 設計書
│   │   ├── schemas/
│   │   │   ├── user.py               # 既存スキーマ
│   │   │   └── ml/                   # ML スキーマ
│   │   │       ├── __init__.py
│   │   │       ├── schedule_optimization.py
│   │   │       ├── member_assignment.py
│   │   │       └── model_management.py
│   │   ├── repositories/
│   │   │   ├── user_repository.py    # 既存リポジトリ
│   │   │   └── ml/                   # ML データアクセス
│   │   │       ├── __init__.py
│   │   │       ├── model_repository.py
│   │   │       └── training_data_repository.py
│   │   ├── core/
│   │   │   ├── config.py             # 既存設定
│   │   │   ├── exceptions.py         # 既存例外
│   │   │   └── ml_config.py          # ML設定
│   │   └── main.py                   # 既存メイン
│   ├── tests/                        # 既存テスト
│   ├── requirements.txt              # 既存依存関係（ML依存関係も追加）
│   └── Dockerfile                    # 既存Dockerfile
├── frontend/                         # 既存フロントエンド（ポート3000）
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── learning/                 # 既存学習機能
│   │   └── ml/                       # 新規ML機能
│   │       ├── components/
│   │       │   ├── ScheduleOptimizer.tsx
│   │       │   ├── MemberAssigner.tsx
│   │       │   └── ModelStatus.tsx
│   │       ├── hooks/
│   │       │   ├── useScheduleOptimization.ts
│   │       │   ├── useMemberAssignment.ts
│   │       │   └── useModelStatus.ts
│   │       └── types/
│   │           ├── schedule.ts
│   │           ├── member.ts
│   │           └── model.ts
│   └── lib/
├── supabase/                         # 既存Supabaseモジュール
│   ├── config.toml
│   ├── migrations/
│   └── seeds/
└── shared/                           # 共通ライブラリ
    ├── types/
    │   ├── schedule.ts
    │   ├── member.ts
    │   └── ml.ts
    └── utils/
        ├── api.ts
        └── validation.ts
```

## 主要ファイルの詳細

### 1. ML-Engine設定ファイル
```toml
# ml-engine/app/core/config.py
[ml_engine]
project_id = "tomosigoto_ml_engine"
version = "1.0.0"
port = 8001
host = "0.0.0.0"

[api]
enabled = true
base_url = "http://127.0.0.1:8001"
max_workers = 4

[models]
scene_based_system = {
    enabled = true,
    version = "latest",
    model_path = "./models/scene_based_system/best",
    endpoint = "/predict/schedule-optimization",
    type = "reinforcement_learning"
}

[reinforcement_learning]
algorithm = "PPO"
environment = "scene_based_system"
reward_function = "scene_based_reward"
max_steps = 20000000
checkpoint_interval = 1000000

[data]
sources = ["supabase", "csv", "json"]
supabase_url = "http://127.0.0.1:54321"
supabase_key = "env(SUPABASE_ANON_KEY)"

[visualization]
output_path = "./outputs/visualizations"
formats = ["png", "svg"]
include_heatmap = true
include_timeline = true
include_assignments = true
```

### 2. バックエンドML設定ファイル
```toml
# backend/app/core/ml_config.py
[ml_integration]
ml_engine_url = "http://127.0.0.1:8001"
timeout = 30
retry_attempts = 3

[ml_services]
schedule_optimization = {
    endpoint = "/predict/schedule-optimization",
    timeout = 60
}
model_training = {
    endpoint = "/train/scene-based-system",
    timeout = 3600
}
visualization = {
    endpoint = "/visualize/assignments",
    timeout = 30
}
```

### 3. バックエンドML API ルーター（8001番へのプロキシ）
```python
# backend/app/api/ml/routes.py
from fastapi import APIRouter, HTTPException
from app.services.ml.ml_client import MLClient
from app.schemas.ml.schedule_optimization import ScheduleOptimizationRequest

ml_router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@ml_router.post("/predict/schedule-optimization")
async def optimize_schedule(request: ScheduleOptimizationRequest):
    """スケジュール最適化API（8001番へのプロキシ）"""
    client = MLClient()
    return await client.optimize_schedule(request)

@ml_router.post("/train/scene-based-system")
async def train_model():
    """強化学習モデル学習API（8001番へのプロキシ）"""
    client = MLClient()
    return await client.train_model()

@ml_router.get("/models/status")
async def get_models_status():
    """モデル状態確認API（8001番へのプロキシ）"""
    client = MLClient()
    return await client.get_model_status()

@ml_router.get("/visualize/assignments")
async def visualize_assignments(schedule_id: str):
    """割り当て結果可視化API（8001番へのプロキシ）"""
    client = MLClient()
    return await client.visualize_assignments(schedule_id)
```

### 4. ML-Engine API ルーター（8001番で動作）
```python
# ml-engine/app/api/routes.py
from fastapi import APIRouter, HTTPException
from app.services.scene_based_optimizer import SceneBasedOptimizerService
from app.api.schemas import ScheduleOptimizationRequest

ml_router = APIRouter(prefix="/api/v1", tags=["Machine Learning"])

@ml_router.post("/predict/schedule-optimization")
async def optimize_schedule(request: ScheduleOptimizationRequest):
    """スケジュール最適化API（強化学習ベース）"""
    service = SceneBasedOptimizerService()
    return await service.optimize(request)

@ml_router.post("/train/scene-based-system")
async def train_model():
    """強化学習モデル学習API"""
    service = SceneBasedOptimizerService()
    return await service.train()

@ml_router.get("/models/status")
async def get_models_status():
    """モデル状態確認API"""
    service = SceneBasedOptimizerService()
    return await service.get_model_status()

@ml_router.get("/visualize/assignments")
async def visualize_assignments(schedule_id: str):
    """割り当て結果可視化API"""
    service = SceneBasedOptimizerService()
    return await service.visualize_assignments(schedule_id)
```

### 5. バックエンドML クライアント（8001番へのHTTPクライアント）
```python
# backend/app/services/ml/ml_client.py
import httpx
from app.core.ml_config import settings
from app.schemas.ml.schedule_optimization import ScheduleOptimizationRequest

class MLClient:
    def __init__(self):
        self.base_url = settings.ml_integration.ml_engine_url
        self.timeout = settings.ml_integration.timeout
    
    async def optimize_schedule(self, request: ScheduleOptimizationRequest):
        """スケジュール最適化（8001番へのHTTPリクエスト）"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/v1/predict/schedule-optimization",
                json=request.dict()
            )
            response.raise_for_status()
            return response.json()
    
    async def train_model(self):
        """強化学習モデル学習（8001番へのHTTPリクエスト）"""
        async with httpx.AsyncClient(timeout=3600) as client:
            response = await client.post(
                f"{self.base_url}/api/v1/train/scene-based-system"
            )
            response.raise_for_status()
            return response.json()
    
    async def get_model_status(self):
        """モデル状態確認（8001番へのHTTPリクエスト）"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/api/v1/models/status"
            )
            response.raise_for_status()
            return response.json()
    
    async def visualize_assignments(self, schedule_id: str):
        """割り当て結果可視化（8001番へのHTTPリクエスト）"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/api/v1/visualize/assignments",
                params={"schedule_id": schedule_id}
            )
            response.raise_for_status()
            return response.json()
```

### 6. ML-Engine サービス層（8001番で動作）
```python
# ml-engine/app/services/scene_based_optimizer.py
from src.environment.environment import ScheduleOptimizationEnv
from src.rewards.scene_based_reward import SceneBasedReward
from src.training.ppo_trainer import PPOTrainer
from src.utils.visualization import AssignmentVisualizer

class SceneBasedOptimizerService:
    def __init__(self):
        self.env = ScheduleOptimizationEnv()
        self.reward_function = SceneBasedReward()
        self.trainer = PPOTrainer()
        self.visualizer = AssignmentVisualizer()
    
    async def optimize(self, request: ScheduleOptimizationRequest):
        """強化学習ベースのスケジュール最適化"""
        # 環境の初期化
        obs = self.env.reset(request.schedule_data)
        
        # モデルによる最適化
        action = await self.trainer.predict(obs)
        
        # 環境でアクション実行
        obs, reward, done, info = self.env.step(action)
        
        return {
            "optimized_schedule": info["schedule"],
            "reward": reward,
            "assignments": info["assignments"]
        }
    
    async def train(self):
        """強化学習モデルの学習"""
        return await self.trainer.train()
    
    async def visualize_assignments(self, schedule_id: str):
        """割り当て結果の可視化"""
        return await self.visualizer.create_visualizations(schedule_id)
```

### 4. 強化学習環境定義
```python
# backend/app/ml_engine/src/environment/environment.py
import gym
import numpy as np
from typing import Dict, Any, Tuple

class ScheduleOptimizationEnv(gym.Env):
    """スケジュール最適化のための強化学習環境"""
    
    def __init__(self):
        super().__init__()
        self.action_space = gym.spaces.Discrete(100)  # アクション数
        self.observation_space = gym.spaces.Box(
            low=0, high=1, shape=(50,), dtype=np.float32
        )
        self.current_schedule = None
        self.members = None
        self.venues = None
    
    def reset(self, schedule_data: Dict[str, Any]):
        """環境のリセット"""
        self.current_schedule = schedule_data["schedule"]
        self.members = schedule_data["members"]
        self.venues = schedule_data["venues"]
        
        # 初期観測状態を返す
        obs = self._get_observation()
        return obs
    
    def step(self, action: int) -> Tuple[np.ndarray, float, bool, Dict]:
        """アクションの実行"""
        # アクションに基づいてスケジュールを更新
        updated_schedule = self._apply_action(action)
        
        # 報酬を計算
        reward = self._calculate_reward(updated_schedule)
        
        # 終了条件をチェック
        done = self._is_done(updated_schedule)
        
        # 情報を返す
        info = {
            "schedule": updated_schedule,
            "assignments": self._get_assignments(updated_schedule)
        }
        
        obs = self._get_observation()
        return obs, reward, done, info
    
    def _get_observation(self) -> np.ndarray:
        """現在の観測状態を取得"""
        # スケジュール、メンバー、会場の情報をベクトル化
        obs = np.zeros(50, dtype=np.float32)
        # 実装詳細...
        return obs
    
    def _apply_action(self, action: int) -> Dict[str, Any]:
        """アクションを適用してスケジュールを更新"""
        # 実装詳細...
        return self.current_schedule
    
    def _calculate_reward(self, schedule: Dict[str, Any]) -> float:
        """報酬を計算"""
        # シーンベースの報酬計算
        return 0.0
    
    def _is_done(self, schedule: Dict[str, Any]) -> bool:
        """終了条件をチェック"""
        return False
    
    def _get_assignments(self, schedule: Dict[str, Any]) -> Dict[str, Any]:
        """割り当て結果を取得"""
        return {}
```

## 統合のメリット

1. **サービス分離**: ML-Engineを独立したサービス（8001番）として管理
2. **スケーラビリティ**: ML-Engineを独立してスケール可能
3. **技術スタック分離**: 強化学習に特化した環境を独立して構築
4. **デプロイ独立性**: ML-Engineとバックエンドを独立してデプロイ可能
5. **元プロジェクト構成踏襲**: 既存の強化学習プロジェクト構成をそのまま活用
6. **強化学習対応**: PPOベースのスケジュール最適化をそのまま統合
7. **可視化機能**: 既存の可視化機能をそのまま活用
8. **HTTP通信**: 標準的なHTTP APIでサービス間通信

## アクセス例

```bash
# 既存API（ポート8000）
curl http://127.0.0.1:8000/api/v1/users

# ML API（ポート8000から8001番へのプロキシ）
curl -X POST http://127.0.0.1:8000/api/v1/ml/predict/schedule-optimization \
  -H "Content-Type: application/json" \
  -d '{"schedule_data": {...}}'

curl http://127.0.0.1:8000/api/v1/ml/models/status

# 強化学習モデル学習
curl -X POST http://127.0.0.1:8000/api/v1/ml/train/scene-based-system

# 可視化
curl http://127.0.0.1:8000/api/v1/ml/visualize/assignments?schedule_id=123

# ML-Engine直接アクセス（ポート8001）
curl -X POST http://127.0.0.1:8001/api/v1/predict/schedule-optimization \
  -H "Content-Type: application/json" \
  -d '{"schedule_data": {...}}'

curl http://127.0.0.1:8001/api/v1/models/status
```

## 実装ステップ

1. **ML-Engine独立サービス作成**
   - `ml-engine/` フォルダ作成
   - 元プロジェクト構成を踏襲したサブフォルダの作成
   - `configs/`, `models/`, `src/`, `outputs/`, `logs/` など

2. **元プロジェクト移行**
   - `tomosigoto-nou-ai` からファイルを移行
   - 強化学習環境、報酬関数、トレーニングスクリプト
   - 既存のモデルファイルと設定ファイル

3. **ML-Engine FastAPIアプリケーション作成**
   - `ml-engine/app/main.py` の作成
   - ポート8001で動作するFastAPIアプリケーション
   - 強化学習ベースのエンドポイント実装

4. **バックエンドML統合**
   - バックエンドにMLクライアントを追加
   - 8001番へのHTTPクライアント実装
   - プロキシAPIエンドポイントの作成

5. **設定ファイル作成**
   - ML-Engine設定ファイルの作成
   - バックエンドML統合設定の作成

6. **サービス間通信実装**
   - HTTPクライアントの実装
   - エラーハンドリングとリトライ機能
   - タイムアウト設定

7. **可視化機能統合**
   - 既存の可視化機能をAPI化
   - フロントエンドとの連携

8. **テスト・デプロイ**
   - テスト環境の構築
   - Docker Composeでの統合デプロイ
   - 強化学習モデルの動作確認
