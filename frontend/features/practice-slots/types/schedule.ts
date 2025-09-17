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
  description?: string;
  schedule_type?: string;
  status?: string;
  available_venues: VenueDisplayInfo[];
  sessions: SessionDisplayInfo[];
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
