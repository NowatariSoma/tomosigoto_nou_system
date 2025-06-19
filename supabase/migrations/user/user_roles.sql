CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_type VARCHAR(255) NOT NULL,
    is_visible_to_general BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() at time zone 'utc'),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() at time zone 'utc'),
    
    -- 外部キー制約: auth.usersテーブルのidフィールドを参照
    CONSTRAINT fk_user_roles_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE
);

-- user_idフィールドにインデックスを作成（クエリパフォーマンス向上のため）
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);