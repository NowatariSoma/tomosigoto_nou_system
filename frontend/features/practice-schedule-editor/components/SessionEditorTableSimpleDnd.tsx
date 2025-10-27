'use client';

import React, { useState } from 'react';
import { Session, VenueInfo, TimeSlot, EditMode } from '../types/session-editor';
import { timeToMinutes } from '../mappers/time-slot-mapper';
import { Calendar, Plus, Minus } from 'lucide-react';
import { DraggableSessionCard } from './DraggableSessionCard';
import { PartCard } from './PartCard';
import { InstructorCard } from './InstructorCard';
import { EditableTimeSlot } from './EditableTimeSlot';
import { TimeSlotEditorModal } from './TimeSlotEditorModal';
import { SessionInstructorWithDetails } from '../services/session-instructor-service';

interface SessionEditorTableSimpleDndProps {
  sessions: Session[];
  instructors: any[]; // SessionInstructorWithDetails[]
  venues: VenueInfo[];
  time_slots: TimeSlot[];
  edit_mode: EditMode;
  scheduleId: string;
  onEditSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onMoveSession: (sessionId: string, venueId: string, timeSlot: string, slotOrder: number) => void;
  onMoveInstructor: (instructorId: string, venueId: string, slotOrder: number) => void;
  onDeleteInstructor?: (instructorId: string) => void;
  onAddTimeSlot?: () => void;
  onRemoveTimeSlot?: () => void;
  onUpdateTimeSlot?: (timeSlot: TimeSlot) => void;
  fallbackInstructors?: string[]; // フォールバック用のインストラクター名配列
}

