import type {
  Venue,
  VenueAvailability,
  VenueListResponse,
  VenueQueryParams,
} from '@/types/venue'

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

  // ページネーション
  searchParams.set('page', String(params.page ?? 1))
  searchParams.set('pageSize', String(params.pageSize ?? 20))

  // ソート
  if (params.sortBy) {
    searchParams.set('sortBy', params.sortBy)
  }
  if (params.sortOrder) {
    searchParams.set('sortOrder', params.sortOrder)
  }

  // フィルタ
  if (params.filters) {
    const { filters } = params
    if (filters.searchTerm) {
      searchParams.set('searchTerm', filters.searchTerm)
    }
    if (filters.minCapacity !== undefined) {
      searchParams.set('minCapacity', String(filters.minCapacity))
    }
    if (filters.maxCapacity !== undefined) {
      searchParams.set('maxCapacity', String(filters.maxCapacity))
    }
    if (filters.equipmentIds && filters.equipmentIds.length > 0) {
      searchParams.set('equipmentIds', filters.equipmentIds.join(','))
    }
    if (filters.area) {
      searchParams.set('area', filters.area)
    }
    if (filters.priceRange?.min !== undefined) {
      searchParams.set('priceMin', String(filters.priceRange.min))
    }
    if (filters.priceRange?.max !== undefined) {
      searchParams.set('priceMax', String(filters.priceRange.max))
    }
    if (filters.availableDate) {
      searchParams.set('availableDate', filters.availableDate.toISOString().split('T')[0])
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