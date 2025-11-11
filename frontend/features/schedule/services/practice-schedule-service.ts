/**
 * 練習スケジュールのAPIサービス
 * room-settingsパターンに合わせて統一的なAPIアプローチを採用
 */

import { PracticeScheduleDisplayResponse, PracticeScheduleWithDetailsResponse, IdealScheduleData } from '../types/practice-schedule-types';
import { ApiResponse } from '../types/api-types';
import { API_ENDPOINTS } from '../constants/practice-schedule-constants';
import { fetchApi } from '../../../lib/api';
import { PracticeSchedule } from '../types/attendance';

// practice-slots.tsから移行された型定義
export interface ScheduleItem {
  id?: string;
  practice_slot_id?: string;
  time: string;
  duration: string;
  activity: string;
  columns: string[];
  created_at?: string;
  updated_at?: string;
}

export interface PracticeSlot {
  id?: string;
  date: string;
  title?: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  schedule_items?: ScheduleItem[];
}

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

/**
 * 練習スケジュールAPIサービス
 */
export class PracticeScheduleService {
  private readonly basePath = API_ENDPOINTS.PRACTICE_SLOTS;
  private readonly calendarBasePath = '/practice_schedules/'; // カレンダー用のエンドポイント

  /**
   * 指定した練習スケジュールの詳細情報を取得
   * @param scheduleId - 練習スケジュールID
   * @returns 練習スケジュールの詳細情報
   */
  async getPracticeScheduleDetails(scheduleId: string): Promise<any> {
    const response = await fetchApi(`${this.basePath}/${scheduleId}/details`);
    return response.json();
  }

  /**
   * 指定した日付の練習スケジュールを取得
   * @param date - 対象日付 (YYYY-MM-DD形式)
   * @returns 練習スケジュール情報
   */
  async getPracticeScheduleByDate(date: string): Promise<PracticeScheduleDisplayResponse | null> {
    try {
      const response = await fetchApi(`${this.basePath}/date/${date}`);
      const data: PracticeScheduleDisplayResponse = await response.json();
      return data;
    } catch (error: any) {
      if (error.status === 404) {
        return null; // スケジュールが存在しない場合
      }
      throw error;
    }
  }

  // getPracticeScheduleDetailsByDate メソッドは削除 - idealエンドポイントを使用

  /**
   * 指定した日付の練習スケジュール表示用情報を取得
   * @param date - 対象日付 (YYYY-MM-DD形式)
   * @returns 練習スケジュールの表示用情報
   */
  async getPracticeScheduleDisplayByDate(date: string): Promise<PracticeScheduleDisplayResponse | null> {
    // まず基本情報を取得してスケジュールIDを取得
    const basicSchedule = await this.getPracticeScheduleByDate(date);
    if (!basicSchedule) {
      return null;
    }
    
    // スケジュールIDを使って表示用情報を取得
    const response = await fetchApi(`${this.basePath}/${basicSchedule.id}/display`);
    const data: PracticeScheduleDisplayResponse = await response.json();
    return data;
  }

