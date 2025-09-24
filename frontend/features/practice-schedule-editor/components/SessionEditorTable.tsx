'use client';

import React from 'react';
import { Session, VenueInfo, TimeSlot, EditMode } from '../types/session-editor';
import { DraggableSession } from './DraggableSession';
import { SessionCell } from './SessionCell';
import { TimeSlotHeader } from './TimeSlotHeader';
import { VenueColumn } from './VenueColumn';
import { UI_TEXT } from '../constants';
import { Calendar } from 'lucide-react';

interface SessionEditorTableProps {
  sessions: Session[];
  venues: VenueInfo[];
  time_slots: TimeSlot[];
  edit_mode: EditMode;
  onEditSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onMoveSession: (sessionId: string, venueId: string, timeSlot: string, slotOrder: number) => void;
}

export const SessionEditorTable: React.FC<SessionEditorTableProps> = ({
  sessions,
  venues,
  time_slots,
  edit_mode,
  onEditSession,
  onDeleteSession,
  onMoveSession,
}) => {
  // セッションを会場と時間でグループ化
  const groupedSessions = React.useMemo(() => {
    const groups: Record<string, Record<string, Session[]>> = {};
    
    // 会場ごとに初期化
    venues.forEach(venue => {
      groups[venue.id] = {};
      time_slots.forEach(slot => {
        groups[venue.id][slot.time] = [];
      });
    });

    // セッションを配置
    sessions.forEach(session => {
      if (session.schedule_available_venue_id) {
        const venueId = session.schedule_available_venue_id;
        if (groups[venueId]) {
          // 時間スロットは仮で設定（実際の実装では適切にマッピング）
          const timeSlot = time_slots[0]?.time || '';
          if (groups[venueId][timeSlot]) {
            groups[venueId][timeSlot].push(session);
          }
        }
      }
    });

    return groups;
  }, [sessions, venues, time_slots]);

  if (venues.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <div className="text-gray-500 text-lg mb-2">
          会場情報がありません
        </div>
        <p className="text-gray-400 text-sm">
          まず会場を登録してからセッションを作成してください
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-4 py-3 text-left font-medium text-gray-700 border-r border-gray-300 w-20">
                時間
              </th>
              {venues.map((venue) => (
                <VenueColumn
                  key={venue.id}
                  venue={venue}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {time_slots.map((timeSlot) => (
              <tr
                key={timeSlot.time}
                className="border-b border-gray-200 hover:bg-blue-50 transition-colors duration-150"
              >
                <TimeSlotHeader timeSlot={timeSlot} />
                {venues.map((venue) => {
                  const venueSessions = groupedSessions[venue.id]?.[timeSlot.time] || [];
                  return (
                    <SessionCell
                      key={`${venue.id}-${timeSlot.time}`}
                      venue={venue}
                      timeSlot={timeSlot}
                      sessions={venueSessions}
                      edit_mode={edit_mode}
                      onEditSession={onEditSession}
                      onDeleteSession={onDeleteSession}
                      onMoveSession={onMoveSession}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 統計情報 */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-600">
          <div>
            <span className="font-medium">総セッション数:</span> {sessions.length}件
          </div>
          <div>
            <span className="font-medium">会場数:</span> {venues.length}件
          </div>
          <div>
            <span className="font-medium">時間スロット数:</span> {time_slots.length}件
          </div>
        </div>
      </div>
    </div>
  );
};
