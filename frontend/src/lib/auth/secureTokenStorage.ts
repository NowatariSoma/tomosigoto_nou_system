/**
 * セキュアなトークンストレージ
 * XSS攻撃を軽減するためのセキュリティ対策を実装
 */

// トークン暗号化用のインターフェース
interface TokenData {
  token: string
  refreshToken?: string
  expiresAt?: number
  issuedAt: number
}

// 暗号化キー生成（セッション固有）
let encryptionKey: string | null = null

// セッション固有の暗号化キーを生成
function generateEncryptionKey(): string {
  if (typeof window === 'undefined') return 'fallback-key'
  
  // ブラウザフィンガープリントを使用してキーを生成
  const userAgent = navigator.userAgent
  const screen = `${window.screen.width}x${window.screen.height}`
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const timestamp = Date.now().toString()
  
  return btoa(`${userAgent}-${screen}-${timezone}-${timestamp}`).slice(0, 32)
}

// 初期化時にキーを生成
function initEncryptionKey(): string {
  if (!encryptionKey) {
    encryptionKey = generateEncryptionKey()
  }
  return encryptionKey
}

// 簡易的なXOR暗号化（本格的なプロダクションではWebCrypto APIを使用推奨）
function encrypt(text: string, key: string): string {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    result += String.fromCharCode(charCode)
  }
  return btoa(result)
}

function decrypt(encryptedText: string, key: string): string {
  try {
    const decodedText = atob(encryptedText)
    let result = ''
    for (let i = 0; i < decodedText.length; i++) {
      const charCode = decodedText.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      result += String.fromCharCode(charCode)
    }
    return result
  } catch (error) {
    console.warn('トークンの復号化に失敗しました:', error)
    return ''
  }
}

// メモリベースのトークンストレージ（最もセキュア）
class InMemoryTokenStorage {
  private token: string | null = null
  private refreshToken: string | null = null
  private expiresAt: number | null = null

  setToken(tokenData: TokenData): void {
    this.token = tokenData.token
    this.refreshToken = tokenData.refreshToken || null
    this.expiresAt = tokenData.expiresAt || null
  }

  getToken(): string | null {
    if (this.token && this.expiresAt && Date.now() > this.expiresAt) {
      this.clearToken()
      return null
    }
    return this.token
  }

  getRefreshToken(): string | null {
    return this.refreshToken
  }

  clearToken(): void {
    this.token = null
    this.refreshToken = null
    this.expiresAt = null
  }

  hasToken(): boolean {
    return this.getToken() !== null
  }
}

// セキュアなトークンストレージクラス
export class SecureTokenStorage {
  private static instance: SecureTokenStorage
  private memoryStorage = new InMemoryTokenStorage()
  private readonly STORAGE_KEY = 'auth_session'
  private readonly MAX_AGE = 24 * 60 * 60 * 1000 // 24時間

  private constructor() {
    this.initializeFromSession()
  }

  static getInstance(): SecureTokenStorage {
    if (!SecureTokenStorage.instance) {
      SecureTokenStorage.instance = new SecureTokenStorage()
    }
    return SecureTokenStorage.instance
  }

  /**
   * トークンを安全に保存
   * 1. メモリに保存（最優先）
   * 2. セッションストレージに暗号化して保存（ページリロード対応）
   */
  setToken(token: string, refreshToken?: string, expiresIn?: number): void {
    if (typeof window === 'undefined') return

    const issuedAt = Date.now()
    const expiresAt = expiresIn ? issuedAt + (expiresIn * 1000) : issuedAt + this.MAX_AGE

    const tokenData: TokenData = {
      token,
      refreshToken,
      expiresAt,
      issuedAt,
    }

    // メモリに保存
    this.memoryStorage.setToken(tokenData)

    // セッションストレージに暗号化して保存
    try {
      const key = initEncryptionKey()
      const encryptedData = encrypt(JSON.stringify(tokenData), key)
      sessionStorage.setItem(this.STORAGE_KEY, encryptedData)
    } catch (error) {
      console.warn('セッションストレージへの保存に失敗しました:', error)
    }
  }

  /**
   * トークンを取得
   * メモリから取得できない場合はセッションストレージから復元を試行
   */
  getToken(): string | null {
    // メモリから取得を試行
    let token = this.memoryStorage.getToken()
    if (token) return token

    // セッションストレージから復元を試行
    token = this.restoreFromSession()
    return token
  }

  /**
   * リフレッシュトークンを取得
   */
  getRefreshToken(): string | null {
    // メモリから取得を試行
    let refreshToken = this.memoryStorage.getRefreshToken()
    if (refreshToken) return refreshToken

    // セッションストレージから復元を試行
    this.restoreFromSession()
    return this.memoryStorage.getRefreshToken()
  }

  /**
   * トークンをクリア
   */
  clearToken(): void {
    this.memoryStorage.clearToken()
    
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(this.STORAGE_KEY)
      } catch (error) {
        console.warn('セッションストレージのクリアに失敗しました:', error)
      }
    }
  }

  /**
   * トークンの存在チェック
   */
  hasToken(): boolean {
    return this.getToken() !== null
  }

  /**
   * トークンの有効性チェック
   */
  isTokenValid(): boolean {
    const token = this.getToken()
    return token !== null && token.length > 0
  }

  /**
   * セッションストレージからトークンを復元
   */
  private restoreFromSession(): string | null {
    if (typeof window === 'undefined') return null

    try {
      const encryptedData = sessionStorage.getItem(this.STORAGE_KEY)
      if (!encryptedData) return null

      const key = initEncryptionKey()
      const decryptedData = decrypt(encryptedData, key)
      if (!decryptedData) {
        // 復号化に失敗した場合はクリア
        sessionStorage.removeItem(this.STORAGE_KEY)
        return null
      }

      const tokenData: TokenData = JSON.parse(decryptedData)
      
      // 有効期限チェック
      if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
        this.clearToken()
        return null
      }

      // メモリに復元
      this.memoryStorage.setToken(tokenData)
      return tokenData.token
    } catch (error) {
      console.warn('セッションストレージからの復元に失敗しました:', error)
      // 破損したデータをクリア
      sessionStorage.removeItem(this.STORAGE_KEY)
      return null
    }
  }

  /**
   * 初期化時にセッションストレージから復元
   */
  private initializeFromSession(): void {
    this.restoreFromSession()
  }

  /**
   * セキュリティ情報の取得（デバッグ用）
   */
  getSecurityInfo(): object {
    return {
      hasMemoryToken: this.memoryStorage.hasToken(),
      hasSessionStorage: typeof window !== 'undefined' && !!sessionStorage.getItem(this.STORAGE_KEY),
      encryptionKeyLength: encryptionKey?.length || 0,
    }
  }
}

// デフォルトエクスポート
export const secureTokenStorage = SecureTokenStorage.getInstance()

// レガシーサポート用のインターフェース
export const tokenStorage = {
  setToken: (token: string, refreshToken?: string, expiresIn?: number) => 
    secureTokenStorage.setToken(token, refreshToken, expiresIn),
  getToken: () => secureTokenStorage.getToken(),
  getRefreshToken: () => secureTokenStorage.getRefreshToken(),
  clearToken: () => secureTokenStorage.clearToken(),
  hasToken: () => secureTokenStorage.hasToken(),
  isValid: () => secureTokenStorage.isTokenValid(),
}