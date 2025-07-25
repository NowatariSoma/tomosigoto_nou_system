/**
 * 認証関連の共通型定義
 */

export interface User {
  id: string
  email: string
  name?: string
  created_at?: string
  updated_at?: string
  email_confirmed_at?: string
  last_sign_in_at?: string
}

export interface TokenPayload {
  sub: string
  email?: string
  name?: string
  exp: number
  iat: number
  [key: string]: any
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export interface AuthResult {
  success: boolean
  error?: string
  data?: {
    session?: {
      access_token: string
      user: User
    }
  }
}