'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface UserRole {
  role_type: string;
  is_visible_to_general: boolean;
}

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  fetchUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = userRole?.role_type === 'admin';

  const fetchUserRole = async () => {
    if (!user) {
      setUserRole(null);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setUserRole(null);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me/role`, {
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
  };

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchUserRole();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

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

      setUser(data.user);
      if (data.user) {
        await fetchUserRole();
      }
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

      setUser(data.user);
      if (data.user) {
        await fetchUserRole();
      }
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
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setUserRole(null);
    }
  };

  useEffect(() => {
    checkAuth();

    // Supabaseの認証状態変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserRole();
        } else {
          setUserRole(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, isAdmin, isLoading, login, signUp, logout, checkAuth, fetchUserRole }}>
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