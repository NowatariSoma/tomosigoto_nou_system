/**
 * 日付ナビゲーション機能のカスタムフック
 */

import { useState, useCallback } from 'react';
import { DateDirection, DateChangeHandler } from '../types/modal-state';
import { scheduleDataMapper } from '../mappers/schedule-data-mapper';
import { practiceScheduleService } from '../services/practice-schedule-service';

/**
 * 日付ナビゲーション機能を管理するカスタムフック
 * @param initialDate - 初期日付（省略時は現在日付）
 * @returns 現在日付と日付操作メソッド
 */
export const useDateNavigation = (initialDate?: Date) => {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());

  /**
   * 日付を指定方向に移動する
   * @param direction - 移動方向（'prev' または 'next'）
   */
  const navigateDate = useCallback((direction: DateDirection) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(prevDate.getDate() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  }, []);

  /**
   * 日付変更ハンドラー（DateButtonコンポーネント用）
   */
  const handleDateChange: DateChangeHandler = useCallback((direction: DateDirection) => {
    navigateDate(direction);
  }, [navigateDate]);

  /**
   * 日付を直接設定する
   * @param date - 設定する日付
   */
  const setDate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  /**
   * 現在日付をYYYY-MM-DD形式の文字列として取得する
   * @returns YYYY-MM-DD形式の日付文字列
   */
  const getCurrentDateString = useCallback((): string => {
    return scheduleDataMapper.formatDateToString(currentDate);
  }, [currentDate]);

  /**
   * 指定日数分日付を移動する
   * @param days - 移動する日数（負の値で過去方向）
   */
  const addDays = useCallback((days: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(prevDate.getDate() + days);
      return newDate;
    });
  }, []);

  /**
   * 今日の日付に戻す
   */
  const resetToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  /**
   * 次の練習日程に移動する
   */
  const navigateToNextPractice = useCallback(async () => {
    try {
      const currentDateString = scheduleDataMapper.formatDateToString(currentDate);
      const nextPracticeDate = await practiceScheduleService.getNextPracticeScheduleDate(currentDateString);
      
      if (nextPracticeDate) {
        const nextDate = new Date(nextPracticeDate);
        setCurrentDate(nextDate);
      } else {
        console.warn('次の練習日程が見つかりませんでした');
      }
    } catch (error) {
      console.error('次の練習日程の取得に失敗しました:', error);
    }
  }, [currentDate]);

  /**
   * 前の練習日程に移動する
   */
  const navigateToPreviousPractice = useCallback(async () => {
    try {
      const currentDateString = scheduleDataMapper.formatDateToString(currentDate);
      const previousPracticeDate = await practiceScheduleService.getPreviousPracticeScheduleDate(currentDateString);
      
      if (previousPracticeDate) {
        const prevDate = new Date(previousPracticeDate);
        setCurrentDate(prevDate);
      } else {
        console.warn('前の練習日程が見つかりませんでした');
      }
    } catch (error) {
      console.error('前の練習日程の取得に失敗しました:', error);
    }
  }, [currentDate]);

  /**
   * 日付変更ハンドラー（練習日移動用）
   */
  const handlePracticeNavigation = useCallback(async (direction: DateDirection) => {
    if (direction === 'next') {
      await navigateToNextPractice();
    } else if (direction === 'prev') {
      await navigateToPreviousPractice();
    } else {
      navigateDate(direction);
    }
  }, [navigateToNextPractice, navigateToPreviousPractice, navigateDate]);

  return {
    currentDate,
    navigateDate,
    handleDateChange,
    handlePracticeNavigation,
    setDate,
    getCurrentDateString,
    addDays,
    resetToToday,
    navigateToNextPractice,
    navigateToPreviousPractice,
  };
};
