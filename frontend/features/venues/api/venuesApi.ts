import { z } from 'zod'
import type {
  Venue,
  VenueAvailability,
  VenueListResponse,
  VenueQueryParams,
} from '@/types/venue'

// 入力検証スキーマ
const SearchTermSchema = z.string().max(100).regex(/^[a-zA-Z0-9\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]*$/).optional()
const CapacitySchema = z.number().min(0).max(10000).optional()
const PriceSchema = z.number().min(0).max(1000000).optional()
const EquipmentIdsSchema = z.array(z.number().positive()).optional()
const AreaSchema = z.string().max(50).regex(/^[a-zA-Z0-9\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]*$/).optional()

const VenueFiltersSchema = z.object({
  searchTerm: SearchTermSchema,
  minCapacity: CapacitySchema,
  maxCapacity: CapacitySchema,
  equipmentIds: EquipmentIdsSchema,
  area: AreaSchema,
  priceRange: z.object({
    min: PriceSchema,
    max: PriceSchema,
  }).optional(),
  availableDate: z.date().optional(),
})

class VenuesApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message)
    this.name = 'VenuesApiError'
  }
}

function buildQueryString(params: VenueQueryParams): string {
  const searchParams = new URLSearchParams()

  // ページネーション（基本的な検証）
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20))
  searchParams.set('page', String(page))
  searchParams.set('pageSize', String(pageSize))

  // ソート
  if (params.sortBy && ['name', 'capacity', 'price', 'distance'].includes(params.sortBy)) {
    searchParams.set('sortBy', params.sortBy)
  }
  if (params.sortOrder && ['asc', 'desc'].includes(params.sortOrder)) {
    searchParams.set('sortOrder', params.sortOrder)
  }

  // フィルタ（Zodによる検証）
  if (params.filters) {
    try {
      const validatedFilters = VenueFiltersSchema.parse(params.filters)
      
      if (validatedFilters.searchTerm) {
        searchParams.set('searchTerm', validatedFilters.searchTerm.trim())
      }
      if (validatedFilters.minCapacity !== undefined) {
        searchParams.set('minCapacity', String(validatedFilters.minCapacity))
      }
      if (validatedFilters.maxCapacity !== undefined) {
        searchParams.set('maxCapacity', String(validatedFilters.maxCapacity))
      }
      if (validatedFilters.equipmentIds && validatedFilters.equipmentIds.length > 0) {
        searchParams.set('equipmentIds', validatedFilters.equipmentIds.join(','))
      }
      if (validatedFilters.area) {
        searchParams.set('area', validatedFilters.area.trim())
      }
      if (validatedFilters.priceRange?.min !== undefined) {
        searchParams.set('priceMin', String(validatedFilters.priceRange.min))
      }
      if (validatedFilters.priceRange?.max !== undefined) {
        searchParams.set('priceMax', String(validatedFilters.priceRange.max))
      }
      if (validatedFilters.availableDate) {
        searchParams.set('availableDate', validatedFilters.availableDate.toISOString().split('T')[0])
      }
    } catch (error) {
      // 検証に失敗した場合は、フィルタを無視してログ出力
      if (process.env.NODE_ENV === 'development') {
        console.warn('Invalid filters provided:', error)
      }
    }
  }

  return searchParams.toString()
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new VenuesApiError(
      `Request failed: ${response.status} ${response.statusText}`,
      response.status,
      response.statusText
    )
  }
  return response.json()
}

export const venuesApi = {
  async fetchVenues(params: VenueQueryParams = {}): Promise<VenueListResponse> {
    try {
      const queryString = buildQueryString(params)
      const response = await fetch(`/api/venues?${queryString}`)
      return await handleResponse<VenueListResponse>(response)
    } catch (error) {
      if (error instanceof VenuesApiError) {
        throw new Error(`Failed to fetch venues: ${error.status} ${error.statusText}`)
      }
      throw error
    }
  },

  async fetchVenueById(id: number): Promise<Venue> {
    try {
      const response = await fetch(`/api/venues/${id}`)
      return await handleResponse<Venue>(response)
    } catch (error) {
      if (error instanceof VenuesApiError) {
        throw new Error(`Failed to fetch venue: ${error.status} ${error.statusText}`)
      }
      throw error
    }
  },

  async fetchVenueAvailability(id: number, month: Date): Promise<VenueAvailability> {
    try {
      const monthString = month.toISOString().slice(0, 7) // YYYY-MM format
      const response = await fetch(`/api/venues/${id}/availability?month=${monthString}`)
      return await handleResponse<VenueAvailability>(response)
    } catch (error) {
      if (error instanceof VenuesApiError) {
        throw new Error(`Failed to fetch venue availability: ${error.status} ${error.statusText}`)
      }
      throw error
    }
  },
}