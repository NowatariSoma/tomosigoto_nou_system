'use client'

import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react'
import { auth } from '@/lib/auth-service'
import { TokenManager } from '@/lib/token-manager'
import { User, AuthContextType } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = !!user

  // 初期化時に既存のトークンをチェック
  useEffect(() => {
    const initializeAuth = () => {
      try {
        if (TokenManager.isAuthenticated()) {
          const token = TokenManager.getToken()
          if (token) {
            const userData = TokenManager.getUserFromToken(token)
            setUser(userData)
          }
        }
      } catch (err) {
        console.error('認証初期化エラー:', err)
        TokenManager.removeToken()
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await auth.signIn(email, password)

      if (!result.success) {
        setError(result.error || 'ログインに失敗しました')
        return
      }

      if (result.data?.session?.access_token) {
        TokenManager.saveToken(result.data.session.access_token)
        const userData = TokenManager.getUserFromToken(result.data.session.access_token)
        setUser(userData)
      }
    } catch (err) {
      console.error('ログインエラー:', err)
      setError('ネットワークエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)

      await auth.signOut()
      TokenManager.removeToken()
      setUser(null)
    } catch (err) {
      console.error('ログアウトエラー:', err)
      setError('ログアウトに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
  }), [user, isAuthenticated, isLoading, error])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}