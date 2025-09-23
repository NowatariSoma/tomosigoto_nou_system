'use client';

import React from 'react';
import { Attendance, PracticeSchedule } from '../types';
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS } from '../constants';
import { Calendar, Clock, MapPin, Edit, Trash2, User } from 'lucide-react';

interface AttendanceCardProps {
  attendance: Attendance;
  practiceSchedule?: PracticeSchedule;
  onEdit?: (attendance: Attendance) => void;
  onDelete?: (attendance: Attendance) => void;
  showUserInfo?: boolean;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({
  attendance,
  practiceSchedule,
  onEdit,
  onDelete,
  showUserInfo = false,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getStatusColor = (status: string) => {
    return ATTENDANCE_STATUS_COLORS[status as keyof typeof ATTENDANCE_STATUS_COLORS] || 'text-gray-600 bg-gray-50';
  };

  const getStatusLabel = (status: string) => {
    return ATTENDANCE_STATUS_LABELS[status as keyof typeof ATTENDANCE_STATUS_LABELS] || status;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {practiceSchedule ? formatDate(practiceSchedule.date) : '練習予定'}
          </h3>
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={() => onEdit(attendance)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="編集"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(attendance)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="削除"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* 出席状況 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">出席状況:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(attendance.status)}`}>
            {getStatusLabel(attendance.status)}
          </span>
        </div>

        {/* 練習情報 */}
        {practiceSchedule && (
          <>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                {formatTime(practiceSchedule.start_time)} - {formatTime(practiceSchedule.end_time)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                {practiceSchedule.venue_name} ({practiceSchedule.campus}キャンパス)
              </span>
            </div>
          </>
        )}

        {/* ユーザー情報 */}
        {showUserInfo && (
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">
              ユーザーID: {attendance.user_id}
            </span>
          </div>
        )}

        {/* 備考 */}
        {attendance.notes && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              <span className="font-medium">備考:</span> {attendance.notes}
            </p>
          </div>
        )}

        {/* 登録日時 */}
        <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
          登録日時: {formatDate(attendance.created_at)}
        </div>
      </div>
    </div>
  );
};
