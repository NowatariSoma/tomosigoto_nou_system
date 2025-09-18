# メンバー所属管理API

パートにメンバー（ユーザー）を所属させるためのAPIエンドポイント群です。

## エンドポイント一覧

### 基本操作

#### 1. メンバー所属の一覧取得
```http
GET /api/v1/member-assignments/
```

#### 2. 詳細情報付きメンバー所属の取得
```http
GET /api/v1/member-assignments/detailed?part_id={part_id}&user_id={user_id}
```

#### 3. パート別メンバー所属の取得
```http
GET /api/v1/member-assignments/by-part/{part_id}
```

#### 4. ユーザー別メンバー所属の取得
```http
GET /api/v1/member-assignments/by-user/{user_id}
```

#### 5. 特定のメンバー所属の取得
```http
GET /api/v1/member-assignments/{assignment_id}
```

#### 6. メンバー所属の作成
```http
POST /api/v1/member-assignments/
```

#### 7. 一括メンバー所属の作成
```http
POST /api/v1/member-assignments/bulk/{part_id}
```

#### 8. メンバー所属の更新
```http
PUT /api/v1/member-assignments/{assignment_id}
```

#### 9. メンバー所属の削除
```http
DELETE /api/v1/member-assignments/{assignment_id}
```

#### 10. ユーザーとパート指定での削除
```http
DELETE /api/v1/member-assignments/by-user-and-part/{user_id}/{part_id}
```

## リクエスト例

### メンバー所属の作成
```json
POST /api/v1/member-assignments/
{
  "user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "part_id": "d1111111-1111-1111-1111-111111111111",
  "category": "utai",
  "display_order": 1
}
```

### 一括メンバー所属の作成
```json
POST /api/v1/member-assignments/bulk/d1111111-1111-1111-1111-111111111111
[
  {
    "user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "category": "utai",
    "display_order": 1
  },
  {
    "user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d480",
    "category": "mai",
    "display_order": 2
  }
]
```

### メンバー所属の更新
```json
PUT /api/v1/member-assignments/{assignment_id}
{
  "category": "mai",
  "display_order": 3
}
```

## フィールド説明

- `user_id`: ユーザーID（UUID形式、必須）
- `part_id`: パートID（UUID形式、必須）
- `category`: 謡舞区分（"utai" または "mai"、必須）
- `display_order`: 表示順序（整数、デフォルト: 0）

## エラーレスポンス例

### 重複所属エラー
```json
{
  "error_code": "MEMBER_ASSIGNMENT_ALREADY_EXISTS",
  "error_msg": "このユーザーは既に指定されたパートに所属しています"
}
```

### 存在しないパート
```json
{
  "error_code": "PART_NOT_FOUND",
  "error_msg": "パートが見つかりません"
}
```

### 存在しないユーザー
```json
{
  "error_code": "USER_NOT_FOUND",
  "error_msg": "ユーザーが見つかりません"
}
```

### 無効なカテゴリ
```json
{
  "error_code": "INVALID_CATEGORY",
  "error_msg": "カテゴリは 'utai' または 'mai' である必要があります"
}
```

## 注意事項

1. **ユニーク制約**: 同一ユーザーは同一パートに重複して所属できません
2. **外部キー制約**: 存在しないuser_idやpart_idは指定できません
3. **カテゴリ制約**: categoryは "utai"（謡）または "mai"（舞）のみ有効です
4. **認証必須**: すべてのエンドポイントで認証が必要です

## 使用例シナリオ

### シナリオ1: 新しいパートにメンバーを所属させる

1. パートを作成（既存のpart APIを使用）
2. ユーザーをパートに所属させる
```bash
curl -X POST "http://localhost:8000/api/v1/member-assignments/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "part_id": "d1111111-1111-1111-1111-111111111111",
    "category": "utai",
    "display_order": 1
  }'
```

### シナリオ2: パートの全メンバーを確認する

```bash
curl -X GET "http://localhost:8000/api/v1/member-assignments/by-part/d1111111-1111-1111-1111-111111111111" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### シナリオ3: ユーザーの所属パートを確認する

```bash
curl -X GET "http://localhost:8000/api/v1/member-assignments/by-user/f47ac10b-58cc-4372-a567-0e02b2c3d479" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
