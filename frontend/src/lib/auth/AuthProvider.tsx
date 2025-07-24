'use client'

import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { useAppDispatch, useAppSelector } from '../../store'
import { 
  loginAsync, 
  logoutAsync, 
  refreshTokenAsync, 
  selectUser, 
  selectIsAuthenticated, 
  selectAuthLoading, 
  selectAuthError,
  User
} from '../../store/slices/authSlice'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { api } from '../api/client'

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
  
  const [storedToken, setStoredToken] = useLocalStorage<string | null>('auth_token', null)

  // 認証初期化フック
  useEffect(() => {
    const initializeAuth = async () => {
      if (storedToken) {
        // ストアされたトークンをAPIクライアントに設定
        api.setAuthToken(storedToken)
        
        try {
          // トークンの有効性を確認するため、ユーザー情報を取得
          await dispatch(refreshTokenAsync()).unwrap()
        } catch (error) {
          // トークンが無効な場合はクリア
          setStoredToken(null)
          api.setAuthToken(null)
        }
      }
    }

    initializeAuth()
  }, [storedToken, dispatch, setStoredToken])

  // トークンの永続化
  useEffect(() => {
    const state = { auth: { user, token: storedToken, isAuthenticated, isLoading, error } }
    const currentToken = state.auth.token

    if (currentToken && currentToken !== storedToken) {
      setStoredToken(currentToken)
      api.setAuthToken(currentToken)
    } else if (!currentToken && storedToken) {
      setStoredToken(null)
      api.setAuthToken(null)
    }
  }, [user, isAuthenticated, storedToken, setStoredToken])

  // ログイン関数
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const result = await dispatch(loginAsync({ email, password })).unwrap()
      setStoredToken(result.token)
      api.setAuthToken(result.token)
    } catch (error) {
      // エラーは既にストアで管理されているため、ここでは何もしない
      throw error
    }
  }

  // ログアウト関数
  const logout = async (): Promise<void> => {
    try {
      await dispatch(logoutAsync()).unwrap()
    } catch (error) {
      // ログアウトエラーがあってもローカルの状態はクリア
      console.warn('ログアウト中にエラーが発生しましたが、ローカルセッションをクリアします:', error)
    } finally {
      setStoredToken(null)
      api.setAuthToken(null)
    }
  }

  // サインアップ関数
  const signup = async (userData: SignupData): Promise<void> => {
    try {
      const response = await api.post('/auth/signup', userData)
      
      // サインアップ後、自動的にログイン
      if (response.token) {
        setStoredToken(response.token)
        api.setAuthToken(response.token)
        
        // ユーザー情報を取得してストアを更新
        await dispatch(refreshTokenAsync()).unwrap()
      }
    } catch (error) {
      throw error
    }
  }

  // トークン更新関数
  const refreshToken = async (): Promise<void> => {
    try {
      const result = await dispatch(refreshTokenAsync()).unwrap()
      if (result.token) {
        setStoredToken(result.token)
        api.setAuthToken(result.token)
      }
    } catch (error) {
      // トークン更新に失敗した場合はログアウト
      setStoredToken(null)
      api.setAuthToken(null)
      throw error
    }
  }

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    signup,
    refreshToken,
  }

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