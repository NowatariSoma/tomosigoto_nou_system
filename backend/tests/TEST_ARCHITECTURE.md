# テストアーキテクチャ設計書

## 🎯 基本方針

### テストピラミッド戦略
```
     ╱╲
    ╱E2E╲     (5-10%) - ユーザーシナリオ
   ╱──────╲
  ╱Integra-╲  (20-30%) - API/DB統合
 ╱  tion    ╲
╱────────────╲(60-70%) - ビジネスロジック
    Unit Tests
```

## 📁 ディレクトリ構成

```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py                 # グローバル設定
│   ├── pytest.ini                  # pytest設定
│   │
│   ├── unit/                       # ユニットテスト (60-70%)
│   │   ├── conftest.py
│   │   ├── core/                   # コアロジック
│   │   ├── repositories/           # リポジトリ層
│   │   ├── services/               # サービス層
│   │   ├── schemas/                # スキーマ検証
│   │   └── utils/                  # ユーティリティ
│   │
│   ├── integration/                # 統合テスト (20-30%)
│   │   ├── conftest.py
│   │   ├── api/                    # APIエンドポイント
│   │   ├── database/               # DB操作
│   │   └── external/               # 外部サービス連携
│   │
│   ├── e2e/                        # E2Eテスト (5-10%)
│   │   ├── conftest.py
│   │   ├── scenarios/              # ユーザーシナリオ
│   │   └── performance/            # パフォーマンス
│   │
│   ├── fixtures/                   # 共通Fixture
│   │   ├── database.py             # DB接続
│   │   ├── auth.py                 # 認証
│   │   ├── client.py               # HTTPクライアント
│   │   └── mock_services.py        # モックサービス
│   │
│   ├── factories/                  # テストデータ生成
│   │   ├── __init__.py
│   │   ├── base.py                 # 基底Factory
│   │   ├── user_factory.py
│   │   ├── venue_factory.py
│   │   └── builders/               # 複雑なデータビルダー
│   │
│   ├── mocks/                      # モック定義
│   │   ├── __init__.py
│   │   ├── supabase_mock.py
│   │   └── external_api_mock.py
│   │
│   ├── utils/                      # テストユーティリティ
│   │   ├── assertions.py           # カスタムアサーション
│   │   ├── helpers.py              # ヘルパー関数
│   │   ├── benchmarks.py           # パフォーマンス測定
│   │   └── db_utils.py             # DB操作ユーティリティ
│   │
│   └── data/                       # テストデータ
│       ├── fixtures/               # 固定データ
│       ├── snapshots/              # スナップショット
│       └── seeds/                  # シードデータ
```

## 🔧 主要ライブラリ構成

### 必須ライブラリ
```python
# Testing Core
pytest>=8.2.0
pytest-asyncio>=0.24.0
pytest-cov>=4.1.0
pytest-mock>=3.12.0

# 並列実行
pytest-xdist>=3.5.0

# BDD対応
pytest-bdd>=6.1.1

# パフォーマンステスト
pytest-benchmark>=4.0.0
locust>=2.17.0

# データ生成
factory-boy>=3.3.0
faker>=22.0.0

# アサーション強化
pytest-clarity>=1.0.1
pytest-sugar>=0.9.7

# スナップショットテスト
syrupy>=4.6.0

# テストデータベース
pytest-postgresql>=5.0.0
testcontainers>=3.7.1
```

## 📋 テストカテゴリと責務

### 1. Unit Tests (単体テスト)
- **対象**: 個別の関数、クラス、メソッド
- **依存**: なし（全てモック）
- **実行時間**: < 100ms/test
- **並列実行**: 可能

### 2. Integration Tests (統合テスト)
- **対象**: 複数コンポーネントの連携
- **依存**: データベース、キャッシュ
- **実行時間**: < 1s/test
- **並列実行**: 制限付き

### 3. E2E Tests (エンドツーエンドテスト)
- **対象**: 完全なユーザーシナリオ
- **依存**: 全システム
- **実行時間**: < 10s/test
- **並列実行**: 不可

## 🚀 実行戦略

### ローカル開発
```bash
# 高速フィードバック (Unit only)
pytest tests/unit -n auto

# 統合テスト含む
pytest tests/unit tests/integration -n 4

# フルテスト
pytest --cov=app --cov-report=html
```

### CI/CDパイプライン
```yaml
stages:
  - quick-check  # Unit tests (並列8)
  - integration  # Integration tests (並列4)
  - e2e         # E2E tests (直列)
  - performance # 負荷テスト (定期実行)
```

## 🎭 モック戦略

### レベル別モック方針
1. **Unit**: 全外部依存をモック
2. **Integration**: 外部APIのみモック
3. **E2E**: モック使用なし

### モックライブラリ使い分け
- `unittest.mock`: 基本的なモック
- `pytest-mock`: Pytestフィクスチャ統合
- `responses`: HTTPレスポンスモック
- `freezegun`: 時間操作

## 📊 品質メトリクス

### カバレッジ目標
- 全体: 80%以上
- クリティカルパス: 95%以上
- 新規コード: 90%以上

### パフォーマンス基準
- Unit Test Suite: < 30秒
- Integration Suite: < 3分
- E2E Suite: < 10分

## 🔄 テストデータ管理

### Factory Pattern
```python
# 基本使用例
user = UserFactory.create()
users = UserFactory.create_batch(10)
admin = UserFactory.create_admin()
```

### データベース戦略
1. **Unit**: インメモリDB
2. **Integration**: TestContainers (PostgreSQL)
3. **E2E**: ステージング環境

### トランザクション管理
- 各テスト後に自動ロールバック
- 並列実行時の分離保証

## 🏃 並列実行最適化

### pytest-xdist設定
```ini
[tool.pytest.ini_options]
addopts = "-n auto --dist loadscope"
```

### テスト分離
- データベーススキーマ分離
- 一時ファイル独立管理
- ポート番号動的割当

## 📝 ベストプラクティス

1. **AAA Pattern**: Arrange, Act, Assert
2. **Given-When-Then**: BDDシナリオ
3. **テストは仕様書**: 明確な命名
4. **DRY原則**: Fixture活用
5. **早期失敗**: fail-fast戦略

## 🔍 デバッグ支援

### 便利なオプション
```bash
# 詳細ログ
pytest -vv --log-cli-level=DEBUG

# 最初の失敗で停止
pytest -x

# 失敗箇所でデバッガ起動
pytest --pdb

# 前回失敗したテストのみ
pytest --lf
```