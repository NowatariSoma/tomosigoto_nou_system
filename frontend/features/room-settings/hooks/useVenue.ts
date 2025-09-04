import { useState, useCallback, useEffect } from 'react';
import { venueService } from '../services';
import { Venue, UpdateVenueRequest } from '../types';

interface UseVenueState {
  venue: Venue | null;
  loading: boolean;
  error: string | null;
}

export const useVenue = (id?: string) => {
  const [state, setState] = useState<UseVenueState>({
    venue: null,
    loading: false,
    error: null,
  });

  const fetchVenue = useCallback(async (venueId: string) => {
    setState({ venue: null, loading: true, error: null });
    try {
      const venue = await venueService.getVenue(venueId);
      setState({ venue, loading: false, error: null });
      return venue;
    } catch (error) {
      setState({
        venue: null,
        loading: false,
        error: error instanceof Error ? error.message : '会場の取得に失敗しました',
      });
      throw error;
    }
  }, []);

  const updateVenue = useCallback(async (data: UpdateVenueRequest) => {
    if (!state.venue) {
      throw new Error('会場が読み込まれていません');
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const updatedVenue = await venueService.updateVenue(state.venue.id, data);
      setState({ venue: updatedVenue, loading: false, error: null });
      return updatedVenue;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '会場の更新に失敗しました',
      }));
      throw error;
    }
  }, [state.venue]);

  const deleteVenue = useCallback(async () => {
    if (!state.venue) {
      throw new Error('会場が読み込まれていません');
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await venueService.deleteVenue(state.venue.id);
      setState({ venue: null, loading: false, error: null });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '会場の削除に失敗しました',
      }));
      throw error;
    }
  }, [state.venue]);

  const toggleStatus = useCallback(async () => {
    if (!state.venue) {
      throw new Error('会場が読み込まれていません');
    }

    return updateVenue({ isActive: !state.venue.isActive });
  }, [state.venue, updateVenue]);

  useEffect(() => {
    if (id) {
      fetchVenue(id);
    }
  }, [id, fetchVenue]);

  return {
    ...state,
    fetchVenue,
    updateVenue,
    deleteVenue,
    toggleStatus,
  };
};