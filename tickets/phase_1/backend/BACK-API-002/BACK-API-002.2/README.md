# BACK-API-002.2: 練習セッション作成・更新・削除APIエンドポイント実装

## 概要
練習表自動生成システムにおいて、練習セッションの基本CRUD操作（作成・読取・更新・削除）を行うAPIエンドポイントをPythonで実装します。これにより、ユーザーが練習スケジュールを管理し、セッションの詳細を調整できるようになります。

## 詳細
- 練習セッション作成API（POST）の実装
- 練習セッション更新API（PUT/PATCH）の実装
- 練習セッション削除API（DELETE）の実装
- リクエストデータの検証と整合性チェック機能
- 権限に基づいたアクセス制御の実装
- トランザクション管理による一貫性の確保

## 依存関係
- 親タスク: BACK-API-002
- BACK-DB-001.3: 練習スケジュール・セッションテーブル設計
- BACK-API-001: 基本認証システム

## 参照ファイル
- [設計書/06_インターフェース設計.md](../../../../設計書/06_インターフェース設計.md)
- [設計書/11g_実装指針_バックエンド.md](../../../../設計書/11g_実装指針_バックエンド.md)

## 成果物
- セッション作成・更新・削除APIエンドポイント実装
- リクエスト検証とエラーハンドリング機能
- 権限制御の実装
- APIドキュメント（OpenAPI/Swagger形式）
- 単体テストコード

## ステータス
- [x] 未開始
- [ ] 進行中
- [ ] レビュー中
- [ ] 完了

## 担当者
未割り当て

## 主要機能
1. **セッション作成機能**
   - 新規練習セッションの基本情報登録
   - パート、時間枠、内容、監督者の設定
   - 親スケジュールとの関連付け
   - 作成に関する権限チェック
   - 重複チェックとバリデーション

2. **セッション更新機能**
   - 既存セッションの基本情報更新
   - 部分更新（PATCHメソッド）による効率的な変更
   - 更新に関する権限チェック
   - 更新履歴の記録（監査証跡）
   - バージョン管理の実装（競合解決）

3. **セッション削除機能**
   - 既存セッションの論理削除/物理削除
   - 関連データの整合性確保
   - 削除に関する権限チェック
   - 一括削除機能
   - 復元機能（オプション）

4. **共通機能**
   - 詳細なエラーメッセージと適切なHTTPステータスコード
   - トランザクション管理による一貫性確保
   - パフォーマンス最適化
   - 監査ログ記録
   - 通知機能連携

## 実装予定ファイル
以下は実装予定の全ファイルのリストです。各ファイルの役割と目的を簡潔に記載します。

- `app/api/v1/endpoints/sessions.py` - セッションCRUD APIエンドポイント定義
- `app/services/session_service.py` - セッションCRUDビジネスロジック
- `app/repositories/session_repository.py` - セッションデータアクセス層
- `app/models/session.py` - セッションデータモデル定義
- `app/schemas/session.py` - リクエスト/レスポンススキーマ定義
- `app/core/validation.py` - セッションデータ検証ロジック
- `app/core/permissions.py` - セッション操作権限チェック
- `tests/api/test_session_endpoints.py` - APIエンドポイントテスト
- `tests/services/test_session_service.py` - サービス層テスト
- `tests/repositories/test_session_repository.py` - リポジトリ層テスト

