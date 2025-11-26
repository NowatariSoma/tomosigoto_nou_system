SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."attendance_status" AS ENUM (
    'present',
    'late',
    'absent',
    'undecided',
    'no_show'
);


ALTER TYPE "public"."attendance_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role_type" AS ENUM (
    'admin',
    'basic',
    'viewer',
    'general'
);


ALTER TYPE "public"."user_role_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."user_role_type" IS 'ユーザーロール種別（admin: 管理者, basic: 基本, viewer: 閲覧者, general: 一般）';


CREATE OR REPLACE FUNCTION "public"."get_instructor_candidates"("practice_schedule_id" "uuid") RETURNS TABLE("user_id" "uuid", "email" "text", "first_name_kanji" "text", "last_name_kanji" "text", "student_id" "text", "grade" integer, "attendance_id" "uuid", "attendance_status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email,
        up.first_name_kanji,
        up.last_name_kanji,
        up.student_id,
        up.grade,
        pua.id as attendance_id,
        pua.status as attendance_status
    FROM auth.users u
    INNER JOIN public.user_profiles up ON u.id = up.user_id
    INNER JOIN public.practice_user_attendance pua ON u.id = pua.user_id
    WHERE 
        up.grade = 4
        AND pua.practice_schedule_id = practice_schedule_id
        AND pua.status IN ('present', 'late')  -- 出席または遅刻のユーザーのみ
    ORDER BY up.last_name_kanji, up.first_name_kanji;
END;
$$;


ALTER FUNCTION "public"."get_instructor_candidates"("practice_schedule_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_instructor_candidates"("practice_schedule_id" "uuid") IS 'インストラクター候補を取得（学年4かつ出席記録があるユーザー）';





CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_user_role"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- user_profilesにINSERT時、user_rolesにデフォルトレコードがなければ作成
    INSERT INTO public.user_roles (user_id, role_type, is_visible_to_general, is_instructor)
    VALUES (NEW.user_id, 'basic'::"public"."user_role_type", false, false)
    ON CONFLICT (user_id, role_type) DO NOTHING;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_user_role"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_default_user_role"() IS 'user_profiles作成時にデフォルトのuser_roleを自動作成するトリガー関数';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "department_code" character varying(50) NOT NULL,
    "department_name" character varying(100) NOT NULL,
    "campus" character varying(50) NOT NULL,
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."departments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "student_id" "text" NOT NULL,
    "first_name_kanji" "text" NOT NULL,
    "first_name_katakana" "text" NOT NULL,
    "last_name_kanji" "text" NOT NULL,
    "last_name_katakana" "text" NOT NULL,
    "grade" integer,
    "department_id" "uuid" NOT NULL,
    "avatar_url" "text",
    "preferences" "jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "email" "text",
    "is_instructor" boolean DEFAULT false NOT NULL,
    "last_active_at" timestamp with time zone
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_profiles"."email" IS 'メールアドレス（ユーザー認証情報から取得）';



COMMENT ON COLUMN "public"."user_profiles"."is_instructor" IS '指導者フラグ';



COMMENT ON COLUMN "public"."user_profiles"."last_active_at" IS '最終アクティブ日時';



CREATE OR REPLACE VIEW "public"."users" AS
 SELECT "id",
    "email",
    "created_at",
    "updated_at",
    "last_sign_in_at",
    "raw_user_meta_data"
   FROM "auth"."users" "u";


ALTER VIEW "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."account_setting_profile" AS
 SELECT "up"."id",
    "up"."user_id",
    "up"."student_id",
    "up"."first_name_kanji",
    "up"."first_name_katakana",
    "up"."last_name_kanji",
    "up"."last_name_katakana",
    "up"."grade",
    "d"."department_code" AS "faculty",
    "d"."department_name" AS "faculty_name",
    "u"."email",
    "up"."avatar_url",
    "up"."preferences",
    "up"."created_at",
    "up"."updated_at"
   FROM (("public"."user_profiles" "up"
     LEFT JOIN "public"."departments" "d" ON (("up"."department_id" = "d"."id")))
     LEFT JOIN "public"."users" "u" ON (("up"."user_id" = "u"."id")));


ALTER VIEW "public"."account_setting_profile" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."favorites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "video_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "part_id" "uuid" NOT NULL,
    "category" character varying(10) NOT NULL,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "member_assignments_category_check" CHECK ((("category")::"text" = ANY ((ARRAY['utai'::character varying, 'mai'::character varying])::"text"[])))
);


ALTER TABLE "public"."member_assignments" OWNER TO "postgres";


COMMENT ON TABLE "public"."member_assignments" IS 'メンバーのパート所属（謡・舞区分）を管理するテーブル';



COMMENT ON COLUMN "public"."member_assignments"."user_id" IS 'ユーザーID参照';



COMMENT ON COLUMN "public"."member_assignments"."part_id" IS 'パートID参照';



COMMENT ON COLUMN "public"."member_assignments"."category" IS '謡舞区分';



COMMENT ON COLUMN "public"."member_assignments"."display_order" IS '表示順序';



CREATE TABLE IF NOT EXISTS "public"."parts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stage_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "parts_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::"text"[])))
);


