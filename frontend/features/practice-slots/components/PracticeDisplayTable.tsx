'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { PracticeScheduleDisplay, SessionDisplayInfo } from '../types/practice-display';
import { UI_TEXT } from '../constants/practice-display';

interface PracticeDisplayTableProps {
  schedule: PracticeScheduleDisplay;
  className?: string;
}

export const PracticeDisplayTable: React.FC<PracticeDisplayTableProps> = ({
  schedule,
  className,
}) => {
  // 時間スロットを生成（15分間隔）
  const generateTimeSlots = () => {
    const startTime = schedule.start_time;
    const endTime = schedule.end_time;

    const slots = [];
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    let current = new Date(start);
    while (current <= end) {
      const timeStr = current.toTimeString().slice(0, 5);
      slots.push(timeStr);
      current.setMinutes(current.getMinutes() + 15);
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  // セッションを時間スロットにマッピング
  const getSessionsForTimeSlot = (timeSlot: string) => {
    return schedule.sessions.filter(session => {
      const sessionStart = session.start_time.slice(0, 5);
      const sessionEnd = session.end_time.slice(0, 5);
      return timeSlot >= sessionStart && timeSlot < sessionEnd;
    });
  };

  // 利用可能会場の表示名を取得
  const getVenueDisplayNames = () => {
    return schedule.available_venues
      .sort((a, b) => a.priority - b.priority)
      .map(venue => venue.name);
  };

  const venueNames = getVenueDisplayNames();

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const formatSessionContent = (session: SessionDisplayInfo) => {
    const parts = [];
    if (session.part_name) {
      parts.push(session.part_name);
    }
    if (session.instructors.length > 0) {
      parts.push(`指導: ${session.instructors.map(i => i.name).join(', ')}`);
    }
    return parts.join('\n');
  };

  return (
    <div className={cn("bg-white rounded-lg shadow-lg overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-gray-100 text-white border-b border-gray-300">
              <th className="px-4 py-3 text-left font-medium">時間</th>
              <th className="px-4 py-3 text-center font-medium border-l border-gray-300">セッション</th>
              {venueNames.map((venueName) => (
                <th key={venueName} className="px-4 py-3 text-center font-medium border-l border-gray-300">
                  {venueName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((timeSlot, index) => {
              const sessions = getSessionsForTimeSlot(timeSlot);

              return (
                <tr
                  key={index}
                  className="border-b border-gray-200 bg-white hover:bg-blue-50 transition-colors duration-150"
                >
                  <td className="px-4 py-4 font-medium text-black bg-gray-200 border-r border-gray-300">
                    <div className="flex items-center">
                      <span className="text-sm font-bold">{timeSlot}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-xs text-gray-700 border-r border-gray-200">
                    {sessions.map((session, idx) => (
                      <div key={idx} className="mb-2 last:mb-0">
                        <div className="font-medium text-blue-700">{session.title}</div>
                        <div className="text-xs text-gray-600">
                          {formatTime(session.start_time)} - {formatTime(session.end_time)}
                        </div>
                        {session.part_name && (
                          <div className="text-xs text-gray-500 mt-1">{session.part_name}</div>
                        )}
                      </div>
                    ))}
                  </td>

                  {venueNames.map((venueName, colIndex) => {
                    const venueSession = sessions.find(s => s.venue_name === venueName);

                    return (
                      <td
                        key={colIndex}
                        className="px-4 py-4 text-xs text-gray-700 border-r border-gray-200 last:border-r-0"
                      >
                        {venueSession ? (
                          <div className="text-center">
                            <div className="font-medium text-blue-700">{venueSession.title}</div>
                            {venueSession.part_name && (
                              <div className="text-xs text-gray-600 mt-1">{venueSession.part_name}</div>
                            )}
                            {venueSession.instructors.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {venueSession.instructors.map(i => i.name).join(', ')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-gray-400">
                            -
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};