import { useState, useCallback, useEffect } from 'react';
import { partAssignmentsService } from '../services/part-assignments-service';
import { 
  PartWithAssignments, 
  MemberAssignmentWithDetails 
} from '../types';

interface UsePartAssignmentsState {
  partAssignments: PartWithAssignments | null;
  loading: boolean;
  error: string | null;
}

export const usePartAssignments = () => {
  const [state, setState] = useState<UsePartAssignmentsState>({
    partAssignments: null,
    loading: false,
    error: null,
  });

  const fetchPartAssignments = useCallback(async (partId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const partAssignments = await partAssignmentsService.getPartWithAssignments(partId);
      setState({
        partAssignments,
        loading: false,
        error: null,
      });
      return partAssignments;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'パート所属の取得に失敗しました',
      }));
      throw error;
    }
  }, []);

  const clearPartAssignments = useCallback(() => {
    setState({
      partAssignments: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    fetchPartAssignments,
    clearPartAssignments,
  };
};
