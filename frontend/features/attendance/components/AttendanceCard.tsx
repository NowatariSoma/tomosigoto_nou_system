'use client';

import React from 'react';
import { Attendance, PracticeSchedule } from '../types';
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS } from '../constants';
import { Calendar, Clock, MapPin, Edit, Trash2, User, FileText } from 'lucide-react';

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
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            {practiceSchedule ? formatDate(practiceSchedule.schedule_date) : '練習予定'}
          </h3>
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={() => onEdit(attendance)}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="編集"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(attendance)}
              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="削除"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* 出席状況 */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">出席状況</span>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(attendance.status)}`}>
              {getStatusLabel(attendance.status)}
            </span>
          </div>
        </div>

        {/* 練習情報 */}
        {practiceSchedule && (
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">練習詳細</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-700">
                  {formatTime(practiceSchedule.start_time)} - {formatTime(practiceSchedule.end_time)}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-700">
                  練習会場（詳細は後日連絡）
                </span>
              </div>
            </div>
          </div>
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
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-slate-100 p-1.5 rounded-lg">
                <FileText className="h-4 w-4 text-slate-600" />
              </div>
              <h4 className="text-sm font-semibold text-slate-700">備考</h4>
            </div>
            <div className="bg-white p-3 rounded-md border border-slate-200">
              <p className="text-sm text-slate-700 leading-relaxed">
                {attendance.notes}
              </p>
            </div>
          </div>
        )}

        {/* 登録日時 */}
        <div className="text-xs text-slate-400 pt-3 border-t border-slate-200">
          登録日時: {formatDate(attendance.created_at)}
        </div>
      </div>
    </div>
  );
};
