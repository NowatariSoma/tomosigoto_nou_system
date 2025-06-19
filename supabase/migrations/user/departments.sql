CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT,                       -- 学部ID
    department_code VARCHAR(50) UNIQUE,        -- 学部コード
    department_name VARCHAR(100),              -- 学部名
    campus VARCHAR(50),                        -- キャンパス（今出川/田辺）
    is_active BOOLEAN,                         -- 有効フラグ
    created_at TIMESTAMP,                      -- 作成日時
    updated_at TIMESTAMP                       -- 更新日時
);
