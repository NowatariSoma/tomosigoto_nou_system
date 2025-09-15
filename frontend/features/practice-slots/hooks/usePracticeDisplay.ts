import { useState, useCallback } from 'react';
import { practiceDisplayService } from '../services/practice-display-service';
import { PracticeScheduleDisplay } from '../types/practice-display';

interface UsePracticeDisplayState {
  schedule: PracticeScheduleDisplay | null;
  loading: boolean;
  error: string | null;
}

export const usePracticeDisplay = () => {
  const [state, setState] = useState<UsePracticeDisplayState>({
    schedule: null,
    loading: false,
    error: null,
  });

  const fetchPracticeSchedule = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const schedule = await practiceDisplayService.getPracticeScheduleForDisplay(id);
      setState({
        schedule,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '練習スケジュールの取得に失敗しました',
      }));
    }
  }, []);

  const clearSchedule = useCallback(() => {
    setState({
      schedule: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    fetchPracticeSchedule,
    clearSchedule,
  };
};