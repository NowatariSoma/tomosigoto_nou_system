'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// User型を自前定義
interface AuthUser {
  id: string;
  email: string;
  raw_user_meta_data?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

interface UserRole {
  role_type: string;
  is_visible_to_general: boolean;
  is_instructor?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  isInstructor: boolean;
  isMember: boolean;
  canEdit: boolean;
  canManage: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  const roleType = userRole?.role_type;
  const isInstructorFlag = userRole?.is_instructor || false;
  const isAdmin = roleType === 'admin';
  const isInstructor = isAdmin || (roleType === 'basic' && isInstructorFlag);
  const isMember = isAdmin || roleType === 'basic';
  const canEdit = isInstructor;
  const canManage = isAdmin;

  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  };

  const fetchUserRole = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/users/me/role`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const roleData = await response.json();
        setUserRole(roleData);
      } else {
        setUserRole({ role_type: 'general', is_visible_to_general: true });
      }
    } catch {
      setUserRole({ role_type: 'general', is_visible_to_general: true });
    }
  }, [apiBaseUrl]);

  const ensureProfileExists = useCallback(async (token: string) => {
    if (typeof window !== 'undefined' && window.location.pathname === '/settings') return;
    try {
      const response = await fetch(`${apiBaseUrl}/account-setting/profile/exists`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const { exists } = await response.json();
        if (!exists) router.replace('/settings');
      }
    } catch {
      // ignore
    }
  }, [apiBaseUrl, router]);

  const checkAuth = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        setUser(null);
        setUserRole(null);
        return;
      }
      const response = await fetch(`${apiBaseUrl}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        await Promise.all([fetchUserRole(token), ensureProfileExists(token)]);
      } else {
        // トークン期限切れ → リフレッシュ試行
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const refreshResponse = await fetch(`${apiBaseUrl}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          if (refreshResponse.ok) {
            const { access_token, refresh_token: newRefreshToken } = await refreshResponse.json();
            localStorage.setItem('authToken', access_token);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
            await checkAuth();
            return;
          }
        }
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setUserRole(null);
      }
    } catch {
      setUser(null);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, fetchUserRole, ensureProfileExists]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail?.error_msg || 'ログインに失敗しました');
      }
      const data = await response.json();
      localStorage.setItem('authToken', data.access_token);
      if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token);
      // middlewareがcookieでトークンを確認するため同期して設定
      document.cookie = `authToken=${data.access_token}; path=/; max-age=${data.expires_in || 691200}; SameSite=Lax`;
      setUser(data.user);
      await Promise.all([fetchUserRole(data.access_token), ensureProfileExists(data.access_token)]);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail?.error_msg || '登録に失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await fetch(`${apiBaseUrl}/auth/signout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      document.cookie = 'authToken=; path=/; max-age=0';
      setUser(null);
      setUserRole(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const refreshUserRole = useCallback(async () => {
    const token = getToken();
    if (token) await fetchUserRole(token);
  }, [fetchUserRole]);

  return (
    <AuthContext.Provider value={{
      user,
      userRole,
      isAdmin,
      isInstructor,
      isMember,
      canEdit,
      canManage,
      isLoading,
      login,
      signUp,
      logout,
      checkAuth,
      refreshUserRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
