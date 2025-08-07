-- supabase/migrations/YYYYMMDDHHMMSS_create_venue_tables.sql

-- venues テーブル (会場マスター)
CREATE TABLE IF NOT EXISTS venues (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE, -- 会場コード
    address TEXT,
    latitude FLOAT,
    longitude FLOAT,
    venue_type VARCHAR(100), -- 会場種別
    capacity INT, -- 収容人数
    contact_info TEXT, -- 連絡先情報
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE, -- 有効フラグ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 変更を追跡するためのトリガー関数 (venues)
CREATE OR REPLACE FUNCTION update_venues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- venues テーブルの更新時に updated_at を自動更新するトリガー
CREATE TRIGGER update_venues_updated_at
BEFORE UPDATE ON venues
FOR EACH ROW
EXECUTE FUNCTION update_venues_updated_at();

-- venue_attributes テーブル (会場属性)
CREATE TABLE IF NOT EXISTS venue_attributes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE, -- venuesテーブルへの外部キー
    attribute_key VARCHAR(100) NOT NULL, -- 属性キー (例: "設備", "サービス")
    attribute_value TEXT NOT NULL, -- 属性値 (例: "プロジェクター", "Wi-Fi")
    attribute_type VARCHAR(50), -- 属性タイプ (例: "設備", "利用条件")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (venue_id, attribute_key) -- 同じ会場で同じ属性キーは1つのみ
);

-- 変更を追跡するためのトリガー関数 (venue_attributes)
CREATE OR REPLACE FUNCTION update_venue_attributes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- venue_attributes テーブルの更新時に updated_at を自動更新するトリガー
CREATE TRIGGER update_venue_attributes_updated_at
BEFORE UPDATE ON venue_attributes
FOR EACH ROW
EXECUTE FUNCTION update_venue_attributes_updated_at();


-- availability_slots テーブル (利用可能時間枠)
CREATE TABLE IF NOT EXISTS availability_slots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE, -- venuesテーブルへの外部キー
    date DATE NOT NULL, -- 利用可能日
    start_time TIME NOT NULL, -- 開始時間
    end_time TIME NOT NULL, -- 終了時間
    status VARCHAR(50) NOT NULL DEFAULT 'available', -- ステータス (例: 'available', 'booked', 'maintenance')
    cost DECIMAL(10, 2), -- 利用料金
    constraints JSONB, -- 追加制約 (JSON形式)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (venue_id, date, start_time, end_time) -- 同じ会場で同じ日時・時間帯は1つのみ
);

-- 変更を追跡するためのトリガー関数 (availability_slots)
CREATE OR REPLACE FUNCTION update_availability_slots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- availability_slots テーブルの更新時に updated_at を自動更新するトリガー
CREATE TRIGGER update_availability_slots_updated_at
BEFORE UPDATE ON availability_slots
FOR EACH ROW
EXECUTE FUNCTION update_availability_slots_updated_at();


-- recurring_units テーブル (定期予約枠)
CREATE TABLE IF NOT EXISTS recurring_units (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE, -- venuesテーブルへの外部キー
    day_of_week INT NOT NULL, -- 曜日 (0=日, 1=月, ..., 6=土)
    start_time TIME NOT NULL, -- 開始時間
    end_time TIME NOT NULL, -- 終了時間
    valid_from DATE NOT NULL, -- 有効開始日
    valid_until DATE, -- 有効終了日 (NULL の場合は無期限)
    recurrence_rule TEXT, -- 定期的な繰り返しルール (例: "RRULE:FREQ=WEEKLY;INTERVAL=1")
    is_active BOOLEAN DEFAULT TRUE, -- 有効フラグ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (venue_id, day_of_week, start_time, end_time, valid_from) -- 同一会場、同一曜日、同一時間帯、同一開始日の定期枠は1つのみ
);

-- 変更を追跡するためのトリガー関数 (recurring_units)
CREATE OR REPLACE FUNCTION update_recurring_units_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- recurring_units テーブルの更新時に updated_at を自動更新するトリガー
CREATE TRIGGER update_recurring_units_updated_at
BEFORE UPDATE ON recurring_units
FOR EACH ROW
EXECUTE FUNCTION update_recurring_units_updated_at();