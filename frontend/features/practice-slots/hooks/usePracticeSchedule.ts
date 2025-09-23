/**
 * 練習スケジュール管理のカスタムフック
 */

import { useState, useCallback } from 'react';
import { PracticeScheduleDisplayResponse, PracticeScheduleWithDetailsResponse, IdealScheduleData } from '../types/schedule';
import { practiceScheduleService } from '../services';

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
      const data = await practiceScheduleService.getPracticeScheduleDetails(scheduleId);
      // TODO: 詳細データの状態管理を実装
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
      const data = await practiceScheduleService.getPracticeScheduleByDate(date);
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
  const [detailsData, setDetailsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 指定したスケジュールIDの詳細を取得
   * @param scheduleId - 練習スケジュールID
   */
  const fetchPracticeScheduleDetails = useCallback(async (scheduleId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await practiceScheduleService.getPracticeScheduleDetails(scheduleId);
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
    fetchPracticeScheduleDetails,
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
      const data = await practiceScheduleService.getPracticeScheduleIdealFormat(date);
      
      // データの検証
      if (data && typeof data === 'object') {
        // エラーレスポンスのチェック
        if (data.error) {
          console.warn('理想形式スケジュール取得でエラー:', data.error, data.debug_info);
          setError(data.error);
          setIdealData(null);
          return;
        }

        // venuesが存在し、配列であることを確認
        if (!data.venues || !Array.isArray(data.venues)) {
          console.warn('理想形式スケジュールのvenuesが無効です:', data);
          // デバッグ情報があれば表示
          if (data.debug_info) {
            console.log('デバッグ情報:', data.debug_info);
          }
          setIdealData({
            ...data,
            venues: []
          });
        } else {
          setIdealData(data);
        }
      } else {
        setIdealData(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '理想形式スケジュールの取得に失敗しました';
      console.error('理想形式スケジュール取得エラー:', err);
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
