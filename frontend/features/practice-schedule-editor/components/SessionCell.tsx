'use client';

import React from 'react';
import { Session, VenueInfo, TimeSlot, EditMode } from '../types/session-editor';
import { DraggableSession } from './DraggableSession';
import { cn } from '@/lib/utils';

interface SessionCellProps {
  venue: VenueInfo;
  timeSlot: TimeSlot;
  sessions: Session[];
  edit_mode: EditMode;
  scheduleId: string;
  onEditSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onMoveSession: (sessionId: string, venueId: string, timeSlot: string, slotOrder: number) => void;
  fallbackInstructors?: string[]; // フォールバック用のインストラクター名配列
}

export const SessionCell: React.FC<SessionCellProps> = ({
  venue,
  timeSlot,
  sessions,
  edit_mode,
  scheduleId,
  onEditSession,
  onDeleteSession,
  onMoveSession,
  fallbackInstructors = [],
}) => {
  const handleCellClick = () => {
    if (edit_mode === 'edit' && sessions.length === 0) {
      // 空のセルをクリックした場合の処理（新しいセッション作成など）
      console.log('Empty cell clicked:', { venue: venue.id, timeSlot: timeSlot.time });
    }
  };

  const handleSessionMove = (sessionId: string, newVenueId: string, newTimeSlot: string) => {
    if (newVenueId !== venue.id || newTimeSlot !== timeSlot.time) {
      onMoveSession(sessionId, newVenueId, newTimeSlot, 0);
    }
  };

  return (
    <td
      className={cn(
        "px-2 py-2 border-r border-gray-200 last:border-r-0 min-h-[80px] align-top",
        "cursor-pointer transition-colors",
        sessions.length > 0 ? "bg-blue-25" : "hover:bg-blue-50"
      )}
      onClick={handleCellClick}
    >
      {sessions.length > 0 ? (
        <div className="space-y-1">
          {sessions.map((session, index) => (
            <DraggableSession
              key={session.id}
              session={session}
              edit_mode={edit_mode}
              scheduleId={scheduleId}
              onEdit={onEditSession}
              onDelete={onDeleteSession}
              onMove={handleSessionMove}
              fallbackInstructors={fallbackInstructors}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-6">
          {edit_mode === 'edit' ? 'クリックしてセッションを追加' : '空き'}
        </div>
      )}
    </td>
  );
};