  /**
   * 理想的な形式の練習スケジュール情報を取得
   * @param date - 対象日付 (YYYY-MM-DD形式)
   * @returns 理想的な形式の練習スケジュール情報
   */
  async getPracticeScheduleIdealFormat(date: string): Promise<IdealScheduleData | null> {
    try {
      const response = await fetchApi(`${this.basePath}/date/${date}/ideal`);
      const data: IdealScheduleData = await response.json();
      return data;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * すべての練習スケジュールを取得
   * @returns 練習スケジュールの一覧
   */
  async getAllPracticeSchedules(): Promise<PracticeScheduleDisplayResponse[]> {
    const response = await fetchApi(`${this.basePath}/`);
    const data: PracticeScheduleDisplayResponse[] = await response.json();
    return data;
  }

  /**
   * 指定した日付以降の次の練習日程を取得
   * @param currentDate - 現在の日付 (YYYY-MM-DD形式)
   * @returns 次の練習日程の日付、見つからない場合はnull
   */
  async getNextPracticeScheduleDate(currentDate: string): Promise<string | null> {
    try {
      const allSchedules = await this.getAllPracticeSchedules();
      
      // 現在の日付より後の練習日程をフィルタリング
      const futureSchedules = allSchedules
        .filter(schedule => schedule.schedule_date > currentDate)
        .sort((a, b) => a.schedule_date.localeCompare(b.schedule_date));
      
      // 最初の練習日程を返す
      return futureSchedules.length > 0 ? futureSchedules[0].schedule_date : null;
    } catch (error) {
      console.error('次の練習日程の取得に失敗しました:', error);
      return null;
    }
  }

  /**
   * 指定した日付以前の前の練習日程を取得
   * @param currentDate - 現在の日付 (YYYY-MM-DD形式)
   * @returns 前の練習日程の日付、見つからない場合はnull
   */
  async getPreviousPracticeScheduleDate(currentDate: string): Promise<string | null> {
    try {
      const allSchedules = await this.getAllPracticeSchedules();
      
      // 現在の日付より前の練習日程をフィルタリング
      const pastSchedules = allSchedules
        .filter(schedule => schedule.schedule_date < currentDate)
        .sort((a, b) => b.schedule_date.localeCompare(a.schedule_date)); // 降順でソート
      
      // 最初の練習日程を返す
      return pastSchedules.length > 0 ? pastSchedules[0].schedule_date : null;
    } catch (error) {
      console.error('前の練習日程の取得に失敗しました:', error);
      return null;
    }
  }

  // ===== practice-slots.tsから統合されたメソッド =====

  /**
   * 指定した日付のPracticeSlotを取得 (practice-slots.ts互換)
   * @param targetDate - 対象日付 (YYYY-MM-DD形式)
   * @returns PracticeSlot情報
   */
  async getPracticeSlotByDate(targetDate: string): Promise<ApiResponse<PracticeSlot>> {
    const response = await fetchApi(`${this.basePath}/date/${targetDate}`);
    return response.json();
  }

  /**
   * サンプルデータ付きでPracticeSlotを作成 (practice-slots.ts互換)
   * @param targetDate - 対象日付
   * @returns 作成されたPracticeSlot
   */
  async createPracticeSlotWithSampleData(targetDate: string): Promise<ApiResponse<PracticeSlot>> {
    const response = await fetchApi(`${this.basePath}/with-sample-data?target_date=${targetDate}`, {
      method: 'POST',
    });
    return response.json();
  }

  // ===== カレンダー表示用メソッド（attendanceフォルダから移行） =====

  /**
   * 指定した練習スケジュールIDの詳細を取得
   * @param id - 練習スケジュールID
   * @returns 練習スケジュール情報
   */
  async getPracticeSchedule(id: string): Promise<PracticeSchedule> {
    const response = await fetchApi(`${this.calendarBasePath}${id}`);
    return await response.json();
  }

  /**
   * すべての練習スケジュールを取得（attendanceフォルダ互換）
   * @returns 練習スケジュール一覧
   */
  async getPracticeSchedules(): Promise<PracticeSchedule[]> {
    const response = await fetchApi(this.calendarBasePath);
    const data = await response.json();
    return data || [];
  }

  /**
   * 今後の練習スケジュールを取得
   * @returns 今後の練習スケジュール一覧
   */
  async getUpcomingPracticeSchedules(): Promise<PracticeSchedule[]> {
    const response = await fetchApi(`${this.calendarBasePath}upcoming`);
    const data = await response.json();
    return data || [];
  }

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
    const response = await fetchApi(`${this.calendarBasePath}calendar/month/${year}/${month}`);
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
      `${this.calendarBasePath}calendar/range?start_date=${startDate}&end_date=${endDate}`
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

// room-settingsパターンに合わせてインスタンスをエクスポート
export const practiceScheduleService = new PracticeScheduleService();
