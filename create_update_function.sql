-- Supabaseで更新日時自動更新関数を作成するSQLスクリプト
-- このスクリプトを最初に実行してください

-- 更新日時を自動更新する関数を作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';




