'use client';

import React from 'react';
import { PracticeSchedule } from '../types';
import { PracticeScheduleCard } from './PracticeScheduleCard';
import { UI_TEXT } from '../constants';

interface PracticeScheduleListProps {
  schedules: PracticeSchedule[];
  onEdit?: (schedule: PracticeSchedule) => void;
  onDelete?: (schedule: PracticeSchedule) => void;
}

export const PracticeScheduleList: React.FC<PracticeScheduleListProps> = ({
  schedules,
  onEdit,
  onDelete,
}) => {
  if (schedules.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">
          {UI_TEXT.NO_SCHEDULE_DATA}
        </div>
        <p className="text-gray-400 text-sm">
          練習予定を作成して表示します
        </p>
      </div>
    );
  }

  // 日付順でソート（新しい日付が上）
  const sortedSchedules = [...schedules].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-4">
      {sortedSchedules.map((schedule) => (
        <PracticeScheduleCard
          key={schedule.id}
          schedule={schedule}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
