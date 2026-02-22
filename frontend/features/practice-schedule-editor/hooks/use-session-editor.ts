/**
 * セッション編集用のカスタムフック（オーケストレーター）
 *
 * サブフックを組み合わせてセッション編集の全機能を提供する。
 * - session-editor-reducer: reducer・型定義
 * - use-session-editor-sessions: セッション/インストラクター操作
 * - use-session-editor-venues: 会場操作
 * - use-session-editor-timeslots: タイムスロット操作
 */

import { useState, useCallback, useEffect, useReducer, useRef } from 'react';
import {
  Session,
  VenueInfo,
  TimeSlot,
} from '../types/session-editor';
import {
  IdealPartInfo
} from '../types/api';
import {
  practiceScheduleEditorService,
  sessionInstructorService,
  sessionService,
  scheduleTimeSlotService,
  scheduleAvailableVenueService,
} from '../services';
import { partService, Part } from '../services/part-service';
import {
  sessionEditorReducer,
  initialSessionEditorState,
  PendingVenueAdd,
  PendingVenueRemove,
} from './session-editor-reducer';
import { useSessionEditorSessions } from './use-session-editor-sessions';
import { useSessionEditorVenues } from './use-session-editor-venues';
import { useSessionEditorTimeSlots } from './use-session-editor-timeslots';

/**
 * セッション編集用のカスタムフック
 */
