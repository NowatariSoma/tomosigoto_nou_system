import { useState, useCallback, useEffect } from 'react';
import { Room } from '../../room-settings/types';
import { roomService } from '../../room-settings/services';

interface UseVenuesState {
  venues: Room[];
  loading: boolean;
  error: string | null;
}

export const useVenues = () => {
  const [state, setState] = useState<UseVenuesState>({
    venues: [],
    loading: false,
    error: null,
  });

  const fetchVenues = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const venues = await roomService.getRooms();
      setState({
        venues,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '会場データの取得に失敗しました',
      }));
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  return {
    ...state,
    refetch: fetchVenues,
  };
};
