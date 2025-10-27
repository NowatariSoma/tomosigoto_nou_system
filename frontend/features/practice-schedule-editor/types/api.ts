/**
 * API関連の型定義
 */

/**
 * APIエラー
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

/**
 * セッションAPIレスポンス
 */
export interface SessionApiResponse {
  id: string;
  schedule_id: string;
  part_id?: string;
  part_name?: string; // パート名
  slot_order: number;
  schedule_available_venue_id?: string;
  priority: number;
  start_time?: string;
  end_time?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * セッション作成APIリクエスト
 */
export interface SessionApiCreateRequest {
  schedule_id: string;
  part_id?: string;
  slot_order: number;
  schedule_available_venue_id?: string;
  priority: number;
  start_time?: string;
  end_time?: string;
}

/**
 * セッション更新APIリクエスト
 */
export interface SessionApiUpdateRequest {
  part_id?: string;
  slot_order?: number;
  schedule_available_venue_id?: string;
  priority?: number;
  start_time?: string;
  end_time?: string;
}

/**
 * 会場APIレスポンス
 */
export interface VenueApiResponse {
  id: string;
  name: string;
  is_preferred: boolean;
  priority: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 練習スケジュール詳細APIレスポンス
 */
export interface PracticeScheduleDetailsApiResponse {
  id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  title?: string;
  description?: string;
  schedule_type?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  available_venues: VenueApiResponse[];
  sessions: SessionApiResponse[];
}

/**
 * Idealフォーマット用の会場情報
 */
export interface IdealVenueInfo {
  id: string;
  name: string;
  priority: number;
  color: string;
}

/**
 * Idealフォーマット用のパート情報
 */
export interface IdealPartInfo {
  part_id: string;
  part_name: string;
  part_color: string;
  session_title: string;
  instructors: string[];
  participants: number;
  status: string;
  slot_order?: number;
  schedule_available_venue_id?: string;
}

/**
 * Idealフォーマット用のスケジュール情報
 */
export interface IdealScheduleInfo {
  id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  title?: string;
  description: string;
}

/**
 * Idealフォーマット用のデバッグ情報
 */
export interface IdealDebugInfo {
  sessions_count: number;
  sessions_data: any[];
  venues_count: number;
  division_count: number;
  session_processing_details: any[];
  fetch_logs?: string[];
}

/**
 * IdealフォーマットのAPIレスポンス
 */
export interface IdealFormatApiResponse {
  schedule_info: IdealScheduleInfo;
  venues: IdealVenueInfo[];
  time_schedule: Record<string, Record<string, IdealPartInfo[]>>; // [time][venue_id] = parts[]
  debug_info?: IdealDebugInfo;
}
