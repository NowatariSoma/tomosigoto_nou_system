'use client';

import React, { useState, useRef } from 'react';
import { Session, VenueInfo, TimeSlot, EditMode } from '../types/session-editor';
import { timeToMinutes } from '../mappers/time-slot-mapper';
import { Calendar, Plus, Minus, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { DraggableSessionCard } from './DraggableSessionCard';
import { PartCard } from './PartCard';
import { InstructorCard } from './InstructorCard';
import { EditableTimeSlot } from './EditableTimeSlot';
import { TimeSlotEditorModal } from './TimeSlotEditorModal';
import { SelectionModal } from '@/components/ui/interactive/selection-modal';
import { SessionInstructorWithDetails } from '../services/session-instructor-service';
import { useTouchDrag, DragItem } from '../hooks/use-touch-drag';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/data-display/table';

interface SessionEditorTableSimpleDndProps {
  sessions: Session[];
  instructors: any[]; // SessionInstructorWithDetails[]
  venues: VenueInfo[];
  availableRooms?: VenueInfo[]; // 利用可能な部屋一覧
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
  onAddVenues?: (venues: VenueInfo[]) => void;
  onRemoveVenue?: (venueId: string) => void;
  onUpdateVenue?: (venueId: string, venue: VenueInfo) => void;
  fallbackInstructors?: string[]; // フォールバック用のインストラクター名配列
}

export const SessionEditorTableSimpleDnd: React.FC<SessionEditorTableSimpleDndProps> = ({
  sessions,
  instructors,
  venues,
  availableRooms = [],
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
  onAddVenues,
  onRemoveVenue,
  onUpdateVenue,
  fallbackInstructors = [],
}) => {
  const [draggedItem, setDraggedItem] = useState<{type: 'session' | 'instructor', data: Session | SessionInstructorWithDetails} | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ venueId: string; timeSlot: string } | null>(null);
  const [isTimeSlotModalOpen, setIsTimeSlotModalOpen] = useState(false);
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [selectedVenues, setSelectedVenues] = useState<VenueInfo[]>([]);

  // タッチドラッグ対応
  const {
    isDragging: isTouchDragging,
    dragItem: touchDragItem,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  } = useTouchDrag({
    onMoveSession: onMoveSession,
    onMoveInstructor: onMoveInstructor,
    timeSlots: time_slots,
  });

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
  // 注意: time_slotsがまだロードされていない場合（length === 0）は空配列を返す
  const outOfScheduleSessions = React.useMemo(() => {
    // 時間スロットがロードされていない場合はバリデーションをスキップ
    if (time_slots.length === 0) {
      return [];
    }

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

  // 会場編集モーダルのハンドラー
  const handleOpenVenueModal = () => {
    // 現在選択されている会場を初期選択として設定
    // venues.venue_idを使ってavailableRoomsからマッチングする
    const currentlySelectedRooms = availableRooms.filter(room =>
      venues.some(v => v.venue_id === room.id)
    );
    setSelectedVenues(currentlySelectedRooms);
    setIsVenueModalOpen(true);
  };

  const handleCloseVenueModal = () => {
    setIsVenueModalOpen(false);
  };

  const handleConfirmVenueSelection = (newSelectedVenues: VenueInfo[]) => {
    // 新しく選択された会場（venue_idでマッチング）
    // newSelectedVenuesのidはavailableRoomsのid（venue.id）
    const newVenues = newSelectedVenues.filter(
      room => !venues.some(v => v.venue_id === room.id)
    );
    if (newVenues.length > 0 && onAddVenues) {
      onAddVenues(newVenues);
    }

    // 選択解除された会場を削除（venue_idでマッチング）
    const removedScheduleVenueIds = venues
      .filter(venue => !newSelectedVenues.some(room => room.id === venue.venue_id))
      .map(venue => venue.id); // schedule_available_venue.idを使って削除

    if (onRemoveVenue) {
      removedScheduleVenueIds.forEach(id => onRemoveVenue(id));
    }

    setIsVenueModalOpen(false);
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

  // モバイル向けカード型レイアウト（sm未満）
  const renderMobileLayout = () => (
    <div className="sm:hidden space-y-4">
      {/* 会場編集ボタン（編集モード時） */}
      {edit_mode === 'edit' && (
        <div className="flex justify-end">
          <Button
            onClick={handleOpenVenueModal}
            size="sm"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm"
          >
            <Edit2 className="h-4 w-4" />
            会場編集
          </Button>
        </div>
      )}

      {/* 時間スロットごとにカードを表示 */}
      {time_slots.map((timeSlot, slotIndex) => (
        <div key={timeSlot.time} className="card-blue overflow-hidden">
          {/* 時間スロットヘッダー */}
          <div
            className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center justify-between"
            onClick={() => edit_mode === 'edit' && handleTimeSlotEdit(timeSlot)}
          >
            <span className="font-semibold text-black">
              {timeSlot.time} - {timeSlot.end_time}
            </span>
            {edit_mode === 'edit' && (
              <Edit2 className="h-4 w-4 text-black" />
            )}
          </div>

          {/* 会場ごとのセクション */}
          <div className="divide-y divide-gray-100">
            {venues.map((venue) => {
              const venueSessions = groupedSessions[venue.id]?.[timeSlot.time] || [];
              const venueInstructors = groupedInstructors[venue.id]?.[timeSlot.time] || [];
              const isOver = dragOverCell?.venueId === venue.id && dragOverCell?.timeSlot === timeSlot.time;

              return (
                <div
                  key={`mobile-${venue.id}-${timeSlot.time}`}
                  data-venue-id={venue.id}
                  data-time-slot={timeSlot.time}
                  className="p-3 bg-white"
                  onDragOver={(e) => handleDragOver(e, venue.id, timeSlot.time)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, venue.id, timeSlot.time)}
                >
                  {/* 会場名 */}
                  <div className="text-xs text-gray-500 font-medium mb-2">
                    📍 {venue.name || `会場${venue.id.slice(-4)}`}
                  </div>

                  {/* ドロップエリア */}
                  <div className={`min-h-[40px] ${
                    isOver && venueSessions.length === 0 && venueInstructors.length === 0
                      ? 'border-2 border-dashed border-blue-400 rounded-lg'
                      : ''
                  }`}>
                    {(venueSessions.length > 0 || venueInstructors.length > 0) ? (
                      <div className="space-y-2">
                        {/* セッション（パート）カード */}
                        {venueSessions.map((session) => (
                          <PartCard
                            key={session.id}
                            session={session}
                            edit_mode={edit_mode}
                            is_dragging={
                              (draggedItem?.type === 'session' && (draggedItem.data as Session).id === session.id) ||
                              (isTouchDragging && touchDragItem?.type === 'session' && (touchDragItem.data as Session).id === session.id)
                            }
                            onDragStart={handleSessionDragStart}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onTouchCancel={handleTouchCancel}
                            onEdit={onEditSession}
                            onDelete={onDeleteSession}
                          />
                        ))}
                        {/* 監督者カード */}
                        {venueInstructors.map((instructor) => (
                          <InstructorCard
                            key={instructor.id}
                            sessionInstructor={instructor}
                            scheduleId={scheduleId}
                            edit_mode={edit_mode}
                            is_dragging={
                              (draggedItem?.type === 'instructor' && (draggedItem.data as SessionInstructorWithDetails).id === instructor.id) ||
                              (isTouchDragging && touchDragItem?.type === 'instructor' && (touchDragItem.data as SessionInstructorWithDetails).id === instructor.id)
                            }
                            onDragStart={handleInstructorDragStart}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onTouchCancel={handleTouchCancel}
                            onDelete={onDeleteInstructor}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 text-center py-2">
                        空きスロット
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* 時間追加・削除ボタン（編集モード時） */}
      {edit_mode === 'edit' && (onAddTimeSlot || onRemoveTimeSlot) && (
        <div className="card-blue p-3">
          <div className="flex items-center justify-center gap-4">
            {onRemoveTimeSlot && (
              <Button
                onClick={onRemoveTimeSlot}
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-sm"
                disabled={time_slots.length <= 1}
              >
                <Minus className="h-4 w-4" />
                時間削除
              </Button>
            )}
            {onAddTimeSlot && (
              <Button
                onClick={onAddTimeSlot}
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-sm"
              >
                <Plus className="h-4 w-4" />
                時間追加
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // デスクトップ向けテーブルレイアウト（sm以上）
  const renderDesktopLayout = () => (
    <div className="hidden sm:block card-blue overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full table-fixed min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-32 px-4 py-3 table-header-cell border-r border-b border-blue-200">時間</TableHead>
              {venues.map((venue, index) => (
                <TableHead
                  key={`${venue.id}-${index}`}
                  className="px-4 py-3 table-header-cell text-center border-r border-b border-blue-200 whitespace-nowrap"
                >
                  {venue.name || `会場${venue.id.slice(-4)}`}
                </TableHead>
              ))}
              {edit_mode === 'edit' && (
                <TableHead className="w-24 px-4 py-3 table-header-cell text-center border-b border-blue-200">
                  <Button
                    onClick={handleOpenVenueModal}
                    size="sm"
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs"
                  >
                    <Edit2 className="h-3 w-3" />
                    会場編集
                  </Button>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {time_slots.map((timeSlot) => (
              <TableRow key={timeSlot.time} className="border-b border-gray-100">
                <EditableTimeSlot
                  timeSlot={timeSlot}
                  onEdit={handleTimeSlotEdit}
                />
                {venues.map((venue) => {
                  const venueSessions = groupedSessions[venue.id]?.[timeSlot.time] || [];
                  const venueInstructors = groupedInstructors[venue.id]?.[timeSlot.time] || [];
                  const isOver = dragOverCell?.venueId === venue.id && dragOverCell?.timeSlot === timeSlot.time;

                  return (
                    <TableCell
                      key={`${venue.id}-${timeSlot.time}`}
                      data-venue-id={venue.id}
                      data-time-slot={timeSlot.time}
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
                                is_dragging={
                                  (draggedItem?.type === 'session' && (draggedItem.data as Session).id === session.id) ||
                                  (isTouchDragging && touchDragItem?.type === 'session' && (touchDragItem.data as Session).id === session.id)
                                }
                                onDragStart={handleSessionDragStart}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                onTouchCancel={handleTouchCancel}
                                onEdit={onEditSession}
                                onDelete={onDeleteSession}
                              />
                            ))}
                            {/* 監督者カード */}
                            {venueInstructors.map((instructor) => (
                              <InstructorCard
                                key={instructor.id}
                                sessionInstructor={instructor}
                                scheduleId={scheduleId}
                                edit_mode={edit_mode}
                                is_dragging={
                                  (draggedItem?.type === 'instructor' && (draggedItem.data as SessionInstructorWithDetails).id === instructor.id) ||
                                  (isTouchDragging && touchDragItem?.type === 'instructor' && (touchDragItem.data as SessionInstructorWithDetails).id === instructor.id)
                                }
                                onDragStart={handleInstructorDragStart}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                onTouchCancel={handleTouchCancel}
                                onDelete={onDeleteInstructor}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}

            {/* 時間追加・削除ボタン行 */}
            {edit_mode === 'edit' && (onAddTimeSlot || onRemoveTimeSlot) && (
              <TableRow className="border-t-2 border-gray-200">
                <TableCell colSpan={venues.length + 2} className="px-4 py-3 bg-white">
                  <div className="flex items-center justify-center gap-2">
                    {onRemoveTimeSlot && (
                      <Button
                        onClick={onRemoveTimeSlot}
                        variant="ghost"
                        size="sm"
                        className="flex items-center justify-center space-x-1 text-sm font-medium"
                        title="時間スロットを削除"
                        disabled={time_slots.length <= 1}
                      >
                        <Minus className="h-4 w-4" />
                        <span>時間スロットを削除</span>
                      </Button>
                    )}
                    {onAddTimeSlot && (
                      <Button
                        onClick={onAddTimeSlot}
                        variant="ghost"
                        size="sm"
                        className="flex items-center justify-center space-x-1 text-sm font-medium"
                        title="時間スロットを追加"
                      >
                        <Plus className="h-4 w-4" />
                        <span>時間スロットを追加</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <>
      {/* モバイルレイアウト */}
      {renderMobileLayout()}

      {/* デスクトップレイアウト */}
      {renderDesktopLayout()}

      {/* 統計情報 - 目立たないデザイン */}
      <div className="px-2 sm:px-4 py-2 panel-info border-t border-blue-200">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0 text-xs text-black">
          <div className="flex items-center flex-wrap gap-2 sm:gap-4">
            <span>セッション: {sessions.length}</span>
            <span>会場: {venues.length}</span>
            <span>時間スロット: {time_slots.length}</span>
          </div>
          <div className="text-black">
            稼働率: {venues.length > 0 ? Math.round((sessions.length / (time_slots.length * venues.length)) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* 時間割外セッション */}
      {outOfScheduleSessions.length > 0 && (
        <div className="px-2 sm:px-4 py-2 sm:py-3 panel-info border-t border-blue-200">
          <div className="text-xs sm:text-sm font-semibold text-black mb-2">
            ⚠️ 時間割外のセッション ({outOfScheduleSessions.length}件)
          </div>
          <div className="space-y-1">
            {outOfScheduleSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-lg p-2 card-blue cursor-pointer hover-subtle"
                onClick={() => onEditSession(session.id)}
              >
                <div className="text-xs text-black">
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

      {/* 会場選択モーダル */}
      <SelectionModal<VenueInfo>
        isOpen={isVenueModalOpen}
        onClose={handleCloseVenueModal}
        onConfirm={handleConfirmVenueSelection}
        items={availableRooms}
        selectedItems={selectedVenues}
        title="会場を選択"
        columns={2}
        getItemLabel={(room) => room.name}
        getItemSubLabel={(room) => room.campus ? `${room.campus}キャンパス` : ''}
        selectedCountText={(count) => `${count}個の会場を選択中`}
        confirmButtonText="確定"
        cancelButtonText="キャンセル"
      />
    </>
  );
};