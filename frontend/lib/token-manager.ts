interface TokenPayload {
  sub: string
  email?: string
  name?: string
  exp: number
  iat: number
  [key: string]: any
}

interface User {
  id: string
  email: string
  name?: string
}

export class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token'

  /**
   * トークンをlocalStorageに保存
   */
  static saveToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token)
    }
  }

  /**
   * localStorageからトークンを取得
   */
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY)
    }
    return null
  }

  /**
   * localStorageからトークンを削除
   */
  static removeToken(): void {
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
   * JWTトークンからペイロードを取得
   */
  static getTokenPayload(token: string): TokenPayload | null {
    if (!token) return null

    try {
      const parts = token.split('.')
      if (parts.length !== 3) return null

      const payload = parts[1]
      const decodedPayload = atob(payload)
      return JSON.parse(decodedPayload) as TokenPayload
    } catch {
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