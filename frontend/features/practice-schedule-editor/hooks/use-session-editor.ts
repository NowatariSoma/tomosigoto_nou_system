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
import {
  IdealFormatApiResponse,
  IdealVenueInfo,
  IdealPartInfo
} from '../types/api';
import { sessionService, practiceScheduleEditorService } from '../services';
import { partService, Part } from '../services/part-service';
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
    edit_mode: 'edit',
    loading: false,
    error: null,
  });

  const [parts, setParts] = useState<Part[]>([]);

  /**
   * スケジュール詳細を取得
   */
  const fetchScheduleDetails = useCallback(async () => {
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
        throw new Error('スケジュールが見つかりません');
      }

      setParts(allParts);
      
      // idealフォーマットからセッション情報を抽出
      const sessions: Session[] = [];
      const timeSchedule = details.time_schedule;

      // time_scheduleからセッション情報を抽出
      Object.entries(timeSchedule).forEach(([time, venueSessions]) => {
        Object.entries(venueSessions).forEach(([venueId, parts]) => {
          parts.forEach((part: IdealPartInfo, index: number) => {
            // part_idがあればそれを使用、なければセッションIDを生成
            const sessionId = part.part_id || `temp_${scheduleId}_${venueId}_${time}_${index}`;

            // 終了時刻を30分後に設定（時間スロットの間隔と一致させる）
            const [hours, minutes] = time.split(':').map(Number);
            const endHours = minutes >= 30 ? hours + 1 : hours;
            const endMinutes = minutes >= 30 ? 0 : 30;
            const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

            sessions.push({
              id: sessionId,
              schedule_id: details.schedule_info.id,
              part_id: part.part_id,
              title: part.session_title || part.part_name || 'セッション',
              slot_order: part.slot_order || 0,
              schedule_available_venue_id: venueId, // 実際の会場IDを使用
              priority: 1, // デフォルトの優先度
              start_time: time,
              end_time: endTime,
              created_at: '',
              updated_at: '',
            });
          });
        });
      });
      
      dispatch({ type: 'SET_SESSIONS', payload: sessions });

      // 会場情報を設定（idealフォーマットから変換）
      const venues: VenueInfo[] = details.venues.map(venue => ({
        id: venue.id,
        name: venue.name,
        is_preferred: false, // デフォルト値
        priority: venue.priority,
        notes: '',
      }));

      // 会場が空の場合、デフォルト会場を設定
      if (venues.length === 0 && basicSchedule) {
        console.warn('会場情報が空です。デフォルト会場を設定します。');
        venues.push({
          id: 'default-venue-1',
          name: 'メイン会場',
          is_preferred: false,
          priority: 1,
          notes: '',
        });
      }

      dispatch({ type: 'SET_VENUES', payload: venues });

      // 時間スロットの生成（常にdivision_countベースで生成）
      let timeSlots: TimeSlot[] = [];

      if (basicSchedule) {
        const startTime = basicSchedule.start_time || '09:00';
        const endTime = basicSchedule.end_time || '17:00';
        const divisionCount = basicSchedule.division_count || 6;
        
        timeSlots = practiceScheduleEditorService.generateTimeSlots(startTime, endTime, divisionCount);
      }

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
      const slotIndex = state.time_slots.findIndex(slot => slot.time === formData.time_slot);
      const slotOrder = slotIndex !== -1 ? slotIndex + 1 : 1;

      const newSession = await sessionService.createSession({
        schedule_id: scheduleId,
        part_id: formData.part_id || undefined,
        title: formData.title,
        slot_order: slotOrder,
        schedule_available_venue_id: formData.venue_id || undefined,
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
  }, [scheduleId, state.time_slots]);

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
      const updatedSession = await sessionService.moveSession(sessionId, venueId, slotOrder);
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
    parts,
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