ALTER TABLE "public"."parts" OWNER TO "postgres";


COMMENT ON TABLE "public"."parts" IS '舞台に紐づくパート情報を管理するテーブル';



COMMENT ON COLUMN "public"."parts"."stage_id" IS '舞台ID参照';



COMMENT ON COLUMN "public"."parts"."name" IS 'パート名';



COMMENT ON COLUMN "public"."parts"."description" IS 'パート説明';



COMMENT ON COLUMN "public"."parts"."status" IS 'パートステータス';



CREATE TABLE IF NOT EXISTS "public"."playlists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "name" "text" NOT NULL,
    "year" integer,
    "thumbnail_url" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."playlists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."practice_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "schedule_date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "division_count" integer DEFAULT 1 NOT NULL,
    "title" "text",
    "schedule_type" character varying(20) NOT NULL,
    "status" character varying(20),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "description" "text",
    "stage_id" "uuid",
    CONSTRAINT "practice_schedules_division_count_check" CHECK (("division_count" > 0))
);


ALTER TABLE "public"."practice_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."practice_user_attendance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "practice_schedule_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "public"."attendance_status" DEFAULT 'undecided'::"public"."attendance_status" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "available_from" time without time zone,
    "available_to" time without time zone
);


ALTER TABLE "public"."practice_user_attendance" OWNER TO "postgres";


COMMENT ON COLUMN "public"."practice_user_attendance"."available_from" IS '参加開始時刻（部分参加の場合のみ使用）';



COMMENT ON COLUMN "public"."practice_user_attendance"."available_to" IS '参加終了時刻（部分参加の場合のみ使用）';



CREATE TABLE IF NOT EXISTS "public"."schedule_available_venues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "schedule_id" "uuid" NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "is_preferred" boolean DEFAULT false,
    "priority" integer DEFAULT 0,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."schedule_available_venues" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "campus" "text" NOT NULL,
    "address" "text" NOT NULL,
    "latitude" double precision NOT NULL,
    "longitude" double precision NOT NULL,
    "can_mai" boolean NOT NULL,
    "capacity" integer NOT NULL,
    "desk" integer,
    "chair" integer,
    "description" "text",
    "is_active" boolean NOT NULL,
    "phone" "text",
    "email" "text",
    "website" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."venues" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."practice_user_attendance_history" AS
 SELECT "u"."id" AS "user_id",
    "u"."email",
    "up"."first_name_kanji",
    "up"."last_name_kanji",
    "up"."student_id",
    "a"."status" AS "attendance_status",
    "a"."available_from",
    "a"."available_to",
    "ps"."schedule_date",
    "ps"."description",
    "v"."name" AS "venue_name",
    "a"."notes"
   FROM ((((("auth"."users" "u"
     LEFT JOIN "public"."user_profiles" "up" ON (("u"."id" = "up"."user_id")))
     LEFT JOIN "public"."practice_user_attendance" "a" ON (("u"."id" = "a"."user_id")))
     LEFT JOIN "public"."practice_schedules" "ps" ON (("a"."practice_schedule_id" = "ps"."id")))
     LEFT JOIN "public"."schedule_available_venues" "sav" ON (("ps"."id" = "sav"."schedule_id")))
     LEFT JOIN "public"."venues" "v" ON (("sav"."venue_id" = "v"."id")))
  ORDER BY "u"."id", "ps"."schedule_date" DESC;


