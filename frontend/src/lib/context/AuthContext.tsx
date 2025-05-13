/**
 * 認証コンテキスト
 * 
 * このファイルは認証状態を管理するReactコンテキストを提供します。
 * ユーザーのログイン状態、認証情報、権限チェックなどの機能を提供します。
 */

import { createContext, useContext, useState, useEffect, ReactNode, FC } from 'react';
import { User } from '@/types/models';
import { ApiClient } from '@/lib/api/client';
import { AuthEndpoints } from '@/lib/api/endpoints';
import { config } from '@/config';

/**
 * 認証コンテキストの状態
 */
interface AuthContextState {
  /** 現在のユーザー */
  user: User | null;
  /** ロード中かどうか */
  loading: boolean;
  /** ログイン済みかどうか */
  isAuthenticated: boolean;
  /** ログイン処理 */
  login: (email: string, password: string) => Promise<void>;
  /** ログアウト処理 */
  logout: () => Promise<void>;
  /** 認証トークンを取得 */
  getToken: () => string | null;
  /** 指定の権限を持っているかチェック */
  hasPermission: (permission: string) => boolean;
}

/**
 * 認証コンテキストのデフォルト値
 */
const defaultAuthContextState: AuthContextState = {
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => { throw new Error('Not implemented'); },
  logout: async () => { throw new Error('Not implemented'); },
  getToken: () => null,
  hasPermission: () => false,
};

/**
 * 認証コンテキスト
 */
const AuthContext = createContext<AuthContextState>(defaultAuthContextState);

/**
 * 認証コンテキストプロバイダーのプロパティ
 */
interface AuthProviderProps {
  /** 子要素 */
  children: ReactNode;
}

/**
 * 認証コンテキストプロバイダー
 */
export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const apiClient = new ApiClient();

  /**
   * 認証トークンをローカルストレージから取得
   */
  const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(config.authTokenKey);
    }
    return null;
  };

  /**
   * 認証トークンをローカルストレージに保存
   */
  const setToken = (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(config.authTokenKey, token);
    }
  };

  /**
   * 認証トークンをローカルストレージから削除
   */
  const removeToken = (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(config.authTokenKey);
    }
  };

  /**
   * 現在のユーザー情報を取得
   */
  const fetchCurrentUser = async (): Promise<void> => {
    try {
      const token = getToken();
      
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      apiClient.setAuthToken(token);
      const response = await apiClient.get<User>(AuthEndpoints.CURRENT_USER);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching current user:', error);
      setUser(null);
      removeToken();
    } finally {
      setLoading(false);
    }
  };

  /**
   * ログイン処理
   */
  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    
    try {
      const response = await apiClient.post<{ token: string; user: User }>(
        AuthEndpoints.LOGIN,
        { email, password }
      );
      
      const { token, user: userData } = response.data;
      setToken(token);
      setUser(userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * ログアウト処理
   */
  const logout = async (): Promise<void> => {
    setLoading(true);
    
    try {
      const token = getToken();
      
      if (token) {
        apiClient.setAuthToken(token);
        await apiClient.post(AuthEndpoints.LOGOUT);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeToken();
      setUser(null);
      setLoading(false);
    }
  };

  /**
   * 指定の権限を持っているかチェック
   */
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.roles) return false;
    
    return user.roles.some(role => 
      role.permissions && role.permissions.includes(permission)
    );
  };

  // 初期ロード時に現在のユーザー情報を取得
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        getToken,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 認証コンテキストを使用するカスタムフック
 */
export const useAuth = () => useContext(AuthContext);

export default AuthContext; 