-- user_profilesテーブルにemailカラムを追加
ALTER TABLE public.user_profiles 
ADD COLUMN email TEXT;

-- emailカラムにインデックスを追加（検索性能向上のため）
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

-- コメントを追加
COMMENT ON COLUMN public.user_profiles.email IS 'メールアドレス（ユーザー認証情報から取得）';
