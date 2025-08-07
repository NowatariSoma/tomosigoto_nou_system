# ユーザーCRUD操作テスト

このドキュメントでは、ユーザー関連のCRUD（Create, Read, Update, Delete）操作のテストについて説明します。

## 📋 テスト概要

### 実装済み機能
- ✅ **Create（作成）**: `POST /api/users/`
- ✅ **Read（読み取り）**: 
  - `GET /api/users/` - 全ユーザー取得
  - `GET /api/users/{user_id}` - 特定ユーザー取得
  - `GET /api/users/me/` - 現在ユーザー取得
- ✅ **Update（更新）**: `PUT /api/users/{user_id}`
- ✅ **Delete（削除）**: `DELETE /api/users/{user_id}`

### 認証・認可
- ✅ JWTトークンベースの認証
- ✅ 全エンドポイントで認証必須
- ✅ 適切なエラーハンドリング（401, 403, 404, 500）

## 🧪 テストの種類

### 1. ユニットテスト
**ファイル**: `tests/unit/api/endpoints/test_users.py`

#### テストケース
- **認証テスト**
  - 認証なしでのアクセス → 403 Forbidden
  - 無効なトークン → 401 Unauthorized
  - 有効なトークン → 正常動作

- **CRUD操作テスト**
  - `GET /api/users/` - 全ユーザー取得
  - `GET /api/users/{user_id}` - 特定ユーザー取得
  - `GET /api/users/me/` - 現在ユーザー取得
  - `POST /api/users/` - ユーザー作成
  - `PUT /api/users/{user_id}` - ユーザー更新
  - `DELETE /api/users/{user_id}` - ユーザー削除

- **エラーハンドリングテスト**
  - 存在しないユーザー → 404 Not Found
  - 無効なデータ → 422 Unprocessable Entity
  - サービスエラー → 500 Internal Server Error

### 2. 統合テスト
**ファイル**: `tests/integration_test_users_with_supabase.py`

#### テスト内容
- **接続テスト**
  - バックエンド接続確認
  - Supabase接続確認
  - 認証フロー確認

- **実際のCRUD操作テスト**
  - 実際のSupabaseトークンを使用
  - 実際のデータベースに接続
  - エンドツーエンドの動作確認

## 🚀 テスト実行方法

### 方法1: Makefileを使用（推奨）

```bash
# ユーザー関連の全テストを実行
make test-users

# ユニットテストのみ実行
make test-users-unit

# 統合テストのみ実行
make test-users-integration

# Dockerコンテナ内でテスト実行
make test-users-docker
```

### 方法2: 直接実行

```bash
# ユニットテスト
cd backend
python3 -m pytest tests/unit/api/endpoints/test_users.py -v

# 統合テスト
cd backend
python3 tests/integration_test_users_with_supabase.py
```

### 方法3: Dockerコンテナ内で実行

```bash
# バックエンドコンテナに入る
docker compose exec backend sh

# コンテナ内でテスト実行
python3 -m pytest tests/unit/api/endpoints/test_users.py -v
python3 tests/integration_test_users_with_supabase.py
```

## 📊 テスト結果の確認

### ユニットテスト結果例
```
test_get_users_success PASSED
test_get_users_unauthorized PASSED
test_create_user_success PASSED
test_update_user_success PASSED
test_delete_user_success PASSED
```

### 統合テスト結果例
```
🚀 ユーザーCRUD操作統合テスト開始
==================================================
✅ PASS バックエンド接続
✅ PASS Supabase接続
✅ PASS 認証フロー（既存ユーザーログイン）
✅ PASS 現在ユーザー取得
✅ PASS 全ユーザー取得
✅ PASS 特定ユーザー取得
✅ PASS 無効トークンエラー
✅ PASS 認証なしエラー
==================================================
✅ 全テスト完了
📊 テスト結果: 8/8 成功
```

## 🔧 テスト設定

### 環境変数
```bash
# Supabase設定
SUPABASE_URL=https://uilydqaqephxtcnnqihy.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# バックエンド設定
BACKEND_URL=http://localhost:8000
```

### テスト用ユーザー
統合テストでは以下のテストユーザーを使用します：
- **メール**: `integration-test@example.com`
- **パスワード**: `testpassword123`

## 🐛 トラブルシューティング

### よくある問題

#### 1. バックエンド接続エラー
```bash
# バックエンドコンテナが起動しているか確認
docker compose ps

# バックエンドを再起動
docker compose restart backend
```

#### 2. Supabase接続エラー
```bash
# 環境変数が正しく設定されているか確認
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# .envファイルを確認
cat backend/.env
```

#### 3. 認証エラー
```bash
# テスト用ユーザーのパスワードをリセット
# Supabase管理画面から手動でリセットしてください
```

#### 4. テストが失敗する場合
```bash
# テストを詳細モードで実行
python3 -m pytest tests/unit/api/endpoints/test_users.py -v -s

# 特定のテストのみ実行
python3 -m pytest tests/unit/api/endpoints/test_users.py::TestUsersEndpoints::test_get_users_success -v
```

## 📝 テストカバレッジ

### カバーしている項目
- ✅ 全CRUD操作（Create, Read, Update, Delete）
- ✅ 認証・認可機能
- ✅ エラーハンドリング
- ✅ データバリデーション
- ✅ サービス層の動作
- ✅ エンドポイントの登録確認

### カバーしていない項目
- ❌ パフォーマンステスト
- ❌ 負荷テスト
- ❌ セキュリティテスト（詳細）
- ❌ フロントエンド連携テスト

## 🔄 CI/CD統合

### GitHub Actions例
```yaml
name: User CRUD Tests
on: [push, pull_request]
jobs:
  test-users:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.11
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run unit tests
        run: |
          cd backend
          python3 -m pytest tests/unit/api/endpoints/test_users.py -v
```

## 📚 関連ドキュメント

- [API仕様書](../API_MANUAL.md)
- [開発環境セットアップ](../DEVELOPMENT.md)
- [Supabase設定](../supabase/config.toml)

## 🤝 貢献

テストの追加や改善を行う場合は、以下の点に注意してください：

1. **テストケースの命名**: 日本語で分かりやすく記述
2. **エラーメッセージ**: 日本語で詳細に記述
3. **モックの使用**: 外部依存を適切にモック化
4. **統合テスト**: 実際の環境での動作確認

---

**最終更新**: 2025年7月31日
**バージョン**: 1.0.0 