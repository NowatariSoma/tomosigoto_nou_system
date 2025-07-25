-- 会場属性テーブル作成
CREATE TABLE venue_attributes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid NOT NULL,
    attribute_key VARCHAR(100) NOT NULL,
    attribute_value TEXT,
    attribute_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- 外部キー制約
    CONSTRAINT fk_venue_attributes_venue_id 
        FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
    
    -- 複合一意制約（同じ会場で同じキーは重複不可）
    CONSTRAINT uk_venue_attributes_venue_key UNIQUE (venue_id, attribute_key)
);

-- インデックス作成
CREATE INDEX idx_venue_attributes_venue_id ON venue_attributes(venue_id);
CREATE INDEX idx_venue_attributes_key ON venue_attributes(attribute_key);
CREATE INDEX idx_venue_attributes_type ON venue_attributes(attribute_type);

-- 更新時のタイムスタンプ自動更新
CREATE TRIGGER update_venue_attributes_updated_at BEFORE UPDATE ON venue_attributes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();