ALTER VIEW "public"."practice_user_attendance_history" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."practice_user_attendance_with_names" AS
 SELECT "a"."id",
    "a"."practice_schedule_id",
    "a"."user_id",
    "a"."status",
    "a"."notes",
    "a"."available_from",
    "a"."available_to",
    "a"."created_at",
    "a"."updated_at",
    "u"."email" AS "user_email",
    "u"."raw_user_meta_data",
        CASE
            WHEN (("up"."last_name_kanji" IS NOT NULL) AND ("up"."first_name_kanji" IS NOT NULL)) THEN (("up"."last_name_kanji" || ' '::"text") || "up"."first_name_kanji")
            WHEN ("up"."last_name_kanji" IS NOT NULL) THEN "up"."last_name_kanji"
            WHEN ("up"."first_name_kanji" IS NOT NULL) THEN "up"."first_name_kanji"
            WHEN (("u"."raw_user_meta_data" ->> 'name'::"text") IS NOT NULL) THEN ("u"."raw_user_meta_data" ->> 'name'::"text")
            WHEN ("u"."email" IS NOT NULL) THEN "split_part"(("u"."email")::"text", '@'::"text", 1)
            ELSE '不明'::"text"
        END AS "user_name"
   FROM (("public"."practice_user_attendance" "a"
     JOIN "auth"."users" "u" ON (("a"."user_id" = "u"."id")))
     LEFT JOIN "public"."user_profiles" "up" ON (("u"."id" = "up"."user_id")));


ALTER VIEW "public"."practice_user_attendance_with_names" OWNER TO "postgres";


COMMENT ON VIEW "public"."practice_user_attendance_with_names" IS '出欠記録とユーザー名を含むビュー（フルネームを自動計算）';



CREATE OR REPLACE VIEW "public"."practice_user_attendance_summary" AS
 SELECT "ps"."id" AS "practice_schedule_id",
    "ps"."schedule_date",
    "ps"."description",
    "v"."name" AS "venue_name",
    count("a"."id") AS "total_people",
    count(CASE WHEN (("a"."status")::"text" = 'present'::"text") THEN 1 ELSE NULL::integer END) AS "present_count",
    count(CASE WHEN (("a"."status")::"text" = 'absent'::"text") THEN 1 ELSE NULL::integer END) AS "absent_count",
    count(CASE WHEN (("a"."status")::"text" = 'late'::"text") THEN 1 ELSE NULL::integer END) AS "late_count",
    count(CASE WHEN (("a"."status")::"text" = 'no_show'::"text") THEN 1 ELSE NULL::integer END) AS "no_show_count",
    round(((count(CASE WHEN (("a"."status")::"text" = 'present'::"text") THEN 1 ELSE NULL::integer END))::numeric / NULLIF((count("a"."id"))::numeric, (0)::numeric) * (100)::numeric), 2) AS "attendance_rate"
   FROM ((("public"."practice_schedules" "ps"
     LEFT JOIN "public"."schedule_available_venues" "sav" ON (("ps"."id" = "sav"."schedule_id")))
     LEFT JOIN "public"."venues" "v" ON (("sav"."venue_id" = "v"."id")))
     LEFT JOIN "public"."practice_user_attendance" "a" ON (("ps"."id" = "a"."practice_schedule_id")))
  GROUP BY "ps"."id", "ps"."schedule_date", "ps"."description", "v"."name";


ALTER VIEW "public"."practice_user_attendance_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."practice_user_attendance_summary" IS '練習別の出欠状況サマリービュー';



CREATE TABLE IF NOT EXISTS "public"."session_instructors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "attendance_id" "uuid" NOT NULL,
    "schedule_id" "uuid" NOT NULL,
    "schedule_available_venue_id" "uuid",
    "slot_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "session_instructors_slot_order_check" CHECK (("slot_order" > 0))
);


ALTER TABLE "public"."session_instructors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "schedule_id" "uuid" NOT NULL,
    "part_id" "uuid" NOT NULL,
    "title" character varying(30),
    "schedule_available_venue_id" "uuid",
    "priority" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "slot_order" integer
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "performance_date" "date",
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stages_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::"text"[])))
);


ALTER TABLE "public"."stages" OWNER TO "postgres";


COMMENT ON TABLE "public"."stages" IS '舞台情報を管理するテーブル';



COMMENT ON COLUMN "public"."stages"."name" IS '舞台名称';



COMMENT ON COLUMN "public"."stages"."description" IS '舞台説明';



COMMENT ON COLUMN "public"."stages"."performance_date" IS '公演予定日';



