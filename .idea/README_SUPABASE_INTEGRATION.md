# Supabase統合 - Full Stack プロジェクト

FastAPI（バックエンド）とNext.js（フロントエンド）を使用したSupabase統合プロジェクトです。

## 🚀 クイックスタート

### 1. 環境変数の設定

```bash
# .envファイルを作成
cp env.example .env

# .envファイルを編集してSupabase認証情報を設定
nano .env
```

### 2. 必要な環境変数

```env
# Environment Configuration
ENVIRONMENT=development
NODE_ENV=development
DEVELOPMENT_MOUNT=rw

# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=***REMOVED***
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Backend Configuration
SECRET_KEY=your-secret-key-here-for-jwt-tokens
API_BASE_URL=http://localhost:8000

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=***REMOVED***
```

### 3. Docker起動

```bash
# 開発環境での起動
docker compose up --build

# バックグラウンドで起動
docker compose up --build -d

# 本番環境での起動（環境変数を変更）
ENVIRONMENT=production NODE_ENV=production DEVELOPMENT_MOUNT= docker compose up --build -d
```

### 4. 個別サービス起動

```bash
# バックエンドのみ起動
docker compose up --build backend

# フロントエンドのみ起動
docker compose up --build frontend
```

## 📡 アクセス方法

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:8000
- **API Documentation (Swagger)**: http://localhost:8000/docs
- **テストページ**: http://localhost:3000/test

## 🛠️ 開発コマンド

### コンテナ管理

```bash
# サービス停止
docker compose down

# ログ確認
docker compose logs -f

# 特定サービスのログ確認
docker compose logs -f backend
docker compose logs -f frontend

# 完全クリーンアップ
docker compose down -v --remove-orphans
docker system prune -a --volumes -f
```

### コンテナ内でのコマンド実行

```bash
# バックエンドコンテナでコマンド実行
docker compose exec backend bash

# フロントエンドコンテナでコマンド実行
docker compose exec frontend bash

# テスト実行
docker compose exec backend python -m pytest
docker compose exec frontend yarn test
```

## 🏗️ プロジェクト構成

```
.
├── backend/                 # FastAPIバックエンド
│   ├── app/
│   │   ├── api/            # APIエンドポイント
│   │   ├── core/           # 設定・セキュリティ
│   │   ├── schemas/        # Pydanticスキーマ
│   │   ├── services/       # ビジネスロジック
│   │   └── main.py        # FastAPIアプリケーション
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # Next.jsフロントエンド
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── Dockerfile
├── docker-compose.yml      # 開発・本番統合設定
└── env.example            # 環境変数テンプレート
```

## 🔧 環境切り替え

### 開発環境（デフォルト）

`.env`ファイル:
```env
ENVIRONMENT=development
NODE_ENV=development
DEVELOPMENT_MOUNT=rw
```

起動:
```bash
docker compose up --build
```

**特徴:**
- ホットリロード有効
- ローカルファイルがマウントされる
- デバッグモード

### 本番環境

`.env`ファイル:
```env
ENVIRONMENT=production
NODE_ENV=production
DEVELOPMENT_MOUNT=
```

起動:
```bash
docker compose up --build -d
```

**特徴:**
- 最適化されたビルド
- ファイルマウントなし
- 複数ワーカー

## 🔧 技術スタック

- **バックエンド**: FastAPI + Python 3.11 + Supabase
- **フロントエンド**: Next.js + React + TailwindCSS
- **認証**: Supabase Auth + JWT
- **開発環境**: Docker + Docker Compose

## 📝 API仕様

### ユーザー関連

- `GET /api/users` - ユーザー一覧取得
- `GET /api/users/{user_id}` - 特定ユーザー取得

### 認証

- JWT認証（Authorization: Bearer {token}）
- Supabase認証と統合

## 🐛 トラブルシューティング

### 環境変数エラー

```bash
# .envファイルが正しく設定されているか確認
cat .env

# コンテナの環境変数確認
docker compose exec backend env
```

### ポート競合エラー

```bash
# ポート使用状況確認
lsof -i :3000
lsof -i :8000

# 他のプロセスを停止してから再起動
docker compose down
docker compose up --build
```

### データベース接続エラー

1. Supabase接続情報を確認
2. SUPABASE_SERVICE_ROLE_KEYが正しく設定されているか確認
3. Supabaseプロジェクトが有効か確認

## 🚀 本番デプロイ

### 1. 環境変数の設定

```bash
# 本番用環境変数を設定
export ENVIRONMENT=production
export NODE_ENV=production
export DEVELOPMENT_MOUNT=
```

### 2. デプロイ実行

```bash
# 本番用イメージビルド・起動
docker compose up --build -d
```

### 3. ヘルスチェック

```bash
# サービス状態確認
docker compose ps

# ログ確認
docker compose logs
```

## 💡 使い方のコツ

### エイリアスの設定

```bash
# ~/.bashrcに追加
alias dcu='docker compose up --build'
alias dcd='docker compose down'
alias dcl='docker compose logs -f'
alias dcb='docker compose exec backend bash'
alias dcf='docker compose exec frontend bash'
```

### 開発時の便利コマンド

```bash
# 設定変更後の再起動
docker compose restart

# 特定サービスの再ビルド
docker compose up --build --force-recreate backend

# 依存関係の更新
docker compose exec backend pip install -r requirements.txt
docker compose exec frontend yarn install
``` 