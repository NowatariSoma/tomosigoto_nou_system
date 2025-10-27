/**
 * セッション編集関連の型定義
 */

/**
 * セッションの基本情報
 */
export interface Session {
  id: string;
  schedule_id: string;
  part_id?: string;
  part_name?: string; // パート名
  slot_order: number;
  schedule_available_venue_id?: string;
  priority: number;
  start_time?: string; // セッションの開始時間
  end_time?: string;   // セッションの終了時間
  created_at?: string;
  updated_at?: string;
}

/**
 * セッション作成用のリクエスト
 */
export interface CreateSessionRequest {
  schedule_id: string;
  part_id?: string;
  slot_order: number;
  venue_id?: string;
  schedule_available_venue_id?: string;
  priority: number;
  start_time?: string;
  end_time?: string;
}

/**
 * セッション更新用のリクエスト
 */
export interface UpdateSessionRequest {
  part_id?: string;
  slot_order?: number;
  schedule_available_venue_id?: string;
  priority?: number;
  start_time?: string;
  end_time?: string;
}

/**
 * セッション編集用のフォームデータ
 */
export interface SessionFormData {
  part_id: string;
  instructor_id: string; // 単一選択用に変更
  venue_id: string;
  time_slot: string;
  priority: number;
  notes: string;
  start_time?: string;
  end_time?: string;
}

/**
 * 出席者情報（インストラクター選択用）
 */
export interface AttendanceInfo {
  id: string;
  user_id: string;
  user_name: string;
  user_email?: string;
  practice_schedule_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * 時間スロット情報
 */
export interface TimeSlot {
  time: string;
  start_time: string;
  end_time: string;
  display_time: string;
}

/**
 * 会場情報（編集用）
 */
export interface VenueInfo {
  id: string;
  name: string;
  is_preferred: boolean;
  priority: number;
  notes?: string;
}

/**
 * 指導者情報
 */
export interface InstructorInfo {
  id: string;
  name: string;
  email?: string;
}

/**
 * セッション表示用情報（テーブル用）
 */
export interface SessionDisplayInfo {
  id: string;
  title: string;
  part_name?: string;
  instructor_names: string[];
  venue_name?: string;
  time_slot: string;
  priority: number;
  notes?: string;
}

/**
 * テーブルセル情報
 */
export interface TableCell {
  venue_id: string;
  time_slot: string;
  sessions: SessionDisplayInfo[];
}

/**
 * 編集モードの状態
 */
export type EditMode = 'view' | 'edit';

/**
 * セッション編集の状態
 */
export interface SessionEditorState {
  sessions: Session[];
  venues: VenueInfo[];
  time_slots: TimeSlot[];
  selected_session: Session | null;
  is_modal_open: boolean;
  edit_mode: EditMode;
  loading: boolean;
  error: string | null;
}

/**
 * セッション編集のアクション
 */
export type SessionEditorAction =
  | { type: 'SET_SESSIONS'; payload: Session[] }
  | { type: 'SET_VENUES'; payload: VenueInfo[] }
  | { type: 'SET_TIME_SLOTS'; payload: TimeSlot[] }
  | { type: 'UPDATE_TIME_SLOT'; payload: TimeSlot }
  | { type: 'SELECT_SESSION'; payload: Session | null }
  | { type: 'OPEN_MODAL' }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_EDIT_MODE'; payload: EditMode }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_SESSION'; payload: Session }
  | { type: 'UPDATE_SESSION'; payload: Session }
  | { type: 'DELETE_SESSION'; payload: string };
