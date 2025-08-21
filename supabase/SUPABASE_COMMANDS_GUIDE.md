# Supabaseコマンド使用ガイド

## 概要
このドキュメントでは、tomosigoto_nou_systemプロジェクトで使用するSupabaseコマンドの基本的な使用方法を説明します。

## インストール状況
- Supabase CLI バージョン: 2.33.7
- ローカル開発環境: 起動中
- データベース: PostgreSQL (ローカル)

## 基本的なコマンド

### 1. ステータス確認
```bash
# ローカル環境のステータスを確認
supabase status
```

### 2. データベース管理

#### データベースリセット
```bash
# ローカルデータベースをリセット（マイグレーションとシードデータを適用）
supabase db reset
```

#### スキーマ差分確認
```bash
# ローカルデータベースとマイグレーションの差分を確認
supabase db diff
```

#### データベース開始
```bash
# ローカルPostgreSQLデータベースを開始
supabase db start
```

### 3. マイグレーション管理

#### 新しいマイグレーション作成
```bash
# 新しいマイグレーションファイルを作成
supabase migration new <migration_name>
```

#### マイグレーション適用
```bash
# 保留中のマイグレーションをローカルデータベースに適用
supabase migration up
```

#### マイグレーション取り消し
```bash
# 最後のn個のマイグレーションを取り消し
supabase migration down <n>
```

### 4. シードデータ管理

#### シードデータ適用
```bash
# 設定ファイルに定義されたシードデータを適用
supabase seed
```

### 5. サービス管理

#### サービス開始
```bash
# ローカルSupabaseサービスを開始
supabase start
```

#### サービス停止
```bash
# ローカルSupabaseサービスを停止
supabase stop
```

#### サービス再起動
```bash
# ローカルSupabaseサービスを再起動
supabase restart
```

### 6. プロジェクト管理

#### プロジェクト初期化
```bash
# 新しいSupabaseプロジェクトを初期化
supabase init
```

#### リモートプロジェクトとのリンク
```bash
# リモートSupabaseプロジェクトとリンク
supabase link --project-ref <project_ref>
```

#### プロジェクトリンク解除
```bash
# リモートプロジェクトとのリンクを解除
supabase unlink
```

## 現在のプロジェクト設定

### データベース接続情報
- **API URL**: http://127.0.0.1:54321
- **GraphQL URL**: http://127.0.0.1:54321/graphql/v1
- **DB URL**: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **Studio URL**: http://127.0.0.1:54323

### 認証情報
- **JWT secret**: super-secret-jwt-token-with-at-least-32-characters-long
- **anon key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- **service_role key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### ストレージ情報
- **S3 Storage URL**: http://127.0.0.1:54321/storage/v1/s3
- **S3 Access Key**: 625729a08b95bf1b7ff351a663f3a23c
- **S3 Secret Key**: 850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907
- **S3 Region**: local

## 既存のマイグレーション

### 適用済みマイグレーション
1. `20250706043141_create_venue_tables.sql` - 会場管理テーブルの作成
2. `20250731064119_create_tables_from_user_dir.sql` - ユーザー関連テーブルの作成

### シードデータ
1. `01_venue_seed.sql` - 会場関連のシードデータ
2. `02_user_seed.sql` - ユーザー関連のシードデータ

## トラブルシューティング

### よくある問題と解決方法

#### 1. プロジェクト参照が見つからない
```bash
# デバッグモードでコマンドを実行
supabase <command> --debug
```

#### 2. データベース接続エラー
```bash
# データベースをリセット
supabase db reset
```

#### 3. マイグレーションエラー
```bash
# マイグレーション履歴を修復
supabase migration repair
```

## 開発ワークフロー

### 1. 新しい機能開発時
```bash
# 1. 新しいマイグレーションを作成
supabase migration new <feature_name>

# 2. マイグレーションファイルを編集

# 3. マイグレーションを適用
supabase db reset

# 4. 変更を確認
supabase db diff
```

### 2. シードデータの追加
```bash
# 1. supabase/seeds/ディレクトリにSQLファイルを追加

# 2. supabase/config.tomlの[db.seed]セクションを更新

# 3. シードデータを適用
supabase seed
```

## 注意事項

1. **ローカル環境**: 現在はローカル開発環境のみ設定されています
2. **リモート連携**: リモートSupabaseプロジェクトとの連携が必要な場合は、`supabase link`コマンドを使用してください
3. **データベース**: ローカルデータベースはDockerコンテナで動作しています
4. **設定ファイル**: `supabase/config.toml`でローカル環境の設定を管理しています

## 参考リンク

- [Supabase CLI公式ドキュメント](https://supabase.com/docs/reference/cli)
- [ローカル開発ガイド](https://supabase.com/docs/guides/local-development)
- [マイグレーションガイド](https://supabase.com/docs/guides/database/migrations) 


```
supabase db reset --linked
```