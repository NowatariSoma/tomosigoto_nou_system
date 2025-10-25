-- イベントテーブルの作成
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,  -- evt_タイムスタンプ_ランダム文字列 形式
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    event_type TEXT,  -- 'practice', 'performance', 'meeting', 'other'
    status TEXT DEFAULT 'active',  -- 'active', 'cancelled', 'completed'
    total_amount DECIMAL(10, 2) DEFAULT 0,  -- 総金額
    currency TEXT DEFAULT 'JPY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- イベント決済テーブルの作成
CREATE TABLE IF NOT EXISTS public.event_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending',  -- 'pending', 'paid', 'partial', 'cancelled'
    payment_method TEXT,  -- 'cash', 'bank_transfer', 'credit_card', 'other'
    payment_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_event_settlements_event_id ON public.event_settlements(event_id);
CREATE INDEX IF NOT EXISTS idx_event_settlements_user_id ON public.event_settlements(user_id);
CREATE INDEX IF NOT EXISTS idx_event_settlements_status ON public.event_settlements(status);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_settlements_updated_at BEFORE UPDATE ON public.event_settlements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) ポリシーの設定
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settlements ENABLE ROW LEVEL SECURITY;

-- 全てのユーザーがイベントを閲覧可能
CREATE POLICY "Events are viewable by all authenticated users" ON public.events
    FOR SELECT USING (auth.role() = 'authenticated');

-- 認証済みユーザーがイベントを作成可能
CREATE POLICY "Events can be created by authenticated users" ON public.events
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- イベント作成者がイベントを更新・削除可能
CREATE POLICY "Events can be updated by creator" ON public.events
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Events can be deleted by creator" ON public.events
    FOR DELETE USING (auth.uid() = created_by);

-- 全ての認証済みユーザーが決済情報を閲覧可能
CREATE POLICY "Event settlements are viewable by all authenticated users" ON public.event_settlements
    FOR SELECT USING (auth.role() = 'authenticated');

-- 認証済みユーザーが決済情報を作成可能
CREATE POLICY "Event settlements can be created by authenticated users" ON public.event_settlements
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ユーザーは自分の決済情報を更新可能
CREATE POLICY "Event settlements can be updated by user" ON public.event_settlements
    FOR UPDATE USING (auth.uid() = user_id);

-- コメント
COMMENT ON TABLE public.events IS 'イベント管理テーブル';
COMMENT ON TABLE public.event_settlements IS 'イベント決済管理テーブル';
