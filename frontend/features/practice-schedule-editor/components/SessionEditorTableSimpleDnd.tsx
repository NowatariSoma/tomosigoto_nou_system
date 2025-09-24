'use client';

import React, { useState } from 'react';
import { Session, VenueInfo, TimeSlot, EditMode } from '../types/session-editor';
import { timeToMinutes } from '../mappers/time-slot-mapper';
import { Calendar, GripVertical } from 'lucide-react';

interface SessionEditorTableSimpleDndProps {
  sessions: Session[];
  venues: VenueInfo[];
  time_slots: TimeSlot[];
  edit_mode: EditMode;
  onEditSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onMoveSession: (sessionId: string, venueId: string, timeSlot: string, slotOrder: number) => void;
}

export const SessionEditorTableSimpleDnd: React.FC<SessionEditorTableSimpleDndProps> = ({
  sessions,
  venues,
  time_slots,
  edit_mode,
  onEditSession,
  onDeleteSession,
  onMoveSession,
}) => {
  const [draggedSession, setDraggedSession] = useState<Session | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ venueId: string; timeSlot: string } | null>(null);

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
          let timeSlot = '';

          // セッションにstart_timeが設定されている場合は、直接その時間スロットを使用
          if (session.start_time) {
            // start_timeがtime_slotsに存在するか確認
            const matchingSlot = time_slots.find(slot => slot.time === session.start_time);
            if (matchingSlot) {
              timeSlot = matchingSlot.time;
            } else {
              // 存在しない場合は最も近い時間スロットを探す
              const sessionStartMinutes = timeToMinutes(session.start_time);
              let closestSlot = time_slots[0];
              let minDiff = Math.abs(timeToMinutes(time_slots[0].time) - sessionStartMinutes);

              for (const slot of time_slots) {
                const diff = Math.abs(timeToMinutes(slot.time) - sessionStartMinutes);
                if (diff < minDiff) {
                  minDiff = diff;
                  closestSlot = slot;
                }
              }
              timeSlot = closestSlot?.time || '';
            }
          } else if (time_slots.length > 0) {
            // start_timeが設定されていない場合は、slot_orderから時間スロットを決定
            const timeSlotIndex = Math.min(session.slot_order, time_slots.length - 1);
            timeSlot = time_slots[timeSlotIndex]?.time || time_slots[0]?.time || '';
          }

          // 該当する時間スロットが存在する場合のみセッションを追加
          if (timeSlot && groups[venueId][timeSlot]) {
            groups[venueId][timeSlot].push(session);
          }
        }
      }
    });

    return groups;
  }, [sessions, venues, time_slots]);

  const handleDragStart = (e: React.DragEvent, session: Session) => {
    setDraggedSession(session);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, venueId: string, timeSlot: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCell({ venueId, timeSlot });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, venueId: string, timeSlot: string) => {
    e.preventDefault();
    setDragOverCell(null);

    if (draggedSession) {
      const cellSessions = groupedSessions[venueId]?.[timeSlot] || [];
      const slotOrder = cellSessions.length;

      // セッションIDから実際のIDを抽出（temp_で始まる場合はそのまま使用）
      let actualSessionId = draggedSession.id;
      if (draggedSession.id.startsWith('temp_')) {
        // 一時的なIDの場合はそのまま使用
        actualSessionId = draggedSession.id;
      } else if (draggedSession.id.includes('_')) {
        // 複合IDの場合は最後の部分を使用
        const parts = draggedSession.id.split('_');
        actualSessionId = parts[parts.length - 1];
      }

      // part_idがある場合はそれを使用
      if (draggedSession.part_id) {
        actualSessionId = draggedSession.part_id;
      }

      console.log('Moving session:', {
        originalId: draggedSession.id,
        actualSessionId,
        venueId,
        timeSlot,
        slotOrder
      });

      onMoveSession(actualSessionId, venueId, timeSlot, slotOrder);
      setDraggedSession(null);
    }
  };

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
      {/* テーブルヘッダー */}
      <div className="flex">
        <div className="w-24 px-4 py-3 bg-gray-900 text-sm font-semibold text-white border-r border-b border-gray-600 hover:bg-gray-800 transition-colors">時間</div>
        <div className="flex-1 bg-gray-900 py-3 px-4 flex border-b border-gray-600">
          {venues.map((venue) => (
            <div key={venue.id} className="flex-1 text-sm font-semibold text-white text-center hover:bg-gray-800 transition-colors">
              {venue.name || `会場${venue.id.slice(-4)}`}
            </div>
          ))}
        </div>
      </div>

      {/* テーブルボディ */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <tbody>
            {time_slots.map((timeSlot) => (
              <tr key={timeSlot.time} className="border-b border-gray-100">
                <td className="w-24 px-4 py-3 text-sm font-medium text-white bg-gray-900 align-top border-r border-gray-600 hover:bg-gray-800 transition-colors">
                  {timeSlot.display_time}
                </td>
                {venues.map((venue) => {
                  const venueSessions = groupedSessions[venue.id]?.[timeSlot.time] || [];
                  const isOver = dragOverCell?.venueId === venue.id && dragOverCell?.timeSlot === timeSlot.time;

                  return (
                    <td
                      key={`${venue.id}-${timeSlot.time}`}
                      className={`px-2 py-2 border-r border-gray-200 last:border-r-0 min-h-[80px] align-top transition-colors ${
                        isOver ? 'bg-blue-50' : 'bg-white'
                      }`}
                      onDragOver={(e) => handleDragOver(e, venue.id, timeSlot.time)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, venue.id, timeSlot.time)}
                    >
                      <div className={`min-h-[80px] ${
                        isOver && venueSessions.length === 0 ? 'border-2 border-dashed border-blue-400 rounded-lg' : ''
                      }`}>
                        {venueSessions.length > 0 ? (
                          <div className="space-y-1">
                            {venueSessions.map((session) => (
                              <div
                                key={session.id}
                                draggable={edit_mode === 'edit'}
                                onDragStart={(e) => handleDragStart(e, session)}
                                className={`rounded-lg p-3 bg-blue-100 border border-blue-200 hover:bg-blue-200 hover:shadow-md transition-all ${
                                  edit_mode === 'edit' ? 'cursor-move' : 'cursor-pointer'
                                } ${draggedSession?.id === session.id ? 'opacity-50' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditSession(session.id);
                                }}
                              >
                                <div className="flex items-start gap-2">
                                  {edit_mode === 'edit' && (
                                    <div className="mt-1 cursor-grab hover:cursor-grabbing">
                                      <GripVertical className="h-4 w-4 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div className="font-bold text-sm text-gray-800 leading-tight mb-1">
                                      {session.title}
                                    </div>
                                    <div className="text-xs text-gray-700">
                                      優先度: {session.priority}
                                    </div>
                                    {session.start_time && session.end_time && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {session.start_time} - {session.end_time}
                                      </div>
                                    )}
                                    {session.part_id && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        パートID: {session.part_id}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-400 py-6">
                            {edit_mode === 'edit' && draggedSession ? 'ドロップして移動' : '空き'}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 統計情報 - 目立たないデザイン */}
      <div className="px-4 py-2 bg-white border-t border-gray-100">
        <div className="flex justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>セッション: {sessions.length}</span>
            <span>会場: {venues.length}</span>
            <span>時間スロット: {time_slots.length}</span>
          </div>
          <div className="text-gray-400">
            稼働率: {venues.length > 0 ? Math.round((sessions.length / (time_slots.length * venues.length)) * 100) : 0}%
          </div>
        </div>
      </div>
    </div>
  );
};