export const SessionEditorTableSimpleDnd: React.FC<SessionEditorTableSimpleDndProps> = ({
  sessions,
  instructors,
  venues,
  time_slots,
  edit_mode,
  scheduleId,
  onEditSession,
  onDeleteSession,
  onMoveSession,
  onMoveInstructor,
  onDeleteInstructor,
  onAddTimeSlot,
  onRemoveTimeSlot,
  onUpdateTimeSlot,
  fallbackInstructors = [],
}) => {
  const [draggedItem, setDraggedItem] = useState<{type: 'session' | 'instructor', data: Session | SessionInstructorWithDetails} | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ venueId: string; timeSlot: string } | null>(null);
  const [isTimeSlotModalOpen, setIsTimeSlotModalOpen] = useState(false);
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);

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
            }
          } else if (time_slots.length > 0) {
            // start_timeが設定されていない場合は、slot_orderから時間スロットを決定
            const timeSlotIndex = (session.slot_order || 1) - 1;
            if (timeSlotIndex >= 0 && timeSlotIndex < time_slots.length) {
              timeSlot = time_slots[timeSlotIndex].time;
            }
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

  // インストラクターを会場と時間でグループ化
  const groupedInstructors = React.useMemo(() => {
    const groups: Record<string, Record<string, SessionInstructorWithDetails[]>> = {};

    // 会場ごとに初期化
    venues.forEach(venue => {
      groups[venue.id] = {};
      time_slots.forEach(slot => {
        groups[venue.id][slot.time] = [];
      });
    });

    // インストラクターを配置
    instructors.forEach(instructor => {
      if (instructor.schedule_available_venue_id) {
        const venueId = instructor.schedule_available_venue_id;
        if (groups[venueId]) {
          const slotIndex = (instructor.slot_order || 1) - 1;
          if (slotIndex >= 0 && slotIndex < time_slots.length) {
            const timeSlot = time_slots[slotIndex].time;
            if (groups[venueId][timeSlot]) {
              groups[venueId][timeSlot].push(instructor);
            }
          }
        }
      }
    });

    return groups;
  }, [instructors, venues, time_slots]);

  // 時間割外のセッションを抽出
  const outOfScheduleSessions = React.useMemo(() => {
    return sessions.filter(session => {
      if (!session.schedule_available_venue_id) return true;

      const timeSlotIndex = (session.slot_order || 1) - 1;
      if (timeSlotIndex < 0 || timeSlotIndex >= time_slots.length) {
        return true;
      }

      return false;
    });
  }, [sessions, time_slots]);

  const handleSessionDragStart = (e: React.DragEvent, session: Session) => {
    setDraggedItem({ type: 'session', data: session });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleInstructorDragStart = (e: React.DragEvent, instructor: SessionInstructorWithDetails) => {
    setDraggedItem({ type: 'instructor', data: instructor });
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

    if (draggedItem) {
      const slotIndex = time_slots.findIndex(slot => slot.time === timeSlot);
      const slotOrder = slotIndex + 1;

      if (draggedItem.type === 'session') {
        const session = draggedItem.data as Session;
        console.log('Moving session:', {
          sessionId: session.id,
          venueId,
          timeSlot,
          slotIndex,
          slotOrder
        });
        onMoveSession(session.id, venueId, timeSlot, slotOrder);
      } else if (draggedItem.type === 'instructor') {
        const instructor = draggedItem.data as SessionInstructorWithDetails;
        console.log('Moving instructor:', {
          instructorId: instructor.id,
          venueId,
          slotOrder
        });
        onMoveInstructor(instructor.id, venueId, slotOrder);
      }
      
      setDraggedItem(null);
    }
  };

  const handleTimeSlotEdit = (timeSlot: TimeSlot) => {
    setEditingTimeSlot(timeSlot);
    setIsTimeSlotModalOpen(true);
  };

  const handleTimeSlotSave = (updatedTimeSlot: TimeSlot) => {
    if (onUpdateTimeSlot) {
      onUpdateTimeSlot(updatedTimeSlot);
    }
    setIsTimeSlotModalOpen(false);
    setEditingTimeSlot(null);
  };

  const handleTimeSlotModalClose = () => {
    setIsTimeSlotModalOpen(false);
    setEditingTimeSlot(null);
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
        <div className="w-32 px-4 py-3 bg-gray-900 text-sm font-semibold text-white border-r border-b border-gray-600 hover:bg-gray-800 transition-colors">時間</div>
        <div className="flex-1 bg-gray-900 py-3 px-4 flex border-b border-gray-600">
          {venues.map((venue, index) => (
            <div key={`${venue.id}-${index}`} className="flex-1 text-sm font-semibold text-white text-center hover:bg-gray-800 transition-colors">
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
                <EditableTimeSlot
                  timeSlot={timeSlot}
                  onEdit={handleTimeSlotEdit}
                />
                {venues.map((venue) => {
                  const venueSessions = groupedSessions[venue.id]?.[timeSlot.time] || [];
                  const venueInstructors = groupedInstructors[venue.id]?.[timeSlot.time] || [];
                  const isOver = dragOverCell?.venueId === venue.id && dragOverCell?.timeSlot === timeSlot.time;

                  return (
                    <td
                      key={`${venue.id}-${timeSlot.time}`}
                      className="border-r border-gray-200 last:border-r-0 min-h-[80px] align-top bg-white p-1"
                      onDragOver={(e) => handleDragOver(e, venue.id, timeSlot.time)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, venue.id, timeSlot.time)}
                    >
                      <div className={`min-h-[80px] ${
                        isOver && venueSessions.length === 0 ? 'border-2 border-dashed border-blue-400 rounded-lg' : ''
                      }`}>
                        {(venueSessions.length > 0 || venueInstructors.length > 0) && (
                          <div className="w-full space-y-1">
                            {/* セッション（パート）カード */}
                            {venueSessions.map((session) => (
                              <PartCard
                                key={session.id}
                                session={session}
                                edit_mode={edit_mode}
                                is_dragging={draggedItem?.type === 'session' && (draggedItem.data as Session).id === session.id}
                                onDragStart={handleSessionDragStart}
                                onEdit={onEditSession}
                                onDelete={onDeleteSession}
                              />
                            ))}
                            {/* インストラクターカード */}
                            {venueInstructors.map((instructor) => (
                              <InstructorCard
                                key={instructor.id}
                                sessionInstructor={instructor}
                                scheduleId={scheduleId}
                                edit_mode={edit_mode}
                                is_dragging={draggedItem?.type === 'instructor' && (draggedItem.data as SessionInstructorWithDetails).id === instructor.id}
                                onDragStart={handleInstructorDragStart}
                                onDelete={onDeleteInstructor}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            
            {/* 時間追加・削除ボタン行 */}
            {edit_mode === 'edit' && (onAddTimeSlot || onRemoveTimeSlot) && (
              <tr className="border-t-2 border-gray-200">
                <td colSpan={venues.length + 1} className="px-4 py-3 bg-white">
                  <div className="flex items-center justify-center space-x-3">
                    {onRemoveTimeSlot && (
                      <button
                        onClick={onRemoveTimeSlot}
                        className="flex items-center justify-center space-x-1 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="時間スロットを削除"
                        disabled={time_slots.length <= 1}
                      >
                        <Minus className="h-4 w-4" />
                        <span>時間スロットを削除</span>
                      </button>
                    )}
                    {onAddTimeSlot && (
                      <button
                        onClick={onAddTimeSlot}
                        className="flex items-center justify-center space-x-1 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title="時間スロットを追加"
                      >
                        <Plus className="h-4 w-4" />
                        <span>時間スロットを追加</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
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

      {/* 時間割外セッション */}
      {outOfScheduleSessions.length > 0 && (
        <div className="px-4 py-3 bg-red-50 border-t border-red-200">
          <div className="text-sm font-semibold text-red-700 mb-2">
            ⚠️ 時間割外のセッション ({outOfScheduleSessions.length}件)
          </div>
          <div className="space-y-1">
            {outOfScheduleSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-lg p-2 bg-red-100 border border-red-300 text-sm cursor-pointer hover:bg-red-200"
                onClick={() => onEditSession(session.id)}
              >
                <div className="text-xs text-red-600">
                  slot_order: {session.slot_order} (時間割の範囲外)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 時間スロット編集モーダル */}
      <TimeSlotEditorModal
        isOpen={isTimeSlotModalOpen}
        onClose={handleTimeSlotModalClose}
        onSave={handleTimeSlotSave}
        timeSlot={editingTimeSlot}
      />
    </div>
  );
};