import { ApiClient, createApiClient } from '@/lib/api/client'
import { ApiResponse, ApiError } from '@/types/api'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('ApiClient', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('constructor', () => {
    it('baseURLを正しく設定する', () => {
      const client = new ApiClient('http://localhost:8000')
      expect(client['baseUrl']).toBe('http://localhost:8000')
    })

    it('末尾のスラッシュを除去する', () => {
      const client = new ApiClient('http://localhost:8000/')
      expect(client['baseUrl']).toBe('http://localhost:8000')
    })

    it('デフォルトヘッダーを設定する', () => {
      const client = new ApiClient('http://localhost:8000')
      expect(client['defaultHeaders']).toEqual({
        'Content-Type': 'application/json'
      })
    })

    it('カスタムヘッダーを設定する', () => {
      const customHeaders = { 'X-Custom': 'test' }
      const client = new ApiClient('http://localhost:8000', customHeaders)
      expect(client['defaultHeaders']).toEqual({
        'Content-Type': 'application/json',
        'X-Custom': 'test'
      })
    })
  })

  describe('setAuthToken', () => {
    it('認証トークンを設定する', () => {
      const client = new ApiClient('http://localhost:8000')
      client.setAuthToken('test-token')
      expect(client['authToken']).toBe('test-token')
    })
  })

  describe('clearAuthToken', () => {
    it('認証トークンをクリアする', () => {
      const client = new ApiClient('http://localhost:8000')
      client.setAuthToken('test-token')
      client.clearAuthToken()
      expect(client['authToken']).toBeUndefined()
    })
  })

  describe('buildUrl', () => {
    it('パスを正しく結合する', () => {
      const client = new ApiClient('http://localhost:8000')
      const url = client['buildUrl']('/api/users')
      expect(url).toBe('http://localhost:8000/api/users')
    })

    it('先頭にスラッシュがないパスを正しく処理する', () => {
      const client = new ApiClient('http://localhost:8000')
      const url = client['buildUrl']('api/users')
      expect(url).toBe('http://localhost:8000/api/users')
    })

    it('クエリパラメータを正しく追加する', () => {
      const client = new ApiClient('http://localhost:8000')
      const url = client['buildUrl']('/api/users', { page: 1, size: 10 })
      expect(url).toBe('http://localhost:8000/api/users?page=1&size=10')
    })

    it('null/undefinedパラメータを除外する', () => {
      const client = new ApiClient('http://localhost:8000')
      const url = client['buildUrl']('/api/users', { page: 1, size: null, search: undefined })
      expect(url).toBe('http://localhost:8000/api/users?page=1')
    })
  })

  describe('getHeaders', () => {
    it('デフォルトヘッダーを返す', () => {
      const client = new ApiClient('http://localhost:8000')
      const headers = client['getHeaders']()
      expect(headers).toEqual({
        'Content-Type': 'application/json'
      })
    })

    it('認証トークンが設定されている場合Authorizationヘッダーを追加する', () => {
      const client = new ApiClient('http://localhost:8000')
      client.setAuthToken('test-token')
      const headers = client['getHeaders']()
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      })
    })
  })

  describe('HTTP methods', () => {
    let client: ApiClient

    beforeEach(() => {
      client = new ApiClient('http://localhost:8000')
    })

    describe('get', () => {
      it('成功レスポンスを正しく処理する', async () => {
        const mockData = { id: '1', name: 'Test' }
        const mockResponse = {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(mockData),
        }
        mockFetch.mockResolvedValue(mockResponse)

        const result = await client.get<typeof mockData>('/api/users')

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/users',
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        )
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.value.data).toEqual(mockData)
          expect(result.value.status).toBe(200)
        }
      })

      it('エラーレスポンスを正しく処理する', async () => {
        const mockError = { message: 'Not found' }
        const mockResponse = {
          ok: false,
          status: 404,
          statusText: 'Not Found',
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(mockError),
        }
        mockFetch.mockResolvedValue(mockResponse)

        const result = await client.get('/api/users')

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.code).toBe('404')
          expect(result.error.message).toBe('Not found')
        }
      })

      it('ネットワークエラーを正しく処理する', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'))

        const result = await client.get('/api/users')

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.code).toBe('NETWORK_ERROR')
          expect(result.error.message).toBe('Network error')
        }
      })
    })

    describe('post', () => {
      it('POSTリクエストを正しく送信する', async () => {
        const mockData = { id: '1', name: 'Created' }
        const postData = { name: 'New User' }
        const mockResponse = {
          ok: true,
          status: 201,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(mockData),
        }
        mockFetch.mockResolvedValue(mockResponse)

        const result = await client.post<typeof mockData>('/api/users', postData)

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/users',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData),
          }
        )
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.value.data).toEqual(mockData)
        }
      })
    })

    describe('put', () => {
      it('PUTリクエストを正しく送信する', async () => {
        const mockData = { id: '1', name: 'Updated' }
        const putData = { name: 'Updated User' }
        const mockResponse = {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(mockData),
        }
        mockFetch.mockResolvedValue(mockResponse)

        const result = await client.put<typeof mockData>('/api/users/1', putData)

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/users/1',
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(putData),
          }
        )
        expect(result.success).toBe(true)
      })
    })

    describe('patch', () => {
      it('PATCHリクエストを正しく送信する', async () => {
        const mockData = { id: '1', name: 'Patched' }
        const patchData = { name: 'Patched User' }
        const mockResponse = {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(mockData),
        }
        mockFetch.mockResolvedValue(mockResponse)

        const result = await client.patch<typeof mockData>('/api/users/1', patchData)

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/users/1',
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patchData),
          }
        )
        expect(result.success).toBe(true)
      })
    })

    describe('delete', () => {
      it('DELETEリクエストを正しく送信する', async () => {
        const mockResponse = {
          ok: true,
          status: 204,
          headers: { get: () => null },
          text: () => Promise.resolve(''),
        }
        mockFetch.mockResolvedValue(mockResponse)

        const result = await client.delete('/api/users/1')

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/users/1',
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          }
        )
        expect(result.success).toBe(true)
      })
    })
  })
})

describe('createApiClient', () => {
  it('デフォルトベースURLでクライアントを作成する', () => {
    const client = createApiClient()
    expect(client['baseUrl']).toBe('http://localhost:8000')
  })

  it('カスタムベースURLでクライアントを作成する', () => {
    const client = createApiClient('https://api.example.com')
    expect(client['baseUrl']).toBe('https://api.example.com')
  })
})