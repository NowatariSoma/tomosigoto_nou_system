import { useState, useEffect } from 'react';
import { PracticeSchedule } from '../types';
import { practiceScheduleService } from '../services';

export const usePracticeSchedule = (practiceId?: string) => {
  const [practiceSchedule, setPracticeSchedule] = useState<PracticeSchedule | null>(null);
  const [practiceSchedules, setPracticeSchedules] = useState<PracticeSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPracticeSchedule = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await practiceScheduleService.getPracticeSchedule(id);
      setPracticeSchedule(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '練習予定の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchPracticeSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await practiceScheduleService.getPracticeSchedules();
      setPracticeSchedules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '練習予定一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (practiceId) {
      fetchPracticeSchedule(practiceId);
    } else {
      fetchPracticeSchedules();
    }
  }, [practiceId]);

  return {
    practiceSchedule,
    practiceSchedules,
    loading,
    error,
    refetch: practiceId ? () => fetchPracticeSchedule(practiceId) : fetchPracticeSchedules,
  };
};
