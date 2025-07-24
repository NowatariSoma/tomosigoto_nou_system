import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { venuesApi } from '../venuesApi'
import type { VenueQueryParams, VenueFilters } from '@/types/venue'

// Mock fetch
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('venuesApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchVenues', () => {
    test('デフォルトパラメータで会場一覧を取得できる', async () => {
      const mockResponse = {
        venues: [
          {
            id: 1,
            name: '体育館A',
            location: { address: '東京都渋谷区' },
            capacity: 100,
            equipment: [],
            photos: [],
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-01'),
            isActive: true,
          },
        ],
        totalCount: 1,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await venuesApi.fetchVenues()

      expect(mockFetch).toHaveBeenCalledWith('/api/venues?page=1&pageSize=20')
      expect(result).toEqual(mockResponse)
    })

    test('カスタムクエリパラメータで会場一覧を取得できる', async () => {
      const queryParams: VenueQueryParams = {
        page: 2,
        pageSize: 10,
        sortBy: 'capacity',
        sortOrder: 'desc',
        filters: {
          searchTerm: '体育館',
          minCapacity: 50,
        },
      }

      const mockResponse = {
        venues: [],
        totalCount: 0,
        currentPage: 2,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: true,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await venuesApi.fetchVenues(queryParams)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/venues?page=2&pageSize=10&sortBy=capacity&sortOrder=desc&searchTerm=%E4%BD%93%E8%82%B2%E9%A4%A8&minCapacity=50'
      )
      expect(result).toEqual(mockResponse)
    })

    test('APIエラーが発生した場合エラーをスローする', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)

      await expect(venuesApi.fetchVenues()).rejects.toThrow(
        'Failed to fetch venues: 500 Internal Server Error'
      )
    })
  })

  describe('fetchVenueById', () => {
    test('指定IDの会場詳細を取得できる', async () => {
      const mockVenue = {
        id: 1,
        name: '体育館A',
        description: 'メイン体育館',
        location: {
          address: '東京都渋谷区1-1-1',
          latitude: 35.6762,
          longitude: 139.6503,
          nearestStation: '渋谷駅',
          access: ['JR山手線 渋谷駅より徒歩5分'],
        },
        capacity: 100,
        pricePerHour: 5000,
        equipment: [
          {
            id: 1,
            name: 'バスケットボール',
            category: 'スポーツ用品',
            count: 10,
            available: true,
          },
        ],
        photos: [
          {
            id: 1,
            url: '/images/venue1.jpg',
            alt: '体育館Aの写真',
            isPrimary: true,
          },
        ],
        contactPhone: '03-1234-5678',
        contactEmail: 'venue@example.com',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        isActive: true,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVenue,
      } as Response)

      const result = await venuesApi.fetchVenueById(1)

      expect(mockFetch).toHaveBeenCalledWith('/api/venues/1')
      expect(result).toEqual(mockVenue)
    })

    test('存在しないIDでエラーをスローする', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response)

      await expect(venuesApi.fetchVenueById(999)).rejects.toThrow(
        'Failed to fetch venue: 404 Not Found'
      )
    })
  })

  describe('fetchVenueAvailability', () => {
    test('指定した会場と月の利用可能時間を取得できる', async () => {
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
          {
            date: new Date('2023-05-01'),
            startTime: '13:00',
            endTime: '17:00',
            available: false,
            type: 'regular' as const,
            reservedBy: '山田チーム',
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAvailability,
      } as Response)

      const result = await venuesApi.fetchVenueAvailability(1, new Date('2023-05-01'))

      expect(mockFetch).toHaveBeenCalledWith('/api/venues/1/availability?month=2023-05')
      expect(result).toEqual(mockAvailability)
    })

    test('APIエラーが発生した場合エラーをスローする', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)

      await expect(
        venuesApi.fetchVenueAvailability(1, new Date('2023-05-01'))
      ).rejects.toThrow('Failed to fetch venue availability: 500 Internal Server Error')
    })
  })
})