## 設計図
### クラス図
```mermaid
classDiagram
    class SessionEndpoint {
        +create_session(session_data)
        +update_session(session_id, session_data)
        +partial_update_session(session_id, partial_data)
        +delete_session(session_id)
        +delete_sessions_bulk(session_ids)
    }
    
    class SessionService {
        -session_repository: SessionRepository
        -permissions_service: PermissionsService
        +create_session(session_data, user_id)
        +update_session(session_id, session_data, user_id)
        +partial_update_session(session_id, partial_data, user_id)
        +delete_session(session_id, user_id)
        +delete_sessions_bulk(session_ids, user_id)
        -validate_session_data(session_data)
        -check_session_conflicts(session_data)
        -log_session_change(session_id, action, user_id)
    }
    
    class SessionRepository {
        +create(session_data)
        +update(session_id, session_data)
        +partial_update(session_id, partial_data)
        +delete(session_id)
        +delete_bulk(session_ids)
        +get_by_id(session_id)
        +check_conflicts(session_data)
        -build_update_query(session_id, data)
    }
    
    class PermissionsService {
        +can_create_session(user_id, schedule_id)
        +can_update_session(user_id, session_id)
        +can_delete_session(user_id, session_id)
        -get_user_roles(user_id)
        -check_role_permissions(roles, action, resource)
    }
    
    class SessionModel {
        +id: int
        +schedule_id: int
        +part_id: int
        +start_time: datetime
        +end_time: datetime
        +description: str
        +supervisor_id: int
        +created_at: datetime
        +updated_at: datetime
        +created_by: int
        +updated_by: int
    }
    
    class SessionCreateSchema {
        +schedule_id: int
        +part_id: int
        +start_time: datetime
        +end_time: datetime
        +description: Optional[str]
        +supervisor_id: Optional[int]
        +class Config
    }
    
    class SessionUpdateSchema {
        +part_id: Optional[int]
        +start_time: Optional[datetime]
        +end_time: Optional[datetime]
        +description: Optional[str]
        +supervisor_id: Optional[int]
        +class Config
    }
    
    class SessionResponseSchema {
        +id: int
        +schedule_id: int
        +part: PartSchema
        +start_time: datetime
        +end_time: datetime
        +description: str
        +supervisor: UserSchema
        +created_at: datetime
        +updated_at: datetime
        +class Config
    }
    
    SessionEndpoint --> SessionService : 使用
    SessionService --> SessionRepository : 使用
    SessionService --> PermissionsService : 使用
    SessionRepository --> SessionModel : 操作
    SessionEndpoint --> SessionCreateSchema : 受け取り
    SessionEndpoint --> SessionUpdateSchema : 受け取り
    SessionEndpoint --> SessionResponseSchema : 返却
```

### データベース構造図
```mermaid
erDiagram
    schedules ||--o{ sessions : contains
    schedules {
        int id PK "スケジュールID"
        varchar title "タイトル"
        datetime start_datetime "開始日時"
        datetime end_datetime "終了日時"
        int location_id FK "会場ID"
        text description "説明"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
        int created_by "作成者ID"
        int updated_by "更新者ID"
    }
    
    sessions ||--o| parts : belongs_to
    sessions {
        int id PK "セッションID"
        int schedule_id FK "スケジュールID"
        int part_id FK "パートID"
        datetime start_time "開始時間"
        datetime end_time "終了時間"
        text description "説明"
        int supervisor_id FK "監督者ID"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
        int created_by "作成者ID"
        int updated_by "更新者ID"
        bool is_deleted "削除フラグ"
    }
    
    parts ||--o{ sessions : used_in
    parts {
        int id PK "パートID"
        varchar name "パート名"
        text description "説明"
        int parent_id FK "親パートID"
    }
    
    users ||--o{ sessions : supervises
    users {
        int id PK "ユーザーID"
        varchar name "氏名"
        varchar email "メールアドレス"
    }
    
    users ||--o{ sessions_audit : modifies
    sessions_audit {
        int id PK "監査ID"
        int session_id FK "セッションID"
        varchar action "アクション"
        jsonb previous_data "変更前データ"
        jsonb new_data "変更後データ"
        int user_id FK "操作ユーザーID"
        datetime timestamp "タイムスタンプ"
    }
```

