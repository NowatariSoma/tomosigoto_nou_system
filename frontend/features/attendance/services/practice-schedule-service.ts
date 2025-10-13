import { PracticeSchedule } from '../types';
import { API_ENDPOINTS } from '../constants';
import { fetchApi } from '../../../lib/api';

// カレンダー表示用の型定義
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  description?: string;
  schedule_type: string;
  status: string;
  venues: string[];
  session_count: number;
  division_count: number;
  color: string;
  is_all_day: boolean;
  category: string;
}

export interface MonthCalendarResponse {
  year: number;
  month: number;
  events: CalendarEvent[];
  total_count: number;
}

export interface DateRangeCalendarResponse {
  start_date: string;
  end_date: string;
  events: CalendarEvent[];
  total_count: number;
}

export class PracticeScheduleService {
  private readonly basePath = API_ENDPOINTS.PRACTICE_SCHEDULES;

  async getPracticeSchedule(id: string): Promise<PracticeSchedule> {
    const response = await fetchApi(`${this.basePath}${id}`);
    return await response.json();
  }

  async getPracticeSchedules(): Promise<PracticeSchedule[]> {
    const response = await fetchApi(this.basePath);
    const data = await response.json();
    return data || [];
  }

  async getUpcomingPracticeSchedules(): Promise<PracticeSchedule[]> {
    const response = await fetchApi(`${this.basePath}upcoming`);
    const data = await response.json();
    return data || [];
  }

  // ===== Monthカレンダー表示用メソッド =====

  /**
   * 指定月のカレンダー表示用練習スケジュール一覧を取得
   * @param year 年 (例: 2024)
   * @param month 月 (1-12)
   * @returns 指定月の練習スケジュール一覧
   */
  async getPracticeSchedulesForMonthCalendar(
    year: number,
    month: number
  ): Promise<MonthCalendarResponse> {
    const response = await fetchApi(`${this.basePath}calendar/month/${year}/${month}`);
    return await response.json();
  }

  /**
   * 指定した日付範囲のカレンダー表示用練習スケジュール一覧を取得
   * @param startDate 開始日 (YYYY-MM-DD形式)
   * @param endDate 終了日 (YYYY-MM-DD形式)
   * @returns 指定範囲の練習スケジュール一覧
   */
  async getPracticeSchedulesForDateRange(
    startDate: string,
    endDate: string
  ): Promise<DateRangeCalendarResponse> {
    const response = await fetchApi(
      `${this.basePath}calendar/range?start_date=${startDate}&end_date=${endDate}`
    );
    return await response.json();
  }

  /**
   * 現在月のカレンダー表示用練習スケジュール一覧を取得
   * @returns 現在月の練習スケジュール一覧
   */
  async getCurrentMonthPracticeSchedules(): Promise<MonthCalendarResponse> {
    const now = new Date();
    return this.getPracticeSchedulesForMonthCalendar(
      now.getFullYear(),
      now.getMonth() + 1
    );
  }

  /**
   * カレンダーイベントをスケジューラー用のEvent形式に変換
   * @param calendarEvent カレンダーイベント
   * @returns スケジューラー用のEvent
   */
  convertCalendarEventToSchedulerEvent(calendarEvent: CalendarEvent): any {
    const startDateTime = new Date(`${calendarEvent.date}T${calendarEvent.start_time}`);
    const endDateTime = new Date(`${calendarEvent.date}T${calendarEvent.end_time}`);

    return {
      id: calendarEvent.id,
      title: calendarEvent.title,
      startDate: startDateTime,
      endDate: endDateTime,
      variant: this.getEventVariant(calendarEvent.schedule_type),
      description: calendarEvent.description || '',
      metadata: {
        venues: calendarEvent.venues,
        sessionCount: calendarEvent.session_count,
        divisionCount: calendarEvent.division_count,
        scheduleType: calendarEvent.schedule_type,
        status: calendarEvent.status,
      },
    };
  }

  /**
   * スケジュールタイプに基づいてイベントのバリアントを決定
   * @param scheduleType スケジュールタイプ
   * @returns イベントバリアント
   */
  private getEventVariant(scheduleType: string): string {
    const variantMap: Record<string, string> = {
      regular: 'primary',
      special: 'success',
      event: 'warning',
      competition: 'danger',
      rehearsal: 'info',
      meeting: 'secondary',
    };
    return variantMap[scheduleType] || 'primary';
  }
}

export const practiceScheduleService = new PracticeScheduleService();
