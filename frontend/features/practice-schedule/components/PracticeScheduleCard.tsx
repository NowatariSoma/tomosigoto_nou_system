'use client';

import React, { useState } from 'react';
import { PracticeSchedule } from '../types';
import { Calendar, Clock, MapPin, Edit, Trash2, Link, Check } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

  // デバッグ用: 会場情報をコンソールに出力
  React.useEffect(() => {
    console.log('PracticeScheduleCard - schedule data:', {
      id: schedule.id,
      venueName: schedule.venueName,
      venues: schedule.venues,
      venueIds: schedule.venueIds
    });
  }, [schedule]);

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

  const copyAttendanceLink = async () => {
    const attendanceUrl = `${window.location.origin}/attendance?practice=${schedule.id}`;
    try {
      await navigator.clipboard.writeText(attendanceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {schedule.title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {schedule.title}
            </h3>
          )}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <h4 className="text-md font-medium text-gray-800">
              {formatDate(schedule.date)}
            </h4>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={copyAttendanceLink}
            className={`p-2 rounded-md transition-colors ${
              copied
                ? 'text-green-600 bg-green-50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title={copied ? 'コピーしました！' : '出席登録リンクをコピー'}
          >
            {copied ? <Check className="h-4 w-4" /> : <Link className="h-4 w-4" />}
          </button>
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
          <div className="text-sm text-gray-700">
            {schedule.venues && schedule.venues.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {schedule.venues
                  .filter((venue, index, self) =>
                    index === self.findIndex(v => v.id === venue.id)
                  )
                  .map((venue, index) => (
                    <span
                      key={`${venue.id}-${index}`}
                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium"
                    >
                      {venue.name}
                    </span>
                  ))}
              </div>
            ) : schedule.venueName ? (
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                {schedule.venueName}
              </span>
            ) : (
              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                会場未設定
              </span>
            )}
          </div>
        </div>

        {schedule.description && (
          <div className="mt-3">
            <p className="text-sm text-slate-700 bg-slate-100 p-4 rounded-lg border-l-4 border-blue-500 leading-relaxed">
              {schedule.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
