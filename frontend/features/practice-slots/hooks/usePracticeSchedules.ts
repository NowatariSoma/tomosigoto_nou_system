import { useState, useCallback, useEffect } from 'react';
import { practiceDisplayService } from '../services/practice-display-service';
import { PracticeScheduleSummary } from '../types/practice-display';

interface UsePracticeSchedulesState {
  schedules: PracticeScheduleSummary[];
  loading: boolean;
  error: string | null;
}

export const usePracticeSchedules = () => {
  const [state, setState] = useState<UsePracticeSchedulesState>({
    schedules: [],
    loading: false,
    error: null,
  });

  const fetchPracticeSchedules = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const schedules = await practiceDisplayService.getPracticeSchedules();
      setState({
        schedules,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '練習スケジュール一覧の取得に失敗しました',
      }));
    }
  }, []);

  useEffect(() => {
    fetchPracticeSchedules();
  }, [fetchPracticeSchedules]);

  return {
    ...state,
    fetchPracticeSchedules,
  };
};