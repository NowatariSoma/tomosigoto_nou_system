'use client';

import React from 'react';
import { Attendance, PracticeSchedule } from '../types';
import { AttendanceCard } from './AttendanceCard';
import { UI_TEXT } from '../constants';

interface AttendanceListProps {
  attendances: Attendance[];
  practiceSchedules: PracticeSchedule[];
  onEdit?: (attendance: Attendance) => void;
  onDelete?: (attendance: Attendance) => void;
  showUserInfo?: boolean;
}

export const AttendanceList: React.FC<AttendanceListProps> = ({
  attendances,
  practiceSchedules,
  onEdit,
  onDelete,
  showUserInfo = false,
}) => {
  if (attendances.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">
          {UI_TEXT.NO_ATTENDANCE_DATA}
        </div>
        <p className="text-gray-400 text-sm">
          出席登録を行って表示します
        </p>
      </div>
    );
  }

  // 日付順でソート（新しい日付が上）
  const sortedAttendances = [...attendances].sort((a, b) => {
    const practiceA = practiceSchedules.find(p => p.id === a.practice_schedule_id);
    const practiceB = practiceSchedules.find(p => p.id === b.practice_schedule_id);
    
    if (!practiceA || !practiceB) return 0;
    
    const dateA = new Date(practiceA.date);
    const dateB = new Date(practiceB.date);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-4">
      {sortedAttendances.map((attendance) => {
        const practiceSchedule = practiceSchedules.find(p => p.id === attendance.practice_schedule_id);
        return (
          <AttendanceCard
            key={attendance.id}
            attendance={attendance}
            practiceSchedule={practiceSchedule}
            onEdit={onEdit}
            onDelete={onDelete}
            showUserInfo={showUserInfo}
          />
        );
      })}
    </div>
  );
};
