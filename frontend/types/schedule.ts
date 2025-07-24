/**
 * スケジュール関連の型定義
 */

// スケジュールデータの基本型
export interface Schedule {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  partId?: number;
  partName?: string;
  location?: string;
  description?: string;
  color?: string;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
}

// 繰り返しパターンの型
export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number; // 間隔（例：2週間おきなら2）
  endDate?: Date;
  daysOfWeek?: number[]; // 曜日指定（0:日曜日 〜 6:土曜日）
}

// パート情報の型
export interface Part {
  id: number;
  name: string;
  color: string;
  description?: string;
}

// カレンダービューの表示モード
export type CalendarViewMode = 'month' | 'week';

// 日付範囲の型
export interface DateRange {
  start: Date;
  end: Date;
}

// カレンダーセルのデータ型
export interface CalendarCellData {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  schedules: Schedule[];
}

// 週間カレンダーの時間スロット型
export interface TimeSlot {
  hour: number;
  minute: number;
  displayTime: string;
}

// セッション表示ブロックの型
export interface SessionBlock {
  schedule: Schedule;
  top: number; // CSS position top (%)
  height: number; // CSS height (%)
  left: number; // CSS position left (%)
  width: number; // CSS width (%)
  zIndex: number;
}

// カレンダーナビゲーションの状態型
export interface CalendarNavigationState {
  currentDate: Date;
  viewMode: CalendarViewMode;
  selectedRange: DateRange;
}

// API応答型
export interface ScheduleApiResponse {
  schedules: Schedule[];
  totalCount: number;
  hasMore: boolean;
}

// カレンダーデータ取得のパラメータ型
export interface CalendarDataParams {
  dateRange: DateRange;
  partId?: number;
  viewMode?: CalendarViewMode;
}

// エラーハンドリング用の型
export interface CalendarError {
  code: string;
  message: string;
  details?: any;
}