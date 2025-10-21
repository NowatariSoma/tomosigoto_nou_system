# スケジュールボトムシートのテスト

## 概要

このドキュメントでは、スケジュールボトムシートでセッション情報が適切に表示されるかテストする方法を説明します。

## 実装内容

### 1. フロントエンドの修正

`frontend/features/practice-slots/components/ScheduleTable.tsx`を更新して、以下の情報を表示するようにしました：

- ✅ **セッションタイトル** (`session_title`) - 青色で目立つように表示
- ✅ **パート名** (`part_name`) - 太字で表示
- ✅ **指導者情報** (`instructors`) - 🎭アイコンと共に表示
- ✅ **参加者数** (`participants`) - 👥アイコンと共に表示
- ✅ **ステータス** (`status`) - 英語→日本語変換、色分け
  - "confirmed" → 「確定」（緑色）
  - "tentative" → 「仮」（黄色）

### 2. テストツール

#### A. テストページ

**場所**: `frontend/app/test-schedule-table/page.tsx`

**アクセス**: `http://localhost:3000/test-schedule-table`

**機能**:
- モックデータと実際のAPIデータの両方でテスト可能
- データ構造の検証結果を表示
- セッション情報が正しく表示されるか視覚的に確認

**使い方**:
1. フロントエンドアプリケーションを起動
2. ブラウザで `/test-schedule-table` にアクセス
3. 「実際のAPIデータを使用」を選択
4. 日付を選択して「データを取得」ボタンをクリック
5. ScheduleTableコンポーネントがデータを正しく表示しているか確認

#### B. APIテストスクリプト

**場所**: `frontend/test-api-data.ts`

**使い方**:
```bash
cd frontend
npx ts-node test-api-data.ts
```

**機能**:
- `/api/v1/practice_schedules/date/{date}/ideal` エンドポイントをテスト
- データ構造の検証
- フロントエンドとの互換性チェック

## APIエンドポイント

バックエンドのAPIエンドポイントは以下の通りです：

```
GET /api/v1/practice_schedules/date/{target_date}/ideal
```

**レスポンス形式**:
```typescript
{
  schedule_info: {
    id: string;
    schedule_date: string;  // YYYY-MM-DD
    start_time: string;     // HH:MM:SS
    end_time: string;       // HH:MM:SS
    title?: string;
    description: string;
  };
  venues: Array<{
    id: string;
    name: string;
    priority: number;
    color: string;
  }>;
  time_schedule: {
    [time: string]: {      // "09:00"など
      [venue_id: string]: Array<{
        part_id: string;
        part_name: string;
        part_color: string;
        session_title: string;
        instructors: string[];
        participants: number;
        status: string;     // "confirmed", "tentative"など
        slot_order?: number;
        schedule_available_venue_id?: string;
      }>
    }
  };
  debug_info?: {
    sessions_count: number;
    venues_count: number;
    division_count: number;
  };
}
```

## バックエンドの起動

### 環境変数の設定

バックエンドを起動するには、以下の環境変数が必要です：

- `SUPABASE_URL` - SupabaseのプロジェクトURL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabaseのサービスロールキー
- その他の設定（`.env`ファイル参照）

### Dockerでの起動

```bash
docker-compose up -d
```

### ローカルでの起動

```bash
cd backend
pip install -r requirements.txt

# 環境変数を読み込む
source ../.env

# バックエンドを起動
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 確認ポイント

### バックエンドの確認

1. バックエンドが起動しているか確認
   ```bash
   curl http://localhost:8000/docs
   ```

2. Ideal形式のエンドポイントが利用可能か確認
   ```bash
   curl http://localhost:8000/api/v1/practice_schedules/date/2025-01-15/ideal
   ```

### フロントエンドの確認

1. `/test-schedule-table` ページにアクセス
2. モックデータで表示が正しいか確認
3. 実際のAPIデータで表示が正しいか確認

## トラブルシューティング

### エラー: "SUPABASE_URL must be set"

環境変数が設定されていません。`.env`ファイルを確認し、必要な環境変数を設定してください。

### エラー: "Not Found" (404)

エンドポイントのURLが正しいか確認してください。正しいエンドポイントは：
- ❌ `/api/practice-slots/date/{date}/ideal`
- ✅ `/api/v1/practice_schedules/date/{date}/ideal`

### データが表示されない

1. バックエンドが正常に起動しているか確認
2. 指定した日付にスケジュールが存在するか確認
3. ブラウザの開発者ツールでネットワークタブを確認

## 次のステップ

- [ ] バックエンドの環境変数を正しく設定
- [ ] バックエンドを起動してAPIが正常に動作するか確認
- [ ] テストページで実際のデータを取得して表示を確認
- [ ] 実際のスケジュールページ（`/schedule?date=YYYY-MM-DD`）で動作を確認

## 関連ファイル

- `frontend/features/practice-slots/components/ScheduleTable.tsx` - スケジュールテーブルコンポーネント
- `frontend/app/test-schedule-table/page.tsx` - テストページ
- `frontend/test-api-data.ts` - APIテストスクリプト
- `backend/app/api/endpoints/practice_slots.py` - APIエンドポイント実装
- `backend/app/services/practice_schedule_service.py` - ビジネスロジック
