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
      } catch (instructorError) {
        console.error('インストラクター情報の取得に失敗しました:', instructorError);
        dispatch({ type: 'SET_INSTRUCTORS', payload: [] });
      }

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
   * 楽観的UI更新: 即座にUIを更新し、API失敗時のみロールバック
   */
  const moveSession = useCallback(async (
    sessionId: string,
    venueId: string,
    timeSlot: string,
    slotOrder: number
  ) => {
    // 現在のセッション状態を保存（ロールバック用）
    const originalSession = state.sessions.find(s => s.id === sessionId);
    if (!originalSession) {
      console.error('移動対象のセッションが見つかりません:', sessionId);
      return;
    }

    dispatch({ type: 'SET_ERROR', payload: null });

    // API呼び出し
    try {
      const updatedSession = await sessionService.moveSession(sessionId, venueId, slotOrder);
      console.log('DEBUG moveSession: updatedSession =', updatedSession);
      
      // part_nameが失われている場合は元のセッションから復元
      const sessionWithPartName = {
        ...updatedSession,
        part_name: updatedSession.part_name || originalSession.part_name,
      };
      
      // API成功: サーバーの最新データで更新
      dispatch({ type: 'UPDATE_SESSION', payload: sessionWithPartName });
    } catch (error) {
      // API失敗: エラーメッセージを表示
      console.error('セッション移動API失敗:', error);

      const errorMessage = error instanceof Error ? error.message : 'セッションの移動に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });

      // エラー通知（アラート）
      alert(`❌ セッションの移動に失敗しました\n\n${errorMessage}`);
    }
  }, [state.sessions, state.time_slots]);

  /**
   * インストラクターを移動（ドラッグ&ドロップ用）
   */
  const moveInstructor = useCallback(async (
    instructorId: string,
    venueId: string,
    slotOrder: number
  ) => {
    // 現在のインストラクター状態を保存（ロールバック用）
    const originalInstructor = state.instructors.find(i => i.id === instructorId);
    if (!originalInstructor) {
      console.error('移動対象のインストラクターが見つかりません:', instructorId);
      return;
    }

    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      console.log('DEBUG moveInstructor: 移動前のインストラクター情報', originalInstructor);
      
      const updatedInstructor = await sessionInstructorService.moveSessionInstructor(
        instructorId,
        venueId,
        slotOrder
      );
      
      console.log('DEBUG moveInstructor: APIレスポンス', updatedInstructor);
      
      // APIレスポンスにuser_nameやuser_emailが含まれていない場合は元の情報をマージ
      const mergedInstructor = {
        ...updatedInstructor,
        user_name: (updatedInstructor as any).user_name || (originalInstructor as any).user_name,
        user_email: (updatedInstructor as any).user_email || (originalInstructor as any).user_email,
      };
      
      console.log('DEBUG moveInstructor: マージ後のインストラクター情報', mergedInstructor);
      
      // API成功: サーバーの最新データで更新
      dispatch({ type: 'UPDATE_INSTRUCTOR', payload: mergedInstructor });
    } catch (error) {
      // API失敗: エラーメッセージを表示
      console.error('インストラクター移動API失敗:', error);

      const errorMessage = error instanceof Error ? error.message : 'インストラクターの移動に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });

      // エラー通知（アラート）
      alert(`❌ インストラクターの移動に失敗しました\n\n${errorMessage}`);
    }
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
   * 時間スロットを更新
   */
  const updateTimeSlot = useCallback((updatedTimeSlot: TimeSlot) => {
    dispatch({ type: 'UPDATE_TIME_SLOT', payload: updatedTimeSlot });

    if (!updatedTimeSlot.id) {
      console.warn('時間スロットIDが存在しないため、API更新をスキップします');
      return;
    }

    const normalizeTime = (value: string) => (value && value.length === 5 ? `${value}:00` : value);

    scheduleTimeSlotService
      .updateTimeSlot(updatedTimeSlot.id, {
        start_time: normalizeTime(updatedTimeSlot.start_time),
        end_time: normalizeTime(updatedTimeSlot.end_time),
      })
      .then(() => fetchScheduleDetails())
      .catch((error) => {
        console.error('時間スロットの更新に失敗しました:', error);
      });
  }, [fetchScheduleDetails]);

  /**
   * 会場を追加
   * APIを呼び出してデータベースに保存し、成功したら状態を更新
   */
  const addVenues = useCallback(async (venues: VenueInfo[]) => {
    if (!scheduleId || scheduleId.trim() === '') {
      console.error('addVenues: スケジュールIDが空です');
      return;
    }

    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // 一括作成APIを呼び出し
      const bulkData = {
        schedule_id: scheduleId,
        venues: venues.map(venue => ({
          venue_id: venue.id,
          is_preferred: venue.is_preferred || false,
          priority: venue.priority || 0,
          notes: venue.notes || '',
        })),
      };

      console.log('addVenues: 会場追加開始', bulkData);

      const result = await scheduleAvailableVenueService.createBulk(bulkData);

      console.log('addVenues: 会場追加成功', result);

      // 作成されたアイテムを状態に追加
      // APIレスポンスから新しいIDを取得して会場情報を更新
      const newVenues: VenueInfo[] = result.created_items.map(item => ({
        id: item.id, // schedule_available_venue.id を使用
        venue_id: item.venue_id, // 元の会場マスターIDを保持
        name: venues.find(v => v.id === item.venue_id)?.name || '',
        campus: venues.find(v => v.id === item.venue_id)?.campus,
        is_preferred: item.is_preferred,
        priority: item.priority,
        notes: item.notes || '',
      }));

      dispatch({ type: 'ADD_VENUES', payload: newVenues });

      if (result.errors.length > 0) {
        console.warn('addVenues: 一部の会場追加に失敗', result.errors);
      }
    } catch (error) {
      console.error('addVenues: エラー', error);
      const errorMessage = error instanceof Error ? error.message : '会場の追加に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      alert(`❌ 会場の追加に失敗しました\n\n${errorMessage}`);
    }
  }, [scheduleId]);

  /**
   * 会場を削除
   * APIを呼び出してデータベースから削除し、成功したら状態を更新
   */
  const removeVenue = useCallback(async (venueId: string) => {
    // 現在の会場情報を保存（ロールバック用）
    const originalVenue = state.venues.find(v => v.id === venueId);
    if (!originalVenue) {
      console.error('removeVenue: 削除対象の会場が見つかりません:', venueId);
      return;
    }

    dispatch({ type: 'SET_ERROR', payload: null });

    // 楽観的UI更新: 即座にUIから削除
    dispatch({ type: 'REMOVE_VENUE', payload: venueId });

    try {
      // venueIdはschedule_available_venue.idなので、そのまま削除APIを呼び出す
      console.log('removeVenue: 会場削除開始', venueId);

      await scheduleAvailableVenueService.delete(venueId);

      console.log('removeVenue: 会場削除成功', venueId);
    } catch (error) {
      // API失敗: 会場を復元
      console.error('removeVenue: エラー', error);
      dispatch({ type: 'ADD_VENUES', payload: [originalVenue] });

      const errorMessage = error instanceof Error ? error.message : '会場の削除に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      alert(`❌ 会場の削除に失敗しました\n\n${errorMessage}\n\n会場を復元しました。`);
    }
  }, [state.venues]);

  /**
   * 会場を更新
   */
  const updateVenue = useCallback((venueId: string, venue: VenueInfo) => {
    dispatch({ type: 'UPDATE_VENUE', payload: venue });
  }, []);

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
  };
};
