/**
 * 練習スケジュール関連の型定義
 */

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

export interface IdealPartInfo {
  part_id: string;
  part_name: string;
  part_color: string;
  session_title: string;
  instructors: string[];
  participants: number;
  status: string;
}

export interface IdealScheduleData {
  schedule_info: IdealScheduleInfo;
  venues: IdealVenue[];
  time_schedule: Record<string, Record<string, IdealPartInfo[]>>; // [time][venue_id] = parts[]
}

/**
 * 日付ナビゲーション用のプロパティ
 */
export interface DateNavigationProps {
  currentDate: Date;
  onDateChange: (direction: 'prev' | 'next') => void;
}

/**
 * Information コンポーネント用のプロパティ
 */
export interface InformationProps {
  className?: string;
  currentDate?: Date;
}
