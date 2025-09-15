'use client';

import React from 'react';
import { SessionDisplayInfo } from '../types/practice-display';
import { UI_TEXT } from '../constants/practice-display';

interface SessionListProps {
  sessions: SessionDisplayInfo[];
}

export const SessionList: React.FC<SessionListProps> = ({ sessions }) => {
  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-gray-500">{UI_TEXT.NO_SESSIONS}</div>
      </div>
    );
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // HH:MM format
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-4 py-3 text-left font-medium text-gray-700">時間</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">セッション名</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">部署</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">会場</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">指導者</th>
            </tr>
          </thead>
          <tbody>
            {sessions
              .sort((a, b) => a.priority - b.priority)
              .map((session, index) => (
                <tr
                  key={session.id}
                  className="border-b border-gray-200 hover:bg-blue-50 transition-colors duration-150"
                >
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div className="font-medium">
                      {formatTime(session.start_time)} - {formatTime(session.end_time)}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div className="font-medium">{session.title}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {session.part_name || UI_TEXT.PART_NOT_SPECIFIED}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {session.venue_name || UI_TEXT.VENUE_NOT_SPECIFIED}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {session.instructors.length > 0 ? (
                      <div className="space-y-1">
                        {session.instructors.map((instructor, idx) => (
                          <div key={idx}>{instructor.name}</div>
                        ))}
                      </div>
                    ) : (
                      UI_TEXT.NO_INSTRUCTORS
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};