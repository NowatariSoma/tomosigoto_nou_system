'use client';

import { useEffect } from 'react';
import { Information } from '@/features/practice-slots/components/Information';
import { ScheduleTable } from '@/features/practice-slots/components/ScheduleTable';
import { DateButton } from '@/features/practice-slots/components/DateButton';

import { useDateNavigation, usePracticeSchedule } from '../hooks';

export const PracticeSlotsPage: React.FC = () => {

  // 日付ナビゲーション
  const {
    currentDate,
    handleDateChange,
    getCurrentDateString
  } = useDateNavigation(new Date('2024-05-26'));
  
  // 練習スケジュール管理
  const { scheduleData, loading, error, fetchPracticeScheduleByDate } = usePracticeSchedule();

  // 日付が変更されたときにAPI呼び出しを実行
  useEffect(() => {
    const dateString = currentDate.toISOString().split('T')[0];
    console.log('PracticeSlotsPage - 日付変更:', dateString);
    fetchPracticeScheduleByDate(dateString);
  }, [currentDate, fetchPracticeScheduleByDate]);

  // ページ全体のログ出力
  useEffect(() => {
    console.log('PracticeSlotsPage - 現在の日付:', getCurrentDateString());
    console.log('PracticeSlotsPage - スケジュールデータ:', scheduleData);
    console.log('PracticeSlotsPage - ローディング状態:', loading);
    console.log('PracticeSlotsPage - エラー状態:', error);
  }, [getCurrentDateString, scheduleData, loading, error]);

  return (
    <div className="space-y-6">

      {/* Date Navigation */}
      <DateButton
        currentDate={currentDate}
        onDateChange={handleDateChange}
      />
      
      {/* Schedule Table */}
      <ScheduleTable
        currentDate={currentDate}
      />

      {/* Information */}
      <Information currentDate={currentDate} />
    </div>
  );
};