### シーケンス図
```mermaid
sequenceDiagram
    participant Client
    participant API as FastAPI
    participant Service as SessionService
    participant Permissions as PermissionsService
    participant Repo as SessionRepository
    participant DB as Database
    
    Client->>API: POST /sessions (session_data)
    API->>Service: create_session(session_data, user_id)
    Service->>Permissions: can_create_session(user_id, schedule_id)
    Permissions-->>Service: true/false
    
    alt 権限あり
        Service->>Service: validate_session_data(session_data)
        Service->>Service: check_session_conflicts(session_data)
        Service->>Repo: create(session_data)
        Repo->>DB: INSERT
        DB-->>Repo: session_id
        Repo-->>Service: created_session
        Service->>Service: log_session_change(session_id, "create", user_id)
        Service-->>API: SessionResponseSchema
        API-->>Client: 201 Created (session)
    else 権限なし
        Service-->>API: PermissionError
        API-->>Client: 403 Forbidden
    end
    
    Client->>API: PUT /sessions/{session_id} (session_data)
    API->>Service: update_session(session_id, session_data, user_id)
    Service->>Permissions: can_update_session(user_id, session_id)
    Permissions-->>Service: true/false
    
    alt 権限あり
        Service->>Repo: get_by_id(session_id)
        Repo-->>Service: current_session
        Service->>Service: validate_session_data(session_data)
        Service->>Service: check_session_conflicts(session_data)
        Service->>Repo: update(session_id, session_data)
        Repo->>DB: UPDATE
        DB-->>Repo: rows_affected
        Repo-->>Service: updated_session
        Service->>Service: log_session_change(session_id, "update", user_id)
        Service-->>API: SessionResponseSchema
        API-->>Client: 200 OK (session)
    else 権限なし
        Service-->>API: PermissionError
        API-->>Client: 403 Forbidden
    end
    
    Client->>API: DELETE /sessions/{session_id}
    API->>Service: delete_session(session_id, user_id)
    Service->>Permissions: can_delete_session(user_id, session_id)
    Permissions-->>Service: true/false
    
    alt 権限あり
        Service->>Repo: delete(session_id)
        Repo->>DB: DELETE/UPDATE
        DB-->>Repo: rows_affected
        Repo-->>Service: success
        Service->>Service: log_session_change(session_id, "delete", user_id)
        Service-->>API: DeleteResponse
        API-->>Client: 204 No Content
    else 権限なし
        Service-->>API: PermissionError
        API-->>Client: 403 Forbidden
    end
```

## 実装アプローチ
### CRUD機能実装
1. **作成（Create）機能**
   - リクエストデータのバリデーション
   - データ整合性の確認（日時の重複、スケジュール範囲内かなど）
   - トランザクション内でのデータ挿入
   - 監査ログの記録
   - 成功/エラー応答の適切な形式化

2. **更新（Update）機能**
   - 既存データの取得と存在確認
   - 更新権限の確認
   - 部分更新（PATCH）と完全更新（PUT）の区別
   - 楽観的ロックによる競合防止
   - 変更履歴の記録

3. **削除（Delete）機能**
   - 論理削除と物理削除の実装
   - 関連データの整合性確保
   - 削除権限の確認
   - 一括削除の効率的実装
   - 削除通知の実装

4. **権限管理**
   - ロールベースのアクセス制御（RBAC）実装
   - きめ細かいアクセス権限設定
   - パート責任者/一般ユーザーの権限差別化
   - 自身が担当するセッションへの特別権限

## 実装するすべてのファイル構成詳細
以下は全ての実装予定ファイルの詳細です。各ファイルごとに目的とクラス/インターフェース、メソッド、依存関係などを詳しく記載します。

### `app/api/v1/endpoints/sessions.py`
**目的**: セッションのCRUD操作を行うREST APIエンドポイントを定義する

**クラス/関数**:
- **ルーター定義**: `router = APIRouter()`
- **エンドポイント関数**:
  - `@router.post("/sessions/", response_model=SessionResponseSchema, status_code=201)`: 新規セッション作成
  - `@router.put("/sessions/{session_id}", response_model=SessionResponseSchema)`: セッション完全更新
  - `@router.patch("/sessions/{session_id}", response_model=SessionResponseSchema)`: セッション部分更新
  - `@router.delete("/sessions/{session_id}", status_code=204)`: セッション削除
  - `@router.post("/sessions/bulk-delete", status_code=204)`: セッション一括削除
