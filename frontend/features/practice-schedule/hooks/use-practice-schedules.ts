import { useState, useCallback, useEffect } from 'react';
import { PracticeSchedule, CreatePracticeScheduleRequest, UpdatePracticeScheduleRequest } from '../types';
import { practiceScheduleService } from '../services';

interface UsePracticeSchedulesState {
  schedules: PracticeSchedule[];
  loading: boolean;
  error: string | null;
}

export const usePracticeSchedules = () => {
  const [state, setState] = useState<UsePracticeSchedulesState>({
    schedules: [],
    loading: false,
    error: null,
  });

  const fetchSchedules = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const schedules = await practiceScheduleService.getPracticeSchedules();
      setState({
        schedules,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '練習予定の取得に失敗しました',
      }));
    }
  }, []);

  const getPracticeSchedule = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const schedule = await practiceScheduleService.getPracticeSchedule(id);
      return schedule;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '練習予定の取得に失敗しました',
      }));
      throw error;
    }
  }, []);

  const createSchedule = useCallback(async (data: CreatePracticeScheduleRequest): Promise<PracticeSchedule> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const newSchedule = await practiceScheduleService.createPracticeSchedule(data);
      await fetchSchedules(); // リストを再取得
      return newSchedule;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '練習予定の作成に失敗しました',
      }));
      throw error;
    }
  }, [fetchSchedules]);

  const updateSchedule = useCallback(async (id: string, data: UpdatePracticeScheduleRequest): Promise<PracticeSchedule> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const updatedSchedule = await practiceScheduleService.updatePracticeSchedule(id, data);
      setState((prev) => ({
        ...prev,
        schedules: prev.schedules.map((s) => (s.id === id ? updatedSchedule : s)),
        loading: false,
        error: null,
      }));
      return updatedSchedule;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '練習予定の更新に失敗しました',
      }));
      throw error;
    }
  }, []);

  const deleteSchedule = useCallback(async (id: string): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await practiceScheduleService.deletePracticeSchedule(id);
      setState((prev) => ({
        ...prev,
        schedules: prev.schedules.filter((s) => s.id !== id),
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '練習予定の削除に失敗しました',
      }));
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    ...state,
    fetchSchedules,
    getPracticeSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  };
};
