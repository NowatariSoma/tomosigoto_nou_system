'use client';

import { useEffect } from 'react';
import { Information } from '@/features/practice-slots/components/Information';
import { ScheduleTable } from '@/features/practice-slots/components/ScheduleTable';
import { DateButton } from '@/features/practice-slots/components/DateButton';

import { useDateNavigation } from '../hooks';

export const PracticeSlotsPage: React.FC = () => {

  // 日付ナビゲーション（実データの日付に合わせる）
  const {
    currentDate,
    handleDateChange,
    handlePracticeNavigation,
    getCurrentDateString
  } = useDateNavigation(new Date('2025-03-01'));

  // 日付変更時の副作用処理
  useEffect(() => {
    // 日付変更時に必要な処理があれば追加
  }, [getCurrentDateString]);

  return (
    <div className="space-y-6">

      {/* Date Navigation */}
      <DateButton
        currentDate={currentDate}
        onDateChange={handleDateChange}
        onNextPractice={handlePracticeNavigation}
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