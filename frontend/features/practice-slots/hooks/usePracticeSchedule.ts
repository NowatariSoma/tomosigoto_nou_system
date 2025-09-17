/**
 * 練習スケジュール管理のカスタムフック
 */

import { useState, useCallback } from 'react';
import { PracticeScheduleDisplayResponse } from '../types/schedule';
import { PracticeScheduleService } from '../services';

/**
 * 練習スケジュール管理フック
 */
export const usePracticeSchedule = () => {
  const [scheduleData, setScheduleData] = useState<PracticeScheduleDisplayResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 指定した練習スケジュールIDの詳細を取得
   * @param scheduleId - 練習スケジュールID
   */
  const fetchPracticeScheduleDetails = useCallback(async (scheduleId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await PracticeScheduleService.getPracticeScheduleDetails(scheduleId);
      setScheduleData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '練習スケジュールの取得に失敗しました';
      setError(errorMessage);
      setScheduleData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 指定した日付の練習スケジュールを取得
   * @param date - 対象日付 (YYYY-MM-DD形式)
   */
  const fetchPracticeScheduleByDate = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await PracticeScheduleService.getPracticeScheduleByDate(date);
      setScheduleData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '練習スケジュールの取得に失敗しました';
      setError(errorMessage);
      setScheduleData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * スケジュールデータをクリア
   */
  const clearScheduleData = useCallback(() => {
    setScheduleData(null);
    setError(null);
  }, []);

  return {
    scheduleData,
    loading,
    error,
    fetchPracticeScheduleDetails,
    fetchPracticeScheduleByDate,
    clearScheduleData,
  };
};
