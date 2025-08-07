# Supabaseバックエンドリファクタリング方針（改訂版）

## 現状の課題
1. Supabaseクライアントがシングルトンとして直接初期化されている
2. サービス層にデータベース接続が密結合している
3. 依存性注入が不十分でテストが困難
4. エラーハンドリングがサービス層に混在
5. データアクセスロジックがサービス層に直接実装されている

## 改善後のアーキテクチャ

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Endpoints  │ --> │  Services   │ --> │ Repositories │ --> │  Supabase   │
│   (API層)   │     │ (ビジネス層) │     │ (データ層)   │     │   Client    │
└─────────────┘     └─────────────┘     └──────────────┘     └─────────────┘
      ↓                    ↓                     ↓                    ↑
   Depends()           Depends()             Depends()           get_supabase()
```

## リファクタリング方針

### 1. 依存性注入パターンの実装

```python
# app/db/supabase.py (新規)
from supabase import create_client, Client
from app.core.config import settings

def get_supabase() -> Client:
    """Supabaseクライアントを依存性注入で提供"""
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
    )
    return client
```

### 2. サービス層の改善

```python
# app/services/user_service.py (改善版)
from supabase import Client
from typing import List, Optional, Dict, Any

class UserService:
    def __init__(self, supabase_client: Client):
        self.client = supabase_client
    
    async def get_all_users(self) -> List[Dict[str, Any]]:
        response = self.client.table('users').select('*').execute()
        return response.data or []
```

### 3. エンドポイントでの依存性注入

```python
# app/api/endpoints/users.py (改善版)
from fastapi import Depends
from supabase import Client
from app.db.supabase import get_supabase
from app.services.user_service import UserService

def get_user_service(
    supabase: Client = Depends(get_supabase)
) -> UserService:
    return UserService(supabase)

@router.get("/")
async def get_users(
    service: UserService = Depends(get_user_service)
):
    return await service.get_all_users()
```

### 4. リポジトリパターンの導入（推奨）

データアクセスロジックを完全に分離：

```python
# app/repositories/user_repository.py
from typing import List, Optional, Dict, Any
from supabase import Client
from app.core.exceptions import handle_supabase_errors

class UserRepository:
    def __init__(self, client: Client):
        self.client = client
        self.table_name = "users"
    
    @handle_supabase_errors("find_all")
    async def find_all(self) -> List[Dict[str, Any]]:
        response = self.client.table(self.table_name).select('*').execute()
        return response.data or []
    
    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        response = self.client.table(self.table_name).select('*').eq('id', user_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    
    @handle_supabase_errors("create")
    async def create(self, user_data: dict) -> Dict[str, Any]:
        response = self.client.table(self.table_name).insert(user_data).execute()
        return response.data[0] if response.data else {}
    
    @handle_supabase_errors("update")
    async def update(self, user_id: str, user_data: dict) -> Optional[Dict[str, Any]]:
        response = self.client.table(self.table_name).update(user_data).eq('id', user_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    
    @handle_supabase_errors("delete")
    async def delete(self, user_id: str) -> bool:
        self.client.table(self.table_name).delete().eq('id', user_id).execute()
        return True
```

### 5. 改善されたサービス層

```python
# app/services/user_service.py
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository

class UserService:
    def __init__(self, user_repository: UserRepository, auth_client):
        self.repository = user_repository
        self.auth_client = auth_client
    
    async def get_all_users(self) -> List[Dict[str, Any]]:
        """すべてのユーザーを取得"""
        return await self.repository.find_all()
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """IDでユーザーを取得"""
        user = await self.repository.find_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    
    async def create_user(self, user_data: dict) -> Dict[str, Any]:
        """ユーザーを作成（認証とDB両方）"""
        # Supabase Authでユーザーを作成
        auth_response = self.auth_client.admin.create_user({
            "email": user_data["email"],
            "password": user_data["password"],
            "email_confirm": True
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user"
            )
        
        # DBに保存
        user_record = {
            "id": auth_response.user.id,
            "email": user_data["email"],
            "created_at": auth_response.user.created_at.isoformat() if auth_response.user.created_at else None,
            "updated_at": auth_response.user.updated_at.isoformat() if auth_response.user.updated_at else None
        }
        
        return await self.repository.create(user_record)
```

### 6. 完全な依存性注入チェーン

```python
# app/api/deps.py
from fastapi import Depends
from supabase import Client
from app.db.supabase import get_supabase
from app.repositories.user_repository import UserRepository
from app.services.user_service import UserService

def get_user_repository(
    supabase_client: Client = Depends(get_supabase)
) -> UserRepository:
    """UserRepositoryのインスタンスを取得"""
    return UserRepository(supabase_client)

def get_user_service(
    supabase_client: Client = Depends(get_supabase),
    user_repository: UserRepository = Depends(get_user_repository)
) -> UserService:
    """UserServiceのインスタンスを取得"""
    return UserService(user_repository, supabase_client.auth)
```

### 7. 実装の優先順位（改訂版）

1. **Phase 1: 依存性注入の基盤整備** ✅
   - `get_supabase()`関数の作成
   - 既存のシングルトンパターンを段階的に置き換え

2. **Phase 2: リポジトリ層の実装**
   - UserRepositoryクラスの作成
   - データアクセスロジックの分離

3. **Phase 3: サービス層の改善**
   - UserServiceをリポジトリパターンに対応
   - ビジネスロジックとデータアクセスの完全分離

4. **Phase 4: 依存性注入の完成**
   - deps.pyに必要な依存性注入関数を追加
   - エンドポイントを新しいパターンに更新

5. **Phase 5: テストとドキュメント**
   - 各層のユニットテスト作成
   - 統合テストの実装
   - APIドキュメントの更新

## ベストプラクティスとの整合性

- ✅ **依存性注入**: テスタビリティと柔軟性の向上
- ✅ **責任分離**: 各層の責任を明確化
- ✅ **テスタビリティ**: モックを使用したテストが容易に
- ✅ **拡張性**: 将来的な変更に対応しやすい構造

## 注意事項

- Supabaseは認証機能も含むため、完全なSQLAlchemyパターンとは異なる
- 既存のAPIの互換性を保ちながら段階的にリファクタリング
- TDDアプローチに従い、まずテストを書いてから実装を変更