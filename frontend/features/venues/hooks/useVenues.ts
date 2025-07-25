import { useState, useCallback, useEffect, useRef } from 'react'
import { venuesApi } from '../api/venuesApi'
import type {
  Venue,
  VenueAvailability,
  VenueQueryParams,
} from '@/types/venue'

interface UseVenuesOptions {
  initialPage?: number
  pageSize?: number
}

interface UseVenuesReturn {
  venues: Venue[]
  loading: boolean
  error: Error | null
  totalCount: number
  currentPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
  fetchVenues: (params?: VenueQueryParams) => Promise<void>
  fetchVenueById: (id: number) => Promise<Venue>
  fetchVenueAvailability: (id: number, month: Date) => Promise<VenueAvailability>
  setPage: (page: number) => void
}

export function useVenues(options: UseVenuesOptions = {}): UseVenuesReturn {
  const { initialPage = 1, pageSize = 20 } = options

  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPrevPage, setHasPrevPage] = useState(false)

  // メモリリーク防止のためのフラグ
  const isMountedRef = useRef(true)
  const currentRequestRef = useRef<string | null>(null)

  // クリーンアップ関数
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchVenues = useCallback(async (params: VenueQueryParams = {}) => {
    if (!isMountedRef.current) return

    // リクエストID生成（並行リクエスト管理用）
    const requestId = Date.now().toString()
    currentRequestRef.current = requestId

    setLoading(true)
    setError(null)

    try {
      const queryParams = {
        page: currentPage,
        pageSize,
        ...params,
      }

      const response = await venuesApi.fetchVenues(queryParams)
      
      // コンポーネントがマウントされており、これが最新のリクエストの場合のみ更新
      if (isMountedRef.current && currentRequestRef.current === requestId) {
        setVenues(response.venues)
        setTotalCount(response.totalCount)
        setCurrentPage(response.currentPage)
        setHasNextPage(response.hasNextPage)
        setHasPrevPage(response.hasPrevPage)
      }
    } catch (err) {
      if (isMountedRef.current && currentRequestRef.current === requestId) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
        setVenues([])
      }
    } finally {
      if (isMountedRef.current && currentRequestRef.current === requestId) {
        setLoading(false)
      }
    }
  }, [currentPage, pageSize])

  const fetchVenueById = useCallback(async (id: number): Promise<Venue> => {
    return await venuesApi.fetchVenueById(id)
  }, [])

  const fetchVenueAvailability = useCallback(
    async (id: number, month: Date): Promise<VenueAvailability> => {
      return await venuesApi.fetchVenueAvailability(id, month)
    },
    []
  )

  const setPage = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  return {
    venues,
    loading,
    error,
    totalCount,
    currentPage,
    hasNextPage,
    hasPrevPage,
    fetchVenues,
    fetchVenueById,
    fetchVenueAvailability,
    setPage,
  }
}