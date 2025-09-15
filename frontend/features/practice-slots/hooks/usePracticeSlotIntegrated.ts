import { useState, useCallback } from 'react';
import { practiceDisplayService } from '../services';
import { PracticeScheduleDisplay } from '../types';
import { PracticeSlot, ScheduleItem } from '../types/schedule';
import { convertDisplayScheduleToScheduleItems } from '../mappers/practice-display-mapper';

interface UsePracticeSlotIntegratedState {
  practiceSlot: PracticeSlot | null;
  scheduleData: ScheduleItem[];
  displaySchedule: PracticeScheduleDisplay | null;
  practiceSchedules: any[];
  loading: boolean;
  error: string | null;
}

export const usePracticeSlotIntegrated = () => {
  const [state, setState] = useState<UsePracticeSlotIntegratedState>({
    practiceSlot: null,
    scheduleData: [],
    displaySchedule: null,
    practiceSchedules: [],
    loading: false,
    error: null,
  });

  // 新しいAPIから練習スケジュール一覧を取得
  const fetchPracticeSchedules = useCallback(async () => {
    try {
      const schedules = await practiceDisplayService.getPracticeSchedules();
      setState(prev => ({ ...prev, practiceSchedules: schedules }));
      return schedules;
    } catch (err) {
      console.error('Error fetching practice schedules:', err);
      return [];
    }
  }, []);

  // 新しいAPIから練習表表示データを取得
  const fetchDisplaySchedule = useCallback(async (scheduleId: string) => {
    try {
      const schedule = await practiceDisplayService.getPracticeScheduleForDisplay(scheduleId);

      // 新しいAPIデータを既存のScheduleItem形式に変換
      const convertedData = convertDisplayScheduleToScheduleItems(schedule);

      setState(prev => ({
        ...prev,
        displaySchedule: schedule,
        scheduleData: convertedData
      }));

      return schedule;
    } catch (err) {
      console.error('Error fetching display schedule:', err);
      return null;
    }
  }, []);

  // 日付に基づいて練習表を取得
  const fetchPracticeSlotByDate = useCallback(async (dateString: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const schedules = await fetchPracticeSchedules();
      const matchingSchedule = schedules.find(s => s.schedule_date === dateString);

      if (matchingSchedule) {
        await fetchDisplaySchedule(matchingSchedule.id);
        setState(prev => ({
          ...prev,
          practiceSlot: {
            id: matchingSchedule.id,
            date: dateString,
            title: matchingSchedule.description || `${dateString}の練習表`,
            description: matchingSchedule.description || '練習表',
            is_active: true
          },
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          scheduleData: [],
          practiceSlot: {
            id: 'no-schedule',
            date: dateString,
            title: `${dateString}の練習表`,
            description: 'スケジュールなし',
            is_active: false
          },
          loading: false
        }));
      }
    } catch (err) {
      console.error('Error fetching practice slot:', err);
      setState(prev => ({
        ...prev,
        scheduleData: [],
        practiceSlot: null,
        loading: false,
        error: err instanceof Error ? err.message : '練習スケジュールの取得に失敗しました'
      }));
    }
  }, [fetchPracticeSchedules, fetchDisplaySchedule]);

  const clearData = useCallback(() => {
    setState({
      practiceSlot: null,
      scheduleData: [],
      displaySchedule: null,
      practiceSchedules: [],
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    fetchPracticeSlotByDate,
    clearData,
  };
};