# Tomosigoto Backend API 使用マニュアル

## 目次

1. [基本情報](#基本情報)
2. [認証](#認証)
3. [ユーザ管理API](#ユーザ管理api)
4. [エラーハンドリング](#エラーハンドリング)
5. [サンプルコード](#サンプルコード)
6. [トラブルシューティング](#トラブルシューティング)

## 基本情報

### ベースURL
```
開発環境: http://localhost:8000
本番環境: https://your-domain.com
```

### APIバージョン
```
v1: /api/v1
```

### コンテンツタイプ
```
Content-Type: application/json
```

## 認証

### JWT認証の流れ

1. **ログイン** → アクセストークンを取得
2. **API呼び出し** → ヘッダーにトークンを設定
3. **トークン更新** → 必要に応じてリフレッシュ

### 認証ヘッダー

```bash
Authorization: Bearer <access_token>
```

## ユーザ管理API

### 1. ユーザ一覧取得

**エンドポイント**: `GET /api/v1/users/`

**認証**: 必要

**レスポンス**:
```json
{
  "users": [
    {
      "id": "8c51abf7-58a2-4f0c-8aec-22d9d287eb32",
      "email": "test@test.com",
      "auth_provider": "NULL",
      "password_hash": "NULL",
      "created_at": "2025-06-30T11:31:18",
      "updated_at": "2025-06-30T11:31:20",
      "last_login": "2025-06-30T11:31:23",
      "is_active": false,
      "email_verified": true
    }
  ],
  "total": 1
}
```

**cURL例**:
```bash
curl -X GET "http://localhost:8000/api/v1/users/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 2. 特定ユーザ取得

**エンドポイント**: `GET /api/v1/users/{user_id}`

**認証**: 必要

**パラメータ**:
- `user_id` (string): ユーザID

**レスポンス**:
```json
{
  "id": "8c51abf7-58a2-4f0c-8aec-22d9d287eb32",
  "email": "test@test.com",
  "auth_provider": "NULL",
  "password_hash": "NULL",
  "created_at": "2025-06-30T11:31:18",
  "updated_at": "2025-06-30T11:31:20",
  "last_login": "2025-06-30T11:31:23",
  "is_active": false,
  "email_verified": true
}
```

**cURL例**:
```bash
curl -X GET "http://localhost:8000/api/v1/users/8c51abf7-58a2-4f0c-8aec-22d9d287eb32" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. ユーザ情報更新

**エンドポイント**: `PUT /api/v1/users/{user_id}`

**認証**: 必要

**リクエストボディ**:
```json
{
  "email": "updated@example.com",
  "name": "Updated Name"
}
```

**レスポンス**:
```json
{
  "id": "8c51abf7-58a2-4f0c-8aec-22d9d287eb32",
  "email": "updated@example.com",
  "name": "Updated Name",
  "created_at": "2025-06-30T11:31:18",
  "updated_at": "2025-06-30T12:00:00"
}
```

**cURL例**:
```bash
curl -X PUT "http://localhost:8000/api/v1/users/8c51abf7-58a2-4f0c-8aec-22d9d287eb32" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "updated@example.com", "name": "Updated Name"}'
```

### 4. ユーザ削除

**エンドポイント**: `DELETE /api/v1/users/{user_id}`

**認証**: 必要

**レスポンス**:
```json
{
  "message": "User deleted successfully"
}
```

**cURL例**:
```bash
curl -X DELETE "http://localhost:8000/api/v1/users/8c51abf7-58a2-4f0c-8aec-22d9d287eb32" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. ユーザ作成

**エンドポイント**: `POST /api/v1/users/`

**認証**: 必要

**リクエストボディ**:
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User"
}
```

**レスポンス**:
```json
{
  "id": "new-user-id",
  "email": "newuser@example.com",
  "name": "New User",
  "created_at": "2025-06-30T12:00:00",
  "updated_at": "2025-06-30T12:00:00"
}
```

**cURL例**:
```bash
curl -X POST "http://localhost:8000/api/v1/users/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com", "password": "password123", "name": "New User"}'
```

## 認証API

### 1. ユーザログイン

**エンドポイント**: `POST /api/v1/auth/login`

**認証**: 不要

**リクエストボディ**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "8c51abf7-58a2-4f0c-8aec-22d9d287eb32",
    "email": "user@example.com",
    "is_active": true,
    "email_verified": true
  }
}
```

**cURL例**:
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### 2. ユーザ登録

**エンドポイント**: `POST /api/v1/auth/register`

**認証**: 不要

**リクエストボディ**:
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User"
}
```

**レスポンス**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "new-user-id",
    "email": "newuser@example.com",
    "is_active": true,
    "email_verified": false
  }
}
```

**cURL例**:
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com", "password": "password123", "name": "New User"}'
```

### 3. 現在のユーザ情報取得

**エンドポイント**: `GET /api/v1/auth/me`

**認証**: 必要

**レスポンス**:
```json
{
  "id": "8c51abf7-58a2-4f0c-8aec-22d9d287eb32",
  "email": "user@example.com",
  "is_active": true,
  "email_verified": true,
  "created_at": "2025-06-30T11:31:18"
}
```

**cURL例**:
```bash
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. ログアウト

**エンドポイント**: `POST /api/v1/auth/logout`

**認証**: 必要

**レスポンス**:
```json
{
  "message": "Successfully logged out"
}
```

**cURL例**:
```bash
curl -X POST "http://localhost:8000/api/v1/auth/logout" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## デバッグAPI

### 1. Supabaseユーザ一覧（デバッグ用）

**エンドポイント**: `GET /debug/supabase-users`

**認証**: 不要

**レスポンス**:
```json
{
  "status": "success",
  "user_count": 2,
  "users": [
    {
      "id": "8c51abf7-58a2-4f0c-8aec-22d9d287eb32",
      "email": "test@test.com",
      "auth_provider": "NULL",
      "password_hash": "NULL",
      "created_at": "2025-06-30T11:31:18",
      "updated_at": "2025-06-30T11:31:20",
      "last_login": "2025-06-30T11:31:23",
      "is_active": false,
      "email_verified": true
    }
  ]
}
```

**cURL例**:
```bash
curl -X GET "http://localhost:8000/debug/supabase-users"
```

### 2. 利用可能テーブル一覧（デバッグ用）

**エンドポイント**: `GET /debug/supabase-tables`

**認証**: 不要

**レスポンス**:
```json
{
  "status": "success",
  "available_tables": ["users", "profiles"]
}
```

**cURL例**:
```bash
curl -X GET "http://localhost:8000/debug/supabase-tables"
```

## エラーハンドリング

### エラーレスポンス形式

```json
{
  "detail": "エラーメッセージ",
  "error_code": "ERROR_CODE",
  "timestamp": "2025-06-30T12:00:00Z"
}
```

### 主要なエラーコード

| ステータスコード | エラーコード | 説明 |
|----------------|-------------|------|
| 400 | `INVALID_REQUEST` | リクエストが不正 |
| 401 | `UNAUTHORIZED` | 認証が必要 |
| 403 | `FORBIDDEN` | アクセス権限なし |
| 404 | `NOT_FOUND` | リソースが見つからない |
| 422 | `VALIDATION_ERROR` | バリデーションエラー |
| 500 | `INTERNAL_ERROR` | サーバーエラー |

### エラー例

**認証エラー**:
```json
{
  "detail": "Invalid credentials",
  "error_code": "UNAUTHORIZED",
  "timestamp": "2025-06-30T12:00:00Z"
}
```

**バリデーションエラー**:
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ],
  "error_code": "VALIDATION_ERROR",
  "timestamp": "2025-06-30T12:00:00Z"
}
```

## サンプルコード

### JavaScript (Fetch API)

```javascript
// ログイン
async function login(email, password) {
  const response = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  return await response.json();
}

