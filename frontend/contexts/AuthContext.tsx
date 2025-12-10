'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface UserRole {
  role_type: string;
  is_visible_to_general: boolean;
}

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  isInstructor: boolean;
  isMember: boolean;
  canEdit: boolean;  // スケジュール編集権限（指導者以上）
  canManage: boolean; // 管理権限（管理者のみ）
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  // 権限フラグの計算（is_instructorフラグを使用）
  const roleType = userRole?.role_type;
  const isInstructorFlag = userRole?.is_instructor || false;
  
  const isAdmin = roleType === 'admin';
  // admin または basic+is_instructor=true が指導者
  const isInstructor = isAdmin || (roleType === 'basic' && isInstructorFlag);
  // admin, basic（指導者・一般メンバー含む）がメンバー以上
  const isMember = isAdmin || roleType === 'basic';
  const canEdit = isInstructor;  // スケジュール編集は指導者以上
  const canManage = isAdmin;     // 管理機能は管理者のみ



  const fetchUserRole = useCallback(async (currentUser: User | null, session: Session | null) => {
    if (!currentUser) {
      setUserRole(null);
      return;
    }

    try {
      if (!session?.access_token) {
        setUserRole(null);
        return;
      }

      const response = await fetch(`${apiBaseUrl}/users/me/role`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const roleData = await response.json();
        setUserRole(roleData);
      } else {
        setUserRole({ role_type: 'general', is_visible_to_general: true });
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error);
      setUserRole({ role_type: 'general', is_visible_to_general: true });
    }
  }, [apiBaseUrl]);

  const ensureProfileExists = useCallback(async (currentUser: User | null, session: Session | null) => {
    if (!currentUser) {
      return;
    }

    if (typeof window !== 'undefined' && window.location.pathname === '/settings') {
      return;
    }

    try {
      const token = session?.access_token;
      if (!token) {
        return;
      }

      const response = await fetch(`${apiBaseUrl}/account-setting/profile/exists`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const { exists } = await response.json();
        if (!exists) {
          router.replace('/settings');
        }
      }
    } catch (error) {
      console.error('Failed to ensure profile exists:', error);
    }
  }, [apiBaseUrl, router]);

  const checkAuth = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // Supabaseの認証トークンをlocalStorageに保存
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          localStorage.setItem('authToken', session.access_token);
        }
        // 並列実行でパフォーマンス改善
        await Promise.all([
          fetchUserRole(user, session),
          ensureProfileExists(user, session)
        ]);
      } else {
        setUserRole(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserRole, ensureProfileExists]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      // onAuthStateChangeで処理されるため、ここでは何もしない
      // setUser(data.user);
      // if (data.user) {
      //   // Supabaseの認証トークンをlocalStorageに保存
      //   if (data.session?.access_token) {
      //     localStorage.setItem('authToken', data.session.access_token);
      //   }
      //   await fetchUserRole(data.user);
      // }
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log('SignUp response:', { data, error });

      if (error) {
        throw new Error(error.message);
      }

      // onAuthStateChangeで処理されるため、ここでは何もしない
      // setUser(data.user);
      // if (data.user) {
      //   await fetchUserRole(data.user);
      // }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      setUser(null);
      setUserRole(null);
      // localStorageから認証トークンを削除
      localStorage.removeItem('authToken');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setUserRole(null);
      // localStorageから認証トークンを削除
      localStorage.removeItem('authToken');
    }
  };

  useEffect(() => {
    checkAuth();

    // Supabaseの認証状態変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          // Supabaseの認証トークンをlocalStorageに保存
          if (session?.access_token) {
            localStorage.setItem('authToken', session.access_token);
          }
          // 並列実行でパフォーマンス改善
          await Promise.all([
            fetchUserRole(currentUser, session),
            ensureProfileExists(currentUser, session)
          ]);
        } else {
          setUserRole(null);
          // localStorageから認証トークンを削除
          localStorage.removeItem('authToken');
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [checkAuth, fetchUserRole, ensureProfileExists]);

  // 外部から呼び出し可能なラッパー関数
  const refreshUserRole = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetchUserRole(user, session);
  }, [fetchUserRole, user]);

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
      refreshUserRole 
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