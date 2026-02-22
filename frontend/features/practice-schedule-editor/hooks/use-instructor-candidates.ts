/**
 * インストラクター候補を取得するフック
 */

import { useState, useCallback } from 'react';
import { sessionInstructorService, InstructorCandidate } from '../services/session-instructor-service';

interface UseInstructorCandidatesState {
  candidates: InstructorCandidate[];
  loading: boolean;
  error: string | null;
}

export const useInstructorCandidates = () => {
  const [state, setState] = useState<UseInstructorCandidatesState>({
    candidates: [],
    loading: false,
    error: null,
  });

  /**
   * インストラクター候補を取得
   */
  const fetchCandidates = useCallback(async (practiceScheduleId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const candidates = await sessionInstructorService.getInstructorCandidates(practiceScheduleId);

      setState(prev => ({
        ...prev,
        candidates,
        loading: false
      }));
    } catch (error: any) {
      console.error('useInstructorCandidates.fetchCandidates error:', {
        practiceScheduleId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error.constructor.name
      });
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'インストラクター候補の取得に失敗しました' 
      }));
    }
  }, []);

  /**
   * 候補データをクリア
   */
  const clearCandidates = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      candidates: [], 
      error: null 
    }));
  }, []);

  return {
    ...state,
    fetchCandidates,
    clearCandidates,
  };
};