COMMENT ON COLUMN "public"."stages"."status" IS 'ステータス';



CREATE TABLE IF NOT EXISTS "public"."sub_playlists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "playlist_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "recorded_date" "date",
    "phase" "text",
    "playlist_url" "text",
    "thumbnail_url" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."sub_playlists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "role_type" "public"."user_role_type" DEFAULT 'basic'::"public"."user_role_type" NOT NULL,
    "is_visible_to_general" boolean DEFAULT false,
    "is_instructor" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."videos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sub_playlist_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "video_url" "text" NOT NULL,
    "recorded_date" "date",
    "thumbnail_url" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."videos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text",
    "category" "text" NOT NULL,
    "content" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contacts_category_check" CHECK (("category" = ANY (ARRAY['bug'::"text", 'feature'::"text", 'question'::"text", 'other'::"text"]))),
    CONSTRAINT "contacts_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'resolved'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


COMMENT ON TABLE "public"."contacts" IS 'ユーザーからのお問い合わせを管理するテーブル';


COMMENT ON COLUMN "public"."contacts"."id" IS 'お問い合わせID（主キー）';


COMMENT ON COLUMN "public"."contacts"."user_id" IS 'ユーザーID（auth.users参照）';


COMMENT ON COLUMN "public"."contacts"."name" IS '問い合わせ者の名前（user_idから自動生成、NULL許可）';


COMMENT ON COLUMN "public"."contacts"."category" IS 'カテゴリ（bug: バグ報告, feature: 機能要望, question: 質問, other: その他）';


COMMENT ON COLUMN "public"."contacts"."content" IS '問い合わせ内容';


COMMENT ON COLUMN "public"."contacts"."status" IS '対応状況（pending: 未対応, in_progress: 対応中, resolved: 解決済み, closed: クローズ）';


COMMENT ON COLUMN "public"."contacts"."created_at" IS '作成日時';


COMMENT ON COLUMN "public"."contacts"."updated_at" IS '更新日時';


CREATE TABLE IF NOT EXISTS "public"."schedule_time_slots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "schedule_id" "uuid" NOT NULL,
    "slot_order" integer NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "schedule_time_slots_slot_order_check" CHECK (("slot_order" > 0)),
    CONSTRAINT "schedule_time_slots_time_check" CHECK (("start_time" < "end_time"))
);


ALTER TABLE "public"."schedule_time_slots" OWNER TO "postgres";


COMMENT ON TABLE "public"."schedule_time_slots" IS '練習スケジュールの時間スロット（開始時刻・終了時刻）を管理するテーブル';


COMMENT ON COLUMN "public"."schedule_time_slots"."schedule_id" IS '練習スケジュールID参照';


COMMENT ON COLUMN "public"."schedule_time_slots"."slot_order" IS '時間スロットの順序（上から何個目か）';


COMMENT ON COLUMN "public"."schedule_time_slots"."start_time" IS '時間スロットの開始時刻';


COMMENT ON COLUMN "public"."schedule_time_slots"."end_time" IS '時間スロットの終了時刻';


CREATE TABLE IF NOT EXISTS "public"."account_setting_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "field_name" "text" NOT NULL,
    "old_value" "text",
    "new_value" "text",
    "changed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "changed_by" "uuid"
);


ALTER TABLE "public"."account_setting_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."account_setting_history" IS 'アカウント設定変更履歴を管理するテーブル';


COMMENT ON COLUMN "public"."account_setting_history"."user_id" IS '対象ユーザーID';


COMMENT ON COLUMN "public"."account_setting_history"."field_name" IS '変更されたフィールド名';


COMMENT ON COLUMN "public"."account_setting_history"."old_value" IS '変更前の値';


COMMENT ON COLUMN "public"."account_setting_history"."new_value" IS '変更後の値';


COMMENT ON COLUMN "public"."account_setting_history"."changed_at" IS '変更日時';


COMMENT ON COLUMN "public"."account_setting_history"."changed_by" IS '変更を行ったユーザーID';


ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_department_code_key" UNIQUE ("department_code");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_unique" UNIQUE ("user_id", "video_id");



ALTER TABLE ONLY "public"."member_assignments"
    ADD CONSTRAINT "member_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."member_assignments"
    ADD CONSTRAINT "member_assignments_user_id_part_id_key" UNIQUE ("user_id", "part_id");



