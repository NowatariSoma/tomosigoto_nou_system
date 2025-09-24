/**
 * セッション編集用のカスタムフック
 */

import { useState, useCallback, useEffect, useReducer } from 'react';
import { 
  Session, 
  VenueInfo, 
  TimeSlot, 
  SessionFormData, 
  SessionEditorState, 
  SessionEditorAction,
  EditMode 
} from '../types/session-editor';
import { sessionService, practiceScheduleEditorService } from '../services';
import { generateTimeSlots } from '../mappers/time-slot-mapper';

/**
 * セッション編集の状態管理
 */
const sessionEditorReducer = (
  state: SessionEditorState, 
  action: SessionEditorAction
): SessionEditorState => {
  switch (action.type) {
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
    case 'SET_VENUES':
      return { ...state, venues: action.payload };
    case 'SET_TIME_SLOTS':
      return { ...state, time_slots: action.payload };
    case 'SELECT_SESSION':
      return { ...state, selected_session: action.payload };
    case 'OPEN_MODAL':
      return { ...state, is_modal_open: true };
    case 'CLOSE_MODAL':
      return { ...state, is_modal_open: false, selected_session: null };
    case 'SET_EDIT_MODE':
      return { ...state, edit_mode: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_SESSION':
      return { ...state, sessions: [...state.sessions, action.payload] };
    case 'UPDATE_SESSION':
      return { 
        ...state, 
        sessions: state.sessions.map(s => 
          s.id === action.payload.id ? action.payload : s
        ) 
      };
    case 'DELETE_SESSION':
      return { 
        ...state, 
        sessions: state.sessions.filter(s => s.id !== action.payload) 
      };
    default:
      return state;
  }
};

/**
 * セッション編集用のカスタムフック
 */
export const useSessionEditor = (scheduleId: string) => {
  const [state, dispatch] = useReducer(sessionEditorReducer, {
    sessions: [],
    venues: [],
    time_slots: [],
    selected_session: null,
    is_modal_open: false,
    edit_mode: 'view',
    loading: false,
    error: null,
  });

  /**
   * スケジュール詳細を取得
   */
  const fetchScheduleDetails = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // まず基本情報を取得してスケジュールが存在するか確認
      const basicSchedule = await practiceScheduleEditorService.getBasicSchedule(scheduleId);
      if (!basicSchedule) {
        throw new Error('スケジュールが見つかりません');
      }

      // 詳細情報を取得
      const details = await practiceScheduleEditorService.getScheduleDetails(scheduleId);
      
      // セッション情報を設定
      const sessions = details.sessions.map(session => ({
        id: session.id,
        schedule_id: session.schedule_id,
        part_id: session.part_id,
        title: session.title,
        slot_order: session.slot_order,
        schedule_available_venue_id: session.schedule_available_venue_id,
        priority: session.priority,
        start_time: session.start_time,
        end_time: session.end_time,
        created_at: session.created_at,
        updated_at: session.updated_at,
      }));
      dispatch({ type: 'SET_SESSIONS', payload: sessions });

      // 会場情報を設定
      const venues = details.available_venues.map(venue => ({
        id: venue.id,
        name: venue.name,
        is_preferred: venue.is_preferred,
        priority: venue.priority,
        notes: venue.notes,
      }));
      dispatch({ type: 'SET_VENUES', payload: venues });

      // 時間スロットを生成
      const timeSlots = generateTimeSlots(details.start_time, details.end_time);
      dispatch({ type: 'SET_TIME_SLOTS', payload: timeSlots });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'スケジュール詳細の取得に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [scheduleId]);

  /**
   * セッションを作成
   */
  const createSession = useCallback(async (formData: SessionFormData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const newSession = await sessionService.createSession({
        schedule_id: scheduleId,
        title: formData.title,
        slot_order: 0, // 後で計算
        schedule_available_venue_id: formData.venue_id,
        priority: formData.priority,
      });

      dispatch({ type: 'ADD_SESSION', payload: newSession });
      dispatch({ type: 'CLOSE_MODAL' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'セッションの作成に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [scheduleId]);

  /**
   * セッションを更新
   */
  const updateSession = useCallback(async (sessionId: string, formData: SessionFormData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const updatedSession = await sessionService.updateSession(sessionId, {
        title: formData.title,
        schedule_available_venue_id: formData.venue_id,
        priority: formData.priority,
      });

      dispatch({ type: 'UPDATE_SESSION', payload: updatedSession });
      dispatch({ type: 'CLOSE_MODAL' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'セッションの更新に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  /**
   * セッションを削除
   */
  const deleteSession = useCallback(async (sessionId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      await sessionService.deleteSession(sessionId);
      dispatch({ type: 'DELETE_SESSION', payload: sessionId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'セッションの削除に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  /**
   * セッションを移動（ドラッグ&ドロップ用）
   */
  const moveSession = useCallback(async (
    sessionId: string, 
    venueId: string, 
    timeSlot: string, 
    slotOrder: number
  ) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const updatedSession = await sessionService.moveSession(sessionId, venueId, timeSlot, slotOrder);
      dispatch({ type: 'UPDATE_SESSION', payload: updatedSession });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'セッションの移動に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  /**
   * セッション選択
   */
  const selectSession = useCallback((session: Session | null) => {
    dispatch({ type: 'SELECT_SESSION', payload: session });
  }, []);

  /**
   * モーダルを開く
   */
  const openModal = useCallback(() => {
    dispatch({ type: 'OPEN_MODAL' });
  }, []);

  /**
   * モーダルを閉じる
   */
  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, []);

  /**
   * 編集モードを切り替え
   */
  const toggleEditMode = useCallback(() => {
    const newMode: EditMode = state.edit_mode === 'view' ? 'edit' : 'view';
    dispatch({ type: 'SET_EDIT_MODE', payload: newMode });
  }, [state.edit_mode]);

  // 初期化
  useEffect(() => {
    if (scheduleId) {
      fetchScheduleDetails();
    }
  }, [scheduleId, fetchScheduleDetails]);

  return {
    ...state,
    fetchScheduleDetails,
    createSession,
    updateSession,
    deleteSession,
    moveSession,
    selectSession,
    openModal,
    closeModal,
    toggleEditMode,
  };
};
