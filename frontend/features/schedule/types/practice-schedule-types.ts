/**
 * 練習スケジュール関連の型定義
 */

import { Attendance } from './attendance';

/**
 * 練習スケジュールの基本情報
 */
export interface PracticeSchedule {
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
}

/**
 * 会場表示用情報
 */
export interface VenueDisplayInfo {
  id: string;
  name: string;
  is_preferred: boolean;
  priority: number;
  notes?: string;
}

/**
 * 指導者表示用情報
 */
export interface InstructorDisplayInfo {
  id: string;
  name: string;
  email?: string;
}

/**
 * セッション指導者の基本情報（APIレスポンス用）
 */
export interface SessionInstructor {
  id: string;
  attendance_id: string;
  schedule_id: string;
  schedule_available_venue_id?: string;
  slot_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * セッション指導者の詳細情報（APIレスポンス用）
 */
export interface SessionInstructorWithDetails extends SessionInstructor {
  // 出席者情報
  user_name?: string; // 漢字の姓と名が組み合わされた値（例: "田中 太郎"）
  user_email?: string;
  attendance_status?: string;
  
  // スケジュール情報
  schedule_date?: string;
  schedule_title?: string;
  schedule_start_time?: string;
  schedule_end_time?: string;
  
  // 会場情報
  venue_name?: string;
  venue_address?: string;
  
  // パート情報
  part_name?: string;
}

/**
 * セッション指導者作成用データ
 */
export interface SessionInstructorCreate {
  attendance_id: string;
  schedule_id: string;
  schedule_available_venue_id?: string;
  slot_order: number;
}

/**
 * セッション指導者一括作成用データ
 */
export interface SessionInstructorBulkCreate {
  schedule_id: string;
  schedule_available_venue_id?: string;
  slot_order: number;
  attendance_ids: string[];
}

/**
 * セッション指導者一括作成レスポンス
 */
export interface SessionInstructorBulkResponse {
  created_count: number;
  created_items: SessionInstructor[];
  errors: string[];
}

/**
 * セッション表示用情報
 */
export interface SessionDisplayInfo {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  part_name?: string;
  venue_name?: string;
  priority: number;
  instructors: InstructorDisplayInfo[];
}

/**
 * 練習表表示用レスポンス
 */
export interface PracticeScheduleDisplayResponse {
  id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  title?: string;
  description?: string;
  schedule_type?: string;
  status?: string;
  available_venues: VenueDisplayInfo[];
  sessions: SessionDisplayInfo[];
}

/**
 * 詳細API用の会場情報
 */
export interface VenueDetailsInfo {
  id: string;
  schedule_id: string;
  venue_id: string;
  is_preferred: boolean;
  priority: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 詳細API用の指導者情報
 */
export interface InstructorDetailsInfo {
  id: string;
  session_id: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 詳細API用のセッション情報
 */
export interface SessionDetailsInfo {
  id: string;
  schedule_id: string;
  part_id: string;
  title: string;
  start_time: string;
  end_time: string;
  schedule_available_venues?: string;
  priority: number;
  created_at?: string;
  updated_at?: string;
  instructors: InstructorDetailsInfo[];
}

/**
 * 練習スケジュール詳細レスポンス（/details API用）
 */
export interface PracticeScheduleWithDetailsResponse {
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
  created_by?: string;
  updated_by?: string;
  available_venues: VenueDetailsInfo[];
  sessions: SessionDetailsInfo[];
}

/**
 * スケジュールテーブル用のアイテム（時間スロット）
 */
export interface ScheduleItem {
  time: string;
  duration?: string;
  activity: string;
}

/**
 * テーブル構造用の時間スロット
 */
export interface TimeSlot {
  time: string;
  startTime: string;
  endTime: string;
}

/**
 * テーブル構造用の会場情報
 */
export interface VenueTableInfo {
  id: string;
  venue_id: string;
  name: string;
  is_preferred: boolean;
  priority: number;
  notes?: string;
}

/**
 * テーブルセル用のセッション情報
 */
export interface TableCellSession {
  id: string;
  title: string;
  part_id: string;
  instructors: InstructorDetailsInfo[];
}

/**
 * スケジュールテーブル用のデータ構造
 */
export interface ScheduleTableData {
  timeSlots: TimeSlot[];
  venues: VenueTableInfo[];
  cells: Record<string, Record<string, TableCellSession[]>>; // [venue_id][time] = sessions[]
}

/**
 * 理想的なスケジュール構造用の型定義
 */
export interface IdealScheduleInfo {
  id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  title?: string;
  description: string;
}

export interface IdealVenue {
  id: string;
  name: string;
  priority: number;
  color: string;
}

export interface AbsentMember {
  user_id: string;
  name: string;
  status: 'absent' | 'late' | 'no_show';
  notes?: string;
  attendance_id: string;
}

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
  absent_members?: AbsentMember[];
}

export interface IdealScheduleData {
  schedule_info: IdealScheduleInfo;
  venues: IdealVenue[];
  time_schedule: Record<string, Record<string, IdealPartInfo[]>>; // [time][venue_id] = parts[]
  debug_info?: {
    sessions_count: number;
    sessions_data: any[];
    venues_count: number;
    division_count: number;
    session_processing_details: any[];
    fetch_logs?: string[];
  };
}

/**
 * 日付ナビゲーション用のプロパティ
 */
export interface DateNavigationProps {
  currentDate: Date;
  onDateChange: (direction: 'prev' | 'next') => void;
  onNextPractice?: (direction: 'prev' | 'next') => void;
}

/**
 * Information コンポーネント用のプロパティ
 */
export interface InformationProps {
  className?: string;
  currentDate?: Date;
}

/**
 * bundle API 用の会場情報
 */
export interface BundleVenueInfo {
  id?: string;
  venue_id?: string;
  name: string;
  color?: string;
  is_preferred?: boolean;
  priority?: number;
  campus?: string;
}

export interface PracticeScheduleBundleSchedule {
  id: string;
  schedule_date: string;
  start_time?: string;
  end_time?: string;
  title?: string;
  description?: string;
  division_count?: number;
  venues: BundleVenueInfo[];
}

export interface PracticeScheduleBundleAttendance {
  entries: Attendance[];
  my_entry?: Attendance | null;
}

export interface PracticeScheduleBundleUser {
  id: string;
  name: string;
  email?: string;
}

export interface PracticeScheduleBundleMeta {
  generated_at: string;
  version: number;
}

export interface PracticeScheduleBundleResponse {
  schedule: PracticeScheduleBundleSchedule;
  ideal: IdealScheduleData | null;
  attendance: PracticeScheduleBundleAttendance;
  users: PracticeScheduleBundleUser[];
  meta: PracticeScheduleBundleMeta;
}
