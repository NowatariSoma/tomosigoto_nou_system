# Tomosigoto Backend Development Guide

## 概要

このドキュメントは、Tomosigotoバックエンドの開発者向けガイドです。実装の詳細、アーキテクチャ、開発ガイドラインについて説明します。

## アーキテクチャ

### 全体構成

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FastAPI App   │    │  Supabase Auth  │    │  Supabase DB    │
│                 │◄──►│                 │◄──►│                 │
│  - API Routes   │    │  - JWT Tokens   │    │  - User Data    │
│  - Middleware   │    │  - Auth Logic   │    │  - Profiles     │
│  - Validation   │    │  - Permissions  │    │  - Relations    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### ディレクトリ構造

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPIアプリケーション
│   ├── api/                    # APIルーター
│   │   ├── __init__.py
│   │   ├── api.py              # メインAPIルーター
│   │   ├── auth.py             # 認証エンドポイント
│   │   └── users.py            # ユーザ管理エンドポイント
│   ├── core/                   # コア設定
│   │   ├── __init__.py
│   │   ├── config.py           # 設定管理
│   │   └── security.py         # セキュリティ機能
│   ├── models/                 # データモデル
│   │   ├── __init__.py
│   │   └── user.py             # ユーザモデル
│   ├── schemas/                # Pydanticスキーマ
│   │   ├── __init__.py
│   │   ├── auth.py             # 認証スキーマ
│   │   └── user.py             # ユーザスキーマ
│   └── services/               # ビジネスロジック
│       ├── __init__.py
│       └── supabase_service.py # Supabase連携サービス
├── requirements.txt            # 依存関係
├── Dockerfile                  # Docker設定
├── README.md                   # 基本ドキュメント
├── API_MANUAL.md              # API使用マニュアル
└── DEVELOPMENT.md              # このファイル
```

## 実装詳細

### 1. メインアプリケーション (`app/main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Supabase integration API with FastAPI best practices",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# APIルーターを登録
app.include_router(api_router, prefix=settings.API_V1_STR)
```

**特徴**:
- OpenAPI仕様書の自動生成
- CORS設定によるフロントエンド連携
- モジュラーなルーター構成

### 2. 設定管理 (`app/core/config.py`)

```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Supabase設定
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    
    # JWT設定
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # アプリケーション設定
    PROJECT_NAME: str = "Tomosigoto API"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False
    
    # CORS設定
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"

settings = Settings()
```

**特徴**:
- Pydantic Settingsによる型安全な設定管理
- 環境変数からの自動読み込み
- デフォルト値の設定

### 3. Supabaseサービス (`app/services/supabase_service.py`)

```python
import logging
from typing import List, Optional, Dict, Any
from supabase import create_client, Client
from fastapi import HTTPException, status
from app.core.config import settings

class SupabaseService:
    def __init__(self):
        if not settings.SUPABASE_URL:
            raise ValueError("SUPABASE_URL must be set")
        
        api_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        if not api_key:
            raise ValueError("API key must be set")
        
        self.supabase: Client = create_client(settings.SUPABASE_URL, api_key)
    
    async def get_all_users(self) -> List[Dict[str, Any]]:
        """すべてのユーザーを取得"""
        try:
            # 複数の方法でユーザー取得を試行
            if hasattr(self.supabase.auth, 'admin'):
                try:
                    response = self.supabase.auth.admin.list_users()
                    if hasattr(response, 'users'):
                        return [user.dict() for user in response.users]
                except Exception as admin_error:
                    logger.warning(f"Admin API failed: {str(admin_error)}")
            
            # テーブルから直接取得
            for table_name in ['profiles', 'users']:
                try:
                    response = self.supabase.table(table_name).select('*').execute()
                    if response.data:
                        return response.data
                except Exception as table_error:
                    logger.warning(f"{table_name} table access failed: {str(table_error)}")
            
            return []
        except Exception as e:
            logger.error(f"Error fetching users: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error fetching users: {str(e)}"
            )

