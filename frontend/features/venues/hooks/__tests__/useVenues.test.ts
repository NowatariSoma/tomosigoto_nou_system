import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useVenues } from '../useVenues'
import { venuesApi } from '../../api/venuesApi'

// Mock venuesApi
jest.mock('../../api/venuesApi')
const mockVenuesApi = venuesApi as jest.Mocked<typeof venuesApi>

const mockVenue = {
  id: 1,
  name: '体育館A',
  location: { address: '東京都渋谷区' },
  capacity: 100,
  equipment: [],
  photos: [],
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  isActive: true,
}

const mockVenueListResponse = {
  venues: [mockVenue],
  totalCount: 1,
  currentPage: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
}

describe('useVenues', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('初期状態が正しく設定される', () => {
    mockVenuesApi.fetchVenues.mockResolvedValue(mockVenueListResponse)

    const { result } = renderHook(() => useVenues())

    expect(result.current.venues).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.totalCount).toBe(0)
    expect(result.current.currentPage).toBe(1)
    expect(result.current.hasNextPage).toBe(false)
    expect(result.current.hasPrevPage).toBe(false)
  })

  test('fetchVenuesを呼び出すと会場一覧を取得する', async () => {
    mockVenuesApi.fetchVenues.mockResolvedValue(mockVenueListResponse)

    const { result } = renderHook(() => useVenues())

    act(() => {
      result.current.fetchVenues()
    })

    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe(null)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.venues).toEqual([mockVenue])
    expect(result.current.totalCount).toBe(1)
    expect(result.current.currentPage).toBe(1)
    expect(result.current.hasNextPage).toBe(false)
    expect(result.current.hasPrevPage).toBe(false)
    expect(mockVenuesApi.fetchVenues).toHaveBeenCalledWith({})
  })

  test('パラメータ付きでfetchVenuesを呼び出す', async () => {
    mockVenuesApi.fetchVenues.mockResolvedValue(mockVenueListResponse)

    const { result } = renderHook(() => useVenues())

    const params = {
      page: 2,
      pageSize: 10,
      sortBy: 'capacity' as const,
      filters: { searchTerm: '体育館' },
    }

    act(() => {
      result.current.fetchVenues(params)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockVenuesApi.fetchVenues).toHaveBeenCalledWith(params)
  })

  test('fetchVenuesでエラーが発生した場合エラー状態を設定する', async () => {
    const error = new Error('API Error')
    mockVenuesApi.fetchVenues.mockRejectedValue(error)

    const { result } = renderHook(() => useVenues())

    act(() => {
      result.current.fetchVenues()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe(error)
    expect(result.current.venues).toEqual([])
  })

  test('fetchVenueByIdを呼び出すと指定IDの会場詳細を取得する', async () => {
    const mockVenueDetail = {
      ...mockVenue,
      description: '詳細な説明',
      location: {
        address: '東京都渋谷区1-1-1',
        latitude: 35.6762,
        longitude: 139.6503,
      },
    }
    mockVenuesApi.fetchVenueById.mockResolvedValue(mockVenueDetail)

    const { result } = renderHook(() => useVenues())

    let venueDetail
    await act(async () => {
      venueDetail = await result.current.fetchVenueById(1)
    })

    expect(venueDetail).toEqual(mockVenueDetail)
    expect(mockVenuesApi.fetchVenueById).toHaveBeenCalledWith(1)
  })

  test('fetchVenueAvailabilityを呼び出すと利用可能時間を取得する', async () => {
    const mockAvailability = {
      venueId: 1,
      month: new Date('2023-05-01'),
      slots: [
        {
          date: new Date('2023-05-01'),
          startTime: '09:00',
          endTime: '12:00',
          available: true,
          type: 'regular' as const,
        },
      ],
    }
    mockVenuesApi.fetchVenueAvailability.mockResolvedValue(mockAvailability)

    const { result } = renderHook(() => useVenues())

    let availability
    await act(async () => {
      availability = await result.current.fetchVenueAvailability(1, new Date('2023-05-01'))
    })

    expect(availability).toEqual(mockAvailability)
    expect(mockVenuesApi.fetchVenueAvailability).toHaveBeenCalledWith(1, new Date('2023-05-01'))
  })

  test('setPageを呼び出すとページを変更する', () => {
    const { result } = renderHook(() => useVenues())

    act(() => {
      result.current.setPage(3)
    })

    expect(result.current.currentPage).toBe(3)
  })

  test('初期オプションが正しく適用される', () => {
    const { result } = renderHook(() =>
      useVenues({ initialPage: 2, pageSize: 10 })
    )

    expect(result.current.currentPage).toBe(2)
  })
})