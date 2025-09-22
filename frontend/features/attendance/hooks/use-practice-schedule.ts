import { useState, useEffect } from 'react';
import { PracticeSchedule } from '../types';
import { practiceScheduleService } from '../services';

export const usePracticeSchedule = (practiceId?: string) => {
  const [practiceSchedule, setPracticeSchedule] = useState<PracticeSchedule | null>(null);
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

  useEffect(() => {
    if (practiceId) {
      fetchPracticeSchedule(practiceId);
    }
  }, [practiceId]);

  return {
    practiceSchedule,
    loading,
    error,
    refetch: practiceId ? () => fetchPracticeSchedule(practiceId) : undefined,
  };
};
