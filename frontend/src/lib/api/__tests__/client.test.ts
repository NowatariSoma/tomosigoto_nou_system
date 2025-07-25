import { ApiClient, ApiError } from '../client'

// fetchのモック
global.fetch = jest.fn()

describe('ApiClient', () => {
  let client: ApiClient

  beforeEach(() => {
    client = new ApiClient('http://localhost:8000/api', {
      timeout: 5000,
      headers: { 'X-Custom-Header': 'test' },
    })
    ;(global.fetch as jest.Mock).mockClear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('初期化', () => {
    it('正しい設定で初期化されるべき', () => {
      expect(client).toBeInstanceOf(ApiClient)
    })

    it('末尾のスラッシュが削除されるべき', () => {
      const clientWithSlash = new ApiClient('http://localhost:8000/api/')
      expect(clientWithSlash['baseUrl']).toBe('http://localhost:8000/api')
    })
  })

  describe('認証トークン', () => {
    it('認証トークンを設定できるべき', () => {
      const token = 'test-token'
      client.setAuthToken(token)
      expect(client['authToken']).toBe(token)
    })

    it('認証トークンをnullに設定できるべき', () => {
      client.setAuthToken('test-token')
      client.setAuthToken(null)
      expect(client['authToken']).toBeNull()
    })
  })

  describe('GETリクエスト', () => {
    it('パラメータなしのGETリクエストが成功するべき', async () => {
      const mockData = { id: 1, name: 'テスト' }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockData),
      })

      const result = await client.get('/users')

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/users',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom-Header': 'test',
          }),
        })
      )
      expect(result).toEqual(mockData)
    })

    it('パラメータ付きのGETリクエストが成功するべき', async () => {
      const mockData = { users: [] }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockData),
      })

      await client.get('/users', { page: 1, limit: 10, active: true })

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/users?page=1&limit=10&active=true',
        expect.any(Object)
      )
    })

    it('undefined/nullのパラメータは無視されるべき', async () => {
      const mockData = { users: [] }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockData),
      })

      await client.get('/users', { page: 1, limit: undefined, active: null })

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/users?page=1',
        expect.any(Object)
      )
    })

    it('認証トークンがヘッダーに含まれるべき', async () => {
      const mockData = { data: 'test' }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockData),
      })

      client.setAuthToken('Bearer test-token')
      await client.get('/protected')

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/protected',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer Bearer test-token',
          }),
        })
      )
    })
  })

  describe('POSTリクエスト', () => {
    it('データ付きのPOSTリクエストが成功するべき', async () => {
      const requestData = { name: 'テストユーザー', email: 'test@example.com' }
      const responseData = { id: 1, ...requestData }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(responseData),
      })

      const result = await client.post('/users', requestData)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(responseData)
    })

    it('データなしのPOSTリクエストが成功するべき', async () => {
      const responseData = { message: 'success' }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(responseData),
      })

      await client.post('/action')

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/action',
        expect.objectContaining({
          method: 'POST',
          body: undefined,
        })
      )
    })
  })

  describe('PUTリクエスト', () => {
    it('PUTリクエストが成功するべき', async () => {
      const requestData = { name: '更新されたユーザー' }
      const responseData = { id: 1, ...requestData }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(responseData),
      })

      const result = await client.put('/users/1', requestData)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/users/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(requestData),
        })
      )
      expect(result).toEqual(responseData)
    })
  })

  describe('DELETEリクエスト', () => {
    it('DELETEリクエストが成功するべき', async () => {
      const responseData = { message: 'deleted' }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(responseData),
      })

      const result = await client.delete('/users/1')

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/users/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
      expect(result).toEqual(responseData)
    })
  })

  describe('エラー処理', () => {
    it('HTTPエラー（4xx）でApiErrorがスローされるべき', async () => {
      const errorResponse = {
        message: 'ユーザーが見つかりません',
        code: 'USER_NOT_FOUND',
      }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(errorResponse),
      })

      await expect(client.get('/users/999')).rejects.toThrow(ApiError)
      await expect(client.get('/users/999')).rejects.toMatchObject({
        message: 'ユーザーが見つかりません',
        status: 404,
        code: 'USER_NOT_FOUND',
      })
    })

    it('HTTPエラー（5xx）でApiErrorがスローされるべき', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({ message: 'サーバーエラー' }),
      })

      await expect(client.get('/users')).rejects.toThrow(ApiError)
      await expect(client.get('/users')).rejects.toMatchObject({
        message: 'サーバーエラー',
        status: 500,
      })
    })

    it('ネットワークエラーでApiErrorがスローされるべき', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      )

      await expect(client.get('/users')).rejects.toThrow(ApiError)
      await expect(client.get('/users')).rejects.toMatchObject({
        message: 'ネットワークエラーが発生しました',
        status: 0,
      })
    })

    it('タイムアウトでAbortErrorがスローされるべき', async () => {
      ;(global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((resolve) => {
          setTimeout(resolve, 10000) // 10秒後に解決
        })
      )

      const request = client.get('/users')
      
      // タイムアウト時間を進める
      jest.advanceTimersByTime(5000)
      
      await expect(request).rejects.toThrow(ApiError)
      await expect(request).rejects.toMatchObject({
        message: 'リクエストがタイムアウトしました',
        status: 408,
      })
    })
  })

  describe('レスポンス処理', () => {
    it('JSONレスポンスが正しく処理されるべき', async () => {
      const responseData = { id: 1, name: 'テスト' }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(responseData),
      })

      const result = await client.get('/users/1')
      expect(result).toEqual(responseData)
    })

    it('テキストレスポンスが正しく処理されるべき', async () => {
      const responseText = 'プレーンテキストレスポンス'
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'text/plain']]),
        text: () => Promise.resolve(responseText),
      })

      const result = await client.get('/status')
      expect(result).toBe(responseText)
    })

    it('APIレスポンス形式のdataプロパティが展開されるべき', async () => {
      const innerData = { id: 1, name: 'テスト' }
      const apiResponse = {
        data: innerData,
        message: '成功',
        status: 200,
      }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(apiResponse),
      })

      const result = await client.get('/users/1')
      expect(result).toEqual(innerData)
    })
  })

  describe('AbortSignal', () => {
    it('外部から提供されたAbortSignalが使用されるべき', async () => {
      const controller = new AbortController()
      const mockData = { id: 1 }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockData),
      })

      await client.get('/users', undefined, { signal: controller.signal })

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/users',
        expect.objectContaining({
          signal: controller.signal,
        })
      )
    })
  })

  describe('カスタムヘッダー', () => {
    it('リクエスト固有のヘッダーが設定されるべき', async () => {
      const mockData = { id: 1 }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockData),
      })

      await client.get('/users', undefined, {
        headers: { 'X-Request-ID': 'test-request-123' },
      })

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/users',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom-Header': 'test',
            'X-Request-ID': 'test-request-123',
          }),
        })
      )
    })
  })
})

describe('ApiError', () => {
  it('正しく初期化されるべき', () => {
    const error = new ApiError('テストエラー', 400, 'TEST_ERROR')
    
    expect(error.name).toBe('ApiError')
    expect(error.message).toBe('テストエラー')
    expect(error.status).toBe(400)
    expect(error.code).toBe('TEST_ERROR')
    expect(error).toBeInstanceOf(Error)
  })

  it('コードなしで初期化されるべき', () => {
    const error = new ApiError('テストエラー', 500)
    
    expect(error.code).toBeUndefined()
  })
})