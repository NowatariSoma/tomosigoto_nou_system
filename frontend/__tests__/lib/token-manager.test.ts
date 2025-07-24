import { TokenManager } from '@/lib/token-manager'

// LocalStorageのモック
const localStorageMock = (() => {
  let store: { [key: string]: string } = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('TokenManager', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  describe('saveToken', () => {
    test('トークンがlocalStorageに正しく保存される', () => {
      const token = 'test-jwt-token'
      
      TokenManager.saveToken(token)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', token)
    })

    test('空のトークンでもエラーが発生しない', () => {
      expect(() => TokenManager.saveToken('')).not.toThrow()
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', '')
    })
  })

  describe('getToken', () => {
    test('保存されたトークンを正しく取得できる', () => {
      const token = 'test-jwt-token'
      localStorageMock.setItem('auth_token', token)
      
      const result = TokenManager.getToken()
      
      expect(result).toBe(token)
      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token')
    })

    test('トークンが存在しない場合nullを返す', () => {
      const result = TokenManager.getToken()
      
      expect(result).toBeNull()
      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token')
    })
  })

  describe('removeToken', () => {
    test('トークンがlocalStorageから削除される', () => {
      const token = 'test-jwt-token'
      localStorageMock.setItem('auth_token', token)
      
      TokenManager.removeToken()
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token')
    })
  })

  describe('isTokenExpired', () => {
    test('有効なトークンの場合falseを返す', () => {
      // 1時間後に期限切れのトークンを作成
      const payload = {
        exp: Math.floor(Date.now() / 1000) + 3600, // 1時間後
        sub: 'user-id',
        iat: Math.floor(Date.now() / 1000)
      }
      const token = createMockJWT(payload)
      
      const result = TokenManager.isTokenExpired(token)
      
      expect(result).toBe(false)
    })

    test('期限切れのトークンの場合trueを返す', () => {
      // 1時間前に期限切れのトークンを作成
      const payload = {
        exp: Math.floor(Date.now() / 1000) - 3600, // 1時間前
        sub: 'user-id',
        iat: Math.floor(Date.now() / 1000) - 7200 // 2時間前に発行
      }
      const token = createMockJWT(payload)
      
      const result = TokenManager.isTokenExpired(token)
      
      expect(result).toBe(true)
    })

    test('不正なトークンの場合trueを返す', () => {
      const invalidToken = 'invalid-token'
      
      const result = TokenManager.isTokenExpired(invalidToken)
      
      expect(result).toBe(true)
    })

    test('空のトークンの場合trueを返す', () => {
      const result = TokenManager.isTokenExpired('')
      
      expect(result).toBe(true)
    })
  })

  describe('getTokenPayload', () => {
    test('有効なトークンからペイロードを取得できる', () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      }
      const token = createMockJWT(payload)
      
      const result = TokenManager.getTokenPayload(token)
      
      expect(result).toEqual(payload)
    })

    test('不正なトークンの場合nullを返す', () => {
      const invalidToken = 'invalid-token'
      
      const result = TokenManager.getTokenPayload(invalidToken)
      
      expect(result).toBeNull()
    })

    test('空のトークンの場合nullを返す', () => {
      const result = TokenManager.getTokenPayload('')
      
      expect(result).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    test('有効なトークンが存在する場合trueを返す', () => {
      const payload = {
        exp: Math.floor(Date.now() / 1000) + 3600,
        sub: 'user-id',
        iat: Math.floor(Date.now() / 1000)
      }
      const token = createMockJWT(payload)
      localStorageMock.setItem('auth_token', token)
      
      const result = TokenManager.isAuthenticated()
      
      expect(result).toBe(true)
    })

    test('期限切れのトークンの場合falseを返し、トークンを削除する', () => {
      const payload = {
        exp: Math.floor(Date.now() / 1000) - 3600, // 期限切れ
        sub: 'user-id',
        iat: Math.floor(Date.now() / 1000) - 7200
      }
      const token = createMockJWT(payload)
      localStorageMock.setItem('auth_token', token)
      
      const result = TokenManager.isAuthenticated()
      
      expect(result).toBe(false)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token')
    })

    test('トークンが存在しない場合falseを返す', () => {
      const result = TokenManager.isAuthenticated()
      
      expect(result).toBe(false)
    })
  })

  describe('getUserFromToken', () => {
    test('トークンからユーザー情報を取得できる', () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      }
      const token = createMockJWT(payload)
      
      const result = TokenManager.getUserFromToken(token)
      
      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      })
    })

    test('不正なトークンの場合nullを返す', () => {
      const result = TokenManager.getUserFromToken('invalid-token')
      
      expect(result).toBeNull()
    })
  })
})

// テスト用のJWT作成ヘルパー（実際のJWTではなくBase64エンコードされた構造のみ）
function createMockJWT(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  const signature = 'mock-signature'
  
  return `${encodedHeader}.${encodedPayload}.${signature}`
}