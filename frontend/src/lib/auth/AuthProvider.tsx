'use client'

import React, { createContext, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '../../store'
import { 
  loginAsync, 
  logoutAsync, 
  refreshTokenAsync, 
  selectUser, 
  selectIsAuthenticated, 
  selectAuthLoading, 
  selectAuthError
} from '../../store/slices/authSlice'
import { User } from '../../types'
import { api } from '../api/client'
import { secureTokenStorage } from './secureTokenStorage'

// サインアップデータ型
export interface SignupData {
  email: string
  password: string
  name: string
}

// 認証コンテキスト型
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signup: (userData: SignupData) => Promise<void>
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 認証プロバイダーのプロパティ型
interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectUser)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isLoading = useAppSelector(selectAuthLoading)
  const error = useAppSelector(selectAuthError)

  // 認証初期化フック
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = secureTokenStorage.getToken()
      
      if (storedToken && secureTokenStorage.isTokenValid()) {
        // ストアされたトークンをAPIクライアントに設定
        api.setAuthToken(storedToken)
        
        try {
          // トークンの有効性を確認するため、ユーザー情報を取得
          await dispatch(refreshTokenAsync()).unwrap()
        } catch (error) {
          // トークンが無効な場合はクリア
          secureTokenStorage.clearToken()
          api.setAuthToken(null)
        }
      }
    }

    initializeAuth()
  }, [dispatch])


  // ログイン関数
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      const result = await dispatch(loginAsync({ email, password })).unwrap()
      
      // セキュアなトークンストレージに保存
      secureTokenStorage.setToken(result.token, result.refreshToken)
      api.setAuthToken(result.token)
    } catch (error) {
      // エラーは既にストアで管理されているため、ここでは何もしない
      throw error
    }
  }, [dispatch])

  // ログアウト関数
  const logout = useCallback(async (): Promise<void> => {
    try {
      await dispatch(logoutAsync()).unwrap()
    } catch (error) {
      // ログアウトエラーがあってもローカルの状態はクリア
      console.warn('ログアウト中にエラーが発生しましたが、ローカルセッションをクリアします:', error)
    } finally {
      secureTokenStorage.clearToken()
      api.setAuthToken(null)
    }
  }, [dispatch])

  // サインアップ関数
  const signup = useCallback(async (userData: SignupData): Promise<void> => {
    try {
      const response = await api.post('/auth/signup', userData)
      
      // サインアップ後、自動的にログイン
      if (response.token) {
        secureTokenStorage.setToken(response.token, response.refreshToken)
        api.setAuthToken(response.token)
        
        // ユーザー情報を取得してストアを更新
        await dispatch(refreshTokenAsync()).unwrap()
      }
    } catch (error) {
      throw error
    }
  }, [dispatch])

  // トークン更新関数
  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      const result = await dispatch(refreshTokenAsync()).unwrap()
      if (result.token) {
        secureTokenStorage.setToken(result.token, result.refreshToken)
        api.setAuthToken(result.token)
      }
    } catch (error) {
      // トークン更新に失敗した場合はログアウト
      secureTokenStorage.clearToken()
      api.setAuthToken(null)
      throw error
    }
  }, [dispatch])

  const contextValue: AuthContextType = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    signup,
    refreshToken,
  }), [user, isAuthenticated, isLoading, error, login, logout, signup, refreshToken])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// 認証コンテキスト利用フック
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 認証が必要なコンポーネントをラップするHOC
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">認証が必要です</h1>
            <p className="text-gray-600">このページにアクセスするにはログインが必要です。</p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}