- **エラーハンドリング**:
  - `@router.exception_handler(SessionNotFoundError)`: セッション未発見エラー処理
  - `@router.exception_handler(SessionConflictError)`: セッション競合エラー処理
  - `@router.exception_handler(PermissionError)`: 権限エラー処理
- **依存関係**:
  - `SessionService`: セッションサービス（DI）
  - `get_current_user`: 認証ユーザー取得（必須）

### `app/services/session_service.py`
**目的**: セッションのCRUD操作に関するビジネスロジックを実装する

**クラス/インターフェース**:
- `SessionService`: セッション操作サービス
  - **初期化**: `def __init__(self, session_repository: SessionRepository, permissions_service: PermissionsService)`
  - **主要メソッド**:
    - `create_session(session_data: SessionCreateSchema, user_id: int) -> SessionModel`: 新規セッション作成
    - `update_session(session_id: int, session_data: SessionUpdateSchema, user_id: int) -> SessionModel`: セッション完全更新
    - `partial_update_session(session_id: int, partial_data: Dict, user_id: int) -> SessionModel`: セッション部分更新
    - `delete_session(session_id: int, user_id: int) -> bool`: セッション削除
    - `delete_sessions_bulk(session_ids: List[int], user_id: int) -> int`: セッション一括削除
  - **補助メソッド**:
    - `_validate_session_data(session_data: Dict) -> None`: セッションデータのバリデーション
    - `_check_session_conflicts(session_data: Dict) -> None`: セッションの時間的競合チェック
    - `_log_session_change(session_id: int, action: str, user_id: int) -> None`: セッション変更の監査ログ記録
  - **例外処理**:
    - `SessionNotFoundError`: セッションが見つからない場合
    - `SessionConflictError`: セッションの競合がある場合
    - `SessionValidationError`: セッションデータが無効な場合
  - **依存クラス**: `SessionRepository`, `PermissionsService`

### `app/repositories/session_repository.py`
**目的**: セッションデータへのCRUDアクセスロジックを提供する

**クラス/インターフェース**:
- `SessionRepository`: セッションデータアクセス層
  - **初期化**: `def __init__(self, db_session: Session)`
  - **主要メソッド**:
    - `create(session_data: Dict) -> SessionModel`: 新規セッション作成
    - `update(session_id: int, session_data: Dict) -> SessionModel`: セッション完全更新
    - `partial_update(session_id: int, partial_data: Dict) -> SessionModel`: セッション部分更新
    - `delete(session_id: int) -> bool`: セッション削除
    - `delete_bulk(session_ids: List[int]) -> int`: セッション一括削除
    - `get_by_id(session_id: int) -> Optional[SessionModel]`: IDによるセッション取得
    - `check_conflicts(session_data: Dict) -> List[SessionModel]`: 時間的競合チェック
  - **補助メソッド**:
    - `_build_update_query(session_id: int, data: Dict)`: 更新クエリの構築
    - `_log_audit(session_id: int, action: str, prev_data: Dict, new_data: Dict, user_id: int)`: 監査ログ記録
  - **依存クラス**: `SQLAlchemy Session`, `SessionModel`, `SessionAuditModel`

### `app/core/permissions.py`
**目的**: セッション操作の権限チェックロジックを提供する

**クラス/インターフェース**:
- `PermissionsService`: 権限管理サービス
  - **初期化**: `def __init__(self, db_session: Session)`
  - **主要メソッド**:
    - `can_create_session(user_id: int, schedule_id: int) -> bool`: セッション作成権限チェック
    - `can_update_session(user_id: int, session_id: int) -> bool`: セッション更新権限チェック
    - `can_delete_session(user_id: int, session_id: int) -> bool`: セッション削除権限チェック
  - **補助メソッド**:
    - `_get_user_roles(user_id: int) -> List[str]`: ユーザーのロール取得
    - `_check_role_permissions(roles: List[str], action: str, resource: str) -> bool`: ロールベースの権限チェック
    - `_is_part_manager(user_id: int, part_id: int) -> bool`: パート責任者かどうかのチェック
    - `_is_session_supervisor(user_id: int, session_id: int) -> bool`: セッション監督者かどうかのチェック
  - **依存クラス**: `SQLAlchemy Session`, `UserModel`, `RoleModel`, `PartModel`

