'use client';

import React from 'react';
import { Attendance, PracticeSchedule } from '../../types/attendance';
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS } from '../../constants/attendance';
import { Calendar, Clock, MapPin, Edit, Trash2, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';

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
    return ATTENDANCE_STATUS_COLORS[status as keyof typeof ATTENDANCE_STATUS_COLORS] || 'text-black bg-gray-50';
  };

  const getStatusLabel = (status: string) => {
    return ATTENDANCE_STATUS_LABELS[status as keyof typeof ATTENDANCE_STATUS_LABELS] || status;
  };

  return (
    <div className="card-blue-hover p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-200 p-2 rounded-lg">
            <Calendar className="h-5 w-5 text-black" />
          </div>
          <h3 className="text-lg font-semibold text-black">
            {practiceSchedule ? formatDate(practiceSchedule.schedule_date) : '練習予定'}
          </h3>
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(attendance)}
              className="p-2 hover-subtle rounded-lg"
              title="編集"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(attendance)}
              className="p-2 hover-subtle rounded-lg"
              title="削除"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* 出席状況 */}
        <div className="card-blue p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-black">出席状況</span>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(attendance.status)}`}>
              {getStatusLabel(attendance.status)}
            </span>
          </div>
          {/* 参加可能時間表示 */}
          {attendance.status === 'late' && (attendance.available_from || attendance.available_to) && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-black">
                  参加可能時間: <span className="font-semibold text-yellow-700">
                    {attendance.available_from || '開始'} - {attendance.available_to || '終了'}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 練習情報 */}
        {practiceSchedule && (
          <div className="card-blue p-4">
            <h4 className="text-sm font-semibold text-black mb-3">練習詳細</h4>
            <div className="space-y-2">
              {/* タイトル */}
              {practiceSchedule.title && (
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-black" />
                  <span className="text-sm font-medium text-black">
                    {practiceSchedule.title}
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-black" />
                <span className="text-sm text-black">
                  {formatTime(practiceSchedule.start_time)} - {formatTime(practiceSchedule.end_time)}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-black" />
                <span className="text-sm text-black">
                  練習会場（詳細は後日連絡）
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ユーザー情報 */}
        {showUserInfo && (
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-black" />
            <span className="text-sm text-black">
              ユーザーID: {attendance.user_id}
            </span>
          </div>
        )}

        {/* 備考 */}
        {attendance.notes && (
          <div className="card-blue p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-blue-100 p-1.5 rounded-lg">
                <FileText className="h-4 w-4 text-black" />
              </div>
              <h4 className="text-sm font-semibold text-black">備考</h4>
            </div>
            <div className="panel-info p-3">
              <p className="text-sm text-black leading-relaxed">
                {attendance.notes}
              </p>
            </div>
          </div>
        )}

        {/* 登録日時 */}
        <div className="text-xs text-black pt-3 border-t border-blue-200">
          登録日時: {formatDate(attendance.created_at)}
        </div>
      </div>
    </div>
  );
};
