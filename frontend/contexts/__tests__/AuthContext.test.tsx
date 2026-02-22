import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/__mocks__/msw/server';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// supabaseをモック
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockGetUser = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      getUser: (...args: unknown[]) => mockGetUser(...args),
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // デフォルトのモック設定
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockSignOut.mockResolvedValue({ error: null });

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
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
        },
        error: null,
      });
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'test-token',
            user: { id: 'user-1', email: 'test@example.com' },
          },
        },
        error: null,
      });
    });

    it('ユーザーロールを取得しフラグを計算する（admin）', async () => {
      server.use(
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
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          session: { access_token: 'new-token' },
        },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('ログイン失敗時にエラーをスローする', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

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

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });
});
