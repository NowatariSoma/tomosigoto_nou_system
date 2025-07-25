import { renderHook, act, waitFor } from '@testing-library/react'
import { useFetch, useMutation, useInfiniteQuery, setApiClient, clearQueryCache } from '../hooks'
import { ApiClient, ApiError } from '../client'

// APIクライアントのモック
const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  setAuthToken: jest.fn(),
} as jest.Mocked<ApiClient>

// フォーカスイベントのモック
const mockAddEventListener = jest.fn()
const mockRemoveEventListener = jest.fn()

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
})

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
})

describe('API Hooks', () => {
  beforeEach(() => {
    setApiClient(mockApiClient)
    clearQueryCache()
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('useFetch', () => {
    it('データ取得成功時: 正しいデータが返されるべき', async () => {
      const mockData = { id: 1, name: 'テストデータ' }
      mockApiClient.get.mockResolvedValueOnce(mockData)

      const { result } = renderHook(() => 
        useFetch('/api/test')
      )

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeNull()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData)
      expect(result.current.error).toBeNull()
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/test', undefined, expect.any(Object))
    })

    it('データ取得失敗時: エラーが設定されるべき', async () => {
      const mockError = new ApiError('テストエラー', 500)
      mockApiClient.get.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => 
        useFetch('/api/test')
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toEqual(mockError)
    })

    it('リトライ機能: 500エラーの場合リトライされるべき', async () => {
      const mockError = new ApiError('サーバーエラー', 500)
      mockApiClient.get
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({ data: 'success' })

      const { result } = renderHook(() => 
        useFetch('/api/test', undefined, { retry: 2, retryDelay: 100 })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // 最初のリクエストでエラー
      expect(mockApiClient.get).toHaveBeenCalledTimes(1)

      // リトライが実行される
      act(() => {
        jest.advanceTimersByTime(100)
      })

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(2)
      })

      // 2回目のリトライが実行される
      act(() => {
        jest.advanceTimersByTime(200) // 指数バックオフ
      })

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(3)
        expect(result.current.data).toEqual({ data: 'success' })
      })
    })

    it('404エラーの場合: リトライされないべき', async () => {
      const mockError = new ApiError('Not Found', 404)
      mockApiClient.get.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => 
        useFetch('/api/test', undefined, { retry: 3 })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockApiClient.get).toHaveBeenCalledTimes(1)
      expect(result.current.error).toEqual(mockError)
    })

    it('enabled=false: データ取得が実行されないべき', () => {
      const { result } = renderHook(() => 
        useFetch('/api/test', undefined, { enabled: false })
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(mockApiClient.get).not.toHaveBeenCalled()
    })

    it('キャッシュ機能: 同じキーで2回目のリクエストはキャッシュから返されるべき', async () => {
      const mockData = { id: 1, name: 'キャッシュデータ' }
      mockApiClient.get.mockResolvedValueOnce(mockData)

      // 1回目のリクエスト
      const { result: result1 } = renderHook(() => 
        useFetch('/api/test')
      )

      await waitFor(() => {
        expect(result1.current.data).toEqual(mockData)
      })

      // 2回目のリクエスト（同じパス）
      const { result: result2 } = renderHook(() => 
        useFetch('/api/test')
      )

      expect(result2.current.data).toEqual(mockData)
      expect(mockApiClient.get).toHaveBeenCalledTimes(1) // キャッシュから取得されるため1回のみ
    })

    it('refetch機能: 手動でデータを再取得できるべき', async () => {
      const mockData1 = { id: 1, name: 'データ1' }
      const mockData2 = { id: 2, name: 'データ2' }
      
      mockApiClient.get
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2)

      const { result } = renderHook(() => 
        useFetch('/api/test')
      )

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData1)
      })

      act(() => {
        result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData2)
      })

      expect(mockApiClient.get).toHaveBeenCalledTimes(2)
    })

    it('ウィンドウフォーカス時の再取得: フォーカス時にデータが再取得されるべき', async () => {
      const mockData = { id: 1, name: 'フォーカスデータ' }
      mockApiClient.get.mockResolvedValue(mockData)

      renderHook(() => 
        useFetch('/api/test', undefined, { refetchOnWindowFocus: true })
      )

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1)
      })

      // フォーカスイベントをシミュレート
      const focusHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'focus'
      )?.[1]

      if (focusHandler) {
        act(() => {
          focusHandler()
        })
      }

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('useMutation', () => {
    it('POST成功時: 正しいデータが返されるべき', async () => {
      const mockData = { id: 1, message: 'created' }
      mockApiClient.post.mockResolvedValueOnce(mockData)

      const { result } = renderHook(() => 
        useMutation('/api/test', 'POST')
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()

      const inputData = { name: 'テスト' }
      let mutationResult: any

      await act(async () => {
        mutationResult = await result.current.mutate(inputData)
      })

      expect(mutationResult).toEqual(mockData)
      expect(result.current.isLoading).toBe(false)
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/test', inputData)
    })

    it('PUT成功時: 正しいメソッドが呼ばれるべき', async () => {
      const mockData = { id: 1, message: 'updated' }
      mockApiClient.put.mockResolvedValueOnce(mockData)

      const { result } = renderHook(() => 
        useMutation('/api/test/1', 'PUT')
      )

      const inputData = { name: '更新されたテスト' }

      await act(async () => {
        await result.current.mutate(inputData)
      })

      expect(mockApiClient.put).toHaveBeenCalledWith('/api/test/1', inputData)
    })

    it('DELETE成功時: 正しいメソッドが呼ばれるべき', async () => {
      const mockData = { message: 'deleted' }
      mockApiClient.delete.mockResolvedValueOnce(mockData)

      const { result } = renderHook(() => 
        useMutation('/api/test/1', 'DELETE')
      )

      await act(async () => {
        await result.current.mutate()
      })

      expect(mockApiClient.delete).toHaveBeenCalledWith('/api/test/1')
    })

    it('エラー時: エラーが設定され、例外がスローされるべき', async () => {
      const mockError = new ApiError('作成エラー', 400)
      mockApiClient.post.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => 
        useMutation('/api/test', 'POST')
      )

      let thrownError: any

      await act(async () => {
        try {
          await result.current.mutate({ name: 'テスト' })
        } catch (error) {
          thrownError = error
        }
      })

      expect(thrownError).toEqual(mockError)
      expect(result.current.error).toEqual(mockError)
      expect(result.current.isLoading).toBe(false)
    })

    it('コールバック機能: onSuccess, onError, onSettledが呼ばれるべき', async () => {
      const mockData = { id: 1, message: 'success' }
      const onSuccess = jest.fn()
      const onError = jest.fn()
      const onSettled = jest.fn()

      mockApiClient.post.mockResolvedValueOnce(mockData)

      const { result } = renderHook(() => 
        useMutation('/api/test', 'POST', { onSuccess, onError, onSettled })
      )

      await act(async () => {
        await result.current.mutate({ name: 'テスト' })
      })

      expect(onSuccess).toHaveBeenCalledWith(mockData)
      expect(onError).not.toHaveBeenCalled()
      expect(onSettled).toHaveBeenCalled()
    })

    it('reset機能: エラーをクリアできるべき', async () => {
      const mockError = new ApiError('テストエラー', 400)
      mockApiClient.post.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => 
        useMutation('/api/test', 'POST')
      )

      await act(async () => {
        try {
          await result.current.mutate({ name: 'テスト' })
        } catch (error) {
          // エラーを無視
        }
      })

      expect(result.current.error).toEqual(mockError)

      act(() => {
        result.current.reset()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('useInfiniteQuery', () => {
    it('初回ページ取得成功時: データが正しく設定されるべき', async () => {
      const mockData = {
        data: [{ id: 1, name: 'アイテム1' }, { id: 2, name: 'アイテム2' }],
        hasNextPage: true,
      }
      
      mockApiClient.get.mockResolvedValueOnce(mockData)

      const getNextPageParam = (lastPage: any) => lastPage.hasNextPage ? 2 : undefined

      const { result } = renderHook(() => 
        useInfiniteQuery('/api/items', getNextPageParam)
      )

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData.data)
      expect(result.current.hasNextPage).toBe(true)
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/items', {
        page: undefined,
        limit: 20,
      })
    })

    it('次のページ取得: 追加データが正しく結合されるべき', async () => {
      const mockPage1 = {
        data: [{ id: 1, name: 'アイテム1' }],
        hasNextPage: true,
      }
      const mockPage2 = {
        data: [{ id: 2, name: 'アイテム2' }],
        hasNextPage: false,
      }

      mockApiClient.get
        .mockResolvedValueOnce(mockPage1)
        .mockResolvedValueOnce(mockPage2)

      const getNextPageParam = (lastPage: any) => lastPage.hasNextPage ? 2 : undefined

      const { result } = renderHook(() => 
        useInfiniteQuery('/api/items', getNextPageParam)
      )

      await waitFor(() => {
        expect(result.current.data).toEqual(mockPage1.data)
      })

      await act(async () => {
        await result.current.fetchNextPage()
      })

      expect(result.current.data).toEqual([
        ...mockPage1.data,
        ...mockPage2.data,
      ])
      expect(result.current.hasNextPage).toBe(false)
    })

    it('最後のページ: hasNextPageがfalseになるべき', async () => {
      const mockData = {
        data: [{ id: 1, name: 'アイテム1' }],
        hasNextPage: false,
      }
      
      mockApiClient.get.mockResolvedValueOnce({
        ...mockData,
        data: [{ id: 1, name: 'アイテム1' }], // pageSize未満のデータ
      })

      const getNextPageParam = (lastPage: any) => lastPage.hasNextPage ? 2 : undefined

      const { result } = renderHook(() => 
        useInfiniteQuery('/api/items', getNextPageParam, { pageSize: 20 })
      )

      await waitFor(() => {
        expect(result.current.hasNextPage).toBe(false)
      })
    })

    it('エラー時: エラーが設定されるべき', async () => {
      const mockError = new ApiError('データ取得エラー', 500)
      mockApiClient.get.mockRejectedValueOnce(mockError)

      const getNextPageParam = (lastPage: any) => lastPage.hasNextPage ? 2 : undefined

      const { result } = renderHook(() => 
        useInfiniteQuery('/api/items', getNextPageParam)
      )

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError)
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('clearQueryCache', () => {
    it('キャッシュがクリアされるべき', async () => {
      const mockData = { id: 1, name: 'キャッシュテスト' }
      mockApiClient.get.mockResolvedValue(mockData)

      // キャッシュにデータを保存
      const { result } = renderHook(() => 
        useFetch('/api/cache-test')
      )

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData)
      })

      // キャッシュをクリア
      clearQueryCache()

      // 新しいリクエストでAPIが再度呼ばれることを確認
      const { result: result2 } = renderHook(() => 
        useFetch('/api/cache-test')
      )

      await waitFor(() => {
        expect(result2.current.data).toEqual(mockData)
      }, { timeout: 1000 })

      expect(mockApiClient.get).toHaveBeenCalledTimes(2)
    })
  })
})