# シングルトンインスタンス
supabase_service = SupabaseService()
```

**特徴**:
- 複数の取得方法による堅牢性
- エラーハンドリングとログ出力
- シングルトンパターンによる効率的なリソース管理

### 4. APIルーター (`app/api/`)

#### メインAPIルーター (`app/api/api.py`)

```python
from fastapi import APIRouter
from app.api import auth, users

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
```

#### 認証ルーター (`app/api/auth.py`)

```python
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import UserLogin, UserRegister, Token
from app.services.supabase_service import supabase_service

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """ユーザーログイン"""
    try:
        # Supabase認証
        response = supabase_service.supabase.auth.sign_in_with_password({
            "email": user_credentials.email,
            "password": user_credentials.password
        })
        
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user": response.user.dict()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
```

#### ユーザールーター (`app/api/users.py`)

```python
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import User, UserUpdate
from app.services.supabase_service import supabase_service
from app.core.security import get_current_user

router = APIRouter()

@router.get("/", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user)):
    """ユーザー一覧取得"""
    users = await supabase_service.get_all_users()
    return users

@router.get("/{user_id}", response_model=User)
async def get_user(user_id: str, current_user: User = Depends(get_current_user)):
    """特定ユーザー取得"""
    user = await supabase_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user
```

### 5. セキュリティ (`app/core/security.py`)

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.supabase_service import supabase_service
from app.schemas.user import User

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """現在のユーザーを取得"""
    try:
        user = await supabase_service.verify_jwt_token(credentials.credentials)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        return User(**user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
```

## 開発ガイドライン

### 1. コードスタイル

#### Python
- **PEP 8**に準拠
- **Black**による自動フォーマット
- **isort**によるimport整理
- **flake8**によるリント

#### 設定例
```toml
# pyproject.toml
[tool.black]
line-length = 88
target-version = ['py311']

[tool.isort]
profile = "black"
multi_line_output = 3
```

### 2. エラーハンドリング

#### 統一されたエラーレスポンス

```python
from fastapi import HTTPException, status
from typing import Dict, Any

def create_error_response(
    message: str,
    error_code: str,
    status_code: int = status.HTTP_400_BAD_REQUEST
) -> Dict[str, Any]:
    """統一されたエラーレスポンスを作成"""
    return {
        "detail": message,
        "error_code": error_code,
        "timestamp": datetime.utcnow().isoformat()
    }

# 使用例
raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail=create_error_response(
        "Invalid credentials",
        "UNAUTHORIZED",
        status.HTTP_401_UNAUTHORIZED
    )
)
```

### 3. ログ出力

#### 構造化ログ

```python
import logging
import json
from datetime import datetime

class StructuredLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
    
    def info(self, message: str, **kwargs):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": "INFO",
            "message": message,
            **kwargs
        }
        self.logger.info(json.dumps(log_data))
    
    def error(self, message: str, error: Exception = None, **kwargs):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": "ERROR",
            "message": message,
            "error_type": type(error).__name__ if error else None,
            "error_message": str(error) if error else None,
            **kwargs
        }
        self.logger.error(json.dumps(log_data))

# 使用例
logger = StructuredLogger(__name__)
logger.info("User login attempt", user_id="123", email="user@example.com")
```

### 4. テスト

#### テスト構造

```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # pytest設定
│   ├── test_api/
│   │   ├── __init__.py
│   │   ├── test_auth.py         # 認証テスト
│   │   └── test_users.py        # ユーザテスト
│   ├── test_services/
│   │   ├── __init__.py
│   │   └── test_supabase.py     # Supabaseサービステスト
│   └── test_utils/
│       ├── __init__.py
│       └── test_security.py     # セキュリティテスト
```

#### テスト例

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.supabase_service import supabase_service

client = TestClient(app)

