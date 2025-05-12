# BACK-DB-001.1: ユーザー・メンバー管理テーブルの設計と実装

## 概要
練習表自動生成システムのユーザーアカウント管理およびメンバー情報管理に関連するデータベーステーブルを設計・実装します。認証情報、メンバープロフィール、役割管理、パート所属情報などのエンティティを定義します。

## 詳細
- ユーザーアカウントテーブル（auth.users拡張）の設計
- メンバープロフィールテーブルの設計と実装
- 役割（ロール）管理テーブルの設計と実装
- パート所属情報テーブルの設計と実装
- 監督者資格情報テーブルの設計と実装

## 依存関係
- 親タスク: BACK-DB-001

## 参照ファイル
- [設計書/10_データモデル_1_概要と主要エンティティ.md](../../../../設計書/10_データモデル_1_概要と主要エンティティ.md)
- [設計書/07_権限・ロール設計.md](../../../../設計書/07_権限・ロール設計.md)

## 成果物
- ユーザー・メンバー管理テーブル定義SQL
- ER図（該当部分）
- RLSポリシー定義
- 初期データスクリプト
- テーブル間制約定義

## ステータス
- [ ] 未開始
- [ ] 進行中
- [ ] レビュー中
- [ ] 完了

## 担当者
未割り当て

## 主要テーブル
1. **users** (Supabase Auth拡張)
   - user_id: UUID PRIMARY KEY
   - email: TEXT UNIQUE NOT NULL
   - encrypted_password: TEXT
   - created_at: TIMESTAMP
   - last_sign_in_at: TIMESTAMP
   - is_confirmed: BOOLEAN
   - confirmation_token: TEXT

2. **member_profiles**
   - member_id: UUID PRIMARY KEY
   - user_id: UUID REFERENCES users(id)
   - display_name: TEXT NOT NULL
   - furigana: TEXT
   - phone_number: TEXT
   - joined_date: DATE
   - status: TEXT NOT NULL
   - profile_image_url: TEXT
   - created_at: TIMESTAMP
   - updated_at: TIMESTAMP

3. **roles**
   - role_id: INTEGER PRIMARY KEY
   - role_name: TEXT NOT NULL
   - description: TEXT
   - permission_level: INTEGER NOT NULL
   - created_at: TIMESTAMP

4. **member_roles**
   - member_role_id: UUID PRIMARY KEY
   - member_id: UUID REFERENCES member_profiles(member_id)
   - role_id: INTEGER REFERENCES roles(role_id)
   - assigned_at: TIMESTAMP
   - assigned_by: UUID REFERENCES member_profiles(member_id)
   - valid_until: TIMESTAMP

5. **supervisor_qualifications**
   - qualification_id: UUID PRIMARY KEY
   - member_id: UUID REFERENCES member_profiles(member_id)
   - part_id: INTEGER REFERENCES parts(part_id)
   - qualification_level: INTEGER NOT NULL
   - qualification_date: DATE
   - approved_by: UUID REFERENCES member_profiles(member_id)
   - notes: TEXT

## RLSポリシー
1. **users テーブル**
   - ユーザー自身のみが自分のレコードを読み取り可能
   - 管理者のみが全ユーザーを読み取り・編集可能

2. **member_profiles テーブル**
   - ログインユーザーは全メンバーのプロフィールを読み取り可能
   - ユーザー自身のみが自分のプロフィールを編集可能
   - 管理者は全メンバーのプロフィールを編集可能

3. **roles, member_roles テーブル**
   - ログインユーザーは読み取りのみ可能
   - 管理者のみが編集可能

4. **supervisor_qualifications テーブル**
   - ログインユーザーは読み取りのみ可能
   - 部長と管理者のみが編集可能

## 主要ファイル
- `migrations/001_users_members.sql` - ユーザーとメンバーテーブル定義
- `migrations/002_roles.sql` - ロールとメンバーロールテーブル定義
- `migrations/003_supervisor_qualifications.sql` - 監督者資格テーブル定義
- `rls/001_users_members_policies.sql` - RLSポリシー定義
- `seed/001_default_roles.sql` - デフォルトロールの初期データ 