import { useState, useEffect } from 'react';
import { PracticeSchedule, CreatePracticeScheduleRequest, UpdatePracticeScheduleRequest } from '../types';
import { mockPracticeScheduleService } from '../services/mock-practice-schedule-service';

export const usePracticeSchedules = () => {
  const [schedules, setSchedules] = useState<PracticeSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mockPracticeScheduleService.getPracticeSchedules();
      setSchedules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '練習予定の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const createSchedule = async (data: CreatePracticeScheduleRequest): Promise<PracticeSchedule> => {
    try {
      const newSchedule = await mockPracticeScheduleService.createPracticeSchedule(data);
      setSchedules(prev => [...prev, newSchedule]);
      return newSchedule;
    } catch (err) {
      setError(err instanceof Error ? err.message : '練習予定の作成に失敗しました');
      throw err;
    }
  };

  const updateSchedule = async (id: string, data: UpdatePracticeScheduleRequest): Promise<PracticeSchedule> => {
    try {
      const updatedSchedule = await mockPracticeScheduleService.updatePracticeSchedule(id, data);
      setSchedules(prev => prev.map(schedule => 
        schedule.id === id ? updatedSchedule : schedule
      ));
      return updatedSchedule;
    } catch (err) {
      setError(err instanceof Error ? err.message : '練習予定の更新に失敗しました');
      throw err;
    }
  };

  const deleteSchedule = async (id: string): Promise<void> => {
    try {
      await mockPracticeScheduleService.deletePracticeSchedule(id);
      setSchedules(prev => prev.filter(schedule => schedule.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '練習予定の削除に失敗しました');
      throw err;
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return {
    schedules,
    loading,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    refetch: fetchSchedules,
  };
};
