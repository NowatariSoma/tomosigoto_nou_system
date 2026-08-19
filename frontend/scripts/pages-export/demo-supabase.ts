/**
 * GitHub Pages デモ (PAGES_EXPORT=1) 専用の一時ファイル。
 *
 * scripts/build-pages.mjs が export ビルドの間だけ lib/supabase.ts として配置し、
 * ビルド後に必ず本物の lib/supabase.ts へ戻す。
 *
 * 本来の lib/supabase.ts は @supabase/ssr の createBrowserClient を返すが、
 * デモには Supabase が存在しないため、認証と PostgREST を模した
 * インメモリ実装（lib/demo/supabase-client.ts）に差し替える。
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { demoSupabase } from './demo/supabase-client';

// 呼び出し側（AuthContext や各 service）の型推論を本物と同じに保つため、
// 実装はデモ用でも型だけは SupabaseClient として公開する。
export const supabase = demoSupabase as unknown as SupabaseClient;
