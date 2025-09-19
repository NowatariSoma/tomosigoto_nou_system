import { AuthRequest, AuthResponse, User, TokenResponse } from '../types';
import { API_ENDPOINTS } from '../constants';
import { fetchApi } from '../../../lib/api';

export class AuthService {
  private readonly basePath = API_ENDPOINTS.AUTH;

  async signin(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.basePath}signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'ログインに失敗しました');
    }

    const data = await response.json();
    
    // トークンをlocalStorageに保存
    if (data.access_token) {
      localStorage.setItem('authToken', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refreshToken', data.refresh_token);
      }
    }
    
    return data;
  }

  async signout(): Promise<void> {
    try {
      await fetchApi(`${this.basePath}signout`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Signout error:', error);
    } finally {
      // トークンを削除
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    }
  }

  async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${this.basePath}me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user information');
    }

    return await response.json();
  }

  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetchApi(`${this.basePath}refresh`, {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const data = await response.json();
    
    // 新しいトークンを保存
    if (data.access_token) {
      localStorage.setItem('authToken', data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem('refreshToken', data.refresh_token);
    }
    
    return data;
  }

  async verifyToken(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) return false;

      const response = await fetch(`${this.basePath}verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }
}

export const authService = new AuthService();
