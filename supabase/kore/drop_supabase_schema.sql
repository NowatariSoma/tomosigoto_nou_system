-- Supabase由来のpublicスキーマと関連拡張を完全削除するスクリプト
-- 実行前に必ずバックアップを取得し、対象DBに不要な接続が無いことを確認してください。

BEGIN;

-- 同名publicationが存在する場合のみ削除
DROP PUBLICATION IF EXISTS supabase_realtime;

-- publicスキーマ配下のRLSポリシーを一括削除
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
      FROM pg_policies
     WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      pol.policyname,
      pol.schemaname,
      pol.tablename
    );
  END LOOP;
END;
$$;

-- publicスキーマを削除（テーブル／ビュー／関数／トリガー等も全て削除）
DROP SCHEMA IF EXISTS public CASCADE;

COMMIT;

-- publicを使い続ける場合は再作成して権限を付与
CREATE SCHEMA IF NOT EXISTS public AUTHORIZATION postgres;

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Supabase固有の拡張機能を削除（不要なもののみコメント解除して使用）
DROP EXTENSION IF EXISTS pg_graphql;
DROP EXTENSION IF EXISTS pg_stat_statements;
DROP EXTENSION IF EXISTS pgcrypto;
DROP EXTENSION IF EXISTS supabase_vault;
DROP EXTENSION IF EXISTS "uuid-ossp";

