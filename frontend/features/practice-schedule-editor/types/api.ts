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
  title: string;
  slot_order: number;
  schedule_available_venue_id?: string;
  priority: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * セッション作成APIリクエスト
 */
export interface SessionApiCreateRequest {
  schedule_id: string;
  part_id?: string;
  title: string;
  slot_order: number;
  schedule_available_venue_id?: string;
  priority: number;
}

/**
 * セッション更新APIリクエスト
 */
export interface SessionApiUpdateRequest {
  part_id?: string;
  title?: string;
  slot_order?: number;
  schedule_available_venue_id?: string;
  priority?: number;
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