### `app/schemas/session.py`
**目的**: セッション関連のリクエスト/レスポンススキーマを定義する

**クラス/インターフェース**:
- `SessionCreateSchema`: セッション作成リクエストのPydanticモデル
  - **継承/実装**: `BaseModel` (Pydantic)
  - **フィールド定義**:
    - `schedule_id: int`: スケジュールID
    - `part_id: int`: パートID
    - `start_time: datetime`: 開始時間
    - `end_time: datetime`: 終了時間
    - `description: Optional[str] = None`: 説明
    - `supervisor_id: Optional[int] = None`: 監督者ID
  - **バリデーション**:
    - `@validator('end_time')`: 終了時間が開始時間より後であることを確認
    - `@validator('schedule_id')`: 存在するスケジュールIDであることを確認
    - `@validator('part_id')`: 存在するパートIDであることを確認

- `SessionUpdateSchema`: セッション更新リクエストのPydanticモデル
  - **継承/実装**: `BaseModel` (Pydantic)
  - **フィールド定義**:
    - `part_id: Optional[int] = None`: パートID
    - `start_time: Optional[datetime] = None`: 開始時間
    - `end_time: Optional[datetime] = None`: 終了時間
    - `description: Optional[str] = None`: 説明
    - `supervisor_id: Optional[int] = None`: 監督者ID
  - **バリデーション**:
    - `@validator('end_time')`: 設定される場合、開始時間より後であることを確認
    - `@validator('part_id')`: 設定される場合、存在するパートIDであることを確認

- `SessionResponseSchema`: セッションレスポンスのPydanticモデル
  - **継承/実装**: `BaseModel` (Pydantic)
  - **フィールド定義**:
    - `id: int`: セッションID
    - `schedule_id: int`: スケジュールID
    - `part: PartSchema`: パート情報
    - `start_time: datetime`: 開始時間
    - `end_time: datetime`: 終了時間
    - `description: Optional[str]`: 説明
    - `supervisor: Optional[UserSchema]`: 監督者情報
    - `created_at: datetime`: 作成日時
    - `updated_at: datetime`: 更新日時
  - **設定クラス**: `Config` (ORM対応設定)

- `SessionDeleteMultipleSchema`: セッション一括削除リクエストのPydanticモデル
  - **継承/実装**: `BaseModel` (Pydantic)
  - **フィールド定義**:
    - `session_ids: List[int]`: 削除するセッションIDリスト
  - **バリデーション**:
    - `@validator('session_ids')`: 少なくとも1つのIDが含まれていることを確認

## ファイル間クラス連携図
```mermaid
graph TD
    subgraph "API層"
        EP[sessions.py]
    end
    
    subgraph "サービス層"
        SVC[session_service.py]
        PERM[permissions.py]
    end
    
    subgraph "リポジトリ層"
        REPO[session_repository.py]
    end
    
    subgraph "モデル層"
        MDL[session.py]
    end
    
    subgraph "スキーマ層"
        SCH[session.py スキーマ]
    end
    
    EP --> SVC
    SVC --> REPO
    SVC --> PERM
    REPO --> MDL
    EP --> SCH
    
    classDef api fill:#bbf,stroke:#333,stroke-width:2px;
    classDef service fill:#ddf,stroke:#333,stroke-width:1px;
    classDef repo fill:#ffd,stroke:#333,stroke-width:1px;
    classDef model fill:#bfb,stroke:#333,stroke-width:1px;
    classDef util fill:#fdb,stroke:#333,stroke-width:1px;
    
    class EP api;
    class SVC,PERM service;
    class REPO repo;
    class MDL,SCH model;
``` 