class TestAuthAPI:
    def test_login_success(self):
        """ログイン成功テスト"""
        response = client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self):
        """無効な認証情報テスト"""
        response = client.post("/api/v1/auth/login", json={
            "email": "invalid@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401

class TestUsersAPI:
    def test_get_users_authenticated(self, auth_token):
        """認証済みユーザー一覧取得テスト"""
        response = client.get("/api/v1/users/", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
```

### 5. 環境管理

#### 環境別設定

```python
# app/core/config.py
class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    # 環境別設定
    if is_development:
        DEBUG: bool = True
        LOG_LEVEL: str = "DEBUG"
    else:
        DEBUG: bool = False
        LOG_LEVEL: str = "INFO"
```

### 6. データベース設計

#### ユーザーテーブル設計

```sql
-- Supabase Auth Users (自動生成)
-- auth.users テーブルを拡張

-- プロファイルテーブル
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 設定
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ポリシー設定
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
```

## デプロイメント

### 1. Docker設定

#### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# システム依存関係のインストール
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python依存関係のインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードのコピー
COPY . .

# 非rootユーザーで実行
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# アプリケーション起動
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file:
      - .env
    environment:
      - ENVIRONMENT=${ENVIRONMENT:-development}
    volumes:
      - ./backend:/app:${DEVELOPMENT_MOUNT:-}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 2. CI/CD設定

#### GitHub Actions

```yaml
name: Backend CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Run tests
      run: |
        cd backend
        pytest --cov=app --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.xml

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to production
      run: |
        echo "Deploy to production"
```

## パフォーマンス最適化

### 1. キャッシュ戦略

```python
from functools import lru_cache
from app.core.config import settings

@lru_cache()
def get_settings():
    """設定のキャッシュ"""
    return settings

# 使用例
settings = get_settings()
```

### 2. データベース最適化

```python
# ページネーション
@router.get("/", response_model=List[User])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    """ページネーション付きユーザー一覧取得"""
    users = await supabase_service.get_users_paginated(skip, limit)
    return users
```

### 3. 非同期処理

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=4)

async def heavy_operation():
    """重い処理を非同期で実行"""
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(executor, cpu_intensive_task)
    return result
```

## セキュリティ

### 1. 入力検証

```python
from pydantic import BaseModel, EmailStr, validator

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v
```

### 2. レート制限

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, user_credentials: UserLogin):
    """レート制限付きログイン"""
    # 実装
```

### 3. CORS設定

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

## 監視とログ

### 1. ヘルスチェック

```python
@router.get("/health")
async def health_check():
    """ヘルスチェック"""
    try:
        # Supabase接続確認
        await supabase_service.get_all_users()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}
```

### 2. メトリクス

```python
from prometheus_client import Counter, Histogram
import time

# メトリクス定義
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')

# ミドルウェア
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    REQUEST_COUNT.labels(method=request.method, endpoint=request.url.path).inc()
    REQUEST_DURATION.observe(duration)
    
    return response
```

## トラブルシューティング

### 1. よくある問題

#### Supabase接続エラー
```bash
# ログ確認
docker-compose logs backend | grep -i supabase

# 環境変数確認
docker-compose exec backend env | grep SUPABASE

# 手動テスト
curl -X GET "http://localhost:8000/debug/supabase-users"
```

#### 認証エラー
```bash
# トークン検証
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN"

# ログイン再試行
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "password123"}'
```

### 2. デバッグ方法

#### ログレベル設定
```python
import logging

# 開発環境での詳細ログ
if settings.is_development:
    logging.basicConfig(level=logging.DEBUG)
else:
    logging.basicConfig(level=logging.INFO)
```

#### デバッグエンドポイント
```python
@router.get("/debug/info")
async def debug_info():
    """デバッグ情報"""
    return {
        "environment": settings.ENVIRONMENT,
        "supabase_url": settings.SUPABASE_URL,
        "has_service_key": bool(settings.SUPABASE_SERVICE_ROLE_KEY),
        "timestamp": datetime.utcnow().isoformat()
    }
```

## 今後の拡張

### 1. 予定機能

- [ ] ユーザー権限管理
- [ ] ファイルアップロード機能
- [ ] リアルタイム通知
- [ ] バッチ処理
- [ ] キャッシュ機能

### 2. 技術的改善

- [ ] GraphQL対応
- [ ] WebSocket対応
- [ ] マイクロサービス化
- [ ] コンテナオーケストレーション

---

このドキュメントは継続的に更新されます。最新の情報については、GitHubリポジトリを確認してください。 