// ユーザ一覧取得
async function getUsers(token) {
  const response = await fetch('http://localhost:8000/api/v1/users/', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  
  return await response.json();
}

// 特定ユーザ取得
async function getUser(token, userId) {
  const response = await fetch(`http://localhost:8000/api/v1/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  
  return await response.json();
}

// ユーザ作成
async function createUser(token, userData) {
  const response = await fetch('http://localhost:8000/api/v1/users/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create user');
  }
  
  return await response.json();
}

// ユーザ更新
async function updateUser(token, userId, userData) {
  const response = await fetch(`http://localhost:8000/api/v1/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update user');
  }
  
  return await response.json();
}

// ユーザ削除
async function deleteUser(token, userId) {
  const response = await fetch(`http://localhost:8000/api/v1/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete user');
  }
  
  return await response.json();
}

// 使用例
async function main() {
  try {
    // ログイン
    const loginResult = await login('user@example.com', 'password123');
    const token = loginResult.access_token;
    
    // ユーザ一覧取得
    const users = await getUsers(token);
    console.log('Users:', users);

    // 特定ユーザ取得
    const user = await getUser(token, '8c51abf7-58a2-4f0c-8aec-22d9d287eb32');
    console.log('User:', user);

    // ユーザ作成
    const newUser = await createUser(token, {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User'
    });
    console.log('Created user:', newUser);

    // ユーザ更新
    const updatedUser = await updateUser(token, '8c51abf7-58a2-4f0c-8aec-22d9d287eb32', {
      name: 'Updated Name'
    });
    console.log('Updated user:', updatedUser);

    // ユーザ削除
    const deleteResult = await deleteUser(token, '8c51abf7-58a2-4f0c-8aec-22d9d287eb32');
    console.log('Delete result:', deleteResult);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Python (requests)

```python
import requests
import json

class TomosigotoAPI:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.token = None
    
    def login(self, email, password):
        """ユーザログイン"""
        url = f"{self.base_url}/api/v1/auth/login"
        data = {"email": email, "password": password}
        
        response = requests.post(url, json=data)
        response.raise_for_status()
        
        result = response.json()
        self.token = result["access_token"]
        return result
    
    def get_users(self):
        """ユーザ一覧取得"""
        if not self.token:
            raise ValueError("Not authenticated. Please login first.")
        
        url = f"{self.base_url}/api/v1/users/"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        return response.json()
    
    def get_user(self, user_id):
        """特定ユーザ取得"""
        if not self.token:
            raise ValueError("Not authenticated. Please login first.")
        
        url = f"{self.base_url}/api/v1/users/{user_id}"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        return response.json()
    
    def update_user(self, user_id, data):
        """ユーザ情報更新"""
        if not self.token:
            raise ValueError("Not authenticated. Please login first.")
        
        url = f"{self.base_url}/api/v1/users/{user_id}"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        response = requests.put(url, json=data, headers=headers)
        response.raise_for_status()
        
        return response.json()
    
    def create_user(self, data):
        """ユーザ作成"""
        if not self.token:
            raise ValueError("Not authenticated. Please login first.")
        
        url = f"{self.base_url}/api/v1/users/"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()
        
        return response.json()
    
    def delete_user(self, user_id):
        """ユーザ削除"""
        if not self.token:
            raise ValueError("Not authenticated. Please login first.")
        
        url = f"{self.base_url}/api/v1/users/{user_id}"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        response = requests.delete(url, headers=headers)
        response.raise_for_status()
        
        return response.json()

# 使用例
def main():
    api = TomosigotoAPI()
    
    try:
        # ログイン
        login_result = api.login("user@example.com", "password123")
        print("Login successful:", login_result)
        
        # ユーザ一覧取得
        users = api.get_users()
        print("Users:", users)
        
        # 特定ユーザ取得
        user = api.get_user("8c51abf7-58a2-4f0c-8aec-22d9d287eb32")
        print("User:", user)
        
        # ユーザ作成
        new_user = api.create_user({
            "email": "newuser@example.com",
            "password": "password123",
            "name": "New User"
        })
        print("Created user:", new_user)
        
        # ユーザ更新
        updated_user = api.update_user("8c51abf7-58a2-4f0c-8aec-22d9d287eb32", {
            "name": "Updated Name"
        })
        print("Updated user:", updated_user)
        
        # ユーザ削除
        result = api.delete_user("8c51abf7-58a2-4f0c-8aec-22d9d287eb32")
        print("Delete result:", result)
    except requests.exceptions.RequestException as e:
        print(f"API Error: {e}")
    except ValueError as e:
        print(f"Value Error: {e}")

if __name__ == "__main__":
    main()
```

### cURL スクリプト

```bash
#!/bin/bash

# 設定
API_BASE="http://localhost:8000"
EMAIL="user@example.com"
PASSWORD="password123"

# ログイン
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

# トークンを抽出
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "Login failed"
    echo $LOGIN_RESPONSE
    exit 1
fi

echo "Login successful. Token: ${TOKEN:0:20}..."

# ユーザ一覧取得
echo "Fetching users..."
USERS_RESPONSE=$(curl -s -X GET "$API_BASE/api/v1/users/" \
  -H "Authorization: Bearer $TOKEN")

echo "Users:"
echo $USERS_RESPONSE | jq '.'

# 現在のユーザ情報取得
echo "Fetching current user info..."
ME_RESPONSE=$(curl -s -X GET "$API_BASE/api/v1/auth/me" \
  -H "Authorization: Bearer $TOKEN")

echo "Current user:"
echo $ME_RESPONSE | jq '.'

# ユーザ作成
echo "Creating new user..."
CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/api/v1/users/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com", "password": "password123", "name": "New User"}')

echo "Created user:"
echo $CREATE_RESPONSE | jq '.'

# ユーザ更新
echo "Updating user..."
UPDATE_RESPONSE=$(curl -s -X PUT "$API_BASE/api/v1/users/8c51abf7-58a2-4f0c-8aec-22d9d287eb32" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}')

echo "Updated user:"
echo $UPDATE_RESPONSE | jq '.'

# ユーザ削除
echo "Deleting user..."
DELETE_RESPONSE=$(curl -s -X DELETE "$API_BASE/api/v1/users/8c51abf7-58a2-4f0c-8aec-22d9d287eb32" \
  -H "Authorization: Bearer $TOKEN")

echo "Delete result:"
echo $DELETE_RESPONSE | jq '.'
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. 認証エラー (401 Unauthorized)

**症状**: `{"detail": "Not authenticated"}`

**原因**: 
- トークンが設定されていない
- トークンが無効
- トークンの有効期限切れ

**解決方法**:
```bash
# トークンを再取得
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

#### 2. CORSエラー

**症状**: ブラウザでCORSエラーが発生

**原因**: フロントエンドのオリジンが許可されていない

**解決方法**:
- バックエンドの`BACKEND_CORS_ORIGINS`設定を確認
- フロントエンドのURLを追加

#### 3. Supabase接続エラー

**症状**: `{"detail": "Error fetching users: Invalid API key"}`

**原因**: Supabase APIキーが無効

**解決方法**:
- 環境変数の`SUPABASE_URL`と`SUPABASE_SERVICE_ROLE_KEY`を確認
- SupabaseダッシュボードでAPIキーを再生成

#### 4. バリデーションエラー (422)

**症状**: `{"detail": [{"loc": ["body", "email"], "msg": "field required"}]}`

**原因**: リクエストボディの形式が不正

**解決方法**:
- リクエストボディのJSON形式を確認
- 必須フィールドが含まれているか確認

### デバッグ方法

#### 1. ログ確認

```bash
# Dockerログ確認
docker-compose logs backend

# リアルタイムログ
docker-compose logs -f backend

# エラーログのみ
docker-compose logs backend | grep ERROR
```

#### 2. APIテスト

```bash
# ヘルスチェック
curl http://localhost:8000/health

# OpenAPI仕様書確認
curl http://localhost:8000/api/v1/openapi.json

# Supabase接続テスト
curl http://localhost:8000/debug/supabase-users
```

#### 3. 環境変数確認

```bash
# コンテナ内の環境変数確認
docker-compose exec backend env | grep SUPABASE
```

## 更新履歴

- **v1.0.0** (2025-06-30): 初回リリース
  - 基本的なユーザ管理API
  - Supabase認証連携
  - JWT認証機能

## サポート

問題や質問がある場合は、以下の方法でサポートを受けることができます：

1. **GitHub Issues**: バグ報告や機能要求
2. **ドキュメント**: このマニュアルを参照
3. **ログ確認**: エラーの詳細を確認

---

**注意**: このマニュアルは開発環境向けです。本番環境では適切なセキュリティ設定を行ってください。 