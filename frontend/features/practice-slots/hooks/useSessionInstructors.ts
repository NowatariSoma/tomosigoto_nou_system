/**
 * セッション指導者データを管理するカスタムフック
 */

import { useState, useCallback } from 'react';
import { SessionInstructorWithDetails } from '../types/schedule';
import { sessionInstructorService } from '../services';

interface UseSessionInstructorsState {
  instructors: SessionInstructorWithDetails[];
  loading: boolean;
  error: string | null;
}

interface UseSessionInstructorsReturn extends UseSessionInstructorsState {
  fetchInstructorsBySchedule: (scheduleId: string) => Promise<void>;
  fetchInstructorsByScheduleAndSlot: (scheduleId: string, slotOrder: number) => Promise<void>;
  fetchInstructorsForSlot: (scheduleId: string, slotOrder: number) => Promise<void>;
  clearInstructors: () => void;
  refreshInstructors: () => Promise<void>;
}

/**
 * セッション指導者データを管理するフック
 * @returns セッション指導者の状態と操作関数
 */
export const useSessionInstructors = (): UseSessionInstructorsReturn => {
  const [state, setState] = useState<UseSessionInstructorsState>({
    instructors: [],
    loading: false,
    error: null,
  });

  // 最後に実行したフェッチ関数を記録（リフレッシュ用）
  const [lastFetchFunction, setLastFetchFunction] = useState<(() => Promise<void>) | null>(null);

  /**
   * 指定したスケジュールの指導者一覧を取得
   */
  const fetchInstructorsBySchedule = useCallback(async (scheduleId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const instructors = await sessionInstructorService.getSessionInstructorsBySchedule(scheduleId);
      setState(prev => ({ 
        ...prev, 
        instructors: instructors as SessionInstructorWithDetails[], 
        loading: false 
      }));
      
      // リフレッシュ用に関数を保存
      setLastFetchFunction(() => () => fetchInstructorsBySchedule(scheduleId));
    } catch (error: any) {
      console.error('指導者一覧の取得に失敗しました:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.message || '指導者一覧の取得に失敗しました', 
        loading: false 
      }));
    }
  }, []);

  /**
   * 指定したスケジュールとコマの指導者一覧を取得
   */
  const fetchInstructorsByScheduleAndSlot = useCallback(async (scheduleId: string, slotOrder: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const instructors = await sessionInstructorService.getSessionInstructorsByScheduleAndSlot(scheduleId, slotOrder);
      setState(prev => ({ 
        ...prev, 
        instructors: instructors as SessionInstructorWithDetails[], 
        loading: false 
      }));
      
      // リフレッシュ用に関数を保存
      setLastFetchFunction(() => () => fetchInstructorsByScheduleAndSlot(scheduleId, slotOrder));
    } catch (error: any) {
      console.error('指導者一覧の取得に失敗しました:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.message || '指導者一覧の取得に失敗しました', 
        loading: false 
      }));
    }
  }, []);

  /**
   * 指定したスケジュールとコマの指導者詳細情報を取得（表示用）
   */
  const fetchInstructorsForSlot = useCallback(async (scheduleId: string, slotOrder: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const instructors = await sessionInstructorService.getInstructorsForSlot(scheduleId, slotOrder);
      setState(prev => ({ 
        ...prev, 
        instructors, 
        loading: false 
      }));
      
      // リフレッシュ用に関数を保存
      setLastFetchFunction(() => () => fetchInstructorsForSlot(scheduleId, slotOrder));
    } catch (error: any) {
      console.error('指導者詳細情報の取得に失敗しました:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.message || '指導者詳細情報の取得に失敗しました', 
        loading: false 
      }));
    }
  }, []);

  /**
   * 指導者データをクリア
   */
  const clearInstructors = useCallback(() => {
    setState({
      instructors: [],
      loading: false,
      error: null,
    });
    setLastFetchFunction(null);
  }, []);

  /**
   * 最後に実行したフェッチ関数を再実行してデータをリフレッシュ
   */
  const refreshInstructors = useCallback(async () => {
    if (lastFetchFunction) {
      await lastFetchFunction();
    }
  }, [lastFetchFunction]);

  return {
    ...state,
    fetchInstructorsBySchedule,
    fetchInstructorsByScheduleAndSlot,
    fetchInstructorsForSlot,
    clearInstructors,
    refreshInstructors,
  };
};

/**
 * 特定のスケジュールとコマの指導者情報を取得する簡易フック
 * @param scheduleId - 練習スケジュールID
 * @param slotOrder - コマ順序
 * @returns 指導者情報と状態
 */
export const useSlotInstructors = (scheduleId?: string, slotOrder?: number) => {
  const {
    instructors,
    loading,
    error,
    fetchInstructorsForSlot,
    clearInstructors,
  } = useSessionInstructors();

  // scheduleIdとslotOrderが変更されたときに自動でデータを取得
  const fetchData = useCallback(async () => {
    if (scheduleId && slotOrder !== undefined) {
      await fetchInstructorsForSlot(scheduleId, slotOrder);
    } else {
      clearInstructors();
    }
  }, [scheduleId, slotOrder, fetchInstructorsForSlot, clearInstructors]);

  return {
    instructors,
    loading,
    error,
    fetchData,
    clearInstructors,
  };
};
