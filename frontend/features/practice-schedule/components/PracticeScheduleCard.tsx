'use client';

import React from 'react';
import { PracticeSchedule } from '../types';
import { Calendar, Clock, MapPin, Edit, Trash2 } from 'lucide-react';

interface PracticeScheduleCardProps {
  schedule: PracticeSchedule;
  onEdit?: (schedule: PracticeSchedule) => void;
  onDelete?: (schedule: PracticeSchedule) => void;
}

export const PracticeScheduleCard: React.FC<PracticeScheduleCardProps> = ({
  schedule,
  onEdit,
  onDelete,
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

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {formatDate(schedule.date)}
          </h3>
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={() => onEdit(schedule)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="編集"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(schedule)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="削除"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            {schedule.venueName} ({schedule.campus}キャンパス)
          </span>
        </div>

        {schedule.description && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              {schedule.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
