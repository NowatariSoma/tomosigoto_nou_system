import { useState, useEffect, useCallback, useRef } from 'react'
import { ApiClient, ApiError } from './client'

// フェッチオプション型
export interface FetchOptions {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  staleTime?: number
  cacheTime?: number
  retry?: number
  retryDelay?: number
}

// ミューテーションオプション型
export interface MutationOptions {
  onSuccess?: (data: any) => void
  onError?: (error: ApiError) => void
  onSettled?: () => void
}

// 無限クエリオプション型
export interface InfiniteQueryOptions extends FetchOptions {
  pageSize?: number
}

// キャッシュ管理
class QueryCache {
  private cache = new Map<string, { data: any; timestamp: number; staleTime: number }>()

  set(key: string, data: any, staleTime: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      staleTime,
    })
  }

  get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.staleTime) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }
}

const queryCache = new QueryCache()

// APIクライアントのインスタンス（実際のプロジェクトでは外部から注入）
let apiClient: ApiClient

export function setApiClient(client: ApiClient): void {
  apiClient = client
}

// データ取得フック
export function useFetch<T>(
  path: string,
  params?: Record<string, any>,
  options: FetchOptions = {}
) {
  const {
    enabled = true,
    refetchOnWindowFocus = true,
    staleTime = 5 * 60 * 1000, // 5分
    retry = 3,
    retryDelay = 1000,
  } = options

  const [data, setData] = useState<T | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const abortControllerRef = useRef<AbortController | null>(null)
  const cacheKey = `${path}?${JSON.stringify(params || {})}`

  const fetchData = useCallback(async (shouldUseCache = true) => {
    if (!enabled || !apiClient) return

    // キャッシュから取得を試行
    if (shouldUseCache) {
      const cachedData = queryCache.get(cacheKey)
      if (cachedData) {
        setData(cachedData)
        return
      }
    }

    // 前のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoading(true)
    setError(null)

    try {
      const result = await apiClient.get<T>(path, params, {
        signal: abortControllerRef.current.signal
      })
      
      setData(result)
      queryCache.set(cacheKey, result, staleTime)
      setRetryCount(0)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err)
        
        // リトライロジック
        if (retryCount < retry && err.status !== 404 && err.status !== 401) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
            fetchData(false)
          }, retryDelay * Math.pow(2, retryCount))
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [path, params, enabled, cacheKey, staleTime, retry, retryDelay, retryCount])

  const refetch = useCallback(() => {
    return fetchData(false)
  }, [fetchData])

  // 初回データ取得と依存関係の変更時の再取得
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ウィンドウフォーカス時の再取得
  useEffect(() => {
    if (!refetchOnWindowFocus) return

    const handleFocus = () => {
      fetchData()
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchData, refetchOnWindowFocus])

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    data,
    isLoading,
    error,
    refetch,
  }
}

// データ変更フック
export function useMutation<T>(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  options: MutationOptions = {}
) {
  const { onSuccess, onError, onSettled } = options
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const mutate = useCallback(async (data?: any): Promise<T> => {
    if (!apiClient) {
      throw new ApiError('APIクライアントが設定されていません', 500)
    }

    setIsLoading(true)
    setError(null)

    try {
      let result: T

      switch (method) {
        case 'POST':
          result = await apiClient.post<T>(path, data)
          break
        case 'PUT':
          result = await apiClient.put<T>(path, data)
          break
        case 'DELETE':
          result = await apiClient.delete<T>(path)
          break
        default:
          throw new ApiError(`サポートされていないメソッド: ${method}`, 400)
      }

      onSuccess?.(result)
      return result
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err)
        onError?.(err)
        throw err
      }
      throw err
    } finally {
      setIsLoading(false)
      onSettled?.()
    }
  }, [path, method, onSuccess, onError, onSettled])

  const reset = useCallback(() => {
    setError(null)
  }, [])

  return {
    mutate,
    isLoading,
    error,
    reset,
  }
}

// 無限スクロール用フック
export function useInfiniteQuery<T>(
  path: string,
  getNextPageParam: (lastPage: any, allPages: any[]) => any,
  options: InfiniteQueryOptions = {}
) {
  const {
    enabled = true,
    pageSize = 20,
    staleTime = 5 * 60 * 1000,
  } = options

  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [hasNextPage, setHasNextPage] = useState(true)
  const [pages, setPages] = useState<any[]>([])

  const fetchNextPage = useCallback(async () => {
    if (!enabled || !apiClient || isLoading || !hasNextPage) return

    setIsLoading(true)
    setError(null)

    try {
      const nextPageParam = getNextPageParam(pages[pages.length - 1], pages)
      if (nextPageParam === undefined || nextPageParam === null) {
        setHasNextPage(false)
        return
      }

      const params = {
        page: nextPageParam,
        limit: pageSize,
      }

      const result = await apiClient.get(path, params)
      
      setPages(prev => [...prev, result])
      setData(prev => [...prev, ...result.data])
      
      // 次のページがあるかチェック
      if (!result.data || result.data.length < pageSize) {
        setHasNextPage(false)
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [path, enabled, isLoading, hasNextPage, pages, getNextPageParam, pageSize])

  // 初回データ取得
  useEffect(() => {
    if (enabled && pages.length === 0) {
      fetchNextPage()
    }
  }, [enabled, pages.length, fetchNextPage])

  return {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
  }
}

// キャッシュクリア関数
export function clearQueryCache(keyPattern?: string): void {
  if (keyPattern) {
    // 特定のパターンにマッチするキーのみクリア（簡易版）
    queryCache.clear() // 実装簡略化のため全てクリア
  } else {
    queryCache.clear()
  }
}