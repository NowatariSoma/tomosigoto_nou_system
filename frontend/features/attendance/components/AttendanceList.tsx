'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { Attendance, PracticeSchedule } from '../types';
import { AttendanceCard } from './AttendanceCard';
import { UI_TEXT } from '../constants';
import { Calendar } from 'lucide-react';

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
      <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
        <div className="bg-slate-50 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Calendar className="h-8 w-8 text-slate-400" />
        </div>
        <div className="text-slate-600 text-lg font-medium mb-2">
          {UI_TEXT.NO_ATTENDANCE_DATA}
        </div>
        <p className="text-slate-400 text-sm">
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
    
    const dateA = new Date(practiceA.schedule_date);
    const dateB = new Date(practiceB.schedule_date);
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
