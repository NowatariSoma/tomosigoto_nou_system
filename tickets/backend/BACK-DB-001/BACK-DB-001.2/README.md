# BACK-DB-001.2: パート・練習内容テーブルの設計と実装

## 概要
練習表自動生成システムにおけるパート情報および練習内容に関連するデータベーステーブルを設計・実装します。パート定義、練習内容テンプレート、練習難易度などのエンティティを定義します。

## 詳細
- パート定義テーブルの設計と実装
- パートごとの必要設備定義テーブルの設計と実装
- 練習内容テンプレートテーブルの設計と実装
- 練習の難易度と前提条件テーブルの設計と実装
- パート間の関係性定義テーブルの設計と実装

## 依存関係
- 親タスク: BACK-DB-001

## 参照ファイル
- [設計書/10_データモデル_1_概要と主要エンティティ.md](../../../../設計書/10_データモデル_1_概要と主要エンティティ.md)
- [設計書/09_アルゴリズム詳細_1_スケジュール生成.md](../../../../設計書/09_アルゴリズム詳細_1_スケジュール生成.md)

## 成果物
- パート・練習内容テーブル定義SQL
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
1. **parts**
   - part_id: INTEGER PRIMARY KEY
   - part_name: TEXT NOT NULL
   - description: TEXT
   - min_members: INTEGER
   - recommended_members: INTEGER
   - color_code: TEXT
   - is_active: BOOLEAN DEFAULT TRUE
   - created_at: TIMESTAMP
   - updated_at: TIMESTAMP

2. **member_parts**
   - member_part_id: UUID PRIMARY KEY
   - member_id: UUID REFERENCES member_profiles(member_id)
   - part_id: INTEGER REFERENCES parts(part_id)
   - is_primary: BOOLEAN
   - joined_date: DATE
   - skill_level: INTEGER
   - notes: TEXT
   - created_at: TIMESTAMP
   - updated_at: TIMESTAMP

3. **part_equipment_needs**
   - need_id: UUID PRIMARY KEY
   - part_id: INTEGER REFERENCES parts(part_id)
   - equipment_type: TEXT NOT NULL
   - quantity: INTEGER NOT NULL
   - is_required: BOOLEAN
   - notes: TEXT
   - created_at: TIMESTAMP

4. **practice_templates**
   - template_id: UUID PRIMARY KEY
   - template_name: TEXT NOT NULL
   - description: TEXT
   - part_id: INTEGER REFERENCES parts(part_id)
   - difficulty_level: INTEGER
   - duration_minutes: INTEGER NOT NULL
   - min_participants: INTEGER
   - equipment_needs: JSONB
   - content: TEXT
   - created_by: UUID REFERENCES member_profiles(member_id)
   - is_active: BOOLEAN DEFAULT TRUE
   - created_at: TIMESTAMP
   - updated_at: TIMESTAMP

5. **template_dependencies**
   - dependency_id: UUID PRIMARY KEY
   - template_id: UUID REFERENCES practice_templates(template_id)
   - prerequisite_template_id: UUID REFERENCES practice_templates(template_id)
   - time_gap_days: INTEGER
   - notes: TEXT
   - created_at: TIMESTAMP

6. **part_relationships**
   - relationship_id: UUID PRIMARY KEY
   - part_id: INTEGER REFERENCES parts(part_id)
   - related_part_id: INTEGER REFERENCES parts(part_id)
   - relationship_type: TEXT NOT NULL
   - practice_frequency: INTEGER
   - importance_level: INTEGER
   - notes: TEXT
   - created_at: TIMESTAMP

## RLSポリシー
1. **parts テーブル**
   - すべてのログインユーザーが読み取り可能
   - 管理者のみが作成・編集・削除可能

2. **member_parts テーブル**
   - すべてのログインユーザーが読み取り可能
   - 部長と管理者のみが作成・編集・削除可能

3. **part_equipment_needs テーブル**
   - すべてのログインユーザーが読み取り可能
   - 管理者のみが作成・編集・削除可能

4. **practice_templates テーブル**
   - すべてのログインユーザーが読み取り可能
   - 作成者、部長、管理者が編集可能
   - 管理者のみが削除可能

5. **template_dependencies, part_relationships テーブル**
   - すべてのログインユーザーが読み取り可能
   - 管理者のみが作成・編集・削除可能

## 主要ファイル
- `migrations/004_parts.sql` - パートとメンバーパート関連テーブル定義
- `migrations/005_equipment_needs.sql` - 設備ニーズテーブル定義
- `migrations/006_practice_templates.sql` - 練習テンプレートとその依存関係テーブル定義
- `migrations/007_part_relationships.sql` - パート関係テーブル定義
- `rls/002_parts_templates_policies.sql` - RLSポリシー定義
- `seed/002_default_parts.sql` - デフォルトパートの初期データ
- `seed/003_basic_practice_templates.sql` - 基本練習テンプレートの初期データ 