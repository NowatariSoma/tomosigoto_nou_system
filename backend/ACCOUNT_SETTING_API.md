# Account Setting API ドキュメント

## 概要

`http://localhost:3000/account-setting` に対応するバックエンドAPIとDB（Supabase）の実装です。

## API エンドポイント

ベースURL: `http://localhost:8000/api/v1/account-setting`

### 1. プロフィール関連

#### 現在のユーザープロフィール取得
```http
GET /profile
Authorization: Bearer <JWT_TOKEN>
```

#### プロフィール作成
```http
POST /profile
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "student_id": "1234567890",
  "first_name_kanji": "太郎",
  "first_name_katakana": "タロウ",
  "last_name_kanji": "田中",
  "last_name_katakana": "タナカ",
  "year": 3,
  "faculty": "文",
  "email": "tanaka@mail.doshisha.ac.jp"
}
```

#### プロフィール更新
```http
PUT /profile
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "year": 4,
  "faculty": "法",
  "change_reason": "学部変更"
}
```

#### プロフィール削除
```http
DELETE /profile
Authorization: Bearer <JWT_TOKEN>
```

### 2. 学部関連

#### 学部一覧取得
```http
GET /faculties
```

#### 特定学部取得
```http
GET /faculties/{faculty_code}
```

### 3. 変更履歴関連

#### 変更履歴取得
```http
GET /profile/history?limit=50
Authorization: Bearer <JWT_TOKEN>
```

#### 特定フィールドの変更履歴取得
```http
GET /profile/history/{field_name}?limit=20
Authorization: Bearer <JWT_TOKEN>
```

### 4. バリデーション関連

#### プロフィールデータバリデーション
```http
POST /validate
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "student_id": "1234567890",
  "email": "test@mail.doshisha.ac.jp",
  "faculty": "文"
}
```

### 5. 統計・集計関連

#### プロフィール統計情報取得
```http
GET /statistics
Authorization: Bearer <JWT_TOKEN>
```

### 6. ユーティリティ

#### 学籍番号でプロフィール取得
```http
GET /profile/student-id/{student_id}
Authorization: Bearer <JWT_TOKEN>
```

#### ヘルスチェック
```http
GET /health
```

## データベーススキーマ

### 1. faculties テーブル
```sql
CREATE TABLE faculties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_code VARCHAR(10) UNIQUE NOT NULL,
    faculty_name VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2. user_profiles テーブル（拡張）
既存の `user_profiles` テーブルに `faculty_id` カラムを追加

### 3. account_setting_history テーブル
```sql
CREATE TABLE account_setting_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    change_reason TEXT
);
```

### 4. account_setting_profile ビュー
```sql
CREATE VIEW account_setting_profile AS
SELECT 
    up.id,
    up.user_id,
    up.student_id,
    up.first_name_kanji,
    up.first_name_katakana,
    up.last_name_kanji,
    up.last_name_katakana,
    up.grade as year,
    f.faculty_code as faculty,
    f.faculty_name as faculty_name,
    u.email,
    up.avatar_url,
    up.preferences,
    up.created_at,
    up.updated_at
FROM user_profiles up
LEFT JOIN auth.users u ON up.user_id = u.id
LEFT JOIN faculties f ON up.faculty_id = f.id;
```

## 実装ファイル

### バックエンド
- `app/schemas/account_setting.py` - Pydanticスキーマ
- `app/repositories/account_setting_repository.py` - データアクセス層
- `app/services/account_setting_service.py` - ビジネスロジック層
- `app/api/endpoints/account_setting.py` - APIエンドポイント
- `app/api/deps.py` - 依存性注入設定（更新）
- `app/api/api.py` - メインルーター（更新）

### データベース
- `supabase/migrations/20250120000001_create_account_setting_tables.sql` - マイグレーション

### テスト
- `test_account_setting_api.sh` - APIテストスクリプト

## 使用方法

### 1. マイグレーション実行
```bash
cd supabase
supabase db push
```

### 2. バックエンド起動
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. APIテスト実行
```bash
cd backend
./test_account_setting_api.sh
```

## 注意事項

1. 認証が必要なエンドポイントは有効なJWTトークンが必要です
2. 学籍番号とメールアドレスは重複チェックが行われます
3. 学部コードは事前に定義された値のみ有効です
4. 変更履歴は自動的に記録されます
5. バリデーションエラーは詳細なメッセージを返します

## エラーレスポンス

```json
{
  "detail": "Validation failed: ['学籍番号は必須です', '有効なメールアドレスを入力してください']",
  "error_code": "BAD_REQUEST"
}
```

## 成功レスポンス

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "student_id": "1234567890",
  "first_name_kanji": "太郎",
  "first_name_katakana": "タロウ",
  "last_name_kanji": "田中",
  "last_name_katakana": "タナカ",
  "year": 3,
  "faculty": "文",
  "faculty_name": "文学部",
  "email": "tanaka@mail.doshisha.ac.jp",
  "created_at": "2025-01-20T00:00:00Z",
  "updated_at": "2025-01-20T00:00:00Z"
}
```
