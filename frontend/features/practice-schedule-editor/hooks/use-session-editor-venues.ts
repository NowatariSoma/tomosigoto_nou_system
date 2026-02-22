/**
 * セッション編集 - 会場操作サブフック
 */

import { useState, useCallback } from 'react';
import {
  VenueInfo,
  SessionEditorState,
  SessionEditorAction,
} from '../types/session-editor';
import type { PendingVenueChange, PendingVenueAdd, PendingVenueRemove } from './session-editor-reducer';

export interface UseSessionEditorVenuesReturn {
  addVenues: (venues: VenueInfo[]) => void;
  removeVenue: (venueId: string) => void;
  updateVenue: (venueId: string, venue: VenueInfo) => void;
  pendingVenueChanges: PendingVenueChange[];
  resetPendingVenueChanges: () => void;
}

export function useSessionEditorVenues(
  state: SessionEditorState,
  dispatch: React.Dispatch<SessionEditorAction>,
  scheduleId: string,
): UseSessionEditorVenuesReturn {
  const [pendingVenueChanges, setPendingVenueChanges] = useState<PendingVenueChange[]>([]);

  /**
   * 会場を追加（ローカルのみ）
   */
  const addVenues = useCallback((venues: VenueInfo[]) => {
    if (!scheduleId || scheduleId.trim() === '') {
      return;
    }

    const newVenues: VenueInfo[] = venues.map(venue => {
      const tempId = `temp_venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: tempId,
        venue_id: venue.id,
        name: venue.name,
        campus: venue.campus,
        is_preferred: venue.is_preferred || false,
        priority: venue.priority || 0,
        notes: venue.notes || '',
      };
    });

    dispatch({ type: 'ADD_VENUES', payload: newVenues });

    setPendingVenueChanges(prev => [
      ...prev,
      ...newVenues.map(venue => ({
        type: 'add' as const,
        venue,
        tempId: venue.id,
      })),
    ]);
  }, [scheduleId, dispatch]);

  /**
   * 会場を削除（ローカルのみ）
   */
  const removeVenue = useCallback((venueId: string) => {
    const venueToRemove = state.venues.find(v => v.id === venueId);
    if (!venueToRemove) {
      return;
    }

    dispatch({ type: 'REMOVE_VENUE', payload: venueId });

    if (venueId.startsWith('temp_venue_')) {
      setPendingVenueChanges(prev => prev.filter(
        change => !(change.type === 'add' && change.tempId === venueId)
      ));
    } else {
      setPendingVenueChanges(prev => [
        ...prev,
        { type: 'remove' as const, venueId },
      ]);
    }
  }, [state.venues, dispatch]);

  /**
   * 会場を更新
   */
  const updateVenue = useCallback((_venueId: string, venue: VenueInfo) => {
    dispatch({ type: 'UPDATE_VENUE', payload: venue });
  }, [dispatch]);

  const resetPendingVenueChanges = useCallback(() => {
    setPendingVenueChanges([]);
  }, []);

  return {
    addVenues,
    removeVenue,
    updateVenue,
    pendingVenueChanges,
    resetPendingVenueChanges,
  };
}
