'use client';

import React, { useState, useEffect } from 'react';
import { PracticeSchedule } from '../types';
import { Calendar, Clock, MapPin, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';

interface PracticeScheduleCardProps {
  schedule: PracticeSchedule;
  onEdit?: (schedule: PracticeSchedule) => void;
  onDelete?: (schedule: PracticeSchedule) => void;
  onClick?: (schedule: PracticeSchedule) => void;
}

export const PracticeScheduleCard: React.FC<PracticeScheduleCardProps> = ({
  schedule,
  onEdit,
  onDelete,
  onClick,
}) => {
  const [isToday, setIsToday] = useState(false);

  // クライアントサイドでのみ「今日」をチェック（ハイドレーションミスマッチを防ぐ）
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    setIsToday(schedule.date === todayStr);
  }, [schedule.date]);

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
    <div
      className={`rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer ${
        isToday
          ? 'bg-amber-50 border-2 border-amber-400 ring-2 ring-amber-200'
          : 'card-blue hover:bg-blue-100/50'
      }`}
      onClick={() => onClick && onClick(schedule)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {schedule.title && (
            <h3 className="text-lg font-semibold text-black mb-2">
              {schedule.title}
            </h3>
          )}
          <div className="flex items-center space-x-2">
            <Calendar className={`h-4 w-4 ${isToday ? 'text-amber-600' : 'text-black'}`} />
            <h4 className={`text-md font-medium ${isToday ? 'text-amber-700' : 'text-black'}`}>
              {formatDate(schedule.date)}
            </h4>
          </div>
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(schedule);
              }}
              className="p-2 hover-subtle rounded-md"
              title="編集"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(schedule);
              }}
              className="p-2 hover-subtle rounded-md"
              title="削除"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-black" />
          <span className="text-sm text-black">
            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-black" />
          <div className="text-sm text-black">
            {schedule.venues && schedule.venues.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {schedule.venues
                  .filter((venue, index, self) =>
                    index === self.findIndex(v => v.id === venue.id)
                  )
                  .map((venue, index) => (
                    <span
                      key={`${venue.id}-${index}`}
                      className="inline-block bg-blue-100 text-black text-xs px-2 py-1 rounded-full font-medium"
                    >
                      {venue.name}
                    </span>
                  ))}
              </div>
            ) : schedule.venueName ? (
              <span className="inline-block bg-blue-100 text-black text-xs px-2 py-1 rounded-full font-medium">
                {schedule.venueName}
              </span>
            ) : (
              <span className="inline-block bg-gray-100 text-black text-xs px-2 py-1 rounded-full font-medium">
                会場未設定
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