export const useSessionEditor = (scheduleId: string) => {
  const [state, dispatch] = useReducer(sessionEditorReducer, initialSessionEditorState);

  const [parts, setParts] = useState<Part[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 初期状態を保持（リセット用）
  const originalSessionsRef = useRef<Session[]>([]);
  const originalInstructorsRef = useRef<any[]>([]);
  const originalVenuesRef = useRef<VenueInfo[]>([]);
  const originalTimeSlotsRef = useRef<TimeSlot[]>([]);
  const originalTimeSlotCountRef = useRef<number>(0);

  // サブフックのリセット関数をrefで保持（循環依存回避）
  const resetAllPendingRef = useRef<() => void>(() => {});

  /**
   * スケジュール詳細を取得
   */
  const fetchScheduleDetails = useCallback(async () => {
    if (!scheduleId || scheduleId.trim() === '') {
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // 並列でデータを取得
      const [basicSchedule, details, allParts] = await Promise.all([
        practiceScheduleEditorService.getBasicSchedule(scheduleId),
        practiceScheduleEditorService.getScheduleDetails(scheduleId),
        partService.getAllParts(),
      ]);

      if (!basicSchedule) {
        throw new Error(`スケジュールID ${scheduleId} が見つかりません。正しいスケジュールIDを指定してください。`);
      }

      setParts(allParts);

      // idealフォーマットからセッション情報を抽出
      const sessions: Session[] = [];
      const timeSchedule = details.time_schedule;

      Object.entries(timeSchedule).forEach(([time, venueSessions]) => {
        Object.entries(venueSessions).forEach(([venueId, parts]) => {
          parts.forEach((part: IdealPartInfo, index: number) => {
            const sessionId = part.part_id || `temp_${scheduleId}_${venueId}_${time}_${index}`;

            const [hours, minutes] = time.split(':').map(Number);
            const endHours = minutes >= 30 ? hours + 1 : hours;
            const endMinutes = minutes >= 30 ? 0 : 30;
            const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

            sessions.push({
              id: sessionId,
              schedule_id: details.schedule_info.id,
              part_id: part.part_id,
              part_name: part.part_name,
              slot_order: part.slot_order || 0,
              schedule_available_venue_id: venueId,
              priority: 1,
              start_time: time,
              end_time: endTime,
              created_at: '',
              updated_at: '',
            });
          });
        });
      });

      dispatch({ type: 'SET_SESSIONS', payload: sessions });

      // 会場情報を設定
      const venueMap = new Map<string, VenueInfo>();
      details.venues.forEach(venue => {
        if (!venueMap.has(venue.id)) {
          venueMap.set(venue.id, {
            id: venue.id,
            venue_id: venue.venue_id,
            name: venue.name,
            is_preferred: false,
            priority: venue.priority,
            notes: '',
          });
        }
      });
      const venues: VenueInfo[] = Array.from(venueMap.values());

      if (venues.length === 0 && basicSchedule) {
        venues.push({
          id: 'default-venue-1',
          name: 'メイン会場',
          is_preferred: false,
          priority: 1,
          notes: '',
        });
      }

      dispatch({ type: 'SET_VENUES', payload: venues });

      // 時間スロットの取得
      let timeSlots: TimeSlot[] = [];

      try {
        const dbTimeSlots = await scheduleTimeSlotService.getTimeSlotsBySchedule(scheduleId);
        if (dbTimeSlots && dbTimeSlots.length > 0) {
          timeSlots = scheduleTimeSlotService.convertToTimeSlots(dbTimeSlots);
        } else if (basicSchedule) {
          const startTime = basicSchedule.start_time || '09:00';
          const endTime = basicSchedule.end_time || '17:00';
          const divisionCount = basicSchedule.division_count || 6;
          timeSlots = practiceScheduleEditorService.generateTimeSlots(startTime, endTime, divisionCount);
        }
      } catch (error) {
        if (basicSchedule) {
          const startTime = basicSchedule.start_time || '09:00';
          const endTime = basicSchedule.end_time || '17:00';
          const divisionCount = basicSchedule.division_count || 6;
          timeSlots = practiceScheduleEditorService.generateTimeSlots(startTime, endTime, divisionCount);
        }
      }

      dispatch({ type: 'SET_TIME_SLOTS', payload: timeSlots });

      // インストラクター情報を取得
      try {
        const instructors = await sessionInstructorService.getSessionInstructors(scheduleId);
        dispatch({ type: 'SET_INSTRUCTORS', payload: instructors });
        originalInstructorsRef.current = JSON.parse(JSON.stringify(instructors));
      } catch (instructorError) {
        dispatch({ type: 'SET_INSTRUCTORS', payload: [] });
        originalInstructorsRef.current = [];
      }

      // 初期状態を保存（リセット用）
      originalSessionsRef.current = JSON.parse(JSON.stringify(sessions));
      originalVenuesRef.current = JSON.parse(JSON.stringify(venues));
      originalTimeSlotsRef.current = JSON.parse(JSON.stringify(timeSlots));
      originalTimeSlotCountRef.current = timeSlots.length;

      // 未保存の変更をクリア
      resetAllPendingRef.current();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'スケジュール詳細の取得に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [scheduleId]);

  // サブフック
  const sessionsHook = useSessionEditorSessions(state, dispatch, scheduleId, fetchScheduleDetails);
  const venuesHook = useSessionEditorVenues(state, dispatch, scheduleId);
  const timeSlotsHook = useSessionEditorTimeSlots(state, dispatch, originalTimeSlotCountRef);

  // リセット関数をrefに設定
  useEffect(() => {
    resetAllPendingRef.current = () => {
      sessionsHook.resetPendingMoves();
      venuesHook.resetPendingVenueChanges();
      timeSlotsHook.resetPendingTimeSlotChanges();
    };
  });

  /**
   * 未保存の変更があるかどうか
   */
  const hasUnsavedChanges =
    sessionsHook.pendingSessionMoves.length > 0 ||
    sessionsHook.pendingInstructorMoves.length > 0 ||
    venuesHook.pendingVenueChanges.length > 0 ||
    timeSlotsHook.pendingTimeSlotChange !== null ||
    timeSlotsHook.pendingTimeSlotTimeEdits.length > 0;

  /**
   * すべての変更を一括保存
   */
  const saveAllChanges = useCallback(async () => {
    if (!hasUnsavedChanges) {
      return { success: true, errors: [] };
    }

    setIsSaving(true);
    dispatch({ type: 'SET_ERROR', payload: null });

    const errors: string[] = [];

    try {
      // 1. タイムスロットの変更を保存
      if (timeSlotsHook.pendingTimeSlotChange) {
        try {
          const basicSchedule = await practiceScheduleEditorService.getBasicSchedule(scheduleId);
          const actualStartTime = basicSchedule?.start_time || '09:00:00';
          const actualEndTime = basicSchedule?.end_time || '17:00:00';

          await practiceScheduleEditorService.updateScheduleTime(
            scheduleId,
            actualStartTime,
            actualEndTime,
            timeSlotsHook.pendingTimeSlotChange.newCount
          );
        } catch (error) {
          errors.push(`タイムスロットの変更に失敗: ${error instanceof Error ? error.message : '不明なエラー'}`);
        }
      }

      // 2. 会場の変更を保存
      const venueRemoves = venuesHook.pendingVenueChanges.filter(c => c.type === 'remove') as PendingVenueRemove[];
      for (const remove of venueRemoves) {
        try {
          await scheduleAvailableVenueService.delete(remove.venueId);
        } catch (error) {
          errors.push(`会場(${remove.venueId})の削除に失敗: ${error instanceof Error ? error.message : '不明なエラー'}`);
        }
      }

      const venueAdds = venuesHook.pendingVenueChanges.filter(c => c.type === 'add') as PendingVenueAdd[];
      const validVenueAdds = venueAdds.filter(add => add.venue.venue_id !== undefined);
      if (validVenueAdds.length > 0) {
        try {
          const bulkData = {
            schedule_id: scheduleId,
            venues: validVenueAdds.map(add => ({
              venue_id: add.venue.venue_id!,
              is_preferred: add.venue.is_preferred || false,
              priority: add.venue.priority || 0,
              notes: add.venue.notes || '',
            })),
          };
          await scheduleAvailableVenueService.createBulk(bulkData);
        } catch (error) {
          errors.push(`会場の追加に失敗: ${error instanceof Error ? error.message : '不明なエラー'}`);
        }
      }

      // 3. セッションの移動を保存
      for (const move of sessionsHook.pendingSessionMoves) {
        try {
          await sessionService.moveSession(move.sessionId, move.venueId, move.slotOrder);
        } catch (error) {
          errors.push(`セッション(${move.sessionId})の移動に失敗: ${error instanceof Error ? error.message : '不明なエラー'}`);
        }
      }

      // 4. インストラクターの移動を保存
      for (const move of sessionsHook.pendingInstructorMoves) {
        try {
          await sessionInstructorService.moveSessionInstructor(move.instructorId, move.venueId, move.slotOrder);
        } catch (error) {
          errors.push(`インストラクター(${move.instructorId})の移動に失敗: ${error instanceof Error ? error.message : '不明なエラー'}`);
        }
      }

      // 5. タイムスロットの時刻編集を保存
      for (const edit of timeSlotsHook.pendingTimeSlotTimeEdits) {
        try {
          await scheduleTimeSlotService.updateTimeSlot(edit.timeSlotId, {
            start_time: edit.startTime,
            end_time: edit.endTime,
          });
        } catch (error) {
          errors.push(`タイムスロット(${edit.timeSlotId})の時刻編集に失敗: ${error instanceof Error ? error.message : '不明なエラー'}`);
        }
      }

      if (errors.length === 0) {
        // resetはfetchScheduleDetails内で行われる
        await fetchScheduleDetails();

        return { success: true, errors: [] };
      } else {
        dispatch({ type: 'SET_ERROR', payload: `一部の変更の保存に失敗しました: ${errors.join(', ')}` });
        return { success: false, errors };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '変更の保存に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, errors: [errorMessage] };
    } finally {
      setIsSaving(false);
    }
  }, [hasUnsavedChanges, sessionsHook.pendingSessionMoves, sessionsHook.pendingInstructorMoves, venuesHook.pendingVenueChanges, timeSlotsHook.pendingTimeSlotChange, timeSlotsHook.pendingTimeSlotTimeEdits, scheduleId, fetchScheduleDetails]);

  /**
   * 変更を破棄して元に戻す
   */
  const discardChanges = useCallback(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    if (originalSessionsRef.current.length > 0) {
      dispatch({ type: 'SET_SESSIONS', payload: originalSessionsRef.current });
    }
    if (originalInstructorsRef.current.length > 0) {
      dispatch({ type: 'SET_INSTRUCTORS', payload: originalInstructorsRef.current });
    }
    if (originalVenuesRef.current.length > 0) {
      dispatch({ type: 'SET_VENUES', payload: originalVenuesRef.current });
    }
    if (originalTimeSlotsRef.current.length > 0) {
      dispatch({ type: 'SET_TIME_SLOTS', payload: originalTimeSlotsRef.current });
    }

    resetAllPendingRef.current();
  }, [hasUnsavedChanges]);

  // 初期化
  useEffect(() => {
    if (!scheduleId || scheduleId.trim() === '') {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    fetchScheduleDetails();
  }, [scheduleId]);

  // 未保存の変更数を計算
  const pendingChangesCount =
    sessionsHook.pendingSessionMoves.length +
    sessionsHook.pendingInstructorMoves.length +
    venuesHook.pendingVenueChanges.length +
    (timeSlotsHook.pendingTimeSlotChange ? 1 : 0) +
    timeSlotsHook.pendingTimeSlotTimeEdits.length;

  return {
    ...state,
    parts,
    fetchScheduleDetails,
    createSession: sessionsHook.createSession,
    updateSession: sessionsHook.updateSession,
    deleteSession: sessionsHook.deleteSession,
    moveSession: sessionsHook.moveSession,
    moveInstructor: sessionsHook.moveInstructor,
    selectSession: sessionsHook.selectSession,
    openModal: sessionsHook.openModal,
    closeModal: sessionsHook.closeModal,
    toggleEditMode: sessionsHook.toggleEditMode,
    updateTimeSlot: timeSlotsHook.updateTimeSlot,
    addVenues: venuesHook.addVenues,
    removeVenue: venuesHook.removeVenue,
    updateVenue: venuesHook.updateVenue,
    addTimeSlot: timeSlotsHook.addTimeSlot,
    removeTimeSlot: timeSlotsHook.removeTimeSlot,
    hasUnsavedChanges,
    isSaving,
    saveAllChanges,
    discardChanges,
    pendingChangesCount,
  };
};
