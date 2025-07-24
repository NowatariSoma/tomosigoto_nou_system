export interface Equipment {
  id: number;
  name: string;
  category: string;
  description?: string;
  count: number;
  available: boolean;
  iconName?: string;
}

export interface VenueAvailabilitySlot {
  date: Date;
  startTime: string;
  endTime: string;
  available: boolean;
  type: 'regular' | 'special' | 'unavailable';
  reservedBy?: string;
}

export interface VenueAvailability {
  venueId: number;
  month: Date;
  slots: VenueAvailabilitySlot[];
}

export interface VenueLocation {
  address: string;
  latitude?: number;
  longitude?: number;
  nearestStation?: string;
  access?: string[];
}

export interface VenuePhoto {
  id: number;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface Venue {
  id: number;
  name: string;
  description?: string;
  location: VenueLocation;
  capacity: number;
  pricePerHour?: number;
  equipment: Equipment[];
  photos: VenuePhoto[];
  contactPhone?: string;
  contactEmail?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface VenueFilters {
  searchTerm?: string;
  minCapacity?: number;
  maxCapacity?: number;
  equipmentIds?: number[];
  area?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  availableDate?: Date;
}

export interface VenueQueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'capacity' | 'price' | 'distance';
  sortOrder?: 'asc' | 'desc';
  filters?: VenueFilters;
}

export interface VenueListResponse {
  venues: Venue[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}