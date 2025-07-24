import { useState, useCallback } from 'react'
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

  const fetchVenues = useCallback(async (params: VenueQueryParams = {}) => {
    setLoading(true)
    setError(null)

    try {
      const queryParams = {
        page: currentPage,
        pageSize,
        ...params,
      }

      const response = await venuesApi.fetchVenues(queryParams)
      
      setVenues(response.venues)
      setTotalCount(response.totalCount)
      setCurrentPage(response.currentPage)
      setHasNextPage(response.hasNextPage)
      setHasPrevPage(response.hasPrevPage)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setVenues([])
    } finally {
      setLoading(false)
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