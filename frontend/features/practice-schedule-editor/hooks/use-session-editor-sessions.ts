/**
 * セッション編集 - セッション・インストラクター操作サブフック
 */

import { useState, useCallback } from 'react';
import {
  Session,
  SessionFormData,
  SessionEditorState,
  SessionEditorAction,
  EditMode,
} from '../types/session-editor';
import { sessionService, sessionInstructorService } from '../services';
import type { PendingSessionMove, PendingInstructorMove } from './session-editor-reducer';

export interface UseSessionEditorSessionsReturn {
  createSession: (formData: SessionFormData) => Promise<void>;
  updateSession: (sessionId: string, formData: SessionFormData) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  moveSession: (sessionId: string, venueId: string, timeSlot: string, slotOrder: number) => void;
  moveInstructor: (instructorId: string, venueId: string, slotOrder: number) => void;
  selectSession: (session: Session | null) => void;
  openModal: () => void;
  closeModal: () => void;
  toggleEditMode: () => void;
  pendingSessionMoves: PendingSessionMove[];
  pendingInstructorMoves: PendingInstructorMove[];
  resetPendingMoves: () => void;
}

export function useSessionEditorSessions(
  state: SessionEditorState,
  dispatch: React.Dispatch<SessionEditorAction>,
  scheduleId: string,
  fetchScheduleDetails: () => Promise<void>,
): UseSessionEditorSessionsReturn {
  const [pendingSessionMoves, setPendingSessionMoves] = useState<PendingSessionMove[]>([]);
  const [pendingInstructorMoves, setPendingInstructorMoves] = useState<PendingInstructorMove[]>([]);

  /**
   * セッションを作成
   */
  const createSession = useCallback(async (formData: SessionFormData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const slotIndex = state.time_slots.findIndex(slot => slot.time === formData.time_slot);
      const slotOrder = slotIndex !== -1 ? slotIndex + 1 : 1;

      const sessionData = {
        schedule_id: scheduleId,
        part_id: formData.part_id || undefined,
        slot_order: slotOrder,
        venue_id: formData.venue_id || undefined,
        priority: formData.priority,
      };

      const newSession = await sessionService.createSession(sessionData);

      // インストラクターが選択されている場合、登録APIを呼び出す
      if (formData.instructor_id && formData.instructor_id !== 'none') {
        try {
          const instructorData = {
            attendance_id: formData.instructor_id,
            schedule_id: scheduleId,
            schedule_available_venue_id: formData.venue_id || undefined,
            slot_order: slotOrder,
          };

          await sessionInstructorService.createSessionInstructor(instructorData);
        } catch (instructorError) {
          const instructorErrorMessage = instructorError instanceof Error ? instructorError.message : 'インストラクターの登録に失敗しました';
          alert(`セッションは作成されましたが、インストラクターの登録に失敗しました\n\n${instructorErrorMessage}\n\n後でインストラクターを手動で設定してください。`);
        }
      }

      // セッションのstart_timeとend_timeを設定
      const timeSlotObj = state.time_slots.find(slot => slot.time === formData.time_slot);
      const sessionWithTime = {
        ...newSession,
        start_time: formData.time_slot,
        end_time: timeSlotObj?.end_time || formData.time_slot,
      };

      dispatch({ type: 'ADD_SESSION', payload: sessionWithTime });
      dispatch({ type: 'CLOSE_MODAL' });

      // 最新のスケジュール詳細を取得して状態を更新
      fetchScheduleDetails();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'セッションの作成に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [scheduleId, state.time_slots, dispatch, fetchScheduleDetails]);

  /**
   * セッションを更新
   */
  const updateSession = useCallback(async (sessionId: string, formData: SessionFormData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const updatedSession = await sessionService.updateSession(sessionId, {
        schedule_available_venue_id: formData.venue_id,
        priority: formData.priority,
      });

      // インストラクターの処理
      try {
        if (formData.instructor_id === 'none') {
          await sessionInstructorService.deleteSessionInstructorsBySchedule(sessionId);
        } else if (formData.instructor_id && formData.instructor_id !== '') {
          await sessionInstructorService.deleteSessionInstructorsBySchedule(sessionId);

          const instructorData = {
            attendance_id: formData.instructor_id,
            schedule_id: scheduleId,
            schedule_available_venue_id: formData.venue_id || undefined,
            slot_order: 1,
          };

          await sessionInstructorService.createSessionInstructor(instructorData);
        }
      } catch (instructorError) {
        // インストラクター更新に失敗してもセッション更新は成功として扱う
      }

      dispatch({ type: 'UPDATE_SESSION', payload: updatedSession });
      dispatch({ type: 'CLOSE_MODAL' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'セッションの更新に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [scheduleId, dispatch]);

  /**
   * セッションを削除（楽観的UI更新）
   */
  const deleteSession = useCallback(async (sessionId: string) => {
    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) {
      return;
    }

    if (!confirm(`セッションを削除しますか？`)) {
      return;
    }

    // 楽観的UI更新
    dispatch({ type: 'DELETE_SESSION', payload: sessionId });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      await sessionService.deleteSession(sessionId);
    } catch (error) {
      // API失敗: セッションを復元
      dispatch({ type: 'ADD_SESSION', payload: session });
      const errorMessage = error instanceof Error ? error.message : 'セッションの削除に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      alert(`セッションの削除に失敗しました\n\n${errorMessage}\n\nセッションを復元しました。`);
    }
  }, [state.sessions, dispatch]);

  /**
   * セッションを移動（ドラッグ&ドロップ用、ローカルのみ）
   */
  const moveSession = useCallback((
    sessionId: string,
    venueId: string,
    _timeSlot: string,
    slotOrder: number
  ) => {
    const originalSession = state.sessions.find(s => s.id === sessionId);
    if (!originalSession) {
      return;
    }

    const updatedSession: Session = {
      ...originalSession,
      schedule_available_venue_id: venueId,
      slot_order: slotOrder,
      start_time: _timeSlot,
    };

    dispatch({ type: 'UPDATE_SESSION', payload: updatedSession });

    setPendingSessionMoves(prev => {
      const filtered = prev.filter(m => m.sessionId !== sessionId);
      return [...filtered, { sessionId, venueId, slotOrder }];
    });
  }, [state.sessions, dispatch]);

  /**
   * インストラクターを移動（ドラッグ&ドロップ用、ローカルのみ）
   */
  const moveInstructor = useCallback((
    instructorId: string,
    venueId: string,
    slotOrder: number
  ) => {
    const originalInstructor = state.instructors.find(i => i.id === instructorId);
    if (!originalInstructor) {
      return;
    }

    const updatedInstructor = {
      ...originalInstructor,
      schedule_available_venue_id: venueId,
      slot_order: slotOrder,
    };

    dispatch({ type: 'UPDATE_INSTRUCTOR', payload: updatedInstructor });

    setPendingInstructorMoves(prev => {
      const filtered = prev.filter(m => m.instructorId !== instructorId);
      return [...filtered, { instructorId, venueId, slotOrder }];
    });
  }, [state.instructors, dispatch]);

  const selectSession = useCallback((session: Session | null) => {
    dispatch({ type: 'SELECT_SESSION', payload: session });
  }, [dispatch]);

  const openModal = useCallback(() => {
    dispatch({ type: 'OPEN_MODAL' });
  }, [dispatch]);

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, [dispatch]);

  const toggleEditMode = useCallback(() => {
    const newMode: EditMode = state.edit_mode === 'view' ? 'edit' : 'view';
    dispatch({ type: 'SET_EDIT_MODE', payload: newMode });
  }, [state.edit_mode, dispatch]);

  const resetPendingMoves = useCallback(() => {
    setPendingSessionMoves([]);
    setPendingInstructorMoves([]);
  }, []);

  return {
    createSession,
    updateSession,
    deleteSession,
    moveSession,
    moveInstructor,
    selectSession,
    openModal,
    closeModal,
    toggleEditMode,
    pendingSessionMoves,
    pendingInstructorMoves,
    resetPendingMoves,
  };
}
