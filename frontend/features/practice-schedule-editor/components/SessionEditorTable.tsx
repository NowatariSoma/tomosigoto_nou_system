'use client';

import React from 'react';
import { Session, VenueInfo, TimeSlot, EditMode } from '../types/session-editor';
import { UI_TEXT } from '../constants';
import { timeToMinutes } from '../mappers/time-slot-mapper';
import { Calendar } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/data-display/table';

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

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* テーブルヘッダー */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex">
          <div className="w-24 text-sm font-medium text-black">時間</div>
          {venues.map((venue) => (
            <div key={venue.id} className="flex-1 text-sm font-medium text-black text-center">
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
                <TableCell className="w-24 px-4 py-3 text-sm font-medium text-black bg-white align-top">
                  {timeSlot.display_time}
                </TableCell>
                {venues.map((venue) => {
                  const venueSessions = groupedSessions[venue.id]?.[timeSlot.time] || [];
                  return (
                    <TableCell
                      key={`${venue.id}-${timeSlot.time}`}
                      className="px-2 py-2 border-r border-gray-200 last:border-r-0 min-h-[80px] align-top cursor-pointer transition-colors bg-white"
                      onClick={() => {
                        if (edit_mode === 'edit' && venueSessions.length === 0) {
                        }
                      }}
                    >
                      {venueSessions.length > 0 ? (
                        <div className="space-y-1">
                          {venueSessions.map((session) => (
                            <div
                              key={session.id}
                              className="rounded-lg p-3 bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100 hover:shadow-md transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditSession(session.id);
                              }}
                            >
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
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-black py-6">
                          {edit_mode === 'edit' ? 'クリックしてセッションを追加' : '空き'}
                        </div>
                      )}
                    </TableCell>
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
  );
};
