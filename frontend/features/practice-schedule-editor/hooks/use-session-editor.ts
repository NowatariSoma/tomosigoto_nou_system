/**
 * セッション編集用のカスタムフック
 */

import { useState, useCallback, useEffect, useReducer, useRef } from 'react';
import {
  Session,
  VenueInfo,
  TimeSlot,
  SessionFormData,
  SessionEditorState,
  SessionEditorAction,
  EditMode
} from '../types/session-editor';

/**
 * 未保存の移動変更を追跡するための型
 */
interface PendingSessionMove {
  sessionId: string;
  venueId: string;
  slotOrder: number;
}

interface PendingInstructorMove {
  instructorId: string;
  venueId: string;
  slotOrder: number;
}

/**
 * 未保存の会場変更を追跡するための型
 */
interface PendingVenueAdd {
  type: 'add';
  venue: VenueInfo;
  tempId: string; // ローカルで生成した一時ID
}

interface PendingVenueRemove {
  type: 'remove';
  venueId: string; // schedule_available_venue.id
}

type PendingVenueChange = PendingVenueAdd | PendingVenueRemove;

/**
 * 未保存のタイムスロット変更を追跡するための型（追加・削除用）
 */
interface PendingTimeSlotChange {
  originalCount: number; // 変更前の数
  newCount: number;      // 変更後の数
}

/**
 * 未保存のタイムスロット時刻編集を追跡するための型
 */
