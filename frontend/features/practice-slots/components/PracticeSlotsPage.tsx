'use client';

import { useEffect } from 'react';
import { Information } from './Information';
import { ScheduleTable } from './ScheduleTable';
import { DateButton } from './DateButton';

import { useDateNavigation } from '../hooks';

export const PracticeSlotsPage: React.FC = () => {

  // 日付ナビゲーション（実データの日付に合わせる）
  const {
    currentDate,
    handleDateChange,
    getCurrentDateString
  } = useDateNavigation(new Date('2025-02-15'));

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