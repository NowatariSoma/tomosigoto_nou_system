import { useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const signin = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.signin(email, password);
      setUser(response.user);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ログインに失敗しました';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signout = async () => {
    try {
      await authService.signout();
      setUser(null);
    } catch (err) {
      console.error('Signout error:', err);
    }
  };

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!authService.isAuthenticated()) {
        setUser(null);
        return;
      }

      const isValid = await authService.verifyToken();
      if (isValid) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } else {
        setUser(null);
        // 無効なトークンを削除
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '認証確認に失敗しました');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    user,
    loading,
    error,
    signin,
    signout,
    isAuthenticated: !!user,
    checkAuth,
  };
};
