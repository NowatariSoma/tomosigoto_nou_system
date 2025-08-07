-- リモートデータベースをローカルのスキーマに合わせる
-- 古いテーブルと追加カラムを削除

-- 1. 追加されたテーブルを削除
DROP TABLE IF EXISTS public.availability_slots CASCADE;
DROP TABLE IF EXISTS public.recurring_units CASCADE;
DROP TABLE IF EXISTS public.venue_attributes CASCADE;

-- 2. venuesテーブルを元の構造に戻す
-- まず追加されたカラムを削除
ALTER TABLE public.venues DROP COLUMN IF EXISTS contact_info;
ALTER TABLE public.venues DROP COLUMN IF EXISTS venue_type;

-- 3. 削除されたカラムを復元
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS campus text;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS can_mai boolean;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS desk int;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS chair int;

-- 4. NULL値を適切なデフォルト値で更新
UPDATE public.venues SET 
    campus = COALESCE(campus, 'default_campus'),
    can_mai = COALESCE(can_mai, false),
    address = COALESCE(address, ''),
    capacity = COALESCE(capacity, 0),
    code = COALESCE(code, ''),
    is_active = COALESCE(is_active, true),
    latitude = COALESCE(latitude, 0.0),
    longitude = COALESCE(longitude, 0.0)
WHERE campus IS NULL OR can_mai IS NULL OR address IS NULL 
   OR capacity IS NULL OR code IS NULL OR is_active IS NULL 
   OR latitude IS NULL OR longitude IS NULL;

-- 5. カラムのNOT NULL制約を復元
ALTER TABLE public.venues ALTER COLUMN campus SET NOT NULL;
ALTER TABLE public.venues ALTER COLUMN can_mai SET NOT NULL;
ALTER TABLE public.venues ALTER COLUMN address SET NOT NULL;
ALTER TABLE public.venues ALTER COLUMN capacity SET NOT NULL;
ALTER TABLE public.venues ALTER COLUMN code SET NOT NULL;
ALTER TABLE public.venues ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.venues ALTER COLUMN latitude SET NOT NULL;
ALTER TABLE public.venues ALTER COLUMN longitude SET NOT NULL;

-- 6. データ型を元に戻す
ALTER TABLE public.venues ALTER COLUMN code TYPE text;
ALTER TABLE public.venues ALTER COLUMN name TYPE text;

-- 7. デフォルト値を削除
ALTER TABLE public.venues ALTER COLUMN is_active DROP DEFAULT;
ALTER TABLE public.venues ALTER COLUMN created_at DROP DEFAULT;
ALTER TABLE public.venues ALTER COLUMN updated_at DROP DEFAULT;

-- 8. デフォルト値を再設定
ALTER TABLE public.venues ALTER COLUMN created_at SET DEFAULT current_timestamp;
ALTER TABLE public.venues ALTER COLUMN updated_at SET DEFAULT current_timestamp; 