/**
 * GitHub Pages デモ (PAGES_EXPORT=1) 専用の fetch インターセプト。
 *
 * デモビルドでは next.config.js が API のベース URL を
 * `https://demo.invalid/api/v1` に固定しているため、
 * そのホスト宛のリクエストだけを横取りしてモックレスポンスを返す。
 * それ以外（自分自身の静的アセット、外部の画像など）は素通しする。
 *
 * このモジュールは import された時点（＝React のレンダリング前）で
 * window.fetch を差し替える。二重適用は防止済み。
 */

import { handleDemoApi } from './api';

const DEMO_API_HOST = 'demo.invalid';
const DEMO_SUPABASE_HOST = 'demo.invalid.supabase.co';
const API_PREFIX = '/api/v1';

const PATCH_FLAG = '__tomosigotoDemoFetchInstalled';

type FetchInput = Parameters<typeof fetch>[0];

function resolveUrl(input: FetchInput): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function resolveMethod(input: FetchInput, init?: RequestInit): string {
  if (init?.method) return init.method;
  if (typeof input !== 'string' && !(input instanceof URL)) return input.method || 'GET';
  return 'GET';
}

function parseBody(init?: RequestInit): unknown {
  const raw = init?.body;
  if (typeof raw !== 'string' || raw.length === 0) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function jsonResponse(status: number, body: unknown): Response {
  if (status === 204 || body === null || body === undefined) {
    return new Response(null, { status, statusText: status === 204 ? 'No Content' : 'OK' });
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function installDemoFetch(): void {
  if (typeof window === 'undefined') return;
  const globalAny = window as unknown as Record<string, unknown>;
  if (globalAny[PATCH_FLAG]) return;
  globalAny[PATCH_FLAG] = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: FetchInput, init?: RequestInit): Promise<Response> => {
    let url: URL;
    try {
      url = new URL(resolveUrl(input), window.location.href);
    } catch {
      return originalFetch(input as never, init);
    }

    // Supabase 宛は lib/supabase.ts のデモ実装で処理済みのはずだが、
    // 取りこぼしがあってもネットワークエラーにしないよう空応答を返す。
    if (url.hostname === DEMO_SUPABASE_HOST) {
      return jsonResponse(200, []);
    }

    if (url.hostname !== DEMO_API_HOST) {
      return originalFetch(input as never, init);
    }

    const path = url.pathname.startsWith(API_PREFIX)
      ? url.pathname.slice(API_PREFIX.length)
      : url.pathname;

    const method = resolveMethod(input, init);
    const body = parseBody(init);

    try {
      const result = handleDemoApi(method, path, url.searchParams, body);
      // 実際の通信に近づけるためわずかに遅延させる（ローディング表示の確認用）
      await new Promise((resolve) => setTimeout(resolve, 40));
      return jsonResponse(result.status, result.body);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[demo] モック応答の生成に失敗しました', url.pathname, error);
      return jsonResponse(200, []);
    }
  };
}

installDemoFetch();
