// API応答の共通型
export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: number
}

// APIエラー型
export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

// リクエストオプション型
export interface RequestOptions {
  headers?: Record<string, string>
  timeout?: number
  cache?: RequestCache
  signal?: AbortSignal
}

// リクエスト設定型
export interface RequestConfig extends RequestInit {
  url: string
  timeout?: number
}

// APIクライアントオプション型
export interface ApiClientOptions {
  timeout?: number
  headers?: Record<string, string>
}

// APIクライアントクラス
export class ApiClient {
  private baseUrl: string
  private defaultTimeout: number
  private defaultHeaders: Record<string, string>
  private authToken: string | null = null

  constructor(baseUrl: string, options: ApiClientOptions = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // 末尾のスラッシュを削除
    this.defaultTimeout = options.timeout || 30000 // 30秒
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
  }

  // 認証トークンの設定
  setAuthToken(token: string | null): void {
    this.authToken = token
  }

  // 認証ヘッダーの取得
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}
    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`
    }
    return headers
  }

  // GETリクエスト
  async get<T>(path: string, params?: Record<string, any>, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, params)
    return this.request<T>({
      url,
      method: 'GET',
      ...options,
    })
  }

  // POSTリクエスト
  async post<T>(path: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path)
    return this.request<T>({
      url,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
  }

  // PUTリクエスト
  async put<T>(path: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path)
    return this.request<T>({
      url,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
  }

  // DELETEリクエスト
  async delete<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path)
    return this.request<T>({
      url,
      method: 'DELETE',
      ...options,
    })
  }

  // 汎用リクエストメソッド
  async request<T>(config: RequestConfig): Promise<T> {
    const { url, timeout = this.defaultTimeout, ...fetchOptions } = config

    // ヘッダーのマージ
    const headers = {
      ...this.defaultHeaders,
      ...this.getAuthHeaders(),
      ...fetchOptions.headers,
    }

    // AbortControllerでタイムアウト制御
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: fetchOptions.signal || controller.signal,
      })

      clearTimeout(timeoutId)
      return await this.handleResponse<T>(response)
    } catch (error) {
      clearTimeout(timeoutId)
      throw this.handleError(error)
    }
  }

  // レスポンス処理
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type')
    let data: any

    // レスポンスの内容タイプに応じて処理
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (!response.ok) {
      throw new ApiError(
        data?.message || `HTTP Error: ${response.status}`,
        response.status,
        data?.code
      )
    }

    // APIレスポンス形式の場合はdataプロパティを返す
    if (data && typeof data === 'object' && 'data' in data) {
      return data.data
    }

    return data
  }

  // エラー処理
  private handleError(error: any): never {
    if (error.name === 'AbortError') {
      throw new ApiError('リクエストがタイムアウトしました', 408)
    }

    if (error instanceof ApiError) {
      throw error
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('ネットワークエラーが発生しました', 0)
    }

    throw new ApiError(
      error.message || '予期しないエラーが発生しました',
      500
    )
  }

  // URL構築
  private buildUrl(path: string, params?: Record<string, any>): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    let url = `${this.baseUrl}${cleanPath}`

    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }

    return url
  }
}

// シングルトンインスタンス
const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
)

export { apiClient as api }
export default apiClient