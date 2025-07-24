// APIクライアントの雛形
// 必要に応じてaxiosやfetchを使って実装してください

// APIクライアントの設定
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// 型定義
interface User {
  id: string
  email: string
  name?: string
  created_at?: string
  updated_at?: string
  email_confirmed_at?: string
  last_sign_in_at?: string
}

// APIリクエストヘルパー
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  }
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }
  
  const response = await fetch(url, config)
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API Error: ${response.status} - ${error}`)
  }
  
  return response.json()
}

// ユーザーAPI関数
export const userApi = {
  // すべてのユーザーを取得
  getUsers: async (token: string): Promise<User[]> => {
    return apiRequest('/api/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  },
  
  // 特定のユーザーを取得
  getUser: async (userId: string, token: string): Promise<User> => {
    return apiRequest(`/api/users/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  },
  
  // 現在のユーザー情報を取得
  getCurrentUser: async (token: string): Promise<User> => {
    return apiRequest('/api/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  },
}

// 認証API関数
export const authApi = {
  // ログイン
  login: async (email: string, password: string): Promise<{ success: boolean; token?: string; user?: User; message?: string }> => {
    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      
      return {
        success: true,
        token: response.token,
        user: response.user,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'ログインに失敗しました',
      }
    }
  },

  // ログアウト
  logout: async (token: string): Promise<{ success: boolean; message?: string }> => {
    try {
      await apiRequest('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'ログアウトに失敗しました',
      }
    }
  },

  // トークンの検証
  verifyToken: async (token: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
      const response = await apiRequest('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      return {
        success: true,
        user: response.user,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'トークンの検証に失敗しました',
      }
    }
  },
}

// 既存のauth関数（互換性維持）
export const auth = async (params?: unknown): Promise<{ success: boolean; message?: string }> => {
  // 仮実装: 必要に応じてAPIリクエスト処理を追加
  return { success: true, message: 'ダミー認証成功' };
}; 