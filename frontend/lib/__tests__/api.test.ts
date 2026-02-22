import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/__mocks__/msw/server';
import { ApiError, auth } from '@/lib/api';

// fetchApiは実際のfetchを使うので、MSWのURL前にlocationのoriginを考慮する必要がある
// テスト環境ではwindow.location.origin = 'http://localhost:3000' となる

describe('API layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('ApiError', () => {
    it('statusとmessageを持つエラーを作成する', () => {
      const error = new ApiError(404, 'Not found');
      expect(error.status).toBe(404);
      expect(error.message).toBe('Not found');
      expect(error.name).toBe('ApiError');
    });

    it('Errorを継承している', () => {
      const error = new ApiError(500, 'Server error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
    });
  });

  describe('fetchApi', () => {
    it('完全なURLの場合はそのまま使用する', async () => {
      // fetchApiを直接importしてテスト - MSWを使用
      const { fetchApi } = await import('@/lib/api');

      server.use(
        http.get('http://localhost:8000/api/v1/custom', () => {
          return HttpResponse.json({ message: 'custom' });
        })
      );

      const response = await fetchApi('http://localhost:8000/api/v1/custom');
      const data = await response.json();
      expect(data).toEqual({ message: 'custom' });
    });

    it('エラーレスポンスでApiErrorをスローする', async () => {
      const { fetchApi } = await import('@/lib/api');

      server.use(
        http.get('http://localhost:8000/api/v1/error', () => {
          return HttpResponse.json(
            { detail: 'Resource not found' },
            { status: 404 }
          );
        })
      );

      await expect(fetchApi('http://localhost:8000/api/v1/error')).rejects.toThrow(ApiError);
    });

    it('レスポンスボディからdetailメッセージを取得する', async () => {
      const { fetchApi } = await import('@/lib/api');

      server.use(
        http.get('http://localhost:8000/api/v1/detail-error', () => {
          return HttpResponse.json(
            { detail: 'カスタムエラーメッセージ' },
            { status: 400 }
          );
        })
      );

      await expect(fetchApi('http://localhost:8000/api/v1/detail-error')).rejects.toThrow('カスタムエラーメッセージ');
    });

    it('detailがオブジェクトの場合はerror_msgを取得する', async () => {
      const { fetchApi } = await import('@/lib/api');

      server.use(
        http.get('http://localhost:8000/api/v1/obj-error', () => {
          return HttpResponse.json(
            { detail: { error_msg: 'オブジェクトエラー', error_code: 'ERR001' } },
            { status: 400 }
          );
        })
      );

      await expect(fetchApi('http://localhost:8000/api/v1/obj-error')).rejects.toThrow('オブジェクトエラー');
    });
  });

  describe('auth', () => {
    describe('login', () => {
      it('ログイン成功時にトークンをlocalStorageに保存する', async () => {
        server.use(
          http.post('http://localhost:8000/api/v1/auth/login', () => {
            return HttpResponse.json({
              access_token: 'new-token',
              token_type: 'bearer',
            });
          })
        );

        // auth.login は buildAuthUrl を使うが、環境変数により /api/v1/auth/login になる
        // jsdom環境ではfetchの相対URLが http://localhost/api/v1/auth/login に解決される
        // MSWでそのURLをインターセプトする
        server.use(
          http.post(/\/api\/v1\/auth\/login/, () => {
            return HttpResponse.json({
              access_token: 'new-token',
              token_type: 'bearer',
            });
          })
        );

        const result = await auth.login('user@example.com', 'password');
        expect(result.access_token).toBe('new-token');
        expect(localStorage.getItem('authToken')).toBe('new-token');
      });

      it('ログイン失敗時にApiErrorをスローする', async () => {
        server.use(
          http.post(/\/api\/v1\/auth\/login/, () => {
            return HttpResponse.json(
              { detail: 'Invalid credentials' },
              { status: 401 }
            );
          })
        );

        await expect(auth.login('wrong@example.com', 'wrong')).rejects.toThrow(ApiError);
      });
    });

    describe('logout', () => {
      it('localStorageからトークンを削除する', async () => {
        localStorage.setItem('authToken', 'some-token');
        await auth.logout();
        expect(localStorage.getItem('authToken')).toBeNull();
      });
    });

    describe('clearAuthData', () => {
      it('すべての認証データをクリアする', () => {
        localStorage.setItem('authToken', 'some-token');
        localStorage.setItem('otherData', 'value');
        auth.clearAuthData();
        expect(localStorage.getItem('authToken')).toBeNull();
      });
    });
  });
});