ALTER TABLE ONLY "public"."parts"
    ADD CONSTRAINT "parts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."playlists"
    ADD CONSTRAINT "playlists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."practice_schedules"
    ADD CONSTRAINT "practice_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."practice_user_attendance"
    ADD CONSTRAINT "practice_user_attendance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."practice_user_attendance"
    ADD CONSTRAINT "practice_user_attendance_practice_schedule_id_user_id_key" UNIQUE ("practice_schedule_id", "user_id");



ALTER TABLE ONLY "public"."schedule_available_venues"
    ADD CONSTRAINT "schedule_available_venues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_instructors"
    ADD CONSTRAINT "session_instructors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_schedule_venue_slot_unique" UNIQUE ("schedule_id", "schedule_available_venue_id", "slot_order");



ALTER TABLE ONLY "public"."stages"
    ADD CONSTRAINT "stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sub_playlists"
    ADD CONSTRAINT "sub_playlists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_student_id_key" UNIQUE ("student_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_type_key" UNIQUE ("user_id", "role_type");



ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule_time_slots"
    ADD CONSTRAINT "schedule_time_slots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."account_setting_history"
    ADD CONSTRAINT "account_setting_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule_time_slots"
    ADD CONSTRAINT "schedule_time_slots_schedule_id_slot_order_key" UNIQUE ("schedule_id", "slot_order");



CREATE INDEX "idx_member_assignments_category" ON "public"."member_assignments" USING "btree" ("category");



CREATE INDEX "idx_member_assignments_part_id" ON "public"."member_assignments" USING "btree" ("part_id");



CREATE INDEX "idx_member_assignments_user_id" ON "public"."member_assignments" USING "btree" ("user_id");



CREATE INDEX "idx_parts_stage_id" ON "public"."parts" USING "btree" ("stage_id");



CREATE INDEX "idx_parts_status" ON "public"."parts" USING "btree" ("status");



CREATE INDEX "idx_practice_schedules_date" ON "public"."practice_schedules" USING "btree" ("schedule_date");



CREATE INDEX "idx_practice_schedules_status" ON "public"."practice_schedules" USING "btree" ("status");



CREATE INDEX "idx_pua_schedule_user_status" ON "public"."practice_user_attendance" USING "btree" ("practice_schedule_id", "user_id", "status");



CREATE INDEX "idx_schedule_available_venues_schedule_id" ON "public"."schedule_available_venues" USING "btree" ("schedule_id");



CREATE INDEX "idx_schedule_available_venues_venue_id" ON "public"."schedule_available_venues" USING "btree" ("venue_id");



CREATE INDEX "idx_sessions_part_id" ON "public"."sessions" USING "btree" ("part_id");



CREATE INDEX "idx_sessions_schedule_available_venue_id" ON "public"."sessions" USING "btree" ("schedule_available_venue_id");



CREATE INDEX "idx_sessions_schedule_id" ON "public"."sessions" USING "btree" ("schedule_id");



CREATE INDEX "idx_si_attendance_id" ON "public"."session_instructors" USING "btree" ("attendance_id");



CREATE INDEX "idx_si_schedule_id" ON "public"."session_instructors" USING "btree" ("schedule_id");



CREATE INDEX "idx_si_schedule_slot" ON "public"."session_instructors" USING "btree" ("schedule_id", "slot_order");



CREATE INDEX "idx_si_slot_order" ON "public"."session_instructors" USING "btree" ("slot_order");



CREATE INDEX "idx_stages_performance_date" ON "public"."stages" USING "btree" ("performance_date");



CREATE INDEX "idx_stages_status" ON "public"."stages" USING "btree" ("status");



CREATE INDEX "idx_user_profiles_email" ON "public"."user_profiles" USING "btree" ("email");



CREATE INDEX "idx_user_profiles_is_instructor" ON "public"."user_profiles" USING "btree" ("is_instructor");



CREATE INDEX "idx_user_profiles_last_active_at" ON "public"."user_profiles" USING "btree" ("last_active_at");



CREATE INDEX "idx_practice_schedules_stage_id" ON "public"."practice_schedules" USING "btree" ("stage_id");



CREATE INDEX "idx_contacts_user_id" ON "public"."contacts" USING "btree" ("user_id");



CREATE INDEX "idx_contacts_category" ON "public"."contacts" USING "btree" ("category");



CREATE INDEX "idx_contacts_status" ON "public"."contacts" USING "btree" ("status");



CREATE INDEX "idx_contacts_created_at" ON "public"."contacts" USING "btree" ("created_at");



CREATE INDEX "idx_schedule_time_slots_schedule_id" ON "public"."schedule_time_slots" USING "btree" ("schedule_id");



CREATE INDEX "idx_schedule_time_slots_slot_order" ON "public"."schedule_time_slots" USING "btree" ("slot_order");



CREATE INDEX "idx_schedule_time_slots_start_time" ON "public"."schedule_time_slots" USING "btree" ("start_time");



CREATE INDEX "idx_account_setting_history_user_id" ON "public"."account_setting_history" USING "btree" ("user_id");



CREATE INDEX "idx_account_setting_history_field_name" ON "public"."account_setting_history" USING "btree" ("field_name");



CREATE INDEX "idx_account_setting_history_changed_at" ON "public"."account_setting_history" USING "btree" ("changed_at");



CREATE INDEX "idx_user_roles_is_instructor" ON "public"."user_roles" USING "btree" ("is_instructor");



CREATE OR REPLACE TRIGGER "set_updated_at_favorites" BEFORE UPDATE ON "public"."favorites" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_playlists" BEFORE UPDATE ON "public"."playlists" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_sub_playlists" BEFORE UPDATE ON "public"."sub_playlists" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_videos" BEFORE UPDATE ON "public"."videos" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_u_practice_schedules" BEFORE UPDATE ON "public"."practice_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_u_practice_user_attendance" BEFORE UPDATE ON "public"."practice_user_attendance" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_u_schedule_available_venues" BEFORE UPDATE ON "public"."schedule_available_venues" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_u_session_instructors" BEFORE UPDATE ON "public"."session_instructors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_u_sessions" BEFORE UPDATE ON "public"."sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_member_assignments_updated_at" BEFORE UPDATE ON "public"."member_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_parts_updated_at" BEFORE UPDATE ON "public"."parts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_stages_updated_at" BEFORE UPDATE ON "public"."stages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_create_default_user_role" AFTER INSERT ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."create_default_user_role"();



CREATE OR REPLACE TRIGGER "update_contacts_updated_at" BEFORE UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_u_schedule_time_slots" BEFORE UPDATE ON "public"."schedule_time_slots" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_assignments"
    ADD CONSTRAINT "member_assignments_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_assignments"
    ADD CONSTRAINT "member_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parts"
    ADD CONSTRAINT "parts_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."practice_schedules"
    ADD CONSTRAINT "practice_schedules_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id");