interface PendingTimeSlotTimeEdit {
  timeSlotId: string;
  startTime: string;
  endTime: string;
}
import {
  IdealFormatApiResponse,
  IdealVenueInfo,
  IdealPartInfo
} from '../types/api';
import { sessionService, practiceScheduleEditorService, sessionInstructorService, scheduleTimeSlotService, scheduleAvailableVenueService } from '../services';
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
    case 'SET_INSTRUCTORS':
      return { ...state, instructors: action.payload };
    case 'UPDATE_INSTRUCTOR':
      console.log('DEBUG UPDATE_INSTRUCTOR: action.payload =', action.payload);
      console.log('DEBUG UPDATE_INSTRUCTOR: state.instructors =', state.instructors);
      const updatedInstructors = state.instructors.map(i => {
        console.log(`DEBUG UPDATE_INSTRUCTOR: 比較 ${i.id} === ${action.payload.id}`);
        if (i.id === action.payload.id) {
          console.log('DEBUG UPDATE_INSTRUCTOR: マッチしました。更新:', action.payload);
          return action.payload;
        }
        return i;
      });
      console.log('DEBUG UPDATE_INSTRUCTOR: updatedInstructors =', updatedInstructors);
      return {
        ...state,
        instructors: updatedInstructors
      };
    case 'SET_VENUES':
      return { ...state, venues: action.payload };
    case 'ADD_VENUES':
      return { ...state, venues: [...state.venues, ...action.payload] };
    case 'REMOVE_VENUE':
      return {
        ...state,
        venues: state.venues.filter(v => v.id !== action.payload)
      };
    case 'UPDATE_VENUE':
      return {
        ...state,
        venues: state.venues.map(v =>
          v.id === action.payload.id ? action.payload : v
        )
      };
    case 'SET_TIME_SLOTS':
      return { ...state, time_slots: action.payload };
    case 'UPDATE_TIME_SLOT':
      return { 
        ...state, 
        time_slots: state.time_slots.map(ts => {
          const isSameSlot = (action.payload.id && ts.id && ts.id === action.payload.id) || ts.time === action.payload.time;
          return isSameSlot ? action.payload : ts;
        }) 
      };
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
    instructors: [],
    venues: [],
    time_slots: [],
    selected_session: null,
    is_modal_open: false,
    edit_mode: 'edit',
    loading: false,
    error: null,
  });

  const [parts, setParts] = useState<Part[]>([]);

  // 未保存の変更を追跡
  const [pendingSessionMoves, setPendingSessionMoves] = useState<PendingSessionMove[]>([]);
  const [pendingInstructorMoves, setPendingInstructorMoves] = useState<PendingInstructorMove[]>([]);
  const [pendingVenueChanges, setPendingVenueChanges] = useState<PendingVenueChange[]>([]);
  const [pendingTimeSlotChange, setPendingTimeSlotChange] = useState<PendingTimeSlotChange | null>(null);
  const [pendingTimeSlotTimeEdits, setPendingTimeSlotTimeEdits] = useState<PendingTimeSlotTimeEdit[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 初期状態を保持（リセット用）
  const originalSessionsRef = useRef<Session[]>([]);
  const originalInstructorsRef = useRef<any[]>([]);
  const originalVenuesRef = useRef<VenueInfo[]>([]);
  const originalTimeSlotsRef = useRef<TimeSlot[]>([]);
  const originalTimeSlotCountRef = useRef<number>(0);

  /**
   * スケジュール詳細を取得
   */
  const fetchScheduleDetails = useCallback(async () => {
    // スケジュールIDが空の場合は何もしない
    if (!scheduleId || scheduleId.trim() === '') {
      console.log('fetchScheduleDetails: スケジュールIDが空のため、何もしません');
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      console.log(`スケジュール詳細を取得中: scheduleId=${scheduleId}`);
      console.log(`スケジュールID検証: scheduleId="${scheduleId}", length=${scheduleId.length}, trim="${scheduleId.trim()}"`);
      
      // 並列でデータを取得
      const [basicSchedule, details, allParts] = await Promise.all([
        practiceScheduleEditorService.getBasicSchedule(scheduleId),
        practiceScheduleEditorService.getScheduleDetails(scheduleId),
        partService.getAllParts(),
      ]);

      if (!basicSchedule) {
        console.error(`スケジュールID ${scheduleId} が見つかりません`);
        throw new Error(`スケジュールID ${scheduleId} が見つかりません。正しいスケジュールIDを指定してください。`);
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
              part_name: part.part_name, // パート名を追加
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
      // venue.idはschedule_available_venue_idを表す
      // venue.venue_idは元の会場マスターID
      const venueMap = new Map<string, VenueInfo>();
      details.venues.forEach(venue => {
        if (!venueMap.has(venue.id)) {
          venueMap.set(venue.id, {
            id: venue.id, // schedule_available_venue_id
            venue_id: venue.venue_id, // 元の会場マスターID
            name: venue.name,
            is_preferred: false, // デフォルト値
            priority: venue.priority,
            notes: '',
          });
        }
      });
      const venues: VenueInfo[] = Array.from(venueMap.values());

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

      // 時間スロットの取得（DBから取得、なければ計算で生成）
      let timeSlots: TimeSlot[] = [];

      try {
        // まずDBから時間スロットを取得
        const dbTimeSlots = await scheduleTimeSlotService.getTimeSlotsBySchedule(scheduleId);
        if (dbTimeSlots && dbTimeSlots.length > 0) {
          // DBから取得した時間スロットを使用
          timeSlots = scheduleTimeSlotService.convertToTimeSlots(dbTimeSlots);
          console.log('DBから時間スロットを取得:', timeSlots);
        } else {
          // DBに時間スロットがない場合は計算で生成（フォールバック）
          if (basicSchedule) {
            const startTime = basicSchedule.start_time || '09:00';
            const endTime = basicSchedule.end_time || '17:00';
            const divisionCount = basicSchedule.division_count || 6;
            
            timeSlots = practiceScheduleEditorService.generateTimeSlots(startTime, endTime, divisionCount);
            console.log('計算で時間スロットを生成:', timeSlots);
          }
        }
      } catch (error) {
        console.error('時間スロット取得エラー:', error);
        // エラー時は計算で生成（フォールバック）
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
        // 初期状態を保存（リセット用）
        originalInstructorsRef.current = JSON.parse(JSON.stringify(instructors));
      } catch (instructorError) {
        console.error('インストラクター情報の取得に失敗しました:', instructorError);
        dispatch({ type: 'SET_INSTRUCTORS', payload: [] });
        originalInstructorsRef.current = [];
      }

      // セッションの初期状態を保存（リセット用）
      originalSessionsRef.current = JSON.parse(JSON.stringify(sessions));
      // 会場の初期状態を保存
      originalVenuesRef.current = JSON.parse(JSON.stringify(venues));
      // タイムスロットの初期状態を保存
      originalTimeSlotsRef.current = JSON.parse(JSON.stringify(timeSlots));
      originalTimeSlotCountRef.current = timeSlots.length;

      // 未保存の変更をクリア
      setPendingSessionMoves([]);
      setPendingInstructorMoves([]);
      setPendingVenueChanges([]);
      setPendingTimeSlotChange(null);

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

      console.log('createSession - formData:', formData);
      console.log('createSession - slotIndex:', slotIndex, 'slotOrder:', slotOrder);
      console.log('createSession - part_id:', formData.part_id);
      console.log('createSession - venue_id:', formData.venue_id);
      console.log('createSession - scheduleId:', scheduleId);

      const sessionData = {
        schedule_id: scheduleId,
        part_id: formData.part_id || undefined,
        slot_order: slotOrder,
        venue_id: formData.venue_id || undefined,
        priority: formData.priority,
      };

      console.log('createSession - 送信データ:', sessionData);

      const newSession = await sessionService.createSession(sessionData);

      console.log('createSession - 作成成功:', newSession);

      // インストラクターが選択されている場合、登録APIを呼び出す
      if (formData.instructor_id && formData.instructor_id !== 'none') {
        console.log('createSession - インストラクター登録開始:', formData.instructor_id);
        
        try {
          const instructorData = {
            attendance_id: formData.instructor_id,
            schedule_id: scheduleId,
            schedule_available_venue_id: formData.venue_id || undefined,
            slot_order: slotOrder,
          };

          console.log('createSession - インストラクター登録データ:', instructorData);
          
          const instructorResult = await sessionInstructorService.createSessionInstructor(instructorData);
          
          console.log('createSession - インストラクター登録成功:', instructorResult);
        } catch (instructorError) {
          console.error('createSession - インストラクター登録エラー:', instructorError);
          // インストラクター登録に失敗してもセッション作成は成功として扱う
          // ユーザーには警告を表示
          const instructorErrorMessage = instructorError instanceof Error ? instructorError.message : 'インストラクターの登録に失敗しました';
          alert(`⚠️ セッションは作成されましたが、インストラクターの登録に失敗しました\n\n${instructorErrorMessage}\n\n後でインストラクターを手動で設定してください。`);
        }
      } else if (formData.instructor_id === 'none') {
        console.log('createSession - インストラクターなしが選択されました');
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
      console.error('createSession - エラー:', error);
      const errorMessage = error instanceof Error ? error.message : 'セッションの作成に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error; // エラーを再スローしてモーダルで表示できるようにする
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
        schedule_available_venue_id: formData.venue_id,
        priority: formData.priority,
      });

      // インストラクターの処理
      try {
        // インストラクターが明示的に選択された場合のみ処理
        if (formData.instructor_id === 'none') {
          // 「インストラクターなし」が選択された場合、既存のインストラクターを削除
          await sessionInstructorService.deleteSessionInstructorsBySchedule(sessionId);
          console.log('updateSession - インストラクターなしが選択されました');
        } else if (formData.instructor_id && formData.instructor_id !== '') {
          // 具体的なインストラクターが選択された場合、削除してから新しく登録
          await sessionInstructorService.deleteSessionInstructorsBySchedule(sessionId);
          
          const instructorData = {
            attendance_id: formData.instructor_id,
            schedule_id: scheduleId,
            schedule_available_venue_id: formData.venue_id || undefined,
            slot_order: 1, // 更新時はslot_orderを1に設定
          };
          
          console.log('updateSession - インストラクター登録データ:', instructorData);
          await sessionInstructorService.createSessionInstructor(instructorData);
          console.log('updateSession - インストラクター更新成功');
        } else {
          // instructor_idが空文字列の場合は、何もしない（既存のインストラクターを保持）
          console.log('updateSession - インストラクターは変更されません（既存のまま）');
        }
      } catch (instructorError) {
        console.error('updateSession - インストラクター更新エラー:', instructorError);
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
  }, [scheduleId, sessionInstructorService]);

  /**
   * セッションを削除
   * 楽観的UI更新: 即座にUIから削除し、API失敗時のみ復元
   */
  const deleteSession = useCallback(async (sessionId: string) => {
    // 削除確認
    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) {
      console.error('削除対象のセッションが見つかりません:', sessionId);
      return;
    }

    if (!confirm(`セッションを削除しますか？`)) {
      return;
    }

    // 楽観的UI更新: 即座にUIから削除
    dispatch({ type: 'DELETE_SESSION', payload: sessionId });
    dispatch({ type: 'SET_ERROR', payload: null });

    // バックグラウンドでAPI呼び出し
    try {
      await sessionService.deleteSession(sessionId);
      // API成功: 何もしない（すでにUIから削除済み）
    } catch (error) {
      // API失敗: セッションを復元
      console.error('セッション削除API失敗、復元します:', error);
      dispatch({ type: 'ADD_SESSION', payload: session });

      const errorMessage = error instanceof Error ? error.message : 'セッションの削除に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });

      // エラー通知
      alert(`❌ セッションの削除に失敗しました\n\n${errorMessage}\n\nセッションを復元しました。`);
    }
  }, [state.sessions]);

  /**
   * セッションを移動（ドラッグ&ドロップ用）
   * ローカルのみで状態を更新し、APIは呼び出さない（保存ボタンで一括保存）
   */
  const moveSession = useCallback((
    sessionId: string,
    venueId: string,
    timeSlot: string,
    slotOrder: number
  ) => {
    // 現在のセッション状態を取得
    const originalSession = state.sessions.find(s => s.id === sessionId);
    if (!originalSession) {
      console.error('移動対象のセッションが見つかりません:', sessionId);
      return;
    }

    console.log('DEBUG moveSession (local): sessionId =', sessionId, 'venueId =', venueId, 'slotOrder =', slotOrder);

    // ローカルで状態を更新
    const updatedSession: Session = {
      ...originalSession,
      schedule_available_venue_id: venueId,
      slot_order: slotOrder,
      start_time: timeSlot,
    };

    dispatch({ type: 'UPDATE_SESSION', payload: updatedSession });

    // 未保存の変更を記録（同じセッションの既存の変更は上書き）
    setPendingSessionMoves(prev => {
      const filtered = prev.filter(m => m.sessionId !== sessionId);
      return [...filtered, { sessionId, venueId, slotOrder }];
    });
  }, [state.sessions]);

  /**
   * インストラクターを移動（ドラッグ&ドロップ用）
   * ローカルのみで状態を更新し、APIは呼び出さない（保存ボタンで一括保存）
   */
  const moveInstructor = useCallback((
    instructorId: string,
    venueId: string,
    slotOrder: number
  ) => {
    // 現在のインストラクター状態を取得
    const originalInstructor = state.instructors.find(i => i.id === instructorId);
    if (!originalInstructor) {
      console.error('移動対象のインストラクターが見つかりません:', instructorId);
      return;
    }

    console.log('DEBUG moveInstructor (local): instructorId =', instructorId, 'venueId =', venueId, 'slotOrder =', slotOrder);

    // ローカルで状態を更新
    const updatedInstructor = {
      ...originalInstructor,
      schedule_available_venue_id: venueId,
      slot_order: slotOrder,
    };

    dispatch({ type: 'UPDATE_INSTRUCTOR', payload: updatedInstructor });

    // 未保存の変更を記録（同じインストラクターの既存の変更は上書き）
    setPendingInstructorMoves(prev => {
      const filtered = prev.filter(m => m.instructorId !== instructorId);
      return [...filtered, { instructorId, venueId, slotOrder }];
    });
  }, [state.instructors]);

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

  /**
   * 時間スロットを更新（ローカルのみ）
   * APIは保存ボタンで一括呼び出し
   */
  const updateTimeSlot = useCallback((updatedTimeSlot: TimeSlot) => {
    dispatch({ type: 'UPDATE_TIME_SLOT', payload: updatedTimeSlot });

    if (!updatedTimeSlot.id) {
      console.warn('updateTimeSlot (local): 時間スロットIDが存在しないため、変更を記録しません');
      return;
    }

    console.log('updateTimeSlot (local): 時間スロット時刻編集（未保存）', updatedTimeSlot);

    const normalizeTime = (value: string) => (value && value.length === 5 ? `${value}:00` : value);

    // 未保存の変更を記録（同じスロットの既存の変更は上書き）
    setPendingTimeSlotTimeEdits(prev => {
      const filtered = prev.filter(edit => edit.timeSlotId !== updatedTimeSlot.id);
      return [...filtered, {
        timeSlotId: updatedTimeSlot.id!,
        startTime: normalizeTime(updatedTimeSlot.start_time),
        endTime: normalizeTime(updatedTimeSlot.end_time),
      }];
    });
  }, []);

  /**
   * 会場を追加（ローカルのみ）
   * APIは保存ボタンで一括呼び出し
   */
  const addVenues = useCallback((venues: VenueInfo[]) => {
    if (!scheduleId || scheduleId.trim() === '') {
      console.error('addVenues: スケジュールIDが空です');
      return;
    }

    console.log('addVenues (local): 会場追加開始', venues);

    // 各会場に一時IDを生成してローカル状態に追加
    const newVenues: VenueInfo[] = venues.map(venue => {
      const tempId = `temp_venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: tempId, // 一時的なschedule_available_venue.id
        venue_id: venue.id, // 元の会場マスターID
        name: venue.name,
        campus: venue.campus,
        is_preferred: venue.is_preferred || false,
        priority: venue.priority || 0,
        notes: venue.notes || '',
      };
    });

    dispatch({ type: 'ADD_VENUES', payload: newVenues });

    // 未保存の変更を記録
    setPendingVenueChanges(prev => [
      ...prev,
      ...newVenues.map(venue => ({
        type: 'add' as const,
        venue,
        tempId: venue.id,
      })),
    ]);

    console.log('addVenues (local): 会場追加完了（未保存）', newVenues);
  }, [scheduleId]);

  /**
   * 会場を削除（ローカルのみ）
   * APIは保存ボタンで一括呼び出し
   */
  const removeVenue = useCallback((venueId: string) => {
    // 現在の会場情報を確認
    const venueToRemove = state.venues.find(v => v.id === venueId);
    if (!venueToRemove) {
      console.error('removeVenue: 削除対象の会場が見つかりません:', venueId);
      return;
    }

    console.log('removeVenue (local): 会場削除開始', venueId);

    // ローカル状態から削除
    dispatch({ type: 'REMOVE_VENUE', payload: venueId });

    // 一時IDの場合（新規追加した会場の削除）は、pendingVenueChangesから追加記録を削除
    if (venueId.startsWith('temp_venue_')) {
      setPendingVenueChanges(prev => prev.filter(
        change => !(change.type === 'add' && change.tempId === venueId)
      ));
      console.log('removeVenue (local): 新規追加の会場を削除（未保存リストからも削除）');
    } else {
      // 既存の会場の削除は、削除記録を追加
      setPendingVenueChanges(prev => [
        ...prev,
        { type: 'remove' as const, venueId },
      ]);
      console.log('removeVenue (local): 既存会場の削除を記録（未保存）');
    }
  }, [state.venues]);

  /**
   * 会場を更新
   */
  const updateVenue = useCallback((venueId: string, venue: VenueInfo) => {
    dispatch({ type: 'UPDATE_VENUE', payload: venue });
  }, []);

  /**
   * タイムスロットを追加（ローカルのみ）
   * APIは保存ボタンで一括呼び出し
   */
  const addTimeSlot = useCallback(() => {
    const currentSlotCount = state.time_slots.length;

    if (currentSlotCount >= 24) {
      alert('時間スロットは最大24個までです');
      return;
    }

    console.log('addTimeSlot (local): タイムスロット追加開始', { currentSlotCount });

    // 新しい数でタイムスロットを再生成
    const newCount = currentSlotCount + 1;

    // 現在の最初と最後のタイムスロットから時間範囲を取得
    let startTime = '09:00';
    let endTime = '17:00';
    if (state.time_slots.length > 0) {
      startTime = state.time_slots[0].time;
      // 最後のスロットのend_timeを使用
      const lastSlot = state.time_slots[state.time_slots.length - 1];
      endTime = lastSlot.end_time || '17:00';
    }

    // 新しいタイムスロットを生成
    const newTimeSlots = practiceScheduleEditorService.generateTimeSlots(
      startTime.includes(':') && startTime.length === 5 ? `${startTime}:00` : startTime,
      endTime.includes(':') && endTime.length === 5 ? `${endTime}:00` : endTime,
      newCount
    );

    dispatch({ type: 'SET_TIME_SLOTS', payload: newTimeSlots });

    // 未保存の変更を記録
    setPendingTimeSlotChange({
      originalCount: originalTimeSlotCountRef.current,
      newCount,
    });

    console.log('addTimeSlot (local): タイムスロット追加完了（未保存）', { newCount, newTimeSlots });
  }, [state.time_slots]);

  /**
   * タイムスロットを削除（ローカルのみ）
   * APIは保存ボタンで一括呼び出し
   */
  const removeTimeSlot = useCallback(() => {
    const currentSlotCount = state.time_slots.length;

    if (currentSlotCount <= 1) {
      alert('時間スロットは最低1個必要です');
      return;
    }

    console.log('removeTimeSlot (local): タイムスロット削除開始', { currentSlotCount });

    // 新しい数でタイムスロットを再生成
    const newCount = currentSlotCount - 1;

    // 現在の最初と最後のタイムスロットから時間範囲を取得
    let startTime = '09:00';
    let endTime = '17:00';
    if (state.time_slots.length > 0) {
      startTime = state.time_slots[0].time;
      // 最後のスロットのend_timeを使用
      const lastSlot = state.time_slots[state.time_slots.length - 1];
      endTime = lastSlot.end_time || '17:00';
    }

    // 新しいタイムスロットを生成
    const newTimeSlots = practiceScheduleEditorService.generateTimeSlots(
      startTime.includes(':') && startTime.length === 5 ? `${startTime}:00` : startTime,
      endTime.includes(':') && endTime.length === 5 ? `${endTime}:00` : endTime,
      newCount
    );

    dispatch({ type: 'SET_TIME_SLOTS', payload: newTimeSlots });

    // 未保存の変更を記録
    setPendingTimeSlotChange({
      originalCount: originalTimeSlotCountRef.current,
      newCount,
    });

    console.log('removeTimeSlot (local): タイムスロット削除完了（未保存）', { newCount, newTimeSlots });
  }, [state.time_slots]);

  /**
   * 未保存の変更があるかどうか
   */
  const hasUnsavedChanges =
    pendingSessionMoves.length > 0 ||
    pendingInstructorMoves.length > 0 ||
    pendingVenueChanges.length > 0 ||
    pendingTimeSlotChange !== null ||
    pendingTimeSlotTimeEdits.length > 0;

  /**
   * すべての変更を一括保存
   */
  const saveAllChanges = useCallback(async () => {
    if (!hasUnsavedChanges) {
      console.log('保存する変更がありません');
      return { success: true, errors: [] };
    }

    setIsSaving(true);
    dispatch({ type: 'SET_ERROR', payload: null });

    const errors: string[] = [];

    try {
      // 1. タイムスロットの変更を保存（会場やセッションより先に保存）
      if (pendingTimeSlotChange) {
        try {
          // 現在のスケジュール時間を取得
          const basicSchedule = await practiceScheduleEditorService.getBasicSchedule(scheduleId);
          const actualStartTime = basicSchedule?.start_time || '09:00:00';
          const actualEndTime = basicSchedule?.end_time || '17:00:00';

          // タイムスロット数を更新
          await practiceScheduleEditorService.updateScheduleTime(
            scheduleId,
            actualStartTime,
            actualEndTime,
            pendingTimeSlotChange.newCount
          );
          console.log('タイムスロット変更を保存:', pendingTimeSlotChange);
        } catch (error) {
          const errorMessage = `タイムスロットの変更に失敗: ${error instanceof Error ? error.message : '不明なエラー'}`;
          errors.push(errorMessage);
          console.error(errorMessage);
        }
      }

      // 2. 会場の変更を保存
      // 削除を先に処理
      const venueRemoves = pendingVenueChanges.filter(c => c.type === 'remove') as PendingVenueRemove[];
      for (const remove of venueRemoves) {
        try {
          await scheduleAvailableVenueService.delete(remove.venueId);
          console.log('会場削除を保存:', remove.venueId);
        } catch (error) {
          const errorMessage = `会場(${remove.venueId})の削除に失敗: ${error instanceof Error ? error.message : '不明なエラー'}`;
          errors.push(errorMessage);
          console.error(errorMessage);
        }
      }

      // 追加を処理
      const venueAdds = pendingVenueChanges.filter(c => c.type === 'add') as PendingVenueAdd[];
      if (venueAdds.length > 0) {
        try {
          const bulkData = {
            schedule_id: scheduleId,
            venues: venueAdds.map(add => ({
              venue_id: add.venue.venue_id, // 元の会場マスターID
              is_preferred: add.venue.is_preferred || false,
              priority: add.venue.priority || 0,
              notes: add.venue.notes || '',
            })),
          };
          await scheduleAvailableVenueService.createBulk(bulkData);
          console.log('会場追加を保存:', venueAdds);
        } catch (error) {
          const errorMessage = `会場の追加に失敗: ${error instanceof Error ? error.message : '不明なエラー'}`;
          errors.push(errorMessage);
          console.error(errorMessage);
        }
      }

      // 3. セッションの移動を保存
      for (const move of pendingSessionMoves) {
        try {
          await sessionService.moveSession(move.sessionId, move.venueId, move.slotOrder);
          console.log('セッション移動を保存:', move);
        } catch (error) {
          const errorMessage = `セッション(${move.sessionId})の移動に失敗: ${error instanceof Error ? error.message : '不明なエラー'}`;
          errors.push(errorMessage);
          console.error(errorMessage);
        }
      }

      // 4. インストラクターの移動を保存
      for (const move of pendingInstructorMoves) {
        try {
          await sessionInstructorService.moveSessionInstructor(move.instructorId, move.venueId, move.slotOrder);
          console.log('インストラクター移動を保存:', move);
        } catch (error) {
          const errorMessage = `インストラクター(${move.instructorId})の移動に失敗: ${error instanceof Error ? error.message : '不明なエラー'}`;
          errors.push(errorMessage);
          console.error(errorMessage);
        }
      }

      // 5. タイムスロットの時刻編集を保存
      for (const edit of pendingTimeSlotTimeEdits) {
        try {
          await scheduleTimeSlotService.updateTimeSlot(edit.timeSlotId, {
            start_time: edit.startTime,
            end_time: edit.endTime,
          });
          console.log('タイムスロット時刻編集を保存:', edit);
        } catch (error) {
          const errorMessage = `タイムスロット(${edit.timeSlotId})の時刻編集に失敗: ${error instanceof Error ? error.message : '不明なエラー'}`;
          errors.push(errorMessage);
          console.error(errorMessage);
        }
      }

      if (errors.length === 0) {
        // すべて成功した場合は未保存の変更をクリア
        setPendingSessionMoves([]);
        setPendingInstructorMoves([]);
        setPendingVenueChanges([]);
        setPendingTimeSlotChange(null);
        setPendingTimeSlotTimeEdits([]);

        // 最新の状態を取得して初期状態を更新
        await fetchScheduleDetails();

        return { success: true, errors: [] };
      } else {
        // 一部失敗した場合
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
  }, [hasUnsavedChanges, pendingSessionMoves, pendingInstructorMoves, pendingVenueChanges, pendingTimeSlotChange, pendingTimeSlotTimeEdits, scheduleId, fetchScheduleDetails]);

  /**
   * 変更を破棄して元に戻す
   */
  const discardChanges = useCallback(() => {
    if (!hasUnsavedChanges) {
      console.log('破棄する変更がありません');
      return;
    }

    // 初期状態に戻す
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

    // 未保存の変更をクリア
    setPendingSessionMoves([]);
    setPendingInstructorMoves([]);
    setPendingVenueChanges([]);
    setPendingTimeSlotChange(null);
    setPendingTimeSlotTimeEdits([]);

    console.log('変更を破棄しました');
  }, [hasUnsavedChanges]);

  // 初期化
  useEffect(() => {
    console.log(`useSessionEditor初期化: scheduleId="${scheduleId}", length=${scheduleId?.length}, trim="${scheduleId?.trim()}"`);
    
    // スケジュールIDが空の場合は何もしない
    if (!scheduleId || scheduleId.trim() === '') {
      console.log('スケジュールIDが空のため、useSessionEditorは何もしません');
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    
    console.log(`スケジュール詳細を取得開始: scheduleId=${scheduleId}`);
    fetchScheduleDetails();
  }, [scheduleId]);

  // 未保存の変更数を計算
  const pendingChangesCount =
    pendingSessionMoves.length +
    pendingInstructorMoves.length +
    pendingVenueChanges.length +
    (pendingTimeSlotChange ? 1 : 0) +
    pendingTimeSlotTimeEdits.length;

  return {
    ...state,
    parts,
    fetchScheduleDetails,
    createSession,
    updateSession,
    deleteSession,
    moveSession,
    moveInstructor,
    selectSession,
    openModal,
    closeModal,
    toggleEditMode,
    updateTimeSlot,
    addVenues,
    removeVenue,
    updateVenue,
    // タイムスロット追加・削除（ローカル処理）
    addTimeSlot,
    removeTimeSlot,
    // 一括保存関連
    hasUnsavedChanges,
    isSaving,
    saveAllChanges,
    discardChanges,
    pendingChangesCount,
  };
};
