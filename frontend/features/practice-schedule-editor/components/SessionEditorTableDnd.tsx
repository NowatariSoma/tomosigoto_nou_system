'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Session, VenueInfo, TimeSlot, EditMode } from '../types/session-editor';
import { timeToMinutes } from '../mappers/time-slot-mapper';
import { Calendar, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EditableTimeSlot } from './EditableTimeSlot';
import { TimeSlotEditorModal } from './TimeSlotEditorModal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/data-display/table';

interface SessionEditorTableDndProps {
  sessions: Session[];
  venues: VenueInfo[];
  time_slots: TimeSlot[];
  edit_mode: EditMode;
  onEditSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onMoveSession: (sessionId: string, venueId: string, timeSlot: string, slotOrder: number) => void;
  onUpdateTimeSlot?: (timeSlot: TimeSlot) => void;
}

// ドラッグ可能なセッションコンポーネント
const DraggableSession: React.FC<{
  session: Session;
  onEdit: (sessionId: string) => void;
  isDragging?: boolean;
}> = ({ session, onEdit, isDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isLocalDragging,
  } = useSortable({ id: session.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isLocalDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg p-3 bg-blue-50 border border-blue-200 cursor-move hover:bg-blue-100 hover:shadow-md transition-all ${
        isDragging || isLocalDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onEdit(session.id);
      }}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab hover:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-black" />
        </div>
        <div className="flex-1">
          {session.part_name && (
            <div className="font-bold text-sm text-black leading-tight mb-1">
              {session.part_name}
            </div>
          )}
          {session.start_time && session.end_time && (
            <div className="text-xs text-black mt-1">
              {session.start_time} - {session.end_time}
            </div>
          )}
          {session.part_id && (
            <div className="text-xs text-black mt-1">
              パートID: {session.part_id}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ドロップ可能なセルコンポーネント
const DroppableCell: React.FC<{
  venueId: string;
  timeSlot: string;
  sessions: Session[];
  onEditSession: (sessionId: string) => void;
  editMode: EditMode;
  activeId: string | null;
}> = ({ venueId, timeSlot, sessions, onEditSession, editMode, activeId }) => {
  const cellId = `cell_${venueId}_${timeSlot}`;
  const { isOver, setNodeRef } = useDroppable({
    id: cellId,
    data: {
      venueId,
      timeSlot,
    }
  });

  return (
    <TableCell
      ref={setNodeRef}
      className={`px-2 py-2 border-r border-gray-200 last:border-r-0 min-h-[80px] align-top cursor-pointer transition-colors bg-white ${
        isOver ? 'bg-blue-50' : ''
      }`}
    >
      <div
        className={`min-h-[80px] ${
          isOver && sessions.length === 0 ? 'border-2 border-dashed border-blue-400 rounded-lg' : ''
        }`}
      >
        {sessions.length > 0 ? (
          <SortableContext
            items={sessions.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {sessions.map((session) => (
                <DraggableSession
                  key={session.id}
                  session={session}
                  onEdit={onEditSession}
                  isDragging={activeId === session.id}
                />
              ))}
            </div>
          </SortableContext>
        ) : (
          <div className="text-center text-black py-6">
            {editMode === 'edit' ? 'ドロップして移動' : '空き'}
          </div>
        )}
      </div>
    </TableCell>
  );
};

export const SessionEditorTableDnd: React.FC<SessionEditorTableDndProps> = ({
  sessions,
  venues,
  time_slots,
  edit_mode,
  onEditSession,
  onDeleteSession,
  onMoveSession,
  onUpdateTimeSlot,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isTimeSlotModalOpen, setIsTimeSlotModalOpen] = useState(false);
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeSessionId = active.id as string;

    // over.dataからvenueIdとtimeSlotを取得
    if (over.data?.current) {
      const { venueId, timeSlot } = over.data.current as { venueId: string; timeSlot: string };

      // セッションを移動
      const activeSession = sessions.find(s => s.id === activeSessionId);
      if (activeSession && venueId && timeSlot) {
        // 同じセル内のセッション数を取得してslot_orderを設定
        const cellSessions = groupedSessions[venueId]?.[timeSlot] || [];
        const slotOrder = cellSessions.length;

        onMoveSession(activeSessionId, venueId, timeSlot, slotOrder);
      }
    }

    setActiveId(null);
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
        <Calendar className="h-12 w-12 text-black mx-auto mb-4" />
        <div className="text-black text-lg mb-2">
          会場情報がありません
        </div>
        <p className="text-black text-sm">
          まず会場を登録してからセッションを作成してください
        </p>
      </div>
    );
  }

  const activeSession = sessions.find(s => s.id === activeId);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* テーブルヘッダー */}
        <div className="flex">
          <div className="w-32 px-4 py-3 bg-blue-100 text-sm font-semibold text-black border-r border-b border-blue-200 hover:bg-blue-200 transition-colors">時間</div>
          <div className="flex-1 bg-blue-100 py-3 px-4 flex border-b border-blue-200">
            {venues.map((venue) => (
              <div key={venue.id} className="flex-1 text-sm font-semibold text-black text-center hover:bg-blue-200 transition-colors">
                {venue.name || `会場${venue.id.slice(-4)}`}
              </div>
            ))}
          </div>
        </div>

        {/* テーブルボディ */}
        <div className="overflow-x-auto">
          <Table className="w-full table-fixed">
            <TableBody>
              {time_slots.map((timeSlot) => (
                <TableRow key={timeSlot.time} className="border-b border-gray-100">
                  <EditableTimeSlot
                    timeSlot={timeSlot}
                    onEdit={handleTimeSlotEdit}
                  />
                  {venues.map((venue) => {
                    const venueSessions = groupedSessions[venue.id]?.[timeSlot.time] || [];
                    return (
                      <DroppableCell
                        key={`cell_${venue.id}_${timeSlot.time}`}
                        venueId={venue.id}
                        timeSlot={timeSlot.time}
                        sessions={venueSessions}
                        onEditSession={onEditSession}
                        editMode={edit_mode}
                        activeId={activeId}
                      />
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* 統計情報 - 目立たないデザイン */}
        <div className="px-4 py-2 bg-white border-t border-gray-100">
          <div className="flex justify-between text-xs text-black">
            <div className="flex items-center space-x-4">
              <span>セッション: {sessions.length}</span>
              <span>会場: {venues.length}</span>
              <span>時間スロット: {time_slots.length}</span>
            </div>
            <div className="text-black">
              稼働率: {venues.length > 0 ? Math.round((sessions.length / (time_slots.length * venues.length)) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeId && activeSession ? (
          <div className="rounded-lg p-3 bg-blue-50 border-2 border-blue-400 shadow-xl cursor-grabbing">
            {activeSession.part_name && (
              <div className="font-bold text-sm text-black leading-tight mb-1">
                {activeSession.part_name}
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>

      {/* 時間スロット編集モーダル */}
      <TimeSlotEditorModal
        isOpen={isTimeSlotModalOpen}
        onClose={handleTimeSlotModalClose}
        onSave={handleTimeSlotSave}
        timeSlot={editingTimeSlot}
      />
    </>
  );
};