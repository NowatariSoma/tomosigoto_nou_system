'use client';

import React from 'react';
import { PracticeScheduleDisplay } from '../types/practice-display';
import {
  SCHEDULE_TYPE_LABELS,
  SCHEDULE_STATUS_LABELS,
  SCHEDULE_TYPE,
  SCHEDULE_STATUS,
} from '../constants/practice-display';

interface PracticeScheduleCardProps {
  schedule: PracticeScheduleDisplay;
}

export const PracticeScheduleCard: React.FC<PracticeScheduleCardProps> = ({
  schedule,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // HH:MM format
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case SCHEDULE_STATUS.ACTIVE:
        return 'bg-green-100 text-green-800';
      case SCHEDULE_STATUS.CANCELLED:
        return 'bg-red-100 text-red-800';
      case SCHEDULE_STATUS.COMPLETED:
        return 'bg-gray-100 text-gray-800';
      case SCHEDULE_STATUS.DRAFT:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeBadgeColor = (type?: string) => {
    switch (type) {
      case SCHEDULE_TYPE.REGULAR:
        return 'bg-blue-100 text-blue-800';
      case SCHEDULE_TYPE.SPECIAL:
        return 'bg-purple-100 text-purple-800';
      case SCHEDULE_TYPE.DRESS_REHEARSAL:
        return 'bg-orange-100 text-orange-800';
      case SCHEDULE_TYPE.PERFORMANCE:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {schedule.description || `練習スケジュール ${schedule.id.slice(0, 8)}`}
          </h1>
          <div className="flex items-center space-x-2 mb-2">
            {schedule.schedule_type && (
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${getTypeBadgeColor(
                  schedule.schedule_type
                )}`}
              >
                {SCHEDULE_TYPE_LABELS[schedule.schedule_type as keyof typeof SCHEDULE_TYPE_LABELS] ||
                  schedule.schedule_type}
              </span>
            )}
            {schedule.status && (
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                  schedule.status
                )}`}
              >
                {SCHEDULE_STATUS_LABELS[schedule.status as keyof typeof SCHEDULE_STATUS_LABELS] ||
                  schedule.status}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="font-medium text-gray-600 mb-1">日程</div>
          <div className="text-gray-900">
            {formatDate(schedule.schedule_date)}
          </div>
        </div>

        <div>
          <div className="font-medium text-gray-600 mb-1">開始時刻</div>
          <div className="text-gray-900">
            {formatTime(schedule.start_time)}
          </div>
        </div>

        <div>
          <div className="font-medium text-gray-600 mb-1">終了時刻</div>
          <div className="text-gray-900">
            {formatTime(schedule.end_time)}
          </div>
        </div>
      </div>
    </div>
  );
};