# Tomosigoto API 使用ガイド

## 概要

Tomosigoto APIは、ユーザー管理、スケジュール管理、PDF出力などの機能を提供するRESTful APIです。
本ガイドでは、APIの使用方法について説明します。

## ベースURL

```
ローカル開発環境: http://localhost:8000
リモートSupabase直接: https://<YOUR_PROJECT_REF>.supabase.co
本番環境: https://your-production-domain.com
```

## 認証

### 認証方式

APIはSupabaseを使用したJWT認証を採用しています。すべてのAPIリクエスト（デバッグエンドポイントを除く）には、有効なアクセストークンが必要です。

### トークンの取得

#### 1. ユーザー登録

```bash
# Supabase Auth APIを使用して新規ユーザーを登録
curl -X POST "https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/signup" \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure_password123"
  }'
```

#### 2. ログイン

```bash
# 既存ユーザーでログイン
curl -X POST "https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure_password123"
  }'
```

レスポンス例：
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "your_refresh_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  }
}
```

### トークンの使用

取得したアクセストークンは、Authorizationヘッダーに含めて送信します：

```bash
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## API エンドポイント

### ユーザー管理 API

#### 1. 全ユーザー取得

```bash
GET /api/users/

# リクエスト例
curl -X GET "http://localhost:8000/api/users/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

レスポンス例：
```json
[
  {
    "id": "user_id_1",
    "email": "user1@example.com",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  },
  {
    "id": "user_id_2",
    "email": "user2@example.com",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
]
```

#### 2. 現在のユーザー情報取得

```bash
GET /api/users/me/

# リクエスト例
curl -X GET "http://localhost:8000/api/users/me/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

レスポンス例：
```json
{
  "id": "current_user_id",
  "email": "current_user@example.com",
  "email_verified": true,
  "phone_verified": false,
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

#### 3. 特定ユーザー取得

```bash
GET /api/users/{user_id}

# リクエスト例
curl -X GET "http://localhost:8000/api/users/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 4. ユーザー作成（管理者のみ）

```bash
POST /api/users/

# リクエスト例
curl -X POST "http://localhost:8000/api/users/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "secure_password123",
    "user_metadata": {
      "role": "student",
      "department": "営業部"
    }
  }'
```

#### 5. ユーザー更新

```bash
PUT /api/users/{user_id}

# リクエスト例
curl -X PUT "http://localhost:8000/api/users/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "updated_email@example.com",
    "user_metadata": {
      "role": "teacher"
    }
  }'
```

#### 6. ユーザー削除（管理者のみ）

```bash
DELETE /api/users/{user_id}

# リクエスト例
curl -X DELETE "http://localhost:8000/api/users/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### ヘルスチェック API

```bash
GET /health

# リクエスト例
curl -X GET "http://localhost:8000/health"
```

レスポンス例：
```json
{
  "status": "healthy",
  "timestamp": "2025-01-31T09:00:00.000Z"
}
```

### デバッグ API（開発環境のみ）

#### ユーザーCRUD動作確認

```bash
GET /debug/users-crud

# リクエスト例（認証不要）
curl -X GET "http://localhost:8000/debug/users-crud"
```

#### Supabaseユーザー一覧

```bash
GET /debug/supabase-users

# リクエスト例（認証不要）
curl -X GET "http://localhost:8000/debug/supabase-users"
```

## エラーハンドリング

### エラーレスポンス形式

```json
{
  "detail": "エラーメッセージ"
}
```

### 一般的なエラーコード

- `400 Bad Request`: リクエストが不正
- `401 Unauthorized`: 認証が必要または無効なトークン
- `403 Forbidden`: アクセス権限なし
- `404 Not Found`: リソースが見つからない
- `422 Unprocessable Entity`: バリデーションエラー
- `500 Internal Server Error`: サーバー内部エラー

## 使用例（Python）

### requestsライブラリを使用

```python
import requests
import json

# 設定
BASE_URL = "http://localhost:8000"
SUPABASE_URL = "https://<YOUR_PROJECT_REF>.supabase.co"
SUPABASE_ANON_KEY = "your_supabase_anon_key"

# 1. ログインしてトークンを取得
def login(email, password):
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
    }
    data = {
        "email": email,
        "password": password
    }
    
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        raise Exception(f"Login failed: {response.text}")

# 2. APIを使用
def get_users(access_token):
    url = f"{BASE_URL}/api/users/"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Failed to get users: {response.text}")

# 使用例
try:
    # ログイン
    token = login("admin001@mail.doshisha.ac.jp", "password123")
    print(f"Login successful, token: {token[:20]}...")
    
    # ユーザー一覧取得
    users = get_users(token)
    print(f"Found {len(users)} users")
    
    for user in users:
        print(f"- {user['email']} (ID: {user['id']})")
        
