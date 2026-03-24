import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/__mocks__/msw/server';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // デフォルトMSWハンドラ - role取得とprofile existsチェック
    server.use(
      http.get(/\/users\/me\/role/, () => {
        return HttpResponse.json({
          role_type: 'general',
          is_visible_to_general: true,
        });
      }),
      http.get(/\/account-setting\/profile\/exists/, () => {
        return HttpResponse.json({ exists: true });
      })
    );
  });

  describe('useAuth', () => {
    it('AuthProviderの外で使用するとエラーをスローする', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
    });
  });

  describe('初期状態', () => {
    it('未認証時はuserがnullになる', async () => {
      // authTokenなし
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.userRole).toBeNull();
    });
  });

  describe('認証済みユーザー', () => {
    beforeEach(() => {
      // トークンをセット
      localStorage.setItem('authToken', 'test-token');
    });

    it('ユーザーロールを取得しフラグを計算する（admin）', async () => {
      server.use(
        http.get(/\/auth\/me/, () => {
          return HttpResponse.json({ id: 'user-1', email: 'test@example.com' });
        }),
        http.get(/\/users\/me\/role/, () => {
          return HttpResponse.json({
            role_type: 'admin',
            is_visible_to_general: true,
            is_instructor: false,
          });
        }),
        http.get(/\/account-setting\/profile\/exists/, () => {
          return HttpResponse.json({ exists: true });
        })
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true);
      });

      expect(result.current.user).not.toBeNull();
      expect(result.current.canManage).toBe(true);
      expect(result.current.canEdit).toBe(true);
    });

    it('basicユーザーでis_instructor=trueの場合isInstructorがtrueになる', async () => {
      server.use(
        http.get(/\/auth\/me/, () => {
          return HttpResponse.json({ id: 'user-1', email: 'test@example.com' });
        }),
        http.get(/\/users\/me\/role/, () => {
          return HttpResponse.json({
            role_type: 'basic',
            is_visible_to_general: true,
            is_instructor: true,
          });
        }),
        http.get(/\/account-setting\/profile\/exists/, () => {
          return HttpResponse.json({ exists: true });
        })
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.isInstructor).toBe(true);
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isMember).toBe(true);
    });
  });

  describe('login', () => {
    it('ログイン成功時にエラーをスローしない', async () => {
      server.use(
        http.post(/\/auth\/signin/, () => {
          return HttpResponse.json({
            access_token: 'new-token',
            refresh_token: 'new-refresh-token',
            user: { id: 'user-1', email: 'test@example.com' },
          });
        }),
        http.get(/\/users\/me\/role/, () => {
          return HttpResponse.json({ role_type: 'general', is_visible_to_general: true });
        }),
        http.get(/\/account-setting\/profile\/exists/, () => {
          return HttpResponse.json({ exists: true });
        })
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(localStorage.getItem('authToken')).toBe('new-token');
    });

    it('ログイン失敗時にエラーをスローする', async () => {
      server.use(
        http.post(/\/auth\/signin/, () => {
          return HttpResponse.json(
            { detail: { error_msg: 'Invalid credentials' } },
            { status: 401 }
          );
        })
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login('wrong@example.com', 'wrong');
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('ログアウト後にuserとroleをnullに設定する', async () => {
      server.use(
        http.post(/\/auth\/signout/, () => {
          return new HttpResponse(null, { status: 200 });
        })
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.userRole).toBeNull();
    });

    it('ログアウト時にlocalStorageからトークンを削除する', async () => {
      localStorage.setItem('authToken', 'some-token');
      localStorage.setItem('refreshToken', 'some-refresh-token');

      server.use(
        http.post(/\/auth\/signout/, () => {
          return new HttpResponse(null, { status: 200 });
        })
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });
});
