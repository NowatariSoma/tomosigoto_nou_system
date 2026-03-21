import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockGetUser = vi.fn();
const mockGetSession = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      getUser: mockGetUser,
      getSession: mockGetSession,
    },
  }),
}));

// グローバルfetchをモック
const mockFetch = vi.fn();
const originalFetch = globalThis.fetch;
globalThis.fetch = mockFetch;

// 環境変数
vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('SUPABASE_ANON_KEY', 'test-anon-key');
vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:8000/api/v1');

// --- Helpers ---

function createRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, 'http://localhost:3000'));
}

function isRedirectTo(response: Response, path: string): boolean {
  if (response.status < 300 || response.status >= 400) return false;
  const location = response.headers.get('location') || '';
  return location.includes(path);
}

// --- Tests ---

describe('middleware', () => {
  let middleware: typeof import('../middleware').middleware;

  beforeEach(async () => {
    vi.resetModules();
    mockGetUser.mockReset();
    mockGetSession.mockReset();
    mockFetch.mockReset();
    globalThis.fetch = mockFetch;

    const mod = await import('../middleware');
    middleware = mod.middleware;
  });

  describe('公開ルート', () => {
    it('/login はSupabase接続せずにそのまま通す', async () => {
      const response = await middleware(createRequest('/login'));

      expect(response.status).toBe(200);
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    it('/signup はSupabase接続せずにそのまま通す', async () => {
      const response = await middleware(createRequest('/signup'));

      expect(response.status).toBe(200);
      expect(mockGetUser).not.toHaveBeenCalled();
    });
  });

  describe('認証チェック', () => {
    it('未認証ユーザーは /login にリダイレクト', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const response = await middleware(createRequest('/schedule'));

      expect(isRedirectTo(response, '/login')).toBe(true);
    });

    it('Supabase接続エラー時は /login にリダイレクト', async () => {
      mockGetUser.mockRejectedValue(new Error('Connection timeout'));

      const response = await middleware(createRequest('/schedule'));

      expect(isRedirectTo(response, '/login')).toBe(true);
    });

    it('認証済みユーザーはそのまま通す', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'token-abc' } },
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ exists: true }),
      });

      const response = await middleware(createRequest('/schedule'));

      expect(response.status).toBe(200);
    });
  });

  describe('プロフィール存在チェック', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'token-abc' } },
      });
    });

    it('プロフィール未登録なら /settings にリダイレクト', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ exists: false }),
      });

      const response = await middleware(createRequest('/schedule'));

      expect(isRedirectTo(response, '/settings')).toBe(true);
    });

    it('プロフィール登録済みならそのまま通す', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ exists: true }),
      });

      const response = await middleware(createRequest('/schedule'));

      expect(response.status).toBe(200);
    });

    it('/settings ページではプロフィールチェックをスキップ', async () => {
      const response = await middleware(createRequest('/settings'));

      expect(response.status).toBe(200);
      // profile/exists のfetchが呼ばれないこと
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('プロフィールAPI失敗時はエラーを握りつぶさずそのまま通す', async () => {
      mockFetch.mockRejectedValue(new Error('API timeout'));

      const response = await middleware(createRequest('/schedule'));

      // エラーでもリダイレクトせずにそのまま通す
      expect(response.status).toBe(200);
    });

    it('プロフィールAPIが非200を返した場合もそのまま通す', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const response = await middleware(createRequest('/schedule'));

      expect(response.status).toBe(200);
    });
  });

  describe('matcher設定', () => {
    it('matcherが静的ファイルを除外している', async () => {
      const { config } = await import('../middleware');

      const matcher = config.matcher[0];
      // API, static, image, favicon, images, icons が除外されていること
      expect(matcher).toContain('api');
      expect(matcher).toContain('_next/static');
      expect(matcher).toContain('_next/image');
      expect(matcher).toContain('favicon.ico');
      expect(matcher).toContain('favicon.png');
      expect(matcher).toContain('images');
      expect(matcher).toContain('icons');
    });
  });
});
