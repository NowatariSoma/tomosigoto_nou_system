import { useState, useCallback, useEffect } from 'react';
import { venueService } from '../services';
import {
  Venue,
  VenueListResponse,
  VenueFilters,
  CreateVenueRequest,
  UpdateVenueRequest,
} from '../types';

interface UseVenuesState {
  venues: Venue[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
}

export const useVenues = (initialFilters?: VenueFilters) => {
  const [state, setState] = useState<UseVenuesState>({
    venues: [],
    loading: false,
    error: null,
    total: 0,
    page: 1,
    pageSize: 10,
  });

  const [filters, setFilters] = useState<VenueFilters>(initialFilters || {});

  const fetchVenues = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await venueService.getVenues(filters);
      setState({
        venues: response.venues,
        loading: false,
        error: null,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '会場の取得に失敗しました',
      }));
    }
  }, [filters]);

  const createVenue = useCallback(async (data: CreateVenueRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const newVenue = await venueService.createVenue(data);
      await fetchVenues();
      return newVenue;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '会場の作成に失敗しました',
      }));
      throw error;
    }
  }, [fetchVenues]);

  const updateVenue = useCallback(async (id: string, data: UpdateVenueRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const updatedVenue = await venueService.updateVenue(id, data);
      setState((prev) => ({
        ...prev,
        venues: prev.venues.map((v) => (v.id === id ? updatedVenue : v)),
        loading: false,
        error: null,
      }));
      return updatedVenue;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '会場の更新に失敗しました',
      }));
      throw error;
    }
  }, []);

  const deleteVenue = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await venueService.deleteVenue(id);
      setState((prev) => ({
        ...prev,
        venues: prev.venues.filter((v) => v.id !== id),
        total: prev.total - 1,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '会場の削除に失敗しました',
      }));
      throw error;
    }
  }, []);

  const toggleVenueStatus = useCallback(async (id: string, isActive: boolean) => {
    return updateVenue(id, { isActive });
  }, [updateVenue]);

  const updateFilters = useCallback((newFilters: Partial<VenueFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  return {
    ...state,
    filters,
    fetchVenues,
    createVenue,
    updateVenue,
    deleteVenue,
    toggleVenueStatus,
    updateFilters,
    resetFilters,
  };
};