ALTER TABLE ONLY "public"."practice_user_attendance"
    ADD CONSTRAINT "practice_user_attendance_practice_schedule_id_fkey" FOREIGN KEY ("practice_schedule_id") REFERENCES "public"."practice_schedules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."practice_user_attendance"
    ADD CONSTRAINT "practice_user_attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule_available_venues"
    ADD CONSTRAINT "schedule_available_venues_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."practice_schedules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule_available_venues"
    ADD CONSTRAINT "schedule_available_venues_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_instructors"
    ADD CONSTRAINT "session_instructors_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "public"."practice_user_attendance"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_instructors"
    ADD CONSTRAINT "session_instructors_schedule_available_venue_id_fkey" FOREIGN KEY ("schedule_available_venue_id") REFERENCES "public"."schedule_available_venues"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."session_instructors"
    ADD CONSTRAINT "session_instructors_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."practice_schedules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_schedule_available_venue_id_fkey" FOREIGN KEY ("schedule_available_venue_id") REFERENCES "public"."schedule_available_venues"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."practice_schedules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sub_playlists"
    ADD CONSTRAINT "sub_playlists_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_sub_playlist_id_fkey" FOREIGN KEY ("sub_playlist_id") REFERENCES "public"."sub_playlists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule_time_slots"
    ADD CONSTRAINT "schedule_time_slots_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."practice_schedules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."account_setting_history"
    ADD CONSTRAINT "account_setting_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."account_setting_history"
    ADD CONSTRAINT "account_setting_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