except Exception as e:
    print(f"Error: {e}")
```

### httpxライブラリを使用（非同期）

```python
import httpx
import asyncio

async def async_example():
    async with httpx.AsyncClient() as client:
        # ログイン
        login_response = await client.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={"apikey": SUPABASE_ANON_KEY},
            json={"email": "user@example.com", "password": "password"}
        )
        
        token = login_response.json()["access_token"]
        
        # APIリクエスト
        users_response = await client.get(
            f"{BASE_URL}/api/users/",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        return users_response.json()

# 実行
users = asyncio.run(async_example())
```

## 使用例（JavaScript/TypeScript）

### fetchを使用

```javascript
const BASE_URL = 'http://localhost:8000';
const SUPABASE_URL = 'https://<YOUR_PROJECT_REF>.supabase.co';
const SUPABASE_ANON_KEY = 'your_supabase_anon_key';

// ログイン関数
async function login(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

// ユーザー取得関数
async function getUsers(accessToken) {
  const response = await fetch(`${BASE_URL}/api/users/`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get users: ${response.statusText}`);
  }
  
  return response.json();
}

// 使用例
(async () => {
  try {
    // ログイン
    const token = await login('admin001@mail.doshisha.ac.jp', 'password123');
    console.log('Login successful');
    
    // ユーザー一覧取得
    const users = await getUsers(token);
    console.log(`Found ${users.length} users`);
    
    users.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
})();
```

### axiosを使用

```javascript
import axios from 'axios';

// axiosインスタンスの作成
const api = axios.create({
  baseURL: 'http://localhost:8000'
});

// リクエストインターセプターでトークンを自動追加
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// API関数
export const userApi = {
  // 全ユーザー取得
  getUsers: () => api.get('/api/users/'),
  
  // 特定ユーザー取得
  getUser: (userId) => api.get(`/api/users/${userId}`),
  
  // 現在のユーザー取得
  getCurrentUser: () => api.get('/api/users/me/'),
  
  // ユーザー作成
  createUser: (userData) => api.post('/api/users/', userData),
  
  // ユーザー更新
  updateUser: (userId, userData) => api.put(`/api/users/${userId}`, userData),
  
  // ユーザー削除
  deleteUser: (userId) => api.delete(`/api/users/${userId}`)
};
```

## セキュリティに関する注意事項

1. **HTTPSの使用**: 本番環境では必ずHTTPSを使用してください
2. **トークンの保管**: アクセストークンは安全に保管し、公開リポジトリにコミットしないでください
3. **トークンの有効期限**: トークンには有効期限があります。期限切れの場合は再ログインが必要です
4. **CORS設定**: ブラウザからAPIを使用する場合は、適切なCORS設定が必要です

## トラブルシューティング

### 401 Unauthorized エラー

- トークンが正しく設定されているか確認
- トークンの有効期限が切れていないか確認
- Authorizationヘッダーの形式が正しいか確認（`Bearer `の後にスペースが必要）

### 404 Not Found エラー

- エンドポイントのURLが正しいか確認
- リソースID（user_idなど）が存在するか確認

### 422 Unprocessable Entity エラー

- リクエストボディのJSON形式が正しいか確認
- 必須フィールドがすべて含まれているか確認
- データ型が正しいか確認

## 開発ツール

### Postman

Postmanを使用してAPIをテストできます：

1. 新しいリクエストを作成
2. メソッド（GET/POST/PUT/DELETE）を選択
3. URLを入力
4. Authorizationタブで「Bearer Token」を選択し、トークンを入力
5. 必要に応じてBodyタブでJSONデータを入力
6. Sendボタンをクリック

### curl

コマンドラインからcurlを使用してテスト：

```bash
# 環境変数にトークンを設定
export TOKEN="your_access_token"

# APIリクエスト
curl -X GET "http://localhost:8000/api/users/" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### VS Code REST Client

VS CodeのREST Client拡張機能を使用：

```http
### ログイン
POST https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/token?grant_type=password
apikey: your_supabase_anon_key
Content-Type: application/json

{
  "email": "admin001@mail.doshisha.ac.jp",
  "password": "password123"
}

### ユーザー一覧取得
GET http://localhost:8000/api/users/
Authorization: Bearer {{access_token}}
```

## サポート

問題が発生した場合は、以下を確認してください：

1. Dockerコンテナが正常に起動しているか
2. 環境変数が正しく設定されているか
3. Supabaseプロジェクトが正常に動作しているか
4. ネットワーク接続が正常か

それでも解決しない場合は、エラーログを確認し、必要に応じてissueを作成してください。