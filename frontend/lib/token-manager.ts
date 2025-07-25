import { jwtDecode } from 'jwt-decode'
import { TokenPayload, User } from '@/types/auth'

export class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token'
  private static memoryToken: string | null = null

  /**
   * トークンをメモリに保存（セキュリティ向上のため）
   * Note: 本番環境ではHttpOnly cookieの使用を推奨
   */
  static saveToken(token: string): void {
    // メモリ保存を優先
    this.memoryToken = token
    
    // フォールバックとしてlocalStorageも使用（将来的には削除予定）
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token)
    }
  }

  /**
   * トークンを取得（メモリ優先）
   */
  static getToken(): string | null {
    // メモリから取得を試行
    if (this.memoryToken) {
      return this.memoryToken
    }
    
    // フォールバックとしてlocalStorageから取得
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(this.TOKEN_KEY)
      if (token) {
        this.memoryToken = token
        return token
      }
    }
    return null
  }

  /**
   * トークンを削除
   */
  static removeToken(): void {
    this.memoryToken = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY)
    }
  }

  /**
   * トークンが期限切れかどうかをチェック
   */
  static isTokenExpired(token: string): boolean {
    if (!token) return true

    try {
      const payload = this.getTokenPayload(token)
      if (!payload || !payload.exp) return true

      const currentTime = Math.floor(Date.now() / 1000)
      return payload.exp < currentTime
    } catch {
      return true
    }
  }

  /**
   * JWTトークンからペイロードを取得（安全にデコード）
   */
  static getTokenPayload(token: string): TokenPayload | null {
    if (!token) return null

    try {
      // jwt-decodeライブラリを使用して安全にデコード
      return jwtDecode<TokenPayload>(token)
    } catch (error) {
      console.error('JWT decode error:', error)
      return null
    }
  }

  /**
   * 現在のトークンが有効で認証済みかどうかをチェック
   */
  static isAuthenticated(): boolean {
    const token = this.getToken()
    if (!token) return false

    if (this.isTokenExpired(token)) {
      this.removeToken()
      return false
    }

    return true
  }

  /**
   * トークンからユーザー情報を取得
   */
  static getUserFromToken(token: string): User | null {
    const payload = this.getTokenPayload(token)
    if (!payload) return null

    return {
      id: payload.sub,
      email: payload.email || '',
      name: payload.name,
    }
  }

  /**
   * 現在のユーザー情報を取得
   */
  static getCurrentUser(): User | null {
    const token = this.getToken()
    if (!token) return null

    return this.getUserFromToken(token)
  }
}