CREATE POLICY "Admins can manage all departments" ON "public"."departments" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Admins can manage all profiles" ON "public"."user_profiles" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Admins can manage all roles" ON "public"."user_roles" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Admins can manage all venues" ON "public"."venues" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Authenticated users can view active venues" ON "public"."venues" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Authenticated users can view departments" ON "public"."departments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable delete access for authenticated users" ON "public"."session_instructors" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert access for authenticated users" ON "public"."session_instructors" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for authenticated users" ON "public"."session_instructors" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update access for authenticated users" ON "public"."session_instructors" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can only insert own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only update own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only view own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only view own roles" ON "public"."user_roles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only view own contacts" ON "public"."contacts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only insert own contacts" ON "public"."contacts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only update own contacts" ON "public"."contacts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Admins can manage all contacts" ON "public"."contacts" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."departments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_instructors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."venues" ENABLE ROW LEVEL SECURITY;



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."get_instructor_candidates"("practice_schedule_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_instructor_candidates"("practice_schedule_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_instructor_candidates"("practice_schedule_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."departments" TO "anon";
GRANT ALL ON TABLE "public"."departments" TO "authenticated";
GRANT ALL ON TABLE "public"."departments" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."account_setting_profile" TO "anon";
GRANT ALL ON TABLE "public"."account_setting_profile" TO "authenticated";
GRANT ALL ON TABLE "public"."account_setting_profile" TO "service_role";



GRANT ALL ON TABLE "public"."favorites" TO "anon";
GRANT ALL ON TABLE "public"."favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."favorites" TO "service_role";



GRANT ALL ON TABLE "public"."member_assignments" TO "anon";
GRANT ALL ON TABLE "public"."member_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."member_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."parts" TO "anon";
GRANT ALL ON TABLE "public"."parts" TO "authenticated";
GRANT ALL ON TABLE "public"."parts" TO "service_role";



GRANT ALL ON TABLE "public"."playlists" TO "anon";
GRANT ALL ON TABLE "public"."playlists" TO "authenticated";
GRANT ALL ON TABLE "public"."playlists" TO "service_role";



GRANT ALL ON TABLE "public"."practice_schedules" TO "anon";
GRANT ALL ON TABLE "public"."practice_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."practice_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."practice_user_attendance" TO "anon";
GRANT ALL ON TABLE "public"."practice_user_attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."practice_user_attendance" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_available_venues" TO "anon";
GRANT ALL ON TABLE "public"."schedule_available_venues" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_available_venues" TO "service_role";



GRANT ALL ON TABLE "public"."venues" TO "anon";
GRANT ALL ON TABLE "public"."venues" TO "authenticated";
GRANT ALL ON TABLE "public"."venues" TO "service_role";



GRANT ALL ON TABLE "public"."practice_user_attendance_history" TO "anon";
GRANT ALL ON TABLE "public"."practice_user_attendance_history" TO "authenticated";
GRANT ALL ON TABLE "public"."practice_user_attendance_history" TO "service_role";



GRANT ALL ON TABLE "public"."practice_user_attendance_with_names" TO "anon";
GRANT ALL ON TABLE "public"."practice_user_attendance_with_names" TO "authenticated";
GRANT ALL ON TABLE "public"."practice_user_attendance_with_names" TO "service_role";



GRANT ALL ON TABLE "public"."session_instructors" TO "anon";
GRANT ALL ON TABLE "public"."session_instructors" TO "authenticated";
GRANT ALL ON TABLE "public"."session_instructors" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."stages" TO "anon";
GRANT ALL ON TABLE "public"."stages" TO "authenticated";
GRANT ALL ON TABLE "public"."stages" TO "service_role";



GRANT ALL ON TABLE "public"."sub_playlists" TO "anon";
GRANT ALL ON TABLE "public"."sub_playlists" TO "authenticated";
GRANT ALL ON TABLE "public"."sub_playlists" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."videos" TO "anon";
GRANT ALL ON TABLE "public"."videos" TO "authenticated";
GRANT ALL ON TABLE "public"."videos" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_time_slots" TO "anon";
GRANT ALL ON TABLE "public"."schedule_time_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_time_slots" TO "service_role";



GRANT ALL ON TABLE "public"."practice_user_attendance_summary" TO "anon";
GRANT ALL ON TABLE "public"."practice_user_attendance_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."practice_user_attendance_summary" TO "service_role";



GRANT ALL ON TABLE "public"."account_setting_history" TO "anon";
GRANT ALL ON TABLE "public"."account_setting_history" TO "authenticated";
GRANT ALL ON TABLE "public"."account_setting_history" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























