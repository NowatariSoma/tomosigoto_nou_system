/**
 * 練習スケジュール管理のカスタムフック
 */

import { useState, useCallback } from 'react';
import { PracticeScheduleDisplayResponse, PracticeScheduleWithDetailsResponse, IdealScheduleData } from '../types/schedule';
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
      // 詳細データは別のstateで管理するため、ここでは基本データのみ取得
      console.log('詳細データ取得:', scheduleId);
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

/**
 * 練習スケジュール詳細管理フック
 */
export const usePracticeScheduleDetails = () => {
  const [detailsData, setDetailsData] = useState<PracticeScheduleWithDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 指定した日付の練習スケジュール詳細を取得
   * @param date - 対象日付 (YYYY-MM-DD形式)
   */
  const fetchPracticeScheduleDetailsByDate = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await PracticeScheduleService.getPracticeScheduleDetailsByDate(date);
      setDetailsData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '練習スケジュール詳細の取得に失敗しました';
      setError(errorMessage);
      setDetailsData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 詳細データをクリア
   */
  const clearDetailsData = useCallback(() => {
    setDetailsData(null);
    setError(null);
  }, []);

  return {
    detailsData,
    loading,
    error,
    fetchPracticeScheduleDetailsByDate,
    clearDetailsData,
  };
};

/**
 * 理想的な形式のスケジュール管理フック
 */
export const useIdealSchedule = () => {
  const [idealData, setIdealData] = useState<IdealScheduleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 指定した日付の理想的な形式のスケジュールを取得
   * @param date - 対象日付 (YYYY-MM-DD形式)
   */
  const fetchIdealScheduleByDate = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await PracticeScheduleService.getPracticeScheduleIdealFormat(date);
      setIdealData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '理想形式スケジュールの取得に失敗しました';
      setError(errorMessage);
      setIdealData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 理想データをクリア
   */
  const clearIdealData = useCallback(() => {
    setIdealData(null);
    setError(null);
  }, []);

  return {
    idealData,
    loading,
    error,
    fetchIdealScheduleByDate,
    clearIdealData,
  };
};
