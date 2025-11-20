-- お問い合わせテーブルの作成
-- ユーザーからの問い合わせを管理するテーブル

-- 1. contacts テーブル
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,  -- NULL許可（user_idから自動生成）
    category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'question', 'other')),
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. インデックスの作成（パフォーマンス向上のため）
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_category ON contacts(category);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);

-- 3. updated_at自動更新トリガー
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 4. テーブルコメント
COMMENT ON TABLE contacts IS 'ユーザーからのお問い合わせを管理するテーブル';

-- 5. カラムコメント
COMMENT ON COLUMN contacts.id IS 'お問い合わせID（主キー）';
COMMENT ON COLUMN contacts.user_id IS 'ユーザーID（auth.users参照）';
COMMENT ON COLUMN contacts.name IS '問い合わせ者の名前（user_idから自動生成、NULL許可）';
COMMENT ON COLUMN contacts.category IS 'カテゴリ（bug: バグ報告, feature: 機能要望, question: 質問, other: その他）';
COMMENT ON COLUMN contacts.content IS '問い合わせ内容';
COMMENT ON COLUMN contacts.status IS '対応状況（pending: 未対応, in_progress: 対応中, resolved: 解決済み, closed: クローズ）';
COMMENT ON COLUMN contacts.created_at IS '作成日時';
COMMENT ON COLUMN contacts.updated_at IS '更新日時';

-- 6. RLSポリシーの設定
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の問い合わせのみ閲覧可能
CREATE POLICY "Users can only view own contacts" ON public.contacts
    FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分の問い合わせのみ作成可能
CREATE POLICY "Users can only insert own contacts" ON public.contacts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の問い合わせのみ更新可能
CREATE POLICY "Users can only update own contacts" ON public.contacts
    FOR UPDATE USING (auth.uid() = user_id);

-- 管理者は全問い合わせアクセス可能
CREATE POLICY "Admins can manage all contacts" ON public.contacts
    FOR ALL USING (auth.role() = 'service_role');

