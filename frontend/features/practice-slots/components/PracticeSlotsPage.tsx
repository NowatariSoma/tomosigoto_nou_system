'use client';

import { useEffect } from 'react';
import { Information } from '@/features/practice-slots/components/Information';
import { ScheduleTable } from '@/features/practice-slots/components/ScheduleTable';
import { DateButton } from '@/features/practice-slots/components/DateButton';

import { useDateNavigation } from '../hooks';

export const PracticeSlotsPage: React.FC = () => {

  // 日付ナビゲーション（モックデータの日付に合わせる）
  const {
    currentDate,
    handleDateChange,
    getCurrentDateString
  } = useDateNavigation(new Date('2024-05-26'));

  // ページ全体のログ出力
  useEffect(() => {
    console.log('PracticeSlotsPage - 現在の日付:', getCurrentDateString());
    console.log('PracticeSlotsPage - モックデータを使用したスケジュール表を表示中');
  }, [getCurrentDateString]);

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